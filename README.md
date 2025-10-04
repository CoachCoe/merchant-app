# eShop v0.1 - Anonymous Web3 Marketplace (MVP)

A decentralized marketplace enabling anonymous buying and selling of digital goods using cryptocurrency payments through the Polkadot ecosystem.

## 🚧 Current Status: **In Development**

This is a **work-in-progress MVP** for internal Parity usage. Core marketplace features are being implemented according to the PRD.

### ✅ Implemented
- **Blockchain-First Architecture** - ProductRegistry smart contract as source of truth
- **🔗 Direct Mode** - Frontend can query blockchain directly (no server required for reads)
- **⚡ IndexedDB Cache** - 150x faster repeat visits with offline support
- **🔴 Real-Time Events** - Live blockchain event listening and notifications
- **📊 Purchase History** - Verified on-chain sales tracking from Asset Hub
- **Mode Toggle** - Users choose cached (fast) or direct (trustless) mode
- **IPFS Integration** - Decentralized metadata storage (Pinata)
- **Bulletin Chain Support** - Ready for Q4 2025 launch (2-week ephemeral storage)
- **Automatic Blockchain Indexer** - Background sync keeps cache fresh
- **Direct Hollar Payments** - AssetHub wallet-to-wallet transactions
- **Digital Delivery Service** - Secure token-based file delivery
- **Session-based anonymous browsing** - Browse products without wallet connection
- **Privacy-preserving cart** - Cart tied to session, not identity
- **Anonymous checkout** - No personal information required
- **Product catalog** - Category-based browsing and search
- **Secure session management** - Crypto-generated session IDs
- **Input validation** - Comprehensive Zod schemas
- **Rate limiting** - DDoS protection
- **WebSocket real-time updates** - Status notifications

### 🚧 In Development (See IMPLEMENTATION_ROADMAP.md)
- **Wallet Authentication** - WalletConnect, MetaMask, Talisman, Nova wallet support
- **Google/Github OAuth** - Social login with non-custodial wallet generation
- **Polkadot Identity** - Display onchain identities for connected wallets
- **Wallet Transactions** - Write to blockchain from frontend (register products, etc.)

### ❌ Not in V1 Scope (PRD Limitations)
- Physical goods delivery / anonymous logistics
- Zero-knowledge proof integration
- GDPR compliance tooling
- Traditional payment methods (fiat)
- Decentralized storage (Arweave/Walrus)
- NFT-based product authenticity
- Dispute resolution mechanisms
- Time-locked refunds

## 🎯 Quick Start

### First-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure blockchain environment
cp .env.example .env
# Edit .env with your blockchain config (see SETUP_GUIDE.md)

# 3. Start development servers
npm run dev
```

- **Frontend**: http://localhost:3001 (React app)
- **Backend**: http://localhost:3000 (API server)

**📖 Full setup instructions:** See `SETUP_GUIDE.md` for complete blockchain configuration

### Production Build

```bash
npm run build
npm start
```

## 🏗️ Architecture

### Blockchain-First Design

The app uses a **Web3-native architecture** where blockchain is the source of truth:

```
┌─────────────────────────────────────────────────┐
│          Blockchain Layer (Source of Truth)      │
├─────────────────────────────────────────────────┤
│ • ProductRegistry Smart Contract (EVM)          │
│ • AssetHub (Hollar Payments)                    │
│ • IPFS (Product Metadata)                       │
│ • Bulletin Chain (Ephemeral 2-week Storage)     │
└─────────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────────┐
│       Server Layer (Optional Cache/Indexer)     │
├─────────────────────────────────────────────────┤
│ • SQLite (5-min TTL cache)                      │
│ • Background Blockchain Sync (every 5 min)      │
│ • Digital Delivery Service                      │
│ • React Frontend Server                         │
└─────────────────────────────────────────────────┘
```

**Key Services:**
- `BlockchainService` (Frontend) - Direct blockchain queries from browser
- `BlockchainCacheService` (Frontend) - IndexedDB caching for performance
- `ProductService` - Blockchain-first queries with cache fallback
- `BlockchainSyncService` - Auto-syncs on-chain data to cache
- `ProductRegistryService` - Smart contract interface
- `DirectPaymentService` - Hollar wallet-to-wallet transfers
- `IPFSStorageService` / `BulletinChainStorageService` - Decentralized storage
- `DigitalDeliveryService` - Secure token-based delivery

See `WEB3_ARCHITECTURE.md` for detailed architecture documentation.

### File Structure

```
src/
├── server.ts                          # Express server & WebSocket
├── services/
│   ├── productService.ts              # Blockchain-first product queries
│   ├── blockchainSyncService.ts       # Background indexer
│   ├── productRegistryService.ts      # Smart contract interface
│   ├── directPaymentService.ts        # AssetHub payments
│   ├── purchaseService.ts             # Purchase tracking
│   ├── digitalDeliveryService.ts      # Delivery tokens
│   ├── storage/
│   │   ├── IPFSStorageService.ts      # IPFS/Pinata
│   │   └── BulletinChainStorageService.ts # Bulletin Chain
│   └── databaseService.ts             # SQLite cache
├── routes/                            # API endpoints
├── middleware/                        # Express middleware
├── models/                            # TypeScript types
├── validation/                        # Zod schemas
└── utils/                             # Utilities
```

## 🔒 Security Features

- **Anonymous User System** - Privacy-preserving user management
- **Secure Session Management** - Crypto-generated session IDs
- **Input Validation** - XSS/injection prevention with Zod
- **Rate Limiting** - Configurable limits per endpoint
- **CORS Security** - Production-ready configuration
- **HttpOnly Cookies** - Secure session storage

## 🛠️ API Endpoints

### Products
- `GET /api/products` - List products with pagination/filtering
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Shopping Cart
- `GET /api/cart` - Get current cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove cart item
- `POST /api/cart/clear` - Clear entire cart

### Marketplace (Web3 - In Development)
- `GET /api/marketplace/users` - Get anonymous user profile
- `POST /api/marketplace/users` - Create anonymous user
- `PUT /api/marketplace/users/:id` - Update user reputation

## 🧪 Testing

```bash
npm run test                # Run all tests
npm run test:backend        # Backend unit tests
npm run test:frontend       # Frontend tests
npm run test:coverage       # Coverage report
```

See `tests/README.md` for detailed testing documentation.

## 📊 Database Schema

### Current Tables
- **categories** - Product categories
- **products** - Unified product model (supports marketplace features)
- **carts** - Shopping cart sessions
- **cart_items** - Individual cart items
- **anonymous_users** - User profiles with reputation
- **reputation_events** - Reputation change history

### Planned Tables (For Implementation)
- **marketplace_transactions** - Escrow-based transactions
- **escrow_contracts** - Smart contract tracking

## 📈 Development Roadmap

See `IMPLEMENTATION_ROADMAP.md` for the complete 16-week implementation plan covering:

1. **Weeks 1-2**: Cleanup Phase ✅ (COMPLETED)
2. **Weeks 3-5**: Core Infrastructure (Wallet Auth, Blockchain Integration, IPFS)
3. **Weeks 6-9**: Smart Contracts & Escrow
4. **Weeks 10-12**: Marketplace Features (OAuth, Identity, Reputation)
5. **Weeks 13-14**: Testing & Polish
6. **Weeks 15-16**: Internal Deployment at Parity

## 🔧 Environment Variables

```bash
# Network Selection (choose one)
# Kusama: Moonriver (recommended for production)
EVM_RPC_URL=https://rpc.api.moonriver.moonbeam.network
DEPLOYMENT_NETWORK=moonriver

