# 3Bay Setup Guide - Blockchain Configuration

This guide walks you through configuring the Web3 marketplace from scratch.

## Quick Start (5 minutes)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Configure minimum required variables in .env:
#    - PINATA_API_KEY
#    - PINATA_SECRET_API_KEY
#    - EVM_RPC_URL

# 4. Start development server
npm run dev
```

The app will run in **cache-only mode** until you deploy the ProductRegistry contract.

---

## Full Setup (Production-Ready)

### Step 1: IPFS Storage Setup (5 min)

**Get Pinata API Keys:**

1. Go to https://app.pinata.cloud/developers/api-keys
2. Create a free account
3. Generate API key with permissions:
   - ✅ `pinFileToIPFS`
   - ✅ `pinJSONToIPFS`
4. Copy keys to `.env`:

```bash
PINATA_API_KEY=your_actual_api_key
PINATA_SECRET_API_KEY=your_actual_secret_key
```

**Test IPFS Connection:**

```bash
curl -X POST "https://api.pinata.cloud/data/testAuthentication" \
  -H "pinata_api_key: YOUR_KEY" \
  -H "pinata_secret_api_key: YOUR_SECRET"

# Should return: {"message":"Congratulations! You are communicating with the Pinata API!"}
```

---

### Step 2: Deploy ProductRegistry Smart Contract (15-30 min)

You need to deploy the ProductRegistry contract to a blockchain with EVM compatibility.

#### Option A: Deploy to Moonbase Alpha (Testnet - Recommended)

**Prerequisites:**
- MetaMask or compatible wallet
- Test DEV tokens (free from faucet)

**Steps:**

1. **Get Test Tokens:**
   ```
   Visit: https://faucet.moonbeam.network/
   Select: Moonbase Alpha
   Paste your wallet address
   Claim DEV tokens
   ```

2. **Deploy Contract:**

   Use Remix IDE or Hardhat:

   ```solidity
   // ProductRegistry.sol
   // See contracts/ directory for full implementation
   ```

   Deploy to:
   - Network: Moonbase Alpha
   - RPC: https://rpc.api.moonbase.moonbeam.network
   - Chain ID: 1287

3. **Update `.env`:**

   ```bash
   PRODUCT_REGISTRY_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
   EVM_RPC_URL=https://rpc.api.moonbase.moonbeam.network
   DEPLOYMENT_NETWORK=moonbase-alpha
   ```

#### Option B: Deploy to Moonbeam (Mainnet)

Same process as Moonbase Alpha, but:
- Network: Moonbeam
- RPC: https://rpc.api.moonbeam.network
- Chain ID: 1284
- **Requires real GLMR tokens** (not free)

---

### Step 3: Configure Asset Hub for Payments (5 min)

Asset Hub is where Hollar token payments occur.

**Update `.env`:**

```bash
# Polkadot Asset Hub (mainnet)
ASSETHUB_WSS_URL=wss://polkadot-asset-hub-rpc.polkadot.io

# Hollar Asset ID (verify current ID)
HOLLAR_ASSET_ID=1984
```

**For Testnet:** Use Westend Asset Hub:

```bash
ASSETHUB_WSS_URL=wss://westend-asset-hub-rpc.polkadot.io
```

---

### Step 4: Enable Blockchain Sync (2 min)

The background sync service keeps your cache fresh with on-chain data.

**Update `.env`:**

```bash
# Enable automatic sync
ENABLE_BLOCKCHAIN_SYNC=true

# Sync interval (5 min = good balance)
# Lower for dev (1-2 min), higher for prod (10-15 min)
BLOCKCHAIN_SYNC_INTERVAL_MINUTES=5
```

**Test Sync Manually:**

```bash
# Start server
npm run dev

# Trigger manual sync (in another terminal)
curl -X POST http://localhost:3000/api/products/sync/blockchain \
  -H "Content-Type: application/json"

