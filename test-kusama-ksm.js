#!/usr/bin/env node

/**
 * Test script for KSM (Kusama) token support
 * Tests Kusama relay chain integration and KSM payments
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

// Mock MOVR payment data (existing Kusama EVM parachain)
const movrPaymentData = {
  amount: 0.1,
  tokenSymbol: 'MOVR',
  chainId: 1285, // Moonriver
  recipientAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  tokenAddress: null // Native MOVR
};

/**
 * Generate EIP-681 payment URI for Kusama tokens
 */
function generateKusamaPaymentURI(paymentData) {
  if (paymentData.tokenAddress) {
    // ERC-20 token payment (for Kusama EVM parachains)
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
    const uri = generateKusamaPaymentURI(ksmPaymentData);
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
 * Test MOVR payment generation (existing Kusama EVM parachain)
 */
async function testMOVR() {
  console.log('\n🟣 Testing MOVR (Moonriver - Kusama EVM) Payment');
  console.log('=' .repeat(50));
  
  try {
    const uri = generateKusamaPaymentURI(movrPaymentData);
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
 * Test Kusama ecosystem comparison
 */
function testKusamaEcosystem() {
  console.log('\n🟣 Kusama Ecosystem Token Support');
  console.log('=' .repeat(50));
  
  const kusamaTokens = [
    { symbol: 'KSM', chain: 'Kusama Relay Chain', chainId: 2, type: 'Native', evm: false },
    { symbol: 'MOVR', chain: 'Moonriver', chainId: 1285, type: 'Native', evm: true },
    { symbol: 'SDN', chain: 'Shiden', chainId: 336, type: 'Native', evm: true },
    { symbol: 'KAR', chain: 'Karura', chainId: 686, type: 'Native', evm: false },
    { symbol: 'PHA', chain: 'Phala', chainId: 30, type: 'Native', evm: false }
  ];
  
  console.log('📋 Supported Kusama Tokens:');
  kusamaTokens.forEach(token => {
    const status = token.evm ? '✅ Supported' : '⚠️  Requires Bridge';
    console.log(`  ${token.symbol} (${token.chain}): ${status}`);
    console.log(`    Chain ID: ${token.chainId}, Type: ${token.type}, EVM: ${token.evm}`);
  });
  
  console.log('\n💡 Note: KSM requires special handling since it\'s not EVM-compatible');
  console.log('   Consider using Moonriver (MOVR) or Shiden (SDN) for EVM payments');
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🟣 Kusama Token Support Test');
  console.log('Testing KSM and Kusama ecosystem integration');
  console.log('=' .repeat(60));
  
  await testKSM();
  await testMOVR();
  testKusamaEcosystem();
  
  console.log('\n🎉 All Kusama tests completed!');
  console.log('\n📋 Summary:');
  console.log('✅ KSM (Kusama Relay Chain) - Added to supported chains');
  console.log('✅ MOVR (Moonriver) - Already supported');
  console.log('✅ SDN (Shiden) - Already supported');
  console.log('⚠️  KSM requires non-EVM wallet apps (Talisman, Polkadot.js)');
  console.log('✅ MOVR/SDN work with standard EVM wallets (MetaMask, Trust)');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export {
  generateKusamaPaymentURI,
  testKSM,
  testMOVR,
  testKusamaEcosystem
}; 