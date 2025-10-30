'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  TruckIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

const stats = [
  {
    icon: TruckIcon,
    value: '2.5M+',
    label: 'Shipments Tracked',
    description: 'Products monitored across global supply chains',
    color: 'blue'
  },
  {
    icon: ClockIcon,
    value: '99.9%',
    label: 'On-Time Delivery',
    description: 'Average delivery performance rate',
    color: 'green'
  },
  {
    icon: ShieldCheckIcon,
    value: '100%',
    label: 'Data Integrity',
    description: 'Immutable records with zero tampering',
    color: 'purple'
  },
  {
    icon: CurrencyDollarIcon,
    value: '$50M+',
    label: 'Cost Savings',
    description: 'Total savings achieved by our clients',
    color: 'cyan'
  }
]

const colorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  cyan: 'text-cyan-600'
}

export const Stats = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section header */}
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
        >
          Trusted by Industry Leaders
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-600 max-w-3xl mx-auto"
        >
          Our platform delivers measurable results across all key supply chain metrics
        </motion.p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <IconComponent className={`w-8 h-8 ${colorClasses[stat.color as keyof typeof colorClasses]}`} />
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                {stat.value}
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {stat.label}
              </h3>
              <p className="text-sm text-gray-600">
                {stat.description}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Company logos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-20 text-center"
      >
        <p className="text-sm text-gray-500 mb-8">
          Trusted by leading companies worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
          {/* Placeholder for company logos */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-32 h-16 bg-gray-200 rounded-lg flex items-center justify-center"
            >
              <span className="text-gray-400 font-medium">Company {i}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}