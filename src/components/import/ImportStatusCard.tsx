import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock,
  Loader2,
  TrendingUp,
  Database
} from 'lucide-react'

interface ImportStatusCardProps {
  status: 'processing' | 'completed' | 'failed' | 'pending'
  progress?: number
  message?: string
  details?: {
    total?: number
    success?: number
    errors?: number
    processing_time?: number
  }
}

export const ImportStatusCard = ({ 
  status, 
  progress = 0, 
  message, 
  details 
}: ImportStatusCardProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          icon: Loader2,
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          subTextColor: 'text-blue-700',
          iconColor: 'text-blue-600',
          title: 'Import en cours...',
          animate: true
        }
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-900',
          subTextColor: 'text-green-700',
          iconColor: 'text-green-600',
          title: 'Import réussi !',
          animate: false
        }
      case 'failed':
        return {
          icon: XCircle,
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          subTextColor: 'text-red-700',
          iconColor: 'text-red-600',
          title: 'Import échoué',
          animate: false
        }
      default:
        return {
          icon: Clock,
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-900',
          subTextColor: 'text-gray-700',
          iconColor: 'text-gray-600',
          title: 'En attente',
          animate: false
        }
    }
  }

  const config = getStatusConfig()
  const IconComponent = config.icon

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`${config.animate ? 'animate-spin' : ''}`}>
            <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className={`font-semibold ${config.textColor}`}>
                {config.title}
              </h3>
              {message && (
                <p className={`text-sm ${config.subTextColor} mt-1`}>
                  {message}
                </p>
              )}
            </div>

            {status === 'processing' && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className={`text-xs ${config.subTextColor} flex justify-between`}>
                  <span>Progression: {progress}%</span>
                  <span>Analyse en cours...</span>
                </div>
              </div>
            )}

            {details && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {details.total !== undefined && (
                  <div className="text-center">
                    <div className={`text-lg font-bold ${config.textColor}`}>
                      {details.total}
                    </div>
                    <div className={`text-xs ${config.subTextColor}`}>Total</div>
                  </div>
                )}
                {details.success !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {details.success}
                    </div>
                    <div className="text-xs text-green-600">Réussis</div>
                  </div>
                )}
                {details.errors !== undefined && details.errors > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {details.errors}
                    </div>
                    <div className="text-xs text-red-600">Erreurs</div>
                  </div>
                )}
                {details.processing_time && (
                  <div className="text-center">
                    <div className={`text-lg font-bold ${config.textColor}`}>
                      {(details.processing_time / 1000).toFixed(1)}s
                    </div>
                    <div className={`text-xs ${config.subTextColor}`}>Durée</div>
                  </div>
                )}
              </div>
            )}

            {status === 'completed' && details && (
              <div className="flex gap-2 flex-wrap mt-3">
                <Badge variant="outline" className="bg-white">
                  <Database className="w-3 h-3 mr-1" />
                  {details.success || 0} produits
                </Badge>
                {details.processing_time && (
                  <Badge variant="outline" className="bg-white">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {(details.processing_time / 1000).toFixed(1)}s
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}