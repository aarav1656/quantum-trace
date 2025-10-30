import { useState, useEffect, useCallback } from 'react';
import { getProducts, getShipments, Product, Shipment } from '@/lib/api/products';

export interface SupplyChainHook {
  products: Product[];
  shipments: Shipment[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  initializeConnection: () => void;
  refetch: () => void;
  refetchProducts: () => void;
  refetchShipments: () => void;
}

export const useSupplyChain = (): SupplyChainHook => {
  const [products, setProducts] = useState<Product[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  const refetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getProducts();
      setProducts(response.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetchShipments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getShipments();
      setShipments(response.shipments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shipments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    refetchProducts();
    refetchShipments();
  }, [refetchProducts, refetchShipments]);

  const initializeConnection = useCallback(() => {
    setConnectionStatus('connecting');
    setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus('connected');
    }, 1000);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    products,
    shipments,
    isLoading,
    error,
    isConnected,
    connectionStatus,
    initializeConnection,
    refetch,
    refetchProducts,
    refetchShipments,
  };
};