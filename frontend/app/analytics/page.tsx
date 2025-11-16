'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GlobeAltIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { getAnalytics, getKPIs, getSupplyChainMetrics } from '@/lib/api/analytics'
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard'
import { MetricCard } from '@/components/analytics/MetricCard'
import { GlobalMap } from '@/components/analytics/GlobalMap'
import { TimeRangeSelector } from '@/components/analytics/TimeRangeSelector'
import { ExportOptions } from '@/components/analytics/ExportOptions'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d') // 7d, 30d, 90d, 1y
  const [selectedMetrics, setSelectedMetrics] = useState(['all'])
  const [showExport, setShowExport] = useState(false)

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: () => getAnalytics(timeRange),
    refetchInterval: 60000, // Refresh every minute
  })

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis', timeRange],
    queryFn: () => getKPIs(timeRange),
    refetchInterval: 30000,
  })

  const { data: supplyChainMetrics } = useQuery({
    queryKey: ['supply-chain-metrics', timeRange],
    queryFn: () => getSupplyChainMetrics(timeRange),
    refetchInterval: 60000,
  })

  // Chart configurations
  const shipmentVolumeData = {
    labels: analytics?.shipmentVolume?.labels || [],
    datasets: [
      {
        label: 'Shipments',
        data: analytics?.shipmentVolume?.data || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const deliveryPerformanceData = {
    labels: analytics?.deliveryPerformance?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'On-Time Deliveries',
        data: analytics?.deliveryPerformance?.onTime || [95, 87, 92, 89, 94, 91],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
      {
        label: 'Late Deliveries',
        data: analytics?.deliveryPerformance?.late || [4, 10, 6, 8, 5, 7],
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
      },
      {
        label: 'Failed Deliveries',
        data: analytics?.deliveryPerformance?.failed || [1, 3, 2, 3, 1, 2],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  }

  const regionalDistributionData = {
    labels: supplyChainMetrics?.regional?.labels || [],
    datasets: [
      {
        data: supplyChainMetrics?.regional?.data || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3"
                >
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                      Supply Chain Analytics
                    </h1>
                    <p className="text-sm text-gray-500">
                      Real-time insights and performance metrics for your supply chain
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                <TimeRangeSelector
                  value={timeRange}
                  onChange={setTimeRange}
                />
                <button
                  onClick={() => setShowExport(true)}
                  className="btn-outline flex items-center space-x-2"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {kpisLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))
          ) : (
            kpis?.map((kpi, index) => (
              <motion.div
                key={kpi.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <MetricCard
                  title={kpi.title}
                  value={kpi.value}
                  change={kpi.change}
                  trend={kpi.trend}
                  icon={kpi.icon}
                  color={kpi.color}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Shipment Volume Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Shipment Volume Over Time
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Real-time data</span>
              </div>
            </div>
            <div className="chart-container">
              {analyticsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Line data={shipmentVolumeData} options={chartOptions} />
              )}
            </div>
          </motion.div>

          {/* Delivery Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Delivery Performance
              </h3>
              <div className="text-sm text-gray-500">
                Last {timeRange}
              </div>
            </div>
            <div className="chart-container">
              {analyticsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Bar data={deliveryPerformanceData} options={chartOptions} />
              )}
            </div>
          </motion.div>
        </div>

        {/* Secondary Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Regional Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Regional Distribution
            </h3>
            <div style={{ height: '300px' }}>
              <Doughnut data={regionalDistributionData} options={pieOptions} />
            </div>
          </motion.div>

          {/* Status Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Current Status Overview
            </h3>
            <div className="space-y-4">
              {[
                { label: 'In Transit', value: 1247, color: 'bg-blue-500', icon: TruckIcon },
                { label: 'Delivered', value: 3892, color: 'bg-green-500', icon: CheckCircleIcon },
                { label: 'Pending', value: 156, color: 'bg-yellow-500', icon: ClockIcon },
                { label: 'Issues', value: 23, color: 'bg-red-500', icon: ExclamationTriangleIcon },
              ].map((status) => {
                const Icon = status.icon
                return (
                  <div key={status.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {status.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {status.value.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Recent Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Recent Alerts
            </h3>
            <div className="space-y-3">
              {[
                {
                  type: 'warning',
                  message: 'Delayed shipment: SH-2023-001',
                  time: '2 hours ago',
                },
                {
                  type: 'error',
                  message: 'Temperature breach: Cold chain violated',
                  time: '4 hours ago',
                },
                {
                  type: 'info',
                  message: 'New batch processed: BT-2023-445',
                  time: '6 hours ago',
                },
                {
                  type: 'success',
                  message: 'Quality check passed: QC-2023-112',
                  time: '8 hours ago',
                },
              ].map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'warning'
                      ? 'border-yellow-400 bg-yellow-50'
                      : alert.type === 'error'
                      ? 'border-red-400 bg-red-50'
                      : alert.type === 'success'
                      ? 'border-green-400 bg-green-50'
                      : 'border-blue-400 bg-blue-50'
                  }`}
                >
                  <p className="text-sm text-gray-900 mb-1">{alert.message}</p>
                  <p className="text-xs text-gray-500">{alert.time}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Global Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Global Supply Chain Network
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Active Routes</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Distribution Centers</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Alerts</span>
              </div>
            </div>
          </div>
          <div className="h-96">
            <GlobalMap
              shipments={supplyChainMetrics?.globalRoutes || []}
              centers={supplyChainMetrics?.distributionCenters || []}
              alerts={supplyChainMetrics?.alerts || []}
            />
          </div>
        </motion.div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <ExportOptions
          onClose={() => setShowExport(false)}
          data={{
            kpis,
            analytics,
            supplyChainMetrics,
            timeRange,
          }}
        />
      )}
    </div>
  )
}