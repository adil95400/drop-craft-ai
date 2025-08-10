import { useEffect, useState } from 'react'
import { cn } from "@/lib/utils"

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  format?: 'number' | 'currency' | 'percentage'
  currency?: string
  decimals?: number
}

export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  className,
  format = 'number',
  currency = 'EUR',
  decimals = 0
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    const startTime = Date.now()
    const startValue = displayValue
    const endValue = value
    
    const updateCounter = () => {
      const currentTime = Date.now()
      const elapsedTime = currentTime - startTime
      const progress = Math.min(elapsedTime / duration, 1)
      
      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
      const easedProgress = easeOutCubic(progress)
      
      const currentValue = startValue + (endValue - startValue) * easedProgress
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter)
      }
    }
    
    requestAnimationFrame(updateCounter)
  }, [value, duration])

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(val)
      case 'percentage':
        return `${val.toFixed(decimals)}%`
      default:
        return val.toFixed(decimals)
    }
  }

  return (
    <span 
      className={cn(
        "font-bold transition-all duration-300",
        isVisible && "animate-slide-up",
        className
      )}
    >
      {formatValue(displayValue)}
    </span>
  )
}

interface AnimatedStatsCardProps {
  title: string
  value: number
  format?: 'number' | 'currency' | 'percentage'
  currency?: string
  decimals?: number
  icon?: React.ReactNode
  trend?: number
  className?: string
}

export function AnimatedStatsCard({ 
  title, 
  value, 
  format = 'number',
  currency = 'EUR',
  decimals = 0,
  icon,
  trend,
  className 
}: AnimatedStatsCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div 
      className={cn(
        "p-6 rounded-lg border bg-card text-card-foreground shadow-card transition-all duration-500",
        isVisible && "animate-slide-up",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">
            <AnimatedCounter 
              value={value} 
              format={format}
              currency={currency}
              decimals={decimals}
            />
          </p>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {trend > 0 ? "↗" : trend < 0 ? "↘" : "→"} {Math.abs(trend)}%
            </div>
          )}
        </div>
        {icon && (
          <div className="text-primary opacity-80">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}