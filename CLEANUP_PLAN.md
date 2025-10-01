# Codebase Cleanup Plan - eShop v0.1 PRD Alignment

## Executive Summary

This document outlines the comprehensive cleanup plan to transform the current NFC payment terminal codebase into a PRD-compliant anonymous decentralized marketplace for digital goods.

**Current State**: NFC payment terminal with marketplace scaffolding (40% PRD compliant)
**Target State**: Anonymous Web3 marketplace for digital goods (100% PRD compliant)

---

## Phase 1: Remove Out-of-Scope Code

### 1.1 NFC Terminal Code (NOT in PRD)

**Files to DELETE**:
- `src/app.ts` - NFC-focused app orchestrator
- `src/services/nfcService.ts` - NFC card reader integration
- `src/types/nfc-pcsc.d.ts` - NFC type definitions
- `src/services/qrCodeService.ts` - QR code generation (fallback for NFC)

**Code to REMOVE from server.ts**:
- Lines 1-2: NFC App import and initialization
- Lines 59: `const nfcApp = new App()` - NFC app instance
- Lines 312-382: `initiatePaymentHandler` - NFC payment flow
- Lines 384-412: `scanWalletHandler` - NFC wallet scanning
- Lines 414-419: `cancelPaymentHandler` - NFC operation cancel
- Lines 520-531: NFC payment routes

**Dependencies to REMOVE from package.json**:
- `nfc-pcsc` - NFC reader library
- `@types/qrcode` - QR code types
- `qrcode` - QR code generation

**Impact**: Removes ~2,000 lines of NFC-specific code not required for Web3 marketplace

---

### 1.2 Raspberry Pi Deployment Scripts (NOT in PRD)

**Directories to DELETE**:
- `scripts/rpi-deploy/` - Complete directory
  - `build-app-production.sh`
  - `build-config.env.template`
  - `build-pi-image-osx.sh`
  - `setup-build-environment.sh`

**Files to DELETE**:
- `README-DEPLOYMENT.md` - Raspberry Pi deployment guide

**Impact**: Removes Pi-specific deployment tooling; V1 is internal web app only

---

### 1.3 Traditional E-commerce Admin Features (NOT in PRD)

**Files to REMOVE**:
- `src/frontend/pages/AdminPage.tsx` - Admin dashboard (PRD is buyer-focused marketplace)
- `src/routes/orders.ts` - Order management (will be replaced with escrow transactions)
- `src/services/orderService.ts` - Order business logic
- `src/models/Order.ts` - Order model

**Routes to REMOVE from server.ts**:
- Lines 509-511: `/api/orders` routes

**Why**: PRD defines a decentralized marketplace where:
- Merchants manage their own storefronts (not centralized admin)
- Orders are escrow transactions, not traditional orders
- Admin features contradict anonymous marketplace principle

---

### 1.4 Mock/Placeholder Code

**Files to DELETE** (to be replaced with real implementations):
- `src/services/polkadotService.ts` - Returns mock balances
- `src/services/escrowService.ts` - Generates fake addresses with Math.random()
- `src/services/polkadotTransactionMonitor.ts` - Will be rewritten for real monitoring
- `src/services/polkadotPriceService.ts` - May need enhancement but keep for now

**Placeholder UI Components to REMOVE**:
- `src/frontend/components/marketplace/TrendingSection.tsx` - Empty placeholder
- `src/frontend/components/marketplace/SellerSpotlight.tsx` - Empty placeholder
- `src/frontend/components/marketplace/CategoryCarousel.tsx` - Empty placeholder

**Routes to REMOVE from App.tsx** (Lines 77-82):
```tsx
<Route path="/marketplace/search" element={<div>Search Results Page (Coming Soon)</div>} />
<Route path="/marketplace/category/:categoryId" element={<div>Category Page (Coming Soon)</div>} />
<Route path="/marketplace/product/:productId" element={<div>Marketplace Product Page (Coming Soon)</div>} />
<Route path="/marketplace/seller/:sellerId" element={<div>Seller Page (Coming Soon)</div>} />
```

