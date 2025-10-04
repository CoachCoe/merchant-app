import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🛍️  Registering test products on blockchain...\n");

  const contractAddress = process.env.PRODUCT_REGISTRY_CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("❌ ERROR: PRODUCT_REGISTRY_CONTRACT_ADDRESS not set in .env");
    console.log("\nPlease deploy the contract first:");
    console.log("  npx hardhat run scripts/deploy.ts --network moonbase");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Seller address:", deployer.address);

  // Connect to deployed contract
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const registry = ProductRegistry.attach(contractAddress);

  console.log("Contract address:", contractAddress);
  console.log("\n📦 Registering products...\n");

  // Test products with IPFS metadata hashes
  const testProducts = [
    {
      name: "Web3 Development Course",
      ipfsHash: "QmTest1WebDevelopmentCourse",
      price: ethers.parseUnits("50", 0), // 50 Hollar
      category: "digital-goods"
    },
    {
      name: "NFT Digital Art Pack",
      ipfsHash: "QmTest2NFTDigitalArtPack",
      price: ethers.parseUnits("25", 0), // 25 Hollar
      category: "collectibles"
    },
    {
      name: "Polkadot T-Shirt",
      ipfsHash: "QmTest3PolkadotTShirt",
      price: ethers.parseUnits("30", 0), // 30 Hollar
      category: "apparel"
    },
    {
      name: "Substrate Development Book",
      ipfsHash: "QmTest4SubstrateBook",
      price: ethers.parseUnits("40", 0), // 40 Hollar
      category: "books"
    },
    {
      name: "Hardware Wallet",
      ipfsHash: "QmTest5HardwareWallet",
      price: ethers.parseUnits("100", 0), // 100 Hollar
      category: "electronics"
    }
  ];

  const registeredProducts: any[] = [];

  for (const product of testProducts) {
    try {
      console.log(`Registering: ${product.name}`);
      const tx = await registry.registerProduct(
        product.name,
        product.ipfsHash,
        product.price,
        product.category
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
        console.log(`     Price: ${ethers.formatUnits(product.price, 0)} Hollar`);
        console.log(`     Category: ${product.category}`);
        console.log(`     TX: ${receipt?.hash}\n`);

        registeredProducts.push({
          id: productId,
          name: product.name,
          price: product.price,
          category: product.category
        });
      }
    } catch (error: any) {
      console.error(`  ❌ Failed to register ${product.name}:`, error.message);
    }
  }

  // Summary
  console.log("\n📊 Summary:");
  console.log(`   Total registered: ${registeredProducts.length}/${testProducts.length}`);

  // Verify on contract
  const totalProducts = await registry.getTotalProducts();
  const activeProducts = await registry.getActiveProductCount();

  console.log(`   On-chain total: ${totalProducts}`);
  console.log(`   Active products: ${activeProducts}`);

  console.log("\n✅ Test products registered!");
  console.log("\nNext steps:");
  console.log("1. Start your server: npm run dev");
  console.log("2. Sync from blockchain:");
  console.log("   curl -X POST http://localhost:3000/api/products/sync/blockchain");
  console.log("3. View products:");
  console.log("   curl http://localhost:3000/api/products");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
