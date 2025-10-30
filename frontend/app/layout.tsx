import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Navigation } from '@/components/navigation/Navigation'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'IOTA Supply Chain Tracker',
  description: 'Real-time product tracking and verification on IOTA DLT',
  manifest: '/manifest.json',
  themeColor: '#1e40af',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <Providers>
          <div className="min-h-full flex flex-col">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981',
                    color: '#fff',
                  },
                },
              }}
            />
          </div>
        </Providers>
      </body>
    </html>
  )
}