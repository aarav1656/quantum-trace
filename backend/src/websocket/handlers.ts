import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';
import { iotaService } from '../services/iotaService';

interface SocketWithUser extends Socket {
  userId?: string;
  role?: string;
}

export const setupWebSocketHandlers = (io: Server): void => {
  // Authentication middleware for WebSocket
  io.use(async (socket: SocketWithUser, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token and get user info
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      socket.userId = decoded.id;
      socket.role = decoded.role;

      logger.info(`WebSocket authenticated: User ${socket.userId}`);
      next();
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: SocketWithUser) => {
    logger.info(`WebSocket client connected: ${socket.id} (User: ${socket.userId})`);

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join role-specific room
    if (socket.role) {
      socket.join(`role:${socket.role}`);
    }

    // Subscribe to real-time product updates
    socket.on('subscribe:product', async (productId: string) => {
      try {
        socket.join(`product:${productId}`);
        logger.info(`User ${socket.userId} subscribed to product updates: ${productId}`);

        // Send current product status
        const productData = await redisClient.hgetall(`product:${productId}`);
        if (productData && Object.keys(productData).length > 0) {
          socket.emit('product:status', {
            productId,
            data: productData,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        logger.error('Error subscribing to product updates:', error);
        socket.emit('error', { message: 'Failed to subscribe to product updates' });
      }
    });

    // Unsubscribe from product updates
    socket.on('unsubscribe:product', (productId: string) => {
      socket.leave(`product:${productId}`);
      logger.info(`User ${socket.userId} unsubscribed from product updates: ${productId}`);
    });

    // Subscribe to supply chain events
    socket.on('subscribe:supply_chain', async (productId: string) => {
      try {
        socket.join(`supply_chain:${productId}`);
        logger.info(`User ${socket.userId} subscribed to supply chain events: ${productId}`);

        // Send recent events
        const events = await iotaService.getProductHistory(productId);
        socket.emit('supply_chain:history', {
          productId,
          events: events.slice(-10), // Last 10 events
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Error subscribing to supply chain events:', error);
        socket.emit('error', { message: 'Failed to subscribe to supply chain events' });
      }
    });

    // Subscribe to IoT sensor data
    socket.on('subscribe:iot', async (deviceId: string) => {
      try {
        socket.join(`iot:${deviceId}`);
        logger.info(`User ${socket.userId} subscribed to IoT data: ${deviceId}`);

        // Send latest sensor data
        const sensorData = await redisClient.hgetall(`sensor:${deviceId}`);
        if (sensorData && Object.keys(sensorData).length > 0) {
          socket.emit('iot:data', {
            deviceId,
            data: sensorData,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        logger.error('Error subscribing to IoT data:', error);
        socket.emit('error', { message: 'Failed to subscribe to IoT data' });
      }
    });

    // Subscribe to compliance alerts
    socket.on('subscribe:compliance', (companyId: string) => {
      socket.join(`compliance:${companyId}`);
      logger.info(`User ${socket.userId} subscribed to compliance alerts: ${companyId}`);
    });

    // Request real-time traceability data
    socket.on('get:traceability', async (productId: string) => {
      try {
        const events = await iotaService.getProductHistory(productId);
        const complianceReport = await iotaService.generateComplianceReport(productId);

        socket.emit('traceability:data', {
          productId,
          events,
          compliance: complianceReport,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Error getting traceability data:', error);
        socket.emit('error', { message: 'Failed to get traceability data' });
      }
    });

    // Handle real-time product verification
    socket.on('verify:product', async (data: { productId: string; qrCode?: string }) => {
      try {
        const { productId } = data;

        // Get product data from IOTA
        const events = await iotaService.getProductHistory(productId);
        const isAuthentic = events.length > 0;

        // Generate verification report
        const verificationReport = {
          productId,
          isAuthentic,
          verifiedAt: Date.now(),
          events: events.length,
          lastEvent: events[events.length - 1] || null,
        };

        socket.emit('verification:result', verificationReport);

        // Log verification attempt
        await redisClient.lpush(
          `verification_log:${productId}`,
          JSON.stringify({
            userId: socket.userId,
            result: isAuthentic,
            timestamp: Date.now(),
          })
        );

      } catch (error) {
        logger.error('Error verifying product:', error);
        socket.emit('error', { message: 'Failed to verify product' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket client disconnected: ${socket.id} (User: ${socket.userId}) - Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`WebSocket error for user ${socket.userId}:`, error);
    });
  });

  // Broadcast functions for external use
  setupBroadcastFunctions(io);
};

const setupBroadcastFunctions = (io: Server) => {
  // Export broadcast functions for use in other services
  global.broadcastToProduct = (productId: string, event: string, data: any) => {
    io.to(`product:${productId}`).emit(event, {
      ...data,
      timestamp: Date.now(),
    });
  };

  global.broadcastToRole = (role: string, event: string, data: any) => {
    io.to(`role:${role}`).emit(event, {
      ...data,
      timestamp: Date.now(),
    });
  };

  global.broadcastToUser = (userId: string, event: string, data: any) => {
    io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: Date.now(),
    });
  };

  global.broadcastIoTData = (deviceId: string, sensorData: any) => {
    io.to(`iot:${deviceId}`).emit('iot:data', {
      deviceId,
      data: sensorData,
      timestamp: Date.now(),
    });
  };

  global.broadcastSupplyChainEvent = (productId: string, event: any) => {
    io.to(`supply_chain:${productId}`).emit('supply_chain:event', {
      productId,
      event,
      timestamp: Date.now(),
    });
  };

  global.broadcastComplianceAlert = (companyId: string, alert: any) => {
    io.to(`compliance:${companyId}`).emit('compliance:alert', {
      companyId,
      alert,
      timestamp: Date.now(),
    });
  };
};

export default setupWebSocketHandlers;