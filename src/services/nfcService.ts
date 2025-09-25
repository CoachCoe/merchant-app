import { NFC, Reader } from 'nfc-pcsc';
import { AID, GET } from '../config/index.js';
import { CardData } from '../types/index.js';
import { PolkadotService } from './polkadotService.js';
import { PaymentService } from './paymentService.js';
import { broadcast } from '../server.js';

// Service for handling NFC reader operations
export class NFCService {
  private nfc: NFC;
  private paymentArmed: boolean = false;
  private walletScanArmed: boolean = false;
  private currentPaymentAmount: number | null = null;
  private cardHandlerPromise: Promise<{ success: boolean; message: string; errorType?: string; paymentInfo?: any }> | null = null;
  private cardHandlerResolve: ((result: { success: boolean; message: string; errorType?: string; paymentInfo?: any }) => void) | null = null;
  private walletScanPromise: Promise<{ success: boolean; message: string; address?: string; errorType?: string }> | null = null;
  private walletScanResolve: ((result: { success: boolean; message: string; address?: string; errorType?: string }) => void) | null = null;
  
  private static instanceCount = 0;
  private instanceId: number;

  constructor() {
    NFCService.instanceCount++;
    this.instanceId = NFCService.instanceCount;
    console.log(`🏗️ DEBUG: Creating NFCService instance #${this.instanceId} (total instances: ${NFCService.instanceCount})`);
    
    this.nfc = new NFC();
    this.setupNFC();
  }

  // Setup NFC readers and event handlers
  private setupNFC(): void {
    console.log(`🔧 DEBUG: Instance #${this.instanceId} - Setting up NFC readers`);
    this.nfc.on('reader', (reader: Reader) => {
      console.log(`💳 Instance #${this.instanceId} - NFC Reader Detected:`, reader.name);
      reader.aid = AID;
      console.log(`🔑 Instance #${this.instanceId} - AID set for reader:`, AID);
      broadcast({ type: 'nfc_status', message: `Reader connected: ${reader.name}`});
      this.setupReaderEvents(reader);
    });
  }

  // Setup event handlers for a specific reader
  private setupReaderEvents(reader: Reader): void {
    console.log(`🔧 DEBUG: Instance #${this.instanceId} - Setting up event handlers for reader: ${reader.name}`);
    
    (reader as any).on('card', async (card: CardData) => {
      console.log(`🔧 DEBUG: Instance #${this.instanceId} - Card event handler called, this.paymentArmed = ${this.paymentArmed}`);
      await this.handleCard(reader, card);
    });

    (reader as any).on('error', (err: Error) => {
      if (err.message.includes('Cannot process ISO 14443-4 tag')) {
        console.log(`💳 Instance #${this.instanceId} - Payment card detected - ignoring tap`);
        broadcast({ type: 'nfc_status', message: 'Payment card detected - not supported' });
        return;
      }
      console.error(`❌ Instance #${this.instanceId} - Reader error:`, err);
    });

    (reader as any).on('end', () => {
      console.log(`🔌 Instance #${this.instanceId} - Reader disconnected:`, reader.name);
      broadcast({ type: 'nfc_status', message: `Reader disconnected: ${reader.name}` });
    });
  }

