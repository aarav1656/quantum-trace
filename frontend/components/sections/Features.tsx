'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheckIcon,
  EyeIcon,
  BoltIcon,
  GlobeAltIcon,
  ChartBarIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    icon: ShieldCheckIcon,
    title: 'Immutable Records',
    description: 'Every transaction is permanently recorded on IOTA Tangle, ensuring complete data integrity and preventing tampering.',
    color: 'blue'
  },
  {
    icon: EyeIcon,
    title: 'Real-time Tracking',
    description: 'Monitor your products throughout the entire supply chain journey with live updates and location tracking.',
    color: 'green'
  },
  {
    icon: BoltIcon,
    title: 'Zero-Fee Transactions',
    description: 'Leverage IOTA\'s feeless architecture for cost-effective supply chain management at scale.',
    color: 'yellow'
  },
  {
    icon: GlobeAltIcon,
    title: 'Global Compliance',
    description: 'Meet international standards with automated compliance checking and regulatory reporting.',
    color: 'purple'
  },
  {
    icon: ChartBarIcon,
    title: 'Advanced Analytics',
    description: 'Gain insights with powerful analytics and AI-driven predictions for supply chain optimization.',
    color: 'cyan'
  },
  {
    icon: LockClosedIcon,
    title: 'Enterprise Security',
    description: 'Bank-grade security with end-to-end encryption and secure digital identity management.',
    color: 'red'
  }
]

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  purple: 'bg-purple-100 text-purple-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  red: 'bg-red-100 text-red-600'
}

export const Features = () => {
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
          Revolutionize Your Supply Chain
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-600 max-w-3xl mx-auto"
        >
          Harness the power of IOTA's distributed ledger technology to create a transparent,
          secure, and efficient supply chain ecosystem.
        </motion.p>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => {
          const IconComponent = feature.icon
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${colorClasses[feature.color as keyof typeof colorClasses]}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* CTA section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-16"
      >
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of companies already using our platform
          </p>
          <button className="btn-primary">
            Start Your Free Trial
          </button>
        </div>
      </motion.div>
    </div>
  )
}