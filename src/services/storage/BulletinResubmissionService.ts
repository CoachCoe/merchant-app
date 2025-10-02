import { BulletinChainStorageService } from './BulletinChainStorageService.js';
import { IPFSStorageService } from './IPFSStorageService.js';
import { DatabaseService } from '../databaseService.js';
import { logger } from '../../utils/logger.js';

/**
 * Bulletin Chain Re-submission Service
 *
 * Automatically re-submits product metadata to Bulletin Chain every ~10 days
 * to maintain 2-week cache availability.
 *
 * Design Doc Reference:
 * "Merchants re-submit to Bulletin Chain every ~10 days to maintain availability"
 * "If Bulletin Chain data expires, fall back to IPFS gateways"
 */
export class BulletinResubmissionService {
  private db = DatabaseService.getInstance().getDatabase();
  private bulletin: BulletinChainStorageService;
  private ipfs: IPFSStorageService;
  private intervalHandle: NodeJS.Timeout | null = null;
  private checkIntervalMs: number = 6 * 60 * 60 * 1000; // Check every 6 hours

  constructor(
    bulletinService: BulletinChainStorageService,
    ipfsService: IPFSStorageService
  ) {
    this.bulletin = bulletinService;
    this.ipfs = ipfsService;
  }

  /**
   * Start background re-submission service
   */
  start(): void {
    if (this.intervalHandle) {
      logger.warn('BulletinResubmissionService already started');
      return;
    }

    logger.info('Starting Bulletin Chain re-submission service', {
      checkInterval: `${this.checkIntervalMs / 1000 / 60 / 60} hours`
    });

    // Run immediately on start
    this.checkAndResubmit();

    // Then run periodically
    this.intervalHandle = setInterval(() => {
      this.checkAndResubmit();
    }, this.checkIntervalMs);
  }

  /**
   * Stop background re-submission service
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      logger.info('Stopped Bulletin Chain re-submission service');
    }
  }

  /**
   * Check products and re-submit those approaching expiry
   */
  async checkAndResubmit(): Promise<void> {
    try {
      const productsNeedingResubmit = this.getProductsNeedingResubmission();

      if (productsNeedingResubmit.length === 0) {
        logger.debug('No products need Bulletin Chain re-submission');
        return;
      }

      logger.info('Found products needing re-submission', {
        count: productsNeedingResubmit.length
      });

      for (const product of productsNeedingResubmit) {
        await this.resubmitProduct(product);
      }
    } catch (error) {
      logger.error('Error in Bulletin re-submission check', error);
    }
  }

  /**
   * Get products that need re-submission (older than 10 days on Bulletin)
   */
  private getProductsNeedingResubmission(): Array<{
    id: string;
    ipfs_metadata_hash: string;
    bulletin_uploaded_at: string;
    title: string;
  }> {
    // Only check active products using Bulletin storage
    const query = `
      SELECT
        id,
        ipfs_metadata_hash,
        bulletin_uploaded_at,
        title
      FROM products
      WHERE is_active = 1
      AND storage_provider = 'bulletin'
      AND bulletin_uploaded_at IS NOT NULL
    `;

    const products = this.db.prepare(query).all() as Array<{
      id: string;
      ipfs_metadata_hash: string;
      bulletin_uploaded_at: string;
      title: string;
    }>;

    // Filter products that need re-submission (>10 days old)
    return products.filter((product) =>
      this.bulletin.needsResubmission(product.bulletin_uploaded_at)
    );
  }

  /**
   * Re-submit a single product to Bulletin Chain
   */
  private async resubmitProduct(product: {
    id: string;
    ipfs_metadata_hash: string;
    bulletin_uploaded_at: string;
    title: string;
  }): Promise<void> {
    try {
      logger.info('Re-submitting product to Bulletin Chain', {
        productId: product.id,
        title: product.title,
        uploadedAt: product.bulletin_uploaded_at
      });

      // Fetch metadata from IPFS (permanent source)
      const metadata = await this.ipfs.fetchProductMetadata(
        product.ipfs_metadata_hash
      );

      // Re-upload to Bulletin Chain
      const result = await this.bulletin.uploadProductMetadata(metadata);

      // Update database with new upload time
      this.db.prepare(`
        UPDATE products
        SET bulletin_uploaded_at = ?
        WHERE id = ?
      `).run(new Date().toISOString(), product.id);

      logger.info('Product re-submitted successfully', {
        productId: product.id,
        newHash: result.hash
      });
    } catch (error) {
      logger.error('Failed to re-submit product', {
        productId: product.id,
        error
      });
      // Continue with other products even if one fails
    }
  }

  /**
   * Get statistics about Bulletin Chain content
   */
  getStats(): {
    total: number;
    needingResubmit: number;
    expiringSoon: number;
    expired: number;
  } {
    const all = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM products
      WHERE is_active = 1
      AND storage_provider = 'bulletin'
    `).get() as { count: number };

    const products = this.db.prepare(`
      SELECT bulletin_uploaded_at
      FROM products
      WHERE is_active = 1
      AND storage_provider = 'bulletin'
      AND bulletin_uploaded_at IS NOT NULL
    `).all() as Array<{ bulletin_uploaded_at: string }>;

    let needingResubmit = 0;
    let expiringSoon = 0;
    let expired = 0;

    products.forEach((p) => {
      const timeUntilExpiry = this.bulletin.getTimeUntilExpiry(p.bulletin_uploaded_at);
      const needsResubmit = this.bulletin.needsResubmission(p.bulletin_uploaded_at);

      if (timeUntilExpiry <= 0) {
        expired++;
      } else if (needsResubmit) {
        needingResubmit++;
      } else if (timeUntilExpiry < 2 * 24 * 60 * 60) {
        // Less than 2 days until re-submit threshold
        expiringSoon++;
      }
    });

    return {
      total: all.count,
      needingResubmit,
      expiringSoon,
      expired
    };
  }

  /**
   * Manually trigger re-submission check (for testing/admin)
   */
  async manualResubmit(): Promise<void> {
    logger.info('Manual re-submission triggered');
    await this.checkAndResubmit();
  }
}

/**
 * Usage Example:
 *
 * ```typescript
 * // In server startup (src/server.ts)
 * const bulletin = new BulletinChainStorageService();
 * const ipfs = new IPFSStorageService();
 * const resubmissionService = new BulletinResubmissionService(bulletin, ipfs);
 *
 * // Start background service
 * resubmissionService.start();
 *
 * // Graceful shutdown
 * process.on('SIGTERM', () => {
 *   resubmissionService.stop();
 * });
 * ```
 */
