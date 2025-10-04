import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying ProductRegistry contract...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("Deployer address:", deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  console.log("Deploying contract...");
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const registry = await ProductRegistry.deploy();

  await registry.waitForDeployment();
  const address = await registry.getAddress();

  console.log("\n✅ ProductRegistry deployed!");
  console.log("📍 Contract address:", address);
  console.log("\n📝 Update your .env file:");
  console.log(`PRODUCT_REGISTRY_CONTRACT_ADDRESS=${address}`);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalProducts = await registry.getTotalProducts();
  console.log("Total products:", totalProducts.toString());

  console.log("\n✅ Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Copy the contract address above to your .env file");
  console.log("2. Run: npm run register-test-products");
  console.log("3. Start your server: npm run dev");
  console.log("4. Test sync: curl -X POST http://localhost:3000/api/products/sync/blockchain");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
