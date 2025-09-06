import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Plus, 
  Settings, 
  Zap, 
  ShoppingCart, 
  BarChart3, 
  Mail, 
  MessageSquare, 
  Truck, 
  CreditCard, 
  Globe, 
  Camera, 
  FileText, 
  Users,
  Bot,
  Palette,
  Shield,
  Calendar,
  Database,
  Webhook,
  Cloud
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRealIntegrations } from '@/hooks/useRealIntegrations'

interface IntegrationTemplate {
  id: string
  name: string
  description: string
  category: 'E-commerce' | 'Marketing' | 'Analytics' | 'Communication' | 'Productivity' | 'AI' | 'Finance'
  status: 'available' | 'beta' | 'coming_soon'
  icon: any
  features: string[]
  setup_time: string
  pricing: 'free' | 'freemium' | 'premium'
  popular: boolean
}

const integrationTemplates: IntegrationTemplate[] = [
  {
    id: 'shopify-advanced',
    name: 'Shopify Advanced',
    description: 'Synchronisation complète avec analytics avancées et gestion multi-store',
    category: 'E-commerce',
    status: 'available',
    icon: ShoppingCart,
    features: ['Multi-store sync', 'Advanced analytics', 'Inventory management', 'Order automation'],
    setup_time: '15 min',
    pricing: 'freemium',
    popular: true
  },
  {
    id: 'amazon-seller',
    name: 'Amazon Seller Central',
    description: 'Intégration complète avec Amazon Marketplace et FBA',
    category: 'E-commerce',
    status: 'available',
    icon: ShoppingCart,
    features: ['Product sync', 'FBA management', 'Advertising API', 'Performance metrics'],
    setup_time: '30 min',
    pricing: 'premium',
    popular: true
  },
  {
    id: 'google-ads',
    name: 'Google Ads & Shopping',
    description: 'Gestion automatisée des campagnes Google Ads et Google Shopping',
    category: 'Marketing',
    status: 'available',
    icon: BarChart3,
    features: ['Auto campaigns', 'Shopping feed', 'Bid optimization', 'ROI tracking'],
    setup_time: '20 min',
    pricing: 'freemium',
    popular: true
  },
  {
    id: 'facebook-meta',
    name: 'Meta Business Suite',
    description: 'Facebook, Instagram et WhatsApp Business intégrés',
    category: 'Marketing',
    status: 'available',
    icon: Camera,
    features: ['Social commerce', 'Messenger bot', 'Instagram Shopping', 'Pixel tracking'],
    setup_time: '25 min',
    pricing: 'freemium',
    popular: true
  },
  {
    id: 'mailchimp-pro',
    name: 'Mailchimp Pro',
    description: 'Email marketing avancé avec segmentation IA',
    category: 'Marketing',
    status: 'available',
    icon: Mail,
    features: ['AI segmentation', 'Behavioral targeting', 'A/B testing', 'Revenue tracking'],
    setup_time: '10 min',
    pricing: 'freemium',
    popular: false
  },
  {
    id: 'stripe-advanced',
    name: 'Stripe Advanced',
    description: 'Solution de paiement complète avec subscription management',
    category: 'Finance',
    status: 'available',
    icon: CreditCard,
    features: ['Subscription billing', 'Multi-currency', 'Fraud detection', 'Revenue recognition'],
    setup_time: '15 min',
    pricing: 'free',
    popular: true
  },
  {
    id: 'zendesk-support',
    name: 'Zendesk Support',
    description: 'Support client professionnel avec ticketing avancé',
    category: 'Communication',
    status: 'available',
    icon: MessageSquare,
    features: ['Omnichannel support', 'Knowledge base', 'SLA management', 'Customer satisfaction'],
    setup_time: '20 min',
    pricing: 'premium',
    popular: false
  },
  {
    id: 'shipstation-logistics',
    name: 'ShipStation Logistics',
    description: 'Gestion complète des expéditions et tracking',
    category: 'Productivity',
    status: 'available',
    icon: Truck,
    features: ['Multi-carrier shipping', 'Rate comparison', 'Tracking automation', 'Return management'],
    setup_time: '25 min',
    pricing: 'premium',
    popular: true
  },
  {
    id: 'google-analytics-4',
    name: 'Google Analytics 4',
    description: 'Analytics avancées avec machine learning intégré',
    category: 'Analytics',
    status: 'available',
    icon: BarChart3,
    features: ['Enhanced ecommerce', 'Predictive insights', 'Custom funnels', 'Attribution modeling'],
    setup_time: '30 min',
    pricing: 'free',
    popular: true
  },
  {
    id: 'openai-gpt',
    name: 'OpenAI GPT Integration',
    description: 'IA générative pour contenu, support et automatisation',
    category: 'AI',
    status: 'available',
    icon: Bot,
    features: ['Content generation', 'Customer support bot', 'Product descriptions', 'SEO optimization'],
    setup_time: '10 min',
    pricing: 'premium',
    popular: true
  },
  {
    id: 'canva-design',
    name: 'Canva for Business',
    description: 'Création automatisée de visuels marketing',
    category: 'Marketing',
    status: 'available',
    icon: Palette,
    features: ['Template automation', 'Brand kit sync', 'Social media scheduling', 'Video creation'],
    setup_time: '15 min',
    pricing: 'freemium',
    popular: false
  },
  {
    id: 'quickbooks-accounting',
    name: 'QuickBooks Accounting',
    description: 'Comptabilité automatisée avec synchronisation bancaire',
    category: 'Finance',
    status: 'available',
    icon: FileText,
    features: ['Auto invoicing', 'Bank sync', 'Tax preparation', 'Financial reporting'],
    setup_time: '45 min',
    pricing: 'premium',
    popular: false
  },
  {
    id: 'hubspot-crm',
    name: 'HubSpot CRM',
    description: 'CRM complet avec automation marketing',
    category: 'Communication',
    status: 'available',
    icon: Users,
    features: ['Lead scoring', 'Pipeline management', 'Email sequences', 'ROI tracking'],
    setup_time: '35 min',
    pricing: 'freemium',
    popular: true
  },
  {
    id: 'cloudflare-security',
    name: 'Cloudflare Security',
    description: 'Sécurité web avancée et optimisation performances',
    category: 'Productivity',
    status: 'available',
    icon: Shield,
    features: ['DDoS protection', 'Web firewall', 'CDN optimization', 'SSL management'],
    setup_time: '20 min',
    pricing: 'freemium',
    popular: false
  },
  {
    id: 'zapier-automation',
    name: 'Zapier Automation',
    description: 'Automatisation workflow avec 5000+ apps',
    category: 'Productivity',
    status: 'available',
    icon: Zap,
    features: ['Multi-step workflows', 'Conditional logic', 'Error handling', 'Custom webhooks'],
    setup_time: '10 min',
    pricing: 'freemium',
    popular: true
  },
  {
    id: 'airtable-database',
    name: 'Airtable Database',
    description: 'Base de données flexible avec interface no-code',
    category: 'Productivity',
    status: 'available',
    icon: Database,
    features: ['Relational database', 'API integration', 'Form builder', 'Collaboration tools'],
    setup_time: '25 min',
    pricing: 'freemium',
    popular: false
  },
  {
    id: 'tiktok-business',
    name: 'TikTok for Business',
    description: 'Marketing sur TikTok avec pixel et analytics',
    category: 'Marketing',
    status: 'beta',
    icon: Camera,
    features: ['TikTok Shop', 'Pixel tracking', 'Video ads', 'Influencer platform'],
    setup_time: '20 min',
    pricing: 'freemium',
    popular: true
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Collaboration et communication d\'équipe',
    category: 'Communication',
    status: 'coming_soon',
    icon: MessageSquare,
    features: ['Team chat', 'Video meetings', 'File sharing', 'App integration'],
    setup_time: '15 min',
    pricing: 'freemium',
    popular: false
  }
]

