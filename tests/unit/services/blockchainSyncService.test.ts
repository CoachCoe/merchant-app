import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BlockchainSyncService } from '../../../src/services/blockchainSyncService';
import { ProductService } from '../../../src/services/productService';

// Mock dependencies
jest.mock('../../../src/services/productService');
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('BlockchainSyncService', () => {
  let syncService: BlockchainSyncService;
  let mockProductService: jest.Mocked<ProductService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create new instance for each test
    syncService = new BlockchainSyncService(1); // 1 minute interval for testing
  });

  afterEach(() => {
    if (syncService.isActive()) {
      syncService.stop();
    }
    jest.useRealTimers();
  });

  describe('start', () => {
    it('should start the sync service', () => {
      syncService.start();

      expect(syncService.isActive()).toBe(true);
    });

    it('should not start if already running', () => {
      syncService.start();
      const firstStart = syncService.isActive();

      syncService.start();
      const secondStart = syncService.isActive();

      expect(firstStart).toBe(true);
      expect(secondStart).toBe(true);
    });

    it('should schedule periodic syncs', () => {
      syncService.start();

      // Fast-forward time
      jest.advanceTimersByTime(60000); // 1 minute

      expect(syncService.isActive()).toBe(true);
    });
  });

  describe('stop', () => {
    it('should stop the sync service', () => {
      syncService.start();
      expect(syncService.isActive()).toBe(true);

      syncService.stop();
      expect(syncService.isActive()).toBe(false);
    });

    it('should handle stop when not running', () => {
      expect(syncService.isActive()).toBe(false);

      syncService.stop();
      expect(syncService.isActive()).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return correct status when running', () => {
      syncService.start();

      const status = syncService.getStatus();

      expect(status.running).toBe(true);
      expect(status.intervalMinutes).toBe(1);
      expect(status.nextSyncIn).toBeDefined();
    });

    it('should return correct status when stopped', () => {
      const status = syncService.getStatus();

      expect(status.running).toBe(false);
      expect(status.intervalMinutes).toBe(1);
      expect(status.nextSyncIn).toBeUndefined();
    });
  });

  describe('constructor', () => {
    it('should use default interval if not specified', () => {
      const defaultService = new BlockchainSyncService();
      const status = defaultService.getStatus();

      expect(status.intervalMinutes).toBe(5);
    });

    it('should accept custom interval', () => {
      const customService = new BlockchainSyncService(10);
      const status = customService.getStatus();

      expect(status.intervalMinutes).toBe(10);
    });
  });
});
