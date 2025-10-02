# Storage Abstraction Layer

## Overview

The storage abstraction layer provides a flexible interface for decentralized storage, supporting multiple backends (IPFS and Polkadot Bulletin Chain). This architecture allows seamless migration between storage providers without changing application code.

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Application Layer                       │
│  (ProductService, ProductMetadataService)       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│      StorageServiceFactory                      │
│      (Provider Selection & Configuration)        │
└────────┬────────────────────────────────────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ IPFS Storage │ │ Bulletin     │ │ Dual-Write   │
│ (Pinata)     │ │ Chain Storage│ │ Service      │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Components

### 1. IStorageService Interface

Core interface that all storage providers must implement:

```typescript
interface IStorageService {
  uploadProductMetadata(metadata: ProductMetadata): Promise<StorageUploadResult>;
  uploadStoreProfile(profile: StoreProfile): Promise<StorageUploadResult>;
  uploadImage(imageBuffer: Buffer, filename: string): Promise<StorageUploadResult>;
  fetchProductMetadata(hash: string): Promise<ProductMetadata>;
  fetchStoreProfile(hash: string): Promise<StoreProfile>;
  getContentUrl(hash: string): string;
  isContentAvailable(hash: string): Promise<boolean>;
  getProviderName(): string;
  getProviderType(): 'ipfs' | 'bulletin';
}
```

### 2. Storage Providers

#### IPFSStorageService
- **Status**: Production Ready ✅
- **Provider**: Pinata
- **Features**:
  - Permanent storage
  - Multiple gateway fallback
  - Proven reliability
- **Use Case**: Current production storage

#### BulletinChainStorageService
- **Status**: Stub Implementation (Q4 2025) 🚧
- **Provider**: Polkadot Bulletin Chain
- **Features**:
  - Blockchain-verified storage
  - Time-limited (2 weeks default)
  - IPFS backend with on-chain proof
- **Use Case**: Future integration when Bulletin Chain launches

### 3. StorageServiceFactory

Manages provider selection and instantiation:

```typescript
// Get configured storage service
const storage = StorageServiceFactory.getInstance();

// Create specific provider
const ipfs = StorageServiceFactory.createStorageService('ipfs');
const bulletin = StorageServiceFactory.createStorageService('bulletin');
```

### 4. ProductMetadataService

High-level service for application use:

```typescript
const metadataService = new ProductMetadataService();

// Upload product metadata
const hash = await metadataService.uploadProductMetadata(product);

// Fetch product metadata
const metadata = await metadataService.fetchProductMetadata(hash);
```

### 5. StorageMigrationService

Utilities for migrating between storage providers:

```typescript
const migrationService = new StorageMigrationService();

// Dry run
const plan = await migrationService.createMigrationPlan();

// Migrate all products
await migrationService.migrateAllProducts(ipfsService, bulletinService, {
  batchSize: 20,
  dryRun: false,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.migrated}/${progress.total}`);
  }
});
```

## Configuration

### Environment Variables

```bash
# Storage Provider Selection
STORAGE_PROVIDER=auto  # Options: 'ipfs', 'bulletin', 'auto'

# IPFS Configuration (Production)
PINATA_API_KEY=your_api_key
PINATA_SECRET_API_KEY=your_secret_key
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs

# Bulletin Chain Configuration (Q4 2025)
BULLETIN_CHAIN_ENABLED=false
BULLETIN_CHAIN_WS_ENDPOINT=wss://bulletin-rpc.polkadot.io
```

### Provider Selection Logic

1. **Explicit**: Set `STORAGE_PROVIDER=ipfs` or `STORAGE_PROVIDER=bulletin`
2. **Auto** (default):
   - Checks if Bulletin Chain is enabled and configured
   - Falls back to IPFS (production-ready default)

## Usage Examples

### Current Usage (IPFS)

```typescript
import { StorageServiceFactory } from './services/storage';

// Get configured storage (defaults to IPFS)
const storage = StorageServiceFactory.getInstance();

// Upload product metadata
const result = await storage.uploadProductMetadata({
  id: 'prod-123',
  name: 'My Product',
  description: 'Great product',
  category: 'electronics',
  images: ['ipfs://...'],
  delivery_type: 'digital',
  created_at: new Date().toISOString()
});

console.log('Hash:', result.hash);
console.log('URL:', result.url);
console.log('Provider:', storage.getProviderName()); // "IPFS (Pinata)"
```

### Future Usage (Bulletin Chain)

When Bulletin Chain launches in Q4 2025, simply update `.env`:

```bash
STORAGE_PROVIDER=bulletin
BULLETIN_CHAIN_ENABLED=true
BULLETIN_CHAIN_WS_ENDPOINT=wss://bulletin-rpc.polkadot.io
```

No code changes needed! The abstraction layer handles the switch.

### Dual-Write Mode (Migration)

For gradual migration, use dual-write mode:

```typescript
import { StorageServiceFactory, IPFSStorageService, BulletinChainStorageService } from './services/storage';

