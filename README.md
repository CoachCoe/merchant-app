# 🌐 Web3 Anonymous Marketplace

A comprehensive Web3 marketplace that enables anonymous buying and selling using cryptocurrency payments through the Polkadot ecosystem. Built with React, Express.js, and integrated with NFC payment processing for seamless crypto transactions.

## ✨ Features

### 🌐 **Web3 Marketplace Platform**
- **Anonymous Trading** - Buy and sell without revealing identity
- **Advanced Search** - Multi-criteria product discovery with filters
- **Seller Reputation** - Blockchain-based trust scoring system
- **Escrow Protection** - Multi-signature escrow for secure transactions
- **Dispute Resolution** - Automated and manual dispute handling
- **Category Browsing** - Organized product categories with carousel navigation
- **Trending Products** - Popular and featured item discovery
- **Seller Spotlight** - Top seller and new seller showcases

### 🛍️ **E-commerce Platform**
- **Product Catalog** - Browse and filter products by category
- **Shopping Cart** - Add, update, and manage cart items
- **Order Management** - Complete order lifecycle with crypto payments
- **Admin Dashboard** - Manage products, categories, and orders
- **Responsive Design** - Works on mobile, tablet, and desktop
- **PWA Ready** - Can be installed as a mobile app

### 💳 **Crypto Payment Integration**
- **Multi-Chain Support** - DOT, KSM, MOVR, SDN tokens
- **NFC Payments** - Tap-to-pay with NFC-enabled wallets
- **QR Code Payments** - Scan QR codes for wallet payments
- **Real-time Monitoring** - Live transaction status updates
- **Smart Token Selection** - Automatic optimal payment token selection

### 🔒 **Enterprise Security**
- **Anonymous User System** - Privacy-preserving user management
- **Secure Session Management** - Crypto-generated session IDs
- **Input Validation** - Comprehensive Zod schemas preventing XSS/injection
- **Rate Limiting** - DDoS protection with configurable limits
- **Admin Authentication** - Protected admin endpoints with audit logging
- **CORS Security** - Production-ready CORS configuration
- **Escrow Security** - Multi-signature wallet protection for transactions
- **Reputation System** - Blockchain-based trust and verification

## 🌐 Supported Networks

- **Polkadot Relay Chain** (DOT)
- **Kusama Relay Chain** (KSM)
- **Moonriver** (Kusama Parachain - MOVR)
- **Shiden** (Kusama Parachain - SDN)

### 🎯 **Smart Payment Priority**

The system automatically selects the optimal payment token using this priority:

```
Relay Chain Tokens > Parachain Tokens > Other Tokens
```

**Note:** Prioritizes Polkadot and Kusama relay chain tokens (DOT, KSM) over parachain tokens (MOVR, SDN) for optimal security and finality.

## 🚀 Quick Start

### **Development Setup**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   # Create environment file (optional - uses defaults)
   touch .env
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - **Frontend**: http://localhost:3001 (React app)
   - **Backend**: http://localhost:3000 (API server)

### **Production Build**

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

## 🏗️ Architecture

```
src/
├── server.ts                    # Express server & WebSocket handler
├── app.ts                      # Main application orchestrator
├── config/
│   ├── constants.ts            # Application configuration
│   └── index.ts               # Polkadot chain configuration
├── frontend/                   # React frontend application
│   ├── components/            # Reusable UI components
│   ├── pages/                # Page components
│   ├── hooks/                # Custom React hooks
│   └── public/               # Static assets
├── middleware/                # Express middleware
│   ├── sessionMiddleware.ts   # Session management
│   └── validationMiddleware.ts # Input validation
├── models/                    # TypeScript data models
├── routes/                    # API route handlers
├── services/                  # Business logic services
│   ├── databaseService.ts     # SQLite database management
│   ├── sessionService.ts      # Secure session handling
│   ├── nfcService.ts          # NFC reader & wallet scanning
│   ├── polkadotService.ts     # Polkadot balance & monitoring
│   └── paymentService.ts      # Payment processing
├── validation/                # Zod validation schemas
└── utils/                     # Utility functions
```

## 💡 Usage

### **Customer Experience**
1. **Browse Products** - View product catalog with category filtering
2. **Add to Cart** - Select products and quantities
3. **Checkout** - Enter customer information
4. **Crypto Payment** - Pay with DOT/KSM via NFC tap or QR scan
5. **Order Confirmation** - Real-time payment confirmation

### **Admin Management**
1. **Product Management** - Create, update, delete products
2. **Category Management** - Organize products by categories
3. **Order Tracking** - Monitor order status and payments
4. **Analytics** - View sales and transaction data

### **Payment Processing**
1. **NFC Detection** → Customer taps device
2. **Multi-Chain Fetching** → Portfolio analysis across Polkadot ecosystem
3. **Smart Selection** → Optimal payment token based on priority system
4. **QR Code Generation** → Payment request with Substrate address
5. **Real-Time Monitoring** → Polling for transaction confirmation
6. **Order Completion** → Automatic order status updates

