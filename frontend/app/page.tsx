'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Hero } from '@/components/sections/Hero'
import { Features } from '@/components/sections/Features'
import { Dashboard } from '@/components/sections/Dashboard'
import { Stats } from '@/components/sections/Stats'
import { useSupplyChain } from '@/hooks/useSupplyChain'

export default function HomePage() {
  const { initializeConnection, connectionStatus } = useSupplyChain()

  useEffect(() => {
    initializeConnection()
  }, [initializeConnection])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <Hero connectionStatus={connectionStatus} />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <Features />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Stats />
        </motion.div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Dashboard />
        </motion.div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-8">
              Ready to Transform Your Supply Chain?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join leading companies using IOTA DLT for transparent,
              secure, and efficient supply chain management.
            </p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <button className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
                Start Free Trial
              </button>
              <button className="btn-outline border-white text-white hover:bg-white hover:text-blue-600">
                View Demo
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}