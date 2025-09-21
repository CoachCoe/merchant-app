import { Reader } from 'nfc-pcsc';
import { PAYMENT, RECIPIENT_ADDRESS, SUPPORTED_CHAINS } from '../config/index.js';
import { TokenWithPrice } from '../types/index.js';
import { PolkadotService } from './polkadotService.js';
import { QRCodeService } from './qrCodeService.js';
import { broadcast } from '../server.js';

export class PaymentService {
  private static getChainName(chainId: number): string {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    return chain ? chain.displayName : `Chain ${chainId}`;
  }

  static generateSubstratePaymentUri(amount: bigint, tokenSymbol: string, chainId: number): string {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    if (!chain) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    const amountInTokens = Number(amount) / Math.pow(10, chain.nativeToken.decimals);
    
    if (chainId === 0 || chainId === 2) {
      return `${RECIPIENT_ADDRESS}?amount=${amountInTokens}&token=${tokenSymbol}`;
    } else {
      return `${RECIPIENT_ADDRESS}?amount=${amountInTokens}&token=${tokenSymbol}&chain=${chain.name}`;
    }
  }

  static createNDEFUriRecord(uri: string): Buffer {
    const uriBytes = Buffer.from(uri, 'utf8');
    const uriAbbreviation = 0x00;
    const recordHeader = 0xD1;
    const typeLength = 0x01;
    const payloadLength = uriBytes.length + 1;
    const recordType = Buffer.from('U', 'ascii');
    
    const ndefMessage = Buffer.concat([
      Buffer.from([recordHeader]),
      Buffer.from([typeLength]),
      Buffer.from([payloadLength]),
      recordType,
      Buffer.from([uriAbbreviation]),
      uriBytes
    ]);

    return ndefMessage;
  }

  static async sendPaymentRequest(reader: Reader, amount: bigint, tokenAddress: string, decimals: number, chainId: number): Promise<void> {
    try {
      const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
      if (!chain) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const paymentUri = this.generateSubstratePaymentUri(amount, chain.nativeToken.symbol, chainId);
      const chainName = this.getChainName(chainId);
      
      console.log(`\n💳 Sending Polkadot payment request for ${chainName} (Chain ID: ${chainId}):`);
      console.log(`📄 URI: ${paymentUri}`);
      
      const ndefMessage = this.createNDEFUriRecord(paymentUri);
      
      console.log(`📡 NDEF Message (${ndefMessage.length} bytes): ${ndefMessage.toString('hex')}`);
      
      const completeApdu = Buffer.concat([
        PAYMENT.slice(0, 4),
        Buffer.from([ndefMessage.length]),
        ndefMessage
      ]);
      
      console.log(`📡 Sending APDU with NDEF length: ${completeApdu.toString('hex')}`);
      
      const response = await reader.transmit(completeApdu, Math.max(256, ndefMessage.length + 10));
      const sw = response.readUInt16BE(response.length - 2);
      
      if (sw === 0x9000) {
        console.log(`✅ Payment request sent successfully for ${chainName}!`);
        console.log('📱 Wallet app should now open with transaction details...');
        const phoneResponse = response.slice(0, -2).toString();
        if (phoneResponse) {
          console.log(`📱 Phone response: ${phoneResponse}`);
        }
      } else {
        console.log(`❌ Payment request failed with status: ${sw.toString(16)}`);
      }
    } catch (error: any) {
      console.error('Error sending payment request:', error);
      
      if (error.code === 'failure' && 
          (error.message?.includes('An error occurred while transmitting') ||
           error.message?.includes('TransmitError') ||
           error.previous?.message?.includes('SCardTransmit error') ||
           error.previous?.message?.includes('Transaction failed'))) {
        console.log('📱💨 Phone moved too quickly during payment request transmission');
        throw new Error('PHONE_MOVED_TOO_QUICKLY');
      }
      
      throw error;
    }
  }

