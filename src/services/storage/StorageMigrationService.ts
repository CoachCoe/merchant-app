import { IStorageService, ProductMetadata, StoreProfile } from './IStorageService.js';
import { IPFSStorageService } from './IPFSStorageService.js';
import { BulletinChainStorageService } from './BulletinChainStorageService.js';
import { logger } from '../../utils/logger.js';
import { DatabaseService } from '../databaseService.js';

/**
 * Storage Migration Service
 *
 * Utilities for migrating data between storage providers.
 * Primary use case: IPFS → Bulletin Chain migration in Q4 2025.
 */

export interface MigrationProgress {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
  current?: string;
}

export interface MigrationResult {
  success: boolean;
  oldHash: string;
  newHash: string;
  error?: string;
}

export class StorageMigrationService {
  private db = DatabaseService.getInstance().getDatabase();

  /**
   * Migrate all product metadata from one storage provider to another
   */
  async migrateAllProducts(
    source: IStorageService,
    destination: IStorageService,
    options: {
      batchSize?: number;
      dryRun?: boolean;
      onProgress?: (progress: MigrationProgress) => void;
    } = {}
  ): Promise<MigrationProgress> {
    const { batchSize = 10, dryRun = false, onProgress } = options;

    logger.info('Starting product metadata migration', {
      source: source.getProviderName(),
      destination: destination.getProviderName(),
      dryRun
    });

    // Get all products with IPFS hashes
    const products = this.db.prepare(`
      SELECT id, ipfs_metadata_hash as hash, title
      FROM products
      WHERE ipfs_metadata_hash IS NOT NULL
      AND ipfs_metadata_hash != 'pending'
    `).all() as Array<{ id: string; hash: string; title: string }>;

    const progress: MigrationProgress = {
      total: products.length,
      migrated: 0,
      failed: 0,
      skipped: 0
    };

    // Process in batches
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      for (const product of batch) {
        progress.current = product.title;

        if (onProgress) {
          onProgress(progress);
        }

        try {
          const result = await this.migrateProductMetadata(
            product.hash,
            source,
            destination,
            dryRun
          );

          if (result.success) {
            if (!dryRun) {
              // Update database with new hash
              this.db.prepare(`
                UPDATE products
                SET ipfs_metadata_hash = ?
                WHERE id = ?
              `).run(result.newHash, product.id);
            }
            progress.migrated++;
          } else {
            progress.failed++;
            logger.error('Product migration failed', {
              productId: product.id,
              error: result.error
            });
          }
        } catch (error) {
          progress.failed++;
          logger.error('Product migration exception', {
            productId: product.id,
            error
          });
        }
      }

      // Small delay between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info('Product metadata migration completed', progress);

    if (onProgress) {
      onProgress(progress);
    }

    return progress;
  }

  /**
   * Migrate a single product metadata entry
   */
  async migrateProductMetadata(
    oldHash: string,
    source: IStorageService,
    destination: IStorageService,
    dryRun: boolean = false
  ): Promise<MigrationResult> {
    try {
      // Fetch from source
      const metadata = await source.fetchProductMetadata(oldHash);

      if (dryRun) {
        logger.debug('Dry run: Would migrate product', {
          oldHash,
          productId: metadata.id
        });
        return { success: true, oldHash, newHash: oldHash };
      }

      // Upload to destination
      const result = await destination.uploadProductMetadata(metadata);

      logger.info('Product metadata migrated', {
        productId: metadata.id,
        oldHash,
        newHash: result.hash,
        source: source.getProviderName(),
        destination: destination.getProviderName()
      });

      return {
        success: true,
        oldHash,
        newHash: result.hash
      };
    } catch (error) {
      return {
        success: false,
        oldHash,
        newHash: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify migration integrity by comparing content
   */
  async verifyMigration(
    oldHash: string,
    newHash: string,
    source: IStorageService,
    destination: IStorageService
  ): Promise<boolean> {
    try {
      const sourceMetadata = await source.fetchProductMetadata(oldHash);
      const destMetadata = await destination.fetchProductMetadata(newHash);

      // Compare critical fields
      const isValid =
        sourceMetadata.id === destMetadata.id &&
        sourceMetadata.name === destMetadata.name &&
        sourceMetadata.description === destMetadata.description &&
        JSON.stringify(sourceMetadata.images) === JSON.stringify(destMetadata.images);

      if (!isValid) {
        logger.error('Migration verification failed: metadata mismatch', {
          oldHash,
          newHash
        });
      }

      return isValid;
    } catch (error) {
      logger.error('Migration verification failed: fetch error', {
        oldHash,
        newHash,
        error
      });
      return false;
    }
  }

  /**
   * Get migration statistics from database
   */
  getMigrationStats(): {
    totalProducts: number;
    withMetadata: number;
    pendingMetadata: number;
    storageProviderStats: { [key: string]: number };
  } {
    const totalProducts = this.db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };

    const withMetadata = this.db.prepare(`
      SELECT COUNT(*) as count FROM products
      WHERE ipfs_metadata_hash IS NOT NULL
      AND ipfs_metadata_hash != 'pending'
    `).get() as { count: number };

    const pendingMetadata = this.db.prepare(`
      SELECT COUNT(*) as count FROM products
      WHERE ipfs_metadata_hash = 'pending'
      OR ipfs_metadata_hash IS NULL
    `).get() as { count: number };

    return {
      totalProducts: totalProducts.count,
      withMetadata: withMetadata.count,
      pendingMetadata: pendingMetadata.count,
      storageProviderStats: {
        // Could track provider per hash if we add metadata
        ipfs: withMetadata.count,
        bulletin: 0
      }
    };
  }

  /**
   * Create a migration plan for IPFS → Bulletin Chain
   */
  async createMigrationPlan(): Promise<{
    estimatedTime: string;
    estimatedCost: string;
    productsToMigrate: number;
    recommendations: string[];
  }> {
    const stats = this.getMigrationStats();

    // Rough estimates (adjust based on actual Bulletin Chain performance)
    const productsPerMinute = 10;
    const estimatedMinutes = Math.ceil(stats.withMetadata / productsPerMinute);

    const recommendations = [
      'Test migration on a few products first',
      'Use dual-write mode during transition period',
      'Keep IPFS as fallback for 30 days',
      'Monitor Bulletin Chain TTL expiration (2 weeks default)',
      'Consider cost per transaction on Bulletin Chain'
    ];

    if (stats.withMetadata > 1000) {
      recommendations.push('Consider migrating in multiple batches over several days');
    }

    return {
      estimatedTime: `${estimatedMinutes} minutes`,
      estimatedCost: 'TBD (depends on Bulletin Chain fees)',
      productsToMigrate: stats.withMetadata,
      recommendations
    };
  }
}

/**
 * CLI-friendly migration runner
 *
 * Usage example:
 * ```typescript
 * const migrationService = new StorageMigrationService();
 * const ipfs = new IPFSStorageService();
 * const bulletin = new BulletinChainStorageService();
 *
 * // Dry run
 * await migrationService.migrateAllProducts(ipfs, bulletin, {
 *   dryRun: true,
 *   onProgress: (progress) => {
 *     console.log(`Progress: ${progress.migrated}/${progress.total}`);
 *   }
 * });
 *
 * // Actual migration
 * await migrationService.migrateAllProducts(ipfs, bulletin, {
 *   batchSize: 20,
 *   onProgress: (progress) => {
 *     console.log(`Migrated: ${progress.migrated}, Failed: ${progress.failed}`);
 *   }
 * });
 * ```
 */
