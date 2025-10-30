// Analytics API with proper TypeScript types
export interface KPI {
  id: string;
  name: string;
  title: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
}

export interface SupplyChainMetrics {
  shipmentVolume: {
    labels: string[];
    data: Array<{ date: string; value: number }>;
  };
  deliveryPerformance: {
    labels: string[];
    onTime: number;
    delayed: number;
    late: number[];
    failed: number[];
    average: number;
    trend: number;
  };
  regional: {
    labels: string[];
    data: number[];
  };
  globalRoutes: number;
  distributionCenters: number;
  alerts: number;
}

// Analytics API functions
export const getAnalyticsData = async () => ({ data: [] });
export const getAnalytics = async (timeRange?: string): Promise<SupplyChainMetrics> => {
  return {
    shipmentVolume: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [
        { date: '2024-01', value: 120 },
        { date: '2024-02', value: 145 },
        { date: '2024-03', value: 167 },
        { date: '2024-04', value: 189 },
        { date: '2024-05', value: 203 },
        { date: '2024-06', value: 221 }
      ]
    },
    deliveryPerformance: {
      onTime: 94.2,
      delayed: 5.8,
      average: 3.2,
      trend: 2.1
    }
  };
};
export const getMetrics = async (timeRange?: string) => ({ metrics: {} });

// Missing exports that components expect
export const getKPIs = async (timeRange?: string): Promise<KPI[]> => {
  return [
    {
      id: 'total-shipments',
      name: 'Total Shipments',
      title: 'Total Shipments',
      value: 1234,
      change: 12.5,
      trend: 'up',
      icon: 'truck',
      color: 'blue'
    },
    {
      id: 'on-time-delivery',
      name: 'On-Time Delivery',
      title: 'On-Time Delivery',
      value: '94.2%',
      change: -2.1,
      trend: 'down',
      icon: 'clock',
      color: 'green'
    },
    {
      id: 'average-transit',
      name: 'Average Transit',
      title: 'Average Transit Time',
      value: '3.2 days',
      change: 0.5,
      trend: 'up',
      icon: 'clock',
      color: 'yellow'
    },
    {
      id: 'cost-per-shipment',
      name: 'Cost per Shipment',
      title: 'Cost per Shipment',
      value: '$145',
      change: -5.2,
      trend: 'down',
      icon: 'dollar',
      color: 'red'
    }
  ];
};

export const getSupplyChainMetrics = async (timeRange?: string): Promise<SupplyChainMetrics> => {
  return {
    shipmentVolume: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [
        { date: '2024-01', value: 120 },
        { date: '2024-02', value: 145 },
        { date: '2024-03', value: 167 },
        { date: '2024-04', value: 189 },
        { date: '2024-05', value: 203 },
        { date: '2024-06', value: 221 }
      ]
    },
    deliveryPerformance: {
      labels: ['On-Time', 'Delayed', 'Average'],
      onTime: 94.2,
      delayed: 5.8,
      late: [12, 8, 15, 6, 9, 4],
      failed: [2, 1, 3, 0, 1, 0],
      average: 3.2,
      trend: 2.1
    },
    regional: {
      labels: ['North America', 'Europe', 'Asia', 'South America'],
      data: [45, 25, 20, 10]
    },
    globalRoutes: 150,
    distributionCenters: 12,
    alerts: 3
  };
};