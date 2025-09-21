import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { App } from './app.js';
import { PolkadotService } from './services/polkadotService.js';
import { SUPPORTED_CHAINS, ChainConfig } from './config/index.js';
import { PolkadotTransactionMonitor } from './services/polkadotTransactionMonitor.js';
import { ConnectionMonitorService } from './services/connectionMonitorService.js';
import { 
  securityHeaders, 
  createRateLimit, 
  requestIdMiddleware, 
  corsOptions, 
  errorHandler, 
  notFoundHandler,
  logSecurityEvent 
} from './utils/security.js';
import { validatePaymentRequest } from './utils/validation.js';
import { logger } from './utils/logger.js';
import { paymentRequestSchema, qrCodeRequestSchema } from './config/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const expressApp = express();
const server = http.createServer(expressApp);

const wss = new WebSocketServer({ 
  server,
  verifyClient: (info: any) => {
    // Basic WebSocket security - could be enhanced with token validation
    const origin = info.origin;
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return true;
    }
    
    logger.security('WebSocket connection rejected', { origin });
    return false;
  }
});

const clients = new Set<WebSocket>();

const nfcApp = new App();

// Security middleware (order matters!)
expressApp.use(securityHeaders);
expressApp.use(cors(corsOptions));
expressApp.use(requestIdMiddleware);
expressApp.use(express.json({ limit: '10mb' }));
expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const generalRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many requests from this IP');
const paymentRateLimit = createRateLimit(5 * 60 * 1000, 10, 'Too many payment requests from this IP');

expressApp.use(generalRateLimit);

const webDir = path.join(__dirname, 'web');
expressApp.use(express.static(webDir));
logger.info(`Serving static files from: ${webDir}`);

interface PaymentSession {
    amount: number;
    merchantAddress: string;
    startTime: number;
    timeout: NodeJS.Timeout;
    expectedToken?: {
        symbol: string;
        address: string;
        amountExact: bigint;
        decimals: number;
    };
}

interface TransactionRecord {
    id: string;
    amount: number;
    fromAddress?: string;
    toAddress: string;
    chainId: number;
    chainName: string;
    tokenSymbol?: string;
    txHash?: string;
    explorerUrl?: string;
    status: 'detected' | 'confirmed' | 'failed';
    timestamp: number;
}

const activePayments = new Map<string, PaymentSession>();
const transactionHistory: TransactionRecord[] = [];

wss.on('connection', (ws, req) => {
    const clientId = Math.random().toString(36).substr(2, 9);
    logger.info('WebSocket client connected', { 
        clientId, 
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] 
    });
    
    clients.add(ws);
    
    const welcomeMessage = {
        type: 'status', 
        message: 'Connected to payment terminal.',
        timestamp: Date.now(),
        clientId
    };
    
    ws.send(JSON.stringify(welcomeMessage));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            logger.debug('WebSocket message received', { clientId, data });
        } catch (error) {
            logger.warn('Invalid WebSocket message received', { 
                clientId, 
                message: message.toString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    
    ws.on('close', (code, reason) => {
        logger.info('WebSocket client disconnected', { 
            clientId, 
            code, 
            reason: reason.toString() 
        });
        clients.delete(ws);
    });
    
    ws.on('error', (error) => {
        logger.error('WebSocket error', error, { clientId });
        clients.delete(ws);
    });
});

export function broadcast(message: object) {
    const data = JSON.stringify({
        ...message,
        timestamp: Date.now()
    });
    
    const deadClients: WebSocket[] = [];
    
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(data);
            } catch (error) {
                logger.error('Error sending WebSocket message', error);
                deadClients.push(client);
            }
        } else {
            deadClients.push(client);
        }
    });
    
    // Clean up dead connections
    deadClients.forEach(client => clients.delete(client));
}

type AsyncRequestHandler = (req: Request, res: Response, next?: NextFunction) => Promise<void | Response>;

