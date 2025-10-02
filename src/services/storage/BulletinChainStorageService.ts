import { ApiPromise, WsProvider } from '@polkadot/api';
import { logger } from '../../utils/logger.js';
import {
  IStorageService,
  ProductMetadata,
  StoreProfile,
  StorageUploadResult,
  StorageMetadata
} from './IStorageService.js';

/**
 * Bulletin Chain Storage Service Implementation
 *
 * Provides ephemeral storage (2 weeks default) via Polkadot Bulletin Chain.
 * Data is stored on-chain and published to IPFS via Bitswap protocol.
 *
 * Status: STUB IMPLEMENTATION - Ready for Q4 2025 when Bulletin Chain launches
 *
 * Documentation:
 * - GitHub: https://github.com/paritytech/polkadot-bulletin-chain
 * - Design Doc: Internal Parity docs
 *
 * Key Features:
 * - Blockchain-verified storage with IPFS backend
 * - Time-limited storage (configurable, default 2 weeks)
 * - Uses transactionStorage.store extrinsic
 * - Bridged to Polkadot People Chain for PoP integration
 */
export class BulletinChainStorageService implements IStorageService {
  private api: ApiPromise | null = null;
  private wsEndpoint: string;
  private defaultTTL: number = 14 * 24 * 60 * 60; // 2 weeks in seconds
  private resubmitThreshold: number = 10 * 24 * 60 * 60; // 10 days in seconds (before expiry)
  private ipfsGateways: string[];

  constructor() {
    // TODO: Update with actual Bulletin Chain endpoint when available
    this.wsEndpoint = process.env.BULLETIN_CHAIN_WS_ENDPOINT || 'wss://bulletin-rpc.polkadot.io';

    this.ipfsGateways = [
      'https://ipfs.io/ipfs',
      'https://cloudflare-ipfs.com/ipfs'
    ];

    logger.info('Bulletin Chain Storage Service initialized (stub mode)');
  }

  /**
   * Initialize connection to Bulletin Chain
   * TODO: Implement when Bulletin Chain is live
   */
  private async initApi(): Promise<void> {
    if (this.api) return;

    try {
      const provider = new WsProvider(this.wsEndpoint);
      this.api = await ApiPromise.create({ provider });
      logger.info('Connected to Bulletin Chain', { endpoint: this.wsEndpoint });
    } catch (error) {
      logger.error('Failed to connect to Bulletin Chain', error);
      throw new Error('Bulletin Chain connection failed');
    }
  }

  async uploadProductMetadata(metadata: ProductMetadata): Promise<StorageUploadResult> {
    // TODO: Implement when Bulletin Chain API is available
    // Expected flow:
    // 1. Serialize metadata to bytes
    // 2. Call transactionStorage.store(data, ttl)
    // 3. Wait for transaction inclusion
    // 4. Extract IPFS CID from transaction
    // 5. Return storage result

    throw new Error(
      'BulletinChainStorageService.uploadProductMetadata not yet implemented. ' +
      'Bulletin Chain is launching Q4 2025. Use IPFSStorageService for now.'
    );

    // Placeholder implementation for reference:
    /*
    await this.initApi();

    const dataBytes = new TextEncoder().encode(JSON.stringify(metadata));

    const tx = this.api!.tx.transactionStorage.store(dataBytes, this.defaultTTL);

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, events }) => {
        if (status.isInBlock) {
          // Extract IPFS CID from events
          const ipfsCid = extractIpfsCidFromEvents(events);

          resolve({
            hash: ipfsCid,
            url: this.getContentUrl(ipfsCid),
            metadata: {
              hash: ipfsCid,
              provider: 'bulletin',
              uploaded_at: new Date().toISOString(),
              ttl_seconds: this.defaultTTL
            }
          });
        }
      });
    });
    */
  }

  async uploadStoreProfile(profile: StoreProfile): Promise<StorageUploadResult> {
    // TODO: Implement similar to uploadProductMetadata
    throw new Error(
      'BulletinChainStorageService.uploadStoreProfile not yet implemented. ' +
      'Use IPFSStorageService for now.'
    );
  }

  async uploadImage(imageBuffer: Buffer, filename: string): Promise<StorageUploadResult> {
    // TODO: Implement image upload to Bulletin Chain
    // Note: May need chunking for large images (Bulletin max ~8-10 MiB per block)
    throw new Error(
      'BulletinChainStorageService.uploadImage not yet implemented. ' +
      'Use IPFSStorageService for now.'
    );
  }