**Impact**: Removes ~1,500 lines of non-functional code

---

## Phase 2: Consolidate Data Models

### 2.1 Merge Product Models

**Problem**: Two separate product systems exist:
- `src/models/Product.ts` - Traditional e-commerce
- `src/models/MarketplaceProduct.ts` - Web3 marketplace

**Solution**: Create unified extensible product model

**New Model** (`src/models/Product.ts`):
```typescript
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number; // USD price for conversion
  categoryId: number;
  images: string[]; // IPFS hashes

  // Marketplace-specific fields
  sellerId?: string; // Anonymous user ID or wallet address
  sellerReputation?: number;
  ipfsMetadataHash?: string; // Full metadata on IPFS
  blockchainVerified?: boolean;
  digitalDeliveryUrl?: string; // For digital goods

  // Legacy fields (keep for migration)
  stock?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

**Files to DELETE**:
- `src/models/MarketplaceProduct.ts`
- `src/services/marketplaceProductService.ts` (merge into productService)

**Files to MODIFY**:
- `src/models/Product.ts` - Add marketplace fields
- `src/services/productService.ts` - Handle both traditional and marketplace products
- `src/services/databaseService.ts` - Consolidate product tables

---

### 2.2 Database Schema Consolidation

**Current State**: Two separate database services
- `DatabaseService` - E-commerce tables
- `MarketplaceDatabaseService` - Marketplace tables

**Action**: Merge into single unified schema

**Tables to KEEP**:
- `categories` - Product categories
- `products` - Unified product model (add marketplace columns)
- `carts` - Shopping cart (session-based)
- `cart_items` - Cart items
- `anonymous_users` - User profiles with reputation
- `reputation_events` - Reputation change history
- `marketplace_transactions` - Escrow transactions
- `escrow_contracts` - Smart contract tracking

**Tables to REMOVE**:
- `orders` - Replaced by `marketplace_transactions`
- Duplicate `marketplace_products` table if exists

**Files to MODIFY**:
- `src/services/databaseService.ts` - Unified schema
- `src/services/marketplaceDatabaseService.ts` - DELETE (merge into DatabaseService)

---

## Phase 3: Remove Misleading Documentation

### 3.1 README.md Updates

**Claims to REMOVE** (currently false):
- Line 12: "Dispute Resolution - Automated and manual dispute handling" ❌
- Line 13: "Escrow Protection - Multi-signature escrow for secure transactions" ❌ (currently mock)
- Line 28: "NFC Payments - Tap-to-pay with NFC-enabled wallets" ❌ (not in PRD)
- Line 39: "Escrow Security - Multi-signature wallet protection" ❌ (currently mock)

**Sections to REMOVE**:
- Lines 173-205: "🍓 Raspberry Pi Deployment" - Not in PRD scope
- Lines 207-253: API endpoints for admin/orders - Being removed

**Sections to UPDATE**:
- Lines 5-16: Feature list - Align with actual PRD requirements
- Lines 42-58: Supported Networks - Clarify USDC/USDT not yet supported
- Lines 122-144: Usage section - Remove NFC terminal instructions

---

### 3.2 Test File Cleanup

**E2E Tests to DELETE**:
- `tests/e2e/payment-flow.spec.ts` - Tests non-existent NFC flow with fake data-testid attributes

**Unit Tests to DELETE**:
- Any tests for removed services (nfcService, qrCodeService, orderService)

**Tests to KEEP** (currently functional):
- `tests/unit/services/sessionService.test.ts` ✅
- `tests/unit/services/databaseService.test.ts` ✅
- `tests/unit/middleware/validationMiddleware.test.ts` ✅
- `tests/integration/api/cart.test.ts` ✅
- `tests/integration/api/products.test.ts` ✅
- `src/frontend/components/product/ProductCard.test.tsx` ✅
- `src/frontend/hooks/useCart.test.tsx` ✅

**New Test Structure to CREATE**:
```
tests/
├── unit/
│   ├── services/
│   │   ├── walletAuthService.test.ts (new - not yet implemented)
│   │   ├── polkadotService.test.ts (new - for real blockchain integration)
│   │   ├── escrowService.test.ts (new - for real smart contracts)
│   │   ├── ipfsService.test.ts (new - for IPFS integration)
├── integration/
│   ├── marketplace/
│   │   ├── wallet-connection.test.ts (new)
│   │   ├── escrow-transactions.test.ts (new)
│   │   ├── reputation-system.test.ts (new)
```

---

## Phase 4: Clean Up Dependencies

### 4.1 Dependencies to REMOVE from package.json

**Production Dependencies**:
- `nfc-pcsc: ^0.8.1` - NFC reader (not in PRD)
- `qrcode: ^1.5.4` - QR code generation (NFC fallback, not in PRD)
- `@types/qrcode: ^1.5.5` - QR types

**Development Dependencies** (potentially unused):
- Review and remove if not used after cleanup

### 4.2 Dependencies to ADD (for future PRD implementation)

**Production Dependencies** (Phase 5 - Implementation):
```json
{
  "@polkadot/extension-dapp": "^0.46.0",
  "@walletconnect/web3-provider": "^1.8.0",
  "ipfs-http-client": "^60.0.0",
  "web3.storage": "^4.5.0"
}
```

---

## Phase 5: Fix Anonymous Checkout Flow

### 5.1 Remove Personal Data Collection

**File**: `src/frontend/pages/CheckoutPage.tsx`

**Lines to REMOVE** (176-199):
- Name input field
- Email input field
- Required validation for personal data

**New Anonymous Checkout Flow**:
1. User adds products to cart (session-based)
2. User views cart total
3. User connects wallet (WalletConnect/MetaMask) - **TO BE IMPLEMENTED**
4. Escrow contract created with product details
5. User sends payment to escrow
6. Seller delivers digital product
7. Buyer releases escrow OR auto-release after timeout

**Optional Contact Info**:
- Only for digital delivery notifications (email)
- Clearly marked as optional
- Not stored permanently
- Not shared with seller

---

## Phase 6: Server Simplification

### 6.1 server.ts Cleanup

**Code to REMOVE**:
- Lines 1-2: NFC App import
- Lines 59: NFC app instantiation
- Lines 87-98: PaymentSession interface (NFC-specific)
- Lines 100-112: TransactionRecord interface (will use marketplace_transactions)
- Lines 114-115: activePayments Map (NFC-specific)
- Lines 191-310: monitorTransaction function (NFC-specific)
- Lines 312-382: initiatePaymentHandler (NFC payment)
- Lines 384-412: scanWalletHandler (NFC wallet scan)
- Lines 414-419: cancelPaymentHandler (NFC cancel)
- Lines 421-458: generateQRCodeHandler (NFC QR fallback)
- Lines 460-475: getTransactionHistoryHandler (in-memory, use DB instead)
- Lines 520-533: NFC payment routes
- Lines 602: nfcApp.initializeServices()
- Lines 635: nfcApp.stopServices()

**Impact**: ~400 lines removed from server.ts

**New server.ts Focus**:
- Express app setup
- WebSocket for marketplace updates (transaction confirmations, reputation changes)
- API routes for marketplace features only
- Session management
- Security middleware

---

## Phase 7: Implementation Roadmap for Missing PRD Features

### 7.1 Critical Missing Features (Must Implement)

#### Feature 1: Wallet Authentication
**PRD Requirement**: WalletConnect, MetaMask, Talisman, Nova + Google/Github OAuth

**Files to CREATE**:
- `src/services/walletConnectService.ts`
- `src/services/web3AuthService.ts`
- `src/frontend/components/wallet/WalletConnectionModal.tsx`
- `src/frontend/hooks/useWallet.tsx`

**Implementation Steps**:
1. Install `@polkadot/extension-dapp` for browser extension wallets
2. Install `@walletconnect/web3-provider` for WalletConnect v2
3. Create wallet connection UI (modal with wallet options)
4. Implement wallet detection and connection
5. Store connected wallet in React Context + session
6. Display Polkadot identity if available

**Estimated Effort**: 2-3 weeks

---

#### Feature 2: Real Blockchain Integration
**PRD Requirement**: Actual balance checking, transaction monitoring, no mocks

**Files to REWRITE**:
- `src/services/polkadotService.ts` - Replace all mock functions
- `src/services/polkadotTransactionMonitor.ts` - Real transaction polling

**Implementation Steps**:
1. Initialize Polkadot.js API with WSS endpoints
2. Implement real balance queries for DOT/KSM/MOVR/SDN
3. Implement transaction monitoring with block confirmations
4. Add retry logic and error handling
5. Cache blockchain data appropriately

**Key APIs**:
```typescript
// Real implementation examples
async getBalance(address: string, chainId: number): Promise<bigint> {
  const api = await this.getApiForChain(chainId);
  const { data: { free } } = await api.query.system.account(address);
  return BigInt(free.toString());
}