async function monitorTransaction(
    merchantAddress: string, 
    usdAmount: number, 
    chainId: number = 0, 
    chainName: string = "Polkadot",
    expectedPayment?: {
        tokenAddress: string;
        requiredAmount: bigint;
        tokenSymbol: string;
        decimals: number;
    }
): Promise<void> {
    const startTime = Date.now();
    const timeout = setTimeout(() => {
        console.log(`⏰ Payment timeout for ${merchantAddress} - No payment received after 5 minutes on ${chainName}`);
        broadcast({ type: 'payment_failure', message: 'Payment timeout - no transaction detected', errorType: 'PAYMENT_TIMEOUT' });
        activePayments.delete(merchantAddress);
        PolkadotTransactionMonitor.stopMonitoring();
    }, 300000); // 5 minutes timeout

    activePayments.set(merchantAddress, {
        amount: usdAmount,
        merchantAddress,
        startTime,
        timeout,
        expectedToken: expectedPayment ? {
            symbol: expectedPayment.tokenSymbol,
            address: expectedPayment.tokenAddress,
            amountExact: expectedPayment.requiredAmount,
            decimals: expectedPayment.decimals
        } : undefined
    });

    try {
        if (expectedPayment) {
            console.log(`🚀 Starting Polkadot monitoring for ${chainName}`);
            await PolkadotTransactionMonitor.startMonitoring(
                expectedPayment.tokenAddress,
                expectedPayment.requiredAmount,
                expectedPayment.tokenSymbol,
                expectedPayment.decimals,
                usdAmount,
                chainId,
                chainName,
                (txHash: string, tokenSymbol: string, tokenAddress: string, decimals: number) => {
                    console.log(`✅ Payment CONFIRMED! Transaction: ${txHash}`);
                    
                    const getBlockExplorerUrl = (chainId: number, txHash: string): string => {
                        const explorerMap: {[key: number]: string} = {
                            0: 'https://polkadot.subscan.io/extrinsic/',
                            2: 'https://kusama.subscan.io/extrinsic/',
                            1285: 'https://moonriver.moonscan.io/tx/',
                            336: 'https://shiden.subscan.io/extrinsic/'
                        };
                        const baseUrl = explorerMap[chainId];
                        return baseUrl ? `${baseUrl}${txHash}` : `https://polkadot.subscan.io/extrinsic/${txHash}`;
                    };
                    
                    const explorerUrl = getBlockExplorerUrl(chainId, txHash);
                    const displayAmount = Number(expectedPayment.requiredAmount) / Math.pow(10, decimals);
                    
                    const transactionRecord: TransactionRecord = {
                        id: `${txHash}-${Date.now()}`,
                        amount: displayAmount,
                        toAddress: merchantAddress,
                        chainId,
                        chainName,
                        tokenSymbol: tokenSymbol,
                        txHash,
                        explorerUrl,
                        status: 'confirmed',
                        timestamp: Date.now()
                    };
                    
                    transactionHistory.unshift(transactionRecord);
                    
                    if (transactionHistory.length > 500) {
                        transactionHistory.splice(500);
                    }
                    
                    clearTimeout(timeout);
                    activePayments.delete(merchantAddress);
                    broadcast({ 
                        type: 'transaction_confirmed', 
                        message: `Approved`,
                        transactionHash: txHash,
                        amount: displayAmount,
                        chainName,
                        chainId,
                        transaction: transactionRecord
                    });
                },
                (error: string) => {
                    console.error(`❌ Payment monitoring error: ${error}`);
                    clearTimeout(timeout);
                    activePayments.delete(merchantAddress);
                    broadcast({ 
                        type: 'payment_failure', 
                        message: `Payment monitoring failed: ${error}`, 
                        errorType: 'MONITORING_ERROR' 
                    });
                }
            );
        } else {
            console.log(`⚠️  No expected payment found for ${merchantAddress}`);
            broadcast({
                type: 'payment_failure',
                message: 'No expected payment found',
                errorType: 'NO_EXPECTED_PAYMENT'
            });
        }
    } catch (error) {
        console.error(`❌ Error in monitorTransaction:`, error);
        broadcast({
            type: 'payment_failure',
            message: `Payment monitoring failed: ${error}`,
            errorType: 'MONITORING_ERROR'
        });
    }
}

const initiatePaymentHandler: AsyncRequestHandler = async (req, res) => {
    const { amount, merchantAddress } = req.body;
    const requestId = req.requestId;

    logger.business('Payment initiation request', {
        requestId,
        amount,
        merchantAddress: merchantAddress?.substring(0, 10) + '...', // Log partial address for security
    });

    try {
        const result = await nfcApp.processPayment(amount);
        
        if (result.success && result.paymentInfo) {
            const { selectedToken, requiredAmount, chainId, chainName } = result.paymentInfo;
            
            logger.business('Payment initiated successfully', {
                requestId,
                selectedToken: selectedToken.symbol,
                chainId,
                chainName,
                amount: requiredAmount.toString(),
            });
            
            await monitorTransaction(
                merchantAddress,
                amount,
                chainId,
                chainName,
                {
                    tokenAddress: selectedToken.address,
                    requiredAmount: requiredAmount,
                    tokenSymbol: selectedToken.symbol,
                    decimals: selectedToken.decimals
                }
            );
            
            res.json({ 
                success: true, 
                message: 'Payment initiated successfully',
                paymentInfo: result.paymentInfo,
                timestamp: Date.now(),
                requestId
            });
        } else {
            logger.warn('Payment initiation failed', {
                requestId,
                error: result.message,
                errorType: result.errorType,
            });
            
            res.status(400).json({ 
                success: false, 
                message: result.message,
                errorType: result.errorType,
                timestamp: Date.now(),
                requestId
            });
        }
    } catch (error) {
        logger.error('Error initiating payment', error, { requestId });
        
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            errorType: 'INTERNAL_SERVER_ERROR',
            timestamp: Date.now(),
            requestId
        });
    }
};

