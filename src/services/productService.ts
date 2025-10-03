import { DatabaseService } from './databaseService.js';
import { Product, CreateProductRequest, UpdateProductRequest, ProductListResponse } from '../models/Product.js';
import { ProductRegistryService, OnChainProduct } from './productRegistryService.js';
import { IPFSStorageService } from './storage/IPFSStorageService.js';
import { ProductMetadata } from './storage/IStorageService.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

/**
 * ProductService - Blockchain-first architecture
 *
 * Data flow:
 * 1. Query ProductRegistry smart contract (source of truth)
 * 2. Fetch metadata from IPFS
 * 3. Cache in SQLite for performance
 * 4. Serve from cache with TTL-based invalidation
 */
export class ProductService {
  private db = DatabaseService.getInstance().getDatabase();
  private registry = new ProductRegistryService();
  private ipfs = new IPFSStorageService();
  private cacheTTL = 300; // 5 minutes cache TTL (in seconds)

  /**
   * Get products list - Uses cache with optional blockchain refresh
   *
   * For now, serves from cache for performance.
   * Use refreshProductsFromBlockchain() to sync cache with on-chain state.
   */
  async getProducts(options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    isActive?: boolean;
    sellerWalletAddress?: string;
  } = {}): Promise<ProductListResponse> {
    const { page = 1, limit = 20, categoryId, search, isActive = true, sellerWalletAddress } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (isActive !== undefined) {
      whereClause += ' AND p.is_active = ?';
      params.push(isActive ? 1 : 0);
    }

    if (categoryId) {
      whereClause += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (sellerWalletAddress) {
      whereClause += ' AND p.seller_wallet_address = ?';
      params.push(sellerWalletAddress);
    }

    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    const countResult = this.db.prepare(countQuery).get(...params) as { total: number };

    const productsQuery = `
      SELECT
        p.id,
        p.on_chain_id as onChainId,
        p.title,
        p.description,
        p.price_hollar as priceHollar,
        p.category_id as categoryId,
        p.images,
        p.seller_wallet_address as sellerWalletAddress,
        p.store_id as storeId,
        p.ipfs_metadata_hash as ipfsMetadataHash,
        p.blockchain_verified as blockchainVerified,
        p.registry_tx_hash as registryTxHash,
        p.block_number as blockNumber,
        p.digital_delivery_type as digitalDeliveryType,
        p.digital_delivery_instructions as digitalDeliveryInstructions,
        p.variants,
        p.tags,
        p.views,
        p.purchases,
        p.is_active as isActive,
        p.created_at as createdAt,
        p.updated_at as updatedAt
      FROM products p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const products = this.db.prepare(productsQuery).all(...params, limit, offset) as any[];

    return {
      products: products.map(this.mapRowToProduct),
      total: countResult.total,
      page,
      limit,
      hasMore: offset + products.length < countResult.total
    };
  }

  /**
   * Refresh all products from blockchain (indexer sync)
   *
   * Queries all active products from ProductRegistry and updates cache
   */
  async refreshProductsFromBlockchain(): Promise<{ synced: number; errors: number }> {
    try {
      await this.registry.initialize();

      // Get all active product IDs from blockchain
      const productIds = await this.registry.getAllActiveProducts();

      logger.info('Syncing products from blockchain', { count: productIds.length });

      let synced = 0;
      let errors = 0;

      for (const onChainId of productIds) {
        try {
          const onChainProduct = await this.registry.getProduct(onChainId);
          const metadata = await this.ipfs.fetchProductMetadata(onChainProduct.ipfsMetadataHash);

          // Find or create local ID
          const existing = this.db.prepare('SELECT id FROM products WHERE on_chain_id = ?').get(onChainId) as { id: string } | undefined;
          const localId = existing?.id || uuidv4();

          const product = this.mergeBlockchainData(localId, onChainProduct, metadata);
          this.updateCache(product);

          synced++;
        } catch (error) {
          logger.warn('Failed to sync product', { onChainId, error });
          errors++;
        }
      }

      logger.info('Blockchain sync complete', { synced, errors });
      return { synced, errors };
    } catch (error) {
      logger.error('Failed to refresh products from blockchain', error);
      throw error;
    }
  }

  /**
   * Get product by ID - Blockchain-first with cache fallback
   *
   * Flow:
   * 1. Check cache (if fresh, return)
   * 2. Query blockchain (ProductRegistry contract)
   * 3. Fetch metadata from IPFS
   * 4. Update cache
   * 5. Return product
   */
  async getProductById(id: string, options: { forceRefresh?: boolean } = {}): Promise<Product | null> {
    // Try cache first (unless force refresh)
    if (!options.forceRefresh) {
      const cached = this.getFromCache(id);
      if (cached && this.isCacheFresh(cached.updatedAt)) {
        logger.debug('Product served from cache', { id });
        return cached;
      }
    }

    // Try to find on-chain ID from cache
    const cachedProduct = this.getFromCache(id);
    const onChainId = cachedProduct?.onChainId;

    if (!onChainId) {
      logger.debug('Product not found on-chain, serving from cache only', { id });
      return cachedProduct;
    }

    try {
      // Query blockchain as source of truth
      const onChainProduct = await this.registry.getProduct(onChainId);

      // Fetch full metadata from IPFS
      const metadata = await this.ipfs.fetchProductMetadata(onChainProduct.ipfsMetadataHash);

      // Merge on-chain + IPFS data
      const product = this.mergeBlockchainData(id, onChainProduct, metadata);

      // Update cache
      this.updateCache(product);

      logger.info('Product refreshed from blockchain', { id, onChainId });
      return product;
    } catch (error) {
      logger.warn('Failed to fetch from blockchain, using cache', { id, error });

      // Fallback to cache on blockchain error
      return cachedProduct;
    }
  }

  /**
   * Get product from cache only
   */
  private getFromCache(id: string): Product | null {
    const query = `
      SELECT
        p.id,
        p.on_chain_id as onChainId,
        p.title,
        p.description,
        p.price_hollar as priceHollar,
        p.category_id as categoryId,
        p.images,
        p.seller_wallet_address as sellerWalletAddress,
        p.store_id as storeId,
        p.ipfs_metadata_hash as ipfsMetadataHash,
        p.blockchain_verified as blockchainVerified,
        p.registry_tx_hash as registryTxHash,
        p.block_number as blockNumber,
        p.digital_delivery_type as digitalDeliveryType,
        p.digital_delivery_instructions as digitalDeliveryInstructions,
        p.variants,
        p.tags,
        p.views,
        p.purchases,
        p.is_active as isActive,
        p.created_at as createdAt,
        p.updated_at as updatedAt
      FROM products p
      WHERE p.id = ?
    `;

    const row = this.db.prepare(query).get(id);

    if (!row) {
      return null;
    }

    return this.mapRowToProduct(row);
  }

  /**
   * Check if cache is fresh (within TTL)
   */
  private isCacheFresh(updatedAt: string): boolean {
    const updated = new Date(updatedAt).getTime();
    const now = Date.now();
    const ageSeconds = (now - updated) / 1000;

    return ageSeconds < this.cacheTTL;
  }

  /**
   * Merge on-chain data with IPFS metadata
   */
  private mergeBlockchainData(
    localId: string,
    onChainProduct: OnChainProduct,
    metadata: ProductMetadata
  ): Product {
    // Validate delivery type
    const validDeliveryTypes = ['download', 'email', 'ipfs'];
    const deliveryType = validDeliveryTypes.includes(metadata.delivery_type)
      ? (metadata.delivery_type as 'download' | 'email' | 'ipfs')
      : undefined;

    return {
      id: localId,
      onChainId: onChainProduct.id,
      title: onChainProduct.name,
      description: metadata.description || '',
      priceHollar: Number(onChainProduct.priceHollar),
      categoryId: onChainProduct.category,
      images: metadata.images || [],
      sellerWalletAddress: onChainProduct.seller,
      ipfsMetadataHash: onChainProduct.ipfsMetadataHash,
      blockchainVerified: true,
      digitalDeliveryType: deliveryType,
      digitalDeliveryInstructions: metadata.delivery_instructions,
      variants: metadata.variants,
      tags: undefined, // Tags not in IPFS metadata schema yet
      isActive: onChainProduct.isActive,
      createdAt: new Date(Number(onChainProduct.createdAt) * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      purchases: 0
    };
  }

  /**
   * Update cache with fresh blockchain data
   */
  private updateCache(product: Product): void {
    const existing = this.getFromCache(product.id);

    if (existing) {
      // Update existing cache entry
      this.db.prepare(`
        UPDATE products SET
          title = ?,
          description = ?,
          price_hollar = ?,
          category_id = ?,
          images = ?,
          seller_wallet_address = ?,
          ipfs_metadata_hash = ?,
          blockchain_verified = 1,
          digital_delivery_type = ?,
          digital_delivery_instructions = ?,
          variants = ?,
          tags = ?,
          is_active = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        product.title,
        product.description,
        product.priceHollar,
        product.categoryId,
        JSON.stringify(product.images),
        product.sellerWalletAddress,
        product.ipfsMetadataHash,
        product.digitalDeliveryType || null,
        product.digitalDeliveryInstructions || null,
        product.variants ? JSON.stringify(product.variants) : null,
        product.tags ? JSON.stringify(product.tags) : null,
        product.isActive ? 1 : 0,
        product.updatedAt,
        product.id
      );
    } else {
      // Insert new cache entry
      this.db.prepare(`
        INSERT INTO products (
          id, on_chain_id, title, description, price_hollar, category_id,
          images, seller_wallet_address, ipfs_metadata_hash, blockchain_verified,
          digital_delivery_type, digital_delivery_instructions, variants, tags,
          is_active, created_at, updated_at, views, purchases
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 0, 0)
      `).run(
        product.id,
        product.onChainId || null,
        product.title,
        product.description,
        product.priceHollar,
        product.categoryId,
        JSON.stringify(product.images),
        product.sellerWalletAddress,
        product.ipfsMetadataHash,
        product.digitalDeliveryType || null,
        product.digitalDeliveryInstructions || null,
        product.variants ? JSON.stringify(product.variants) : null,
        product.tags ? JSON.stringify(product.tags) : null,
        product.isActive ? 1 : 0,
        product.createdAt,
        product.updatedAt
      );
    }
  }

  async createProduct(request: CreateProductRequest): Promise<Product> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const ipfsHash = request.ipfsMetadataHash || 'pending';

    const query = `
      INSERT INTO products (
        id,
        title,
        description,
        price_hollar,
        category_id,
        images,
        seller_wallet_address,
        store_id,
        ipfs_metadata_hash,
        blockchain_verified,
        digital_delivery_type,
        digital_delivery_instructions,
        variants,
        tags,
        views,
        purchases,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.prepare(query).run(
      id,
      request.title,
      request.description,
      request.priceHollar,
      request.categoryId,
      JSON.stringify(request.images || []),
      request.sellerWalletAddress,
      request.storeId || null,
      ipfsHash,
      0,
      request.digitalDeliveryType || null,
      request.digitalDeliveryInstructions || null,
      request.variants ? JSON.stringify(request.variants) : null,
      request.tags ? JSON.stringify(request.tags) : null,
      0,
      0,
      1,
      now,
      now
    );

    logger.info('Product created', { id, title: request.title });

    const product = await this.getProductById(id);
    if (!product) {
      throw new Error('Failed to retrieve created product');
    }

    return product;
  }

  async updateProduct(id: string, request: UpdateProductRequest): Promise<Product> {
    const updateFields: string[] = [];
    const params: any[] = [];

    if (request.title !== undefined) {
      updateFields.push('title = ?');
      params.push(request.title);
    }

    if (request.description !== undefined) {
      updateFields.push('description = ?');
      params.push(request.description);
    }

    if (request.priceHollar !== undefined) {
      updateFields.push('price_hollar = ?');
      params.push(request.priceHollar);
    }

    if (request.categoryId !== undefined) {
      updateFields.push('category_id = ?');
      params.push(request.categoryId);
    }

    if (request.images !== undefined) {
      updateFields.push('images = ?');
      params.push(JSON.stringify(request.images));
    }

    if (request.digitalDeliveryType !== undefined) {
      updateFields.push('digital_delivery_type = ?');
      params.push(request.digitalDeliveryType);
    }

    if (request.digitalDeliveryInstructions !== undefined) {
      updateFields.push('digital_delivery_instructions = ?');
      params.push(request.digitalDeliveryInstructions);
    }

    if (request.variants !== undefined) {
      updateFields.push('variants = ?');
      params.push(JSON.stringify(request.variants));
    }

    if (request.tags !== undefined) {
      updateFields.push('tags = ?');
      params.push(JSON.stringify(request.tags));
    }

    if (request.isActive !== undefined) {
      updateFields.push('is_active = ?');
      params.push(request.isActive ? 1 : 0);
    }

    if (updateFields.length === 0) {
      const product = await this.getProductById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    }

    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString());

    const query = `
      UPDATE products
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    params.push(id);

    const result = this.db.prepare(query).run(...params);

    if (result.changes === 0) {
      throw new Error('Product not found');
    }

    logger.info('Product updated', { id });

    const product = await this.getProductById(id);
    if (!product) {
      throw new Error('Failed to retrieve updated product');
    }

    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const query = 'UPDATE products SET is_active = 0 WHERE id = ?';
    const result = this.db.prepare(query).run(id);

    if (result.changes === 0) {
      throw new Error('Product not found');
    }

    logger.info('Product deactivated', { id });
  }

  async incrementViews(id: string): Promise<void> {
    const query = 'UPDATE products SET views = views + 1 WHERE id = ?';
    this.db.prepare(query).run(id);
  }

  private mapRowToProduct(row: any): Product {
    let images: string[] = [];
    try {
      images = row.images ? JSON.parse(row.images) : [];
    } catch (e) {
      images = row.images ? [row.images] : [];
    }

    let variants: Array<{ name: string; value: string; stock?: number }> | undefined;
    try {
      variants = row.variants ? JSON.parse(row.variants) : undefined;
    } catch (e) {
      variants = undefined;
    }

    let tags: string[] | undefined;
    try {
      tags = row.tags ? JSON.parse(row.tags) : undefined;
    } catch (e) {
      tags = undefined;
    }

    return {
      id: row.id,
      onChainId: row.onChainId || undefined,
      title: row.title,
      description: row.description,
      priceHollar: row.priceHollar,
      categoryId: row.categoryId,
      images,
      sellerWalletAddress: row.sellerWalletAddress,
      storeId: row.storeId || undefined,
      ipfsMetadataHash: row.ipfsMetadataHash,
      blockchainVerified: Boolean(row.blockchainVerified),
      registryTxHash: row.registryTxHash || undefined,
      blockNumber: row.blockNumber || undefined,
      digitalDeliveryType: row.digitalDeliveryType || undefined,
      digitalDeliveryInstructions: row.digitalDeliveryInstructions || undefined,
      variants,
      tags,
      views: row.views || 0,
      purchases: row.purchases || 0,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
}
