// Products API with proper TypeScript types
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  location: string;
  status: 'in-transit' | 'delivered' | 'pending' | 'delayed';
  timestamp: string;
}

export interface Shipment {
  id: string;
  productId: string;
  origin: string;
  destination: [number, number];
  destinationName: string;
  status: 'in-transit' | 'delivered' | 'pending' | 'delayed';
  estimatedDelivery: string;
  actualDelivery?: string;
  trackingNumber: string;
  route?: [number, number][];
  currentLocation?: [number, number];
  estimatedArrival?: string;
}

// Products API functions
export const getProducts = async (): Promise<{ products: Product[] }> => ({
  products: [
    {
      id: '1',
      name: 'Organic Coffee Beans',
      sku: 'OCB-001',
      category: 'Food & Beverage',
      location: 'Warehouse A',
      status: 'in-transit',
      timestamp: new Date().toISOString()
    }
  ]
});

export const getProductById = async (id: string): Promise<{ product: Product | null }> => ({
  product: {
    id,
    name: 'Sample Product',
    sku: 'SAMPLE-001',
    category: 'General',
    location: 'Unknown',
    status: 'pending',
    timestamp: new Date().toISOString()
  }
});

// Missing exports that components expect
export const searchProducts = async (query: string): Promise<{ products: Product[] }> => {
  const allProducts = await getProducts();
  return {
    products: allProducts.products.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
    )
  };
};

export const getShipments = async (): Promise<{ shipments: Shipment[] }> => {
  return {
    shipments: [
      {
        id: 'SHIP-001',
        productId: '1',
        origin: 'New York, NY',
        destination: [34.0522, -118.2437], // Los Angeles coordinates
        destinationName: 'Los Angeles, CA',
        status: 'in-transit',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        trackingNumber: 'TRK123456789',
        route: [
          [40.7128, -74.0060], // New York
          [39.9612, -82.9988], // Columbus, OH
          [41.8781, -87.6298], // Chicago, IL
          [39.7391, -104.9847], // Denver, CO
          [34.0522, -118.2437] // Los Angeles
        ],
        currentLocation: [39.9612, -82.9988]
      }
    ]
  };
};