const scanWalletHandler: AsyncRequestHandler = async (req, res) => {
    console.log('🔍 Initiating wallet address scan');
    broadcast({ type: 'status', message: 'Scanning for wallet address...' });

    try {
        const result = await nfcApp.scanWalletAddress();
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Wallet address scanned successfully',
                address: result.address
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: result.message,
                errorType: result.errorType
            });
        }
    } catch (error) {
        console.error('Error scanning wallet:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

const cancelPaymentHandler: AsyncRequestHandler = async (req, res) => {
    console.log('❌ Cancelling current payment');
    nfcApp.cancelCurrentOperation();
    broadcast({ type: 'status', message: 'Payment cancelled' });
    res.json({ success: true, message: 'Payment cancelled' });
};

const generateQRCodeHandler: AsyncRequestHandler = async (req, res) => {
    const { amount, merchantAddress } = req.body;
    
    if (typeof amount !== 'number' || amount <= 0 || isNaN(amount)) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    if (!merchantAddress) {
        return res.status(400).json({ success: false, message: 'Merchant address is required' });
    }
    
    const isValidSubstrateAddress = PolkadotService.isSubstrateAddress(merchantAddress);
    
    if (!isValidSubstrateAddress) {
        return res.status(400).json({ success: false, message: 'Invalid merchant address format' });
    }

    console.log(`🔗 Generating QR code for $${amount.toFixed(2)} payment`);
    
    try {
        // For now, just return the address - QR code generation can be added later
        res.json({
            success: true,
            data: {
                uri: merchantAddress,
                amount: amount,
                recipientAddress: merchantAddress
            }
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate QR code',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

const getTransactionHistoryHandler: AsyncRequestHandler = async (req, res) => {
    const { address } = req.query;
    
    let filteredHistory = transactionHistory;
    if (address && typeof address === 'string') {
        filteredHistory = transactionHistory.filter(tx => 
            tx.toAddress === address || tx.fromAddress === address
        );
    }
    
    res.json({
        success: true,
        transactions: filteredHistory,
        total: filteredHistory.length
    });
};

const getSupportedChainsHandler: AsyncRequestHandler = async (req, res) => {
    const supportedChains = SUPPORTED_CHAINS.map(chain => ({
        id: chain.id,
        name: chain.name,
        displayName: chain.displayName,
        nativeToken: chain.nativeToken
    }));
    
    const activeSubscriptions = new Map(); // Polkadot doesn't use WebSocket subscriptions like Alchemy
    
    res.json({
        supportedChains,
        activeSubscriptions,
        totalChains: supportedChains.length,
        message: 'Polkadot ecosystem chains loaded successfully'
    });
};

// Routes with validation and rate limiting
expressApp.post('/initiate-payment', 
    paymentRateLimit,
    validatePaymentRequest,
    initiatePaymentHandler
);

expressApp.post('/scan-wallet', scanWalletHandler);
expressApp.post('/cancel-payment', cancelPaymentHandler);
expressApp.post('/generate-qr', 
    paymentRateLimit,
    generateQRCodeHandler
);
expressApp.get('/transaction-history', getTransactionHistoryHandler);
expressApp.get('/supported-chains', getSupportedChainsHandler);

// Health check endpoint
expressApp.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Service is healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        requestId: req.requestId
    });
});

// Error handling middleware (must be last)
expressApp.use(notFoundHandler);
expressApp.use(errorHandler);

async function startServerAndApp() {
    try {
        logger.info('Starting Polkadot Payment Terminal...');
        
        try {
            // PolkadotService is initialized in App.initializeServices()
            logger.info('PolkadotService will be initialized with App services');

            logger.info('Starting connection monitoring...');
            ConnectionMonitorService.startMonitoring((status) => {
                broadcast({
                    type: 'connection_status',
                    message: 'Connection status updated',
                    status: status.status,
                    timestamp: status.lastCheck
                });
            });
            logger.info('Connection monitoring started');
        } catch (error) {
            logger.error('Failed to initialize services', error);
            throw error;
        }

        await nfcApp.initializeServices(); 
        logger.info('NFC Application services (including Price Cache) initialized.');

        server.listen(PORT, () => {
            logger.info(`HTTP & WebSocket Server running at http://localhost:${PORT}`);
            logger.info(`NFC Payment Terminal is READY. Open http://localhost:${PORT} in your browser.`);
        });
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
}

function shutdown(signal: string) {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    
    // Close WebSocket connections
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.close(1001, 'Server shutting down');
        }
    });
    clients.clear();
    
    // Close HTTP server
    server.close(() => {
        logger.info('HTTP server closed');
        
        // Close WebSocket server
        wss.close(() => {
            logger.info('WebSocket server closed');
            
            // Stop application services
            nfcApp.stopServices().then(() => {
                logger.info('Application services stopped');
                process.exit(0);
            }).catch(err => {
                logger.error('Error stopping app services', err);
                process.exit(1);
            });
        });
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServerAndApp();