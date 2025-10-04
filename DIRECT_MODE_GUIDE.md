# Direct Mode Guide - Client-Side Blockchain Queries

**Status:** ✅ Implemented (v1.0)

Direct Mode enables the React frontend to query the ProductRegistry smart contract **directly** via ethers.js, without relying on the server API. This achieves **true Web3 decentralization** while maintaining optional server caching for performance.

---

## 🎯 What is Direct Mode?

### Cached Mode (Default)
```
User → Server API → SQLite Cache → Blockchain (if needed)
```
- **Fast:** Millisecond response times
- **Centralized:** Trust server data
- **Server required:** Cannot work if server is down

### Direct Mode (Web3)
```
User → Browser → ProductRegistry Contract → IPFS
```
- **Trustless:** Verify data directly on blockchain
- **Decentralized:** No server dependency for reads
- **Censorship-resistant:** Cannot be taken down
- **Slower:** Network latency + IPFS fetching

---

## 🚀 Features Implemented

### 1. **Blockchain Service Layer**
- `src/frontend/services/blockchainService.ts`
- Ethers.js integration for contract queries
- IPFS metadata fetching with multi-gateway fallback
- Browser wallet support (MetaMask, etc.)

### 2. **React Hooks**
- `src/frontend/hooks/useBlockchain.tsx`
- **`useProduct(id)`** - Fetch single product (supports both modes)
- **`useProducts(options)`** - Fetch product list
- **`useQueryMode()`** - Toggle between cached/direct
- **`useBlockchainContext()`** - Access blockchain state

### 3. **Mode Toggle UI**
- `src/frontend/components/common/QueryModeToggle.tsx`
- Visual toggle switch in header
- Displays current mode status
- Shows mode capabilities

### 4. **Auto-Initialization**
- Frontend queries `/api/config/blockchain` on load
- Automatically initializes blockchain connection
- Falls back gracefully if config unavailable

### 5. **Updated Components**
- **ProductPage** - Uses `useProduct()` hook, shows data source
- **Header** - Displays QueryModeToggle
- **App.tsx** - Wrapped in BlockchainProvider

---

## 📖 Usage Guide

### For Users

**Toggle Mode:**
1. Visit any page with products
2. See toggle in header: `⚡ Cached` ↔️ `🔗 Direct`
3. Click to switch modes
4. Direct mode indicator: `🔗 Blockchain Data`

**Requirements for Direct Mode:**
- ProductRegistry contract deployed
- RPC endpoint configured
- Browser with Web3 wallet (optional)

### For Developers

**Use in Components:**

```typescript
import { useProduct } from '../hooks/useBlockchain';

function ProductComponent() {
  const { id } = useParams();

  // Automatically uses current query mode
  const { product, loading, error } = useProduct(id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{product.title}</div>;
}
```

**Query Multiple Products:**

```typescript
import { useProducts } from '../hooks/useBlockchain';

function ProductList() {
  const { products, loading, error } = useProducts({
    category: 'digital-goods',
    limit: 10
  });

  return (
    <div>
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

**Manual Mode Control:**

```typescript
import { useQueryMode } from '../hooks/useBlockchain';

function ModeControl() {
  const { queryMode, toggleMode, canUseDirect } = useQueryMode();

  return (
    <button onClick={toggleMode} disabled={!canUseDirect}>
      Current: {queryMode}
    </button>
  );
}
```

---

## ⚙️ Configuration

### Server Configuration

Add to `.env`:
```bash
# Enable blockchain sync (keeps cache fresh)
ENABLE_BLOCKCHAIN_SYNC=true

# Contract address (required for direct mode)
PRODUCT_REGISTRY_CONTRACT_ADDRESS=0x1234...

# RPC endpoint (required for direct mode)
EVM_RPC_URL=https://rpc.api.moonriver.moonbeam.network

# Network
DEPLOYMENT_NETWORK=moonriver

# IPFS gateway
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
```

### Frontend Auto-Initialization

The frontend automatically:
1. Calls `GET /api/config/blockchain`
2. Receives RPC URL and contract address
3. Initializes ethers.js provider
4. Creates contract instance
5. Enables direct mode toggle

**API Response:**
```json
{
  "success": true,
  "data": {
    "rpcUrl": "https://rpc.api.moonriver.moonbeam.network",
    "contractAddress": "0x1234...",
    "network": "moonriver",
    "ipfsGateway": "https://gateway.pinata.cloud/ipfs"
  }
}
```

---

## 🔍 How It Works

### Data Flow - Cached Mode

```
1. User requests product
   ↓
