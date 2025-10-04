# Kusama & Polkadot EVM Deployment Guide

This guide covers deploying the 3Bay marketplace to **Kusama** and **Polkadot** EVM-compatible networks.

---

## 🌐 Network Options

### Kusama Production (Recommended)
- **Network:** Moonriver
- **Chain ID:** 1285 (0x505)
- **RPC:** https://rpc.api.moonriver.moonbeam.network
- **Explorer:** https://moonriver.moonscan.io
- **Token:** MOVR
- **Best For:** Production deployment on Kusama ecosystem
- **Status:** ✅ Live & EVM Compatible

### Polkadot Testnet
- **Network:** Paseo Community Testnet
- **Chain ID:** 1001
- **RPC:** https://rpc.paseo.io
- **Explorer:** https://paseo.subscan.io
- **Token:** PAS (testnet, no value)
- **Faucet:** https://faucet.polkadot.io/
- **Best For:** Testing before Polkadot mainnet
- **Status:** ✅ Live & EVM Compatible

### Development/Testing
- **Network:** Moonbase Alpha
- **Chain ID:** 1287
- **RPC:** https://rpc.api.moonbase.moonbeam.network
- **Explorer:** https://moonbase.moonscan.io
- **Token:** DEV (testnet)
- **Faucet:** https://faucet.moonbeam.network/
- **Best For:** Development and testing
- **Status:** ✅ Live & EVM Compatible

---

## 🚀 Quick Deploy to Kusama (Moonriver)

### Step 1: Get MOVR Tokens
- Purchase MOVR from exchanges (Kraken, Gate.io, etc.)
- Or bridge from Kusama using XCM
- Need ~0.5 MOVR for deployment + gas

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```bash
# Kusama Production
EVM_RPC_URL=https://rpc.api.moonriver.moonbeam.network
DEPLOYMENT_NETWORK=moonriver

# Your private key (keep secret!)
DEPLOYER_PRIVATE_KEY=0xYourPrivateKeyHere

# Pinata IPFS
PINATA_API_KEY=your_api_key
PINATA_SECRET_API_KEY=your_secret_key
```

### Step 3: Upload Metadata to IPFS

```bash
npm run upload-ipfs-metadata
```

Expected output:
```
✅ IPFS Hash: QmYzD9...
📦 Size: 1523 bytes
```

### Step 4: Deploy Contract to Moonriver

```bash
npm run contract:compile
npm run contract:deploy
```

This will:
1. Deploy ProductRegistry to Moonriver
2. Return contract address
3. Show deployment transaction

**Copy the contract address** and add to `.env`:
```bash
PRODUCT_REGISTRY_CONTRACT_ADDRESS=0xYourContractAddress
```

### Step 5: Register Products with Real IPFS

```bash
npm run register-products-real-ipfs
```

This registers 5 products with real IPFS metadata on Moonriver.

### Step 6: Test Sync

```bash
npm run dev
```

In another terminal:
```bash
curl -X POST http://localhost:3000/api/products/sync/blockchain
curl http://localhost:3000/api/products
```

You should see products with:
- ✅ Real descriptions from IPFS
- ✅ Multiple images
- ✅ Delivery instructions
- ✅ `blockchainVerified: true`

---

## 🧪 Deploy to Polkadot Testnet (Paseo)

### Step 1: Get PAS Tokens

Visit the Paseo faucet:
```
https://faucet.polkadot.io/
```

Request PAS tokens (100 PAS per request).

### Step 2: Configure Environment

```bash
# Polkadot Testnet
EVM_RPC_URL=https://rpc.paseo.io
DEPLOYMENT_NETWORK=paseo
DEPLOYER_PRIVATE_KEY=0xYourPrivateKeyHere
```

### Step 3: Deploy

```bash
npm run upload-ipfs-metadata
npm run contract:compile
npm run contract:deploy:paseo
npm run register-products:paseo
```

---

## 📋 All Available Commands

### Deployment Commands

```bash
# Compile contracts
npm run contract:compile

# Deploy to Moonriver (Kusama production)
npm run contract:deploy
npm run contract:deploy:moonriver

# Deploy to Moonbeam (Polkadot production - when EVM launches)
npm run contract:deploy:moonbeam

# Deploy to Paseo (Polkadot testnet)
npm run contract:deploy:paseo

# Deploy to Moonbase Alpha (dev)
npm run contract:deploy:moonbase
```

### Product Registration Commands

```bash
# Register products on Moonriver (default)
npm run register-products-real-ipfs
npm run register-products:moonriver

# Register products on Moonbeam (Polkadot)
npm run register-products:moonbeam

# Register products on Paseo testnet
npm run register-products:paseo

# Register products on Moonbase Alpha
npm run register-products:moonbase
```

---