  static async calculateAndSendPayment(tokensWithPrices: TokenWithPrice[], reader: Reader, targetUSD: number): Promise<{
    selectedToken: TokenWithPrice;
    requiredAmount: bigint;
    chainId: number;
    chainName: string;
  }> {
    const startTime = Date.now();
    console.log(`⏱️ [PROFILE] Starting calculateAndSendPayment for $${targetUSD} with ${tokensWithPrices.length} tokens`);
    
    const viableTokens = tokensWithPrices.filter(token => 
      token.priceUSD > 0 && token.valueUSD >= targetUSD
    );

    if (viableTokens.length === 0) {
      console.log(`\n❌ No tokens found with sufficient balance for $${targetUSD} payment`);
      throw new Error(`Customer doesn't have enough funds`);
    }

    console.log(`\n💰 PAYMENT OPTIONS ($${targetUSD}):`);
    console.log(`🎯 Priority Order: Relay Chains > Parachains > Native Tokens\n`);
    
    const RELAY_CHAINS = [0, 2]; // Polkadot, Kusama
    const PARACHAINS = [1285, 336]; // Moonriver, Shiden
    
    const categorizeForDisplay = (tokens: TokenWithPrice[]) => {
      const categories = {
        'Relay Chain Tokens (Priority 1)': [] as TokenWithPrice[],
        'Parachain Tokens (Priority 2)': [] as TokenWithPrice[],
        'Other Tokens (Priority 3)': [] as TokenWithPrice[]
      };
      
      tokens.forEach(token => {
        if (RELAY_CHAINS.includes(token.chainId)) {
          categories['Relay Chain Tokens (Priority 1)'].push(token);
        } else if (PARACHAINS.includes(token.chainId)) {
          categories['Parachain Tokens (Priority 2)'].push(token);
        } else {
          categories['Other Tokens (Priority 3)'].push(token);
        }
      });
      
      return categories;
    };

    const tokensByPriority = categorizeForDisplay(viableTokens);
    
    let optionIndex = 1;
    Object.entries(tokensByPriority).forEach(([categoryName, tokens]) => {
      if (tokens.length > 0) {
        console.log(`\n🏆 ${categoryName}:`);
        tokens.forEach(token => {
          const requiredAmountFloat = targetUSD / token.priceUSD;
          console.log(`  ${optionIndex}. ${requiredAmountFloat.toFixed(6)} ${token.symbol} (${token.chainDisplayName})`);
          optionIndex++;
        });
      }
    });

    const selectedToken = this.selectBestPaymentToken(viableTokens);
    const selectionTime = Date.now() - startTime;
    console.log(`⏱️ [PROFILE] Token selection and analysis completed in ${selectionTime}ms`);
    
    const targetUSDCents = Math.round(targetUSD * 1e8);
    const priceUSDCents = Math.round(selectedToken.priceUSD * 1e8);
    const requiredAmount = (BigInt(targetUSDCents) * BigInt(10 ** selectedToken.decimals)) / BigInt(priceUSDCents);
    
    const displayAmount = Number(requiredAmount) / Math.pow(10, selectedToken.decimals);
    
    console.log(`\n🎯 SELECTED PAYMENT:`);
    console.log(`💰 Merchant amount: $${targetUSD.toFixed(2)} USD`);
    console.log(`💳 Token: ${selectedToken.symbol}`);
    console.log(`🔢 Token amount: ${displayAmount} ${selectedToken.symbol}`);
    console.log(`📊 Exact amount: ${requiredAmount.toString()} smallest units`);
    console.log(`⛓️  Chain: ${selectedToken.chainDisplayName} (Chain ID: ${selectedToken.chainId})`);
    console.log(`💵 Price: $${selectedToken.priceUSD.toFixed(4)} per ${selectedToken.symbol}`);
    console.log(`🔍 Payment will be monitored on: ${selectedToken.chainDisplayName}`);
    
    const nfcTransmissionStart = Date.now();
    await this.sendPaymentRequest(reader, requiredAmount, selectedToken.address, selectedToken.decimals, selectedToken.chainId);
    const nfcTransmissionTime = Date.now() - nfcTransmissionStart;
    console.log(`⏱️ [PROFILE] NFC payment request transmission completed in ${nfcTransmissionTime}ms`);
    
    const paymentUri = this.generateSubstratePaymentUri(requiredAmount, selectedToken.symbol, selectedToken.chainId);
    const qrCodeDataURL = await QRCodeService.generateWalletQRCode(paymentUri);
    broadcast({
      type: 'payment_qr',
      data: {
        uri: paymentUri,
        qrCodeDataURL,
        amount: Number(requiredAmount) / Math.pow(10, selectedToken.decimals),
        tokenSymbol: selectedToken.symbol,
        chainId: selectedToken.chainId,
        recipientAddress: RECIPIENT_ADDRESS,
      },
      message: 'Scan this QR code with your wallet app to pay.'
    });
    
    console.log(`✅ Payment request sent for exactly ${requiredAmount.toString()} smallest units`);
    console.log(`📱 Customer will be asked to pay ${displayAmount} ${selectedToken.symbol}`);
    
    const totalTime = Date.now() - startTime;
    console.log(`⏱️ [PROFILE] calculateAndSendPayment completed in ${totalTime}ms`);
    
    return {
      selectedToken,
      requiredAmount,
      chainId: selectedToken.chainId,
      chainName: selectedToken.chainDisplayName
    };
  }

  private static selectBestPaymentToken(viableTokens: TokenWithPrice[]): TokenWithPrice {
    const RELAY_CHAINS = [0, 2]; // Polkadot, Kusama
    const PARACHAINS = [1285, 336]; // Moonriver, Shiden
    
    const categorizeTokens = (tokens: TokenWithPrice[]) => {
      const categories = {
        relayChain: [] as TokenWithPrice[],
        parachain: [] as TokenWithPrice[],
        other: [] as TokenWithPrice[]
      };
      
      tokens.forEach(token => {
        if (RELAY_CHAINS.includes(token.chainId)) {
          categories.relayChain.push(token);
        } else if (PARACHAINS.includes(token.chainId)) {
          categories.parachain.push(token);
        } else {
          categories.other.push(token);
        }
      });
      
      return categories;
    };
    
    const categories = categorizeTokens(viableTokens);
    
    console.log(`\n🧮 TOKEN SELECTION ANALYSIS:`);
    console.log(`   Relay Chain Tokens: ${categories.relayChain.length} tokens`);
    console.log(`   Parachain Tokens: ${categories.parachain.length} tokens`);
    console.log(`   Other Tokens: ${categories.other.length} tokens`);
    
    const sortByValue = (a: TokenWithPrice, b: TokenWithPrice) => b.valueUSD - a.valueUSD;
    
    Object.values(categories).forEach(category => {
      category.sort(sortByValue);
    });
    
    if (categories.relayChain.length > 0) {
      const selected = categories.relayChain[0];
      console.log(`💡 Preferred payment: Relay Chain - ${selected.symbol} on ${selected.chainDisplayName}`);
      return selected;
    }
    
    if (categories.parachain.length > 0) {
      const selected = categories.parachain[0];
      console.log(`💡 Preferred payment: Parachain - ${selected.symbol} on ${selected.chainDisplayName}`);
      return selected;
    }
    
    if (categories.other.length > 0) {
      const selected = categories.other[0];
      console.log(`💡 Preferred payment: Other - ${selected.symbol} on ${selected.chainDisplayName}`);
      return selected;
    }
    
    console.log(`💡 Fallback: Using first available token - ${viableTokens[0].symbol}`);
    return viableTokens[0];
  }
}