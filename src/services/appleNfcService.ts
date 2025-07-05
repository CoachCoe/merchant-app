import { NFC, Reader } from 'nfc-pcsc';
import { CardData } from '../types/index.js';
import { EthereumService } from './ethereumService.js';
import { AddressProcessor } from './addressProcessor.js';
import { AlchemyService } from './alchemyService.js';
import { PaymentService } from './paymentService.js';
import { broadcast } from '../server.js';

/**
 * Service for handling Apple device NFC integration
 * Uses a hybrid approach: NFC for wallet address + QR codes for payment requests
 */
export class AppleNfcService {
  private nfc: NFC;
  private paymentArmed: boolean = false;
  private walletScanArmed: boolean = false;
  private currentPaymentAmount: number | null = null;
  private cardHandlerPromise: Promise<{ success: boolean; message: string; errorType?: string; paymentInfo?: any }> | null = null;
  private cardHandlerResolve: ((result: { success: boolean; message: string; errorType?: string; paymentInfo?: any }) => void) | null = null;
  private walletScanPromise: Promise<{ success: boolean; message: string; address?: string; errorType?: string }> | null = null;
  private walletScanResolve: ((result: { success: boolean; message: string; address?: string; errorType?: string }) => void) | null = null;

  constructor() {
    this.nfc = new NFC();
    this.setupNFC();
  }

  /**
   * Setup NFC readers for Apple device compatibility
   * Apple devices can only read NFC tags, so we use a different approach
   */
  private setupNFC(): void {
    console.log('🍎 Setting up Apple-compatible NFC service');
    this.nfc.on('reader', (reader: Reader) => {
      console.log('📱 Apple NFC Reader Detected:', reader.name);
      broadcast({ type: 'nfc_status', message: `Apple reader connected: ${reader.name}` });
      this.setupAppleReaderEvents(reader);
    });
  }

  /**
   * Setup event handlers for Apple NFC compatibility
   */
  private setupAppleReaderEvents(reader: Reader): void {
    console.log('🔧 Setting up Apple NFC event handlers');

    // Apple devices can read NFC tags, so we'll use a different approach
    (reader as any).on('card', async (card: CardData) => {
      console.log('📱 Apple device detected');
      await this.handleAppleDevice(reader, card);
    });

    (reader as any).on('error', (err: Error) => {
      console.error('❌ Apple NFC reader error:', err);
      broadcast({ type: 'nfc_status', message: 'Apple NFC error' });
    });

    (reader as any).on('end', () => {
      console.log('🔌 Apple NFC reader disconnected:', reader.name);
      broadcast({ type: 'nfc_status', message: `Apple reader disconnected: ${reader.name}` });
    });
  }

  /**
   * Handle Apple device detection
   * Apple devices can only read NFC tags, so we use a different approach
   */
  private async handleAppleDevice(reader: Reader, card: CardData): Promise<void> {
    console.log('🍎 Apple device detected:', {
      type: card.type,
      standard: card.standard
    });

    if (!this.paymentArmed && !this.walletScanArmed) {
      console.log('💤 Reader not armed for Apple device');
      broadcast({ type: 'nfc_status', message: 'Reader not armed for Apple device' });
      return;
    }

    try {
      // For Apple devices, we'll use a different approach
      // Instead of sending APDU commands, we'll generate QR codes
      if (this.walletScanArmed) {
        await this.processAppleWalletScan();
      } else if (this.paymentArmed && this.currentPaymentAmount !== null) {
        await this.processApplePaymentRequest();
      }
    } catch (e) {
      console.error('❌ Error processing Apple device:', e);
      if (this.cardHandlerResolve) {
        this.cardHandlerResolve({ success: false, message: 'Error processing Apple device', errorType: 'APPLE_ERROR' });
        this.cardHandlerResolve = null;
      }
    }
  }

  /**
   * Process Apple wallet scan - generate QR code for wallet address
   */
  private async processAppleWalletScan(): Promise<void> {
    console.log('📱 Processing Apple wallet scan');
    
    // For Apple devices, we'll generate a QR code that the user can scan
    // This QR code will contain instructions for the user to open their wallet app
    const qrData = {
      type: 'wallet_scan',
      message: 'Please open your wallet app and scan this QR code to share your address',
      timestamp: Date.now()
    };

    broadcast({ 
      type: 'apple_qr_code', 
      data: qrData,
      message: 'Scan QR code with your wallet app'
    });

    if (this.walletScanResolve) {
      this.walletScanResolve({ 
        success: true, 
        message: 'QR code generated for Apple wallet scan',
        address: 'QR_CODE_GENERATED'
      });
      this.walletScanResolve = null;
    }
  }

