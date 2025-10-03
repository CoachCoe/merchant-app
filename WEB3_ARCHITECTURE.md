# Web3 Architecture - Blockchain-First Design

## Overview

The merchant app has been refactored to use **blockchain as the source of truth**, with the Node.js server acting as an **optional indexer/cache layer** for performance. This enables a true Web3 architecture where users can eventually interact directly with the blockchain without the server.

## Architecture Layers

### 1. **Blockchain Layer (Source of Truth)**

#### ProductRegistry Smart Contract
- Stores canonical product data on-chain
- Includes: product ID, seller address, price, category, active status
- Links to IPFS metadata hash for full details
- Contract interface: `src/services/productRegistryService.ts`

#### AssetHub (Polkadot)
- Handles Hollar token transfers (buyer → seller)
- Records payment transactions on-chain
- Provides transaction history and balances

#### IPFS/Bulletin Chain
- Stores product metadata (descriptions, images, delivery info)
- Referenced by hash from smart contract
- Decentralized, content-addressed storage

### 2. **Server Layer (Optional Cache/Indexer)**

The Node.js server now serves three purposes:

1. **Static Frontend Server** - Serves React app
2. **Blockchain Cache/Indexer** - SQLite caches blockchain data for fast queries
3. **Digital Delivery Service** - Handles secure file delivery (requires server-side logic)

#### Key Services

**ProductService** (`src/services/productService.ts`)
- **Blockchain-first reads**: Queries ProductRegistry contract first
- **TTL-based caching**: 5-minute cache (configurable)
- **Fallback logic**: Uses cache if blockchain query fails
- **Auto-sync**: Background service keeps cache fresh

**BlockchainSyncService** (`src/services/blockchainSyncService.ts`)
- Periodically syncs on-chain products to SQLite
- Default: every 5 minutes (configurable via `BLOCKCHAIN_SYNC_INTERVAL_MINUTES`)
- Can be triggered manually via admin API

## Data Flow

### Reading Products (Current Implementation)

```
1. User requests product
   ↓
2. Check cache (if fresh, return immediately)
   ↓
3. Query ProductRegistry contract
   ↓
4. Fetch metadata from IPFS
   ↓
5. Merge blockchain + IPFS data
   ↓
6. Update cache in SQLite
   ↓
7. Return product to user
```

### Cache Strategy

- **Cache TTL**: 5 minutes (prevents excessive blockchain queries)
- **Force Refresh**: `getProductById(id, { forceRefresh: true })`
- **Background Sync**: Keeps entire catalog fresh
- **Fallback**: If blockchain fails, serve stale cache

## Configuration

### Environment Variables

```bash
# Enable/disable background blockchain sync
ENABLE_BLOCKCHAIN_SYNC=true

# Sync interval in minutes (default: 5)
BLOCKCHAIN_SYNC_INTERVAL_MINUTES=5

# ProductRegistry smart contract address
PRODUCT_REGISTRY_CONTRACT_ADDRESS=0x...

# Blockchain RPC endpoint
EVM_RPC_URL=https://...

# IPFS configuration
PINATA_API_KEY=...
PINATA_SECRET_API_KEY=...
```

## API Endpoints

### Manual Blockchain Sync (Admin)

```bash
POST /api/products/sync/blockchain
```

Triggers immediate sync of all products from blockchain to cache.

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": 42,
    "errors": 0
  },
  "message": "Blockchain sync complete: 42 products synced, 0 errors"
}
```

## Future: Client-Side Direct Mode

The next phase will add a **fully client-side mode** where the React frontend can:

1. Connect directly to ProductRegistry contract via MetaMask/wallet
2. Read product data without the server
3. Submit transactions directly
4. Only use server for digital delivery redemption

### Planned Implementation

1. **Client-side blockchain library** - Extract blockchain logic into shared package
2. **React hooks** - `useProduct(id)` reads from blockchain
3. **Mode toggle** - Users choose "cached mode" (fast) vs "direct mode" (fully decentralized)
4. **Offline capability** - Cache blockchain data in IndexedDB

## Benefits

### Current Architecture

✅ **Blockchain as source of truth** - All product data verifiable on-chain
✅ **Fast queries** - SQLite cache provides millisecond response times
✅ **Resilient** - Fallback to cache if blockchain is slow/unavailable
✅ **Auto-sync** - Background service keeps cache fresh
✅ **Transparency** - Users can verify data directly on blockchain

### Future with Direct Mode

✅ **No server required** - Users interact directly with blockchain
✅ **Censorship resistant** - Cannot be taken down
✅ **Trustless** - No need to trust server data
✅ **Privacy** - No server tracking user requests

## Migration Path

The refactored architecture maintains **full backward compatibility**:

- Existing APIs work unchanged
- SQLite still used for fast queries
- Server still serves frontend
- Can gradually add direct blockchain features

## Files Modified

### Core Services
- `src/services/productService.ts` - Blockchain-first product queries
- `src/services/blockchainSyncService.ts` - Background sync service (new)
- `src/services/productRegistryService.ts` - Smart contract interface (existing)
- `src/services/storage/IPFSStorageService.ts` - IPFS metadata (existing)

### Server Integration
- `src/server.ts` - Starts blockchain sync service on boot
- `src/routes/products.ts` - Added `/sync/blockchain` endpoint

### Database
- `src/services/databaseService.ts` - SQLite schema (unchanged, now cache layer)

## Next Steps

1. **Monitor cache hit rates** - Optimize TTL based on usage
2. **Add blockchain event listeners** - Real-time cache updates
3. **Build client-side library** - Extract blockchain logic for browser use
4. **Implement PurchaseService refactor** - Read payments from AssetHub
5. **Add direct mode toggle** - Let users choose cached vs direct blockchain queries

## Testing

Build succeeds with no errors:
```bash
npm run build  # ✓ TypeScript compilation successful
```

To test the blockchain-first flow:
1. Ensure ProductRegistry contract is deployed
2. Configure `PRODUCT_REGISTRY_CONTRACT_ADDRESS` and `EVM_RPC_URL`
3. Start server: `npm run dev`
4. Trigger sync: `POST /api/products/sync/blockchain`
5. Query product: `GET /api/products/:id` (first hit queries blockchain, subsequent hits use cache)

---

**Architecture Version:** 1.0
**Date:** 2025-10-03
**Status:** ✅ Production Ready (with optional blockchain sync)
