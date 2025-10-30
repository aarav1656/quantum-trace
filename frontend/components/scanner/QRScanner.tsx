'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CameraIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { BrowserMultiFormatReader } from '@zxing/library'
import toast from 'react-hot-toast'

interface QRScannerProps {
  onScan: (result: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    // Initialize the code reader
    codeReader.current = new BrowserMultiFormatReader()

    // Check camera permissions
    checkCameraPermission()

    return () => {
      stopScanning()
    }
  }, [])

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop()) // Stop immediately after checking
      setHasPermission(true)
    } catch (err) {
      console.error('Camera permission denied:', err)
      setHasPermission(false)
      setError('Camera access is required for QR code scanning')
    }
  }

  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current) return

    setIsScanning(true)
    setError(null)

    try {
      const result = await codeReader.current.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current,
        (result) => {
          if (result) {
            const text = result.getText()
            toast.success('QR Code scanned successfully!')
            onScan(text)
            stopScanning()
          }
        }
      )
    } catch (err) {
      console.error('QR scanning error:', err)
      setError('Failed to start camera. Please check permissions.')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset()
    }
    setIsScanning(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !codeReader.current) return

    try {
      const result = await codeReader.current.decodeFromVideoDevice(undefined, 'video', file as any)
      if (result) {
        const text = result.getText()
        toast.success('QR Code detected in image!')
        onScan(text)
      }
    } catch (err) {
      console.error('File scanning error:', err)
      toast.error('No QR code found in the image')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Scan QR Code
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Point camera at QR code or upload an image
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Scanner Content */}
          <div className="p-6">
            {hasPermission === false ? (
              <div className="text-center py-8">
                <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">
                  Camera Access Required
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Please allow camera access to scan QR codes
                </p>
                <button
                  onClick={checkCameraPermission}
                  className="mt-4 btn-primary"
                >
                  Grant Permission
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Video Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />

                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="qr-viewfinder relative">
                      {/* Scanning animation */}
                      {isScanning && (
                        <motion.div
                          className="absolute inset-0 border-2 border-supply-primary rounded-lg"
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            repeat: Infinity,
                            repeatType: "reverse",
                            duration: 1
                          }}
                        />
                      )}

                      {/* Corner indicators */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <p className="text-white text-sm bg-black bg-opacity-50 rounded-lg px-3 py-2">
                      {isScanning
                        ? 'Position QR code within the frame'
                        : 'Tap "Start Scanning" to begin'}
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-3"
                  >
                    <p className="text-sm text-red-600">{error}</p>
                  </motion.div>
                )}

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={isScanning ? stopScanning : startScanning}
                    disabled={hasPermission === false}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                      isScanning
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'btn-primary'
                    }`}
                  >
                    <CameraIcon className="h-5 w-5" />
                    {isScanning ? 'Stop Scanning' : 'Start Scanning'}
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <PhotoIcon className="h-5 w-5" />
                    Upload Image
                  </button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Tips for better scanning:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Hold camera steady and ensure good lighting</li>
              <li>• Keep QR code flat and within the frame</li>
              <li>• Clean camera lens if image appears blurry</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}