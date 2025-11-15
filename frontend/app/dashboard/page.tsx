'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import {
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { CubeIcon as PackageIcon } from '@heroicons/react/24/outline'
import { ProductCard } from '@/components/dashboard/ProductCard'
import { TrackingTimeline } from '@/components/dashboard/TrackingTimeline'
import { MetricsOverview } from '@/components/dashboard/MetricsOverview'
import { LiveUpdates } from '@/components/dashboard/LiveUpdates'
import { QRScanner } from '@/components/scanner/QRScanner'
import { useSupplyChain } from '@/hooks/useSupplyChain'
import { useWebSocket } from '@/hooks/useWebSocket'
import { searchProducts, getShipments, Product } from '@/lib/api/products'

// Dynamic import for map component to avoid SSR issues
const SupplyChainMap = dynamic(
  () => import('@/components/dashboard/SupplyChainMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    ),
  }
)


export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [mapCenter, setMapCenter] = useState([51.505, -0.09])

  const { isConnected } = useSupplyChain()
  const { lastMessage } = useWebSocket()

  // Fetch products with real-time updates
  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => searchProducts(searchTerm),
    enabled: isConnected,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch shipments for map
  const { data: shipments } = useQuery({
    queryKey: ['shipments'],
    queryFn: getShipments,
    enabled: isConnected,
    refetchInterval: 15000, // More frequent updates for active shipments
  })

  // Handle real-time WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data)
      if (data.type === 'PRODUCT_UPDATE' || data.type === 'SHIPMENT_UPDATE') {
        refetchProducts()
      }
    }
  }, [lastMessage, refetchProducts])

  const handleQRScan = (result: string) => {
    setSearchTerm(result)
    setShowQRScanner(false)
    refetchProducts()
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'in_transit':
        return <TruckIcon className="h-5 w-5 text-blue-500" />
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl"
                >
                  Supply Chain Dashboard
                </motion.h1>
                <p className="mt-1 text-sm text-gray-500">
                  Real-time tracking and monitoring across your entire supply chain
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="btn-primary"
                >
                  <PackageIcon className="h-5 w-5 mr-2" />
                  Scan Product
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-6">
              <div className="max-w-lg">
                <label htmlFor="search" className="sr-only">
                  Search products
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-10"
                    placeholder="Search by product ID, batch number, or name..."
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <PackageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Metrics & Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Metrics Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <MetricsOverview />
            </motion.div>

            {/* Map View */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Live Shipment Tracking
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Updates</span>
                </div>
              </div>

              <SupplyChainMap
                shipments={shipments}
                mapCenter={mapCenter as [number, number]}
              />
            </motion.div>

            {/* Product Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {searchTerm ? `Search Results for "${searchTerm}"` : 'Recent Products'}
              </h3>

              {(products?.products?.length ?? 0) > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products?.products?.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <ProductCard
                        product={product}
                        onClick={() => setSelectedProduct(product)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <PackageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No products found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try searching with a different term or scan a QR code.
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Timeline & Updates */}
          <div className="space-y-6">
            {/* Live Updates */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <LiveUpdates />
            </motion.div>

            {/* Product Timeline */}
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TrackingTimeline product={selectedProduct} />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  )
}