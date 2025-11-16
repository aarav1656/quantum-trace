import { Client, SecretManager, Utils } from '@iota/sdk';
import config from '../config/config';
import { logger } from '../utils/logger';

export interface IOTATransaction {
  transactionId: string;
  blockId: string;
  timestamp: number;
  metadata: any;
}

export interface ProductRegistration {
  productId: string;
  manufacturer: string;
  productName: string;
  description: string;
  batchNumber: string;
  manufacturingDate: string;
  metadata: Record<string, any>;
}

export interface SupplyChainEvent {
  eventId: string;
  productId: string;
  eventType: 'manufacture' | 'transfer' | 'quality_check' | 'delivery' | 'custom';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: number;
  actor: string;
  metadata: Record<string, any>;
  previousEventHash?: string;
}

class IOTAService {
  private client: Client;
  private secretManager: SecretManager;

  constructor() {
    this.client = new Client({
      nodes: [config.iota.nodeUrl],
      localPow: true,
    });

    // Initialize secret manager (in production, use secure key management)
    this.secretManager = new SecretManager({
      mnemonic: process.env.IOTA_MNEMONIC || this.generateMnemonic(),
    });
  }

  private generateMnemonic(): string {
    // In production, use a secure mnemonic generation and storage
    return Utils.generateMnemonic();
  }

  /**
   * Register a new product on IOTA
   */
  async registerProduct(productData: ProductRegistration): Promise<IOTATransaction> {
    try {
      logger.info(`Registering product ${productData.productId} on IOTA`);

      const payload = {
        type: 'product_registration',
        version: '1.0',
        data: {
          ...productData,
          timestamp: Date.now(),
          hash: this.generateHash(productData),
        },
      };

      const message = await this.client.buildAndPostBlock(
        this.secretManager,
        {
          tag: Utils.utf8ToHex('SUPPLY_CHAIN_PRODUCT'),
          data: Utils.utf8ToHex(JSON.stringify(payload)),
        }
      );

      const transaction: IOTATransaction = {
        transactionId: message[0],
        blockId: message[1],
        timestamp: Date.now(),
        metadata: payload,
      };

      logger.info(`Product ${productData.productId} registered successfully. Block ID: ${message[1]}`);
      return transaction;

    } catch (error) {
      logger.error('Error registering product on IOTA:', error);
      throw new Error(`Failed to register product: ${error}`);
    }
  }

  /**
   * Record a supply chain event
   */
  async recordSupplyChainEvent(eventData: SupplyChainEvent): Promise<IOTATransaction> {
    try {
      logger.info(`Recording supply chain event ${eventData.eventId} for product ${eventData.productId}`);

      const payload = {
        type: 'supply_chain_event',
        version: '1.0',
        data: {
          ...eventData,
          hash: this.generateHash(eventData),
        },
      };

      const message = await this.client.buildAndPostBlock(
        this.secretManager,
        {
          tag: Utils.utf8ToHex('SUPPLY_CHAIN_EVENT'),
          data: Utils.utf8ToHex(JSON.stringify(payload)),
        }
      );

      const transaction: IOTATransaction = {
        transactionId: message[0],
        blockId: message[1],
        timestamp: Date.now(),
        metadata: payload,
      };

      logger.info(`Supply chain event ${eventData.eventId} recorded successfully. Block ID: ${message[1]}`);
      return transaction;

    } catch (error) {
      logger.error('Error recording supply chain event on IOTA:', error);
      throw new Error(`Failed to record event: ${error}`);
    }
  }

  /**
   * Get transaction details from IOTA
   */
  async getTransaction(blockId: string): Promise<any> {
    try {
      const block = await this.client.getBlock(blockId);
      const payload = block.payload;

      if (payload && 'data' in payload && payload.data) {
        const dataString = Utils.hexToUtf8(payload.data);
        return JSON.parse(dataString);
      }

      return null;
    } catch (error) {
      logger.error(`Error getting transaction ${blockId}:`, error);
      throw new Error(`Failed to get transaction: ${error}`);
    }
  }

