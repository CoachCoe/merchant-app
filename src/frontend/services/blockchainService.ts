/**
 * Blockchain Service - Client-side blockchain queries
 *
 * Enables React frontend to query ProductRegistry smart contract directly
 * without relying on the server API.
 *
 * Features:
 * - Direct contract queries via ethers.js
 * - IPFS metadata fetching
 * - Browser wallet integration (MetaMask, etc.)
 */

import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers';

// ProductRegistry ABI (only view functions needed for reads)
const PRODUCT_REGISTRY_ABI = [
  'function getProduct(bytes32 productId) external view returns (bytes32 id, address seller, string name, string ipfsMetadataHash, uint256 priceHollar, string category, bool isActive, uint256 createdAt)',
  'function getAllActiveProducts() external view returns (bytes32[] memory)',
  'function getProductsBySeller(address seller) external view returns (bytes32[] memory)',
  'function getProductsByCategory(string category) external view returns (bytes32[] memory)',
  'function getTotalProducts() external view returns (uint256)',
  'function getActiveProductCount() external view returns (uint256)',
  'function stores(address owner) external view returns (address owner, string name, string ipfsProfileHash, bool isActive, uint256 createdAt)'
];

export interface OnChainProduct {
  id: string;
  seller: string;
  name: string;
  ipfsMetadataHash: string;
  priceHollar: bigint;
  category: string;
  isActive: boolean;
  createdAt: bigint;
}

export interface ProductMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  delivery_type: string;
  delivery_instructions: string;
  variants: Array<{ name: string; value: string; stock: number }>;
  created_at: string;
}

export interface MergedProduct {
  id: string;
  onChainId: string;
  title: string;
  description: string;
  priceHollar: number;
  category: string;
  images: string[];
  sellerWalletAddress: string;
  ipfsMetadataHash: string;
  blockchainVerified: true;
  digitalDeliveryType?: string;
  digitalDeliveryInstructions?: string;
  variants?: Array<{ name: string; value: string; stock: number }>;
  isActive: boolean;
  createdAt: string;
}

/**
 * BlockchainService - Client-side blockchain interaction
 */
export class BlockchainService {
  private provider: JsonRpcProvider | BrowserProvider | null = null;
  private contract: Contract | null = null;
  private contractAddress: string | null = null;
  private rpcUrl: string | null = null;

  /**
   * Initialize with RPC provider (read-only mode)
   */
  async initializeWithRPC(rpcUrl: string, contractAddress: string): Promise<void> {
    this.rpcUrl = rpcUrl;
    this.contractAddress = contractAddress;
    this.provider = new JsonRpcProvider(rpcUrl);
    this.contract = new Contract(contractAddress, PRODUCT_REGISTRY_ABI, this.provider);
  }

