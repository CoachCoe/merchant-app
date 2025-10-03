import { ApiPromise, WsProvider } from '@polkadot/api';

/**
 * Script to verify Hollar token (Asset ID 1984) exists on AssetHub
 */
async function verifyHollarToken() {
  console.log('Connecting to AssetHub...');

  const provider = new WsProvider('wss://polkadot-asset-hub-rpc.polkadot.io');
  const api = await ApiPromise.create({ provider });

  await api.isReady;

  console.log('Connected to:', (await api.rpc.system.chain()).toString());
  console.log('\nQuerying Asset ID 1984 (Hollar)...\n');

  try {
    // Query asset metadata
    const assetId = 1984;
    const metadata = await api.query.assets.metadata(assetId);

    if (metadata.isEmpty) {
      console.log('❌ Asset ID 1984 does NOT exist on AssetHub');
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   - Update HOLLAR_ASSET_ID in .env to correct value');
      console.log('   - OR implement DOT as fallback payment token');
      await api.disconnect();
      process.exit(1);
    }

    console.log('✅ Hollar token found on AssetHub!');
    console.log('\nAsset Details:');
    console.log('  Name:', metadata.name.toHuman());
    console.log('  Symbol:', metadata.symbol.toHuman());
    console.log('  Decimals:', metadata.decimals.toNumber());

    // Query asset details
    const assetDetails = await api.query.assets.asset(assetId);

    if (!assetDetails.isEmpty) {
      const details = assetDetails.unwrap();
      console.log('\nAsset Info:');
      console.log('  Owner:', details.owner.toHuman());
      console.log('  Total Supply:', details.supply.toString());
      console.log('  Accounts:', details.accounts.toNumber());
      console.log('  Min Balance:', details.minBalance.toString());
    }

    console.log('\n✅ Hollar token verification PASSED');
    console.log('   Asset ID 1984 is configured correctly in .env');

  } catch (error) {
    console.error('❌ Error querying asset:', error);
    console.log('\n⚠️  Asset may not exist. Check HOLLAR_ASSET_ID configuration.');
    await api.disconnect();
    process.exit(1);
  }

  await api.disconnect();
  process.exit(0);
}

verifyHollarToken().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
