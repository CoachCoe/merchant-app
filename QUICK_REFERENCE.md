# 3Bay Quick Reference Card

## Essential Commands

```bash
# Development
npm run dev                              # Start dev servers (frontend + backend)
npm run build                            # Build for production
npm start                                # Run production build

# Testing
npm test                                 # Run all tests
npm run test:backend                     # Backend tests only
npm run test:coverage                    # Coverage report

# Blockchain Operations
curl -X POST localhost:3000/api/products/sync/blockchain  # Manual blockchain sync
```

---

## Required Environment Variables

```bash
# Minimum to start (cache-only mode)
PINATA_API_KEY=xxx
PINATA_SECRET_API_KEY=xxx
EVM_RPC_URL=https://rpc.api.moonbase.moonbeam.network

# For full blockchain functionality
PRODUCT_REGISTRY_CONTRACT_ADDRESS=0x...
ENABLE_BLOCKCHAIN_SYNC=true
ASSETHUB_WSS_URL=wss://polkadot-asset-hub-rpc.polkadot.io
```

---

## Key Endpoints

### Products (Blockchain-First)
```bash
GET  /api/products                       # List products (from cache)
GET  /api/products/:id                   # Get product (blockchain-first)
POST /api/products/sync/blockchain       # Sync all from blockchain (admin)
```

### Shopping Cart
```bash
GET  /api/cart                           # Get current cart
POST /api/cart/items                     # Add item
PUT  /api/cart/items/:id                 # Update quantity
DELETE /api/cart/items/:id               # Remove item
```

### Digital Delivery
```bash
GET  /api/delivery/:token                # Redeem delivery token
```

### Health Check
```bash
GET  /health                             # Server health
```

---

## Data Flow (Blockchain-First)

```
┌─────────────────────────────────────┐
│  1. User Requests Product           │
│  GET /api/products/123               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Check Cache (5-min TTL)         │
│  Fresh? → Return immediately        │
│  Stale? → Continue to blockchain    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Query ProductRegistry Contract  │
│  Get: price, seller, active status  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Fetch Metadata from IPFS        │
│  Get: description, images, details  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Merge & Update Cache            │
│  Save to SQLite with new timestamp  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6. Return Product to User          │
│  blockchainVerified: true           │
└─────────────────────────────────────┘
```

---

## Architecture Layers

| Layer | Technology | Purpose | Required? |
|-------|-----------|---------|-----------|
| **Blockchain** | ProductRegistry (EVM) | Source of truth | ✅ Yes |
| **Storage** | IPFS/Pinata | Metadata storage | ✅ Yes |
| **Payments** | AssetHub (Hollar) | Transactions | ✅ Yes |
| **Cache** | SQLite | Performance (5-min TTL) | ❌ Optional |
| **Indexer** | BlockchainSyncService | Auto-sync background | ❌ Optional |
| **Server** | Node.js/Express | API + Frontend host | ✅ Yes |

---

## File Locations

### Core Services
```
src/services/
├── productService.ts              # Blockchain-first product queries
├── blockchainSyncService.ts       # Background sync (every 5 min)
├── productRegistryService.ts      # Smart contract interface
├── directPaymentService.ts        # AssetHub Hollar payments
├── purchaseService.ts             # Purchase tracking
├── digitalDeliveryService.ts      # Secure delivery tokens
└── storage/
    ├── IPFSStorageService.ts      # Pinata integration
    └── BulletinChainStorageService.ts  # Q4 2025
```

### Configuration
```
.env                               # Your secrets (DO NOT COMMIT)
.env.example                       # Template with all options
SETUP_GUIDE.md                     # Full setup instructions
WEB3_ARCHITECTURE.md               # Architecture deep-dive
```

---

## Troubleshooting Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| "Contract address not configured" | Add `PRODUCT_REGISTRY_CONTRACT_ADDRESS` to `.env` |
| "IPFS service not configured" | Add Pinata keys to `.env` |
| "Failed to connect to AssetHub" | Check `ASSETHUB_WSS_URL` is correct |
| Products not syncing | Restart server, check `ENABLE_BLOCKCHAIN_SYNC=true` |
| Cache always stale | Lower `BLOCKCHAIN_SYNC_INTERVAL_MINUTES` |
| RPC timeout errors | Increase `BLOCKCHAIN_RPC_TIMEOUT` or use better RPC |

---

## Development Workflow

### Adding a New Product (Manual - until UI is built)

```bash
# 1. Upload metadata to IPFS
curl -X POST https://api.pinata.cloud/pinning/pinJSONToIPFS \
  -H "pinata_api_key: YOUR_KEY" \
  -H "pinata_secret_api_key: YOUR_SECRET" \
  -d '{
    "name": "My Product",
    "description": "Product description",
    "category": "electronics",
    "images": ["https://..."]
  }'

# Response includes: IpfsHash: QmXXX...

# 2. Register on blockchain (via Remix or ethers.js)
ProductRegistry.registerProduct(
  "My Product",
  "QmXXX...",  // IPFS hash from step 1
  100000,      // price in Hollar (smallest unit)
  "electronics"
)

# 3. Trigger sync (or wait for auto-sync)
curl -X POST localhost:3000/api/products/sync/blockchain

# 4. Verify product appears
curl localhost:3000/api/products
```

---

## Network Endpoints Reference

### Mainnet (Production)
```bash
EVM_RPC_URL=https://rpc.api.moonbeam.network
ASSETHUB_WSS_URL=wss://polkadot-asset-hub-rpc.polkadot.io
POLKADOT_WSS_URL=wss://rpc.polkadot.io
```

### Testnet (Development)
```bash
EVM_RPC_URL=https://rpc.api.moonbase.moonbeam.network
ASSETHUB_WSS_URL=wss://westend-asset-hub-rpc.polkadot.io
POLKADOT_WSS_URL=wss://westend-rpc.polkadot.io
```

---

## Performance Tips

1. **Cache TTL:** Lower = fresher data, higher RPC usage
2. **Sync Interval:** 5-10 min good for prod, 1-2 min for dev
3. **RPC Provider:** Use paid provider (Blast, OnFinality) for production
4. **IPFS Gateway:** Pinata gateway fastest for Pinata-pinned content
5. **Max Concurrent Syncs:** Keep at 5 to avoid overwhelming RPC

---

## Security Checklist

- [ ] `.env` in `.gitignore` (never commit)
- [ ] Unique `SESSION_SECRET` generated
- [ ] CORS restricted to specific domains
- [ ] Rate limiting enabled
- [ ] HTTPS in production
- [ ] API keys rotated regularly
- [ ] Admin endpoints protected

---

## Next Implementation Steps

1. ✅ Blockchain-first architecture (DONE)
2. ⏭️ Deploy ProductRegistry contract
3. ⏭️ Build wallet authentication
4. ⏭️ Seller product registration UI
5. ⏭️ Anonymous purchase flow
6. ⏭️ Reputation system display

See `IMPLEMENTATION_ROADMAP.md` for detailed timeline.

---

**Quick Start:** `cp .env.example .env` → Configure → `npm run dev`
**Full Guide:** `SETUP_GUIDE.md`
**Architecture:** `WEB3_ARCHITECTURE.md`
