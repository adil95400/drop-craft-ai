import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, RefreshCw, Package, ShoppingCart, Users } from 'lucide-react'

interface SyncStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress: number
  count?: number
}

interface SyncProgressModalProps {
  isOpen: boolean
  onClose: () => void
  syncType: 'full' | 'products' | 'orders' | 'customers'
  overallProgress: number
  steps: SyncStep[]
  currentStep?: string
}

export function SyncProgressModal({ 
  isOpen, 
  onClose, 
  syncType, 
  overallProgress, 
  steps,
  currentStep 
}: SyncProgressModalProps) {
  
  const getSyncIcon = () => {
    switch (syncType) {
      case 'products': return <Package className="w-5 h-5" />
      case 'orders': return <ShoppingCart className="w-5 h-5" />
      case 'customers': return <Users className="w-5 h-5" />
      default: return <RefreshCw className="w-5 h-5" />
    }
  }

  const getSyncTitle = () => {
    switch (syncType) {
      case 'products': return 'Synchronisation des produits'
      case 'orders': return 'Synchronisation des commandes'
      case 'customers': return 'Synchronisation des clients'
      default: return 'Synchronisation complète'
    }
  }

  const getStepIcon = (status: SyncStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default: return <div className="w-4 h-4 rounded-full border-2 border-muted" />
    }
  }

  const getStatusBadge = (status: SyncStep['status']) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-100 text-green-700">Terminé</Badge>
      case 'error': return <Badge variant="destructive">Erreur</Badge>
      case 'running': return <Badge variant="secondary" className="bg-blue-100 text-blue-700">En cours</Badge>
      default: return <Badge variant="outline">En attente</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSyncIcon()}
            {getSyncTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progression globale */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression globale</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          {/* Détail des étapes */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="flex-shrink-0">
                  {getStepIcon(step.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{step.name}</p>
                    {getStatusBadge(step.status)}
                  </div>
                  
                  {step.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={step.progress} className="h-1" />
                      {step.count !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {step.count} éléments traités
                        </p>
                      )}
                    </div>
                  )}
                  
                  {step.status === 'completed' && step.count !== undefined && (
                    <p className="text-xs text-green-600">
                      {step.count} éléments synchronisés
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Étape actuelle */}
          {currentStep && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Étape actuelle:</p>
              <p className="font-medium">{currentStep}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}