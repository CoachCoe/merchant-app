# 3bae Product Registry Smart Contract

Solidity smart contract for the 3bae decentralized marketplace product registry.

## Contract: ProductRegistry.sol

Manages on-chain product listings and store profiles with IPFS metadata references.

### Features

- **Store Management**: Create and update merchant store profiles
- **Product Registration**: Register products with IPFS metadata hashes
- **Product Updates**: Update product prices, metadata, and status
- **Query Functions**: Fetch products by seller, category, or all active products
- **Event Emission**: Track all registry actions on-chain

### Data Structures

**Store**:
- `owner` (address): Store owner's wallet address
- `name` (string): Store name
- `ipfsProfileHash` (string): IPFS hash for full store profile JSON
- `isActive` (bool): Store status
- `createdAt` (uint256): Creation timestamp

**Product**:
- `id` (bytes32): Unique product identifier
- `seller` (address): Seller's wallet address
- `name` (string): Product name
- `ipfsMetadataHash` (string): IPFS hash for full product metadata JSON
- `priceHollar` (uint256): Price in Hollar tokens (smallest unit)
- `category` (string): Product category
- `isActive` (bool): Product status
- `createdAt` (uint256): Creation timestamp

### Main Functions

#### Store Functions
```solidity
function createStore(string memory _name, string memory _ipfsProfileHash) external
function updateStore(string memory _name, string memory _ipfsProfileHash) external
function getStore(address _owner) external view returns (Store)
```

#### Product Functions
```solidity
function registerProduct(
    string memory _name,
    string memory _ipfsMetadataHash,
    uint256 _priceHollar,
    string memory _category
) external returns (bytes32)

function updateProduct(
    bytes32 _productId,
    string memory _ipfsMetadataHash,
    uint256 _priceHollar,
    bool _isActive
) external

function deactivateProduct(bytes32 _productId) external
function getProduct(bytes32 _productId) external view returns (Product)
```

#### Query Functions
```solidity
function getProductsBySeller(address _seller) external view returns (bytes32[] memory)
function getProductsByCategory(string memory _category) external view returns (bytes32[] memory)
function getAllActiveProducts() external view returns (bytes32[] memory)
function getTotalProducts() external view returns (uint256)
function getActiveProductCount() external view returns (uint256)
```

## Deployment Options

### Option 1: Moonbeam (Polkadot Parachain - Production Ready)

Moonbeam is a fully EVM-compatible parachain on Polkadot.

```bash
# Using Hardhat
npx hardhat run scripts/deploy.js --network moonbeam

# Using Foundry
forge create --rpc-url https://rpc.api.moonbeam.network \
    --private-key $PRIVATE_KEY \
    contracts/ProductRegistry.sol:ProductRegistry
```

**Moonbeam RPC**: `https://rpc.api.moonbeam.network`
**Chain ID**: 1284

### Option 2: Moonriver (Kusama Parachain - Canary Network)

Moonriver is Moonbeam's canary network on Kusama.

```bash
forge create --rpc-url https://rpc.api.moonriver.moonbeam.network \
    --private-key $PRIVATE_KEY \
    contracts/ProductRegistry.sol:ProductRegistry
```

**Moonriver RPC**: `https://rpc.api.moonriver.moonbeam.network`
**Chain ID**: 1285

### Option 3: Astar (Polkadot Parachain)

Astar supports both EVM and WASM smart contracts.

```bash
forge create --rpc-url https://evm.astar.network \
    --private-key $PRIVATE_KEY \
    contracts/ProductRegistry.sol:ProductRegistry
```

**Astar RPC**: `https://evm.astar.network`
**Chain ID**: 592

### Option 4: Local Testnet (Development)

Use Hardhat or Foundry local networks for development.

```bash
# Start local node
npx hardhat node

# Deploy
npx hardhat run scripts/deploy.js --network localhost
```

## Setup Instructions

### 1. Install Hardhat (Recommended for Solidity)

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

### 2. Configure Hardhat

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    moonbeam: {
      url: "https://rpc.api.moonbeam.network",
      chainId: 1284,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    },
    moonriver: {
      url: "https://rpc.api.moonriver.moonbeam.network",
      chainId: 1285,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    },
    astar: {
      url: "https://evm.astar.network",
      chainId: 592,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    }
  }
};
```

### 3. Create Deployment Script

Create `scripts/deploy.js`:

```javascript
async function main() {
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const registry = await ProductRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("ProductRegistry deployed to:", address);

  // Save address to .env
  console.log(`\nAdd this to your .env file:`);
  console.log(`PRODUCT_REGISTRY_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 4. Deploy

```bash
npx hardhat run scripts/deploy.js --network moonbeam
```

### 5. Verify Contract (Optional)

```bash
npx hardhat verify --network moonbeam DEPLOYED_CONTRACT_ADDRESS
```

## Usage in Application

After deployment, update your `.env`:

```bash
# For Moonbeam
EVM_RPC_URL=https://rpc.api.moonbeam.network
PRODUCT_REGISTRY_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

The `ProductRegistryService` will automatically connect to the deployed contract.

## Testing

```bash
npx hardhat test
```

Create `test/ProductRegistry.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProductRegistry", function () {
  let registry, owner, seller;

  beforeEach(async function () {
    [owner, seller] = await ethers.getSigners();
    const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
    registry = await ProductRegistry.deploy();
    await registry.waitForDeployment();
  });

  it("Should create a store", async function () {
    await registry.connect(seller).createStore(
      "Test Store",
      "QmTestHash123"
    );

    const store = await registry.getStore(seller.address);
    expect(store.name).to.equal("Test Store");
    expect(store.ipfsProfileHash).to.equal("QmTestHash123");
  });

  it("Should register a product", async function () {
    await registry.connect(seller).createStore("Test Store", "QmStore");

    const tx = await registry.connect(seller).registerProduct(
      "Test Product",
      "QmProduct123",
      1000,
      "digital-goods"
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === 'ProductRegistered');
    const productId = event.args[0];

    const product = await registry.getProduct(productId);
    expect(product.name).to.equal("Test Product");
    expect(product.priceHollar).to.equal(1000);
  });
});
```

## Gas Optimization

The contract is optimized for gas efficiency:
- Uses `bytes32` for product IDs (cheaper than strings)
- Minimal on-chain storage (metadata in IPFS)
- Batch query functions to reduce RPC calls

## Security Considerations

- Owner-only modifiers for updates
- Input validation on all functions
- No fund custody (zero balance contract)
- Immutable product IDs prevent tampering

## Future Enhancements

- Product search indexing (via SubQuery/The Graph)
- Reputation scores integration
- Multi-sig store ownership
- Product escrow integration (V2)
