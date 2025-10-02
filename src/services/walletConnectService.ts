import { SignClient } from '@walletconnect/sign-client';
import { logger } from '../utils/logger.js';

export interface WalletConnectionResult {
  address: string;
  displayName: string;
  provider: string;
  chainId?: string;
}

export class WalletConnectService {
  private client: SignClient | null = null;
  private projectId: string;

  constructor() {
    this.projectId = process.env.WALLETCONNECT_PROJECT_ID || '';

    if (!this.projectId) {
      logger.warn('WalletConnect initialized without PROJECT_ID - connection will fail');
    }
  }

  async initialize(): Promise<void> {
    if (this.client) {
      return;
    }

    try {
      this.client = await SignClient.init({
        projectId: this.projectId,
        metadata: {
          name: '3bae Marketplace',
          description: 'Decentralized Web3 marketplace for anonymous commerce',
          url: process.env.APP_URL || 'http://localhost:3000',
          icons: [`${process.env.APP_URL || 'http://localhost:3000'}/icon.png`]
        }
      });

      logger.info('WalletConnect client initialized');
    } catch (error) {
      logger.error('Failed to initialize WalletConnect', error);
      throw new Error('WalletConnect initialization failed');
    }
  }

  async connect(): Promise<{ uri: string; approval: () => Promise<WalletConnectionResult> }> {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const { uri, approval } = await this.client!.connect({
        requiredNamespaces: {
          polkadot: {
            methods: [
              'polkadot_signTransaction',
              'polkadot_signMessage'
            ],
            chains: ['polkadot:91b171bb158e2d3848fa23a9f1c25182'],
            events: ['chainChanged', 'accountsChanged']
          }
        }
      });

      const approvalHandler = async (): Promise<WalletConnectionResult> => {
        const session = await approval();

        const polkadotAccount = session.namespaces.polkadot.accounts[0];
        const address = polkadotAccount.split(':')[2];

        logger.info('Wallet connected via WalletConnect', { address });

        return {
          address,
          displayName: this.truncateAddress(address),
          provider: 'walletconnect',
          chainId: session.namespaces.polkadot.chains?.[0]
        };
      };

      return {
        uri: uri!,
        approval: approvalHandler
      };
    } catch (error) {
      logger.error('WalletConnect connection failed', error);
      throw new Error('Failed to connect wallet');
    }
  }

  async disconnect(topic: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.disconnect({
        topic,
        reason: {
          code: 6000,
          message: 'User disconnected'
        }
      });

      logger.info('Wallet disconnected via WalletConnect');
    } catch (error) {
      logger.error('Failed to disconnect wallet', error);
    }
  }

  private truncateAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  async getActiveSessions() {
    if (!this.client) {
      return [];
    }

    return Object.values(this.client.session.getAll());
  }
}