2. React calls: fetch('/api/products/123')
   ↓
3. Server checks SQLite cache
   ↓
4. If stale, sync from blockchain
   ↓
5. Return cached data
```

### Data Flow - Direct Mode

```
1. User requests product
   ↓
2. React calls: service.getProductWithMetadata(id)
   ↓
3. ethers.js queries: contract.getProduct(id)
   ↓
4. Parse on-chain data (name, price, IPFS hash)
   ↓
5. Fetch metadata: fetch(`ipfs://${ipfsHash}`)
   ↓
6. Try gateways: Pinata → ipfs.io → Cloudflare
   ↓
7. Merge on-chain + IPFS data
   ↓
8. Return to React component
```

---

## 📊 Performance Comparison

| Metric | Cached Mode | Direct Mode |
|--------|-------------|-------------|
| **Response Time** | ~50ms | ~500-2000ms |
| **Blockchain Queries** | 0 (uses cache) | 1 per product |
| **IPFS Fetches** | 0 (cached) | 1 per product |
| **Server Dependency** | ✅ Required | ❌ Optional |
| **Trustless** | ❌ No | ✅ Yes |
| **Censorship Resistant** | ❌ No | ✅ Yes |
| **Works Offline** | ❌ No | ⚠️ With cache |

**Recommendation:**
- **Casual browsing**: Use cached mode (fast)
- **Verifying data**: Use direct mode (trustless)
- **High-value transactions**: Use direct mode (verify price on-chain)

---

## 🧪 Testing Direct Mode

### 1. Deploy Contract

```bash
npm run contract:deploy          # Moonriver
# OR
npm run contract:deploy:paseo    # Paseo testnet
```

Copy contract address to `.env`:
```bash
PRODUCT_REGISTRY_CONTRACT_ADDRESS=0xYourAddress
```

### 2. Register Products with IPFS

```bash
npm run upload-ipfs-metadata
npm run register-products-real-ipfs
```

### 3. Start Server

```bash
npm run dev
```

### 4. Test in Browser

1. Open http://localhost:3001
2. Click mode toggle in header
3. Switch to "Direct" mode
4. Navigate to a product page
5. Check for `🔗 Blockchain Data` badge
6. Open browser console and watch for:
   ```
   Fetching product from blockchain: 0x123...
   Fetching IPFS metadata: QmXXX...
   ```

### 5. Verify Data

**Check on-chain data:**
```bash
# Using Hardhat console
npx hardhat console --network moonriver

const registry = await ethers.getContractAt(
  "ProductRegistry",
  "0xYourAddress"
);

const productIds = await registry.getAllActiveProducts();
const product = await registry.getProduct(productIds[0]);
console.log(product);
```

**Check IPFS metadata:**
```bash
curl https://gateway.pinata.cloud/ipfs/QmYourHash
```

---

## 🔒 Security Considerations

### RPC Endpoint Exposure
- ✅ **Safe:** RPC URLs are public read-only endpoints
- ✅ **No secrets:** No private keys sent to frontend
- ⚠️ **Rate limits:** Public RPCs may have limits (consider private RPC for production)

### Contract Address
- ✅ **Safe:** Contract addresses are public
- ✅ **Read-only:** Frontend only reads data, cannot modify

### IPFS Gateways
- ✅ **Multi-gateway fallback:** Tries 3 gateways if one fails
- ✅ **Content-addressed:** Cannot serve fake data (CID verification)
- ⚠️ **Privacy:** IPFS gateway sees your requests (use local IPFS node for privacy)

### Wallet Connection (Future)
- ⚠️ **Prompt user:** Always show wallet connection prompt
- ⚠️ **Permissions:** Only request account access, not transactions
- ⚠️ **Phishing:** Verify contract address before connecting

---

## 🛠️ Troubleshooting

### Direct Mode Toggle Disabled

**Problem:** Toggle shows "⚠️ Blockchain not initialized"

**Solutions:**
1. Check `.env` has `PRODUCT_REGISTRY_CONTRACT_ADDRESS` and `EVM_RPC_URL`
2. Restart server: `npm run dev`
3. Check browser console for errors
4. Verify config endpoint: `curl http://localhost:3000/api/config/blockchain`

