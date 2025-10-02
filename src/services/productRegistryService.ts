import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';

const PRODUCT_REGISTRY_ABI = [
  "function createStore(string memory _name, string memory _ipfsProfileHash) external",
  "function updateStore(string memory _name, string memory _ipfsProfileHash) external",
  "function registerProduct(string memory _name, string memory _ipfsMetadataHash, uint256 _priceHollar, string memory _category) external returns (bytes32)",
  "function updateProduct(bytes32 _productId, string memory _ipfsMetadataHash, uint256 _priceHollar, bool _isActive) external",
  "function deactivateProduct(bytes32 _productId) external",
  "function getProduct(bytes32 _productId) external view returns (bytes32 id, address seller, string memory name, string memory ipfsMetadataHash, uint256 priceHollar, string memory category, bool isActive, uint256 createdAt)",
  "function getStore(address _owner) external view returns (address owner, string memory name, string memory ipfsProfileHash, bool isActive, uint256 createdAt)",
  "function getProductsBySeller(address _seller) external view returns (bytes32[] memory)",
  "function getProductsByCategory(string memory _category) external view returns (bytes32[] memory)",
  "function getAllActiveProducts() external view returns (bytes32[] memory)",
  "function getTotalProducts() external view returns (uint256)",
  "function getActiveProductCount() external view returns (uint256)",
  "event StoreCreated(address indexed owner, string name, string ipfsProfileHash)",
  "event ProductRegistered(bytes32 indexed id, address indexed seller, string name, string ipfsMetadataHash, uint256 priceHollar, string category)",
  "event ProductUpdated(bytes32 indexed id, string ipfsMetadataHash, uint256 priceHollar, bool isActive)",
  "event ProductDeactivated(bytes32 indexed id)"
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

export interface OnChainStore {
  owner: string;
  name: string;
  ipfsProfileHash: string;
  isActive: boolean;
  createdAt: bigint;
}

export class ProductRegistryService {
  private provider: ethers.Provider | null = null;
  private contract: ethers.Contract | null = null;
  private contractAddress: string;
  private rpcUrl: string;

  constructor() {
    this.contractAddress = process.env.PRODUCT_REGISTRY_CONTRACT_ADDRESS || '';
    this.rpcUrl = process.env.EVM_RPC_URL || process.env.ASSETHUB_WSS_URL || '';

    if (!this.contractAddress) {
      logger.warn('ProductRegistryService initialized without contract address');
    }

    if (!this.rpcUrl) {
      logger.warn('ProductRegistryService initialized without RPC URL');
    }
  }

  async initialize(): Promise<void> {
    if (this.contract) {
      return;
    }

    if (!this.rpcUrl) {
      throw new Error('RPC URL not configured');
    }

    try {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      this.contract = new ethers.Contract(
        this.contractAddress,
        PRODUCT_REGISTRY_ABI,
        this.provider
      );

      logger.info('ProductRegistryService initialized', {
        contractAddress: this.contractAddress,
        rpcUrl: this.rpcUrl
      });
    } catch (error) {
      logger.error('Failed to initialize ProductRegistryService', error);
      throw new Error('Product registry initialization failed');
    }
  }

  async createStore(
    signer: ethers.Signer,
    name: string,
    ipfsProfileHash: string
  ): Promise<string> {
    if (!this.contract) {
      await this.initialize();
    }

    const contractWithSigner = this.contract!.connect(signer);

    try {
      const tx = await (contractWithSigner as any).createStore(name, ipfsProfileHash);
      const receipt = await tx.wait();

      logger.info('Store created on-chain', {
        owner: await signer.getAddress(),
        name,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to create store on-chain', error);
      throw new Error('Store creation failed');
    }
  }

  async registerProduct(
    signer: ethers.Signer,
    name: string,
    ipfsMetadataHash: string,
    priceHollar: number,
    category: string
  ): Promise<{ productId: string; txHash: string }> {
    if (!this.contract) {
      await this.initialize();
    }

    const contractWithSigner = this.contract!.connect(signer);

    try {
      const tx = await (contractWithSigner as any).registerProduct(
        name,
        ipfsMetadataHash,
        priceHollar,
        category
      );

      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log: any) => log.fragment?.name === 'ProductRegistered'
      );

      const productId = event?.args[0];

      logger.info('Product registered on-chain', {
        seller: await signer.getAddress(),
        productId,
        name,
        txHash: receipt.hash
      });

      return {
        productId,
        txHash: receipt.hash
      };
    } catch (error) {
      logger.error('Failed to register product on-chain', error);
      throw new Error('Product registration failed');
    }
  }

  async getProduct(productId: string): Promise<OnChainProduct> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      const result = await this.contract!.getProduct(productId);

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
      logger.error('Failed to get product from registry', error);
      throw new Error('Product query failed');
    }
  }

  async getStore(ownerAddress: string): Promise<OnChainStore> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      const result = await this.contract!.getStore(ownerAddress);

      return {
        owner: result[0],
        name: result[1],
        ipfsProfileHash: result[2],
        isActive: result[3],
        createdAt: result[4]
      };
    } catch (error) {
      logger.error('Failed to get store from registry', error);
      throw new Error('Store query failed');
    }
  }

  async getProductsBySeller(sellerAddress: string): Promise<string[]> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      const productIds = await this.contract!.getProductsBySeller(sellerAddress);
      return productIds;
    } catch (error) {
      logger.error('Failed to get products by seller', error);
      throw new Error('Products query failed');
    }
  }

  async getProductsByCategory(category: string): Promise<string[]> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      const productIds = await this.contract!.getProductsByCategory(category);
      return productIds;
    } catch (error) {
      logger.error('Failed to get products by category', error);
      throw new Error('Products query failed');
    }
  }

  async getAllActiveProducts(): Promise<string[]> {
    if (!this.contract) {
      await this.initialize();
    }

    try {
      const productIds = await this.contract!.getAllActiveProducts();
      return productIds;
    } catch (error) {
      logger.error('Failed to get all active products', error);
      throw new Error('Products query failed');
    }
  }

  async updateProduct(
    signer: ethers.Signer,
    productId: string,
    ipfsMetadataHash: string,
    priceHollar: number,
    isActive: boolean
  ): Promise<string> {
    if (!this.contract) {
      await this.initialize();
    }

    const contractWithSigner = this.contract!.connect(signer);

    try {
      const tx = await (contractWithSigner as any).updateProduct(
        productId,
        ipfsMetadataHash,
        priceHollar,
        isActive
      );

      const receipt = await tx.wait();

      logger.info('Product updated on-chain', {
        productId,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to update product on-chain', error);
      throw new Error('Product update failed');
    }
  }

  async deactivateProduct(signer: ethers.Signer, productId: string): Promise<string> {
    if (!this.contract) {
      await this.initialize();
    }

    const contractWithSigner = this.contract!.connect(signer);

    try {
      const tx = await (contractWithSigner as any).deactivateProduct(productId);
      const receipt = await tx.wait();

      logger.info('Product deactivated on-chain', {
        productId,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to deactivate product on-chain', error);
      throw new Error('Product deactivation failed');
    }
  }
}
