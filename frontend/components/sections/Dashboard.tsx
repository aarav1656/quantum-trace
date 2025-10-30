'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

const dashboardFeatures = [
  {
    title: 'Real-time Analytics',
    description: 'Monitor key metrics and performance indicators across your entire supply chain.',
    icon: ChartBarIcon,
    color: 'blue',
    metrics: ['1,234 Shipments', '94.2% On-time', '$2.3M Value']
  },
  {
    title: 'Global Tracking',
    description: 'Track products and shipments worldwide with precise location data.',
    icon: MapPinIcon,
    color: 'green',
    metrics: ['50+ Countries', '200+ Warehouses', '24/7 Monitoring']
  },
  {
    title: 'Smart Alerts',
    description: 'Get notified about delays, quality issues, or compliance problems instantly.',
    icon: ExclamationTriangleIcon,
    color: 'yellow',
    metrics: ['3 Active Alerts', '12 Resolved Today', '99.1% Accuracy']
  }
]

const recentActivity = [
  {
    id: 1,
    type: 'shipment',
    title: 'Shipment #SC-2024-001 delivered',
    location: 'New York, NY',
    time: '2 minutes ago',
    status: 'success',
    icon: CheckCircleIcon
  },
  {
    id: 2,
    type: 'tracking',
    title: 'Product batch #PB-4425 in transit',
    location: 'Los Angeles, CA',
    time: '15 minutes ago',
    status: 'info',
    icon: TruckIcon
  },
  {
    id: 3,
    type: 'delay',
    title: 'Shipment #SC-2024-002 delayed',
    location: 'Chicago, IL',
    time: '1 hour ago',
    status: 'warning',
    icon: ClockIcon
  }
]

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600 border-blue-200',
  green: 'bg-green-100 text-green-600 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200'
}

const statusClasses = {
  success: 'text-green-600',
  info: 'text-blue-600',
  warning: 'text-yellow-600'
}

export const Dashboard = () => {
  return (
    <div className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Powerful Dashboard Insights
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-3xl mx-auto"
          >
            Get complete visibility into your supply chain operations with our intuitive dashboard
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column - Dashboard features */}
          <div className="lg:col-span-2">
            <div className="grid gap-6">
              {dashboardFeatures.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[feature.color as keyof typeof colorClasses]}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {feature.description}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {feature.metrics.map((metric, metricIndex) => (
                            <span
                              key={metricIndex}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {metric}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Right column - Recent activity */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-fit"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Recent Activity
              </h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const IconComponent = activity.icon
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`flex-shrink-0 ${statusClasses[activity.status as keyof typeof statusClasses]}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.location} • {activity.time}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Link
                  href="/dashboard"
                  className="block w-full text-center btn-outline"
                >
                  View Full Dashboard
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}