/**
 * Storage Service Interface
 *
 * Abstract interface for decentralized storage providers.
 * Supports multiple backends: IPFS (Pinata), Bulletin Chain, etc.
 */

export interface ProductMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  variants?: Array<{
    name: string;
    value: string;
    stock?: number;
  }>;
  delivery_type: string;
  delivery_instructions?: string;
  created_at: string;
}

export interface StoreProfile {
  store_id: string;
  name: string;
  description?: string;
  banner_image?: string;
  logo?: string;
  owner_wallet: string;
  contact?: {
    email?: string;
    website?: string;
  };
  created_at: string;
}

export interface StorageMetadata {
  hash: string;
  provider: 'ipfs' | 'bulletin';
  uploaded_at: string;
  size_bytes?: number;
  ttl_seconds?: number; // For Bulletin Chain ephemeral storage
}

export interface StorageUploadResult {
  hash: string;
  url: string;
  metadata: StorageMetadata;
}

/**
 * Main storage service interface
 * All storage providers (IPFS, Bulletin Chain) must implement this interface
 */
export interface IStorageService {
  /**
   * Upload product metadata to decentralized storage
   * @param metadata Product metadata object
   * @returns Storage hash and metadata
   */
  uploadProductMetadata(metadata: ProductMetadata): Promise<StorageUploadResult>;

  /**
   * Upload store profile to decentralized storage
   * @param profile Store profile object
   * @returns Storage hash and metadata
   */
  uploadStoreProfile(profile: StoreProfile): Promise<StorageUploadResult>;

  /**
   * Upload an image file to decentralized storage
   * @param imageBuffer Image file buffer
   * @param filename Original filename
   * @returns Storage hash and metadata
   */
  uploadImage(imageBuffer: Buffer, filename: string): Promise<StorageUploadResult>;

  /**
   * Fetch product metadata from decentralized storage
   * @param hash Storage hash (IPFS CID or Bulletin transaction hash)
   * @returns Product metadata object
   */
  fetchProductMetadata(hash: string): Promise<ProductMetadata>;

  /**
   * Fetch store profile from decentralized storage
   * @param hash Storage hash
   * @returns Store profile object
   */
  fetchStoreProfile(hash: string): Promise<StoreProfile>;

  /**
   * Get a public URL for accessing stored content
   * @param hash Storage hash
   * @returns Public URL
   */
  getContentUrl(hash: string): string;

  /**
   * Check if content is available
   * @param hash Storage hash
   * @returns True if content is accessible
   */
  isContentAvailable(hash: string): Promise<boolean>;

  /**
   * Get storage provider name
   */
  getProviderName(): string;

  /**
   * Get storage provider type
   */
  getProviderType(): 'ipfs' | 'bulletin';
}
