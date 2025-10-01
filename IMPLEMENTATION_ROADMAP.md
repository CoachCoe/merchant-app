# eShop v0.1 Implementation Roadmap

**Target Date**: December 2025 (16 weeks)
**Goal**: Anonymous Web3 marketplace for digital goods (Internal Parity usage)

---

## 🎯 Executive Summary

This roadmap transforms the cleaned codebase into a fully functional PRD-compliant anonymous decentralized marketplace. The phased approach prioritizes critical Web3 infrastructure first, followed by marketplace features and user experience enhancements.

**Current State**: Clean foundation with session management, database schema, and anonymous browsing ✅
**Target State**: Functional marketplace with wallet auth, escrow transactions, and IPFS storage

---

## Phase 1: Cleanup ✅ (Weeks 1-2) - COMPLETED

### Week 1: Code Removal
- ✅ Remove NFC terminal code (app.ts, nfcService.ts, qrCodeService.ts)
- ✅ Remove Raspberry Pi deployment scripts
- ✅ Remove mock services (polkadotService, escrowService, polkadotTransactionMonitor)
- ✅ Remove unused UI components (TrendingSection, SellerSpotlight, CategoryCarousel)
- ✅ Remove admin dashboard and order management

### Week 2: Code Consolidation
- ✅ Merge Product and MarketplaceProduct models into unified Product interface
- ✅ Clean up package.json dependencies (removed nfc-pcsc, qrcode)
- ✅ Rewrite server.ts without NFC code
- ✅ Make checkout truly anonymous (email optional for digital delivery only)
- ✅ Update test documentation to reflect current state
- ✅ Update README with accurate feature list

**Deliverable**: ✅ Clean PRD-aligned codebase skeleton

---

## Phase 2: Core Infrastructure (Weeks 3-5)

### Week 3: Wallet Authentication

**Files to Create**:
```
src/services/walletConnectionService.ts
src/frontend/components/wallet/WalletConnectionModal.tsx
src/frontend/components/wallet/WalletSelector.tsx
src/frontend/hooks/useWallet.tsx
src/frontend/contexts/WalletContext.tsx
```

**Tasks**:
1. Install dependencies:
   ```bash
   npm install @polkadot/extension-dapp @polkadot/util-crypto
   ```
2. Implement Polkadot.js extension detection and connection
3. Create wallet connection UI with wallet options:
   - Polkadot.js Extension
   - Talisman
   - SubWallet
   - Nova Wallet (via WalletConnect)
4. Implement wallet context to store connected wallet state
5. Add wallet connection to Header component
6. Store connected wallet address in session

**Testing**:
- Unit tests for wallet connection service
- Integration tests for wallet auth flow
- E2E test: Connect wallet → Browse products → View in cart

**Acceptance Criteria**:
- [ ] Users can connect Polkadot.js extension wallet
- [ ] Users can connect Talisman wallet
- [ ] Connected wallet address displays in header
- [ ] Wallet connection persists across page refreshes (session)
- [ ] Disconnect wallet functionality works

---

### Week 4: Real Polkadot.js Integration

**Files to Create**:
```
src/services/polkadotService.ts (new real implementation)
src/services/chainConnectionService.ts
src/config/rpcEndpoints.ts
```

**Tasks**:
1. Initialize Polkadot.js API with WSS endpoints:
   - Polkadot: wss://rpc.polkadot.io
   - Kusama: wss://kusama-rpc.polkadot.io
   - Moonriver: wss://wss.api.moonriver.moonbeam.network
   - Shiden: wss://shiden.api.onfinality.io/public-ws
2. Implement real balance queries:
   ```typescript
   async getBalance(address: string, chainId: number): Promise<bigint>
   ```
3. Implement transaction monitoring:
   ```typescript
   async monitorTransaction(
     txHash: string,
     chainId: number,
     callback: (status: TxStatus) => void
   ): Promise<void>
   ```
4. Add connection pooling and retry logic
5. Cache blockchain data with TTL

**Testing**:
- Unit tests with Polkadot testnet (Westend, Rococo)
- Integration tests for balance queries
- Integration tests for transaction monitoring

**Acceptance Criteria**:
- [ ] Real balance queries work for DOT, KSM, MOVR, SDN
- [ ] Transaction monitoring detects confirmed transactions
- [ ] Connection failover works if primary RPC goes down
- [ ] Balance caching reduces RPC calls

---

### Week 5: IPFS Integration

**Files to Create**:
```
src/services/ipfsService.ts
src/config/ipfs.ts
src/utils/ipfsHelpers.ts
```

