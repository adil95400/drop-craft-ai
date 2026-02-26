import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react'
import { useSupplierHealthCheck } from '@/hooks/useSupplierHealthCheck'
import { formatDistanceToNow } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'

interface SupplierHealthIndicatorProps {
  supplierId: string
  showDetails?: boolean
}

export function SupplierHealthIndicator({ supplierId, showDetails = false }: SupplierHealthIndicatorProps) {
  const locale = useDateFnsLocale()
  const { health, isLoading } = useSupplierHealthCheck(supplierId)

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  }

  if (!health) {
    return <Badge variant="outline" className="bg-muted text-muted-foreground">Inconnu</Badge>
  }

  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      label: 'Opérationnel'
    },
    degraded: {
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500/10',
      label: 'Dégradé'
    },
    down: {
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      label: 'Hors ligne'
    }
  }

  const config = statusConfig[health.status]
  const Icon = config.icon

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-semibold">{health.supplierName}</div>
      <div className="text-xs">
        <div>Temps de réponse: {health.responseTime}ms</div>
        <div>Produits: {health.productCount}</div>
        {health.lastSync && (
          <div>
            Dernière sync: {formatDistanceToNow(new Date(health.lastSync), { addSuffix: true, locale })}
          </div>
        )}
        {health.errors.length > 0 && (
          <div className="text-destructive mt-1">
            Erreurs: {health.errors.join(', ')}
          </div>
        )}
      </div>
    </div>
  )

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${config.bgColor} ${config.color}`}>
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
