import { IStorageService } from './IStorageService.js';
import { IPFSStorageService } from './IPFSStorageService.js';
import { BulletinChainStorageService } from './BulletinChainStorageService.js';
import { logger } from '../../utils/logger.js';

export type StorageProvider = 'ipfs' | 'bulletin' | 'auto';

/**
 * Storage Service Factory
 *
 * Creates the appropriate storage service based on configuration.
 * Supports automatic fallback and dual-write strategies for migration.
 */
export class StorageServiceFactory {
  private static instance: IStorageService | null = null;
  private static provider: StorageProvider = 'auto';

  /**
   * Get the configured storage service instance (singleton)
   */
  static getInstance(): IStorageService {
    if (!this.instance) {
      this.instance = this.createStorageService();
    }
    return this.instance;
  }

  /**
   * Create a new storage service based on configuration
   */
  static createStorageService(provider?: StorageProvider): IStorageService {
    const selectedProvider = provider || this.getProviderFromConfig();

    switch (selectedProvider) {
      case 'ipfs':
        logger.info('Storage Service: Using IPFS (Pinata)');
        return new IPFSStorageService();

      case 'bulletin':
        logger.info('Storage Service: Using Bulletin Chain');
        return new BulletinChainStorageService();

      case 'auto':
      default:
        return this.autoSelectProvider();
    }
  }

  /**
   * Auto-select storage provider based on availability
   * Priority: IPFS (production-ready) > Bulletin Chain (Q4 2025)
   */
  private static autoSelectProvider(): IStorageService {
    const bulletinEnabled = process.env.BULLETIN_CHAIN_ENABLED === 'true';
    const bulletinEndpoint = process.env.BULLETIN_CHAIN_WS_ENDPOINT;

    // Check if Bulletin Chain is enabled and configured
    if (bulletinEnabled && bulletinEndpoint) {
      logger.info('Storage Service: Auto-selected Bulletin Chain (enabled in config)');
      return new BulletinChainStorageService();
    }

    // Default to IPFS (production-ready)
    logger.info('Storage Service: Auto-selected IPFS (default)');
    return new IPFSStorageService();
  }

  /**
   * Get provider from environment configuration
   */
  private static getProviderFromConfig(): StorageProvider {
    const configProvider = process.env.STORAGE_PROVIDER?.toLowerCase() as StorageProvider;

    if (configProvider === 'ipfs' || configProvider === 'bulletin' || configProvider === 'auto') {
      return configProvider;
    }

    return 'auto';
  }

  /**
   * Create a dual-write wrapper for migration scenarios
   * Writes to both IPFS and Bulletin Chain, reads from primary
   */
  static createDualWriteService(
    primary: IStorageService,
    secondary: IStorageService
  ): IStorageService {
    return new DualWriteStorageService(primary, secondary);
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}

/**
 * Dual-Write Storage Service
 *
 * Writes to both storage providers (IPFS + Bulletin) for migration.
 * Reads from primary provider with fallback to secondary.
 */
class DualWriteStorageService implements IStorageService {
  constructor(
    private primary: IStorageService,
    private secondary: IStorageService
  ) {
    logger.info('Storage Service: Dual-write mode enabled', {
      primary: primary.getProviderName(),
      secondary: secondary.getProviderName()
    });
  }

  async uploadProductMetadata(metadata: any) {
    // Upload to primary first
    const primaryResult = await this.primary.uploadProductMetadata(metadata);

    // Try uploading to secondary (non-blocking)
    this.secondary.uploadProductMetadata(metadata)
      .then((secondaryResult) => {
        logger.info('Dual-write: Secondary upload successful', {
          primary: primaryResult.hash,
          secondary: secondaryResult.hash
        });
      })
      .catch((error) => {
        logger.warn('Dual-write: Secondary upload failed (non-critical)', error);
      });

    return primaryResult;
  }

  async uploadStoreProfile(profile: any) {
    const primaryResult = await this.primary.uploadStoreProfile(profile);

    this.secondary.uploadStoreProfile(profile)
      .catch((error) => {
        logger.warn('Dual-write: Secondary upload failed (non-critical)', error);
      });

    return primaryResult;
  }

  async uploadImage(imageBuffer: Buffer, filename: string) {
    const primaryResult = await this.primary.uploadImage(imageBuffer, filename);

    this.secondary.uploadImage(imageBuffer, filename)
      .catch((error) => {
        logger.warn('Dual-write: Secondary upload failed (non-critical)', error);
      });

    return primaryResult;
  }

  async fetchProductMetadata(hash: string) {
    try {
      return await this.primary.fetchProductMetadata(hash);
    } catch (error) {
      logger.warn('Primary fetch failed, trying secondary', { hash });
      return await this.secondary.fetchProductMetadata(hash);
    }
  }

  async fetchStoreProfile(hash: string) {
    try {
      return await this.primary.fetchStoreProfile(hash);
    } catch (error) {
      logger.warn('Primary fetch failed, trying secondary', { hash });
      return await this.secondary.fetchStoreProfile(hash);
    }
  }

  getContentUrl(hash: string): string {
    return this.primary.getContentUrl(hash);
  }

  async isContentAvailable(hash: string): Promise<boolean> {
    const primaryAvailable = await this.primary.isContentAvailable(hash);
    if (primaryAvailable) return true;

    return await this.secondary.isContentAvailable(hash);
  }

  getProviderName(): string {
    return `Dual-Write (${this.primary.getProviderName()} + ${this.secondary.getProviderName()})`;
  }

  getProviderType(): 'ipfs' | 'bulletin' {
    return this.primary.getProviderType();
  }
}