### Products Not Loading in Direct Mode

**Problem:** Spinner forever, no data

**Check browser console:**
```javascript
// Error: "Failed to fetch product from blockchain"
```

**Solutions:**
1. Verify contract is deployed:
   ```bash
   # Visit block explorer
   https://moonriver.moonscan.io/address/YOUR_CONTRACT
   ```
2. Check RPC endpoint is accessible:
   ```bash
   curl -X POST YOUR_RPC_URL \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```
3. Verify products exist on-chain:
   ```bash
   npx hardhat console --network moonriver
   const count = await registry.getTotalProducts();
   console.log(count); // Should be > 0
   ```

### IPFS Metadata Not Loading

**Problem:** Products show but no descriptions/images

**Check browser console:**
```javascript
// Error: "Failed to fetch from all IPFS gateways"
```

**Solutions:**
1. Wait 60 seconds (IPFS propagation)
2. Try opening IPFS URL directly in browser
3. Check Pinata dashboard for pinned files
4. Re-upload metadata:
   ```bash
   npm run upload-ipfs-metadata
   npm run register-products-real-ipfs
   ```

### Slow Performance in Direct Mode

**Problem:** 3-5 second load times

**This is normal!** Direct mode queries:
- Blockchain RPC (~200-500ms)
- IPFS gateway (~500-2000ms)
- Multiple products = longer

**Solutions:**
1. Use cached mode for browsing
2. Consider private RPC endpoint (faster)
3. Run local IPFS node (faster IPFS)
4. Implement IndexedDB caching (future enhancement)

---

## 📁 Files Added/Modified

### New Files
- `src/frontend/services/blockchainService.ts` - Core blockchain service
- `src/frontend/hooks/useBlockchain.tsx` - React hooks
- `src/frontend/components/common/QueryModeToggle.tsx` - UI component
- `src/frontend/components/common/QueryModeToggle.css` - Styling
- `src/routes/config.ts` - Config API endpoint
- `DIRECT_MODE_GUIDE.md` - This guide

### Modified Files
- `src/frontend/App.tsx` - Added BlockchainProvider
- `src/frontend/pages/ProductPage.tsx` - Uses useProduct hook
- `src/frontend/components/common/Header.tsx` - Added QueryModeToggle
- `src/server.ts` - Registered config routes

---

## 🎯 Next Steps

### Phase 1 (Current) ✅
- [x] Client-side blockchain service
- [x] React hooks for queries
- [x] Mode toggle UI
- [x] Auto-initialization

### Phase 2 (Future)
- [ ] IndexedDB caching (offline support)
- [ ] WebSocket blockchain events (real-time updates)
- [ ] Wallet connection for writes
- [ ] Transaction signing (register products from frontend)

### Phase 3 (Future)
- [ ] Deploy frontend to IPFS
- [ ] ENS domain (yourapp.eth)
- [ ] Service worker (fully offline)
- [ ] No server required

---

## 🌟 Benefits Achieved

### Web3 Values
- ✅ **Trustless:** Users verify data directly
- ✅ **Decentralized:** No single point of failure
- ✅ **Transparent:** All queries verifiable on-chain
- ✅ **Censorship-resistant:** Cannot be taken down

### User Experience
- ✅ **Choice:** Users choose cached (fast) or direct (trustless)
- ✅ **Progressive enhancement:** Works in both modes
- ✅ **Graceful degradation:** Falls back to cached if blockchain unavailable
- ✅ **Visual feedback:** Clear mode indicators

### Developer Experience
- ✅ **Simple API:** `useProduct(id)` works in both modes
- ✅ **Type-safe:** Full TypeScript support
- ✅ **Composable:** Easy to add new blockchain features
- ✅ **Testable:** Can mock blockchain service

---

## 📖 Related Documentation

- **Architecture:** See `WEB3_ARCHITECTURE.md`
- **Deployment:** See `KUSAMA_DEPLOYMENT.md`
- **Smart Contracts:** See `contracts/ProductRegistry.sol`
- **API Reference:** See `QUICK_REFERENCE.md`

---

**Direct Mode Version:** 1.0
**Last Updated:** 2025-10-04
**Status:** ✅ Production Ready
