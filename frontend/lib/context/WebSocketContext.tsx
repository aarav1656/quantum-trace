'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { wsManager, WebSocketEvents } from '@/lib/websocket'
import { useSupplyChain } from '@/hooks/useSupplyChain'
import toast from 'react-hot-toast'

interface WebSocketContextType {
  isConnected: boolean
  connectionId: string | undefined
  lastMessage: { event: string; data: any; timestamp: number } | null
  latency: number | null
  connect: () => Promise<void>
  disconnect: () => void
  subscribe: (events: string[]) => void
  unsubscribe: (events: string[]) => void
  ping: () => Promise<number>
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionId, setConnectionId] = useState<string | undefined>()
  const [lastMessage, setLastMessage] = useState<{ event: string; data: any; timestamp: number } | null>(null)
  const [latency, setLatency] = useState<number | null>(null)

  // Subscribe to supply chain updates
  const { refetchProducts, refetchShipments } = useSupplyChain()

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      await wsManager.connect()
      setIsConnected(true)
      setConnectionId(wsManager.connectionId)

      // Subscribe to default events
      wsManager.subscribeToSupplyChain()
      wsManager.subscribeToMetrics()

      toast.success('Connected to real-time updates')
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      setIsConnected(false)
      toast.error('Failed to connect to real-time updates')
    }
  }, [])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    wsManager.disconnect()
    setIsConnected(false)
    setConnectionId(undefined)
    toast('Disconnected from real-time updates')
  }, [])

  // Subscribe to specific events
  const subscribe = useCallback((events: string[]) => {
    events.forEach(event => {
      // Dynamic subscription logic would go here
    })
  }, [])

  // Unsubscribe from events
  const unsubscribe = useCallback((events: string[]) => {
    events.forEach(event => {
      // Dynamic unsubscription logic would go here
    })
  }, [])

  // Ping server
  const ping = useCallback(async () => {
    try {
      const pingLatency = await wsManager.ping()
      setLatency(pingLatency)
      return pingLatency
    } catch (error) {
      console.error('Ping failed:', error)
      throw error
    }
  }, [])

  // Set up event listeners
  useEffect(() => {
    if (!isConnected) return

    // Product updates
    const handleProductUpdate = (data: any) => {
      setLastMessage({ event: 'product:update', data, timestamp: Date.now() })
      refetchProducts?.()
      toast.success(`Product ${data.productId} updated: ${data.status}`)
    }

    // Shipment updates
    const handleShipmentUpdate = (data: any) => {
      setLastMessage({ event: 'shipment:update', data, timestamp: Date.now() })
      refetchShipments?.()
      toast.success(`Shipment ${data.shipmentId} - ${data.status}`)
    }

    // Batch processing
    const handleBatchProcessed = (data: any) => {
      setLastMessage({ event: 'batch:processed', data, timestamp: Date.now() })
      toast.success(`Batch ${data.batchId} processed successfully`)
    }

    // New alerts
    const handleNewAlert = (data: any) => {
      setLastMessage({ event: 'alert:new', data, timestamp: Date.now() })

      const toastOptions = {
        duration: data.severity === 'critical' ? 10000 : 4000,
        style: {
          backgroundColor:
            data.severity === 'critical' ? '#dc2626' :
            data.severity === 'high' ? '#ea580c' :
            data.severity === 'medium' ? '#d97706' : '#059669',
          color: 'white'
        }
      }

      toast(data.message, toastOptions)
    }

    // Credential events
    const handleCredentialIssued = (data: any) => {
      setLastMessage({ event: 'credential:issued', data, timestamp: Date.now() })
      toast.success(`New credential issued: ${data.type}`)
    }

    const handleCredentialVerified = (data: any) => {
      setLastMessage({ event: 'credential:verified', data, timestamp: Date.now() })
      if (data.success) {
        toast.success('Credential verified successfully')
      } else {
        toast.error('Credential verification failed')
      }
    }

    // Identity updates
    const handleIdentityUpdated = (data: any) => {
      setLastMessage({ event: 'identity:updated', data, timestamp: Date.now() })
      toast.success(`Identity updated: ${data.updateType}`)
    }

    // System status
    const handleSystemStatus = (data: any) => {
      setLastMessage({ event: 'system:status', data, timestamp: Date.now() })

      if (data.status === 'offline') {
        toast.error(`${data.component} is offline`)
      } else if (data.status === 'maintenance') {
        toast.error(`${data.component} is under maintenance`)
      }
    }

    // Metrics updates
    const handleMetricsUpdate = (data: any) => {
      setLastMessage({ event: 'metrics:update', data, timestamp: Date.now() })
      // Metrics updates are silent unless there are issues
    }

    // Register event listeners
    wsManager.on('product:update', handleProductUpdate)
    wsManager.on('shipment:update', handleShipmentUpdate)
    wsManager.on('batch:processed', handleBatchProcessed)
    wsManager.on('alert:new', handleNewAlert)
    wsManager.on('credential:issued', handleCredentialIssued)
    wsManager.on('credential:verified', handleCredentialVerified)
    wsManager.on('identity:updated', handleIdentityUpdated)
    wsManager.on('system:status', handleSystemStatus)
    wsManager.on('metrics:update', handleMetricsUpdate)

    // Cleanup
    return () => {
      wsManager.off('product:update', handleProductUpdate)
      wsManager.off('shipment:update', handleShipmentUpdate)
      wsManager.off('batch:processed', handleBatchProcessed)
      wsManager.off('alert:new', handleNewAlert)
      wsManager.off('credential:issued', handleCredentialIssued)
      wsManager.off('credential:verified', handleCredentialVerified)
      wsManager.off('identity:updated', handleIdentityUpdated)
      wsManager.off('system:status', handleSystemStatus)
      wsManager.off('metrics:update', handleMetricsUpdate)
    }
  }, [isConnected, refetchProducts, refetchShipments])

  // Auto-connect on mount
  useEffect(() => {
    connect()

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Periodic latency check
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(async () => {
      try {
        await ping()
      } catch (error) {
        console.warn('Periodic ping failed:', error)
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [isConnected, ping])

  const contextValue: WebSocketContextType = {
    isConnected,
    connectionId,
    lastMessage,
    latency,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    ping,
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}

      {/* Connection status indicator */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isConnected
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <span>
            {isConnected ? 'Live Updates' : 'Offline'}
          </span>
          {latency && (
            <span className="text-gray-500">
              ({latency}ms)
            </span>
          )}
        </div>
      </div>
    </WebSocketContext.Provider>
  )
}