import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {
  securityHeaders,
  createRateLimit,
  requestIdMiddleware,
  corsOptions,
  errorHandler,
  notFoundHandler
} from './utils/security.js';
import { logger } from './utils/logger.js';
import { DatabaseService } from './services/databaseService.js';
import { getBlockchainSyncService } from './services/blockchainSyncService.js';
import { productRoutes } from './routes/products.js';
import { categoryRoutes } from './routes/categories.js';
import { cartRoutes } from './routes/cart.js';
import { deliveryRoutes } from './routes/delivery.js';
import { sellerRoutes } from './routes/sellers.js';
import marketplaceRoutes from './routes/marketplace.js';
import configRoutes from './routes/config.js';
import { APP_CONFIG } from './config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const expressApp = express();
const server = http.createServer(expressApp);

const wss = new WebSocketServer({
  server,
  verifyClient: (info: any) => {
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

expressApp.use(securityHeaders);
expressApp.use(cors(corsOptions));
expressApp.use(requestIdMiddleware);
expressApp.use(cookieParser());
expressApp.use(express.json({ limit: '10mb' }));
expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));

const generalRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many requests from this IP');

expressApp.use(generalRateLimit);

const reactBuildDir = path.join(__dirname, '..', 'dist');

expressApp.use(express.static(reactBuildDir));
logger.info(`Serving React build files from: ${reactBuildDir}`);

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
        message: 'Connected to marketplace',
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

    deadClients.forEach(client => clients.delete(client));
}

expressApp.use('/api/products',
  createRateLimit(APP_CONFIG.RATE_LIMIT.WINDOW_MS, APP_CONFIG.RATE_LIMIT.MAX_REQUESTS.GENERAL, 'Too many product requests'),
  productRoutes
);
expressApp.use('/api/categories',
  createRateLimit(APP_CONFIG.RATE_LIMIT.WINDOW_MS, APP_CONFIG.RATE_LIMIT.MAX_REQUESTS.GENERAL, 'Too many category requests'),
  categoryRoutes
);
expressApp.use('/api/cart',
  createRateLimit(APP_CONFIG.RATE_LIMIT.WINDOW_MS, APP_CONFIG.RATE_LIMIT.MAX_REQUESTS.GENERAL, 'Too many cart requests'),
  cartRoutes
);

expressApp.use('/api/marketplace',
  createRateLimit(APP_CONFIG.RATE_LIMIT.WINDOW_MS, APP_CONFIG.RATE_LIMIT.MAX_REQUESTS.GENERAL, 'Too many marketplace requests'),
  marketplaceRoutes
);

expressApp.use('/api/delivery',
  createRateLimit(APP_CONFIG.RATE_LIMIT.WINDOW_MS, APP_CONFIG.RATE_LIMIT.MAX_REQUESTS.GENERAL, 'Too many delivery requests'),
  deliveryRoutes
);

expressApp.use('/api/sellers',
  createRateLimit(APP_CONFIG.RATE_LIMIT.WINDOW_MS, APP_CONFIG.RATE_LIMIT.MAX_REQUESTS.GENERAL, 'Too many seller requests'),
  sellerRoutes
);

expressApp.use('/api/config',
  createRateLimit(APP_CONFIG.RATE_LIMIT.WINDOW_MS, APP_CONFIG.RATE_LIMIT.MAX_REQUESTS.GENERAL, 'Too many config requests'),
  configRoutes
);

expressApp.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Service is healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        requestId: req.requestId
    });
});

expressApp.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return notFoundHandler(req, res);
  }

  res.sendFile(path.join(reactBuildDir, 'index.html'));
});

expressApp.use(notFoundHandler);
expressApp.use(errorHandler);

async function startServerAndApp() {
    try {
        logger.info('Starting eShop Marketplace...');

        try {
            logger.info('Initializing database service...');
            DatabaseService.getInstance();
            logger.info('Database service initialized');

            // Start blockchain sync service if enabled
            if (process.env.ENABLE_BLOCKCHAIN_SYNC !== 'false') {
                logger.info('Starting blockchain sync service...');
                const syncService = getBlockchainSyncService();
                syncService.start();
                logger.info('Blockchain sync service started');
            } else {
                logger.info('Blockchain sync service disabled (ENABLE_BLOCKCHAIN_SYNC=false)');
            }
        } catch (error) {
            logger.error('Failed to initialize services', error);
            throw error;
        }

        server.listen(PORT, () => {
            logger.info(`HTTP & WebSocket Server running at http://localhost:${PORT}`);
            logger.info(`eShop Marketplace is READY. Open http://localhost:${PORT} in your browser.`);
        });
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
}

function shutdown(signal: string) {
    logger.info(`Received ${signal}. Shutting down gracefully...`);

    // Stop blockchain sync service
    try {
        const syncService = getBlockchainSyncService();
        if (syncService.isActive()) {
            syncService.stop();
            logger.info('Blockchain sync service stopped');
        }
    } catch (error) {
        logger.warn('Error stopping blockchain sync service', error);
    }

    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.close(1001, 'Server shutting down');
        }
    });
    clients.clear();

    server.close(() => {
        logger.info('HTTP server closed');

        wss.close(() => {
            logger.info('WebSocket server closed');

            DatabaseService.getInstance().close();
            logger.info('Database connection closed');

            process.exit(0);
        });
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServerAndApp();