**Tasks**:
1. Choose IPFS provider (Pinata or Web3.Storage)
2. Install dependency:
   ```bash
   npm install ipfs-http-client
   # OR
   npm install @web3-storage/w3up-client
   ```
3. Implement metadata upload for products:
   ```typescript
   async uploadProductMetadata(product: Product): Promise<string> // Returns IPFS hash
   ```
4. Implement metadata retrieval:
   ```typescript
   async getProductMetadata(ipfsHash: string): Promise<ProductMetadata>
   ```
5. Implement image upload and pinning
6. Update product creation flow to upload to IPFS
7. Add IPFS hash to Product model

**Testing**:
- Unit tests for IPFS service
- Integration tests for upload/retrieval
- Test pinning service reliability

**Acceptance Criteria**:
- [ ] Product metadata uploads to IPFS on creation
- [ ] Product images upload to IPFS
- [ ] IPFS hashes stored in database
- [ ] Products can be retrieved from IPFS
- [ ] Pinning ensures data persistence

**Deliverable**: Functional wallet connection + real blockchain data + IPFS storage

---

## Phase 3: Smart Contracts & Escrow (Weeks 6-9)

### Week 6-7: Ink! Escrow Contract Development

**Directory to Create**:
```
contracts/
├── escrow/
│   ├── lib.rs
│   ├── Cargo.toml
│   └── tests/
```

**Tasks**:
1. Set up Ink! development environment:
   ```bash
   cargo install cargo-contract --force
   cargo contract new escrow
   ```
2. Develop escrow smart contract:
   ```rust
   #[ink::contract]
   mod escrow {
       pub struct Escrow {
           buyer: AccountId,
           seller: AccountId,
           amount: Balance,
           product_ipfs_hash: String,
           status: EscrowStatus,
           created_at: Timestamp,
           timeout_block: BlockNumber,
       }

       impl Escrow {
           #[ink(constructor)]
           pub fn new(
               seller: AccountId,
               amount: Balance,
               product_ipfs_hash: String,
               timeout_blocks: u32
           ) -> Self { ... }

           #[ink(message, payable)]
           pub fn deposit(&mut self) -> Result<()> { ... }

           #[ink(message)]
           pub fn release_to_seller(&mut self) -> Result<()> { ... }

           #[ink(message)]
           pub fn timeout_release(&mut self) -> Result<()> { ... }
       }
   }
   ```
3. Write comprehensive contract tests
4. Deploy to Rococo testnet
5. Verify contract functionality on testnet

**Testing**:
- Unit tests for contract logic
- Integration tests on Rococo testnet
- Test timeout releases
- Test partial refunds (if in scope)

**Acceptance Criteria**:
- [ ] Contract compiles successfully
- [ ] Contract deploys to Rococo testnet
- [ ] Escrow deposit function works
- [ ] Release to seller function works
- [ ] Timeout auto-release works
- [ ] Contract handles edge cases (insufficient balance, wrong caller, etc.)

---

### Week 8-9: Escrow Contract Integration

**Files to Create**:
```
src/services/escrowContractService.ts
src/services/transactionService.ts
src/frontend/components/escrow/EscrowStatus.tsx
src/frontend/pages/TransactionDetailPage.tsx
```

**Tasks**:
1. Install Polkadot contract interaction libraries:
   ```bash
   npm install @polkadot/api-contract
   ```
2. Implement contract interaction service:
   ```typescript
   class EscrowContractService {
     async createEscrow(
       sellerAddress: string,
       amount: bigint,
       productIpfsHash: string,
       timeoutBlocks: number
     ): Promise<string> // Returns contract address

     async depositFunds(contractAddress: string, amount: bigint): Promise<string> // Returns tx hash

     async releaseToSeller(contractAddress: string): Promise<string>

     async getEscrowStatus(contractAddress: string): Promise<EscrowStatus>
   }
   ```
3. Update marketplace transaction model to include contract address
4. Integrate escrow creation into checkout flow
5. Build escrow status UI component
6. Implement transaction detail page showing escrow state

**Testing**:
- Unit tests for contract service
- Integration tests for full escrow lifecycle:
  - Create product → Add to cart → Checkout → Create escrow → Deposit → Deliver → Release
- E2E test for escrow flow

**Acceptance Criteria**:
- [ ] Escrow contracts are created on purchase
- [ ] Buyer can deposit funds to escrow
- [ ] Seller can deliver product (update IPFS with delivery proof)
- [ ] Buyer can release funds to seller
- [ ] Timeout releases work automatically
- [ ] Transaction status updates in real-time via WebSocket