  /**
   * Initialize with browser wallet (MetaMask, etc.)
   */
  async initializeWithWallet(contractAddress: string): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No Web3 wallet detected. Please install MetaMask or another Web3 wallet.');
    }

    this.contractAddress = contractAddress;
    this.provider = new BrowserProvider(window.ethereum);
    await this.provider.send('eth_requestAccounts', []);
    this.contract = new Contract(contractAddress, PRODUCT_REGISTRY_ABI, this.provider);
  }

  /**
   * Get product by on-chain ID
   */
  async getProduct(productId: string): Promise<OnChainProduct> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const result = await this.contract.getProduct(productId);

      return {
        id: result[0],
        seller: result[1],
        name: result[2],
        ipfsMetadataHash: result[3],
        priceHollar: result[4],
        category: result[5],
        isActive: result[6],
        createdAt: result[7]
      };
    } catch (error) {
      console.error('Error fetching product from blockchain:', error);
      throw new Error('Failed to fetch product from blockchain');
    }
  }

  /**
   * Get all active product IDs
   */
  async getAllActiveProducts(): Promise<string[]> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const productIds = await this.contract.getAllActiveProducts();
      return productIds.map((id: string) => id);
    } catch (error) {
      console.error('Error fetching active products:', error);
      throw new Error('Failed to fetch active products from blockchain');
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<string[]> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const productIds = await this.contract.getProductsByCategory(category);
      return productIds.map((id: string) => id);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw new Error('Failed to fetch products by category');
    }
  }

  /**
   * Get products by seller
   */
  async getProductsBySeller(sellerAddress: string): Promise<string[]> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const productIds = await this.contract.getProductsBySeller(sellerAddress);
      return productIds.map((id: string) => id);
    } catch (error) {
      console.error('Error fetching products by seller:', error);
      throw new Error('Failed to fetch products by seller');
    }
  }

  /**
   * Fetch product metadata from IPFS
   */
  async fetchIPFSMetadata(ipfsHash: string): Promise<ProductMetadata> {
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      `https://ipfs.io/ipfs/${ipfsHash}`,
      `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const metadata = await response.json();
          return metadata;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${gateway}:`, error);
        continue;
      }
    }

    throw new Error(`Failed to fetch metadata from IPFS for hash: ${ipfsHash}`);
  }

  /**
   * Get complete product data (on-chain + IPFS metadata)
   */
  async getProductWithMetadata(productId: string): Promise<MergedProduct> {
    const onChainProduct = await this.getProduct(productId);

    // If no IPFS hash, return minimal product
    if (!onChainProduct.ipfsMetadataHash || onChainProduct.ipfsMetadataHash === '') {
      return {
        id: productId,
        onChainId: productId,
        title: onChainProduct.name,
        description: '',
        priceHollar: Number(onChainProduct.priceHollar),
        category: onChainProduct.category,
        images: [],
        sellerWalletAddress: onChainProduct.seller,
        ipfsMetadataHash: '',
        blockchainVerified: true,
        isActive: onChainProduct.isActive,
        createdAt: new Date(Number(onChainProduct.createdAt) * 1000).toISOString()
      };
    }

    // Fetch full metadata from IPFS
    try {
      const metadata = await this.fetchIPFSMetadata(onChainProduct.ipfsMetadataHash);

      return {
        id: productId,
        onChainId: productId,
        title: onChainProduct.name,
        description: metadata.description || '',
        priceHollar: Number(onChainProduct.priceHollar),
        category: onChainProduct.category,
        images: metadata.images || [],
        sellerWalletAddress: onChainProduct.seller,
        ipfsMetadataHash: onChainProduct.ipfsMetadataHash,
        blockchainVerified: true,
        digitalDeliveryType: metadata.delivery_type,
        digitalDeliveryInstructions: metadata.delivery_instructions,
        variants: metadata.variants,
        isActive: onChainProduct.isActive,
        createdAt: new Date(Number(onChainProduct.createdAt) * 1000).toISOString()
      };
    } catch (error) {
      console.warn('Failed to fetch IPFS metadata, returning on-chain data only:', error);

      // Return on-chain data only if IPFS fetch fails
      return {
        id: productId,
        onChainId: productId,
        title: onChainProduct.name,
        description: 'Metadata unavailable',
        priceHollar: Number(onChainProduct.priceHollar),
        category: onChainProduct.category,
        images: [],
        sellerWalletAddress: onChainProduct.seller,
        ipfsMetadataHash: onChainProduct.ipfsMetadataHash,
        blockchainVerified: true,
        isActive: onChainProduct.isActive,
        createdAt: new Date(Number(onChainProduct.createdAt) * 1000).toISOString()
      };
    }
  }

  /**
   * Get multiple products with metadata
   */
  async getProductsWithMetadata(productIds: string[]): Promise<MergedProduct[]> {
    const products = await Promise.all(
      productIds.map(id => this.getProductWithMetadata(id).catch(err => {
        console.warn(`Failed to fetch product ${id}:`, err);
        return null;
      }))
    );

    return products.filter((p): p is MergedProduct => p !== null);
  }

  /**
   * Get store information by owner address
   */
  async getStore(ownerAddress: string): Promise<any> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const result = await this.contract.stores(ownerAddress);

      return {
        owner: result[0],
        name: result[1],
        ipfsProfileHash: result[2],
        isActive: result[3],
        createdAt: result[4]
      };
    } catch (error) {
      console.error('Error fetching store:', error);
      throw new Error('Failed to fetch store from blockchain');
    }
  }

  /**
   * Check if blockchain service is initialized
   */
  isInitialized(): boolean {
    return this.contract !== null;
  }

  /**
   * Get connected wallet address (if using wallet provider)
   */
  async getConnectedAddress(): Promise<string | null> {
    if (this.provider instanceof BrowserProvider) {
      try {
        const signer = await this.provider.getSigner();
        return await signer.getAddress();
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  /**
   * Subscribe to ProductRegistered events
   */
  onProductRegistered(callback: (product: OnChainProduct) => void): () => void {
    if (!this.contract) {
      console.warn('Contract not initialized - cannot subscribe to events');
      return () => {};
    }

    const listener = (id: string, seller: string, name: string, ipfsHash: string, price: bigint, category: string) => {
      callback({
        id,
        seller,
        name,
        ipfsMetadataHash: ipfsHash,
        priceHollar: price,
        category,
        isActive: true,
        createdAt: BigInt(Math.floor(Date.now() / 1000))
      });
    };

    this.contract.on('ProductRegistered', listener);

    // Return cleanup function
    return () => {
      if (this.contract) {
        this.contract.off('ProductRegistered', listener);
      }
    };
  }

  /**
   * Subscribe to ProductUpdated events
   */
  onProductUpdated(callback: (productId: string, ipfsHash: string, price: bigint, isActive: boolean) => void): () => void {
    if (!this.contract) {
      console.warn('Contract not initialized - cannot subscribe to events');
      return () => {};
    }

    const listener = (id: string, ipfsHash: string, price: bigint, isActive: boolean) => {
      callback(id, ipfsHash, price, isActive);
    };

    this.contract.on('ProductUpdated', listener);

    // Return cleanup function
    return () => {
      if (this.contract) {
        this.contract.off('ProductUpdated', listener);
      }
    };
  }

  /**
   * Subscribe to ProductDeactivated events
   */
  onProductDeactivated(callback: (productId: string) => void): () => void {
    if (!this.contract) {
      console.warn('Contract not initialized - cannot subscribe to events');
      return () => {};
    }

    const listener = (id: string) => {
      callback(id);
    };

    this.contract.on('ProductDeactivated', listener);

    // Return cleanup function
    return () => {
      if (this.contract) {
        this.contract.off('ProductDeactivated', listener);
      }
    };
  }
}

// Singleton instance
let blockchainServiceInstance: BlockchainService | null = null;

/**
 * Get or create blockchain service instance
 */
export function getBlockchainService(): BlockchainService {
  if (!blockchainServiceInstance) {
    blockchainServiceInstance = new BlockchainService();
  }
  return blockchainServiceInstance;
}
