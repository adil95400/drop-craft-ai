/**
 * KPI Animated Value Component
 * Displays values with smooth counting animation and highlight pulse
 */

import { memo, useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface KPIAnimatedValueProps {
  value: number
  previousValue?: number
  format?: 'number' | 'currency' | 'percent'
  currency?: string
  decimals?: number
  className?: string
  highlightOnChange?: boolean
  duration?: number
}

function formatValue(
  value: number,
  format: 'number' | 'currency' | 'percent',
  currency: string,
  decimals: number
): string {
  switch (format) {
    case 'currency':
      return `${value.toLocaleString('fr-FR', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      })} ${currency}`
    case 'percent':
      return `${value.toFixed(decimals)}%`
    default:
      return value.toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
      })
  }
}

export const KPIAnimatedValue = memo(function KPIAnimatedValue({
  value,
  previousValue,
  format = 'number',
  currency = '€',
  decimals = 0,
  className,
  highlightOnChange = true,
  duration = 800
}: KPIAnimatedValueProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevValueRef = useRef(previousValue ?? value)
  
  // Animate value changes
  useEffect(() => {
    if (value === prevValueRef.current) return
    
    const startValue = prevValueRef.current
    const endValue = value
    const startTime = performance.now()
    
    setIsAnimating(true)
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3)
      
      const currentValue = startValue + (endValue - startValue) * eased
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        setIsAnimating(false)
        prevValueRef.current = endValue
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, duration])
  
  const hasChanged = previousValue !== undefined && value !== previousValue
  const isPositiveChange = previousValue !== undefined && value > previousValue
  
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        className={cn(
          'tabular-nums transition-colors duration-300',
          highlightOnChange && isAnimating && 'text-primary',
          className
        )}
        initial={hasChanged ? { scale: 1 } : false}
        animate={
          hasChanged && highlightOnChange
            ? {
                scale: [1, 1.05, 1],
                transition: { duration: 0.3 }
              }
            : {}
        }
      >
        {formatValue(displayValue, format, currency, decimals)}
        
        {/* Highlight pulse effect */}
        {highlightOnChange && isAnimating && (
          <motion.span
            className={cn(
              'absolute inset-0 rounded-md',
              isPositiveChange ? 'bg-emerald-500/20' : 'bg-amber-500/20'
            )}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.span>
    </AnimatePresence>
  )
})

// Change indicator badge
interface KPIChangeIndicatorProps {
  current: number
  previous: number
  format?: 'number' | 'currency' | 'percent'
  showValue?: boolean
  className?: string
}

export const KPIChangeIndicator = memo(function KPIChangeIndicator({
  current,
  previous,
  format = 'number',
  showValue = true,
  className
}: KPIChangeIndicatorProps) {
  if (previous === 0 || current === previous) return null
  
  const change = ((current - previous) / previous) * 100
  const isPositive = change > 0
  
  return (
    <motion.span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded',
        isPositive 
          ? 'bg-emerald-500/10 text-emerald-600' 
          : 'bg-red-500/10 text-red-600',
        className
      )}
      initial={{ opacity: 0, scale: 0.8, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.2 }}
    >
      {isPositive ? '↑' : '↓'}
      {showValue && `${Math.abs(change).toFixed(1)}%`}
    </motion.span>
  )
})
