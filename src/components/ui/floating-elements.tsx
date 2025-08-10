import { useEffect, useState } from 'react'
import { cn } from "@/lib/utils"

interface FloatingElementProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function FloatingElement({ children, delay = 0, className }: FloatingElementProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={cn(
        "transition-all duration-700 transform",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        "animate-float",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

interface StaggeredGridProps {
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
}

export function StaggeredGrid({ children, className, staggerDelay = 100 }: StaggeredGridProps) {
  return (
    <div className={cn("grid gap-6", className)}>
      {children.map((child, index) => (
        <FloatingElement key={index} delay={index * staggerDelay}>
          {child}
        </FloatingElement>
      ))}
    </div>
  )
}

interface AnimatedBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  pulse?: boolean
  className?: string
}

export function AnimatedBadge({ 
  children, 
  variant = 'default', 
  pulse = false, 
  className 
}: AnimatedBadgeProps) {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-green-500/10 text-green-500 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    error: "bg-red-500/10 text-red-500 border-red-500/20",
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  }

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-300",
        variants[variant],
        pulse && "animate-pulse",
        "hover:scale-105 hover:shadow-glow",
        className
      )}
    >
      {children}
    </span>
  )
}

interface GlowingIconProps {
  icon: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'error'
  className?: string
}

export function GlowingIcon({ 
  icon, 
  size = 'md', 
  color = 'primary', 
  className 
}: GlowingIconProps) {
  const sizes = {
    sm: "w-8 h-8 p-1.5",
    md: "w-12 h-12 p-2.5",
    lg: "w-16 h-16 p-3.5"
  }

  const colors = {
    primary: "bg-primary/10 text-primary shadow-primary/30",
    accent: "bg-accent/10 text-accent shadow-accent/30",
    success: "bg-green-500/10 text-green-500 shadow-green-500/30",
    warning: "bg-yellow-500/10 text-yellow-500 shadow-yellow-500/30",
    error: "bg-red-500/10 text-red-500 shadow-red-500/30"
  }

  return (
    <div 
      className={cn(
        "rounded-lg flex items-center justify-center transition-all duration-300",
        "hover:scale-110 hover:shadow-glow animate-pulse-glow",
        sizes[size],
        colors[color],
        className
      )}
    >
      {icon}
    </div>
  )
}

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  children?: React.ReactNode
}

export function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8, 
  className,
  children 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 transition-all duration-1000"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-in-out"
          style={{
            filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.6))"
          }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}