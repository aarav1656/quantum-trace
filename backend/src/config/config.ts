import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  database: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  cors: {
    origins: string[];
  };
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  iota: {
    network: string;
    nodeUrl: string;
    explorer: string;
    faucet?: string;
  };
  enterprise: {
    sap: {
      baseUrl: string;
      apiKey: string;
      username: string;
      password: string;
    };
    oracle: {
      baseUrl: string;
      apiKey: string;
      username: string;
      password: string;
    };
    customs: {
      baseUrl: string;
      apiKey: string;
      certificatePath: string;
    };
  };
  iot: {
    mqttBroker: string;
    mqttPort: number;
    mqttUsername: string;
    mqttPassword: string;
  };
  monitoring: {
    prometheusPort: number;
    jaegerEndpoint: string;
  };
  encryption: {
    algorithm: string;
    key: string;
    iv: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'supply_chain',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  },

  rateLimit: {
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
  },

  iota: {
    network: process.env.IOTA_NETWORK || 'testnet',
    nodeUrl: process.env.IOTA_NODE_URL || 'https://api.testnet.iota.org',
    explorer: process.env.IOTA_EXPLORER || 'https://explorer.iota.org/testnet',
    faucet: process.env.IOTA_FAUCET,
  },

  enterprise: {
    sap: {
      baseUrl: process.env.SAP_BASE_URL || 'https://api.sap.com',
      apiKey: process.env.SAP_API_KEY || '',
      username: process.env.SAP_USERNAME || '',
      password: process.env.SAP_PASSWORD || '',
    },
    oracle: {
      baseUrl: process.env.ORACLE_BASE_URL || 'https://api.oracle.com',
      apiKey: process.env.ORACLE_API_KEY || '',
      username: process.env.ORACLE_USERNAME || '',
      password: process.env.ORACLE_PASSWORD || '',
    },
    customs: {
      baseUrl: process.env.CUSTOMS_BASE_URL || 'https://api.customs.gov',
      apiKey: process.env.CUSTOMS_API_KEY || '',
      certificatePath: process.env.CUSTOMS_CERT_PATH || '',
    },
  },

  iot: {
    mqttBroker: process.env.MQTT_BROKER || 'mqtt://localhost',
    mqttPort: parseInt(process.env.MQTT_PORT || '1883', 10),
    mqttUsername: process.env.MQTT_USERNAME || '',
    mqttPassword: process.env.MQTT_PASSWORD || '',
  },

  monitoring: {
    prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
    jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
  },

  encryption: {
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    key: process.env.ENCRYPTION_KEY || 'your-encryption-key-32-characters',
    iv: process.env.ENCRYPTION_IV || 'your-iv-16-chars',
  },
};

export default config;