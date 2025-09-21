import { NFCService } from './services/nfcService.js';
import { PriceCacheService } from './services/priceCacheService.js';
import { PolkadotService } from './services/polkadotService.js';
import { logger } from './utils/logger.js';

// Main application orchestrator
export class App {
  private nfcService: NFCService;

  constructor() {
    this.nfcService = new NFCService(); 
}

  // Initialize core services like price caching and start NFC listeners.
  async initializeServices(): Promise<void> {
    logger.info('Initializing App Services...');
    await PolkadotService.initialize();
    await PriceCacheService.initialize();
    this.nfcService.startListening();
    logger.info('App Services initialized successfully');
  }

  // Process a payment request for a given amount.
  // This will arm the NFC service to expect a tap.
  // @param amount The amount to charge in USD.
  // @returns Promise resolving with payment result.
  async processPayment(amount: number): Promise<{ success: boolean; message: string; errorType?: string; paymentInfo?: any }> {
    if (!this.nfcService) {
        logger.error('NFC Service not initialized in App!');
        return { success: false, message: 'NFC Service not ready', errorType: 'NFC_SERVICE_ERROR' };
        }
    logger.business('Processing payment request', { amount: amount });
    return this.nfcService.armForPaymentAndAwaitTap(amount);
  }

  // Scan an NFC device to get wallet address for transaction history filtering.
  // @returns Promise resolving with scan result containing wallet address.
  async scanWalletAddress(): Promise<{ success: boolean; message: string; address?: string; errorType?: string }> {
    if (!this.nfcService) {
        logger.error('NFC Service not initialized in App!');
        return { success: false, message: 'NFC Service not ready', errorType: 'NFC_SERVICE_ERROR' };
    }
    logger.business('Starting wallet address scan', {});
    return this.nfcService.scanForWalletAddress();
  }

  // Cancel any ongoing NFC operations (payment or wallet scan).
  cancelCurrentOperation(): void {
    if (!this.nfcService) {
        logger.error('NFC Service not initialized in App!');
        return;
    }
    logger.business('Cancelling current NFC operation', {});
    this.nfcService.cancelCurrentOperation();
  }

  // Stop core services gracefully.
  async stopServices(): Promise<void> {
    logger.info('Stopping App Services...');
    await PolkadotService.disconnect();
    PriceCacheService.stop();
    if (this.nfcService) {
        this.nfcService.stopListening();
    }
    logger.info('App Services stopped successfully');
  }
} 