  /**
   * Get product history from IOTA
   */
  async getProductHistory(productId: string): Promise<SupplyChainEvent[]> {
    try {
      // Search for blocks with the product ID
      const queryBuilder = this.client.searchByIndex('tag', Utils.utf8ToHex('SUPPLY_CHAIN_EVENT'));
      const blockIds = await queryBuilder;

      const events: SupplyChainEvent[] = [];

      for (const blockId of blockIds) {
        try {
          const transaction = await this.getTransaction(blockId);
          if (transaction && transaction.data && transaction.data.productId === productId) {
            events.push(transaction.data);
          }
        } catch (error) {
          logger.warn(`Failed to parse block ${blockId}:`, error);
        }
      }

      // Sort events by timestamp
      events.sort((a, b) => a.timestamp - b.timestamp);

      return events;
    } catch (error) {
      logger.error(`Error getting product history for ${productId}:`, error);
      throw new Error(`Failed to get product history: ${error}`);
    }
  }

  /**
   * Verify the integrity of a supply chain event
   */
  async verifyEventIntegrity(event: SupplyChainEvent): Promise<boolean> {
    try {
      const computedHash = this.generateHash(event);
      return computedHash === event.metadata?.hash;
    } catch (error) {
      logger.error('Error verifying event integrity:', error);
      return false;
    }
  }

  /**
   * Batch record multiple events
   */
  async batchRecordEvents(events: SupplyChainEvent[]): Promise<IOTATransaction[]> {
    try {
      logger.info(`Batch recording ${events.length} supply chain events`);

      const transactions: IOTATransaction[] = [];

      for (const event of events) {
        try {
          const transaction = await this.recordSupplyChainEvent(event);
          transactions.push(transaction);
        } catch (error) {
          logger.error(`Failed to record event ${event.eventId}:`, error);
        }
      }

      logger.info(`Successfully recorded ${transactions.length}/${events.length} events`);
      return transactions;

    } catch (error) {
      logger.error('Error in batch recording events:', error);
      throw new Error(`Batch recording failed: ${error}`);
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(productId: string): Promise<any> {
    try {
      const events = await this.getProductHistory(productId);
      const product = events.find(event => event.eventType === 'manufacture');

      const report = {
        productId,
        product: product?.metadata || {},
        totalEvents: events.length,
        timeline: events.map(event => ({
          timestamp: event.timestamp,
          eventType: event.eventType,
          location: event.location,
          actor: event.actor,
          verified: await this.verifyEventIntegrity(event),
        })),
        compliance: {
          hasOriginVerification: events.some(e => e.eventType === 'manufacture'),
          hasQualityChecks: events.some(e => e.eventType === 'quality_check'),
          locationTracking: events.every(e => e.location),
          integrityChecks: {
            total: events.length,
            verified: 0,
          },
        },
        generatedAt: Date.now(),
      };

      // Verify integrity of all events
      let verified = 0;
      for (const event of events) {
        if (await this.verifyEventIntegrity(event)) {
          verified++;
        }
      }
      report.compliance.integrityChecks.verified = verified;

      return report;

    } catch (error) {
      logger.error(`Error generating compliance report for ${productId}:`, error);
      throw new Error(`Failed to generate compliance report: ${error}`);
    }
  }

  /**
   * Generate hash for data integrity
   */
  private generateHash(data: any): string {
    const crypto = require('crypto');
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Get network info
   */
  async getNetworkInfo(): Promise<any> {
    try {
      return await this.client.getInfo();
    } catch (error) {
      logger.error('Error getting network info:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getInfo();
      return true;
    } catch (error) {
      logger.error('IOTA health check failed:', error);
      return false;
    }
  }
}

export const iotaService = new IOTAService();
export default iotaService;