async monitorTransaction(txHash: string, callback: Function) {
  const api = await this.getApiForChain(chainId);
  const unsubscribe = await api.rpc.chain.subscribeNewHeads(async (header) => {
    // Check if transaction is in finalized block
  });
}
```

**Estimated Effort**: 3-4 weeks

---

#### Feature 3: Real Escrow Smart Contracts
**PRD Requirement**: Multi-signature escrow for secure transactions

**Files to CREATE**:
- `contracts/escrow.rs` - Ink! smart contract (new directory)
- `src/services/escrowContractService.ts` - Contract interaction

**Files to DELETE**:
- `src/services/escrowService.ts` - Current mock implementation

**Implementation Steps**:
1. Develop Ink! smart contract for escrow:
   - Buyer deposits funds
   - Seller delivers product
   - Buyer releases funds OR timeout auto-release
   - Multi-sig for disputes (optional V2 feature)
2. Deploy contract to Rococo testnet (V1) then Polkadot (production)
3. Integrate contract calls in frontend/backend
4. Test escrow lifecycle thoroughly

**Contract Structure**:
```rust
#[ink::contract]
mod escrow {
    pub struct Escrow {
        buyer: AccountId,
        seller: AccountId,
        amount: Balance,
        status: EscrowStatus,
        timeout_block: BlockNumber,
    }

