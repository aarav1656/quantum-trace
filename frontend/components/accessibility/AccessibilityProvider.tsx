'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AccessibilitySettings {
  highContrast: boolean
  reducedMotion: boolean
  fontSize: 'small' | 'normal' | 'large' | 'extra-large'
  screenReader: boolean
  focusVisible: boolean
  colorBlindFriendly: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSettings: (updates: Partial<AccessibilitySettings>) => void
  announceToScreenReader: (message: string) => void
  isAccessibilityMenuOpen: boolean
  toggleAccessibilityMenu: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    reducedMotion: false,
    fontSize: 'normal',
    screenReader: false,
    focusVisible: true,
    colorBlindFriendly: false,
  })

  const [isAccessibilityMenuOpen, setIsAccessibilityMenuOpen] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accessibility-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings({ ...settings, ...parsed })
      } catch (error) {
        console.error('Failed to parse accessibility settings:', error)
      }
    }

    // Detect user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches

    if (prefersReducedMotion || prefersHighContrast) {
      setSettings(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
      }))
    }
  }, [])

  // Apply settings to DOM
  useEffect(() => {
    const root = document.documentElement

    // Font size
    const fontSizeMap = {
      small: '14px',
      normal: '16px',
      large: '18px',
      'extra-large': '20px',
    }
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize])

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // Color blind friendly
    if (settings.colorBlindFriendly) {
      root.classList.add('color-blind-friendly')
    } else {
      root.classList.remove('color-blind-friendly')
    }

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add('focus-visible')
    } else {
      root.classList.remove('focus-visible')
    }

    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))
  }, [settings])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + A: Open accessibility menu
      if (event.altKey && event.key === 'a') {
        event.preventDefault()
        setIsAccessibilityMenuOpen(prev => !prev)
      }

      // Alt + H: Toggle high contrast
      if (event.altKey && event.key === 'h') {
        event.preventDefault()
        updateSettings({ highContrast: !settings.highContrast })
      }

      // Alt + R: Toggle reduced motion
      if (event.altKey && event.key === 'r') {
        event.preventDefault()
        updateSettings({ reducedMotion: !settings.reducedMotion })
      }

      // Alt + Plus: Increase font size
      if (event.altKey && event.key === '=') {
        event.preventDefault()
        const sizes: AccessibilitySettings['fontSize'][] = ['small', 'normal', 'large', 'extra-large']
        const currentIndex = sizes.indexOf(settings.fontSize)
        const nextIndex = Math.min(currentIndex + 1, sizes.length - 1)
        updateSettings({ fontSize: sizes[nextIndex] })
      }

      // Alt + Minus: Decrease font size
      if (event.altKey && event.key === '-') {
        event.preventDefault()
        const sizes: AccessibilitySettings['fontSize'][] = ['small', 'normal', 'large', 'extra-large']
        const currentIndex = sizes.indexOf(settings.fontSize)
        const nextIndex = Math.max(currentIndex - 1, 0)
        updateSettings({ fontSize: sizes[nextIndex] })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settings])

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  const toggleAccessibilityMenu = () => {
    setIsAccessibilityMenuOpen(prev => !prev)
  }

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        announceToScreenReader,
        isAccessibilityMenuOpen,
        toggleAccessibilityMenu,
      }}
    >
      {children}

      {/* Accessibility Menu */}
      <AnimatePresence>
        {isAccessibilityMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: settings.reducedMotion ? 0 : 0.2 }}
            className="fixed top-4 right-4 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-80"
            role="dialog"
            aria-labelledby="accessibility-menu-title"
            aria-describedby="accessibility-menu-description"
          >
            <div className="mb-4">
              <h2 id="accessibility-menu-title" className="text-lg font-semibold text-gray-900">
                Accessibility Settings
              </h2>
              <p id="accessibility-menu-description" className="text-sm text-gray-600 mt-1">
                Customize your viewing experience
              </p>
            </div>

            <div className="space-y-4">
              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <select
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: e.target.value as AccessibilitySettings['fontSize'] })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="small">Small</option>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  High Contrast
                </label>
                <button
                  onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.highContrast ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={settings.highContrast}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Reduce Motion
                </label>
                <button
                  onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={settings.reducedMotion}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Color Blind Friendly */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Color Blind Friendly
                </label>
                <button
                  onClick={() => updateSettings({ colorBlindFriendly: !settings.colorBlindFriendly })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.colorBlindFriendly ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={settings.colorBlindFriendly}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.colorBlindFriendly ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Focus Indicators */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Enhanced Focus
                </label>
                <button
                  onClick={() => updateSettings({ focusVisible: !settings.focusVisible })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.focusVisible ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={settings.focusVisible}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.focusVisible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Keyboard shortcuts info */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Keyboard Shortcuts
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Alt + A: Toggle this menu</div>
                <div>Alt + H: Toggle high contrast</div>
                <div>Alt + R: Toggle reduced motion</div>
                <div>Alt + Plus/Minus: Font size</div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={toggleAccessibilityMenu}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close accessibility menu"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>
    </AccessibilityContext.Provider>
  )
}