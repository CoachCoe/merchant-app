# Polkadot SSO Integration - Next Steps

**Status**: Integration code written, blocked by module format incompatibility

---

## ✅ Completed Work

All integration code has been written and is ready:

### 1. Backend (Server-Side)
- ✅ **src/config/auth.ts** - Better Auth configuration with polkadotPlugin
- ✅ **src/routes/auth.ts** - Auth API routes (/api/auth/*)
- ✅ **server.ts** - Updated with auth routes
- ✅ **.env** - SESSION_SECRET configured

### 2. Frontend (Client-Side)
- ✅ **WalletConnect.tsx** - Wallet connection component
- ✅ **CheckoutPage.tsx** - Updated to require wallet authentication
- ✅ **Wallet flow** - Connect → Select account → Sign in → Checkout

### 3. Dependencies
- ✅ better-auth@0.7.0 installed
- ✅ Polkadot packages installed (@polkadot/extension-dapp, @polkadot/util, @polkadot/util-crypto)
- ✅ polkadot-sso package built and linked

---

## 🚧 Current Blocker

**Module Format Incompatibility**:
- polkadot-sso package is built as **CommonJS** (`module: "commonjs"` in tsconfig.json)
- Vite (our frontend bundler) requires **ESM** modules for proper tree-shaking and bundling
- Error: `"usePolkadotAuth" is not exported by "../polkadot-sso/packages/better-auth-polkadot/dist/index.js"`

---

## 🔧 Solutions

### Option 1: Update polkadot-sso to ESM (Recommended)

**File**: `/Users/shawncoe/Documents/dev/polkadot-sso/packages/better-auth-polkadot/tsconfig.json`

Change:
```json
{
  "compilerOptions": {
    "module": "commonjs",  // ← Change this
    // ...
  }
}
```

To:
```json
{
  "compilerOptions": {
    "module": "ES2020",  // or "ESNext"
    // ...
  }
}
```

Then rebuild:
```bash
cd ../polkadot-sso/packages/better-auth-polkadot
npm run build
```

### Option 2: Dual Module Build (Best for NPM Package)

Update `package.json` to build both CommonJS and ESM:

```json
{
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/cjs/index.js",
      "import": "./dist/esm/index.js",
      "types": "./dist/types/index.d.ts"
    }
  },
  "scripts": {
    "build": "npm run build:cjs && npm run build:esm",
    "build:cjs": "tsc --module commonjs --outDir dist/cjs",
    "build:esm": "tsc --module ES2020 --outDir dist/esm"
  }
}
```

### Option 3: Vite Plugin for CommonJS (Workaround)

Add to `vite.config.ts`:
```typescript
import commonjs from '@rollup/plugin-commonjs'

export default defineConfig({
  plugins: [
    react(),
    commonjs({
      include: /node_modules/
    })
  ],
  // ...
})
```

---

## 📋 Next Actions

1. **Choose a solution** from the options above
2. **Rebuild polkadot-sso** with the chosen approach
3. **Test build**: `npm run build`
4. **Test runtime**: `npm run dev`
5. **Test wallet flow**:
   - Browse products (no wallet needed)
   - Add to cart (no wallet needed)
   - Go to checkout
   - Connect wallet (Polkadot.js extension required)
   - Select account
   - Sign authentication message
   - Complete checkout

---

## 🧪 Testing Requirements

### Prerequisites
- Polkadot.js extension installed in browser
- Test account configured in extension
- Some test DOT/KSM in account (for gas)

### Test Scenarios
1. **Anonymous browsing** - Works without wallet
2. **Cart functionality** - Add/remove items without wallet
3. **Checkout gate** - Requires wallet to proceed
4. **Wallet connection** - Polkadot.js extension detected
5. **Account selection** - Multiple accounts shown
6. **Sign-in** - Message signing flow
7. **Authenticated state** - Wallet address displayed
8. **Session persistence** - Refresh page, still authenticated

---

## 📚 Integration Code Summary

### Authentication Flow
```
1. User adds items to cart (anonymous)
   ↓
2. User clicks "Checkout"
   ↓
3. CheckoutPage checks if user.address exists
   ↓
4. If no wallet → Show WalletConnect component
   ↓
5. User clicks "Connect Wallet"
   ↓
6. Polkadot.js extension opens
   ↓
7. User selects account
   ↓
8. POST /api/auth/polkadot/challenge (generate nonce)
   ↓
9. User signs message in extension
   ↓
10. POST /api/auth/polkadot/verify (verify signature)
   ↓
11. JWT session created
   ↓
12. User redirected to payment step
```

### Database Tables (Auto-created by Better Auth)
- `user` - Wallet addresses
- `session` - JWT sessions
- `verification` - Challenge nonces
- `polkadot_account` - Chain-specific data

---

## 🎯 Expected Outcome

Once the module format issue is resolved:

✅ Users can browse anonymously
✅ Users can add to cart without wallet
✅ Checkout requires wallet connection
✅ Multi-chain support (DOT, KSM, Westend)
✅ Secure cryptographic authentication
✅ Session persistence
✅ No personal information required

---

## 📞 Support

If you encounter issues:

1. Check that Polkadot.js extension is installed
2. Verify SESSION_SECRET is set in .env
3. Ensure polkadot-sso is built with ESM modules
4. Check browser console for errors
5. Check server logs for auth failures

---

**Current Status**: All code written, waiting for module format fix to proceed with testing.
