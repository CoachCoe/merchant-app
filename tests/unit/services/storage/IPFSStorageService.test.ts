import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { IPFSStorageService } from '../../../../src/services/storage/IPFSStorageService';
import { ProductMetadata, StoreProfile } from '../../../../src/services/storage/IStorageService';

// Mock Pinata SDK
jest.mock('@pinata/sdk', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      pinJSONToIPFS: jest.fn().mockResolvedValue({
        IpfsHash: 'QmTest123',
        PinSize: 1024,
        Timestamp: '2025-10-02T12:00:00.000Z'
      }),
      pinFileToIPFS: jest.fn().mockResolvedValue({
        IpfsHash: 'QmImageTest456',
        PinSize: 2048,
        Timestamp: '2025-10-02T12:00:00.000Z'
      })
    }))
  };
});

// Mock logger
jest.mock('../../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock fetch
global.fetch = jest.fn();

describe('IPFSStorageService', () => {
  let service: IPFSStorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PINATA_API_KEY = 'test-api-key';
    process.env.PINATA_SECRET_API_KEY = 'test-secret-key';
    service = new IPFSStorageService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadProductMetadata', () => {
    it('should upload product metadata to IPFS', async () => {
      const metadata: ProductMetadata = {
        id: 'prod-123',
        name: 'Test Product',
        description: 'Test description',
        category: 'electronics',
        images: ['QmImage1', 'QmImage2'],
        delivery_type: 'digital',
        created_at: '2025-10-02T12:00:00.000Z'
      };

      const result = await service.uploadProductMetadata(metadata);

      expect(result).toBeDefined();
      expect(result.hash).toBe('QmTest123');
      expect(result.url).toContain('QmTest123');
      expect(result.metadata.provider).toBe('ipfs');
      expect(result.metadata.size_bytes).toBe(1024);
    });

    it('should throw error when Pinata is not configured', async () => {
      delete process.env.PINATA_API_KEY;
      const serviceWithoutCreds = new IPFSStorageService();

      const metadata: ProductMetadata = {
        id: 'prod-123',
        name: 'Test Product',
        description: 'Test',
        category: 'test',
        images: [],
        delivery_type: 'digital',
        created_at: new Date().toISOString()
      };

      await expect(serviceWithoutCreds.uploadProductMetadata(metadata))
        .rejects.toThrow('IPFS service not configured');
    });

    it('should handle upload failures', async () => {
      const mockService = new IPFSStorageService();
      // @ts-ignore - accessing private property for testing
      mockService.pinata = {
        pinJSONToIPFS: jest.fn().mockRejectedValue(new Error('Network error'))
      };

      const metadata: ProductMetadata = {
        id: 'prod-123',
        name: 'Test',
        description: 'Test',
        category: 'test',
        images: [],
        delivery_type: 'digital',
        created_at: new Date().toISOString()
      };

      await expect(mockService.uploadProductMetadata(metadata))
        .rejects.toThrow('IPFS upload failed');
    });
  });

  describe('uploadStoreProfile', () => {
    it('should upload store profile to IPFS', async () => {
      const profile: StoreProfile = {
        store_id: 'store-123',
        name: 'Test Store',
        description: 'A test store',
        owner_wallet: '0x1234567890123456789012345678901234567890',
        created_at: '2025-10-02T12:00:00.000Z'
      };

      const result = await service.uploadStoreProfile(profile);

      expect(result).toBeDefined();
      expect(result.hash).toBe('QmTest123');
      expect(result.metadata.provider).toBe('ipfs');
    });
  });

  describe('uploadImage', () => {
    it('should upload image buffer to IPFS', async () => {
      const imageBuffer = Buffer.from('test image data');
      const filename = 'test-image.png';

      const result = await service.uploadImage(imageBuffer, filename);

      expect(result).toBeDefined();
      expect(result.hash).toBe('QmImageTest456');
      expect(result.metadata.provider).toBe('ipfs');
      expect(result.metadata.size_bytes).toBe(2048);
    });
  });

  describe('fetchProductMetadata', () => {
    it('should fetch metadata from first available gateway', async () => {
      const mockMetadata: ProductMetadata = {
        id: 'prod-123',
        name: 'Test Product',
        description: 'Test',
        category: 'test',
        images: [],
        delivery_type: 'digital',
        created_at: new Date().toISOString()
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      const result = await service.fetchProductMetadata('QmTest123');

      expect(result).toEqual(mockMetadata);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('QmTest123'),
        expect.any(Object)
      );
    });

    it('should try multiple gateways on failure', async () => {
      const mockMetadata: ProductMetadata = {
        id: 'prod-123',
        name: 'Test Product',
        description: 'Test',
        category: 'test',
        images: [],
        delivery_type: 'digital',
        created_at: new Date().toISOString()
      };

      // First gateway fails
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Second gateway succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      });

      const result = await service.fetchProductMetadata('QmTest123');

      expect(result).toEqual(mockMetadata);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error when all gateways fail', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(service.fetchProductMetadata('QmTest123'))
        .rejects.toThrow('Failed to fetch from all IPFS gateways');
    });
  });

  describe('getContentUrl', () => {
    it('should return URL with primary gateway', () => {
      const url = service.getContentUrl('QmTest123');

      expect(url).toContain('QmTest123');
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  describe('isContentAvailable', () => {
    it('should return true when content is available', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true
      });

      const available = await service.isContentAvailable('QmTest123');

      expect(available).toBe(true);
    });

    it('should return false when content is not available', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const available = await service.isContentAvailable('QmTest123');

      expect(available).toBe(false);
    });

    it('should return false on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const available = await service.isContentAvailable('QmTest123');

      expect(available).toBe(false);
    });
  });

  describe('getProviderName', () => {
    it('should return correct provider name', () => {
      expect(service.getProviderName()).toBe('IPFS (Pinata)');
    });
  });

  describe('getProviderType', () => {
    it('should return ipfs as provider type', () => {
      expect(service.getProviderType()).toBe('ipfs');
    });
  });
});
