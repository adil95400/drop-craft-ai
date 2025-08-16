import { Crown, Star, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PlanType } from '@/hooks/usePlan'

interface PlanBadgeProps {
  plan: PlanType
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const planConfig = {
  free: {
    label: 'Gratuit',
    icon: Heart,
    variant: 'secondary' as const,
    className: 'text-gray-600 bg-gray-100'
  },
  pro: {
    label: 'Pro',
    icon: Star,
    variant: 'default' as const,
    className: 'text-blue-600 bg-blue-100'
  },
  ultra_pro: {
    label: 'Ultra Pro',
    icon: Crown,
    variant: 'default' as const,
    className: 'text-purple-600 bg-purple-100'
  }
}

const sizeConfig = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-2'
}

export const PlanBadge = ({ plan, size = 'md', showIcon = true }: PlanBadgeProps) => {
  const config = planConfig[plan]
  const IconComponent = config.icon
  
  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${sizeConfig[size]} font-medium`}
    >
      {showIcon && <IconComponent className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  )
}