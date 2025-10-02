#!/usr/bin/env node

/**
 * Storage Migration CLI
 *
 * Migrate product metadata between storage providers (IPFS → Bulletin Chain).
 *
 * Usage:
 *   npm run storage:migrate -- --dry-run
 *   npm run storage:migrate -- --batch-size 20
 *   npm run storage:stats
 */

import { StorageMigrationService } from '../src/services/storage/StorageMigrationService.js';
import { IPFSStorageService } from '../src/services/storage/IPFSStorageService.js';
import { BulletinChainStorageService } from '../src/services/storage/BulletinChainStorageService.js';
import { logger } from '../src/utils/logger.js';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const statsOnly = args.includes('--stats');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 10;

async function showStats() {
  console.log('\n📊 Storage Statistics\n');

  const migrationService = new StorageMigrationService();
  const stats = migrationService.getMigrationStats();

  console.log(`Total Products: ${stats.totalProducts}`);
  console.log(`With Metadata: ${stats.withMetadata}`);
  console.log(`Pending Metadata: ${stats.pendingMetadata}`);
  console.log(`\nProvider Distribution:`);
  console.log(`  IPFS: ${stats.storageProviderStats.ipfs}`);
  console.log(`  Bulletin: ${stats.storageProviderStats.bulletin}`);

  const plan = await migrationService.createMigrationPlan();
  console.log(`\n📋 Migration Plan\n`);
  console.log(`Products to Migrate: ${plan.productsToMigrate}`);
  console.log(`Estimated Time: ${plan.estimatedTime}`);
  console.log(`Estimated Cost: ${plan.estimatedCost}`);
  console.log(`\n💡 Recommendations:`);
  plan.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
  console.log('');
}

async function runMigration() {
  console.log('\n🔄 Storage Migration\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  const migrationService = new StorageMigrationService();
  const ipfs = new IPFSStorageService();
  const bulletin = new BulletinChainStorageService();

  console.log(`Source: ${ipfs.getProviderName()}`);
  console.log(`Destination: ${bulletin.getProviderName()}`);
  console.log(`Batch Size: ${batchSize}`);
  console.log('');

  // Progress bar
  let lastProgress = 0;
  const startTime = Date.now();

  try {
    const result = await migrationService.migrateAllProducts(ipfs, bulletin, {
      batchSize,
      dryRun,
      onProgress: (progress) => {
        if (progress.migrated !== lastProgress) {
          const percent = Math.round((progress.migrated / progress.total) * 100);
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          const rate = progress.migrated / (elapsed || 1);
          const eta = Math.round((progress.total - progress.migrated) / (rate || 1));

          console.log(
            `Progress: ${progress.migrated}/${progress.total} (${percent}%) ` +
            `| Failed: ${progress.failed} | ETA: ${eta}s ` +
            `| Current: ${progress.current}`
          );
          lastProgress = progress.migrated;
        }
      }
    });

    console.log('\n✅ Migration Complete\n');
    console.log(`Total: ${result.total}`);
    console.log(`Migrated: ${result.migrated}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Skipped: ${result.skipped}`);
    console.log(`Time: ${Math.round((Date.now() - startTime) / 1000)}s`);

    if (result.failed > 0) {
      console.log('\n⚠️  Some migrations failed. Check logs for details.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  Storage Migration Tool');
  console.log('═'.repeat(60));

  try {
    if (statsOnly) {
      await showStats();
    } else {
      await showStats();
      console.log('\n' + '─'.repeat(60) + '\n');
      await runMigration();
    }
  } catch (error) {
    logger.error('Migration tool error', error);
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
