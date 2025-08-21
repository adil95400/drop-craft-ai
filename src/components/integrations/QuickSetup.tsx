import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle,
  Clock,
  Zap,
  ShoppingCart,
  BarChart3,
  ArrowRight,
  Star,
  Users,
  TrendingUp
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Setups rapides recommandés
const QUICK_SETUPS = [
  {
    id: 'ecommerce-starter',
    name: 'Pack E-commerce Débutant',
    description: 'Parfait pour démarrer votre boutique en ligne',
    duration: '10 minutes',
    difficulty: 'Facile',
    popularity: 95,
    integrations: [
      { name: 'Shopify', status: 'ready' },
      { name: 'Stripe', status: 'ready' },
      { name: 'Google Analytics', status: 'ready' },
      { name: 'Mailchimp', status: 'ready' }
    ],
    benefits: [
      'Boutique en ligne fonctionnelle',
      'Paiements sécurisés',
      'Analytics de base',
      'Email marketing'
    ],
    tags: ['Recommandé', 'Débutant'],
    price: 'Gratuit'
  },
  {
    id: 'dropshipping-pro',
    name: 'Pack Dropshipping Pro',
    description: 'Solution complète pour le dropshipping automatisé',
    duration: '15 minutes',
    difficulty: 'Moyen',
    popularity: 87,
    integrations: [
      { name: 'AliExpress', status: 'ready' },
      { name: 'Shopify', status: 'ready' },
      { name: 'BigBuy', status: 'ready' },
      { name: 'Facebook Ads', status: 'ready' },
      { name: 'Google Ads', status: 'ready' }
    ],
    benefits: [
      'Import produits automatique',
      'Gestion stock temps réel',
      'Campagnes pub optimisées',
      'Multi-fournisseurs'
    ],
    tags: ['Populaire', 'Dropshipping'],
    price: 'Pro'
  },
  {
    id: 'marketplace-seller',
    name: 'Pack Vendeur Marketplace',
    description: 'Vendez sur tous les grands marketplaces',
    duration: '20 minutes', 
    difficulty: 'Moyen',
    popularity: 78,
    integrations: [
      { name: 'Amazon', status: 'ready' },
      { name: 'eBay', status: 'ready' },
      { name: 'Etsy', status: 'ready' },
      { name: 'Google Analytics', status: 'ready' },
      { name: 'Klaviyo', status: 'ready' }
    ],
    benefits: [
      'Multi-marketplace sync',
      'Gestion centralisée',
      'Analytics unifié',
      'Email avancé'
    ],
    tags: ['Multi-canal', 'Avancé'],
    price: 'Pro'
  },
  {
    id: 'marketing-automation',
    name: 'Pack Marketing Automation',
    description: 'Automatisez votre marketing pour plus de conversions',
    duration: '12 minutes',
    difficulty: 'Moyen',
    popularity: 82,
    integrations: [
      { name: 'Klaviyo', status: 'ready' },
      { name: 'Facebook Ads', status: 'ready' },
      { name: 'Google Ads', status: 'ready' },
      { name: 'Hotjar', status: 'ready' }
    ],
    benefits: [
      'Emails automatisés',
      'Retargeting intelligent',
      'Optimisation UX',
      'ROI tracking'
    ],
    tags: ['Automation', 'ROI'],
    price: 'Pro'
  }
]

export const QuickSetup = () => {
  const [selectedSetup, setSelectedSetup] = useState<any>(null)
  const [setupProgress, setSetupProgress] = useState(0)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const { toast } = useToast()

  const startQuickSetup = async (setup: any) => {
    setSelectedSetup(setup)
    setIsSettingUp(true)
    setSetupProgress(0)

    try {
      // Simuler le processus de setup
      for (let i = 0; i <= 100; i += 20) {
        setSetupProgress(i)
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      toast({
        title: "Setup terminé !",
        description: `${setup.name} a été configuré avec succès.`
      })
      
      setIsSettingUp(false)
      setSelectedSetup(null)
      setSetupProgress(0)
    } catch (error) {
      toast({
        title: "Erreur de setup",
        description: "Impossible de terminer la configuration.",
        variant: "destructive"
      })
      setIsSettingUp(false)
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Facile':
        return <Badge className="bg-green-100 text-green-800">Facile</Badge>
      case 'Moyen':
        return <Badge className="bg-yellow-100 text-yellow-800">Moyen</Badge>
      case 'Avancé':
        return <Badge className="bg-red-100 text-red-800">Avancé</Badge>
      default:
        return <Badge variant="outline">{difficulty}</Badge>
    }
  }

  const QuickSetupCard = ({ setup }: { setup: any }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-base">{setup.name}</CardTitle>
              <div className="flex gap-1">
                {setup.tags.map((tag: string) => (
                  <Badge 
                    key={tag} 
                    variant={tag === 'Recommandé' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {setup.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {setup.duration}
            </div>
            {getDifficultyBadge(setup.difficulty)}
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{setup.popularity}% populaire</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium mb-2">Intégrations incluses</div>
          <div className="grid grid-cols-2 gap-2">
            {setup.integrations.map((integration: any) => (
              <div key={integration.name} className="flex items-center gap-2 text-xs">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>{integration.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="text-sm font-medium mb-2">Bénéfices</div>
          <ul className="space-y-1">
            {setup.benefits.slice(0, 3).map((benefit: string) => (
              <li key={benefit} className="text-xs text-muted-foreground flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Plan requis: </span>
            <Badge variant={setup.price === 'Gratuit' ? 'default' : 'secondary'}>
              {setup.price}
            </Badge>
          </div>
          <Button 
            size="sm"
            onClick={() => startQuickSetup(setup)}
            disabled={isSettingUp}
            className="group-hover:shadow-md transition-all"
          >
            <Zap className="w-3 h-3 mr-1" />
            Configurer
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Setup Rapide</h3>
        <p className="text-sm text-muted-foreground">
          Configurations prêtes à l'emploi pour démarrer rapidement
        </p>
      </div>

      {/* Progress modal */}
      {isSettingUp && selectedSetup && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Configuration en cours: {selectedSetup.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={setupProgress} className="w-full" />
            <div className="text-sm text-muted-foreground">
              {setupProgress < 20 && "Vérification des prérequis..."}
              {setupProgress >= 20 && setupProgress < 40 && "Connexion aux APIs..."}
              {setupProgress >= 40 && setupProgress < 60 && "Configuration des intégrations..."}
              {setupProgress >= 60 && setupProgress < 80 && "Tests de connexion..."}
              {setupProgress >= 80 && setupProgress < 100 && "Finalisation..."}
              {setupProgress === 100 && "Configuration terminée !"}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progression</span>
              <span>{setupProgress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick setups grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {QUICK_SETUPS.map(setup => (
          <QuickSetupCard key={setup.id} setup={setup} />
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">4</div>
            <div className="text-sm text-muted-foreground">Packs disponibles</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">85%</div>
            <div className="text-sm text-muted-foreground">Taux de réussite</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">12min</div>
            <div className="text-sm text-muted-foreground">Temps moyen</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}