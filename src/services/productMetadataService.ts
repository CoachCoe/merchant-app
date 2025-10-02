import { StorageServiceFactory } from './storage/index.js';
import { ProductMetadata, StoreProfile } from './storage/IStorageService.js';
import { logger } from '../utils/logger.js';
import { Product } from '../models/Product.js';

/**
 * Product Metadata Service
 *
 * High-level service for managing product and store metadata.
 * Uses storage abstraction layer (IPFS or Bulletin Chain).
 */
export class ProductMetadataService {
  private storage = StorageServiceFactory.getInstance();

  /**
   * Upload product metadata to decentralized storage
   */
  async uploadProductMetadata(product: Product): Promise<string> {
    const metadata: ProductMetadata = {
      id: product.id,
      name: product.title,
      description: product.description,
      category: product.categoryId,
      images: product.images,
      variants: product.variants,
      delivery_type: product.digitalDeliveryType || 'email',
      delivery_instructions: product.digitalDeliveryInstructions,
      created_at: product.createdAt
    };

    try {
      const result = await this.storage.uploadProductMetadata(metadata);

      logger.info('Product metadata uploaded', {
        productId: product.id,
        hash: result.hash,
        provider: this.storage.getProviderName()
      });

      return result.hash;
    } catch (error) {
      logger.error('Failed to upload product metadata', {
        productId: product.id,
        error
      });
      throw error;
    }
  }

  /**
   * Upload store profile to decentralized storage
   */
  async uploadStoreProfile(profile: StoreProfile): Promise<string> {
    try {
      const result = await this.storage.uploadStoreProfile(profile);

      logger.info('Store profile uploaded', {
        storeId: profile.store_id,
        hash: result.hash,
        provider: this.storage.getProviderName()
      });

      return result.hash;
    } catch (error) {
      logger.error('Failed to upload store profile', {
        storeId: profile.store_id,
        error
      });
      throw error;
    }
  }

  /**
   * Upload product image to decentralized storage
   */
  async uploadProductImage(imageBuffer: Buffer, filename: string): Promise<string> {
    try {
      const result = await this.storage.uploadImage(imageBuffer, filename);

      logger.info('Product image uploaded', {
        filename,
        hash: result.hash,
        provider: this.storage.getProviderName()
      });

      return result.hash;
    } catch (error) {
      logger.error('Failed to upload product image', {
        filename,
        error
      });
      throw error;
    }
  }

  /**
   * Fetch product metadata from decentralized storage
   */
  async fetchProductMetadata(hash: string): Promise<ProductMetadata> {
    try {
      const metadata = await this.storage.fetchProductMetadata(hash);

      logger.debug('Product metadata fetched', {
        hash,
        provider: this.storage.getProviderName()
      });

      return metadata;
    } catch (error) {
      logger.error('Failed to fetch product metadata', { hash, error });
      throw error;
    }
  }

  /**
   * Fetch store profile from decentralized storage
   */
  async fetchStoreProfile(hash: string): Promise<StoreProfile> {
    try {
      const profile = await this.storage.fetchStoreProfile(hash);

      logger.debug('Store profile fetched', {
        hash,
        provider: this.storage.getProviderName()
      });

      return profile;
    } catch (error) {
      logger.error('Failed to fetch store profile', { hash, error });
      throw error;
    }
  }

  /**
   * Get public URL for content hash
   */
  getContentUrl(hash: string): string {
    return this.storage.getContentUrl(hash);
  }

  /**
   * Check if content is available
   */
  async isContentAvailable(hash: string): Promise<boolean> {
    return this.storage.isContentAvailable(hash);
  }

  /**
   * Get current storage provider info
   */
  getProviderInfo(): { name: string; type: 'ipfs' | 'bulletin' } {
    return {
      name: this.storage.getProviderName(),
      type: this.storage.getProviderType()
    };
  }
}
