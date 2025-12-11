/**
 * MetricCard - Carte de métrique réutilisable avec feedback visuel
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface MetricCardProps {
  title: string
  value: number | string
  trend?: number
  icon: LucideIcon
  color?: string
  link?: string
  format?: (value: number) => string
  isLoading?: boolean
  className?: string
}

export function MetricCard({
  title,
  value,
  trend = 0,
  icon: Icon,
  color = 'text-primary',
  link,
  format,
  isLoading = false,
  className
}: MetricCardProps) {
  const navigate = useNavigate()
  
  const handleClick = () => {
    if (link) {
      toast.loading(`Navigation vers ${title}...`, { id: 'nav', duration: 500 })
      navigate(link)
      toast.dismiss('nav')
    }
  }

  const displayValue = typeof value === 'number' && format 
    ? format(value) 
    : value

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground'

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200",
        link && "cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      onClick={handleClick}
      role={link ? "button" : undefined}
      tabIndex={link ? 0 : undefined}
      onKeyDown={(e) => {
        if (link && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
        <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium truncate pr-2 text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-1.5 rounded-lg", color.replace('text-', 'bg-') + '/10')}>
          <Icon className={cn("h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0", color)} />
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 pt-0">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
          {displayValue}
        </div>
        
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            <TrendIcon className={cn("h-3 w-3 flex-shrink-0", trendColor)} />
            <span className={cn("text-[10px] sm:text-xs font-medium", trendColor)}>
              {trend > 0 ? '+' : ''}{Math.abs(trend).toFixed(1)}%
            </span>
            <span className="hidden sm:inline text-[10px] sm:text-xs text-muted-foreground">
              vs. période précédente
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
