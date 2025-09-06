import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, 
  Settings, 
  Check, 
  X, 
  Search,
  Filter,
  Star,
  TrendingUp,
  Shield,
  Clock,
  Globe,
  Smartphone,
  Mail,
  BarChart3,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  Camera,
  FileText,
  Users,
  Palette,
  Code,
  Database,
  Cloud,
  Webhook,
  Bot,
  Lock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Integration {
  id: string
  name: string
  description: string
  category: 'Marketing' | 'Analytics' | 'Payment' | 'Communication' | 'AI' | 'Automation' | 'Security'
  icon: any
  status: 'available' | 'beta' | 'coming_soon'
  premium: boolean
  rating: number
  installs: number
  features: string[]
  connected: boolean
}

const integrations: Integration[] = [
  // Marketing
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Synchronisation automatique des campagnes publicitaires Google',
    category: 'Marketing',
    icon: Search,
    status: 'available',
    premium: false,
    rating: 4.8,
    installs: 25000,
    features: ['Auto-bidding', 'Conversion tracking', 'Audience sync'],
    connected: false
  },
  {
    id: 'meta-business',
    name: 'Meta Business',
    description: 'Intégration Facebook & Instagram Ads avec pixel tracking',
    category: 'Marketing',
    icon: MessageSquare,
    status: 'available',
    premium: false,
    rating: 4.7,
    installs: 22000,
    features: ['Pixel automatique', 'Catalogue produits', 'Retargeting'],
    connected: false
  },
  {
    id: 'tiktok-ads',
    name: 'TikTok for Business',
    description: 'Campagnes TikTok Ads avec tracking avancé',
    category: 'Marketing',
    icon: Smartphone,
    status: 'available',
    premium: true,
    rating: 4.5,
    installs: 8500,
    features: ['Pixel TikTok', 'Spark Ads', 'Creative tools'],
    connected: false
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing automatisé avec segmentation IA',
    category: 'Marketing',
    icon: Mail,
    status: 'available',
    premium: false,
    rating: 4.6,
    installs: 18000,
    features: ['Automation flows', 'A/B testing', 'Segmentation'],
    connected: false
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: 'Plateforme email et SMS marketing avancée',
    category: 'Marketing',
    icon: Mail,
    status: 'available',
    premium: true,
    rating: 4.9,
    installs: 12000,
    features: ['Behavioral triggers', 'SMS campaigns', 'Advanced analytics'],
    connected: false
  },

  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    description: 'Tracking e-commerce avancé et attribution multi-canal',
    category: 'Analytics',
    icon: BarChart3,
    status: 'available',
    premium: false,
    rating: 4.7,
    installs: 30000,
    features: ['Enhanced ecommerce', 'Custom dimensions', 'Audiences'],
    connected: true
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    description: 'Heatmaps et session recordings pour optimiser UX',
    category: 'Analytics',
    icon: Camera,
    status: 'available',
    premium: true,
    rating: 4.5,
    installs: 15000,
    features: ['Heatmaps', 'Session recordings', 'User feedback'],
    connected: false
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Analytics comportementales avancées avec cohorts',
    category: 'Analytics',
    icon: TrendingUp,
    status: 'available',
    premium: true,
    rating: 4.6,
    installs: 9500,
    features: ['Event tracking', 'Funnel analysis', 'Retention cohorts'],
    connected: false
  },

  // Payment
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Paiements en ligne sécurisés avec 40+ méthodes',
    category: 'Payment',
    icon: CreditCard,
    status: 'available',
    premium: false,
    rating: 4.9,
    installs: 35000,
    features: ['40+ payment methods', 'Subscriptions', 'Fraud protection'],
    connected: true
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Solution de paiement PayPal avec Express Checkout',
    category: 'Payment',
    icon: CreditCard,
    status: 'available',
    premium: false,
    rating: 4.4,
    installs: 28000,
    features: ['Express Checkout', 'Pay in 4', 'Merchant protection'],
    connected: false
  },
  {
    id: 'klarna',
    name: 'Klarna',
    description: 'Paiement différé et en plusieurs fois',
    category: 'Payment',
    icon: CreditCard,
    status: 'available',
    premium: true,
    rating: 4.3,
    installs: 14000,
    features: ['Pay later', 'Installments', 'In-app purchases'],
    connected: false
  },

  // AI
  {
    id: 'openai-gpt',
    name: 'OpenAI GPT',
    description: 'IA générative pour descriptions produits et contenu',
    category: 'AI',
    icon: Bot,
    status: 'available',
    premium: true,
    rating: 4.8,
    installs: 11000,
    features: ['Product descriptions', 'SEO content', 'Translation'],
    connected: false
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    description: 'Génération d\'images IA pour vos produits',
    category: 'AI',
    icon: Palette,
    status: 'beta',
    premium: true,
    rating: 4.7,
    installs: 5500,
    features: ['Product images', 'Lifestyle shots', 'Variations'],
    connected: false
  },
  {
    id: 'claude-ai',
    name: 'Claude AI',
    description: 'Assistant IA pour support client et modération',
    category: 'AI',
    icon: MessageSquare,
    status: 'available',
    premium: true,
    rating: 4.6,
    installs: 7800,
    features: ['Customer support', 'Content moderation', 'Translations'],
    connected: false
  },

  // Communication
  {
    id: 'intercom',
    name: 'Intercom',
    description: 'Plateforme complète de support client et live chat',
    category: 'Communication',
    icon: MessageSquare,
    status: 'available',
    premium: true,
    rating: 4.5,
    installs: 16000,
    features: ['Live chat', 'Help desk', 'Customer insights'],
    connected: false
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Solution de support client multi-canal',
    category: 'Communication',
    icon: Users,
    status: 'available',
    premium: true,
    rating: 4.4,
    installs: 13500,
    features: ['Ticketing system', 'Knowledge base', 'Chat widget'],
    connected: false
  },

  // Automation
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automatisation workflow avec 5000+ apps',
    category: 'Automation',
    icon: Zap,
    status: 'available',
    premium: false,
    rating: 4.6,
    installs: 20000,
    features: ['5000+ integrations', 'Multi-step workflows', 'Filters & paths'],
    connected: false
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Automatisation visuelle avancée',
    category: 'Automation',
    icon: Settings,
    status: 'available',
    premium: true,
    rating: 4.7,
    installs: 8900,
    features: ['Visual scenarios', 'Error handling', 'Advanced routing'],
    connected: false
  },

  // Security
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Protection DDoS et accélération CDN',
    category: 'Security',
    icon: Shield,
    status: 'available',
    premium: false,
    rating: 4.8,
    installs: 25500,
    features: ['DDoS protection', 'CDN', 'SSL certificates'],
    connected: false
  }
]

