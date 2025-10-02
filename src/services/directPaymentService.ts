import { ApiPromise, WsProvider } from '@polkadot/api';
import { logger } from '../utils/logger.js';

export interface PaymentTransaction {
  transactionHash: string;
  buyer: string;
  seller: string;
  amount: number;
  token: string;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  seller_wallet_address: string;
  unit_price_hollar: number;
  quantity: number;
}

export class DirectPaymentService {
  private api: ApiPromise | null = null;
  private assetHubUrl: string;
  private hollarAssetId: number;

  constructor() {
    this.assetHubUrl = process.env.ASSETHUB_WSS_URL || 'wss://polkadot-asset-hub-rpc.polkadot.io';
    this.hollarAssetId = parseInt(process.env.HOLLAR_ASSET_ID || '1984', 10);

    logger.info('DirectPaymentService initialized', {
      assetHub: this.assetHubUrl,
      hollarAssetId: this.hollarAssetId
    });
  }

  async initialize(): Promise<void> {
    if (this.api) {
      return;
    }

    try {
      const provider = new WsProvider(this.assetHubUrl);
      this.api = await ApiPromise.create({ provider });

      await this.api.isReady;

      logger.info('Connected to AssetHub', {
        chain: (await this.api.rpc.system.chain()).toString()
      });
    } catch (error) {
      logger.error('Failed to connect to AssetHub', error);
      throw new Error('AssetHub connection failed');
    }
  }

  async getHollarBalance(address: string): Promise<bigint> {
    if (!this.api) {
      await this.initialize();
    }

    try {
      const balance = await this.api!.query.assets.account(this.hollarAssetId, address);

      if ((balance as any).isNone) {
        return 0n;
      }

      const accountData = (balance as any).unwrap();
      return BigInt(accountData.balance.toString());
    } catch (error) {
      logger.error('Failed to query Hollar balance', error);
      throw new Error('Balance query failed');
    }
  }

  async processCheckout(cartItems: CartItem[], buyerWallet: string): Promise<{
    transactions: PaymentTransaction[];
    total: number;
    status: string;
  }> {
    const total = this.calculateCartTotal(cartItems);
    const itemsBySeller = this.groupBySeller(cartItems);

    const paymentTransactions: PaymentTransaction[] = [];

    for (const [sellerWallet, items] of Object.entries(itemsBySeller)) {
      const sellerTotal = this.calculateSubtotal(items);

      const tx = await this.createDirectPayment(
        buyerWallet,
        sellerWallet,
        sellerTotal,
        items
      );

      paymentTransactions.push(tx);
    }

    return {
      transactions: paymentTransactions,
      total,
      status: 'payment_sent'
    };
  }

  async createDirectPayment(
    buyer: string,
    seller: string,
    amount: number,
    items: CartItem[]
  ): Promise<PaymentTransaction> {
    if (!this.api) {
      await this.initialize();
    }

    const productIds = items.map(i => i.product_id).join(',');
    const memo = `3bae:${productIds}`;

    logger.info('Creating direct Hollar payment', {
      buyer,
      seller,
      amount,
      memo
    });

    return {
      transactionHash: `pending-${Date.now()}`,
      buyer,
      seller,
      amount,
      token: 'HOLLAR',
      items: items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity
      })),
      status: 'pending',
      timestamp: Date.now()
    };
  }

  async monitorTransaction(txHash: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber?: number;
  }> {
    if (!this.api) {
      await this.initialize();
    }

    return {
      status: 'pending'
    };
  }

  calculateCartTotal(cartItems: CartItem[]): number {
    return cartItems.reduce((total, item) => {
      return total + (item.unit_price_hollar * item.quantity);
    }, 0);
  }

  groupBySeller(cartItems: CartItem[]): Record<string, CartItem[]> {
    return cartItems.reduce((acc, item) => {
      if (!acc[item.seller_wallet_address]) {
        acc[item.seller_wallet_address] = [];
      }
      acc[item.seller_wallet_address].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);
  }

  calculateSubtotal(items: CartItem[]): number {
    return items.reduce((total, item) => {
      return total + (item.unit_price_hollar * item.quantity);
    }, 0);
  }

  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
      logger.info('Disconnected from AssetHub');
    }
  }
}
