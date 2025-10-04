import * as dotenv from "dotenv";
import pinataSDK from '@pinata/sdk';

dotenv.config();

interface ProductMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  delivery_type: string;
  delivery_instructions?: string;
  variants?: Array<{ name: string; value: string; stock?: number }>;
  created_at: string;
}

async function main() {
  console.log("📤 Uploading product metadata to IPFS...\n");

  // Initialize Pinata
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_API_KEY;

  if (!apiKey || !secretKey) {
    console.error("❌ ERROR: Pinata credentials not found in .env");
    console.log("\nPlease add:");
    console.log("  PINATA_API_KEY=your_key");
    console.log("  PINATA_SECRET_API_KEY=your_secret");
    console.log("\nGet free API keys at: https://app.pinata.cloud/developers/api-keys");
    process.exit(1);
  }

  const pinata = new pinataSDK(apiKey, secretKey);

  // Test authentication
  console.log("🔑 Testing Pinata authentication...");
  try {
    await pinata.testAuthentication();
    console.log("✅ Pinata connected!\n");
  } catch (error) {
    console.error("❌ Pinata authentication failed:", error);
    process.exit(1);
  }

  // Create detailed product metadata
  const products: ProductMetadata[] = [
    {
      id: "web3-dev-course",
      name: "Web3 Development Course",
      description: "Complete guide to building decentralized applications on Polkadot. Learn Substrate, Ink! smart contracts, and parachain development. Includes 50+ hours of video content, code examples, and hands-on projects.",
      category: "digital-goods",
      images: [
        "https://via.placeholder.com/600x400/667eea/ffffff?text=Web3+Course",
        "https://via.placeholder.com/600x400/764ba2/ffffff?text=Substrate+Dev"
      ],
      delivery_type: "download",
      delivery_instructions: "After purchase, you'll receive a download link valid for 7 days. Course materials include video files, PDF guides, and source code.",
      variants: [
        { name: "Format", value: "Video + PDF", stock: 999 },
        { name: "Duration", value: "50 hours", stock: 999 }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: "nft-art-pack",
      name: "NFT Digital Art Collection",
      description: "Exclusive collection of 10 unique digital artworks created by renowned Web3 artists. Each piece is minted as an NFT on Asset Hub with proof of authenticity. Perfect for collectors and art enthusiasts.",
      category: "collectibles",
      images: [
        "https://via.placeholder.com/600x600/f093fb/000000?text=NFT+Art+1",
        "https://via.placeholder.com/600x600/4facfe/000000?text=NFT+Art+2",
        "https://via.placeholder.com/600x600/00f2fe/000000?text=NFT+Art+3"
      ],
      delivery_type: "ipfs",
      delivery_instructions: "NFT metadata and artwork stored on IPFS. Transfer to your wallet upon purchase.",
      variants: [
        { name: "Collection", value: "Genesis Series", stock: 10 },
        { name: "Artist", value: "Web3 Creator", stock: 10 }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: "polkadot-tshirt",
      name: "Official Polkadot T-Shirt",
      description: "Premium quality cotton t-shirt featuring the iconic Polkadot logo. Comfortable fit, durable fabric, perfect for blockchain conferences and meetups. Available in multiple sizes.",
      category: "apparel",
      images: [
        "https://via.placeholder.com/600x600/e6007a/ffffff?text=Polkadot+Tee",
        "https://via.placeholder.com/600x600/552bbf/ffffff?text=Back+Design"
      ],
      delivery_type: "email",
      delivery_instructions: "Physical item. Shipping details will be collected after purchase. Ships within 3-5 business days.",
      variants: [
        { name: "Size", value: "Small", stock: 20 },
        { name: "Size", value: "Medium", stock: 50 },
        { name: "Size", value: "Large", stock: 50 },
        { name: "Size", value: "X-Large", stock: 30 }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: "substrate-book",
      name: "Substrate Development Handbook",
      description: "Comprehensive guide to Substrate blockchain framework. Written by core Parity developers, covering runtime development, pallets, consensus mechanisms, and parachain integration. 400+ pages of expert knowledge.",
      category: "books",
      images: [
        "https://via.placeholder.com/400x600/56ab2f/ffffff?text=Substrate+Book",
        "https://via.placeholder.com/600x400/a8e063/000000?text=Sample+Pages"
      ],
      delivery_type: "download",
      delivery_instructions: "Digital book delivered as PDF and EPUB formats. Instant download after purchase.",
      variants: [
        { name: "Format", value: "PDF", stock: 999 },
        { name: "Format", value: "EPUB", stock: 999 },
        { name: "Format", value: "Both", stock: 999 }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: "hardware-wallet",
      name: "Polkadot Hardware Wallet",
      description: "Secure your DOT, KSM, and parachain tokens with this certified hardware wallet. Features offline signing, multi-account support, and recovery seed backup. Compatible with Polkadot.js extension.",
      category: "electronics",
      images: [
        "https://via.placeholder.com/600x600/314755/ffffff?text=Hardware+Wallet",
        "https://via.placeholder.com/600x600/26a0da/ffffff?text=Security+Features"
      ],
      delivery_type: "email",
      delivery_instructions: "Physical item shipped with tracking. Packaging includes tamper-evident seals. Setup guide included.",
      variants: [
        { name: "Color", value: "Black", stock: 15 },
        { name: "Color", value: "Silver", stock: 10 }
      ],
      created_at: new Date().toISOString()
    }
  ];

  console.log(`📦 Uploading ${products.length} product metadata to IPFS...\n`);

  const uploadedProducts: Array<{ name: string; ipfsHash: string; url: string }> = [];

  for (const product of products) {
    try {
      console.log(`Uploading: ${product.name}`);

      const result = await pinata.pinJSONToIPFS(product, {
        pinataMetadata: {
          name: `product-${product.id}`,
          keyvalues: {
            category: product.category,
            type: 'product-metadata'
          }
        }
      });

      const ipfsHash = result.IpfsHash;
      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      console.log(`  ✅ IPFS Hash: ${ipfsHash}`);
      console.log(`  🌐 Gateway URL: ${gatewayUrl}`);
      console.log(`  📦 Size: ${result.PinSize} bytes\n`);

      uploadedProducts.push({
        name: product.name,
        ipfsHash,
        url: gatewayUrl
      });

    } catch (error: any) {
      console.error(`  ❌ Failed to upload ${product.name}:`, error.message);
    }
  }

  // Summary
  console.log("\n📊 Upload Summary:");
  console.log(`   Total uploaded: ${uploadedProducts.length}/${products.length}\n`);

  // Save results to file for use in deployment
  const resultsFile = './ipfs-hashes.json';
  const fs = await import('fs');
  fs.writeFileSync(resultsFile, JSON.stringify(uploadedProducts, null, 2));

  console.log(`✅ IPFS hashes saved to: ${resultsFile}`);
  console.log("\n📝 Copy these hashes to use in contract deployment:");
  console.log(JSON.stringify(uploadedProducts.map(p => ({ name: p.name, ipfsHash: p.ipfsHash })), null, 2));

  console.log("\n✅ All metadata uploaded to IPFS!");
  console.log("\nNext steps:");
  console.log("1. Deploy contract: npm run contract:deploy");
  console.log("2. Register products with real IPFS hashes: npm run register-products-real-ipfs");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
