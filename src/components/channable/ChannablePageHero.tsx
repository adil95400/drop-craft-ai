/**
 * Hero Section Channable avec image de fond
 * Design professionnel inspiré de Channable
 */

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LucideIcon, ArrowRight, Sparkles } from 'lucide-react'

// Images par défaut pour chaque catégorie
import heroAnalytics from '@/assets/images/hero-analytics.png'
import heroSchema from '@/assets/images/hero-schema.png'
import heroProducts from '@/assets/images/hero-products.png'
import heroMarketing from '@/assets/images/hero-marketing.png'
import heroOrders from '@/assets/images/hero-orders.png'
import heroAi from '@/assets/images/hero-ai.png'

export type HeroCategory = 'analytics' | 'schema' | 'products' | 'marketing' | 'orders' | 'ai' | 'default'

const categoryImages: Record<HeroCategory, string> = {
  analytics: heroAnalytics,
  schema: heroSchema,
  products: heroProducts,
  marketing: heroMarketing,
  orders: heroOrders,
  ai: heroAi,
  default: heroAnalytics,
}

export interface ChannablePageHeroProps {
  title: string
  subtitle?: string
  description?: string
  icon?: LucideIcon
  category?: HeroCategory
  customImage?: string
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
    trend?: 'up' | 'down' | 'neutral'
    icon?: LucideIcon
  }[]
  className?: string
  children?: ReactNode
  variant?: 'default' | 'compact' | 'large'
  showImage?: boolean
}

export function ChannablePageHero({
  title,
  subtitle,
  description,
  icon: Icon,
  category = 'default',
  customImage,
  badge,
  primaryAction,
  secondaryAction,
  stats,
  className,
  children,
  variant = 'default',
  showImage = true
}: ChannablePageHeroProps) {
  const isCompact = variant === 'compact'
  const isLarge = variant === 'large'
  const heroImage = customImage || categoryImages[category]

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card/95 to-muted/20",
      isCompact ? "min-h-[200px]" : isLarge ? "min-h-[400px]" : "min-h-[280px]",
      className
    )}>
      {/* Image de fond */}
      {showImage && (
        <div className="absolute inset-0 overflow-hidden">
          <motion.img
            src={heroImage}
            alt=""
            className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-20 lg:opacity-40"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 0.4, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
            }}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-transparent" />
        </div>
      )}

      {/* Gradient decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Content */}
      <div className={cn(
        "relative z-10 flex flex-col justify-center",
        isCompact ? "p-6" : isLarge ? "p-10" : "p-8"
      )}>
        <div className="max-w-2xl">
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
                className="px-3 py-1.5 bg-primary/10 text-primary border-primary/20 shadow-sm"
              >
                {badge.icon ? <badge.icon className="h-3 w-3 mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                {badge.label}
              </Badge>
            </motion.div>
          )}

          {/* Icon + Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-start gap-4"
          >
            {Icon && (
              <div className="hidden sm:flex h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                <Icon className="h-7 w-7 text-primary-foreground" />
              </div>
            )}
            <div>
              {subtitle && (
                <p className="text-sm font-medium text-primary mb-1">{subtitle}</p>
              )}
              <h1 className={cn(
                "font-bold tracking-tight text-foreground",
                isCompact ? "text-2xl md:text-3xl" : isLarge ? "text-4xl md:text-5xl lg:text-6xl" : "text-3xl md:text-4xl"
              )}>
                {title}
              </h1>
            </div>
          </motion.div>

          {/* Description */}
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className={cn(
                "text-muted-foreground max-w-xl",
                isCompact ? "mt-2 text-sm" : "mt-4 text-lg"
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
                  size={isCompact ? "default" : "lg"}
                >
                  {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
                  {primaryAction.label}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              {secondaryAction && (
                <Button 
                  variant="outline" 
                  onClick={secondaryAction.onClick}
                  size={isCompact ? "default" : "lg"}
                >
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
              className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-border/40"
            >
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-3">
                  {stat.icon && (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className={cn(
                      "font-bold",
                      isCompact ? "text-xl" : "text-2xl"
                    )}>{stat.value}</p>
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
    </div>
  )
}
