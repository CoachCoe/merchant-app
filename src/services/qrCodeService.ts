import QRCode from 'qrcode';

export class QRCodeService {
  
  static async generateWalletQRCode(address: string): Promise<string> {
    try {
      const qrData = {
        type: 'wallet_address',
        address,
        timestamp: Date.now(),
        message: 'Scan this QR code to share your wallet address'
      };
      
      const qrString = JSON.stringify(qrData);
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating wallet QR code:', error);
      throw new Error('Failed to generate wallet QR code');
    }
  }

  static async generatePaymentQRCode(uri: string, amount: number, tokenSymbol: string): Promise<string> {
    try {
      const qrData = {
        type: 'payment_request',
        uri,
        amount,
        tokenSymbol,
        timestamp: Date.now(),
        message: `Scan this QR code to pay ${amount} ${tokenSymbol}`
      };
      
      const qrString = JSON.stringify(qrData);
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating payment QR code:', error);
      throw new Error('Failed to generate payment QR code');
    }
  }

  static async generateEIP681QRCode(uri: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(uri, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating EIP-681 QR code:', error);
      throw new Error('Failed to generate EIP-681 QR code');
    }
  }

  static async generateAppleWalletQRCode(paymentData: {
    amount: number;
    tokenSymbol: string;
    chainId: number;
    recipientAddress: string;
    tokenAddress?: string;
  }): Promise<string> {
    try {
      let uri: string;
      if (paymentData.tokenAddress) {
        uri = `ethereum:${paymentData.tokenAddress}@${paymentData.chainId}/transfer?address=${paymentData.recipientAddress}&uint256=${paymentData.amount}`;
      } else {
        uri = `ethereum:${paymentData.recipientAddress}@${paymentData.chainId}?value=${paymentData.amount}`;
      }
      
      const qrData = {
        type: 'apple_wallet_payment',
        uri,
        amount: paymentData.amount,
        tokenSymbol: paymentData.tokenSymbol,
        chainId: paymentData.chainId,
        timestamp: Date.now(),
        instructions: 'Open your wallet app and scan this QR code to complete the payment'
      };
      
      const qrString = JSON.stringify(qrData);
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        width: 350,
        margin: 3,
        color: {
          dark: '#007AFF',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating Apple Wallet QR code:', error);
      throw new Error('Failed to generate Apple Wallet QR code');
    }
  }

  static async generateManualEntryQRCode(): Promise<string> {
    try {
      const qrData = {
        type: 'manual_entry',
        message: 'Please manually enter your wallet address in the terminal',
        timestamp: Date.now(),
        instructions: 'If you cannot scan QR codes, please enter your wallet address manually'
      };
      
      const qrString = JSON.stringify(qrData);
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        width: 250,
        margin: 2,
        color: {
          dark: '#FF6B35', // Orange for manual entry
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating manual entry QR code:', error);
      throw new Error('Failed to generate manual entry QR code');
    }
  }
} 