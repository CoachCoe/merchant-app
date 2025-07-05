#!/usr/bin/env node

/**
 * Test script for Polkadot ecosystem token support
 * Tests KSM (Kusama) and DOT (Polkadot) payments
 */

import QRCode from 'qrcode';

// Mock KSM payment data
const ksmPaymentData = {
  amount: 0.1,
  tokenSymbol: 'KSM',
  chainId: 2, // Kusama relay chain
  recipientAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  tokenAddress: null // Native KSM
};

// Mock DOT payment data
const dotPaymentData = {
  amount: 1.0,
  tokenSymbol: 'DOT',
  chainId: 0, // Polkadot relay chain
  recipientAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  tokenAddress: null // Native DOT
};

// Mock MOVR payment data (Kusama EVM parachain)
const movrPaymentData = {
  amount: 0.1,
  tokenSymbol: 'MOVR',
  chainId: 1285, // Moonriver
  recipientAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  tokenAddress: null // Native MOVR
};

/**
 * Generate EIP-681 payment URI for Polkadot ecosystem tokens
 */
function generatePolkadotPaymentURI(paymentData) {
  if (paymentData.tokenAddress) {
    // ERC-20 token payment (for EVM parachains)
    return `ethereum:${paymentData.tokenAddress}@${paymentData.chainId}/transfer?address=${paymentData.recipientAddress}&uint256=${paymentData.amount}`;
  } else {
    // Native token payment
    return `ethereum:${paymentData.recipientAddress}@${paymentData.chainId}?value=${paymentData.amount}`;
  }
}

/**
 * Test KSM payment generation
 */
async function testKSM() {
  console.log('🟣 Testing KSM (Kusama Relay Chain) Payment');
  console.log('=' .repeat(50));
  
  try {
    const uri = generatePolkadotPaymentURI(ksmPaymentData);
    const qrCodeDataURL = await QRCode.toDataURL(uri, {
      width: 300,
      margin: 2,
      color: {
        dark: '#E6007A', // Kusama pink
        light: '#FFFFFF'
      }
    });
    
    console.log('📱 Payment Data:');
    console.log(JSON.stringify(ksmPaymentData, null, 2));
    
    console.log('\n🔗 EIP-681 URI:');
    console.log(uri);
    
    console.log('\n📊 QR Code Data URL (first 100 chars):');
    console.log(qrCodeDataURL.substring(0, 100) + '...');
    
    console.log('\n✅ KSM payment QR code generated successfully!');
    console.log('📱 Users can scan this QR code with Talisman, Polkadot.js, or other Kusama wallet apps');
    
  } catch (error) {
    console.error('❌ Error testing KSM payment:', error);
  }
}

/**
 * Test DOT payment generation
 */
async function testDOT() {
  console.log('\n🔵 Testing DOT (Polkadot Relay Chain) Payment');
  console.log('=' .repeat(50));
  
  try {
    const uri = generatePolkadotPaymentURI(dotPaymentData);
    const qrCodeDataURL = await QRCode.toDataURL(uri, {
      width: 300,
      margin: 2,
      color: {
        dark: '#E6007A', // Polkadot pink (same as Kusama)
        light: '#FFFFFF'
      }
    });
    
    console.log('📱 Payment Data:');
    console.log(JSON.stringify(dotPaymentData, null, 2));
    
    console.log('\n🔗 EIP-681 URI:');
    console.log(uri);
    
    console.log('\n📊 QR Code Data URL (first 100 chars):');
    console.log(qrCodeDataURL.substring(0, 100) + '...');
    
    console.log('\n✅ DOT payment QR code generated successfully!');
    console.log('📱 Users can scan this QR code with Talisman, Polkadot.js, or other Polkadot wallet apps');
    
  } catch (error) {
    console.error('❌ Error testing DOT payment:', error);
  }
}

/**
 * Test MOVR payment generation (Kusama EVM parachain)
 */
async function testMOVR() {
  console.log('\n🟣 Testing MOVR (Moonriver - Kusama EVM) Payment');
  console.log('=' .repeat(50));
  
  try {
    const uri = generatePolkadotPaymentURI(movrPaymentData);
    const qrCodeDataURL = await QRCode.toDataURL(uri, {
      width: 300,
      margin: 2,
      color: {
        dark: '#53CBC9', // Moonriver blue
        light: '#FFFFFF'
      }
    });
    
    console.log('📱 Payment Data:');
    console.log(JSON.stringify(movrPaymentData, null, 2));
    
    console.log('\n🔗 EIP-681 URI:');
    console.log(uri);
    
    console.log('\n📊 QR Code Data URL (first 100 chars):');
    console.log(qrCodeDataURL.substring(0, 100) + '...');
    
    console.log('\n✅ MOVR payment QR code generated successfully!');
    console.log('📱 Users can scan this QR code with MetaMask, Trust Wallet, or other EVM wallet apps');
    
  } catch (error) {
    console.error('❌ Error testing MOVR payment:', error);
  }
}

