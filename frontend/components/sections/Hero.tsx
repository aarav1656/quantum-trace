'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon, PlayIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface HeroProps {
  connectionStatus?: 'connected' | 'disconnected' | 'connecting'
}

export const Hero: React.FC<HeroProps> = ({ connectionStatus = 'disconnected' }) => {
  const router = useRouter()

  const handleStartTrial = () => {
    toast.success('Redirecting to trial signup...')
    router.push('/dashboard')
  }

  const handleViewDemo = () => {
    toast.info('Demo feature coming soon!')
  }

  return (
    <div className="relative min-h-[600px] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-white bg-opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white bg-opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto text-center">
        {/* Connection status indicator */}
        {connectionStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-white bg-opacity-10 rounded-full px-4 py-2 mb-8"
          >
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-400'
            }`}></div>
            <span className="text-white text-sm font-medium">
              {connectionStatus === 'connected' ? 'Live Updates Active' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               'Offline Mode'}
            </span>
          </motion.div>
        )}

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
        >
          Ready to Transform Your{' '}
          <span className="text-gradient bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
            Supply Chain?
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed"
        >
          Join leading companies using IOTA DLT for transparent, secure, and efficient supply chain management.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={handleStartTrial}
            className="group bg-white text-blue-700 hover:bg-gray-50 font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center space-x-2"
          >
            <span>Start Free Trial</span>
            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleViewDemo}
            className="group bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-700 font-semibold py-4 px-8 rounded-lg transition-all duration-200 flex items-center space-x-2"
          >
            <PlayIcon className="w-5 h-5" />
            <span>View Demo</span>
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">99.9%</div>
            <div className="text-blue-200 text-sm">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">10M+</div>
            <div className="text-blue-200 text-sm">Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">500+</div>
            <div className="text-blue-200 text-sm">Companies</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}