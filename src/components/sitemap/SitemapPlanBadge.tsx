/**
 * Badge de plan pour le Sitemap
 */
import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Lock, Crown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanType } from '@/lib/unified-plan-system'

interface SitemapPlanBadgeProps {
  plan: PlanType
  size?: 'sm' | 'md'
  showIcon?: boolean
  locked?: boolean
}

const planStyles: Record<PlanType, { label: string; className: string; icon?: React.ElementType }> = {
  free: { 
    label: 'Free', 
    className: 'bg-muted text-muted-foreground border-muted-foreground/20' 
  },
  standard: { 
    label: 'Standard', 
    className: 'bg-secondary text-secondary-foreground border-secondary-foreground/20' 
  },
  pro: { 
    label: 'Pro', 
    className: 'bg-primary/15 text-primary border-primary/30',
    icon: Sparkles
  },
  ultra_pro: { 
    label: 'Ultra', 
    className: 'bg-warning/15 text-warning border-warning/30',
    icon: Crown
  }
}

export const SitemapPlanBadge = memo<SitemapPlanBadgeProps>(({ 
  plan, 
  size = 'sm', 
  showIcon = true,
  locked = false
}) => {
  const style = planStyles[plan] || planStyles.standard
  const Icon = style.icon

  return (
    <Badge 
      variant="outline"
      className={cn(
        "font-medium transition-colors",
        style.className,
        size === 'sm' ? 'text-[10px] px-1.5 py-0 h-4' : 'text-xs px-2 py-0.5 h-5',
        locked && 'opacity-60'
      )}
    >
      {locked ? (
        <Lock className={cn("mr-0.5", size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      ) : showIcon && Icon ? (
        <Icon className={cn("mr-0.5", size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      ) : null}
      {style.label}
    </Badge>
  )
})

SitemapPlanBadge.displayName = 'SitemapPlanBadge'
