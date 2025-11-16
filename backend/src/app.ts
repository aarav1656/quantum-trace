import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import config from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { metricsMiddleware } from './middleware/metrics';
import { redisClient } from './config/redis';
import { database } from './config/database';

// Route imports
import productRoutes from './api/products';
import supplyChainRoutes from './api/supplyChain';
import iotRoutes from './api/iot';
import traceabilityRoutes from './api/traceability';
import complianceRoutes from './api/compliance';
import enterpriseRoutes from './api/enterprise';
import healthRoutes from './api/health';
import metricsRoutes from './api/metrics';

// WebSocket handlers
import { setupWebSocketHandlers } from './websocket/handlers';

class SupplyChainAPI {
  private app: express.Application;
  private server: any;
  private io: Server;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.cors.origins,
        credentials: true,
      },
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeWebSocket();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.rateLimit.requests,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);

    // CORS
    this.app.use(cors({
      origin: config.cors.origins,
      credentials: true,
      optionsSuccessStatus: 200,
    }));

    // Body parsing and compression
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    }));

    // Metrics
    this.app.use(metricsMiddleware);

    // Trust proxy for load balancers
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // Health check
    this.app.use('/health', healthRoutes);
    this.app.use('/metrics', metricsRoutes);

    // API routes
    this.app.use('/api/v1/products', authMiddleware, productRoutes);
    this.app.use('/api/v1/supply-chain', authMiddleware, supplyChainRoutes);
    this.app.use('/api/v1/iot', authMiddleware, iotRoutes);
    this.app.use('/api/v1/traceability', authMiddleware, traceabilityRoutes);
    this.app.use('/api/v1/compliance', authMiddleware, complianceRoutes);
    this.app.use('/api/v1/enterprise', authMiddleware, enterpriseRoutes);

    // Default route
    this.app.get('/', (req, res) => {
      res.json({
        message: 'IOTA Supply Chain API',
        version: '1.0.0',
        documentation: '/api-docs',
        health: '/health',
        metrics: '/metrics',
      });
    });
  }

  private initializeSwagger(): void {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'IOTA Supply Chain API',
          version: '1.0.0',
          description: 'Enterprise Supply Chain Management API with IOTA Integration',
        },
        servers: [
          {
            url: `http://localhost:${config.port}`,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
      apis: ['./src/api/*.ts', './src/models/*.ts'],
    };

    const specs = swaggerJsdoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeWebSocket(): void {
    setupWebSocketHandlers(this.io);

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      await database.raw('SELECT 1');
      logger.info('Database connected successfully');

      // Initialize Redis
      await redisClient.ping();
      logger.info('Redis connected successfully');

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`Supply Chain API server running on port ${config.port}`);
        logger.info(`API Documentation available at http://localhost:${config.port}/api-docs`);
        logger.info(`Health check available at http://localhost:${config.port}/health`);
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getIO(): Server {
    return this.io;
  }
}

// Initialize and start the application
const api = new SupplyChainAPI();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  api.start();
}

export default api;