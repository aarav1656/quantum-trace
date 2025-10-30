'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, DevicePhoneMobileIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface PWAInstallPromptProps {
  onInstall?: () => void
  onDismiss?: () => void
}

export function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)

      // Show prompt after a delay if not already dismissed
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed && !isStandalone) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [isStandalone])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        toast.custom(
          (t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <DevicePhoneMobileIcon className="h-10 w-10 text-blue-500" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Install on iOS
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Tap the share button and select "Add to Home Screen"
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Got it
                </button>
              </div>
            </div>
          ),
          { duration: 8000 }
        )
      }
      return
    }

    try {
      const { outcome } = await deferredPrompt.prompt()

      if (outcome === 'accepted') {
        toast.success('App installed successfully!')
        onInstall?.()
      } else {
        toast('Installation cancelled')
      }
    } catch (error) {
      console.error('Installation error:', error)
      toast.error('Installation failed')
    } finally {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
    onDismiss?.()
  }

  if (isStandalone || !showPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
      >
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Install IOTA Supply Chain
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Get the full app experience with offline access and push notifications.
                </p>

                <div className="flex space-x-2">
                  <button
                    onClick={handleInstall}
                    className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>Install</span>
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}