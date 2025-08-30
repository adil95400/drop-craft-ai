import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Crown, 
  Check, 
  Zap, 
  Brain,
  BarChart3,
  Shield,
  Users,
  Globe,
  Rocket,
  Star
} from 'lucide-react'
import { useSimplePlan } from '@/hooks/useSimplePlan'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface PlanUpgradeDialogProps {
  isOpen: boolean
  onClose: () => void
  requiredFeature?: string
  currentPlan?: 'standard' | 'pro' | 'ultra_pro'
}

interface PlanFeature {
  name: string
  included: {
    standard: boolean
    pro: boolean
    ultra_pro: boolean
  }
}

const planFeatures: PlanFeature[] = [
  {
    name: 'Produits dans le catalogue',
    included: { standard: true, pro: true, ultra_pro: true }
  },
  {
    name: 'Intégrations de base',
    included: { standard: true, pro: true, ultra_pro: true }
  },
  {
    name: 'Support par email',
    included: { standard: true, pro: true, ultra_pro: true }
  },
  {
    name: 'Analytics avancés',
    included: { standard: false, pro: true, ultra_pro: true }
  },
  {
    name: 'Automatisation IA',
    included: { standard: false, pro: true, ultra_pro: true }
  },
  {
    name: 'Export de données',
    included: { standard: false, pro: true, ultra_pro: true }
  },
  {
    name: 'Insights IA prédictifs',
    included: { standard: false, pro: false, ultra_pro: true }
  },
  {
    name: 'Dashboard Ultra Pro',
    included: { standard: false, pro: false, ultra_pro: true }
  },
  {
    name: 'API complète',
    included: { standard: false, pro: false, ultra_pro: true }
  },
  {
    name: 'Support prioritaire 24/7',
    included: { standard: false, pro: false, ultra_pro: true }
  }
]

export const PlanUpgradeDialog = ({ 
  isOpen, 
  onClose, 
  requiredFeature, 
  currentPlan = 'standard' 
}: PlanUpgradeDialogProps) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async (targetPlan: 'pro' | 'ultra_pro') => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour effectuer un upgrade",
        variant: "destructive"
      })
      return
    }

    setIsUpgrading(true)
    
    try {
      // Simulate payment process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Upgrade réussi!",
        description: `Bienvenue dans le plan ${targetPlan === 'pro' ? 'Pro' : 'Ultra Pro'} !`,
      })
      
      // Redirect to dashboard with success message
      window.location.href = `/dashboard?upgrade=success&plan=${targetPlan}`
      
    } catch (error) {
      toast({
        title: "Erreur d'upgrade",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive"
      })
    } finally {
      setIsUpgrading(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-600" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            {requiredFeature 
              ? `La fonctionnalité "${requiredFeature}" nécessite un plan supérieur. Choisissez votre plan :`
              : "Débloquez toutes les fonctionnalités avec nos plans premium"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
          {/* Plan Standard */}
          <Card className={`relative ${currentPlan === 'standard' ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Standard
                </CardTitle>
                {currentPlan === 'standard' && (
                  <Badge variant="default">Actuel</Badge>
                )}
              </div>
              <CardDescription>Pour commencer</CardDescription>
              <div className="text-2xl font-bold">Gratuit</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {planFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className={`h-4 w-4 ${
                    feature.included.standard ? 'text-green-600' : 'text-gray-300'
                  }`} />
                  <span className={`text-sm ${
                    feature.included.standard ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Plan Pro */}
          <Card className={`relative ${currentPlan === 'pro' ? 'ring-2 ring-primary' : 'ring-2 ring-blue-500'}`}>
            {currentPlan !== 'pro' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Populaire
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Pro
                </CardTitle>
                {currentPlan === 'pro' && (
                  <Badge variant="default">Actuel</Badge>
                )}
              </div>
              <CardDescription>Pour les professionnels</CardDescription>
              <div className="text-2xl font-bold">€29/mois</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {planFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className={`h-4 w-4 ${
                    feature.included.pro ? 'text-green-600' : 'text-gray-300'
                  }`} />
                  <span className={`text-sm ${
                    feature.included.pro ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {feature.name}
                  </span>
                </div>
              ))}
              {currentPlan === 'standard' && (
                <Button 
                  className="w-full mt-4" 
                  onClick={() => handleUpgrade('pro')}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? 'Traitement...' : 'Upgrade vers Pro'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Plan Ultra Pro */}
          <Card className={`relative ${currentPlan === 'ultra_pro' ? 'ring-2 ring-primary' : 'ring-2 ring-purple-500'}`}>
            {currentPlan !== 'ultra_pro' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Ultra Pro
                </CardTitle>
                {currentPlan === 'ultra_pro' && (
                  <Badge variant="default">Actuel</Badge>
                )}
              </div>
              <CardDescription>Maximum de fonctionnalités</CardDescription>
              <div className="text-2xl font-bold">€99/mois</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {planFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className={`h-4 w-4 ${
                    feature.included.ultra_pro ? 'text-green-600' : 'text-gray-300'
                  }`} />
                  <span className={`text-sm ${
                    feature.included.ultra_pro ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {feature.name}
                  </span>
                </div>
              ))}
              {currentPlan !== 'ultra_pro' && (
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
                  onClick={() => handleUpgrade('ultra_pro')}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? 'Traitement...' : 'Upgrade vers Ultra Pro'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Peut-être plus tard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}