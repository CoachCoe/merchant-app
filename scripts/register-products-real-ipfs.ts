import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import fs from 'fs';

dotenv.config();

async function main() {
  console.log("🛍️  Registering products with REAL IPFS metadata...\n");

  const contractAddress = process.env.PRODUCT_REGISTRY_CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("❌ ERROR: PRODUCT_REGISTRY_CONTRACT_ADDRESS not set in .env");
    console.log("\nPlease deploy the contract first:");
    console.log("  npm run contract:deploy");
    process.exit(1);
  }

  // Load IPFS hashes
  const ipfsHashesFile = './ipfs-hashes.json';
  if (!fs.existsSync(ipfsHashesFile)) {
    console.error("❌ ERROR: ipfs-hashes.json not found");
    console.log("\nPlease upload metadata to IPFS first:");
    console.log("  npm run upload-ipfs-metadata");
    process.exit(1);
  }

  const ipfsProducts = JSON.parse(fs.readFileSync(ipfsHashesFile, 'utf-8'));

  const [deployer] = await ethers.getSigners();
  console.log("Seller address:", deployer.address);
  console.log("Contract address:", contractAddress);
  console.log(`\n📦 Registering ${ipfsProducts.length} products with REAL IPFS metadata...\n`);

  // Connect to deployed contract
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const registry = ProductRegistry.attach(contractAddress);

  // Product details (matching the IPFS metadata)
  const productDetails = [
    { name: "Web3 Development Course", price: 50, category: "digital-goods" },
    { name: "NFT Digital Art Collection", price: 25, category: "collectibles" },
    { name: "Official Polkadot T-Shirt", price: 30, category: "apparel" },
    { name: "Substrate Development Handbook", price: 40, category: "books" },
    { name: "Polkadot Hardware Wallet", price: 100, category: "electronics" }
  ];

  const registeredProducts: any[] = [];

  for (let i = 0; i < ipfsProducts.length; i++) {
    const ipfsProduct = ipfsProducts[i];
    const detail = productDetails[i];

    if (!detail) {
      console.warn(`⚠️  No details found for ${ipfsProduct.name}, skipping`);
      continue;
    }

    try {
      console.log(`Registering: ${detail.name}`);
      console.log(`  📄 IPFS Hash: ${ipfsProduct.ipfsHash}`);
      console.log(`  🌐 Gateway: ${ipfsProduct.url}`);

      const tx = await registry.registerProduct(
        detail.name,
        ipfsProduct.ipfsHash, // REAL IPFS hash!
        ethers.parseUnits(detail.price.toString(), 0),
        detail.category
      );

      const receipt = await tx.wait();

      // Find ProductRegistered event
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = registry.interface.parseLog(log);
          return parsed?.name === 'ProductRegistered';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = registry.interface.parseLog(event);
        const productId = parsed?.args[0];

        console.log(`  ✅ Product ID: ${productId}`);
        console.log(`  💰 Price: ${detail.price} Hollar`);
        console.log(`  📂 Category: ${detail.category}`);
        console.log(`  🔗 TX: ${receipt?.hash}`);
        console.log(`  🎯 Metadata: ${ipfsProduct.url}\n`);

        registeredProducts.push({
          id: productId,
          name: detail.name,
          ipfsHash: ipfsProduct.ipfsHash,
          ipfsUrl: ipfsProduct.url,
          price: detail.price,
          category: detail.category,
          txHash: receipt?.hash
        });
      }
    } catch (error: any) {
      console.error(`  ❌ Failed to register ${detail.name}:`, error.message);
    }
  }

  // Summary
  console.log("\n📊 Registration Summary:");
  console.log(`   Total registered: ${registeredProducts.length}/${ipfsProducts.length}`);

  // Verify on contract
  const totalProducts = await registry.getTotalProducts();
  const activeProducts = await registry.getActiveProductCount();

  console.log(`   On-chain total: ${totalProducts}`);
  console.log(`   Active products: ${activeProducts}`);

  // Save results
  const resultsFile = './registered-products.json';
  fs.writeFileSync(resultsFile, JSON.stringify(registeredProducts, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);

  console.log("\n✅ Products registered with REAL IPFS metadata!");
  console.log("\n🎯 Test the full flow:");
  console.log("  1. Start server: npm run dev");
  console.log("  2. Sync from blockchain:");
  console.log("     curl -X POST http://localhost:3000/api/products/sync/blockchain");
  console.log("  3. View products:");
  console.log("     curl http://localhost:3000/api/products");
  console.log("  4. Server will fetch REAL metadata from IPFS!");
  console.log("\n📖 Verify metadata on IPFS:");
  for (const product of registeredProducts) {
    console.log(`  ${product.name}: ${product.ipfsUrl}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
