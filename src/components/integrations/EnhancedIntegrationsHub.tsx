import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useIntegrations, type IntegrationTemplate } from '@/hooks/useIntegrations'
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

const integrationTemplates: IntegrationTemplate[] = [
  // Marketing
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Synchronisation automatique des campagnes publicitaires Google',
    category: 'marketing',
    icon: Search,
    status: 'available',
    premium: false,
    rating: 4.8,
    installs: 25000,
    features: ['Auto-bidding', 'Conversion tracking', 'Audience sync']
  },
  {
    id: 'meta-business',
    name: 'Meta Business',
    description: 'Intégration Facebook & Instagram Ads avec pixel tracking',
    category: 'marketing',
    icon: MessageSquare,
    status: 'available',
    premium: false,
    rating: 4.7,
    installs: 22000,
    features: ['Pixel automatique', 'Catalogue produits', 'Retargeting']
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing automatisé avec segmentation IA',
    category: 'marketing',
    icon: Mail,
    status: 'available',
    premium: false,
    rating: 4.6,
    installs: 18000,
    features: ['Automation flows', 'A/B testing', 'Segmentation']
  },
  
  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    description: 'Tracking e-commerce avancé et attribution multi-canal',
    category: 'analytics',
    icon: BarChart3,
    status: 'available',
    premium: false,
    rating: 4.7,
    installs: 30000,
    features: ['Enhanced ecommerce', 'Custom dimensions', 'Audiences']
  },
  
  // Payment
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Paiements en ligne sécurisés avec 40+ méthodes',
    category: 'payment',
    icon: CreditCard,
    status: 'available',
    premium: false,
    rating: 4.9,
    installs: 35000,
    features: ['40+ payment methods', 'Subscriptions', 'Fraud protection']
  },
  
  // AI
  {
    id: 'openai-gpt',
    name: 'OpenAI GPT',
    description: 'IA générative pour descriptions produits et contenu',
    category: 'ai',
    icon: Bot,
    status: 'available',
    premium: true,
    rating: 4.8,
    installs: 11000,
    features: ['Product descriptions', 'SEO content', 'Translation']
  },

  // Security
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Protection DDoS et accélération CDN',
    category: 'security',
    icon: Shield,
    status: 'available',
    premium: false,
    rating: 4.8,
    installs: 25500,
    features: ['DDoS protection', 'CDN', 'SSL certificates']
  }
]

export const EnhancedIntegrationsHub: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showConnectedOnly, setShowConnectedOnly] = useState(false)
  const [connectionDialog, setConnectionDialog] = useState<{ open: boolean; template?: IntegrationTemplate }>({ open: false })
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const { integrations, loading, connectIntegration, disconnectIntegration } = useIntegrations()

  const categories = ['all', 'Marketing', 'Analytics', 'Payment', 'Communication', 'AI', 'Automation', 'Security']

  const filteredTemplates = integrationTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const isConnected = integrations.some(int => int.platform_name === template.name)
    const matchesConnection = !showConnectedOnly || isConnected
    
    return matchesCategory && matchesSearch && matchesConnection
  })

  const handleConnect = async (template: IntegrationTemplate) => {
    if (template.premium && template.status !== 'available') {
      toast({
        title: "Fonctionnalité Premium",
        description: `${template.name} nécessite un abonnement Pro ou Ultra`,
        variant: "destructive"
      })
      return
    }

    setConnectionDialog({ open: true, template })
    setCredentials({})
  }

  const handleSaveConnection = async () => {
    if (!connectionDialog.template) return
    
    const success = await connectIntegration(connectionDialog.template, credentials)
    if (success) {
      setConnectionDialog({ open: false })
    }
  }

  const handleDisconnect = async (template: IntegrationTemplate) => {
    const connectedIntegration = integrations.find(int => int.platform_name === template.name)
    if (connectedIntegration) {
      await disconnectIntegration(connectedIntegration.id)
    }
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

  const connectedCount = integrations.length
  const totalInstalls = integrationTemplates.reduce((sum, i) => sum + i.installs, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

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
              <div className="text-2xl font-bold text-primary">{integrationTemplates.length}</div>
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
              {filteredTemplates.map((template) => {
                const Icon = template.icon
                const isConnected = integrations.some(int => int.platform_name === template.name)
                
                return (
                  <Card key={template.id} className="relative hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(template.status)}`} />
                              <span className="text-xs text-muted-foreground">
                                {template.status === 'available' ? 'Disponible' : 
                                 template.status === 'beta' ? 'Bêta' : 'Bientôt'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {template.premium && (
                            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs">
                              Premium
                            </Badge>
                          )}
                          {isConnected && (
                            <Badge variant="default" className="bg-green-500 text-white text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Connecté
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="mt-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{template.rating}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {template.installs.toLocaleString()} installations
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {template.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {isConnected ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleDisconnect(template)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Déconnecter
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleConnect(template)}
                            disabled={template.premium && template.status !== 'available'}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Connecter
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Connection Dialog */}
      <Dialog open={connectionDialog.open} onOpenChange={(open) => setConnectionDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connecter {connectionDialog.template?.name}</DialogTitle>
            <DialogDescription>
              Configurez votre intégration avec {connectionDialog.template?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Clé API</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Entrez votre clé API"
                value={credentials.apiKey || ''}
                onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConnectionDialog({ open: false })}>
                Annuler
              </Button>
              <Button onClick={handleSaveConnection}>
                Connecter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}