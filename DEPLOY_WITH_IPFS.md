# Deploy with Real IPFS & Bulletin Chain

Complete deployment guide using **real IPFS metadata** and **Bulletin Chain** storage.

---

## What You're Deploying

### ✅ IPFS (Pinata) - Available Now
- Real product metadata (descriptions, images, variants)
- Permanent decentralized storage
- Fast CDN access via Pinata gateway

### ⏳ Bulletin Chain - Coming Q4 2025
- 2-week ephemeral on-chain storage
- Automatic IPFS publishing via Bitswap
- For now: Script ready, will activate when network launches

---

## Prerequisites

- [ ] Pinata account ([free signup](https://app.pinata.cloud/))
- [ ] Pinata API keys
- [ ] MetaMask with test DEV tokens
- [ ] `.env` file configured

---

## Deployment Flow

```
Step 1: Upload to IPFS       → Get real hashes
Step 2: Upload to Bulletin    → (Optional, Q4 2025)
Step 3: Deploy Contract       → Smart contract on Moonbase Alpha
Step 4: Register Products     → Use real IPFS hashes
Step 5: Test Sync             → Server fetches from IPFS
```

---

## Step 1: Upload Metadata to IPFS (5 min)

### Configure Pinata

```bash
# Add to .env
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_API_KEY=your_secret_key_here
```

### Upload Product Metadata

```bash
npm run upload-ipfs-metadata
```

**Expected Output:**
```
📤 Uploading product metadata to IPFS...

🔑 Testing Pinata authentication...
✅ Pinata connected!

📦 Uploading 5 product metadata to IPFS...

Uploading: Web3 Development Course
  ✅ IPFS Hash: QmYzD9...
  🌐 Gateway URL: https://gateway.pinata.cloud/ipfs/QmYzD9...
  📦 Size: 1523 bytes

Uploading: NFT Digital Art Collection
  ✅ IPFS Hash: QmPqR3...
  🌐 Gateway URL: https://gateway.pinata.cloud/ipfs/QmPqR3...
  📦 Size: 1687 bytes

... (3 more products)

📊 Upload Summary:
   Total uploaded: 5/5

✅ IPFS hashes saved to: ./ipfs-hashes.json
```

**What was uploaded:**
- Product descriptions
- Image URLs
- Delivery instructions
- Variant options
- Category info

**Verify uploads:**
```bash
cat ipfs-hashes.json
```

You can open any gateway URL in your browser to see the metadata!

---

## Step 2: Upload to Bulletin Chain (Optional)

### Current Status: Q4 2025

```bash
npm run upload-bulletin-metadata
```

**Expected Output:**
```
📤 Uploading to Polkadot Bulletin Chain...

⚠️  Bulletin Chain integration not enabled

Bulletin Chain status: Launching Q4 2025
Current implementation: STUB (ready for launch)

What this script WILL do when Bulletin Chain launches:
  1. Connect to Bulletin Chain node
  2. Call transactionStorage.store(data, ttl)
  3. Store metadata on-chain (2-week expiry)
  4. Data automatically published to IPFS via Bitswap
  5. Return both transaction hash and IPFS CID

For now, use IPFS-only upload ✅
```

**To enable when Bulletin Chain launches:**

```bash
# In .env
BULLETIN_CHAIN_ENABLED=true
BULLETIN_CHAIN_WS_ENDPOINT=wss://bulletin-rpc.polkadot.io
```

Then run the script again - it will actually upload to Bulletin Chain!

---

## Step 3: Deploy Smart Contract (5 min)

### Add Deployer Key

```bash
# Add to .env
DEPLOYER_PRIVATE_KEY=0xYourPrivateKeyFromMetaMask
```

### Compile & Deploy

```bash
# Compile contract
npm run contract:compile

# Deploy to Moonbase Alpha
npm run contract:deploy
```

**Copy the contract address from output:**
```
📍 Contract address: 0x1234567890abcdef...
```

### Update .env

```bash
# Add to .env
PRODUCT_REGISTRY_CONTRACT_ADDRESS=0xAddressFromAbove
```

---

## Step 4: Register Products with Real IPFS (3 min)

Now register products using the **real IPFS hashes** you uploaded:

```bash
npm run register-products-real-ipfs
```

**Expected Output:**
```
🛍️  Registering products with REAL IPFS metadata...

Seller address: 0xYourAddress
Contract address: 0x1234...

📦 Registering 5 products with REAL IPFS metadata...

Registering: Web3 Development Course
  📄 IPFS Hash: QmYzD9...
  🌐 Gateway: https://gateway.pinata.cloud/ipfs/QmYzD9...
  ✅ Product ID: 0xabcd...
  💰 Price: 50 Hollar
  📂 Category: digital-goods
  🔗 TX: 0xtxhash...
  🎯 Metadata: https://gateway.pinata.cloud/ipfs/QmYzD9...

... (4 more products)

📊 Registration Summary:
   Total registered: 5/5
   On-chain total: 5
   Active products: 5

💾 Results saved to: ./registered-products.json

✅ Products registered with REAL IPFS metadata!
```

**What just happened:**
1. Smart contract stores: name, price, IPFS hash, category
2. IPFS stores: Full metadata (descriptions, images, variants)
3. Server will fetch metadata from IPFS when syncing

---

## Step 5: Test Blockchain Sync with Real IPFS (5 min)

### Start Server

```bash
npm run dev
```

**Check logs for:**
```
✅ IPFS Storage Service initialized with Pinata
✅ ProductRegistryService initialized
✅ Blockchain sync service started
```

### Trigger Sync

```bash
curl -X POST http://localhost:3000/api/products/sync/blockchain
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "synced": 5,
    "errors": 0
  },
  "message": "Blockchain sync complete: 5 products synced, 0 errors"
}
```

**What happened:**
1. Server queried ProductRegistry contract
2. Got product IDs and IPFS hashes
3. Fetched metadata from IPFS (real data!)
4. Merged blockchain + IPFS data
5. Cached in SQLite

### View Products with Real Metadata

```bash
curl http://localhost:3000/api/products | json_pp
```

**You should see:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "...",
        "onChainId": "0xabcd...",
        "title": "Web3 Development Course",
        "description": "Complete guide to building decentralized applications...",
        "priceHollar": 50,
        "images": [
          "https://via.placeholder.com/600x400/667eea/ffffff?text=Web3+Course",
          "https://via.placeholder.com/600x400/764ba2/ffffff?text=Substrate+Dev"
        ],
        "digitalDeliveryType": "download",
        "digitalDeliveryInstructions": "After purchase, you'll receive...",
        "variants": [
          { "name": "Format", "value": "Video + PDF", "stock": 999 }
        ],
        "blockchainVerified": true,
        "ipfsMetadataHash": "QmYzD9...",
        ...
      },
      ...
    ]
  }
}
```

**Notice:**
- ✅ Full descriptions (from IPFS)
- ✅ Multiple images (from IPFS)
- ✅ Delivery instructions (from IPFS)
- ✅ Variants (from IPFS)
- ✅ `blockchainVerified: true`

---

## Verification Checklist

- [ ] IPFS metadata uploaded (5 hashes in `ipfs-hashes.json`)
- [ ] Contract deployed (address in `.env`)
- [ ] Products registered on-chain (5 transactions)
- [ ] Server synced from blockchain (5 products)
- [ ] Products have real metadata (not placeholders)
- [ ] IPFS URLs are accessible in browser

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│  1. Upload Metadata to IPFS                     │
│     npm run upload-ipfs-metadata                │
│     → Returns: QmYzD9...                        │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  2. Deploy ProductRegistry Contract             │
│     npm run contract:deploy                     │
│     → Returns: 0x1234...                        │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  3. Register Product On-Chain                   │
│     registry.registerProduct(                   │
│       "Web3 Course",                            │
│       "QmYzD9...",  ← REAL IPFS hash           │
│       50,                                        │
│       "digital-goods"                           │
│     )                                           │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  4. Server Syncs from Blockchain                │
│     Query contract → Get IPFS hash              │
│     Fetch from IPFS → Get full metadata         │
│     Merge data → Cache in SQLite                │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  5. API Returns Product                         │
│     With REAL descriptions, images, variants    │
└─────────────────────────────────────────────────┘
```

