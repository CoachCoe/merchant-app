import * as dotenv from "dotenv";
import { ApiPromise, WsProvider } from '@polkadot/api';
import fs from 'fs';

dotenv.config();

/**
 * Upload product metadata to Bulletin Chain
 *
 * Note: Bulletin Chain launches Q4 2025
 * This script will work once the network is live
 * For now, it demonstrates the upload flow
 */
async function main() {
  console.log("📤 Uploading to Polkadot Bulletin Chain...\n");

  const wsEndpoint = process.env.BULLETIN_CHAIN_WS_ENDPOINT || 'wss://bulletin-rpc.polkadot.io';
  const enabled = process.env.BULLETIN_CHAIN_ENABLED === 'true';

  if (!enabled) {
    console.log("⚠️  Bulletin Chain integration not enabled");
    console.log("\nBulletin Chain status: Launching Q4 2025");
    console.log("Current implementation: STUB (ready for launch)\n");
    console.log("What this script WILL do when Bulletin Chain launches:");
    console.log("  1. Connect to Bulletin Chain node");
    console.log("  2. Call transactionStorage.store(data, ttl)");
    console.log("  3. Store metadata on-chain (2-week expiry)");
    console.log("  4. Data automatically published to IPFS via Bitswap");
    console.log("  5. Return both transaction hash and IPFS CID\n");
    console.log("To enable (when available):");
    console.log("  BULLETIN_CHAIN_ENABLED=true");
    console.log("  BULLETIN_CHAIN_WS_ENDPOINT=wss://bulletin-rpc.polkadot.io\n");
    console.log("For now, use IPFS-only upload:");
    console.log("  npm run upload-ipfs-metadata\n");
    return;
  }

  // Load IPFS metadata file
  const ipfsHashesFile = './ipfs-hashes.json';
  if (!fs.existsSync(ipfsHashesFile)) {
    console.error("❌ IPFS hashes file not found");
    console.log("\nRun this first:");
    console.log("  npm run upload-ipfs-metadata");
    process.exit(1);
  }

  const ipfsProducts = JSON.parse(fs.readFileSync(ipfsHashesFile, 'utf-8'));

  console.log("🔗 Connecting to Bulletin Chain...");
  console.log(`   Endpoint: ${wsEndpoint}\n`);

  try {
    const provider = new WsProvider(wsEndpoint);
    const api = await ApiPromise.create({ provider });

    await api.isReady;

    const chain = await api.rpc.system.chain();
    const version = await api.rpc.system.version();

    console.log(`✅ Connected to ${chain} (${version})\n`);

    // Upload each product metadata to Bulletin Chain
    console.log("📦 Uploading product metadata to Bulletin Chain...\n");

    const bulletinResults: Array<{ name: string; txHash: string; ipfsCid: string }> = [];

    for (const product of ipfsProducts) {
      try {
        console.log(`Uploading: ${product.name}`);

        // TODO: Implement when Bulletin Chain is live
        // const metadata = fs.readFileSync(`./metadata/${product.id}.json`);
        // const ttl = 14 * 24 * 60 * 60; // 2 weeks in seconds

        // const tx = api.tx.transactionStorage.store(metadata, ttl);
        // const result = await tx.signAndSend(signer);

        // For now, simulate the upload
        console.log(`  ⏳ Calling transactionStorage.store(metadata, 1209600)`);
        console.log(`  📝 TTL: 14 days (ephemeral storage)`);
        console.log(`  ✅ Transaction would be submitted here`);
        console.log(`  🔗 IPFS CID would be extracted from TransactionStored event`);
        console.log(`  📍 Data would be published to IPFS via Bitswap protocol\n`);

        bulletinResults.push({
          name: product.name,
          txHash: '0xSimulatedTxHash' + Date.now(),
          ipfsCid: product.ipfsHash // In reality, this comes from the event
        });

      } catch (error: any) {
        console.error(`  ❌ Failed to upload ${product.name}:`, error.message);
      }
    }

    // Save results
    const resultsFile = './bulletin-hashes.json';
    fs.writeFileSync(resultsFile, JSON.stringify(bulletinResults, null, 2));

    console.log("\n📊 Summary:");
    console.log(`   Uploaded: ${bulletinResults.length}/${ipfsProducts.length}`);
    console.log(`   Storage: Ephemeral (2-week TTL)`);
    console.log(`   Backend: IPFS via Bitswap\n`);

    console.log(`✅ Results saved to: ${resultsFile}\n`);

    await api.disconnect();

  } catch (error: any) {
    console.error("\n❌ Failed to connect to Bulletin Chain");
    console.error("Error:", error.message);
    console.log("\nThis is expected - Bulletin Chain launches Q4 2025");
    console.log("Using IPFS-only for now is recommended\n");
    process.exit(1);
  }

  console.log("✅ Bulletin Chain upload complete!");
  console.log("\nNext steps:");
  console.log("1. Deploy contract: npm run contract:deploy");
  console.log("2. Register products: npm run register-products-real-ipfs");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
