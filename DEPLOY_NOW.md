# 🚀 Ready to Deploy - Quick Start

You're all set! Here's what to do RIGHT NOW to deploy and test your blockchain-first marketplace.

## Prerequisites Check

- [ ] Node.js installed
- [ ] MetaMask installed
- [ ] Wallet has test DEV tokens ([get them here](https://faucet.moonbeam.network/))
- [ ] `.env` file created from `.env.example`

## Deploy in 5 Commands

### 1. Get your private key

```bash
# MetaMask > Account Details > Export Private Key
# Copy it (starts with 0x)
```

### 2. Add to .env

```bash
echo "DEPLOYER_PRIVATE_KEY=0xYOUR_KEY_HERE" >> .env
echo "MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network" >> .env
```

### 3. Compile contract

```bash
npm run contract:compile
```

### 4. Deploy contract

```bash
npm run contract:deploy
```

**Copy the contract address from output!**

### 5. Add contract address to .env

```bash
echo "PRODUCT_REGISTRY_CONTRACT_ADDRESS=0xADDRESS_FROM_ABOVE" >> .env
```

---

## Test Deployment

### Register test products

```bash
npm run register-test-products
```

Expected: 5 products registered ✅

### Start server

```bash
npm run dev
```

Check logs for:
- ✅ "ProductRegistryService initialized"
- ✅ "Blockchain sync service started"

### Sync from blockchain

```bash
curl -X POST http://localhost:3000/api/products/sync/blockchain
```

Expected:
```json
{
  "success": true,
  "data": { "synced": 5, "errors": 0 }
}
```

### View products

```bash
curl http://localhost:3000/api/products
```

Expected: 5 products with `blockchainVerified: true` ✅

---

## You're Done! 🎉

Your marketplace now:
- ✅ Reads from blockchain (ProductRegistry)
- ✅ Caches in SQLite (5-min TTL)
- ✅ Auto-syncs every 5 minutes
- ✅ Has 5 test products on-chain

---

## What's Next?

Now that blockchain is working, build:

1. **Wallet authentication** - Let users connect wallets
2. **Product registration UI** - Sellers can list products
3. **Purchase flow** - Buyers can buy with Hollar

See `IMPLEMENTATION_ROADMAP.md` for timeline.

---

## Troubleshooting

**"insufficient funds"** → Get DEV tokens from faucet

**"Sync returns 0 products"** → Run `npm run register-test-products`

**Full guide:** See `DEPLOYMENT_GUIDE.md`

---

**Quick Links:**
- Faucet: https://faucet.moonbeam.network/
- Explorer: https://moonbase.moonscan.io/
- Your contract: https://moonbase.moonscan.io/address/YOUR_ADDRESS