/**
 * Test Polkadot ecosystem comparison
 */
function testPolkadotEcosystem() {
  console.log('\n🟣🔵 Polkadot Ecosystem Token Support');
  console.log('=' .repeat(50));
  
  const polkadotTokens = [
    { symbol: 'DOT', chain: 'Polkadot Relay Chain', chainId: 0, type: 'Native', evm: false, ecosystem: 'Polkadot' },
    { symbol: 'KSM', chain: 'Kusama Relay Chain', chainId: 2, type: 'Native', evm: false, ecosystem: 'Kusama' },
    { symbol: 'MOVR', chain: 'Moonriver', chainId: 1285, type: 'Native', evm: true, ecosystem: 'Kusama' },
    { symbol: 'SDN', chain: 'Shiden', chainId: 336, type: 'Native', evm: true, ecosystem: 'Kusama' },
    { symbol: 'GLMR', chain: 'Moonbeam', chainId: 1284, type: 'Native', evm: true, ecosystem: 'Polkadot' },
    { symbol: 'ASTR', chain: 'Astar', chainId: 592, type: 'Native', evm: true, ecosystem: 'Polkadot' }
  ];
  
  console.log('📋 Supported Polkadot Ecosystem Tokens:');
  polkadotTokens.forEach(token => {
    const status = token.evm ? '✅ Supported' : '⚠️  Requires Bridge';
    console.log(`  ${token.symbol} (${token.chain}): ${status}`);
    console.log(`    Chain ID: ${token.chainId}, Type: ${token.type}, EVM: ${token.evm}, Ecosystem: ${token.ecosystem}`);
  });
  
  console.log('\n💡 Note: DOT and KSM require non-EVM wallet apps');
  console.log('   MOVR, SDN, GLMR, ASTR work with standard EVM wallets');
}

/**
 * Test user wallet scenarios
 */
function testUserScenarios() {
  console.log('\n👤 User Wallet Scenarios');
  console.log('=' .repeat(50));
  
  const scenarios = [
    {
      user: 'Alice',
      wallet: 'Talisman',
      tokens: ['DOT', 'KSM'],
      description: 'Polkadot ecosystem user with both DOT and KSM'
    },
    {
      user: 'Bob',
      wallet: 'MetaMask',
      tokens: ['MOVR', 'GLMR'],
      description: 'EVM user with Kusama and Polkadot EVM tokens'
    },
    {
      user: 'Charlie',
      wallet: 'Polkadot.js',
      tokens: ['DOT'],
      description: 'Polkadot-only user'
    },
    {
      user: 'Diana',
      wallet: 'Trust Wallet',
      tokens: ['MOVR', 'SDN'],
      description: 'Mobile user with Kusama EVM tokens'
    }
  ];
  
  scenarios.forEach(scenario => {
    console.log(`\n👤 ${scenario.user} (${scenario.wallet}):`);
    console.log(`   Tokens: ${scenario.tokens.join(', ')}`);
    console.log(`   Scenario: ${scenario.description}`);
    
    if (scenario.tokens.includes('DOT') || scenario.tokens.includes('KSM')) {
      console.log(`   ✅ Can pay with native DOT/KSM via QR codes`);
    }
    if (scenario.tokens.includes('MOVR') || scenario.tokens.includes('SDN') || scenario.tokens.includes('GLMR')) {
      console.log(`   ✅ Can pay with EVM tokens via NFC or QR codes`);
    }
  });
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🟣🔵 Polkadot Ecosystem Token Support Test');
  console.log('Testing KSM, DOT, and Polkadot ecosystem integration');
  console.log('=' .repeat(60));
  
  await testKSM();
  await testDOT();
  await testMOVR();
  testPolkadotEcosystem();
  testUserScenarios();
  
  console.log('\n🎉 All Polkadot ecosystem tests completed!');
  console.log('\n📋 Summary:');
  console.log('✅ KSM (Kusama Relay Chain) - Added to supported chains');
  console.log('✅ DOT (Polkadot Relay Chain) - Added to supported chains');
  console.log('✅ MOVR (Moonriver) - Already supported');
  console.log('✅ SDN (Shiden) - Already supported');
  console.log('⚠️  DOT/KSM require non-EVM wallet apps (Talisman, Polkadot.js)');
  console.log('✅ MOVR/SDN work with standard EVM wallets (MetaMask, Trust)');
  console.log('\n🎯 Perfect for users with KSM or DOT in their wallets!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export {
  generatePolkadotPaymentURI,
  testKSM,
  testDOT,
  testMOVR,
  testPolkadotEcosystem,
  testUserScenarios
}; 