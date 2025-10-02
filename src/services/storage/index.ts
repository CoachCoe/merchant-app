/**
 * Storage Service Exports
 *
 * Centralized exports for storage abstraction layer.
 * Use StorageServiceFactory.getInstance() in application code.
 */

export { IStorageService, ProductMetadata, StoreProfile, StorageUploadResult, StorageMetadata } from './IStorageService.js';
export { IPFSStorageService } from './IPFSStorageService.js';
export { BulletinChainStorageService } from './BulletinChainStorageService.js';
export { StorageServiceFactory, StorageProvider } from './StorageServiceFactory.js';

/**
 * Quick Start:
 *
 * ```typescript
 * import { StorageServiceFactory } from './services/storage';
 *
 * // Get configured storage service (IPFS or Bulletin Chain)
 * const storage = StorageServiceFactory.getInstance();
 *
 * // Upload product metadata
 * const result = await storage.uploadProductMetadata({
 *   id: 'prod-123',
 *   name: 'My Product',
 *   description: 'Great product',
 *   category: 'electronics',
 *   images: ['ipfs://...'],
 *   delivery_type: 'digital',
 *   created_at: new Date().toISOString()
 * });
 *
 * console.log('Stored at:', result.hash);
 * console.log('Public URL:', result.url);
 * ```
 */
