#!/usr/bin/env node

/**
 * Test script for Apple device integration
 * Demonstrates QR code generation and EIP-681 URI creation
 */

import QRCode from 'qrcode';

// Mock payment data
const paymentData = {
  amount: 0.001,
  tokenSymbol: 'ETH',
  chainId: 1, // Ethereum mainnet
  recipientAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  tokenAddress: null // Native ETH
};

// Mock Kusama payment data
const kusamaPaymentData = {
  amount: 0.1,
  tokenSymbol: 'MOVR',
  chainId: 1285, // Moonriver
  recipientAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  tokenAddress: null // Native MOVR
};

/**
 * Generate EIP-681 payment URI
 */
function generateEIP681URI(paymentData) {
  if (paymentData.tokenAddress) {
    // ERC-20 token payment
    return `ethereum:${paymentData.tokenAddress}@${paymentData.chainId}/transfer?address=${paymentData.recipientAddress}&uint256=${paymentData.amount}`;
  } else {
    // Native token payment
    return `ethereum:${paymentData.recipientAddress}@${paymentData.chainId}?value=${paymentData.amount}`;
  }
}

/**
 * Generate QR code for Apple Wallet integration
 */
async function generateAppleWalletQRCode(paymentData) {
  try {
    // Generate EIP-681 URI
    const uri = generateEIP681URI(paymentData);
    
    const qrData = {
      type: 'apple_wallet_payment',
      uri: uri,
      amount: paymentData.amount,
      tokenSymbol: paymentData.tokenSymbol,
      chainId: paymentData.chainId,
      timestamp: Date.now(),
      instructions: 'Open your wallet app and scan this QR code to complete the payment'
    };
    
    const qrString = JSON.stringify(qrData, null, 2);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 350,
      margin: 3,
      color: {
        dark: '#007AFF', // Apple blue
        light: '#FFFFFF'
      }
    });
    
    return { uri, qrCodeDataURL, qrData };
  } catch (error) {
    console.error('Error generating Apple Wallet QR code:', error);
    throw error;
  }
}

/**
 * Test Ethereum payment
 */
async function testEthereumPayment() {
  console.log('🔵 Testing Ethereum Payment for Apple Devices');
  console.log('=' .repeat(50));
  
  try {
    const result = await generateAppleWalletQRCode(paymentData);
    
    console.log('📱 Payment Data:');
    console.log(JSON.stringify(result.qrData, null, 2));
    
    console.log('\n🔗 EIP-681 URI:');
    console.log(result.uri);
    
    console.log('\n📊 QR Code Data URL (first 100 chars):');
    console.log(result.qrCodeDataURL.substring(0, 100) + '...');
    
    console.log('\n✅ Ethereum payment QR code generated successfully!');
    console.log('📱 Users can scan this QR code with MetaMask, Trust Wallet, or other iOS wallet apps');
    
  } catch (error) {
    console.error('❌ Error testing Ethereum payment:', error);
  }
}

/**
 * Test Kusama payment
 */
async function testKusamaPayment() {
  console.log('\n🟣 Testing Kusama Payment for Apple Devices');
  console.log('=' .repeat(50));
  
  try {
    const result = await generateAppleWalletQRCode(kusamaPaymentData);
    
    console.log('📱 Payment Data:');
    console.log(JSON.stringify(result.qrData, null, 2));
    
    console.log('\n🔗 EIP-681 URI:');
    console.log(result.uri);
    
    console.log('\n📊 QR Code Data URL (first 100 chars):');
    console.log(result.qrCodeDataURL.substring(0, 100) + '...');
    
    console.log('\n✅ Kusama payment QR code generated successfully!');
    console.log('📱 Users can scan this QR code with Talisman or other Kusama-compatible wallet apps');
    
  } catch (error) {
    console.error('❌ Error testing Kusama payment:', error);
  }
}

/**
 * Test simple EIP-681 QR code
 */
async function testSimpleEIP681QR() {
  console.log('\n🔗 Testing Simple EIP-681 QR Code');
  console.log('=' .repeat(50));
  
  try {
    const uri = generateEIP681URI(paymentData);
    const qrCodeDataURL = await QRCode.toDataURL(uri, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log('🔗 EIP-681 URI:');
    console.log(uri);
    
    console.log('\n📊 QR Code Data URL (first 100 chars):');
    console.log(qrCodeDataURL.substring(0, 100) + '...');
    
    console.log('\n✅ Simple EIP-681 QR code generated successfully!');
    console.log('📱 This is the most compatible format for wallet apps');
    
  } catch (error) {
    console.error('❌ Error testing simple EIP-681 QR:', error);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🍎 Apple Device Integration Test');
  console.log('Testing QR code generation for iOS wallet apps');
  console.log('=' .repeat(60));
  
  await testEthereumPayment();
  await testKusamaPayment();
  await testSimpleEIP681QR();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Save QR code data URLs to files for testing');
  console.log('2. Test with actual iOS wallet apps');
  console.log('3. Verify EIP-681 URI compatibility');
  console.log('4. Test with different token types (ERC-20, native)');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export {
  generateEIP681URI,
  generateAppleWalletQRCode,
  testEthereumPayment,
  testKusamaPayment,
  testSimpleEIP681QR
}; 