## 🔒 Security Features

### **Authentication & Authorization**
- Secure session management with crypto-generated IDs
- Admin endpoint protection with privilege checks
- Session timeout and cleanup mechanisms
- IP validation and security logging

### **Input Validation & Sanitization**
- Comprehensive Zod schemas for all API endpoints
- XSS prevention through input sanitization
- SQL injection prevention via parameterized queries
- Rate limiting with configurable limits per endpoint

### **Data Protection**
- HttpOnly, Secure, SameSite cookies
- CORS configuration for production environments
- Error message standardization to prevent information disclosure
- Audit logging for admin actions

## 🛡️ Transaction Monitoring

- **Polling-based monitoring** for all Polkadot ecosystem chains
- **Real-time balance checking** using Polkadot.js API
- **Automatic timeout** after 5 minutes
- **Block explorer integration** for transaction verification
- **Status tracking**: pending → processing → completed → failed

## 🍓 Raspberry Pi Deployment

This application can be deployed as a **plug-and-play kiosk** on Raspberry Pi hardware for production use.

### **Hardware Requirements**
- Raspberry Pi 4B (4GB+ RAM recommended)
- 7" Official Raspberry Pi Touchscreen 
- **ACR1252U-M1 NFC Reader** (specifically supported)
- 32GB+ MicroSD card

### **Deployment Features**
- **One-command build** creates bootable SD card image
- **Pre-configured WiFi** and API credentials
- **Automatic startup** with fullscreen kiosk mode
- **Safety validation** prevents deployment with test addresses
- **macOS and Linux** build support

### **Quick Deploy**
```bash
# Navigate to deployment scripts
cd scripts/rpi-deploy

# Configure your deployment
cp build-config.env.template build-config.env
# Edit build-config.env with your WiFi, API key, and merchant address

# Build bootable image (macOS)
./build-pi-image-osx.sh

# Flash the generated nfc-terminal-<date>.img.gz file to SD card using Raspberry Pi Imager and boot!
```

📖 **[Complete Deployment Guide](README-DEPLOYMENT.md)**

## 🔧 API Endpoints

### **Products**
- `GET /api/products` - List products with pagination/filtering
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### **Categories**
- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### **Shopping Cart**
- `GET /api/cart` - Get current cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove cart item
- `POST /api/cart/clear` - Clear entire cart

### **Orders**
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details

### **Payment**
- `POST /initiate-payment` - Initiate crypto payment
- `GET /transaction-history` - Get transaction history
- `POST /scan-wallet` - Scan wallet for history

### **Marketplace (Web3)**
- `GET /api/marketplace/products` - List marketplace products with advanced filtering
- `GET /api/marketplace/products/:id` - Get marketplace product details
- `POST /api/marketplace/products` - Create marketplace product listing
- `PUT /api/marketplace/products/:id` - Update marketplace product
- `DELETE /api/marketplace/products/:id` - Delete marketplace product
- `GET /api/marketplace/users` - Get anonymous user profile
- `POST /api/marketplace/users` - Create anonymous user
- `PUT /api/marketplace/users/:id` - Update user reputation
- `GET /api/marketplace/transactions` - List user transactions
- `POST /api/marketplace/transactions` - Create escrow transaction
- `PUT /api/marketplace/transactions/:id` - Update transaction status
- `POST /api/marketplace/transactions/:id/dispute` - Raise dispute
- `POST /api/marketplace/transactions/:id/refund` - Process refund

## 🛠️ Development

### **Available Scripts**
```bash
npm run dev          # Start development servers (frontend + backend)
npm run client:dev   # Start frontend development server only
npm run server:dev   # Start backend development server only
npm run build        # Build both frontend and backend
npm run client:build # Build frontend only
npm run server:build # Build backend only
npm start           # Start production server
npm run lint        # Run ESLint
```

### **Environment Variables**
```bash
# Database
DATABASE_PATH=./data/merchant.db

# Security
STRICT_IP_VALIDATION=false
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Payment
MERCHANT_ADDRESS=your_polkadot_address_here

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## 📊 Database Schema

The application uses SQLite with the following tables:

### **E-commerce Tables**
- **categories** - Product categories
- **products** - Product catalog
- **carts** - Shopping cart sessions
- **cart_items** - Individual cart items
- **orders** - Order records with payment status

### **Marketplace Tables**
- **anonymous_users** - Anonymous user profiles with reputation
- **reputation_events** - User reputation change history
- **marketplace_products** - Web3 marketplace product listings
- **marketplace_transactions** - Escrow-based transactions
- **escrow_contracts** - Multi-signature escrow contract tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [Express.js](https://expressjs.com/)
- Crypto payments powered by [Polkadot.js](https://polkadot.js.org/)
- Database management with [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- Input validation with [Zod](https://zod.dev/)
- Security with [Helmet](https://helmetjs.github.io/) and [express-rate-limit](https://github.com/nfriedly/express-rate-limit)