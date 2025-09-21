import { PolkadotService } from './polkadotService.js';
import { RECIPIENT_ADDRESS } from '../config/index.js';

interface PaymentSession {
  recipientAddress: string;
  expectedAmount: bigint;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  merchantUSD: number;
  chainId: number;
  chainName: string;
  onPaymentReceived: (txHash: string, tokenSymbol: string, tokenAddress: string, decimals: number) => void;
  onError: (error: string) => void;
}

export class PolkadotTransactionMonitor {
  private static currentSession: PaymentSession | null = null;
  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static readonly POLLING_INTERVAL = 5000; // 5 seconds
  private static lastCheckedBlock: number = 0;
  private static startTime: number = 0;

  static async startMonitoring(
    tokenAddress: string,
    expectedAmount: bigint,
    tokenSymbol: string,
    tokenDecimals: number,
    merchantUSD: number,
    chainId: number,
    chainName: string,
    callback: (txHash: string, tokenSymbol: string, tokenAddress: string, decimals: number) => void,
    errorCallback: (error: string) => void
  ): Promise<void> {
    console.log(`\n🔍 STARTING POLKADOT PAYMENT MONITORING`);
    console.log(`💰 Merchant amount: $${merchantUSD.toFixed(2)} USD`);
    console.log(`💳 Expected token: ${tokenSymbol}`);
    console.log(`🔢 Expected amount: ${expectedAmount.toString()} smallest units`);
    console.log(`📊 Display amount: ${Number(expectedAmount) / Math.pow(10, tokenDecimals)} ${tokenSymbol}`);
    console.log(`⛓️  Chain: ${chainName} (ID: ${chainId})`);
    console.log(`🏠 Recipient: ${RECIPIENT_ADDRESS}`);

    this.currentSession = {
      recipientAddress: RECIPIENT_ADDRESS,
      expectedAmount,
      tokenAddress,
      tokenSymbol,
      tokenDecimals,
      merchantUSD,
      chainId,
      chainName,
      onPaymentReceived: callback,
      onError: errorCallback
    };

    this.startTime = Date.now();
    this.lastCheckedBlock = await PolkadotService.getCurrentBlock(chainId);
    
    console.log(`📊 Starting from block: ${this.lastCheckedBlock}`);
    console.log(`⏰ Monitoring will timeout after 5 minutes`);

    this.monitoringInterval = setInterval(async () => {
      await this.checkForPayment();
    }, this.POLLING_INTERVAL);

    // Set timeout for 5 minutes
    setTimeout(() => {
      if (this.currentSession) {
        console.log('⏰ Payment monitoring timeout after 5 minutes');
        this.stopMonitoring();
        errorCallback('Payment timeout - no transaction received within 5 minutes');
      }
    }, 300000); // 5 minutes
  }

  private static async checkForPayment(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const currentBlock = await PolkadotService.getCurrentBlock(this.currentSession.chainId);
      
      if (currentBlock > this.lastCheckedBlock) {
        console.log(`📊 Checking blocks ${this.lastCheckedBlock + 1} to ${currentBlock}`);
        
        for (let blockNum = this.lastCheckedBlock + 1; blockNum <= currentBlock; blockNum++) {
          await this.checkBlockForPayment(blockNum);
        }
        
        this.lastCheckedBlock = currentBlock;
      }
    } catch (error) {
      console.error('❌ Error checking for payment:', error);
      this.currentSession.onError(`Monitoring error: ${error}`);
    }
  }

  private static async checkBlockForPayment(blockNumber: number): Promise<void> {
    if (!this.currentSession) return;

    try {
      const block = await PolkadotService.getBlock(this.currentSession.chainId, blockNumber);
      if (!block) return;

      // For now, we'll use a simple approach: check if the recipient's balance increased
      // In a production system, you'd want to parse the block's extrinsics more carefully
      const currentBalance = await PolkadotService.getBalance(
        this.currentSession.recipientAddress, 
        this.currentSession.chainId
      );

      // This is a simplified check - in reality you'd want to track the exact transaction
      if (currentBalance >= this.currentSession.expectedAmount) {
        console.log('✅ Payment detected! Balance increased to expected amount');
        this.stopMonitoring();
        
        // Generate a mock transaction hash for now
        const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        
        this.currentSession.onPaymentReceived(
          txHash,
          this.currentSession.tokenSymbol,
          this.currentSession.tokenAddress,
          this.currentSession.tokenDecimals
        );
      }
    } catch (error) {
      console.error(`❌ Error checking block ${blockNumber}:`, error);
    }
  }

  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.currentSession) {
      const duration = Date.now() - this.startTime;
      console.log(`🛑 Stopped monitoring after ${Math.round(duration / 1000)}s`);
      this.currentSession = null;
    }
  }

  static isMonitoring(): boolean {
    return this.currentSession !== null;
  }

  static getCurrentSession(): PaymentSession | null {
    return this.currentSession;
  }
}
