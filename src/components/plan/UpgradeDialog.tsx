import { useState } from 'react'
import { Crown, Zap, Star, ArrowRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanType } from '@/hooks/usePlan'

interface UpgradeDialogProps {
  requiredPlan: PlanType
  isOpen?: boolean
  onClose?: () => void
}

const planConfig = {
  pro: {
    name: 'Pro',
    icon: Star,
    price: '29€',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    features: [
      'Imports avancés',
      'Analyses AI',
      'Support prioritaire',
      'Exports illimités'
    ]
  },
  ultra_pro: {
    name: 'Ultra Pro',
    icon: Crown,
    price: '99€',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    features: [
      'Tout de Pro +',
      'Automatisations avancées',
      'IA prédictive',
      'Intégrations premium',
      'Analytics avancés',
      'API complète'
    ]
  }
}

export const UpgradeDialog = ({ requiredPlan, isOpen = true, onClose }: UpgradeDialogProps) => {
  const [open, setOpen] = useState(isOpen)
  const navigate = useNavigate()
  
  const config = planConfig[requiredPlan as keyof typeof planConfig]
  const IconComponent = config.icon

  const handleClose = () => {
    setOpen(false)
    onClose?.()
  }

  const handleUpgrade = () => {
    navigate('/pricing', { state: { highlightPlan: requiredPlan } })
    handleClose()
  }

  if (!config) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.bgColor} ${config.borderColor} border-2`}>
              <IconComponent className={`h-8 w-8 ${config.color}`} />
            </div>
          </div>
          
          <div>
            <DialogTitle className="text-xl font-bold">
              Fonctionnalité {config.name} requise
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Cette fonctionnalité nécessite un abonnement {config.name} ou supérieur
            </DialogDescription>
          </div>
        </DialogHeader>

        <Card className={`${config.borderColor} border-2 ${config.bgColor}`}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <IconComponent className={`h-5 w-5 ${config.color}`} />
                Plan {config.name}
              </span>
              <Badge variant="secondary" className={config.color}>
                {config.price}/mois
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {config.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleUpgrade} className="flex-1">
            Passer à {config.name}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}