# Smart Contract Deployment Guide

## Prerequisites

1. **MetaMask wallet** with test DEV tokens
2. **Pinata account** for IPFS (free tier is fine)
3. **Node.js** and npm installed

---

## Step 1: Get Test Tokens (5 min)

### Get DEV tokens for Moonbase Alpha

1. Visit: https://faucet.moonbeam.network/
2. Select network: **Moonbase Alpha**
3. Enter your wallet address
4. Click "Submit"
5. Wait ~30 seconds for tokens to arrive

You'll receive **1 DEV** (enough for many deployments)

---

## Step 2: Configure Deployment (2 min)

### Get your private key from MetaMask

⚠️ **Security Warning:** Never share your private key or commit it to git!

1. Open MetaMask
2. Click your account icon → **Account Details**
3. Click **Export Private Key**
4. Enter your password
5. Copy the private key (starts with `0x`)

### Update `.env` file

```bash
# Open .env file
nano .env

# Add these lines:
DEPLOYER_PRIVATE_KEY=0xyour_private_key_here
MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
```

Save and close (Ctrl+X, then Y, then Enter)

---

## Step 3: Deploy Contract (5 min)

### Compile the contract

```bash
npm run contract:compile
```

**Expected output:**
```
Compiled 1 Solidity file successfully
```

### Deploy to Moonbase Alpha

```bash
npm run contract:deploy
```

**Expected output:**
```
🚀 Deploying ProductRegistry contract...

Deployer address: 0xYourAddress
Account balance: 1.0 ETH

Deploying contract...

✅ ProductRegistry deployed!
📍 Contract address: 0x1234567890abcdef...

📝 Update your .env file:
PRODUCT_REGISTRY_CONTRACT_ADDRESS=0x1234567890abcdef...

✅ Deployment complete!
```

### Copy the contract address

Copy the contract address from the output and add it to `.env`:

```bash
PRODUCT_REGISTRY_CONTRACT_ADDRESS=0xYourContractAddressFromAbove
```

---

## Step 4: Register Test Products (3 min)

Now that the contract is deployed, let's register some test products:

```bash
npm run register-test-products
```

**Expected output:**
```
🛍️  Registering test products on blockchain...

Seller address: 0xYourAddress
Contract address: 0x1234...

📦 Registering products...

Registering: Web3 Development Course
  ✅ Product ID: 0xabcd...
     Price: 50 Hollar
     Category: digital-goods
     TX: 0xtxhash...

Registering: NFT Digital Art Pack
  ✅ Product ID: 0xefgh...
     Price: 25 Hollar
     Category: collectibles
     TX: 0xtxhash...

... (3 more products)

📊 Summary:
   Total registered: 5/5
   On-chain total: 5
   Active products: 5

✅ Test products registered!
```

---

## Step 5: Test Blockchain Sync (5 min)

### Start the server

```bash
npm run dev
```

**Check logs for:**
```
✅ ProductRegistryService initialized
✅ Connected to AssetHub
✅ Blockchain sync service started
```

### Trigger manual sync

In a new terminal:

```bash
curl -X POST http://localhost:3000/api/products/sync/blockchain
```

**Expected response:**
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

### Verify products are cached