**Deliverable**: Functional escrow smart contracts deployed on testnet with full integration

---

## Phase 4: Marketplace Features (Weeks 10-12)

### Week 10: Google/Github OAuth + Wallet Generation

**Files to Create**:
```
src/services/oauthService.ts
src/services/walletGenerationService.ts
src/frontend/components/auth/SocialLogin.tsx
src/models/GeneratedWallet.ts
```

**Tasks**:
1. Install dependencies:
   ```bash
   npm install passport passport-google-oauth20 passport-github2
   npm install @polkadot/util-crypto @polkadot/keyring
   ```
2. Set up Passport.js for OAuth (Google + Github)
3. Implement wallet generation on successful OAuth:
   ```typescript
   async generateWallet(userId: string, password: string): Promise<{
     address: string;
     encryptedSeed: string; // Encrypted with user password using Argon2
   }>
   ```
4. Encrypt private key with user-chosen password (KDF: Argon2)
5. Store encrypted seed in database
6. Build social login UI
7. Implement wallet recovery flow

**Security Considerations**:
- Use Argon2 for key derivation
- Store only encrypted seeds, never plaintext
- Warn users to backup recovery phrase
- Consider hardware wallet integration for production

**Testing**:
- Unit tests for wallet generation
- Integration tests for OAuth flow
- Security audit of key storage

**Acceptance Criteria**:
- [ ] Google OAuth login works
- [ ] Github OAuth login works
- [ ] Non-custodial wallet generated on first login
- [ ] Private key encrypted with user password
- [ ] Wallet can be recovered with password
- [ ] Users can export wallet seed

---

### Week 11: Polkadot Identity Display

**Files to Create**:
```
src/services/polkadotIdentityService.ts
src/frontend/components/identity/IdentityBadge.tsx
src/frontend/components/identity/IdentityDisplay.tsx
```

**Tasks**:
1. Implement identity query service:
   ```typescript
   async getIdentity(address: string): Promise<Identity | null> {
     const api = await this.getApiForChain(0); // Polkadot
     const identity = await api.query.identity.identityOf(address);

     if (identity.isSome) {
       return {
         display: identity.unwrap().info.display.toString(),
         email: identity.unwrap().info.email.toString(),
         twitter: identity.unwrap().info.twitter.toString(),
         judgements: identity.unwrap().judgements.length,
         isVerified: identity.unwrap().judgements.some(j => j[1].isReasonable || j[1].isKnownGood)
       };
     }
     return null;
   }
   ```
2. Create identity badge component with verification status
3. Display identity in:
   - Product seller info
   - User profile
   - Transaction details
4. Cache identity data (24 hour TTL)

**Testing**:
- Unit tests for identity service
- Integration tests with real Polkadot identities
- UI tests for badge display

**Acceptance Criteria**:
- [ ] On-chain identities display for connected wallets
- [ ] Verified badges show for judgement-approved identities
- [ ] Identity info includes display name, email, Twitter
- [ ] Identity data is cached to reduce RPC calls

---

### Week 12: Proof-of-Transaction Reputation

**Files to Create**:
```
src/services/reputationService.ts
src/frontend/components/reputation/ReputationScore.tsx
src/frontend/components/reputation/ReputationHistory.tsx
```

**Tasks**:
1. Implement blockchain transaction query:
   ```typescript
   async getUserTransactionHistory(address: string): Promise<Transaction[]> {
     // Query all chains for transactions involving this address
     const [dotTxs, ksmTxs, movrTxs, sdnTxs] = await Promise.all([
       this.getTransactionsForChain(address, 0),
       this.getTransactionsForChain(address, 2),
       this.getTransactionsForChain(address, 1285),
       this.getTransactionsForChain(address, 336)
     ]);
     return [...dotTxs, ...ksmTxs, ...movrTxs, ...sdnTxs];
   }
   ```
2. Implement reputation calculation:
   ```typescript
   calculateReputation(transactions: Transaction[]): number {
     const successfulCount = transactions.filter(tx => tx.status === 'success').length;
     const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
     const recentActivity = transactions.filter(tx =>
       Date.now() - tx.timestamp < 30 * 24 * 60 * 60 * 1000 // Last 30 days
     ).length;

     return Math.min(100, (
       successfulCount * 5 +
       Math.log10(totalVolume + 1) * 10 +
       recentActivity * 2
     ));
   }
   ```
3. Update reputation automatically on new transactions (WebSocket)
4. Build reputation score UI component
5. Build reputation history timeline

**Testing**:
- Unit tests for reputation calculation logic
- Integration tests with real transaction data
- Load tests for reputation queries

