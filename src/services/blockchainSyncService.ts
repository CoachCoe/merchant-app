import { ProductService } from './productService.js';
import { logger } from '../utils/logger.js';

/**
 * Blockchain Sync Service
 *
 * Periodically syncs on-chain data to local cache for performance.
 * Runs in background and keeps SQLite cache fresh with blockchain state.
 */
export class BlockchainSyncService {
  private productService = new ProductService();
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private syncIntervalMs: number;

  constructor(syncIntervalMinutes: number = 5) {
    this.syncIntervalMs = syncIntervalMinutes * 60 * 1000;
  }

  /**
   * Start the background sync service
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Blockchain sync service already running');
      return;
    }

    logger.info('Starting blockchain sync service', {
      intervalMinutes: this.syncIntervalMs / 60000
    });

    // Run initial sync
    this.syncNow().catch(error => {
      logger.error('Initial blockchain sync failed', error);
    });

    // Schedule periodic syncs
    this.syncInterval = setInterval(() => {
      this.syncNow().catch(error => {
        logger.error('Periodic blockchain sync failed', error);
      });
    }, this.syncIntervalMs);

    this.isRunning = true;
  }

  /**
   * Stop the background sync service
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Blockchain sync service not running');
      return;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.isRunning = false;
    logger.info('Blockchain sync service stopped');
  }

  /**
   * Trigger immediate sync
   */
  async syncNow(): Promise<{ synced: number; errors: number }> {
    logger.info('Starting blockchain sync...');

    try {
      const result = await this.productService.refreshProductsFromBlockchain();

      logger.info('Blockchain sync complete', result);
      return result;
    } catch (error) {
      logger.error('Blockchain sync failed', error);
      throw error;
    }
  }

  /**
   * Check if sync service is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get sync status
   */
  getStatus(): {
    running: boolean;
    intervalMinutes: number;
    nextSyncIn?: number;
  } {
    return {
      running: this.isRunning,
      intervalMinutes: this.syncIntervalMs / 60000,
      nextSyncIn: this.isRunning ? this.syncIntervalMs : undefined
    };
  }
}

// Singleton instance
let syncServiceInstance: BlockchainSyncService | null = null;

/**
 * Get the singleton sync service instance
 */
export function getBlockchainSyncService(): BlockchainSyncService {
  if (!syncServiceInstance) {
    // Default: sync every 5 minutes
    const intervalMinutes = parseInt(process.env.BLOCKCHAIN_SYNC_INTERVAL_MINUTES || '5', 10);
    syncServiceInstance = new BlockchainSyncService(intervalMinutes);
  }
  return syncServiceInstance;
}