```bash
curl http://localhost:3000/api/products | json_pp
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "...",
        "onChainId": "0xabcd...",
        "title": "Web3 Development Course",
        "priceHollar": 50,
        "blockchainVerified": true,
        ...
      },
      ...
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

---

## Deployment Checklist

- [ ] Got test DEV tokens from faucet
- [ ] Added `DEPLOYER_PRIVATE_KEY` to `.env`
- [ ] Compiled contract: `npm run contract:compile`
- [ ] Deployed contract: `npm run contract:deploy`
- [ ] Copied contract address to `.env`
- [ ] Registered test products: `npm run register-test-products`
- [ ] Started server: `npm run dev`
- [ ] Tested sync: `curl -X POST .../sync/blockchain`
- [ ] Verified products appear: `curl .../products`

---

## Troubleshooting

### "insufficient funds for gas"

**Problem:** Not enough DEV tokens

**Solution:** Get more from faucet (https://faucet.moonbeam.network/)

---

### "invalid sender" or "sender doesn't have permission"

**Problem:** Wrong private key or network mismatch

**Solution:**
1. Double-check private key in `.env`
2. Ensure you're deploying to Moonbase Alpha
3. Verify wallet has DEV tokens

---

### "Error: could not detect network"

**Problem:** RPC endpoint unreachable

**Solution:**
1. Check internet connection
2. Try alternative RPC: `https://moonbase-alpha.public.blastapi.io`
3. Add to `.env`: `MOONBASE_RPC_URL=https://...`

---

### Blockchain sync returns 0 products

**Problem:** Contract deployed but no products registered

**Solution:** Run `npm run register-test-products`

---

### Products don't appear in API

**Problem:** Cache not populated from blockchain

**Solution:**
1. Check logs for sync errors
2. Verify `ENABLE_BLOCKCHAIN_SYNC=true`
3. Manually trigger: `curl -X POST .../sync/blockchain`

---

## Production Deployment (Mainnet)

⚠️ **Warning:** Mainnet deployment costs real tokens!

### For Moonbeam Mainnet:

1. Get GLMR tokens (not free - use exchange)
2. Update `.env`:
   ```bash
   MOONBEAM_RPC_URL=https://rpc.api.moonbeam.network
   EVM_RPC_URL=https://rpc.api.moonbeam.network
   ```
3. Deploy with mainnet flag:
   ```bash
   npx hardhat run scripts/deploy.ts --network moonbeam
   ```

### Network Comparison

| Network | Tokens | Cost | Use Case |
|---------|--------|------|----------|
| **Moonbase Alpha** | Free DEV | Free | Development & Testing |
| **Moonbeam** | GLMR | Paid | Production |
| **Hardhat Local** | ETH | Free | Unit Testing |

---

## Contract Verification (Optional)

To verify your contract on Moonscan:

```bash
npx hardhat verify --network moonbase <CONTRACT_ADDRESS>
```

Get Moonscan API key: https://moonscan.io/myapikey

Add to `.env`:
```bash
MOONSCAN_API_KEY=your_key_here
```

---

## Security Best Practices

### Deployment Keys

✅ **DO:**
- Use a dedicated deployment wallet
- Limit funds to deployment costs only
- Rotate keys periodically
- Use `.env` file (gitignored)

❌ **DON'T:**
- Use your main wallet for deployment
- Commit private keys to git
- Share keys in Slack/Discord
- Reuse keys across projects

### Contract Security

- [ ] Test on testnet first
- [ ] Audit contract before mainnet
- [ ] Use multi-sig for admin functions
- [ ] Monitor for unusual activity
- [ ] Have upgrade/pause plan

---

## Next Steps

After successful deployment:

1. ✅ Contract deployed and verified
2. ✅ Test products registered
3. ✅ Blockchain sync working
4. ⏭️ Build wallet authentication UI
5. ⏭️ Enable users to register products
6. ⏭️ Implement purchase flow

See `IMPLEMENTATION_ROADMAP.md` for full feature timeline.

---

## Contract Info

**Contract:** ProductRegistry.sol
**Solidity:** ^0.8.20
**License:** MIT
**Network:** Moonbase Alpha (testnet)
**Chain ID:** 1287

**Features:**
- Create stores
- Register products
- Update products
- Query by seller/category
- View all active products

---

## Support

- Hardhat docs: https://hardhat.org/docs
- Moonbeam docs: https://docs.moonbeam.network/
- Faucet: https://faucet.moonbeam.network/
- Moonscan: https://moonbase.moonscan.io/

**Stuck?** Check SETUP_GUIDE.md or create a GitHub issue.