  /**
   * Process Apple payment request - generate QR code with EIP-681 URI
   */
  private async processApplePaymentRequest(): Promise<void> {
    console.log('💳 Processing Apple payment request');
    
    // For Apple devices, we'll generate a QR code with the EIP-681 payment URI
    // The user can scan this with their wallet app
    const paymentUri = this.generateApplePaymentUri();
    
    const qrData = {
      type: 'payment_request',
      uri: paymentUri,
      amount: this.currentPaymentAmount,
      timestamp: Date.now()
    };

    broadcast({ 
      type: 'apple_payment_qr', 
      data: qrData,
      message: 'Scan QR code to complete payment'
    });

    if (this.cardHandlerResolve) {
      this.cardHandlerResolve({ 
        success: true, 
        message: 'QR code generated for Apple payment',
        paymentInfo: {
          uri: paymentUri,
          amount: this.currentPaymentAmount
        }
      });
      this.cardHandlerResolve = null;
    }
  }

  /**
   * Generate EIP-681 payment URI for Apple devices
   */
  private generateApplePaymentUri(): string {
    // This would be generated based on the selected payment token
    // For now, we'll return a placeholder
    return 'ethereum:0xRecipient@1?value=1000000000000000000';
  }

  /**
   * Arm the reader for Apple payment
   */
  public async armForApplePaymentAndAwaitTap(amount: number): Promise<{ success: boolean; message: string; errorType?: string; paymentInfo?: any }> {
    console.log(`🍎 Arming for Apple payment: $${amount}`);
    
    this.paymentArmed = true;
    this.currentPaymentAmount = amount;
    
    broadcast({ type: 'nfc_status', message: 'Ready for Apple device - scan QR code' });
    
    return new Promise((resolve) => {
      this.cardHandlerResolve = resolve;
      
      // Set a timeout for Apple devices
      setTimeout(() => {
        if (this.cardHandlerResolve) {
          this.cardHandlerResolve({ 
            success: false, 
            message: 'Apple device timeout - no QR code scanned',
            errorType: 'APPLE_TIMEOUT'
          });
          this.cardHandlerResolve = null;
        }
        this.disarmPayment();
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Scan for Apple wallet address
   */
  public async scanForAppleWalletAddress(): Promise<{ success: boolean; message: string; address?: string; errorType?: string }> {
    console.log('📱 Scanning for Apple wallet address');
    
    this.walletScanArmed = true;
    
    broadcast({ type: 'nfc_status', message: 'Ready for Apple wallet scan' });
    
    return new Promise((resolve) => {
      this.walletScanResolve = resolve;
      
      // Set a timeout for Apple devices
      setTimeout(() => {
        if (this.walletScanResolve) {
          this.walletScanResolve({ 
            success: false, 
            message: 'Apple wallet scan timeout',
            errorType: 'APPLE_TIMEOUT'
          });
          this.walletScanResolve = null;
        }
        this.disarmWalletScan();
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Disarm payment mode
   */
  private disarmPayment(): void {
    this.paymentArmed = false;
    this.currentPaymentAmount = null;
    console.log('🔒 Apple payment disarmed');
  }

  /**
   * Disarm wallet scan mode
   */
  private disarmWalletScan(): void {
    this.walletScanArmed = false;
    console.log('🔒 Apple wallet scan disarmed');
  }

  /**
   * Cancel current operation
   */
  public cancelCurrentOperation(): void {
    console.log('❌ Cancelling Apple operation');
    this.disarmPayment();
    this.disarmWalletScan();
    
    if (this.cardHandlerResolve) {
      this.cardHandlerResolve({ success: false, message: 'Apple operation cancelled', errorType: 'CANCELLED' });
      this.cardHandlerResolve = null;
    }
    
    if (this.walletScanResolve) {
      this.walletScanResolve({ success: false, message: 'Apple operation cancelled', errorType: 'CANCELLED' });
      this.walletScanResolve = null;
    }
  }

  /**
   * Start listening for Apple devices
   */
  public startListening(): void {
    console.log('🍎 Starting Apple NFC listener');
    // NFC starts automatically when readers are detected
  }

  /**
   * Stop listening for Apple devices
   */
  public stopListening(): void {
    console.log('🍎 Stopping Apple NFC listener');
    // Add any cleanup logic here if needed
  }
} 