  // Handle card detection and processing
  private async handleCard(reader: Reader, card: CardData): Promise<void> {
    console.log(`🔧 DEBUG: Instance #${this.instanceId} - Card event handler called, this.paymentArmed = ${this.paymentArmed}`);
    console.log('📱 Card Detected:', {
      type: card.type,
      standard: card.standard
    });

    console.log(`🔍 DEBUG: Instance #${this.instanceId} - Armed state check - paymentArmed: ${this.paymentArmed}, walletScanArmed: ${this.walletScanArmed}`);
    console.log(`🔍 DEBUG: Instance #${this.instanceId} - Current payment amount: ${this.currentPaymentAmount}`);
    console.log(`🔍 DEBUG: Instance #${this.instanceId} - Card handler resolve exists: ${!!this.cardHandlerResolve}`);

    if (!this.paymentArmed && !this.walletScanArmed) {
      console.log(`💤 Instance #${this.instanceId} - Reader not armed for payment or wallet scan, ignoring tap`);
      broadcast({ type: 'nfc_status', message: 'Reader not armed' });
      return;
    }


    try {
      const resp = await reader.transmit(GET, 256);
      const sw = resp.readUInt16BE(resp.length - 2);
      
      if (sw !== 0x9000) {
        throw new Error(`Bad status ${  sw.toString(16)}`);
      }

      const phoneResponse = resp.slice(0, -2).toString();
      console.log('📱 Phone says →', phoneResponse);
      
      if (PolkadotService.isSubstrateAddress(phoneResponse)) {
        // Address validated successfully
      }
      
      if (this.walletScanArmed) {
        await this.processWalletScan(phoneResponse, reader);
      } else if (this.paymentArmed && this.currentPaymentAmount !== null) {
        await this.processPhoneResponse(phoneResponse, reader, this.currentPaymentAmount);
      }
    } catch (error: any) {
      console.error(`❌ Instance #${this.instanceId} - Error processing card:`, error);
      
      if (this.cardHandlerResolve) {
        this.cardHandlerResolve({
          success: false,
          message: `Error processing card: ${error.message}`,
          errorType: 'CARD_PROCESSING_ERROR'
        });
        this.resetPaymentState();
      }
    }
  }

  // Process wallet address scan
  private async processWalletScan(phoneResponse: string, _reader: Reader): Promise<void> {
    console.log(`🔍 Instance #${this.instanceId} - Processing wallet scan`);
    
    if (PolkadotService.isSubstrateAddress(phoneResponse)) {
      console.log(`✅ Instance #${this.instanceId} - Valid Substrate address received: ${phoneResponse}`);
      broadcast({ type: 'wallet_scanned', message: 'Wallet address scanned successfully', address: phoneResponse });
      
      if (this.walletScanResolve) {
        this.walletScanResolve({
          success: true,
          message: 'Wallet address scanned successfully',
          address: phoneResponse
        });
      }
    } else {
      console.log(`❌ Instance #${this.instanceId} - Invalid address format: ${phoneResponse}`);
      broadcast({ type: 'wallet_scan_error', message: 'Invalid address format' });
      
      if (this.walletScanResolve) {
        this.walletScanResolve({
          success: false,
          message: 'Invalid address format',
          errorType: 'INVALID_ADDRESS'
        });
      }
    }
    
    this.resetWalletScanState();
  }

  // Process payment request
  private async processPhoneResponse(phoneResponse: string, reader: Reader, amount: number): Promise<void> {
    console.log(`💳 Instance #${this.instanceId} - Processing payment for $${amount}`);
    
    if (!PolkadotService.isSubstrateAddress(phoneResponse)) {
      console.log(`❌ Instance #${this.instanceId} - Invalid address format: ${phoneResponse}`);
      broadcast({ type: 'payment_error', message: 'Invalid address format' });
      
      if (this.cardHandlerResolve) {
        this.cardHandlerResolve({
          success: false,
          message: 'Invalid address format',
          errorType: 'INVALID_ADDRESS'
        });
      }
      this.resetPaymentState();
      return;
    }

    try {
      broadcast({ type: 'status', message: 'Loading tokens...' });
      
      let portfolio;
      try {
        const balanceFetchStart = Date.now();
        portfolio = await PolkadotService.getBalancesForAllChains(phoneResponse);
        const balanceFetchTime = Date.now() - balanceFetchStart;
        console.log(`⏱️ [PROFILE] Total balance fetch time: ${balanceFetchTime}ms`);
      } catch (fetchError: any) {
        console.error('💥 Error fetching tokens from Polkadot:', fetchError);
        throw new Error('FAILED_TO_FETCH_TOKENS');
      }
      
      const paymentStart = Date.now();
      const paymentInfo = await PaymentService.calculateAndSendPayment(portfolio, reader, amount);
      const paymentTime = Date.now() - paymentStart;
      console.log(`⏱️ [PROFILE] Payment processing completed in ${paymentTime}ms`);
      
      console.log(`✅ Instance #${this.instanceId} - Payment processed successfully`);
      broadcast({ type: 'payment_sent', message: 'Payment request sent successfully' });
      
      if (this.cardHandlerResolve) {
        this.cardHandlerResolve({
          success: true,
          message: 'Payment request sent successfully',
          paymentInfo
        });
      }
    } catch (error: any) {
      console.error(`❌ Instance #${this.instanceId} - Payment processing error:`, error);
      broadcast({ type: 'payment_error', message: `Payment failed: ${error.message}` });
      
      if (this.cardHandlerResolve) {
        this.cardHandlerResolve({
          success: false,
          message: `Payment failed: ${error.message}`,
          errorType: error.message === 'FAILED_TO_FETCH_TOKENS' ? 'FETCH_ERROR' : 'PAYMENT_ERROR'
        });
      }
    }
    
    this.resetPaymentState();
  }

