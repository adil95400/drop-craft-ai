/**
 * Optimiseur global mobile
 * Détection et adaptation UX pour tous les appareils
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouch: boolean
  screenWidth: number
  screenHeight: number
  orientation: 'portrait' | 'landscape'
  pixelRatio: number
  platform: 'ios' | 'android' | 'web'
  safeAreaInsets: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

interface MobileContextValue {
  device: DeviceInfo
  isCompact: boolean
  isExpandedNav: boolean
  toggleNav: () => void
  getResponsiveValue: <T>(mobile: T, tablet: T, desktop: T) => T
  touchFeedback: (callback: () => void) => () => void
}

const MobileContext = createContext<MobileContextValue | null>(null)

export function useMobileOptimizer() {
  const context = useContext(MobileContext)
  if (!context) {
    throw new Error('useMobileOptimizer must be used within MobileGlobalOptimizer')
  }
  return context
}

interface MobileGlobalOptimizerProps {
  children: ReactNode
}

export function MobileGlobalOptimizer({ children }: MobileGlobalOptimizerProps) {
  const [device, setDevice] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouch: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,
    orientation: 'landscape',
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    platform: 'web',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }
  })
  const [isExpandedNav, setIsExpandedNav] = useState(false)

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Detect platform
      const userAgent = navigator.userAgent.toLowerCase()
      let platform: 'ios' | 'android' | 'web' = 'web'
      if (/iphone|ipad|ipod/.test(userAgent)) platform = 'ios'
      else if (/android/.test(userAgent)) platform = 'android'

      // Detect safe area (for notched devices)
      const computedStyle = getComputedStyle(document.documentElement)
      const safeAreaInsets = {
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0') || 0,
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0') || 0,
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0') || 0,
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0') || 0
      }

      setDevice({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isTouch,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
        pixelRatio: window.devicePixelRatio,
        platform,
        safeAreaInsets
      })
    }

    detectDevice()
    window.addEventListener('resize', detectDevice)
    window.addEventListener('orientationchange', detectDevice)

    // Set CSS variables for safe areas
    document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)')
    document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)')
    document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)')
    document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)')

    return () => {
      window.removeEventListener('resize', detectDevice)
      window.removeEventListener('orientationchange', detectDevice)
    }
  }, [])

  const getResponsiveValue = <T,>(mobile: T, tablet: T, desktop: T): T => {
    if (device.isMobile) return mobile
    if (device.isTablet) return tablet
    return desktop
  }

  const touchFeedback = (callback: () => void) => {
    return () => {
      if (device.isTouch && navigator.vibrate) {
        navigator.vibrate(10) // Subtle haptic feedback
      }
      callback()
    }
  }

  const value: MobileContextValue = {
    device,
    isCompact: device.isMobile,
    isExpandedNav,
    toggleNav: () => setIsExpandedNav(prev => !prev),
    getResponsiveValue,
    touchFeedback
  }

  return (
    <MobileContext.Provider value={value}>
      <div 
        className="min-h-screen"
        style={{
          paddingTop: device.safeAreaInsets.top,
          paddingBottom: device.safeAreaInsets.bottom,
          paddingLeft: device.safeAreaInsets.left,
          paddingRight: device.safeAreaInsets.right
        }}
      >
        {children}
      </div>
    </MobileContext.Provider>
  )
}

// Responsive wrapper component
interface ResponsiveWrapperProps {
  children: ReactNode
  mobile?: ReactNode
  tablet?: ReactNode
  desktop?: ReactNode
}

export function ResponsiveWrapper({ 
  children, 
  mobile, 
  tablet, 
  desktop 
}: ResponsiveWrapperProps) {
  const { device } = useMobileOptimizer()

  if (device.isMobile && mobile) return <>{mobile}</>
  if (device.isTablet && tablet) return <>{tablet}</>
  if (device.isDesktop && desktop) return <>{desktop}</>
  
  return <>{children}</>
}

// Touch-optimized button wrapper
interface TouchButtonProps {
  children: ReactNode
  onClick: () => void
  className?: string
}

export function TouchButton({ children, onClick, className }: TouchButtonProps) {
  const { touchFeedback, device } = useMobileOptimizer()

  return (
    <button
      onClick={touchFeedback(onClick)}
      className={`
        ${className || ''}
        ${device.isTouch ? 'active:scale-95 transition-transform' : ''}
        ${device.isMobile ? 'min-h-[44px] min-w-[44px]' : ''}
      `}
    >
      {children}
    </button>
  )
}

// Swipe detector hook
export function useSwipeDetector(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void
) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }

    const diffX = touchStart.x - touchEnd.x
    const diffY = touchStart.y - touchEnd.y
    const threshold = 50

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > threshold) onSwipeLeft?.()
      else if (diffX < -threshold) onSwipeRight?.()
    } else {
      // Vertical swipe
      if (diffY > threshold) onSwipeUp?.()
      else if (diffY < -threshold) onSwipeDown?.()
    }

    setTouchStart(null)
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  }
}
