import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

interface ImportStatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
  className?: string
}

export function ImportStatusBadge({ status, className }: ImportStatusBadgeProps) {
  const config = {
    pending: {
      label: 'En attente',
      icon: Clock,
      variant: 'secondary' as const,
      className: 'bg-muted text-muted-foreground'
    },
    processing: {
      label: 'En cours',
      icon: Clock,
      variant: 'default' as const,
      className: 'bg-primary/10 text-primary animate-pulse'
    },
    completed: {
      label: 'Terminé',
      icon: CheckCircle2,
      variant: 'default' as const,
      className: 'bg-green-500/10 text-green-600'
    },
    partial: {
      label: 'Partiel',
      icon: AlertCircle,
      variant: 'default' as const,
      className: 'bg-yellow-500/10 text-yellow-600'
    },
    failed: {
      label: 'Échoué',
      icon: XCircle,
      variant: 'destructive' as const,
      className: 'bg-destructive/10 text-destructive'
    }
  }

  const { label, icon: Icon, className: statusClass } = config[status]

  return (
    <Badge variant="outline" className={`${statusClass} ${className}`}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  )
}