  // Arm the NFC reader for payment processing
  async armForPaymentAndAwaitTap(amount: number): Promise<{ success: boolean; message: string; errorType?: string; paymentInfo?: any }> {
    console.log(`💳 Instance #${this.instanceId} - Arming for payment: $${amount}`);
    
    if (this.paymentArmed || this.walletScanArmed) {
      return {
        success: false,
        message: 'Reader is already armed for another operation',
        errorType: 'ALREADY_ARMED'
      };
    }

    this.paymentArmed = true;
    this.currentPaymentAmount = amount;
    
    broadcast({ type: 'nfc_status', message: 'Tap your device to pay' });
    
    return new Promise((resolve) => {
      this.cardHandlerResolve = resolve;
      this.cardHandlerPromise = new Promise((resolve) => {
        this.cardHandlerResolve = resolve;
      });
    });
  }

  // Arm the NFC reader for wallet address scanning
  async scanForWalletAddress(): Promise<{ success: boolean; message: string; address?: string; errorType?: string }> {
    console.log(`🔍 Instance #${this.instanceId} - Starting wallet address scan`);
    
    if (this.paymentArmed || this.walletScanArmed) {
      return {
        success: false,
        message: 'Reader is already armed for another operation',
        errorType: 'ALREADY_ARMED'
      };
    }

    this.walletScanArmed = true;
    
    broadcast({ type: 'nfc_status', message: 'Tap your device to scan wallet address' });
    
    return new Promise((resolve) => {
      this.walletScanResolve = resolve;
      this.walletScanPromise = new Promise((resolve) => {
        this.walletScanResolve = resolve;
      });
    });
  }

  // Cancel current operation
  cancelCurrentOperation(): void {
    console.log(`❌ Instance #${this.instanceId} - Cancelling current operation`);
    
    if (this.paymentArmed) {
      this.resetPaymentState();
      broadcast({ type: 'nfc_status', message: 'Payment cancelled' });
    }
    
    if (this.walletScanArmed) {
      this.resetWalletScanState();
      broadcast({ type: 'nfc_status', message: 'Wallet scan cancelled' });
    }
  }

  // Reset payment state
  private resetPaymentState(): void {
    this.paymentArmed = false;
    this.currentPaymentAmount = null;
    this.cardHandlerResolve = null;
    this.cardHandlerPromise = null;
  }

  // Reset wallet scan state
  private resetWalletScanState(): void {
    this.walletScanArmed = false;
    this.walletScanResolve = null;
    this.walletScanPromise = null;
  }

  // Start listening for NFC readers
  startListening(): void {
    console.log(`🟢 Instance #${this.instanceId} - Starting to listen for readers...`);
    // NFC starts automatically when created
    console.log(`📡 Instance #${this.instanceId} - NFC Service is now listening for readers.`);
  }

  // Stop listening for NFC readers
  stopListening(): void {
    console.log(`🔴 Instance #${this.instanceId} - Stopping NFC service`);
    // NFC cleanup is handled automatically
  }
}