export const EnhancedIntegrationsHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { toast } = useToast()
  const { integrations, addIntegration, isAdding } = useRealIntegrations()

  const categories = ['all', 'E-commerce', 'Marketing', 'Analytics', 'Communication', 'Productivity', 'AI', 'Finance']

  const filteredIntegrations = integrationTemplates.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case 'free': return 'bg-green-100 text-green-800'
      case 'freemium': return 'bg-blue-100 text-blue-800'
      case 'premium': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'beta': return 'bg-yellow-100 text-yellow-800'
      case 'coming_soon': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleConnect = (integration: IntegrationTemplate) => {
    if (integration.status === 'coming_soon') {
      toast({
        title: "Bientôt disponible",
        description: `${integration.name} sera bientôt disponible`,
      })
      return
    }

    if (integration.pricing === 'premium') {
      toast({
        title: "Intégration Premium",
        description: `${integration.name} nécessite un abonnement premium`,
        variant: "destructive"
      })
      return
    }

    // Simulate connection
    addIntegration({
      platform_name: integration.name,
      platform_type: integration.id,
      connection_status: 'disconnected',
      is_active: true
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Hub d'Intégrations Avancées
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connectez votre plateforme avec plus de 18 services pour automatiser votre business
        </p>
      </div>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="connected">Mes Intégrations ({integrations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher une intégration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'Toutes' : category}
                </Button>
              ))}
            </div>
          </div>

          {/* Popular Integrations */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Intégrations populaires
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIntegrations.filter(int => int.popular).map(integration => (
                <IntegrationCard 
                  key={integration.id} 
                  integration={integration} 
                  onConnect={handleConnect}
                  isConnecting={isAdding}
                />
              ))}
            </div>
          </div>

          {/* All Integrations */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Toutes les intégrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIntegrations.map(integration => (
                <IntegrationCard 
                  key={integration.id} 
                  integration={integration} 
                  onConnect={handleConnect}
                  isConnecting={isAdding}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="connected" className="space-y-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Vous avez {integrations.length} intégration(s) configurée(s).
            </p>
            <Button className="mt-4" onClick={() => setSelectedCategory('all')}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une intégration
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const IntegrationCard: React.FC<{ 
  integration: IntegrationTemplate
  onConnect: (int: IntegrationTemplate) => void
  isConnecting: boolean
}> = ({ integration, onConnect, isConnecting }) => {
  const Icon = integration.icon

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case 'free': return 'bg-green-100 text-green-800'
      case 'freemium': return 'bg-blue-100 text-blue-800'
      case 'premium': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'beta': return 'bg-yellow-100 text-yellow-800'
      case 'coming_soon': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Setup: {integration.setup_time}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {integration.popular && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Populaire
              </Badge>
            )}
            <Badge 
              variant="outline" 
              className={getStatusColor(integration.status)}
            >
              {integration.status === 'coming_soon' ? 'Bientôt' : integration.status}
            </Badge>
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {integration.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {integration.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {integration.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{integration.features.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Badge 
            variant="outline" 
            className={getPricingColor(integration.pricing)}
          >
            {integration.pricing === 'free' ? 'Gratuit' : 
             integration.pricing === 'freemium' ? 'Freemium' : 'Premium'}
          </Badge>
          <Button 
            onClick={() => onConnect(integration)} 
            size="sm"
            disabled={isConnecting || integration.status === 'coming_soon'}
          >
            {integration.status === 'coming_soon' ? 'Bientôt' : 'Connecter'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}