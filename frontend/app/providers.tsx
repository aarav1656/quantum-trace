'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { SupplyChainProvider } from '@/lib/context/SupplyChainContext'
import { WebSocketProvider } from '@/lib/context/WebSocketContext'
import { IOTAProvider } from '@/lib/context/IOTAContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && error.message.includes('4')) {
                return false
              }
              return failureCount < 3
            },
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <IOTAProvider>
        <WebSocketProvider>
          <SupplyChainProvider>
            {children}
          </SupplyChainProvider>
        </WebSocketProvider>
      </IOTAProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}