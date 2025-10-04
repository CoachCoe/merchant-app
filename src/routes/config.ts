/**
 * Config API Routes - Provides blockchain configuration to frontend
 */

import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/config/blockchain
 * Returns blockchain configuration for client-side direct mode
 */
router.get('/blockchain', (req, res) => {
  try {
    const config = {
      rpcUrl: process.env.EVM_RPC_URL || null,
      contractAddress: process.env.PRODUCT_REGISTRY_CONTRACT_ADDRESS || null,
      network: process.env.DEPLOYMENT_NETWORK || 'unknown',
      ipfsGateway: process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs'
    };

    // Don't send config if critical values are missing
    if (!config.rpcUrl || !config.contractAddress) {
      logger.warn('Blockchain config incomplete - direct mode unavailable');
      return res.json({
        success: true,
        data: null,
        message: 'Blockchain configuration not available'
      });
    }

    logger.info('Blockchain config requested', {
      network: config.network,
      hasRpc: !!config.rpcUrl,
      hasContract: !!config.contractAddress
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('Error fetching blockchain config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blockchain configuration'
    });
  }
});

export default router;
