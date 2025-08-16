import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface QuotaIndicatorProps {
  quotaKey: string
  current: number
  limit: number
  label?: string
  compact?: boolean
}

export const QuotaIndicator = ({ 
  quotaKey, 
  current, 
  limit, 
  label,
  compact = false 
}: QuotaIndicatorProps) => {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100)
  const isExceeded = !isUnlimited && current >= limit
  const isWarning = !isUnlimited && percentage > 80
  
  const getStatusColor = () => {
    if (isUnlimited) return 'text-green-600'
    if (isExceeded) return 'text-red-600'
    if (isWarning) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusIcon = () => {
    if (isUnlimited) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (isExceeded) return <XCircle className="h-4 w-4 text-red-600" />
    if (isWarning) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <CheckCircle className="h-4 w-4 text-green-600" />
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant="outline" className={getStatusColor()}>
                {isUnlimited ? '∞' : `${current}/${limit}`}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label || quotaKey}</p>
            <p>Utilisé: {current} {isUnlimited ? '' : `/ ${limit}`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{label || quotaKey}</span>
        </div>
        <Badge variant="outline" className={getStatusColor()}>
          {isUnlimited ? 'Illimité' : `${current}/${limit}`}
        </Badge>
      </div>
      
      {!isUnlimited && (
        <Progress 
          value={percentage} 
          className="h-2"
        />
      )}
      
      {isExceeded && (
        <p className="text-xs text-red-600">
          Quota dépassé - Passez à un plan supérieur
        </p>
      )}
      
      {isWarning && !isExceeded && (
        <p className="text-xs text-yellow-600">
          Attention: proche de la limite
        </p>
      )}
    </div>
  )
}