    impl Escrow {
        #[ink(message)]
        pub fn release_to_seller(&mut self) -> Result<()> {
            // Buyer releases funds to seller
        }

        #[ink(message)]
        pub fn timeout_release(&mut self) -> Result<()> {
            // Auto-release after timeout
        }
    }
}
```

**Estimated Effort**: 4-5 weeks (requires Substrate/Ink! expertise)

---

#### Feature 4: IPFS Integration
**PRD Requirement**: IPFS metadata storage for decentralized product data

**Files to CREATE**:
- `src/services/ipfsService.ts`
- `src/config/ipfs.ts`

**Implementation Steps**:
1. Set up IPFS node OR use Pinata/Web3.Storage API
2. Implement metadata upload for products:
   - Title, description, images
   - Seller info (anonymized)
   - Product authenticity data
3. Implement IPFS retrieval for product display
4. Pin important data to prevent loss
5. Update product creation flow to upload to IPFS

**IPFS Metadata Structure**:
```json
{
  "version": "1.0",
  "product": {
    "title": "Digital Product Name",
    "description": "Full description",
    "images": ["ipfs://Qm...", "ipfs://Qm..."],
    "category": "Software",
    "price": 10.00,
    "seller": {
      "anonymousId": "anon_xyz123",
      "reputation": 95
    },
    "digitalDelivery": true,
    "createdAt": "2025-09-30T00:00:00Z"
  }
}
```

**Estimated Effort**: 2 weeks

---

#### Feature 5: OAuth + Wallet Generation
**PRD Requirement**: Google/Github login generates non-custodial wallet

**Files to CREATE**:
- `src/services/oauthService.ts`
- `src/services/walletGenerationService.ts`
- `src/frontend/components/auth/SocialLogin.tsx`

**Implementation Steps**:
1. Set up Passport.js for OAuth (Google + Github)
2. On successful OAuth:
   - Generate ed25519 keypair using `@polkadot/util-crypto`
   - Encrypt private key with user-chosen password (KDF: Argon2)
   - Store encrypted key in database
3. Allow wallet export/recovery
4. Create UI for social login buttons

**Security Considerations**:
- Private keys encrypted at rest
- User must set password to decrypt key
- Warn users to backup recovery phrase
- Consider HSM for production key storage

**Estimated Effort**: 3 weeks

---

#### Feature 6: Polkadot Identity Display
**PRD Requirement**: Show onchain identity for connected wallets

**Files to CREATE**:
- `src/services/polkadotIdentityService.ts`

**Implementation Steps**:
1. Query `identity.identityOf()` for connected wallet
2. Parse identity fields (display name, email, Twitter, etc.)
3. Check judgement status (verified/unverified)
4. Display identity badge in UI
5. Cache identity data

**API Usage**:
```typescript
async getIdentity(address: string): Promise<Identity | null> {
  const api = await this.getApiForChain(0); // Polkadot
  const identity = await api.query.identity.identityOf(address);

  if (identity.isSome) {
    const data = identity.unwrap();
    return {
      display: data.info.display.toString(),
      email: data.info.email.toString(),
      twitter: data.info.twitter.toString(),
      judgements: data.judgements.length
    };
  }
  return null;
}
```

**Estimated Effort**: 1 week

---

#### Feature 7: Proof-of-Transaction Reputation
**PRD Requirement**: Blockchain-based reputation using transaction history

**Files to MODIFY**:
- `src/services/anonymousUserService.ts`

**Implementation Steps**:
1. Query blockchain for all transactions involving user's wallet
2. Calculate reputation based on:
   - Total transaction volume
   - Number of successful transactions
   - Transaction recency (decay old transactions)
   - Escrow releases without disputes
3. Update reputation automatically on new transactions
4. Display reputation score + transaction count in UI

**Reputation Formula**:
```typescript
reputation = (
  successfulTransactions * 10 +
  totalVolumeUSD * 0.1 +
  recentActivityBonus -
  disputePenalty
) / timeSinceFirstTransaction
```

**Estimated Effort**: 2 weeks

---

### 7.2 Medium Priority Features (Post-Cleanup)

#### Feature 8: USDC/USDT Support
**PRD Requirement**: Stablecoin payments

**Implementation Steps**:
1. Add Asset Hub chain config (`src/config/index.ts`)
2. Implement XCM asset transfers for USDC/USDT
3. Update payment selection to prefer stablecoins (price stability)
4. Add stablecoin balance checking

**Estimated Effort**: 2 weeks

---

#### Feature 9: Complete Marketplace UI
**PRD Requirement**: Search, category browsing, seller profiles

**Files to CREATE**:
- `src/frontend/pages/SearchResultsPage.tsx`
- `src/frontend/pages/CategoryPage.tsx`
- `src/frontend/pages/SellerProfilePage.tsx`
- `src/frontend/pages/MarketplaceProductDetailPage.tsx`

**Implementation Steps**:
1. Build search page with filters (price, category, seller reputation)
2. Build category browse page with product grid
3. Build seller profile page showing their listings + reputation
4. Build product detail page with escrow purchase flow

**Estimated Effort**: 2-3 weeks

---

## Execution Plan

### Week 1-2: Cleanup Phase
- ✅ Remove NFC terminal code
- ✅ Remove Raspberry Pi scripts
- ✅ Remove admin features
- ✅ Remove mock services
- ✅ Consolidate data models
- ✅ Clean up database schema
- ✅ Update documentation
- ✅ Remove misleading tests

**Deliverable**: Clean PRD-aligned codebase skeleton

---

### Week 3-5: Core Infrastructure
- 🔨 Implement wallet authentication (WalletConnect, MetaMask, extensions)
- 🔨 Implement real Polkadot.js integration (replace mocks)
- 🔨 Set up IPFS service (Pinata or Web3.Storage)

**Deliverable**: Functional wallet connection + real blockchain data

---

### Week 6-9: Smart Contracts & Escrow
- 🔨 Develop Ink! escrow smart contract
- 🔨 Deploy to Rococo testnet
- 🔨 Integrate contract calls in frontend/backend
- 🔨 Test escrow lifecycle

**Deliverable**: Functional escrow transactions on testnet

---

### Week 10-12: Marketplace Features
- 🔨 Implement OAuth + wallet generation
- 🔨 Implement Polkadot identity display
- 🔨 Implement proof-of-transaction reputation
- 🔨 Complete marketplace UI (search, categories, seller profiles)

**Deliverable**: Full marketplace MVP

---

### Week 13-14: Testing & Polish
- 🧪 Write comprehensive tests (80%+ coverage)
- 🧪 E2E testing on testnet
- 📚 Update documentation
- 🐛 Bug fixes

**Deliverable**: Production-ready V1 MVP

---

### Week 15-16: Internal Deployment
- 🚀 Deploy to staging environment
- 🧪 Internal testing at Parity
- 🐛 Bug fixes and polish
- 📚 Final documentation

**Deliverable**: Internal production deployment for Parity merch store

---

## Success Metrics

### Cleanup Phase Success (Week 1-2)
- ✅ Zero NFC-related code remains
- ✅ Zero mock services (polkadotService, escrowService)
- ✅ Zero placeholder UI components
- ✅ Zero misleading documentation claims
- ✅ Single unified product model
- ✅ Single unified database service
- ✅ 100% PRD feature alignment in codebase structure

### Implementation Success (Week 3-16)
- ✅ Wallet connection works (WalletConnect, MetaMask, Talisman, Nova)
- ✅ Real blockchain balance checking on all chains
- ✅ Functional escrow smart contracts deployed
- ✅ IPFS metadata storage operational
- ✅ OAuth login generates wallets
- ✅ Polkadot identity display works
- ✅ Reputation based on real transactions
- ✅ Anonymous checkout (no personal data)
- ✅ 80%+ test coverage
- ✅ Updated documentation 100% accurate

---

## Risk Assessment

### High Risk Items

1. **Escrow Smart Contract Development**
   - **Risk**: Requires Substrate/Ink! expertise, security critical
   - **Mitigation**: Hire contractor or upskill team; extensive auditing

2. **Wallet Private Key Management**
   - **Risk**: Security vulnerability if keys compromised
   - **Mitigation**: Use industry-standard encryption (Argon2 KDF); recommend hardware wallets

3. **Timeline Pressure**
   - **Risk**: 16 weeks is aggressive for this scope
   - **Mitigation**: Prioritize ruthlessly; defer non-critical features to V2

### Medium Risk Items

4. **IPFS Reliability**
   - **Risk**: IPFS content may become unavailable (unpinned)
   - **Mitigation**: Use pinning service (Pinata); redundant pinning

5. **Blockchain Network Reliability**
   - **Risk**: RPC nodes may go down; transaction delays
   - **Mitigation**: Multiple RPC endpoints; fallback logic; status page

---

## Conclusion

This cleanup plan transforms the codebase from a **NFC payment terminal** to a **PRD-compliant Web3 marketplace**. The phased approach ensures:

1. **Clean Foundation** (Weeks 1-2): Remove all non-PRD code
2. **Core Infrastructure** (Weeks 3-5): Wallet auth + real blockchain
3. **Transaction Security** (Weeks 6-9): Escrow smart contracts
4. **Marketplace Features** (Weeks 10-12): Complete PRD requirements
5. **Quality Assurance** (Weeks 13-14): Testing and polish
6. **Deployment** (Weeks 15-16): Internal production launch

**Estimated Timeline**: 16 weeks (4 months)
**Estimated Team Size**: 2-3 full-time developers + 1 Substrate/Ink! contractor

**Next Step**: Execute Phase 1 cleanup to establish clean codebase foundation.
