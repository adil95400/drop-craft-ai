import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Shield,
  Network,
  Clock
} from 'lucide-react'

interface ImportError {
  type: 'network' | 'authentication' | 'validation' | 'server' | 'unknown'
  message: string
  code?: string
  suggestion?: string
  retryable?: boolean
}

interface SmartErrorHandlerProps {
  error: ImportError
  onRetry?: () => void
  onDismiss?: () => void
}

export const SmartErrorHandler: React.FC<SmartErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss
}) => {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <Network className="w-5 h-5" />
      case 'authentication':
        return <Shield className="w-5 h-5" />
      case 'validation':
        return <AlertTriangle className="w-5 h-5" />
      case 'server':
        return <RefreshCw className="w-5 h-5" />
      default:
        return <AlertTriangle className="w-5 h-5" />
    }
  }

  const getErrorVariant = () => {
    switch (error.type) {
      case 'network':
        return 'default'
      case 'authentication':
        return 'destructive'
      case 'validation':
        return 'default'
      case 'server':
        return 'destructive'
      default:
        return 'destructive'
    }
  }

  const getErrorTitle = () => {
    switch (error.type) {
      case 'network':
        return 'Problème de connexion'
      case 'authentication':
        return 'Erreur d\'authentification'
      case 'validation':
        return 'Données invalides'
      case 'server':
        return 'Erreur serveur'
      default:
        return 'Erreur inconnue'
    }
  }

  const getDefaultSuggestion = () => {
    switch (error.type) {
      case 'network':
        return 'Vérifiez votre connexion internet et réessayez'
      case 'authentication':
        return 'Reconnectez-vous et réessayez'
      case 'validation':
        return 'Vérifiez que l\'URL est correcte et accessible'
      case 'server':
        return 'Le serveur rencontre des difficultés, veuillez patienter'
      default:
        return 'Une erreur inattendue s\'est produite'
    }
  }

  return (
    <Alert variant={getErrorVariant()} className="relative">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1 space-y-3">
          <div>
            <AlertTitle className="flex items-center gap-2">
              {getErrorTitle()}
              <Badge variant="outline" className="text-xs">
                {error.code || 'ERR_IMPORT'}
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              {error.message}
            </AlertDescription>
          </div>

          {(error.suggestion || getDefaultSuggestion()) && (
            <div className="bg-white/50 p-3 rounded border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">💡 Suggestion :</p>
              <p className="text-sm text-gray-600">
                {error.suggestion || getDefaultSuggestion()}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            {error.retryable !== false && onRetry && (
              <Button
                onClick={onRetry}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </Button>
            )}
            
            {error.type === 'validation' && (
              <Button
                onClick={() => window.open('https://docs.lovable.dev/import-guide', '_blank')}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Guide d'import
              </Button>
            )}
            
            {onDismiss && (
              <Button
                onClick={onDismiss}
                size="sm"
                variant="ghost"
              >
                Ignorer
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="absolute top-2 right-2">
        <Clock className="w-4 h-4 text-gray-400" />
      </div>
    </Alert>
  )
}

// Hook pour gérer les erreurs d'import intelligemment
export const useSmartErrorHandler = () => {
  const parseError = (error: any): ImportError => {
    // Erreur réseau
    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      return {
        type: 'network',
        message: 'Impossible de se connecter au serveur',
        retryable: true,
        suggestion: 'Vérifiez votre connexion internet et réessayez dans quelques instants'
      }
    }
    
    // Erreur d'authentification
    if (error.message?.includes('authentication') || error.message?.includes('token')) {
      return {
        type: 'authentication',
        message: 'Session expirée ou non authentifié',
        retryable: false,
        suggestion: 'Reconnectez-vous à votre compte'
      }
    }
    
    // Erreur de validation URL
    if (error.message?.includes('URL') || error.message?.includes('invalid')) {
      return {
        type: 'validation',
        message: error.message || 'URL invalide ou inaccessible',
        retryable: true,
        suggestion: 'Vérifiez que l\'URL est correcte et que le site est accessible'
      }
    }
    
    // Erreur serveur
    if (error.status >= 500 || error.message?.includes('server')) {
      return {
        type: 'server',
        message: 'Erreur interne du serveur',
        retryable: true,
        suggestion: 'Le serveur rencontre des difficultés temporaires'
      }
    }
    
    // Erreur inconnue
    return {
      type: 'unknown',
      message: error.message || 'Une erreur inattendue s\'est produite',
      retryable: true,
      suggestion: 'Si le problème persiste, contactez le support'
    }
  }

  return { parseError }
}