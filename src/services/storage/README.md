# Storage Service

Decentralized storage abstraction layer supporting multiple backends.

## Quick Start

```typescript
import { StorageServiceFactory } from './services/storage';

// Get configured storage service
const storage = StorageServiceFactory.getInstance();

// Upload product metadata
const result = await storage.uploadProductMetadata({
  id: 'prod-123',
  name: 'My Product',
  description: 'Product description',
  category: 'electronics',
  images: ['ipfs://...'],
  delivery_type: 'digital',
  created_at: new Date().toISOString()
});

console.log('Stored at:', result.hash);
console.log('URL:', result.url);
console.log('Provider:', storage.getProviderName());
```

## Supported Providers

### IPFS (Production Ready) ✅
- Implementation: `IPFSStorageService`
- Backend: Pinata
- Status: Active, production-ready
- Features: Permanent storage, gateway fallback

### Polkadot Bulletin Chain (Q4 2025) 🚧
- Implementation: `BulletinChainStorageService`
- Backend: Polkadot Bulletin Chain
- Status: Stub implementation, ready for Q4 integration
- Features: Blockchain-verified, time-limited (2 weeks)

## Configuration

Set storage provider in `.env`:

```bash
# Use IPFS (default)
STORAGE_PROVIDER=ipfs
PINATA_API_KEY=your_key
PINATA_SECRET_API_KEY=your_secret

# Use Bulletin Chain (when available)
STORAGE_PROVIDER=bulletin
BULLETIN_CHAIN_ENABLED=true
BULLETIN_CHAIN_WS_ENDPOINT=wss://bulletin-rpc.polkadot.io

# Auto-select (defaults to IPFS)
STORAGE_PROVIDER=auto
```

## Files

- `IStorageService.ts` - Core interface definition
- `IPFSStorageService.ts` - IPFS/Pinata implementation
- `BulletinChainStorageService.ts` - Bulletin Chain implementation (stub)
- `StorageServiceFactory.ts` - Provider selection and instantiation
- `StorageMigrationService.ts` - Migration utilities
- `index.ts` - Public exports

## Migration to Bulletin Chain

When Bulletin Chain launches in Q4 2025:

1. Update `.env` with Bulletin configuration
2. Test with a few products
3. Run migration script: `npm run storage:migrate`
4. Verify data integrity

No code changes needed - the abstraction layer handles everything!

See `../../STORAGE_ABSTRACTION.md` for detailed migration guide.
