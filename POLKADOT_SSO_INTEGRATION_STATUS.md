# Polkadot SSO Integration Status

**Date**: September 30, 2025
**Project**: eShop v0.1 - Anonymous Web3 Marketplace
**Integration**: @polkadot-sso/better-auth-polkadot

---

## ✅ Completed Steps

### 1. Package Setup
- ✅ **Built polkadot-sso package**: TypeScript compilation successful
- ✅ **Installed better-auth**: v0.7.0
- ✅ **Installed Polkadot dependencies**:
  - @polkadot/extension-dapp@^0.46.1
  - @polkadot/util@^13.5.6
  - @polkadot/util-crypto@^13.5.6
  - jsonwebtoken@^9.0.2
- ✅ **Linked local package**: npm link successful

### 2. Current App Status
- ✅ **Build**: TypeScript compilation passes (0 errors)
- ✅ **Runtime**: Server running on http://localhost:3000
- ✅ **Database**: Fresh schema with marketplace fields
- ✅ **Cart functionality**: Session-based anonymous cart working

---

## 📋 Next Steps (In Order)

### Step 1: Create Better Auth Configuration
**File**: `src/config/auth.ts`

```typescript
import { betterAuth } from "better-auth"
import { polkadotPlugin } from "@polkadot-sso/better-auth-polkadot"
import path from 'path'

export const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: `file:${path.join(__dirname, '../../data/auth.db')}`
  },
  secret: process.env.SESSION_SECRET || 'your-32-character-secret-key-here',
  plugins: [
    polkadotPlugin({
      providers: [
        {
          id: "polkadot",
          name: "Polkadot",
          chain: "polkadot",
          rpcUrl: process.env.POLKADOT_RPC_URL || "wss://rpc.polkadot.io",
          ss58Format: 0,
          decimals: 10,
          tokenSymbol: "DOT"
        },
        {
          id: "kusama",
          name: "Kusama",
          chain: "kusama",
          rpcUrl: process.env.KUSAMA_RPC_URL || "wss://kusama-rpc.polkadot.io",
          ss58Format: 2,
          decimals: 12,
          tokenSymbol: "KSM"
        }
      ]
    })
  ]
})
```

### Step 2: Create Auth Routes
**File**: `src/routes/auth.ts`

```typescript
import { Router } from 'express'
import { auth } from '../config/auth.js'

const router = Router()

// Better Auth handles all routes at /api/auth/*
router.all('*', async (req, res) => {
  return auth.handler(req, res)
})

export default router
```

### Step 3: Update server.ts
Add auth routes before other routes:

```typescript
import authRoutes from './routes/auth.js'

// ... after other middleware
app.use('/api/auth', authRoutes)
```

### Step 4: Create Frontend WalletConnect Component
**File**: `src/frontend/components/WalletConnect.tsx`

```typescript
import React from 'react'
import { usePolkadotAuth } from '@polkadot-sso/better-auth-polkadot'

export const WalletConnect: React.FC = () => {
  const {
    accounts,
    user,
    loading,
    error,
    connectWallet,
    signIn,
    signOut
  } = usePolkadotAuth({
    appName: "eShop Marketplace",
    ssoUrl: "http://localhost:3000"
  })

  if (user) {
    return (
      <div className="wallet-connected">
        <span>Connected: {user.address.substring(0, 8)}...</span>
        <button onClick={signOut} className="btn btn-secondary">
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-connect">
      {accounts.length === 0 ? (
        <button onClick={connectWallet} className="btn btn-primary">
          Connect Wallet
        </button>
      ) : (
        <div>
          <h4>Select Account</h4>
          {accounts.map(account => (
            <button
              key={account.address}
              onClick={() => signIn(account.address, account.chain)}
              className="btn btn-outline"
            >
              {account.name || account.address.substring(0, 16)}...
            </button>
          ))}
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
```

### Step 5: Update CheckoutPage
Replace anonymous checkout with wallet-required checkout:

