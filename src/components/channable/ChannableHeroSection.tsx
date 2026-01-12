/**
 * Hero Section style Channable avec hexagones animés
 */

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChannableHexagons } from './ChannableHexagons'
import { cn } from '@/lib/utils'
import { LucideIcon, ArrowRight, Sparkles } from 'lucide-react'

export interface ChannableHeroSectionProps {
  title: string
  subtitle?: string
  description?: string
  icon?: LucideIcon
  badge?: {
    label: string
    icon?: LucideIcon
    variant?: 'default' | 'secondary' | 'outline' | 'destructive'
  }
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  stats?: {
    label: string
    value: string | number
    icon?: LucideIcon
  }[]
  showHexagons?: boolean
  className?: string
  children?: ReactNode
  variant?: 'default' | 'compact' | 'minimal'
}

export function ChannableHeroSection({
  title,
  subtitle,
  description,
  badge,
  primaryAction,
  secondaryAction,
  stats,
  showHexagons = true,
  className,
  children,
  variant = 'default'
}: ChannableHeroSectionProps) {
  const isCompact = variant === 'compact'
  const isMinimal = variant === 'minimal'

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card/95 to-muted/30",
      isMinimal ? "py-6 px-6" : isCompact ? "py-8 px-6" : "py-12 px-8",
      className
    )}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      
      {/* Hexagones animés */}
      {showHexagons && !isMinimal && <ChannableHexagons />}

      {/* Content */}
      <div className="relative z-10 max-w-2xl">
        {/* Badge */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Badge 
              variant={badge.variant || "secondary"} 
              className="px-3 py-1 bg-primary/10 text-primary border-primary/20"
            >
              {badge.icon ? <badge.icon className="h-3 w-3 mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
              {badge.label}
            </Badge>
          </motion.div>
        )}

        {/* Title & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {subtitle && (
            <p className="text-sm font-medium text-primary mb-2">{subtitle}</p>
          )}
          <h1 className={cn(
            "font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text",
            isMinimal ? "text-2xl" : isCompact ? "text-3xl" : "text-4xl md:text-5xl"
          )}>
            {title}
          </h1>
        </motion.div>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={cn(
              "text-muted-foreground max-w-xl",
              isMinimal ? "mt-2 text-sm" : "mt-4 text-lg"
            )}
          >
            {description}
          </motion.p>
        )}

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-wrap gap-3 mt-6"
          >
            {primaryAction && (
              <Button 
                onClick={primaryAction.onClick}
                className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg shadow-primary/20"
              >
                {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
                {primaryAction.label}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </motion.div>
        )}

        {/* Stats */}
        {stats && stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-border/50"
          >
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-3">
                {stat.icon && (
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Custom children */}
        {children}
      </div>
    </div>
  )
}