  async fetchProductMetadata(hash: string): Promise<ProductMetadata> {
    // TODO: Implement when Bulletin Chain is live
    // Expected flow:
    // 1. Query Bulletin Chain for transaction by hash
    // 2. If not found or expired, try IPFS gateways (Bulletin publishes to IPFS)
    // 3. Deserialize and return metadata

    // For now, try IPFS gateways (Bulletin uses IPFS backend)
    for (const gateway of this.ipfsGateways) {
      try {
        const url = `${gateway}/${hash}`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const metadata = await response.json();
          logger.debug('Product metadata fetched via IPFS gateway', { hash, gateway });
          return metadata;
        }
      } catch (error) {
        logger.warn(`Gateway ${gateway} failed for ${hash}, trying next...`, error);
      }
    }

    throw new Error('Failed to fetch from Bulletin Chain or IPFS gateways');
  }

  async fetchStoreProfile(hash: string): Promise<StoreProfile> {
    // TODO: Implement similar to fetchProductMetadata
    for (const gateway of this.ipfsGateways) {
      try {
        const url = `${gateway}/${hash}`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const profile = await response.json();
          logger.debug('Store profile fetched via IPFS gateway', { hash, gateway });
          return profile;
        }
      } catch (error) {
        logger.warn(`Gateway ${gateway} failed for ${hash}, trying next...`, error);
      }
    }

    throw new Error('Failed to fetch from Bulletin Chain or IPFS gateways');
  }

  getContentUrl(hash: string): string {
    // Return IPFS gateway URL since Bulletin publishes to IPFS
    return `${this.ipfsGateways[0]}/${hash}`;
  }

  async isContentAvailable(hash: string): Promise<boolean> {
    // TODO: Query Bulletin Chain first, then fall back to IPFS
    try {
      const url = `${this.ipfsGateways[0]}/${hash}`;
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch (error) {
      logger.debug(`Content availability check failed for ${hash}`, error);
      return false;
    }
  }

  getProviderName(): string {
    return 'Polkadot Bulletin Chain';
  }

  getProviderType(): 'ipfs' | 'bulletin' {
    return 'bulletin';
  }

  /**
   * Check if content needs re-submission to Bulletin Chain
   * Returns true if content was uploaded more than 10 days ago (approaching 14-day expiry)
   */
  needsResubmission(uploadedAt: string): boolean {
    const uploadTime = new Date(uploadedAt).getTime();
    const now = Date.now();
    const ageSeconds = (now - uploadTime) / 1000;

    return ageSeconds >= this.resubmitThreshold;
  }

  /**
   * Get time until re-submission is needed (in seconds)
   */
  getTimeUntilResubmission(uploadedAt: string): number {
    const uploadTime = new Date(uploadedAt).getTime();
    const now = Date.now();
    const ageSeconds = (now - uploadTime) / 1000;
    const remaining = this.resubmitThreshold - ageSeconds;

    return Math.max(0, remaining);
  }

  /**
   * Get time until content expires (in seconds)
   */
  getTimeUntilExpiry(uploadedAt: string): number {
    const uploadTime = new Date(uploadedAt).getTime();
    const now = Date.now();
    const ageSeconds = (now - uploadTime) / 1000;
    const remaining = this.defaultTTL - ageSeconds;

    return Math.max(0, remaining);
  }

  /**
   * Disconnect from Bulletin Chain
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
      logger.info('Disconnected from Bulletin Chain');
    }
  }
}

/**
 * Implementation Notes for Q4 2025:
 *
 * When Bulletin Chain launches, implement these methods:
 *
 * 1. Upload Flow:
 *    - Use transactionStorage.store(data, ttl) extrinsic
 *    - Wait for InBlock status
 *    - Extract IPFS CID from TransactionStored event
 *    - Return both transaction hash and IPFS CID
 *
 * 2. Fetch Flow:
 *    - First try: Query Bulletin node directly
 *    - Second try: IPFS gateways (Bulletin publishes via Bitswap)
 *    - Handle TTL expiration gracefully
 *
 * 3. Authorization:
 *    - May need transactionStorage.authorize_preimage for some use cases
 *    - Check if permissionless or requires authorization
 *
 * 4. Fee Management:
 *    - Storage fees paid in DOT (bridged from People Chain)
 *    - Implement fee estimation: estimateStorageFee(dataSize)
 *
 * 5. TTL Management:
 *    - Default: 2 weeks (1,209,600 seconds)
 *    - Configurable per upload type (products vs temp data)
 *    - Track expiration in database
 *
 * 6. Bridge Integration:
 *    - If using People Chain as proxy, route through XCM
 *    - Direct connection to Bulletin if preferred
 *
 * References:
 * - Bulletin repo: https://github.com/paritytech/polkadot-bulletin-chain
 * - Transaction storage pallet: Check runtime docs when available
 * - IPFS integration: Uses litep2p with Bitswap protocol
 */