export const EnhancedIntegrationsHub: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showConnectedOnly, setShowConnectedOnly] = useState(false)
  const { toast } = useToast()

  const categories = ['all', 'Marketing', 'Analytics', 'Payment', 'Communication', 'AI', 'Automation', 'Security']

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesConnection = !showConnectedOnly || integration.connected
    
    return matchesCategory && matchesSearch && matchesConnection
  })

  const handleConnect = async (integration: Integration) => {
    if (integration.premium && integration.status !== 'available') {
      toast({
        title: "Fonctionnalité Premium",
        description: `${integration.name} nécessite un abonnement Pro ou Ultra`,
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Connexion en cours...",
      description: `Configuration de ${integration.name}`
    })

    // Simulate connection
    setTimeout(() => {
      toast({
        title: "Intégration connectée",
        description: `${integration.name} a été configuré avec succès`
      })
    }, 2000)
  }

  const handleDisconnect = (integration: Integration) => {
    toast({
      title: "Déconnexion",
      description: `${integration.name} a été déconnecté`
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'beta': return 'bg-orange-500'
      case 'coming_soon': return 'bg-gray-400'
      default: return 'bg-green-500'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Marketing': return <TrendingUp className="w-4 h-4" />
      case 'Analytics': return <BarChart3 className="w-4 h-4" />
      case 'Payment': return <CreditCard className="w-4 h-4" />
      case 'Communication': return <MessageSquare className="w-4 h-4" />
      case 'AI': return <Bot className="w-4 h-4" />
      case 'Automation': return <Zap className="w-4 h-4" />
      case 'Security': return <Shield className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const connectedCount = integrations.filter(i => i.connected).length
  const totalInstalls = integrations.reduce((sum, i) => sum + i.installs, 0)

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Hub Intégrations</h1>
          <p className="text-muted-foreground">
            Connectez vos outils favoris pour automatiser votre business
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">{integrations.length}</div>
              <div className="text-sm text-muted-foreground">Intégrations</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{connectedCount}</div>
              <div className="text-sm text-muted-foreground">Connectées</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{totalInstalls.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Installations</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">4.7</div>
              <div className="text-sm text-muted-foreground">Note moyenne</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une intégration..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="connected-only"
                checked={showConnectedOnly}
                onCheckedChange={setShowConnectedOnly}
              />
              <label htmlFor="connected-only" className="text-sm">
                Connectées uniquement
              </label>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8">
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="flex items-center gap-1 text-xs">
              {category !== 'all' && getCategoryIcon(category)}
              {category === 'all' ? 'Toutes' : category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIntegrations.map((integration) => {
                const Icon = integration.icon
                return (
                  <Card key={integration.id} className="relative hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(integration.status)}`} />
                              <span className="text-xs text-muted-foreground">
                                {integration.status === 'available' ? 'Disponible' : 
                                 integration.status === 'beta' ? 'Bêta' : 'Bientôt'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {integration.premium && (
                            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs">
                              Premium
                            </Badge>
                          )}
                          {integration.connected && (
                            <Badge variant="default" className="bg-green-500 text-white text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Connecté
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <CardDescription>{integration.description}</CardDescription>

                      {/* Rating & Installs */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{integration.rating}</span>
                        </div>
                        <span>{integration.installs.toLocaleString()} installations</span>
                      </div>

                      {/* Features */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Fonctionnalités :</h5>
                        <div className="flex flex-wrap gap-1">
                          {integration.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        {integration.connected ? (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleDisconnect(integration)}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Déconnecter
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => handleConnect(integration)}
                            className="w-full"
                            variant={integration.premium ? "outline" : "default"}
                            disabled={integration.status === 'coming_soon'}
                          >
                            {integration.status === 'coming_soon' ? 'Bientôt disponible' :
                             integration.premium ? 'Upgrade Required' : 'Connecter'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredIntegrations.length === 0 && (
              <div className="text-center py-12">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune intégration trouvée</h3>
                <p className="text-muted-foreground">
                  Essayez de modifier vos filtres ou votre recherche
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}