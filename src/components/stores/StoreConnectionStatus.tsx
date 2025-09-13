import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react'

interface StoreConnectionStatusProps {
  status: 'connected' | 'error' | 'connecting' | 'disconnected'
  className?: string
}

export function StoreConnectionStatus({ status, className }: StoreConnectionStatusProps) {
  const statusConfig = {
    connected: {
      icon: CheckCircle,
      text: 'Connecté',
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 hover:bg-green-100'
    },
    connecting: {
      icon: Clock,
      text: 'Connexion...',
      variant: 'secondary' as const,
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
    },
    error: {
      icon: AlertCircle,
      text: 'Erreur',
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 hover:bg-red-100'
    },
    disconnected: {
      icon: XCircle,
      text: 'Déconnecté',
      variant: 'outline' as const,
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.text}
    </Badge>
  )
}