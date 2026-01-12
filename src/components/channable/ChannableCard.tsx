/**
 * Card style Channable avec animations et états
 */

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LucideIcon, ArrowRight, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react'

interface ChannableCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconBg?: string
  badge?: {
    label: string
    variant?: 'default' | 'secondary' | 'outline' | 'destructive'
    color?: string
  }
  status?: 'connected' | 'disconnected' | 'pending' | 'error' | 'active' | 'inactive'
  stats?: {
    label: string
    value: string | number
  }[]
  actions?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'ghost' | 'link'
    icon?: LucideIcon
  }[]
  onClick?: () => void
  className?: string
  children?: ReactNode
  popular?: boolean
  featured?: boolean
  imageUrl?: string
  delay?: number
}

const statusConfig = {
  connected: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Connecté' },
  disconnected: { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Déconnecté' },
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'En attente' },
  error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Erreur' },
  active: { icon: Zap, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Actif' },
  inactive: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Inactif' },
}

export function ChannableCard({
  title,
  description,
  icon: Icon,
  iconBg = "bg-primary/10",
  badge,
  status,
  stats,
  actions,
  onClick,
  className,
  children,
  popular,
  featured,
  imageUrl,
  delay = 0
}: ChannableCardProps) {
  const statusInfo = status ? statusConfig[status] : null
  const StatusIcon = statusInfo?.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.05 }}
      whileHover={onClick ? { y: -4, transition: { duration: 0.2 } } : undefined}
    >
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          onClick && "cursor-pointer hover:shadow-xl hover:border-primary/30",
          featured && "ring-2 ring-primary/20 shadow-lg",
          className
        )}
        onClick={onClick}
      >
        {/* Popular badge */}
        {popular && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 text-xs">
              Populaire
            </Badge>
          </div>
        )}

        {/* Featured gradient */}
        {featured && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            {/* Icon or Image */}
            {imageUrl ? (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            ) : Icon && (
              <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
                <Icon className="h-6 w-6 text-primary" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg truncate">{title}</CardTitle>
                {badge && (
                  <Badge 
                    variant={badge.variant || "secondary"} 
                    className={cn("text-xs", badge.color)}
                  >
                    {badge.label}
                  </Badge>
                )}
              </div>
              
              {/* Status indicator */}
              {statusInfo && StatusIcon && (
                <div className={cn("flex items-center gap-1.5 mt-1", statusInfo.color)}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{statusInfo.label}</span>
                </div>
              )}
            </div>
          </div>

          {description && (
            <CardDescription className="mt-2 line-clamp-2">{description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {/* Stats */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {stats.map((stat, index) => (
                <div key={index} className="bg-muted/50 rounded-lg p-2.5">
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Custom children */}
          {children}

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    action.onClick()
                  }}
                  className="flex-1 min-w-[100px]"
                >
                  {action.icon && <action.icon className="h-3.5 w-3.5 mr-1.5" />}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Arrow indicator for clickable cards */}
          {onClick && !actions && (
            <div className="flex items-center justify-end text-primary mt-4">
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