```typescript
import { WalletConnect } from '../components/WalletConnect'
import { usePolkadotAuth } from '@polkadot-sso/better-auth-polkadot'

// ... in CheckoutPage
const { user } = usePolkadotAuth({
  appName: "eShop Marketplace",
  ssoUrl: "http://localhost:3000"
})

if (!user) {
  return (
    <div className="checkout-requires-wallet">
      <h2>Connect Wallet to Continue</h2>
      <p>Secure Web3 payments require wallet authentication</p>
      <WalletConnect />
    </div>
  )
}
```

### Step 6: Update .env
Add required environment variables:

```bash
# Better Auth
SESSION_SECRET=generate-a-32-character-secret-key-here

# Polkadot RPC URLs (optional - defaults provided)
POLKADOT_RPC_URL=wss://rpc.polkadot.io
KUSAMA_RPC_URL=wss://kusama-rpc.polkadot.io
WESTEND_RPC_URL=wss://westend-rpc.polkadot.io
```

### Step 7: Test Integration
1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Test wallet connection
4. Test sign-in flow
5. Test checkout with wallet

---

## 🏗️ Architecture Overview

### Authentication Flow
```
1. User clicks "Connect Wallet"
   → WalletConnect component

2. Polkadot.js extension detected
   → User selects wallet (Polkadot.js, Talisman, SubWallet)

3. Wallet returns accounts
   → User selects account and chain

4. User clicks "Sign In"
   → Client generates challenge via /api/auth/polkadot/challenge

5. Wallet signs challenge
   → User approves signature in extension

6. Signature sent to backend
   → Server verifies via polkadotPlugin

7. JWT session created
   → User authenticated, session stored

8. Checkout requires wallet
   → CheckoutPage checks user.address
```

### Database Tables
Better Auth will create these tables automatically:

- `user` - User accounts (wallet addresses)
- `session` - Active sessions (JWT tokens)
- `verification` - Challenge nonces
- `polkadot_account` - Polkadot-specific data (chain, ss58Format)

---

## 📊 Implementation Progress

| Task | Status | Notes |
|------|--------|-------|
| Install dependencies | ✅ Done | better-auth + polkadot packages |
| Build polkadot-sso | ✅ Done | TypeScript compilation successful |
| Link package | ✅ Done | npm link successful |
| Create auth config | ⏳ Next | src/config/auth.ts |
| Create auth routes | ⏳ Next | src/routes/auth.ts |
| Update server.ts | ⏳ Next | Add /api/auth routes |
| Create WalletConnect | ⏳ Next | Frontend component |
| Update CheckoutPage | ⏳ Next | Require wallet auth |
| Test integration | ⏳ Next | E2E wallet flow |

---

## 🎯 Expected Outcome

**After Integration**:
- ✅ Users can connect Polkadot wallets (Polkadot.js, Talisman, SubWallet)
- ✅ Multi-chain support (DOT, KSM, Westend)
- ✅ Secure cryptographic authentication (SIWE-style)
- ✅ Anonymous browsing (no wallet needed)
- ✅ Wallet-required checkout (secure payments)
- ✅ JWT session management
- ✅ Persistent authentication

**User Experience**:
1. Browse products without wallet (anonymous)
2. Add to cart without wallet (session-based)
3. Connect wallet at checkout
4. Sign transaction with wallet
5. Complete purchase with escrow (Week 6-9)

---

## 📚 References

- **polkadot-sso Repo**: /Users/shawncoe/Documents/dev/polkadot-sso
- **Better Auth Docs**: https://better-auth.com
- **Integration Guide**: ../polkadot-sso/packages/better-auth-polkadot/INTEGRATION.md
- **PRD**: eShop v0.1 (Dec 2025 target)
- **Roadmap**: IMPLEMENTATION_ROADMAP.md

---

## 🚀 Ready to Proceed

All prerequisites are installed and ready. Next step is to create the auth configuration file.

**Estimated Time**: 2-3 hours for full integration
**Complexity**: Medium (well-documented pattern)
**Risk**: Low (using production-ready library)