**Acceptance Criteria**:
- [ ] Reputation scores based on real blockchain transactions
- [ ] Reputation updates automatically on new transactions
- [ ] Reputation score displays in seller profiles
- [ ] Reputation history shows transaction timeline
- [ ] High reputation sellers have visual badges

**Deliverable**: Complete marketplace features (OAuth, Identity, Reputation)

---

## Phase 5: Testing & Polish (Weeks 13-14)

### Week 13: Comprehensive Testing

**Tasks**:
1. Write missing unit tests to achieve 80%+ coverage:
   - walletConnectionService
   - polkadotService
   - escrowContractService
   - ipfsService
   - reputationService
2. Write integration tests:
   - Full purchase flow (browse → cart → checkout → escrow → release)
   - Wallet connection and disconnection
   - IPFS upload and retrieval
   - Reputation calculation
3. Write E2E tests:
   ```typescript
   test('Anonymous purchase flow', async ({ page }) => {
     // Browse products anonymously
     await page.goto('/');
     await page.click('[data-testid="product-card-1"]');

     // Add to cart
     await page.click('button:has-text("Add to Cart")');
     await page.goto('/cart');

     // Connect wallet
     await page.click('button:has-text("Connect Wallet")');
     await page.click('button:has-text("Polkadot.js Extension")');

     // Checkout
     await page.click('button:has-text("Checkout")');
     await page.click('button:has-text("Continue to Payment")');

     // Create escrow and deposit
     await page.click('button:has-text("Create Escrow")');
     await page.waitForSelector('text=Escrow Created');

     // Verify transaction
     await expect(page.locator('[data-testid="escrow-status"]')).toHaveText('Funded');
   });
   ```

**Acceptance Criteria**:
- [ ] 80%+ test coverage on critical services
- [ ] All API endpoints have integration tests
- [ ] E2E tests cover all user flows
- [ ] All tests pass in CI environment

---

### Week 14: Bug Fixes & Polish

**Tasks**:
1. Fix bugs identified in testing
2. Improve error handling and user feedback
3. Add loading states and skeleton screens
4. Optimize performance:
   - Lazy load components
   - Implement virtual scrolling for product lists
   - Cache blockchain queries
   - Optimize IPFS retrieval
5. Accessibility audit (WCAG 2.1 Level AA)
6. Security audit:
   - Input sanitization
   - SQL injection prevention
   - XSS prevention
   - CSRF protection
7. Update documentation:
   - API documentation (OpenAPI spec)
   - User guides
   - Developer setup guide

**Acceptance Criteria**:
- [ ] Zero known critical bugs
- [ ] Loading states on all async operations
- [ ] Error messages are user-friendly
- [ ] Performance metrics meet targets (3s page load, <2s escrow creation)
- [ ] Accessibility audit passes
- [ ] Security audit passes
- [ ] Documentation is complete and accurate

**Deliverable**: Production-ready codebase with 80%+ test coverage

---

## Phase 6: Internal Deployment (Weeks 15-16)

### Week 15: Staging Deployment

**Tasks**:
1. Set up staging environment:
   - Deploy backend to staging server
   - Deploy frontend to staging CDN
   - Configure environment variables for staging
   - Set up staging database (PostgreSQL or keep SQLite)
2. Deploy smart contracts to Polkadot testnet (Westend or Rococo)
3. Configure IPFS pinning service (Pinata/Web3.Storage production plan)
4. Set up monitoring and logging:
   - Error tracking (Sentry)
   - Performance monitoring (DataDog or New Relic)
   - Log aggregation (CloudWatch or Papertrail)
5. Create deployment scripts:
   ```bash
   npm run deploy:staging
   npm run deploy:production
   ```

**Acceptance Criteria**:
- [ ] Staging environment is live
- [ ] All features work in staging
- [ ] Monitoring dashboards set up
- [ ] Deployment scripts tested

---

### Week 16: Internal Launch

**Tasks**:
1. Internal testing at Parity:
   - Invite Parity employees to test
   - Collect feedback
   - Fix critical issues
2. Create Parity merch store:
   - Upload Parity products (T-shirts, hoodies, stickers)
   - Set up seller account for Parity
   - Configure digital delivery for some items (wallpapers, sticker packs)
3. Create user documentation:
   - How to connect wallet
   - How to browse and purchase
   - How to check transaction status
   - How to contact support
4. Production deployment:
   - Deploy to production environment
   - Announce to Parity team
   - Monitor for issues