# Polkadot: Paseo testnet
# EVM_RPC_URL=https://rpc.paseo.io
# DEPLOYMENT_NETWORK=paseo

# Development: Moonbase Alpha
# EVM_RPC_URL=https://rpc.api.moonbase.moonbeam.network
# DEPLOYMENT_NETWORK=moonbase

# Smart Contract
PRODUCT_REGISTRY_CONTRACT_ADDRESS=0x...    # ProductRegistry smart contract

# Asset Hub (for Hollar payments)
ASSETHUB_WSS_URL=wss://polkadot-asset-hub-rpc.polkadot.io
HOLLAR_ASSET_ID=1984

# IPFS Storage
PINATA_API_KEY=your_key
PINATA_SECRET_API_KEY=your_secret
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs

# Blockchain Sync
ENABLE_BLOCKCHAIN_SYNC=true               # Enable background sync
BLOCKCHAIN_SYNC_INTERVAL_MINUTES=5        # Sync every N minutes

# Database (now cache layer)
DATABASE_PATH=./data/merchant.db

# Security
STRICT_IP_VALIDATION=false
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## 📝 Available Scripts

```bash
# Development
npm run dev                      # Start development servers
npm run build                    # Build both frontend and backend
npm start                        # Start production server
npm run lint                     # Run ESLint
npm test                         # Run all tests

# Smart Contract Deployment
npm run contract:compile         # Compile Solidity contracts
npm run contract:deploy          # Deploy to Moonriver (Kusama)
npm run contract:deploy:paseo    # Deploy to Paseo testnet (Polkadot)
npm run contract:deploy:moonbase # Deploy to Moonbase Alpha (dev)

# IPFS & Product Registration
npm run upload-ipfs-metadata     # Upload product metadata to IPFS
npm run register-products-real-ipfs # Register products with real IPFS hashes
```

## 🤝 Contributing

This is an internal Parity project for V1 MVP. See `CLEANUP_PLAN.md` for the detailed cleanup and implementation strategy.

## 📄 Project Documents

### 🚀 Deployment Guides
- `KUSAMA_DEPLOYMENT.md` - **🌟 Kusama & Polkadot EVM deployment (RECOMMENDED)**
- `DEPLOY_CHECKLIST.md` - **⚡ 15-minute deployment checklist**
- `DEPLOY_WITH_IPFS.md` - Complete IPFS & Bulletin Chain deployment
- `DEPLOYMENT_GUIDE.md` - Smart contract deployment guide
- `DEPLOY_NOW.md` - Quick start (5 commands)

### 📚 Architecture & Setup
- `WEB3_ARCHITECTURE.md` - Blockchain-first architecture documentation
- `WEB3_FEATURES_SUMMARY.md` - **🌟 Latest Web3 features (NEW)**
- `DIRECT_MODE_GUIDE.md` - **🔗 Direct blockchain queries guide**
- `SETUP_GUIDE.md` - Complete blockchain configuration guide
- `QUICK_REFERENCE.md` - Commands, endpoints, troubleshooting
- `.env.example` - Environment configuration template

### 📋 Planning
- `IMPLEMENTATION_ROADMAP.md` - 16-week implementation roadmap
- `CLEANUP_PLAN.md` - Detailed cleanup plan and gap analysis
- `tests/README.md` - Testing documentation
- PRD (see project documentation) - Product requirements

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [Express.js](https://expressjs.com/)
- Crypto payments powered by [Polkadot.js](https://polkadot.js.org/) (to be integrated)
- Database management with [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- Input validation with [Zod](https://zod.dev/)
- Security with [Helmet](https://helmetjs.github.io/) and [express-rate-limit](https://github.com/nfriedly/express-rate-limit)

---

**Status**: 🚧 Active Development | **Target**: Internal Parity Usage (Dec 2025) | **Type**: Digital Goods Marketplace MVP
