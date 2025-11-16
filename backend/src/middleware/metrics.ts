import { Request, Response, NextFunction } from 'express';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from '../utils/logger';

// Initialize default metrics collection
collectDefaultMetrics({ prefix: 'supply_chain_' });

// Custom metrics
const httpRequestsTotal = new Counter({
  name: 'supply_chain_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new Histogram({
  name: 'supply_chain_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const activeConnections = new Gauge({
  name: 'supply_chain_active_connections',
  help: 'Number of active connections',
});

const iotaTransactions = new Counter({
  name: 'supply_chain_iota_transactions_total',
  help: 'Total number of IOTA transactions',
  labelNames: ['type', 'status'],
});

const productRegistrations = new Counter({
  name: 'supply_chain_product_registrations_total',
  help: 'Total number of product registrations',
  labelNames: ['status'],
});

const supplyChainEvents = new Counter({
  name: 'supply_chain_events_total',
  help: 'Total number of supply chain events',
  labelNames: ['event_type', 'status'],
});

const enterpriseApiCalls = new Counter({
  name: 'supply_chain_enterprise_api_calls_total',
  help: 'Total number of enterprise API calls',
  labelNames: ['system', 'operation', 'status'],
});

const enterpriseApiDuration = new Histogram({
  name: 'supply_chain_enterprise_api_duration_seconds',
  help: 'Enterprise API call duration in seconds',
  labelNames: ['system', 'operation'],
  buckets: [0.5, 1, 2, 5, 10, 30],
});

const iotDevices = new Gauge({
  name: 'supply_chain_iot_devices_active',
  help: 'Number of active IoT devices',
});

const sensorDataPoints = new Counter({
  name: 'supply_chain_sensor_data_points_total',
  help: 'Total number of sensor data points received',
  labelNames: ['device_type', 'sensor_type'],
});

const complianceReports = new Counter({
  name: 'supply_chain_compliance_reports_total',
  help: 'Total number of compliance reports generated',
  labelNames: ['status'],
});

const verificationAttempts = new Counter({
  name: 'supply_chain_verification_attempts_total',
  help: 'Total number of product verification attempts',
  labelNames: ['result'],
});

// Middleware to collect HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Increment active connections
  activeConnections.inc();

  res.on('finish', () => {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Record HTTP metrics
    httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode,
      },
      duration
    );

    // Decrement active connections
    activeConnections.dec();
  });

  next();
};

// Custom metrics functions for use in services
export const metrics = {
  recordIotaTransaction: (type: string, status: string) => {
    iotaTransactions.inc({ type, status });
  },

  recordProductRegistration: (status: string) => {
    productRegistrations.inc({ status });
  },

  recordSupplyChainEvent: (eventType: string, status: string) => {
    supplyChainEvents.inc({ event_type: eventType, status });
  },

  recordEnterpriseApiCall: (system: string, operation: string, status: string, duration: number) => {
    enterpriseApiCalls.inc({ system, operation, status });
    enterpriseApiDuration.observe({ system, operation }, duration);
  },

  setActiveIotDevices: (count: number) => {
    iotDevices.set(count);
  },

  recordSensorData: (deviceType: string, sensorType: string) => {
    sensorDataPoints.inc({ device_type: deviceType, sensor_type: sensorType });
  },

  recordComplianceReport: (status: string) => {
    complianceReports.inc({ status });
  },

  recordVerificationAttempt: (result: string) => {
    verificationAttempts.inc({ result });
  },
};

// Health check metrics
const healthChecks = new Gauge({
  name: 'supply_chain_health_checks',
  help: 'Health check status (1 = healthy, 0 = unhealthy)',
  labelNames: ['service'],
});

export const updateHealthCheck = (service: string, healthy: boolean) => {
  healthChecks.set({ service }, healthy ? 1 : 0);
};

// Business metrics
const businessMetrics = {
  productsTracked: new Gauge({
    name: 'supply_chain_products_tracked_total',
    help: 'Total number of products being tracked',
  }),

  averageSupplyChainSteps: new Gauge({
    name: 'supply_chain_average_steps',
    help: 'Average number of steps in supply chain',
  }),

  complianceRate: new Gauge({
    name: 'supply_chain_compliance_rate',
    help: 'Compliance rate percentage',
  }),

  averageTransitTime: new Gauge({
    name: 'supply_chain_average_transit_time_hours',
    help: 'Average transit time in hours',
  }),

  fraudDetection: new Counter({
    name: 'supply_chain_fraud_detection_total',
    help: 'Total number of fraud detection alerts',
    labelNames: ['type', 'severity'],
  }),
};

export const updateBusinessMetrics = {
  setProductsTracked: (count: number) => {
    businessMetrics.productsTracked.set(count);
  },

  setAverageSupplyChainSteps: (steps: number) => {
    businessMetrics.averageSupplyChainSteps.set(steps);
  },

  setComplianceRate: (rate: number) => {
    businessMetrics.complianceRate.set(rate);
  },

  setAverageTransitTime: (hours: number) => {
    businessMetrics.averageTransitTime.set(hours);
  },

  recordFraudDetection: (type: string, severity: string) => {
    businessMetrics.fraudDetection.inc({ type, severity });
  },
};

// Custom registry for application-specific metrics
export const appRegistry = register;

// Endpoint to expose metrics
export const getMetrics = async (): Promise<string> => {
  return await register.metrics();
};

// Reset metrics (useful for testing)
export const resetMetrics = (): void => {
  register.clear();
  collectDefaultMetrics({ prefix: 'supply_chain_' });
};

export default {
  middleware: metricsMiddleware,
  metrics,
  updateHealthCheck,
  updateBusinessMetrics,
  getMetrics,
  resetMetrics,
};