**Acceptance Criteria**:
- [ ] Internal testing completed with positive feedback
- [ ] Parity merch store is live with products
- [ ] User documentation published
- [ ] Production deployment successful
- [ ] No critical issues in first 48 hours

**Deliverable**: 🚀 Live internal marketplace for Parity usage

---

## Success Metrics

### Technical Metrics
- ✅ **Code Quality**: ESLint passes, 0 console.errors
- ✅ **Test Coverage**: 80%+ coverage on critical services
- ✅ **Performance**: <3s page load, <2s escrow creation
- ✅ **Uptime**: 99% availability (allows ~7 hours downtime per month)

### User Metrics (Post-Launch)
- **Adoption**: 50+ Parity employees use the marketplace
- **Transactions**: 100+ successful purchases in first month
- **Reputation**: Average seller reputation >80
- **Satisfaction**: NPS >50 from internal users

### Blockchain Metrics
- **Escrow Success Rate**: >95% of escrows complete successfully
- **Transaction Finality**: Average 2 minutes from deposit to confirmation
- **Gas Efficiency**: Average escrow creation cost <$0.50 USD equivalent

---

## Risk Mitigation

### High Risk Items

1. **Escrow Smart Contract Security**
   - **Risk**: Vulnerability could lead to loss of funds
   - **Mitigation**:
     - Comprehensive testing on testnet
     - Security audit before mainnet deployment
     - Use well-audited Ink! patterns
     - Start with small transaction limits

2. **Wallet Private Key Security (OAuth Users)**
   - **Risk**: Compromised database = compromised wallets
   - **Mitigation**:
     - Use Argon2 for key encryption (industry standard)
     - Store only encrypted seeds
     - Recommend hardware wallets for large transactions
     - Add 2FA for wallet access

3. **IPFS Availability**
   - **Risk**: IPFS content may become unavailable
   - **Mitigation**:
     - Use professional pinning service (Pinata/Web3.Storage)
     - Redundant pinning on multiple nodes
     - Fallback to centralized storage for critical data

4. **Blockchain RPC Reliability**
   - **Risk**: RPC nodes may go down, causing transaction failures
   - **Mitigation**:
     - Use multiple RPC endpoints per chain
     - Implement automatic failover
     - Monitor RPC health with status page

### Medium Risk Items

5. **Testnet vs Mainnet**
   - **Risk**: Testnet may not reflect mainnet performance
   - **Mitigation**:
     - Test on Westend (close to Polkadot mainnet)
     - Plan for mainnet deployment in V2
     - Document mainnet migration path

6. **User Onboarding Complexity**
   - **Risk**: Web3 newcomers may struggle with wallets
   - **Mitigation**:
     - Provide OAuth login for easier onboarding
     - Create detailed user guides with screenshots
     - Offer in-app wallet help

---

## Post-Launch Roadmap (V2 - Future)

### Features for V2 (6-12 months post-launch)
1. **Mainnet Deployment**
   - Deploy contracts to Polkadot mainnet
   - Support real-value transactions

2. **USDC/USDT Support**
   - Integrate Asset Hub for stablecoin payments
   - XCM transfers for cross-chain assets

3. **Advanced Reputation**
   - Seller verification badges
   - Buyer/seller reviews
   - Reputation staking

4. **Dispute Resolution**
   - Multi-sig arbitration for disputed escrows
   - Community governance for disputes

5. **Physical Goods Support**
   - Integration with decentralized logistics (if available)
   - Anonymous delivery address management

6. **Mobile App**
   - React Native mobile app
   - Push notifications for transactions

---

## Conclusion

This 16-week roadmap provides a clear path from the current clean codebase to a fully functional anonymous Web3 marketplace. The phased approach ensures:

1. **Solid Foundation** (Weeks 3-5): Wallet auth, blockchain integration, IPFS
2. **Transaction Security** (Weeks 6-9): Escrow smart contracts
3. **User Experience** (Weeks 10-12): OAuth, identity, reputation
4. **Quality Assurance** (Weeks 13-14): Testing and polish
5. **Deployment** (Weeks 15-16): Internal launch at Parity

**Key Success Factors**:
- Focus on digital goods only (V1 scope limitation)
- Use testnet for V1 (low risk, fast iteration)
- Prioritize security and testing
- Gather internal feedback before external launch

**Next Steps**:
1. Review and approve this roadmap
2. Begin Week 3 tasks (Wallet Authentication)
3. Set up project management board (GitHub Projects/Jira)
4. Schedule weekly progress reviews

---

**Status**: 🚀 Ready to Begin Phase 2 | **Target**: Internal Launch Dec 2025 | **Confidence**: High