# Should return:
# {
#   "success": true,
#   "data": { "synced": X, "errors": 0 },
#   "message": "Blockchain sync complete: X products synced, 0 errors"
# }
```

---

### Step 5: Configure WalletConnect (Optional - for wallet auth)

**Get WalletConnect Project ID:**

1. Go to https://cloud.walletconnect.com/
2. Create free account
3. Create new project
4. Copy Project ID

**Update `.env`:**

```bash
WALLETCONNECT_PROJECT_ID=your_project_id_here
SUPPORTED_WALLETS=metamask,talisman,nova,polkadot-js
```

---

## Environment Variables Reference

### Required (Minimum Viable Setup)

```bash
PINATA_API_KEY=xxx                      # IPFS storage
PINATA_SECRET_API_KEY=xxx               # IPFS storage
EVM_RPC_URL=https://...                 # Blockchain RPC
```

### Highly Recommended

```bash
PRODUCT_REGISTRY_CONTRACT_ADDRESS=0x... # Your deployed contract
ENABLE_BLOCKCHAIN_SYNC=true             # Auto-sync on-chain data
ASSETHUB_WSS_URL=wss://...              # For Hollar payments
```

### Optional (Defaults Work)

```bash
BLOCKCHAIN_SYNC_INTERVAL_MINUTES=5      # Sync frequency
CACHE_TTL_SECONDS=300                   # Cache freshness
HOLLAR_ASSET_ID=1984                    # Asset Hub token ID
```

---

## Network Configuration Matrix

| Environment | Contract Network | Asset Hub | IPFS |
|-------------|-----------------|-----------|------|
| **Local Dev** | Moonbase Alpha (testnet) | Westend Asset Hub | Pinata |
| **Staging** | Moonbase Alpha (testnet) | Westend Asset Hub | Pinata |
| **Production** | Moonbeam (mainnet) | Polkadot Asset Hub | Pinata |

---

## Verification Checklist

After configuration, verify everything works:

### 1. IPFS Connection
```bash
npm run dev
# Check logs for: "IPFS Storage Service initialized with Pinata"
```

### 2. Blockchain Connection
```bash
# Should see in logs:
# "ProductRegistryService initialized"
# "Connected to AssetHub"
```

### 3. Blockchain Sync
```bash
# Manual sync test
curl -X POST http://localhost:3000/api/products/sync/blockchain

# Should return synced count > 0 if products exist on-chain
```

### 4. Product Query (Blockchain-First)
```bash
# If you have products on-chain:
curl http://localhost:3000/api/products

# Check response for:
# - "blockchainVerified": true
# - "onChainId": "0x..."
```

---

## Troubleshooting

### "ProductRegistryService initialized without contract address"

**Cause:** Missing `PRODUCT_REGISTRY_CONTRACT_ADDRESS`

**Fix:** Deploy contract and update `.env`

---

### "IPFS service not configured - missing Pinata credentials"

**Cause:** Missing Pinata API keys

**Fix:** Add `PINATA_API_KEY` and `PINATA_SECRET_API_KEY` to `.env`

---

### "Failed to connect to AssetHub"

**Cause:** Invalid WSS endpoint or network issues

**Fix:** Verify `ASSETHUB_WSS_URL` is correct:
- Mainnet: `wss://polkadot-asset-hub-rpc.polkadot.io`
- Testnet: `wss://westend-asset-hub-rpc.polkadot.io`

---

### "Blockchain sync complete: 0 products synced"

**Cause:** No products registered on-chain yet

**Fix:** This is normal for fresh deployments. Register products via:
1. Frontend UI (after wallet auth is built)
2. Direct contract interaction (Remix, ethers.js)

---

### Cache is always stale / not updating

**Cause:** Background sync not running

**Fix:**
1. Check `ENABLE_BLOCKCHAIN_SYNC=true` in `.env`
2. Restart server
3. Look for log: "Blockchain sync service started"

---

## Advanced: Custom RPC Endpoints

If you're running your own nodes or using private RPC providers:

```bash
# Custom Moonbeam node
EVM_RPC_URL=https://your-moonbeam-node.example.com

# Custom Asset Hub node
ASSETHUB_WSS_URL=wss://your-assethub-node.example.com

# Custom Polkadot node (for identities)
POLKADOT_WSS_URL=wss://your-polkadot-node.example.com
```

---

## Security Best Practices

### Production Checklist

- [ ] Use unique `SESSION_SECRET` (generate: `openssl rand -base64 32`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS to specific domains (not `*`)
- [ ] Enable rate limiting (`RATE_LIMIT_MAX_REQUESTS=100`)
- [ ] Use HTTPS in production
- [ ] Rotate Pinata API keys regularly
- [ ] Monitor RPC usage (some providers have rate limits)
- [ ] Set `BLOCKCHAIN_DEBUG=false` in production

### Never Commit to Git

- `.env` file
- Private keys
- API secrets
- Session secrets

---

## Next Steps

After configuration:

1. **Test the setup:** Run `npm run dev` and check all services initialize
2. **Register test products:** Use the contract to register products on-chain
3. **Verify blockchain sync:** Check that products appear in the app
4. **Build wallet auth:** See `IMPLEMENTATION_ROADMAP.md` for next features

---

## Support

- Architecture docs: `WEB3_ARCHITECTURE.md`
- Implementation roadmap: `IMPLEMENTATION_ROADMAP.md`
- PRD requirements: See project docs
- Issues: Create GitHub issue with logs + `.env` (redacted)

---

**Configuration Status:** ✅ Ready for Web3 Architecture
**Last Updated:** 2025-10-04
