import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Store, 
  Code, 
  Terminal, 
  Palette,
  Shield,
  Zap,
  ArrowRight,
  Download,
  Globe,
  Printer,
  Settings
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUnifiedPlan } from '@/components/unified'

interface ExtensionCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  route: string
  planRequired?: 'pro' | 'ultra_pro' | null
  badge?: string
  color: string
  status?: 'available' | 'coming-soon' | 'beta'
}

const extensionCards: ExtensionCard[] = [
  {
    id: 'marketplace',
    title: 'Marketplace Extensions',
    description: 'Découvrez et installez des milliers d\'extensions créées par la communauté',
    icon: <Store className="w-6 h-6" />,
    route: '/extensions/marketplace',
    planRequired: null,
    badge: 'Gratuit',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    status: 'available'
  },
  {
    id: 'developer',
    title: 'Developer Dashboard',
    description: 'Créez, publiez et monétisez vos propres extensions',
    icon: <Code className="w-6 h-6" />,
    route: '/extensions/developer',
    planRequired: null,
    badge: 'Dev',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    status: 'available'
  },
  {
    id: 'cli',
    title: 'CLI Developer Tools',
    description: 'Outils de développement en ligne de commande pour créer des extensions',
    icon: <Terminal className="w-6 h-6" />,
    route: '/extensions/cli',
    planRequired: 'pro',
    badge: 'Pro',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    status: 'available'
  },
  {
    id: 'white-label',
    title: 'White-Label Marketplace',
    description: 'Créez votre propre marketplace d\'extensions personnalisé',
    icon: <Palette className="w-6 h-6" />,
    route: '/extensions/white-label',
    planRequired: 'ultra_pro',
    badge: 'Ultra Pro',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    status: 'available'
  },
  {
    id: 'sso',
    title: 'Enterprise SSO & Security',
    description: 'Authentification unique et gestion de la sécurité pour entreprises',
    icon: <Shield className="w-6 h-6" />,
    route: '/extensions/sso',
    planRequired: 'ultra_pro',
    badge: 'Ultra Pro',
    color: 'bg-red-50 border-red-200 hover:bg-red-100',
    status: 'available'
  },
  {
    id: 'ai-extensions',
    title: 'Extensions IA Intégrées',
    description: 'Extensions d\'intelligence artificielle pour l\'import et l\'optimisation',
    icon: <Zap className="w-6 h-6" />,
    route: '/import',
    planRequired: 'pro',
    badge: 'IA',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    status: 'available'
  },
  {
    id: 'browser-extension',
    title: 'Extension Navigateur v6.0.0',
    description: 'Extension Chrome pour scraper des produits directement depuis 45+ plateformes',
    icon: <Globe className="w-6 h-6" />,
    route: '/extensions/chrome',
    planRequired: null,
    badge: 'v6.0.0',
    color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    status: 'available'
  },
  {
    id: 'print-manager',
    title: 'Gestionnaire d\'Impression',
    description: 'Templates et gestion avancée des impressions (factures, étiquettes, rapports)',
    icon: <Printer className="w-6 h-6" />,
    route: '/print',
    planRequired: 'pro',
    badge: 'Pro',
    color: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
    status: 'available'
  }
]

export const ExtensionNavigator: React.FC = () => {
  const navigate = useNavigate()
  const { isPro, isUltraPro } = useUnifiedPlan()

  const canAccess = (planRequired: 'pro' | 'ultra_pro' | null) => {
    if (!planRequired) return true
    if (planRequired === 'pro') return isPro || isUltraPro
    if (planRequired === 'ultra_pro') return isUltraPro
    return false
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>
      case 'beta':
        return <Badge className="bg-orange-100 text-orange-800">Beta</Badge>
      case 'coming-soon':
        return <Badge className="bg-gray-100 text-gray-800">Bientôt</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Settings className="w-5 h-5 text-primary" />
          <span className="text-primary font-medium">Système d'Extensions</span>
        </div>
        <h1 className="text-3xl font-bold">Centre d'Extensions</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explorez notre écosystème complet d'extensions pour étendre les fonctionnalités 
          de votre plateforme e-commerce et automatiser vos processus métier.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-blue-600">250+</div>
          <div className="text-sm text-muted-foreground">Extensions disponibles</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-600">50k+</div>
          <div className="text-sm text-muted-foreground">Téléchargements</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-purple-600">150+</div>
          <div className="text-sm text-muted-foreground">Développeurs</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-orange-600">4.8⭐</div>
          <div className="text-sm text-muted-foreground">Note moyenne</div>
        </Card>
      </div>

      {/* Extension Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {extensionCards.map((extension) => {
          const hasAccess = canAccess(extension.planRequired)
          
          return (
            <Card 
              key={extension.id} 
              className={`transition-all duration-300 cursor-pointer ${extension.color} ${
                hasAccess ? 'hover:shadow-lg' : 'opacity-75'
              }`}
              onClick={() => hasAccess && navigate(extension.route)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/50">
                      {extension.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{extension.title}</CardTitle>
                      {extension.badge && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {extension.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {extension.status && getStatusBadge(extension.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  {extension.description}
                </CardDescription>
                
                <div className="flex items-center justify-between">
                  {hasAccess ? (
                    <Button className="w-full group">
                      Accéder
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ) : (
                    <div className="w-full text-center">
                      <Badge className="bg-yellow-100 text-yellow-800 mb-2">
                        Plan {extension.planRequired?.replace('_', ' ').toUpperCase()} requis
                      </Badge>
                      <Button variant="outline" size="sm" className="w-full">
                        Upgrader le plan
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Développez vos propres extensions</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Rejoignez notre communauté de développeurs et créez des extensions 
            personnalisées pour répondre aux besoins spécifiques de votre business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/extensions/developer')}
              className="bg-primary"
            >
              <Code className="w-5 h-5 mr-2" />
              Commencer le développement
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/extensions/cli')}
            >
              <Terminal className="w-5 h-5 mr-2" />
              Installer le CLI
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ExtensionNavigator