---

## Troubleshooting

### IPFS upload fails

**Error:** `Pinata authentication failed`

**Solution:**
1. Check API keys in `.env`
2. Test at: https://app.pinata.cloud/developers/api-keys
3. Ensure keys have `pinJSONToIPFS` permission

---

### Metadata not fetching

**Error:** `Failed to fetch from all IPFS gateways`

**Solution:**
1. Check IPFS hash is correct
2. Try opening gateway URL in browser
3. Wait 30-60 seconds (IPFS propagation)
4. Try different gateway in `.env`:
   ```bash
   IPFS_GATEWAY_URL=https://ipfs.io/ipfs
   ```

---

### Products registered but no metadata

**Problem:** Products appear but descriptions are empty

**Solution:**
1. Check `ipfsMetadataHash` in API response
2. Manually fetch: `curl https://gateway.pinata.cloud/ipfs/QmYourHash`
3. Verify hash exists in `ipfs-hashes.json`
4. Re-run sync: `curl -X POST .../sync/blockchain`

---

## What's Different from Test Products?

| Aspect | Test Products (Fake) | Real IPFS Products |
|--------|---------------------|-------------------|
| **IPFS Hash** | `QmTest1...` (fake) | `QmYzD9...` (real) |
| **Metadata** | Empty/placeholder | Full descriptions, images |
| **Fetchable** | ❌ No | ✅ Yes |
| **Images** | None | Real placeholder images |
| **Variants** | None | Size, format, color options |
| **Delivery** | None | Download/email/IPFS instructions |

---

## Next Steps

After successful deployment:

1. ✅ Products on blockchain with real metadata
2. ✅ IPFS serving product details
3. ✅ Server syncing automatically
4. ⏭️ Build product registration UI
5. ⏭️ Add wallet authentication
6. ⏭️ Enable purchases

---

## Bulletin Chain Future

When Bulletin Chain launches (Q4 2025):

```bash
# 1. Enable in .env
BULLETIN_CHAIN_ENABLED=true

# 2. Upload metadata
npm run upload-bulletin-metadata

# 3. Get both hashes
# - Bulletin TX hash (on-chain)
# - IPFS CID (auto-published)

# 4. Products automatically expire after 2 weeks
# 5. Perfect for temporary listings
```

**Benefits:**
- On-chain storage verification
- Auto-publish to IPFS
- Built-in TTL (no manual cleanup)
- Lower cost than permanent IPFS pinning

---

**Status:** ✅ Ready for real IPFS deployment
**Bulletin Chain:** ⏳ Q4 2025 (scripts ready)
