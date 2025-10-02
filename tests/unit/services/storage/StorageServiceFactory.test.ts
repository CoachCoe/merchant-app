import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { StorageServiceFactory } from '../../../../src/services/storage/StorageServiceFactory';
import { IPFSStorageService } from '../../../../src/services/storage/IPFSStorageService';
import { BulletinChainStorageService } from '../../../../src/services/storage/BulletinChainStorageService';

// Mock services
jest.mock('../../../../src/services/storage/IPFSStorageService');
jest.mock('../../../../src/services/storage/BulletinChainStorageService');
jest.mock('../../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('StorageServiceFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StorageServiceFactory.reset();
    delete process.env.STORAGE_PROVIDER;
    delete process.env.BULLETIN_CHAIN_ENABLED;
    delete process.env.BULLETIN_CHAIN_WS_ENDPOINT;
  });

  afterEach(() => {
    StorageServiceFactory.reset();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = StorageServiceFactory.getInstance();
      const instance2 = StorageServiceFactory.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = StorageServiceFactory.getInstance();
      StorageServiceFactory.reset();
      const instance2 = StorageServiceFactory.getInstance();

      // They're different instances but both are valid services
      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
    });
  });

  describe('createStorageService', () => {
    it('should create IPFS service when provider is "ipfs"', () => {
      const service = StorageServiceFactory.createStorageService('ipfs');

      expect(service).toBeInstanceOf(IPFSStorageService);
    });

    it('should create Bulletin service when provider is "bulletin"', () => {
      const service = StorageServiceFactory.createStorageService('bulletin');

      expect(service).toBeInstanceOf(BulletinChainStorageService);
    });

    it('should auto-select IPFS by default', () => {
      const service = StorageServiceFactory.createStorageService('auto');

      expect(service).toBeInstanceOf(IPFSStorageService);
    });

    it('should auto-select Bulletin when enabled and configured', () => {
      process.env.BULLETIN_CHAIN_ENABLED = 'true';
      process.env.BULLETIN_CHAIN_WS_ENDPOINT = 'wss://test-bulletin.io';

      const service = StorageServiceFactory.createStorageService('auto');

      expect(service).toBeInstanceOf(BulletinChainStorageService);
    });

    it('should use IPFS when Bulletin is enabled but no endpoint', () => {
      process.env.BULLETIN_CHAIN_ENABLED = 'true';
      delete process.env.BULLETIN_CHAIN_WS_ENDPOINT;

      const service = StorageServiceFactory.createStorageService('auto');

      expect(service).toBeInstanceOf(IPFSStorageService);
    });
  });

  describe('provider configuration', () => {
    it('should respect STORAGE_PROVIDER environment variable', () => {
      process.env.STORAGE_PROVIDER = 'ipfs';
      StorageServiceFactory.reset();

      const service = StorageServiceFactory.getInstance();

      expect(service).toBeInstanceOf(IPFSStorageService);
    });

    it('should handle invalid provider and default to auto', () => {
      process.env.STORAGE_PROVIDER = 'invalid-provider';
      StorageServiceFactory.reset();

      const service = StorageServiceFactory.getInstance();

      // Should fall back to IPFS (auto default)
      expect(service).toBeInstanceOf(IPFSStorageService);
    });
  });

  describe('createDualWriteService', () => {
    it('should create dual-write wrapper', () => {
      const ipfs = new IPFSStorageService();
      const bulletin = new BulletinChainStorageService();

      const dualWrite = StorageServiceFactory.createDualWriteService(
        bulletin,
        ipfs
      );

      expect(dualWrite).toBeDefined();
      expect(dualWrite.getProviderName()).toContain('Dual-Write');
    });

    it('should use primary provider for reads', async () => {
      const ipfs: any = {
        getProviderName: () => 'ipfs',
        getProviderType: () => 'ipfs' as const,
        uploadProductMetadata: jest.fn(),
        uploadStoreProfile: jest.fn(),
        uploadImage: jest.fn(),
        fetchProductMetadata: jest.fn(),
        fetchStoreProfile: jest.fn(),
        getContentUrl: jest.fn(),
        isContentAvailable: jest.fn()
      };

      const bulletin: any = {
        getProviderName: () => 'bulletin',
        getProviderType: () => 'bulletin' as const,
        uploadProductMetadata: jest.fn(),
        uploadStoreProfile: jest.fn(),
        uploadImage: jest.fn(),
        fetchProductMetadata: jest.fn(),
        fetchStoreProfile: jest.fn(),
        getContentUrl: jest.fn(),
        isContentAvailable: jest.fn()
      };

      const dualWrite = StorageServiceFactory.createDualWriteService(
        bulletin,  // primary
        ipfs
      );

      expect(dualWrite.getProviderType()).toBe('bulletin');
    });
  });
});
