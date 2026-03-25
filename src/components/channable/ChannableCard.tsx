/**
 * Card style Channable — Premium polish avec micro-interactions
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
  connected: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Connecté', dot: 'bg-success' },
  disconnected: { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Déconnecté', dot: 'bg-muted-foreground' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'En attente', dot: 'bg-warning' },
  error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Erreur', dot: 'bg-destructive' },
  active: { icon: Zap, color: 'text-success', bg: 'bg-success/10', label: 'Actif', dot: 'bg-success' },
  inactive: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Inactif', dot: 'bg-muted-foreground' },
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: delay * 0.04 }}
      whileHover={onClick ? { y: -3, transition: { duration: 0.2 } } : undefined}
    >
      <Card 
        className={cn(
          "group relative overflow-hidden border-border/50 transition-all duration-200",
          onClick && "cursor-pointer hover:shadow-lg hover:border-primary/20",
          featured && "ring-1 ring-primary/15 shadow-md",
          className
        )}
        onClick={onClick}
      >
        {/* Popular badge */}
        {popular && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gradient-to-r from-warning to-warning/80 text-warning-foreground border-0 text-[10px] font-bold uppercase tracking-wide shadow-sm">
              Populaire
            </Badge>
          </div>
        )}

        {/* Featured subtle top accent */}
        {featured && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
        )}

        <CardHeader className="pb-2">
          <div className="flex items-start gap-3.5">
            {/* Icon or Image */}
            {imageUrl ? (
              <div className="h-11 w-11 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50">
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="h-7 w-7 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
            ) : Icon && (
              <div className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105",
                iconBg
              )}>
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
                {badge && (
                  <Badge 
                    variant={badge.variant || "secondary"} 
                    className={cn("text-[10px] font-bold", badge.color)}
                  >
                    {badge.label}
                  </Badge>
                )}
              </div>
              
              {/* Status with dot indicator */}
              {statusInfo && (
                <div className={cn("flex items-center gap-1.5 mt-1", statusInfo.color)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", statusInfo.dot)} />
                  <span className="text-[11px] font-medium">{statusInfo.label}</span>
                </div>
              )}
            </div>
          </div>

          {description && (
            <CardDescription className="mt-2 line-clamp-2 text-[13px]">{description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {/* Stats — compact, dense, pro-like */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {stats.map((stat, index) => (
                <div key={index} className="rounded-lg bg-muted/40 border border-border/30 px-3 py-2">
                  <p className="text-sm font-bold tabular-nums">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {children}

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/30">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    action.onClick()
                  }}
                  className="flex-1 min-w-[90px] h-8 text-[13px]"
                >
                  {action.icon && <action.icon className="h-3.5 w-3.5 mr-1.5" />}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Arrow for clickable */}
          {onClick && !actions && (
            <div className="flex items-center justify-end text-primary/60 group-hover:text-primary mt-3 transition-colors">
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
