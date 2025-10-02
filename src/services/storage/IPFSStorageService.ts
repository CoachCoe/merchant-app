import pinataSDK from '@pinata/sdk';
import { logger } from '../../utils/logger.js';
import {
  IStorageService,
  ProductMetadata,
  StoreProfile,
  StorageUploadResult,
  StorageMetadata
} from './IStorageService.js';

/**
 * IPFS Storage Service Implementation (via Pinata)
 *
 * Production-ready implementation using Pinata as the IPFS provider.
 * Supports gateway fallback for content retrieval.
 */
export class IPFSStorageService implements IStorageService {
  private pinata: any;
  private gateways: string[];

  constructor() {
    const apiKey = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_API_KEY;

    if (apiKey && secretKey) {
      this.pinata = new pinataSDK(apiKey, secretKey);
      logger.info('IPFS Storage Service initialized with Pinata');
    } else {
      logger.warn('IPFS Storage Service initialized without Pinata credentials - uploads will fail');
    }

    this.gateways = [
      process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs',
      'https://ipfs.io/ipfs',
      'https://cloudflare-ipfs.com/ipfs'
    ];
  }

  async uploadProductMetadata(metadata: ProductMetadata): Promise<StorageUploadResult> {
    if (!this.pinata) {
      throw new Error('IPFS service not configured - missing Pinata credentials');
    }

    try {
      const result = await this.pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: `product-${metadata.id}`,
        },
      });

      logger.info('Product metadata uploaded to IPFS', {
        productId: metadata.id,
        ipfsHash: result.IpfsHash
      });

      return {
        hash: result.IpfsHash,
        url: this.getContentUrl(result.IpfsHash),
        metadata: {
          hash: result.IpfsHash,
          provider: 'ipfs',
          uploaded_at: new Date().toISOString(),
          size_bytes: result.PinSize
        }
      };
    } catch (error) {
      logger.error('Failed to upload product metadata to IPFS', error);
      throw new Error('IPFS upload failed');
    }
  }

  async uploadStoreProfile(profile: StoreProfile): Promise<StorageUploadResult> {
    if (!this.pinata) {
      throw new Error('IPFS service not configured - missing Pinata credentials');
    }

    try {
      const result = await this.pinata.pinJSONToIPFS(profile, {
        pinataMetadata: {
          name: `store-${profile.store_id}`,
        },
      });

      logger.info('Store profile uploaded to IPFS', {
        storeId: profile.store_id,
        ipfsHash: result.IpfsHash
      });

      return {
        hash: result.IpfsHash,
        url: this.getContentUrl(result.IpfsHash),
        metadata: {
          hash: result.IpfsHash,
          provider: 'ipfs',
          uploaded_at: new Date().toISOString(),
          size_bytes: result.PinSize
        }
      };
    } catch (error) {
      logger.error('Failed to upload store profile to IPFS', error);
      throw new Error('IPFS upload failed');
    }
  }

  async uploadImage(imageBuffer: Buffer, filename: string): Promise<StorageUploadResult> {
    if (!this.pinata) {
      throw new Error('IPFS service not configured - missing Pinata credentials');
    }

    try {
      const result = await this.pinata.pinFileToIPFS(imageBuffer, {
        pinataMetadata: {
          name: filename,
        },
      });

      logger.info('Image uploaded to IPFS', { filename, ipfsHash: result.IpfsHash });

      return {
        hash: result.IpfsHash,
        url: this.getContentUrl(result.IpfsHash),
        metadata: {
          hash: result.IpfsHash,
          provider: 'ipfs',
          uploaded_at: new Date().toISOString(),
          size_bytes: result.PinSize
        }
      };
    } catch (error) {
      logger.error('Failed to upload image to IPFS', error);
      throw new Error('IPFS image upload failed');
    }
  }

  async fetchProductMetadata(ipfsHash: string): Promise<ProductMetadata> {
    for (const gateway of this.gateways) {
      try {
        const url = `${gateway}/${ipfsHash}`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const metadata = await response.json();
          logger.debug('Product metadata fetched from IPFS', { ipfsHash, gateway });
          return metadata;
        }
      } catch (error) {
        logger.warn(`Gateway ${gateway} failed for ${ipfsHash}, trying next...`, error);
      }
    }

    throw new Error('Failed to fetch from all IPFS gateways');
  }

  async fetchStoreProfile(ipfsHash: string): Promise<StoreProfile> {
    for (const gateway of this.gateways) {
      try {
        const url = `${gateway}/${ipfsHash}`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const profile = await response.json();
          logger.debug('Store profile fetched from IPFS', { ipfsHash, gateway });
          return profile;
        }
      } catch (error) {
        logger.warn(`Gateway ${gateway} failed for ${ipfsHash}, trying next...`, error);
      }
    }

    throw new Error('Failed to fetch from all IPFS gateways');
  }

  getContentUrl(ipfsHash: string): string {
    return `${this.gateways[0]}/${ipfsHash}`;
  }

  async isContentAvailable(ipfsHash: string): Promise<boolean> {
    try {
      const url = `${this.gateways[0]}/${ipfsHash}`;
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch (error) {
      logger.debug(`Content availability check failed for ${ipfsHash}`, error);
      return false;
    }
  }

  getProviderName(): string {
    return 'IPFS (Pinata)';
  }

  getProviderType(): 'ipfs' | 'bulletin' {
    return 'ipfs';
  }
}