const ipfs = new IPFSStorageService();
const bulletin = new BulletinChainStorageService();

// Write to both, read from Bulletin (primary)
const dualWriteStorage = StorageServiceFactory.createDualWriteService(
  bulletin,  // primary
  ipfs       // secondary backup
);

// Uploads go to both providers
const result = await dualWriteStorage.uploadProductMetadata(metadata);
// Returns Bulletin hash, but also uploaded to IPFS in background
```

## Migration Strategy

### Phase 1: Current State (Q3 2025)
- ✅ Use IPFS (Pinata) exclusively
- ✅ Storage abstraction layer ready
- ✅ All code uses abstraction, not direct IPFS calls

### Phase 2: Bulletin Chain Integration (Q4 2025)
When Bulletin Chain launches:

1. **Testing** (1 week)
   - Test Bulletin integration on testnet
   - Verify API compatibility
   - Benchmark performance

2. **Dual-Write** (2-4 weeks)
   - Enable dual-write mode
   - New uploads go to both IPFS + Bulletin
   - Monitor Bulletin stability
   - Keep IPFS as fallback

3. **Migration** (2-4 weeks)
   - Run migration script for existing products
   - Verify data integrity
   - Update database hashes

4. **Bulletin Primary** (ongoing)
   - Switch to Bulletin as primary
   - Keep IPFS for legacy/expired content
   - Monitor TTL expiration (2 weeks)

### Migration Commands

```bash
# Check migration stats
npm run storage:stats

# Dry run migration
npm run storage:migrate -- --dry-run

# Actual migration with progress
npm run storage:migrate -- --batch-size 20

# Verify migration integrity
npm run storage:verify
```

## Bulletin Chain Implementation Notes

When implementing Bulletin Chain in Q4 2025, update `BulletinChainStorageService.ts`:

### Key Implementation Points

1. **Upload Flow**:
   ```typescript
   // Use transactionStorage.store extrinsic
   const tx = api.tx.transactionStorage.store(dataBytes, ttl);
   const result = await tx.signAndSend(signer);

   // Extract IPFS CID from TransactionStored event
   const ipfsCid = extractFromEvent(result.events);
   ```

2. **Authorization** (if required):
   ```typescript
   // Pre-authorize data upload
   await api.tx.transactionStorage.authorize_preimage(dataHash);
   ```

3. **TTL Management**:
   - Default: 2 weeks (1,209,600 seconds)
   - Track expiration in database
   - Implement re-upload for important data

4. **Fee Estimation**:
   ```typescript
   const fee = await api.tx.transactionStorage.store(data, ttl).paymentInfo(sender);
   ```

5. **Bridge Integration**:
   - If using People Chain as proxy, route through XCM
   - Direct connection may be preferred for lower latency

## File Structure

```
src/services/storage/
├── IStorageService.ts              # Core interface
├── IPFSStorageService.ts           # IPFS implementation (production)
├── BulletinChainStorageService.ts  # Bulletin stub (Q4 2025)
├── StorageServiceFactory.ts        # Provider selection
├── StorageMigrationService.ts      # Migration utilities
└── index.ts                        # Exports

src/services/
├── productMetadataService.ts       # High-level wrapper
└── ipfsService.ts                  # Legacy (to be deprecated)
```

## Benefits

1. **Provider Independence**: Switch storage backends without code changes
2. **Future-Proof**: Ready for Bulletin Chain integration
3. **Gradual Migration**: Dual-write and batch migration support
4. **Testing**: Easy to mock storage for tests
5. **Flexibility**: Per-environment provider configuration

## Testing

```typescript
import { StorageServiceFactory } from './services/storage';

// Test with IPFS
StorageServiceFactory.reset();
process.env.STORAGE_PROVIDER = 'ipfs';
const ipfsStorage = StorageServiceFactory.getInstance();

// Test with Bulletin
StorageServiceFactory.reset();
process.env.STORAGE_PROVIDER = 'bulletin';
const bulletinStorage = StorageServiceFactory.getInstance();

// Mock for unit tests
class MockStorageService implements IStorageService {
  async uploadProductMetadata() { return mockResult; }
  // ... implement other methods
}
```

## References

- **Bulletin Chain**: https://github.com/paritytech/polkadot-bulletin-chain
- **IPFS**: https://ipfs.io
- **Pinata**: https://pinata.cloud
- **Polkadot.js API**: https://polkadot.js.org/docs/api

## Support

For questions about:
- **IPFS Integration**: See existing `ipfsService.ts` implementation
- **Bulletin Chain**: Wait for Q4 2025 launch and official docs
- **Migration**: Review `StorageMigrationService.ts` implementation
