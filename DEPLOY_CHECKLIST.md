# Deployment Checklist - IPFS & Blockchain

## Quick Deploy (15 minutes total)

### ✅ Prerequisites (5 min)
- [ ] Get Pinata API keys: https://app.pinata.cloud/developers/api-keys
- [ ] Get test tokens for your chosen network:
  - **Moonriver (Kusama)**: Get MOVR from exchanges or bridge
  - **Paseo Testnet (Polkadot)**: Use Paseo faucet at https://faucet.polkadot.io/
  - **Moonbase Alpha (Dev)**: Get DEV tokens at https://faucet.moonbeam.network/
- [ ] Export MetaMask private key
- [ ] Create `.env` from `.env.example`

### ✅ Configure .env

```bash
# Required
PINATA_API_KEY=your_key
PINATA_SECRET_API_KEY=your_secret
DEPLOYER_PRIVATE_KEY=0xYourKey

# Choose your network (Kusama recommended):
# For Kusama (production):
EVM_RPC_URL=https://rpc.api.moonriver.moonbeam.network
DEPLOYMENT_NETWORK=moonriver

# For Polkadot testnet:
# EVM_RPC_URL=https://rpc.paseo.io
# DEPLOYMENT_NETWORK=paseo

# For development/testing:
# EVM_RPC_URL=https://rpc.api.moonbase.moonbeam.network
# DEPLOYMENT_NETWORK=moonbase

# Optional (for Bulletin Chain Q4 2025)
BULLETIN_CHAIN_ENABLED=false
```

---

## Deployment Steps

### Step 1: Upload to IPFS (2 min)
```bash
npm run upload-ipfs-metadata
```
✅ **Success:** `ipfs-hashes.json` created with 5 products

### Step 2: (Optional) Bulletin Chain (2 min)
```bash
npm run upload-bulletin-metadata
```
⏳ **Note:** Shows Q4 2025 launch message (script ready)

### Step 3: Deploy Contract (3 min)
```bash
npm run contract:compile

# Choose based on your network:
npm run contract:deploy                 # Moonriver (Kusama) - default
# OR
npm run contract:deploy:paseo          # Paseo testnet (Polkadot)
# OR
npm run contract:deploy:moonbase       # Moonbase Alpha (dev/testing)
```
✅ **Success:** Copy contract address to `.env`

### Step 4: Register Products (3 min)
```bash
# Choose based on your network:
npm run register-products-real-ipfs          # Moonriver (default)
# OR
npm run register-products:paseo              # Paseo testnet
# OR
npm run register-products:moonbase           # Moonbase Alpha
```
✅ **Success:** 5 products registered with real IPFS metadata

### Step 5: Test Sync (5 min)
```bash
npm run dev

# In new terminal:
curl -X POST http://localhost:3000/api/products/sync/blockchain
curl http://localhost:3000/api/products
```
✅ **Success:** Products have real descriptions, images, variants

---

## Verification

### 1. IPFS Upload Success
```bash
cat ipfs-hashes.json
# Should show 5 products with QmXXX... hashes
```

### 2. Contract Deployed
```bash
# Visit the block explorer for your network:
# Moonriver: https://moonriver.moonscan.io/address/YOUR_CONTRACT_ADDRESS
# Paseo: https://paseo.subscan.io/ (use substrate address)
# Moonbase: https://moonbase.moonscan.io/address/YOUR_CONTRACT_ADDRESS
# Should show contract creation transaction
```

### 3. Products Registered
```bash
# Check contract on Moonscan
# Should show 5 registerProduct transactions
```

### 4. Metadata Fetchable
```bash
# Open in browser:
https://gateway.pinata.cloud/ipfs/QmYourHashHere

# Should show JSON with:
# - name
# - description
# - images
# - delivery_type
# - variants
```

### 5. Server Synced
```bash
curl http://localhost:3000/api/products | grep blockchainVerified
# Should show: "blockchainVerified": true
```

---

## Files Generated

- [ ] `ipfs-hashes.json` - IPFS hashes for metadata
- [ ] `registered-products.json` - On-chain product IDs
- [ ] `.env` with `PRODUCT_REGISTRY_CONTRACT_ADDRESS`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Pinata auth fails | Check API keys |
| Insufficient funds | Get DEV from faucet |
| IPFS fetch fails | Wait 60s for propagation |
| Sync returns 0 | Run upload-ipfs-metadata first |

---

## What You Have Now

✅ **Smart Contract:** ProductRegistry on your chosen network (Moonriver/Paseo/Moonbase)
✅ **IPFS Storage:** 5 products with real metadata
✅ **Blockchain Data:** Products registered on-chain
✅ **Server Sync:** Auto-syncs every 5 minutes
✅ **API:** Returns products with full metadata
✅ **Bulletin Chain:** Ready for Q4 2025 launch

## Network Information

### Kusama (Recommended for Production)
- **Network:** Moonriver (Kusama Parachain)
- **Chain ID:** 1285 (0x505)
- **RPC:** https://rpc.api.moonriver.moonbeam.network
- **Block Explorer:** https://moonriver.moonscan.io
- **Token:** MOVR
- **Best For:** Production deployment on Kusama ecosystem

### Polkadot Testnet
- **Network:** Paseo Community Testnet
- **Chain ID:** 1001
- **RPC:** https://rpc.paseo.io
- **Block Explorer:** https://paseo.subscan.io
- **Token:** PAS (testnet, no value)
- **Faucet:** https://faucet.polkadot.io/
- **Best For:** Testing before Polkadot mainnet deployment

### Development
- **Network:** Moonbase Alpha
- **Chain ID:** 1287
- **RPC:** https://rpc.api.moonbase.moonbeam.network
- **Block Explorer:** https://moonbase.moonscan.io
- **Token:** DEV (testnet)
- **Faucet:** https://faucet.moonbeam.network/
- **Best For:** Development and testing

---

## Commands Reference

```bash
# IPFS
npm run upload-ipfs-metadata          # Upload to IPFS
npm run upload-bulletin-metadata      # Upload to Bulletin (Q4 2025)

# Contract
npm run contract:compile              # Compile Solidity
npm run contract:test                 # Run tests

# Deployment (choose network)
npm run contract:deploy               # Deploy to Moonriver (Kusama)
npm run contract:deploy:moonriver     # Deploy to Moonriver (Kusama)
npm run contract:deploy:moonbeam      # Deploy to Moonbeam (Polkadot)
npm run contract:deploy:paseo         # Deploy to Paseo testnet
npm run contract:deploy:moonbase      # Deploy to Moonbase Alpha (dev)

# Register Products (choose network)
npm run register-products-real-ipfs   # Register on Moonriver
npm run register-products:moonriver   # Register on Moonriver (Kusama)
npm run register-products:moonbeam    # Register on Moonbeam (Polkadot)
npm run register-products:paseo       # Register on Paseo testnet
npm run register-products:moonbase    # Register on Moonbase Alpha

# Development products (legacy)
npm run register-test-products        # Register with fake hashes (old)

# Server
npm run dev                           # Start development
npm run build                         # Build for production
npm start                             # Run production

# Sync
curl -X POST localhost:3000/api/products/sync/blockchain  # Manual sync
```

---

## Next: Build Features

After deployment succeeds:

1. ✅ Blockchain-first architecture working
2. ✅ Real IPFS metadata flowing
3. ⏭️ Build wallet authentication
4. ⏭️ Create product registration UI
5. ⏭️ Implement purchase flow

See `IMPLEMENTATION_ROADMAP.md` for timeline.

---

**Total Time:** ~15 minutes
**Status:** Ready to deploy! 🚀
