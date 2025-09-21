# Polkadot NFC Payment Terminal

A Polkadot ecosystem NFC payment terminal that processes cryptocurrency payments across Polkadot and Kusama networks with real-time transaction monitoring and comprehensive history tracking.

## 🌐 Supported Networks

- **Polkadot Relay Chain** (DOT)
- **Kusama Relay Chain** (KSM)
- **Moonriver** (Kusama Parachain - MOVR)
- **Shiden** (Kusama Parachain - SDN)

### 🎯 **Smart Payment Priority**

Rather than negotiate a chain / token combo with the merchant, the payment terminal handles it automatically. First it figures out a chain the merchant supports that you also have funds on, then sends a transaction with native tokens using this priority:

```
Relay Chain Tokens > Parachain Tokens > Other Tokens
```

**Note:** The terminal prioritizes Polkadot and Kusama relay chain tokens (DOT, KSM) over parachain tokens (MOVR, SDN) for optimal security and finality.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   # No API key required - uses public RPC endpoints
   touch .env
   ```

3. **Run the terminal:**
   ```bash
   npm start
   ```

4. **Open the interface:**
   Navigate to `http://localhost:3000`

## 🏗️ Architecture

```
src/
├── server.ts                   # Express server & WebSocket handler
├── app.ts                     # Main application orchestrator
├── web/index.html             # Payment terminal UI
├── config/index.ts            # Polkadot chain configuration
└── services/
    ├── nfcService.ts          # NFC reader & wallet scanning
    ├── polkadotService.ts     # Polkadot balance & monitoring
    ├── paymentService.ts      # Payment selection & QR generation
    ├── polkadotPriceService.ts # Price fetching for Polkadot tokens
    └── addressProcessor.ts    # Duplicate processing prevention
scripts/
└── rpi-deploy/
    ├── setup-build-environment.sh  # Install dependencies to allow building a Raspberry Pi image
    └── build-pi-image-osx.sh       # Build a Raspberry Pi image
```

## 💡 Usage

### **Processing Payments**
1. Enter amount using the keypad (cents-based: "150" = $1.50)
2. Tap "Charge" to initiate payment
3. Customer taps NFC device to send payment
4. Real-time monitoring confirms transaction
5. "Approved" message with block explorer link

### **Transaction History**
1. Tap the 📜 history button on the keypad
2. View all transactions or scan a wallet for specific history
3. Tap "📱 Scan Wallet for History" and have customer tap their device
4. Browse filtered transactions for that specific wallet


## 🔄 Payment Flow

1. **NFC Detection** → Customer taps device
2. **Multi-Chain Fetching** → Portfolio analysis across Polkadot ecosystem
3. **Smart Selection** → Optimal payment token based on priority system
4. **QR Code Generation** → Payment request with Substrate address
5. **Real-Time Monitoring** → Polling for transaction confirmation
6. **History Logging** → Transaction stored with full metadata

## 🛡️ Transaction Monitoring

- **Polling-based monitoring** for all Polkadot ecosystem chains
- **Real-time balance checking** using Polkadot.js API
- **Automatic timeout** after 5 minutes
- **Block explorer integration** for transaction verification
- **Status tracking**: detected → confirmed → failed

## 🍓 Raspberry Pi Deployment

This NFC payment terminal can be deployed as a **plug-and-play kiosk** on Raspberry Pi hardware for production use.

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

### **TODO**
CATCH AND HANDLE TXN RESPONSE

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