## 🔍 Verify Deployment

### Check Contract on Block Explorer

**Moonriver:**
```
https://moonriver.moonscan.io/address/YOUR_CONTRACT_ADDRESS
```

Should show:
- Contract creation transaction
- Contract code
- 5 `registerProduct` transactions

**Paseo:**
```
https://paseo.subscan.io/
```

Search for your contract address.

### Check IPFS Metadata

Open in browser:
```
https://gateway.pinata.cloud/ipfs/QmYourHashHere
```

Should show JSON with:
- Product name
- Description
- Images
- Delivery instructions
- Variants

### Test API

```bash
# Start server
npm run dev

# Sync from blockchain
curl -X POST http://localhost:3000/api/products/sync/blockchain

# Get products
curl http://localhost:3000/api/products | json_pp
```

---

## 🌟 Why Kusama/Polkadot?

### Kusama (Moonriver)
- ✅ EVM compatible NOW (launched 2021)
- ✅ Production-ready
- ✅ Part of Polkadot/Kusama ecosystem
- ✅ Fast finality (~12 seconds)
- ✅ Full Web3 stack support
- ✅ Lower gas fees than Ethereum

### Polkadot (Coming 2025)
- ✅ EVM compatibility coming Q1 2025
- ✅ Can test on Paseo NOW
- ✅ Asset Hub for Hollar payments ready
- ✅ Higher security guarantees than Kusama
- ✅ Bulletin Chain integration (Q4 2025)

---

## 🛠️ Troubleshooting

### MOVR/PAS Balance Issues

**Problem:** Insufficient funds for gas

**Solution:**
```bash
# Check balance in MetaMask
# Or use RPC:
curl -X POST https://rpc.api.moonriver.moonbeam.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["YOUR_ADDRESS","latest"],"id":1}'
```

### RPC Connection Fails

**Problem:** `Error: could not detect network`

**Solution:**
```bash
# Try alternative RPC endpoints
# Moonriver alternatives:
# - https://moonriver.public.blastapi.io
# - https://moonriver.api.onfinality.io/public

# Update in .env:
MOONRIVER_RPC_URL=https://moonriver.public.blastapi.io
```

### Contract Verification

**Problem:** Want to verify contract on Moonscan

**Solution:**
```bash
# Get Moonscan API key from:
# https://moonriver.moonscan.io/myapikey

# Add to .env:
MOONSCAN_API_KEY=your_api_key

# Verify:
npx hardhat verify --network moonriver YOUR_CONTRACT_ADDRESS
```

---

## 📊 Network Comparison

| Feature | Moonriver (Kusama) | Paseo (Polkadot) | Moonbase Alpha |
|---------|-------------------|------------------|----------------|
| **Status** | Production | Testnet | Dev Testnet |
| **EVM Compatible** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Token** | MOVR (real value) | PAS (no value) | DEV (no value) |
| **Gas Fees** | ~$0.01-0.10 | Free | Free |
| **Faucet** | ❌ No | ✅ Yes | ✅ Yes |
| **Block Time** | ~12s | ~12s | ~12s |
| **Finality** | Fast | Fast | Fast |
| **Explorer** | Moonscan | Subscan | Moonscan |
| **Best For** | Kusama production | Polkadot testing | Development |

---

## 🎯 Recommended Deployment Strategy

1. **Development (Week 1-4):**
   - Use Moonbase Alpha
   - Free testnet tokens
   - Fast iteration

2. **Testing (Week 5-8):**
   - Deploy to Paseo testnet
   - Test with Polkadot tooling
   - Verify Asset Hub integration

3. **Production (Week 9+):**
   - Deploy to Moonriver (Kusama)
   - Real economic environment
   - Access to Kusama ecosystem

4. **Future (2025+):**
   - Migrate to Polkadot mainnet when EVM launches
   - Integrate Bulletin Chain when available (Q4 2025)

---

## 📖 Additional Resources

### Documentation
- **Moonriver Docs:** https://docs.moonbeam.network/builders/get-started/networks/moonriver/
- **Paseo Docs:** https://forum.polkadot.network/t/the-new-polkadot-community-testnet/4956
- **Hardhat Moonbeam:** https://docs.moonbeam.network/builders/ethereum/dev-env/hardhat/

### Block Explorers
- **Moonriver:** https://moonriver.moonscan.io
- **Paseo:** https://paseo.subscan.io
- **Moonbase:** https://moonbase.moonscan.io

### Faucets
- **Paseo:** https://faucet.polkadot.io/
- **Moonbase Alpha:** https://faucet.moonbeam.network/

### Community
- **Polkadot Discord:** https://dot.li/discord
- **Moonbeam Discord:** https://discord.gg/moonbeam

---

**Status:** ✅ Ready for Kusama/Polkadot deployment!
