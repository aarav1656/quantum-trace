import axios, { AxiosInstance } from 'axios';
import config from '../config/config';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';

export interface SAPProduct {
  materialNumber: string;
  description: string;
  manufacturer: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate?: string;
  plantCode: string;
  storageLocation: string;
}

export interface OracleShipment {
  shipmentId: string;
  orderNumber: string;
  origin: string;
  destination: string;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
  status: string;
}

export interface CustomsDeclaration {
  declarationNumber: string;
  productIds: string[];
  origin: string;
  destination: string;
  value: number;
  currency: string;
  hsCode: string;
  status: string;
}

class EnterpriseIntegrationService {
  private sapClient: AxiosInstance;
  private oracleClient: AxiosInstance;
  private customsClient: AxiosInstance;

  constructor() {
    // SAP client setup
    this.sapClient = axios.create({
      baseURL: config.enterprise.sap.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.enterprise.sap.apiKey}`,
      },
    });

    // Oracle client setup
    this.oracleClient = axios.create({
      baseURL: config.enterprise.oracle.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.enterprise.oracle.apiKey}`,
      },
    });

    // Customs client setup
    this.customsClient = axios.create({
      baseURL: config.enterprise.customs.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.enterprise.customs.apiKey,
      },
    });

    this.setupRequestInterceptors();
    this.setupResponseInterceptors();
  }

  private setupRequestInterceptors(): void {
    // SAP request interceptor
    this.sapClient.interceptors.request.use(
      (config) => {
        logger.info(`SAP API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('SAP request error:', error);
        return Promise.reject(error);
      }
    );

    // Oracle request interceptor
    this.oracleClient.interceptors.request.use(
      (config) => {
        logger.info(`Oracle API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Oracle request error:', error);
        return Promise.reject(error);
      }
    );

    // Customs request interceptor
    this.customsClient.interceptors.request.use(
      (config) => {
        logger.info(`Customs API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Customs request error:', error);
        return Promise.reject(error);
      }
    );
  }

  private setupResponseInterceptors(): void {
    // SAP response interceptor
    this.sapClient.interceptors.response.use(
      (response) => {
        logger.info(`SAP API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error(`SAP API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
        return Promise.reject(this.handleAPIError(error, 'SAP'));
      }
    );

    // Oracle response interceptor
    this.oracleClient.interceptors.response.use(
      (response) => {
        logger.info(`Oracle API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error(`Oracle API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
        return Promise.reject(this.handleAPIError(error, 'Oracle'));
      }
    );

    // Customs response interceptor
    this.customsClient.interceptors.response.use(
      (response) => {
        logger.info(`Customs API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error(`Customs API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
        return Promise.reject(this.handleAPIError(error, 'Customs'));
      }
    );
  }

  private handleAPIError(error: any, system: string): Error {
    const status = error.response?.status || 0;
    const message = error.response?.data?.message || error.message || 'Unknown error';

    return new Error(`${system} API Error (${status}): ${message}`);
  }

  /**
   * SAP Integration Methods
   */
  async getSAPProduct(materialNumber: string): Promise<SAPProduct | null> {
    try {
      const cacheKey = `sap:product:${materialNumber}`;
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.sapClient.get(`/products/${materialNumber}`);
      const product: SAPProduct = response.data;

      // Cache for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(product), 3600);

      return product;
    } catch (error) {
      logger.error(`Error fetching SAP product ${materialNumber}:`, error);
      throw error;
    }
  }

  async createSAPProductionOrder(productData: any): Promise<string> {
    try {
      const response = await this.sapClient.post('/production-orders', {
        materialNumber: productData.materialNumber,
        quantity: productData.quantity,
        plantCode: productData.plantCode,
        productionDate: productData.productionDate,
        batchNumber: productData.batchNumber,
      });

      const orderNumber = response.data.orderNumber;
      logger.info(`SAP production order created: ${orderNumber}`);

      return orderNumber;
    } catch (error) {
      logger.error('Error creating SAP production order:', error);
      throw error;
    }
  }

  async updateSAPInventory(materialNumber: string, quantity: number, plantCode: string): Promise<boolean> {
    try {
      await this.sapClient.put(`/inventory/${materialNumber}`, {
        quantity,
        plantCode,
        transactionType: 'GOODS_RECEIPT',
        timestamp: new Date().toISOString(),
      });

      // Invalidate cache
      await redisClient.del(`sap:product:${materialNumber}`);

      logger.info(`SAP inventory updated: ${materialNumber} +${quantity}`);
      return true;
    } catch (error) {
      logger.error(`Error updating SAP inventory for ${materialNumber}:`, error);
      throw error;
    }
  }

  /**
   * Oracle Integration Methods
   */
  async getOracleShipment(shipmentId: string): Promise<OracleShipment | null> {
    try {
      const cacheKey = `oracle:shipment:${shipmentId}`;
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.oracleClient.get(`/shipments/${shipmentId}`);
      const shipment: OracleShipment = response.data;

      // Cache for 30 minutes
      await redisClient.set(cacheKey, JSON.stringify(shipment), 1800);

      return shipment;
    } catch (error) {
      logger.error(`Error fetching Oracle shipment ${shipmentId}:`, error);
      throw error;
    }
  }

  async createOracleShipment(shipmentData: any): Promise<string> {
    try {
      const response = await this.oracleClient.post('/shipments', {
        orderNumber: shipmentData.orderNumber,
        origin: shipmentData.origin,
        destination: shipmentData.destination,
        carrier: shipmentData.carrier,
        items: shipmentData.items,
        scheduledDate: shipmentData.scheduledDate,
      });

      const shipmentId = response.data.shipmentId;
      logger.info(`Oracle shipment created: ${shipmentId}`);

      return shipmentId;
    } catch (error) {
      logger.error('Error creating Oracle shipment:', error);
      throw error;
    }
  }

  async updateOracleShipmentStatus(shipmentId: string, status: string, location?: string): Promise<boolean> {
    try {
      await this.oracleClient.patch(`/shipments/${shipmentId}/status`, {
        status,
        location,
        timestamp: new Date().toISOString(),
      });

      // Invalidate cache
      await redisClient.del(`oracle:shipment:${shipmentId}`);

      logger.info(`Oracle shipment status updated: ${shipmentId} -> ${status}`);
      return true;
    } catch (error) {
      logger.error(`Error updating Oracle shipment status for ${shipmentId}:`, error);
      throw error;
    }
  }

  /**
   * Customs Integration Methods
   */
  async getCustomsDeclaration(declarationNumber: string): Promise<CustomsDeclaration | null> {
    try {
      const cacheKey = `customs:declaration:${declarationNumber}`;
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.customsClient.get(`/declarations/${declarationNumber}`);
      const declaration: CustomsDeclaration = response.data;

      // Cache for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(declaration), 3600);

      return declaration;
    } catch (error) {
      logger.error(`Error fetching customs declaration ${declarationNumber}:`, error);
      throw error;
    }
  }

  async createCustomsDeclaration(declarationData: any): Promise<string> {
    try {
      const response = await this.customsClient.post('/declarations', {
        productIds: declarationData.productIds,
        origin: declarationData.origin,
        destination: declarationData.destination,
        value: declarationData.value,
        currency: declarationData.currency,
        hsCode: declarationData.hsCode,
        exporter: declarationData.exporter,
        importer: declarationData.importer,
        documents: declarationData.documents,
      });

      const declarationNumber = response.data.declarationNumber;
      logger.info(`Customs declaration created: ${declarationNumber}`);

      return declarationNumber;
    } catch (error) {
      logger.error('Error creating customs declaration:', error);
      throw error;
    }
  }

  async updateCustomsStatus(declarationNumber: string, status: string): Promise<boolean> {
    try {
      await this.customsClient.patch(`/declarations/${declarationNumber}/status`, {
        status,
        timestamp: new Date().toISOString(),
      });

      // Invalidate cache
      await redisClient.del(`customs:declaration:${declarationNumber}`);

      logger.info(`Customs declaration status updated: ${declarationNumber} -> ${status}`);
      return true;
    } catch (error) {
      logger.error(`Error updating customs status for ${declarationNumber}:`, error);
      throw error;
    }
  }

  /**
   * Sync operations for data consistency
   */
  async syncProductData(productId: string): Promise<any> {
    try {
      logger.info(`Syncing product data for ${productId}`);

      // Fetch data from all systems
      const [sapProduct, oracleShipments, customsDeclarations] = await Promise.allSettled([
        this.getSAPProduct(productId),
        this.getRelatedShipments(productId),
        this.getRelatedCustomsDeclarations(productId),
      ]);

      const syncData = {
        productId,
        sap: sapProduct.status === 'fulfilled' ? sapProduct.value : null,
        oracle: oracleShipments.status === 'fulfilled' ? oracleShipments.value : [],
        customs: customsDeclarations.status === 'fulfilled' ? customsDeclarations.value : [],
        lastSync: new Date().toISOString(),
      };

      // Cache consolidated data
      await redisClient.set(
        `sync:product:${productId}`,
        JSON.stringify(syncData),
        3600 // 1 hour
      );

      return syncData;
    } catch (error) {
      logger.error(`Error syncing product data for ${productId}:`, error);
      throw error;
    }
  }

  private async getRelatedShipments(productId: string): Promise<OracleShipment[]> {
    try {
      const response = await this.oracleClient.get(`/shipments?productId=${productId}`);
      return response.data.shipments || [];
    } catch (error) {
      logger.warn(`No shipments found for product ${productId}`);
      return [];
    }
  }

  private async getRelatedCustomsDeclarations(productId: string): Promise<CustomsDeclaration[]> {
    try {
      const response = await this.customsClient.get(`/declarations?productId=${productId}`);
      return response.data.declarations || [];
    } catch (error) {
      logger.warn(`No customs declarations found for product ${productId}`);
      return [];
    }
  }

  /**
   * Health checks for enterprise systems
   */
  async healthCheck(): Promise<{ sap: boolean; oracle: boolean; customs: boolean }> {
    const results = {
      sap: false,
      oracle: false,
      customs: false,
    };

    try {
      await this.sapClient.get('/health');
      results.sap = true;
    } catch (error) {
      logger.error('SAP health check failed:', error);
    }

    try {
      await this.oracleClient.get('/health');
      results.oracle = true;
    } catch (error) {
      logger.error('Oracle health check failed:', error);
    }

    try {
      await this.customsClient.get('/health');
      results.customs = true;
    } catch (error) {
      logger.error('Customs health check failed:', error);
    }

    return results;
  }
}

export const enterpriseIntegrationService = new EnterpriseIntegrationService();
export default enterpriseIntegrationService;