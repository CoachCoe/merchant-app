import { Product, CreateProductRequest } from '../../src/models/Product';

/**
 * Test fixtures for products
 */

export const mockProducts: Product[] = [
  {
    id: 'prod-001',
    onChainId: '0x123abc',
    title: 'Polkadot Developer T-Shirt',
    description: 'Official Polkadot developer merchandise. High-quality cotton t-shirt with Polkadot logo.',
    priceHollar: 50,
    categoryId: 'apparel',
    images: [
      'QmProductImage1',
      'QmProductImage2'
    ],
    sellerWalletAddress: '0x1234567890123456789012345678901234567890',
    storeId: 'store-001',
    ipfsMetadataHash: 'QmProductMetadata1',
    blockchainVerified: true,
    registryTxHash: '0xtxhash123',
    blockNumber: 12345,
    digitalDeliveryType: 'email',
    variants: [
      { name: 'Size', value: 'M', stock: 10 },
      { name: 'Size', value: 'L', stock: 15 },
      { name: 'Size', value: 'XL', stock: 8 }
    ],
    tags: ['merchandise', 'polkadot', 'apparel'],
    views: 150,
    purchases: 25,
    isActive: true,
    createdAt: '2025-09-01T12:00:00.000Z',
    updatedAt: '2025-10-01T12:00:00.000Z'
  },
  {
    id: 'prod-002',
    title: 'Substrate Development Course',
    description: 'Complete video course on Substrate blockchain development. Learn to build parachains from scratch.',
    priceHollar: 200,
    categoryId: 'digital-goods',
    images: ['QmCourseImage1'],
    sellerWalletAddress: '0x2345678901234567890123456789012345678901',
    storeId: 'store-002',
    ipfsMetadataHash: 'QmCourseMetadata1',
    blockchainVerified: true,
    digitalDeliveryType: 'download',
    digitalDeliveryInstructions: 'Download link will be sent to your email after payment confirmation.',
    tags: ['education', 'substrate', 'blockchain', 'development'],
    views: 500,
    purchases: 75,
    isActive: true,
    createdAt: '2025-08-15T10:00:00.000Z',
    updatedAt: '2025-09-20T15:30:00.000Z'
  },
  {
    id: 'prod-003',
    onChainId: '0x789def',
    title: 'DOT Staking Guide (Digital PDF)',
    description: 'Comprehensive guide to staking DOT tokens. Includes strategies, risks, and best practices.',
    priceHollar: 25,
    categoryId: 'digital-goods',
    images: ['QmGuideImage1'],
    sellerWalletAddress: '0x3456789012345678901234567890123456789012',
    ipfsMetadataHash: 'QmGuideMetadata1',
    blockchainVerified: false,
    digitalDeliveryType: 'ipfs',
    digitalDeliveryInstructions: 'IPFS hash: QmStakingGuide123',
    tags: ['guide', 'staking', 'DOT', 'investment'],
    views: 200,
    purchases: 40,
    isActive: true,
    createdAt: '2025-09-10T14:00:00.000Z',
    updatedAt: '2025-09-10T14:00:00.000Z'
  },
  {
    id: 'prod-004',
    title: 'Polkadot NFT Artwork Collection',
    description: 'Limited edition NFT artwork celebrating Polkadot ecosystem. 10 unique pieces.',
    priceHollar: 500,
    categoryId: 'nft',
    images: ['QmNFTImage1', 'QmNFTImage2', 'QmNFTImage3'],
    sellerWalletAddress: '0x4567890123456789012345678901234567890123',
    storeId: 'store-003',
    ipfsMetadataHash: 'QmNFTMetadata1',
    blockchainVerified: true,
    registryTxHash: '0xtxhash456',
    blockNumber: 12500,
    digitalDeliveryType: 'ipfs',
    tags: ['nft', 'art', 'collectible', 'polkadot'],
    views: 1000,
    purchases: 5,
    isActive: true,
    createdAt: '2025-09-25T09:00:00.000Z',
    updatedAt: '2025-10-02T11:00:00.000Z'
  },
  {
    id: 'prod-005',
    title: 'Inactive Product (Test)',
    description: 'This product has been deactivated for testing purposes.',
    priceHollar: 100,
    categoryId: 'test',
    images: [],
    sellerWalletAddress: '0x5678901234567890123456789012345678901234',
    ipfsMetadataHash: 'QmInactiveMetadata',
    blockchainVerified: false,
    views: 10,
    purchases: 0,
    isActive: false,
    createdAt: '2025-08-01T08:00:00.000Z',
    updatedAt: '2025-08-15T10:00:00.000Z'
  }
];

export const mockCreateProductRequests: CreateProductRequest[] = [
  {
    title: 'New Test Product',
    description: 'A product created during testing',
    priceHollar: 75,
    categoryId: 'electronics',
    images: ['QmNewImage1'],
    sellerWalletAddress: '0x1111111111111111111111111111111111111111',
    storeId: 'store-test',
    ipfsMetadataHash: 'QmNewMetadata1',
    digitalDeliveryType: 'email',
    tags: ['test', 'new']
  }
];

export const mockProductsByCategory = {
  'digital-goods': mockProducts.filter(p => p.categoryId === 'digital-goods'),
  'apparel': mockProducts.filter(p => p.categoryId === 'apparel'),
  'nft': mockProducts.filter(p => p.categoryId === 'nft')
};

export const mockProductsBySeller = (walletAddress: string) =>
  mockProducts.filter(p => p.sellerWalletAddress === walletAddress);

export const mockActiveProducts = mockProducts.filter(p => p.isActive);
export const mockInactiveProducts = mockProducts.filter(p => !p.isActive);
export const mockVerifiedProducts = mockProducts.filter(p => p.blockchainVerified);
