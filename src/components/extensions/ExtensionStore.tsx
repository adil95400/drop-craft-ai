import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Star, 
  Download, 
  TrendingUp,
  Clock,
  Zap,
  Shield,
  Palette,
  BarChart3,
  ShoppingCart,
  MessageSquare,
  Settings,
  Code,
  Globe,
  Smartphone,
  Mail,
  Lock,
  Crown,
  Filter,
  Users,
  Check
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Extension {
  id: string
  name: string
  description: string
  shortDescription: string
  category: 'Productivity' | 'Marketing' | 'Analytics' | 'Security' | 'UI/UX' | 'Integration' | 'AI' | 'Mobile'
  icon: any
  developer: {
    name: string
    avatar: string
    verified: boolean
  }
  version: string
  rating: number
  reviews: number
  downloads: number
  price: number // 0 = free
  screenshots: string[]
  features: string[]
  permissions: string[]
  lastUpdated: string
  compatibility: string[]
  size: string
  installed: boolean
  trending: boolean
  featured: boolean
}

const mockExtensions: Extension[] = [
  {
    id: 'ai-product-descriptions',
    name: 'AI Product Descriptions',
    description: 'Generate compelling product descriptions using advanced AI. Supports multiple languages and SEO optimization.',
    shortDescription: 'AI-powered product descriptions with SEO',
    category: 'AI',
    icon: Zap,
    developer: {
      name: 'OpenAI Partners',
      avatar: '/avatars/openai.jpg',
      verified: true
    },
    version: '2.1.4',
    rating: 4.9,
    reviews: 1250,
    downloads: 15000,
    price: 29.99,
    screenshots: ['/screenshots/ai-desc1.jpg', '/screenshots/ai-desc2.jpg'],
    features: ['Multi-language support', 'SEO optimization', 'Bulk generation', 'Custom prompts'],
    permissions: ['Product data access', 'API calls'],
    lastUpdated: '2024-01-15',
    compatibility: ['Shopify', 'WooCommerce', 'Magento'],
    size: '2.1 MB',
    installed: false,
    trending: true,
    featured: true
  },
  {
    id: 'smart-inventory',
    name: 'Smart Inventory Manager',
    description: 'Advanced inventory management with predictive analytics and automated reordering.',
    shortDescription: 'Predictive inventory management',
    category: 'Analytics',
    icon: BarChart3,
    developer: {
      name: 'DataFlow Solutions',
      avatar: '/avatars/dataflow.jpg',
      verified: true
    },
    version: '1.8.2',
    rating: 4.7,
    reviews: 890,
    downloads: 12000,
    price: 0, // Free
    screenshots: ['/screenshots/inventory1.jpg'],
    features: ['Predictive analytics', 'Auto-reordering', 'Multi-warehouse', 'Real-time sync'],
    permissions: ['Inventory access', 'Order data'],
    lastUpdated: '2024-01-10',
    compatibility: ['All platforms'],
    size: '3.5 MB',
    installed: true,
    trending: false,
    featured: false
  },
  {
    id: 'social-proof-widget',
    name: 'Social Proof Widgets',
    description: 'Display real-time social proof notifications to boost conversions and build trust.',
    shortDescription: 'Real-time social proof notifications',
    category: 'Marketing',
    icon: TrendingUp,
    developer: {
      name: 'ConvertLabs',
      avatar: '/avatars/convertlabs.jpg',
      verified: false
    },
    version: '3.2.1',
    rating: 4.5,
    reviews: 2100,
    downloads: 25000,
    price: 19.99,
    screenshots: ['/screenshots/social1.jpg', '/screenshots/social2.jpg'],
    features: ['Real-time notifications', 'Customizable design', 'A/B testing', 'Analytics'],
    permissions: ['Customer data', 'Order history'],
    lastUpdated: '2024-01-12',
    compatibility: ['Shopify', 'WooCommerce'],
    size: '1.8 MB',
    installed: false,
    trending: true,
    featured: false
  },
  {
    id: 'advanced-security',
    name: 'Advanced Security Suite',
    description: 'Comprehensive security solution with fraud detection, DDoS protection, and vulnerability scanning.',
    shortDescription: 'Complete security protection suite',
    category: 'Security',
    icon: Shield,
    developer: {
      name: 'SecureShield Inc.',
      avatar: '/avatars/secureshield.jpg',
      verified: true
    },
    version: '4.0.1',
    rating: 4.8,
    reviews: 750,
    downloads: 8500,
    price: 49.99,
    screenshots: ['/screenshots/security1.jpg'],
    features: ['Fraud detection', 'DDoS protection', 'Vulnerability scan', '2FA integration'],
    permissions: ['System access', 'Network monitoring'],
    lastUpdated: '2024-01-08',
    compatibility: ['Enterprise only'],
    size: '8.2 MB',
    installed: false,
    trending: false,
    featured: true
  },
  {
    id: 'mobile-app-builder',
    name: 'Mobile App Builder',
    description: 'Create native mobile apps for your store without coding. iOS and Android supported.',
    shortDescription: 'No-code mobile app builder',
    category: 'Mobile',
    icon: Smartphone,
    developer: {
      name: 'AppCraft Studios',
      avatar: '/avatars/appcraft.jpg',
      verified: true
    },
    version: '2.5.0',
    rating: 4.6,
    reviews: 1600,
    downloads: 18000,
    price: 99.99,
    screenshots: ['/screenshots/mobile1.jpg', '/screenshots/mobile2.jpg'],
    features: ['Native iOS/Android', 'Push notifications', 'Offline mode', 'App Store ready'],
    permissions: ['Full store access', 'Customer data'],
    lastUpdated: '2024-01-14',
    compatibility: ['Shopify Plus', 'WooCommerce'],
    size: '12.4 MB',
    installed: false,
    trending: true,
    featured: true
  },
  {
    id: 'email-designer',
    name: 'Email Template Designer',
    description: 'Drag-and-drop email template builder with automation workflows and A/B testing.',
    shortDescription: 'Professional email template builder',
    category: 'Marketing',
    icon: Mail,
    developer: {
      name: 'EmailPro',
      avatar: '/avatars/emailpro.jpg',
      verified: false
    },
    version: '1.9.3',
    rating: 4.4,
    reviews: 980,
    downloads: 14000,
    price: 24.99,
    screenshots: ['/screenshots/email1.jpg'],
    features: ['Drag-and-drop builder', 'Automation workflows', 'A/B testing', 'Mobile responsive'],
    permissions: ['Customer emails', 'Campaign data'],
    lastUpdated: '2024-01-11',
    compatibility: ['Mailchimp', 'Klaviyo', 'SendGrid'],
    size: '4.2 MB',
    installed: false,
    trending: false,
    featured: false
  },
  {
    id: 'theme-customizer',
    name: 'Advanced Theme Customizer',
    description: 'Visual theme editor with real-time preview and custom CSS injection capabilities.',
    shortDescription: 'Visual theme editor and customizer',
    category: 'UI/UX',
    icon: Palette,
    developer: {
      name: 'ThemeForge',
      avatar: '/avatars/themeforge.jpg',
      verified: true
    },
    version: '3.1.2',
    rating: 4.7,
    reviews: 1120,
    downloads: 16500,
    price: 39.99,
    screenshots: ['/screenshots/theme1.jpg', '/screenshots/theme2.jpg'],
    features: ['Visual editor', 'Real-time preview', 'Custom CSS', 'Mobile optimization'],
    permissions: ['Theme files', 'Store design'],
    lastUpdated: '2024-01-13',
    compatibility: ['Shopify', 'WooCommerce', 'BigCommerce'],
    size: '6.8 MB',
    installed: false,
    trending: false,
    featured: false
  },
  {
    id: 'chatbot-ai',
    name: 'AI Customer Support Bot',
    description: 'Intelligent chatbot with natural language processing and order management capabilities.',
    shortDescription: 'AI-powered customer support chatbot',
    category: 'AI',
    icon: MessageSquare,
    developer: {
      name: 'ChatGenius AI',
      avatar: '/avatars/chatgenius.jpg',
      verified: true
    },
    version: '2.3.1',
    rating: 4.8,
    reviews: 890,
    downloads: 11000,
    price: 34.99,
    screenshots: ['/screenshots/chatbot1.jpg'],
    features: ['Natural language processing', 'Order management', 'Multi-language', 'Analytics'],
    permissions: ['Customer conversations', 'Order data'],
    lastUpdated: '2024-01-09',
    compatibility: ['All platforms'],
    size: '5.1 MB',
    installed: false,
    trending: true,
    featured: false
  },
  {
    id: 'api-integrator',
    name: 'Universal API Integrator',
    description: 'Connect any REST API to your store with visual workflow builder and data mapping.',
    shortDescription: 'Visual API integration tool',
    category: 'Integration',
    icon: Code,
    developer: {
      name: 'IntegrationHub',
      avatar: '/avatars/integration.jpg',
      verified: true
    },
    version: '1.6.4',
    rating: 4.5,
    reviews: 560,
    downloads: 7800,
    price: 59.99,
    screenshots: ['/screenshots/api1.jpg', '/screenshots/api2.jpg'],
    features: ['Visual workflow builder', 'Data mapping', 'Error handling', 'Webhook support'],
    permissions: ['External API access', 'Data sync'],
    lastUpdated: '2024-01-07',
    compatibility: ['Enterprise platforms'],
    size: '9.3 MB',
    installed: false,
    trending: false,
    featured: false
  },
  {
    id: 'performance-optimizer',
    name: 'Performance Optimizer Pro',
    description: 'Comprehensive performance optimization with image compression, caching, and CDN integration.',
    shortDescription: 'Complete performance optimization suite',
    category: 'Productivity',
    icon: Zap,
    developer: {
      name: 'SpeedBoost Tech',
      avatar: '/avatars/speedboost.jpg',
      verified: true
    },
    version: '2.8.1',
    rating: 4.9,
    reviews: 1890,
    downloads: 22000,
    price: 0, // Free
    screenshots: ['/screenshots/performance1.jpg'],
    features: ['Image compression', 'Smart caching', 'CDN integration', 'Core Web Vitals'],
    permissions: ['Site performance', 'File access'],
    lastUpdated: '2024-01-16',
    compatibility: ['All platforms'],
    size: '3.2 MB',
    installed: true,
    trending: true,
    featured: true
  },
  {
    id: 'analytics-dashboard',
    name: 'Advanced Analytics Dashboard',
    description: 'Custom analytics dashboard with advanced metrics, cohort analysis, and predictive insights.',
    shortDescription: 'Professional analytics and reporting',
    category: 'Analytics',
    icon: BarChart3,
    developer: {
      name: 'DataViz Pro',
      avatar: '/avatars/dataviz.jpg',
      verified: false
    },
    version: '1.4.2',
    rating: 4.6,
    reviews: 720,
    downloads: 9500,
    price: 44.99,
    screenshots: ['/screenshots/analytics1.jpg', '/screenshots/analytics2.jpg'],
    features: ['Custom dashboards', 'Cohort analysis', 'Predictive insights', 'Export reports'],
    permissions: ['Analytics data', 'Customer insights'],
    lastUpdated: '2024-01-06',
    compatibility: ['Google Analytics', 'Mixpanel'],
    size: '7.6 MB',
    installed: false,
    trending: false,
    featured: false
  },
  {
    id: 'loyalty-rewards',
    name: 'Loyalty & Rewards Program',
    description: 'Comprehensive loyalty program with points, tiers, referrals, and gamification features.',
    shortDescription: 'Complete customer loyalty solution',
    category: 'Marketing',
    icon: Crown,
    developer: {
      name: 'LoyaltyMax',
      avatar: '/avatars/loyaltymax.jpg',
      verified: true
    },
    version: '3.5.0',
    rating: 4.7,
    reviews: 1450,
    downloads: 19000,
    price: 39.99,
    screenshots: ['/screenshots/loyalty1.jpg'],
    features: ['Points system', 'Tier management', 'Referral program', 'Gamification'],
    permissions: ['Customer data', 'Order history'],
    lastUpdated: '2024-01-15',
    compatibility: ['Shopify', 'WooCommerce', 'Magento'],
    size: '5.8 MB',
    installed: false,
    trending: true,
    featured: true
  }
]

export const ExtensionStore: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest' | 'price'>('popular')
  const { toast } = useToast()

  const categories = ['all', 'Productivity', 'Marketing', 'Analytics', 'Security', 'UI/UX', 'Integration', 'AI', 'Mobile']

  const filteredExtensions = mockExtensions
    .filter(ext => {
      const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory
      const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ext.developer.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular': return b.downloads - a.downloads
        case 'rating': return b.rating - a.rating
        case 'newest': return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        case 'price': return a.price - b.price
        default: return 0
      }
    })

  const handleInstall = async (extension: Extension) => {
    if (extension.installed) {
      toast({
        title: "Déjà installé",
        description: `${extension.name} est déjà installé`
      })
      return
    }

    toast({
      title: "Installation en cours...",
      description: `Installation de ${extension.name}`
    })

    // Simulate installation
    setTimeout(() => {
      toast({
        title: "Extension installée",
        description: `${extension.name} a été installé avec succès`
      })
    }, 2000)
  }

  const featuredExtensions = mockExtensions.filter(ext => ext.featured).slice(0, 3)
  const trendingExtensions = mockExtensions.filter(ext => ext.trending).slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Extension Store</h1>
        <p className="text-muted-foreground">
          Découvrez des extensions puissantes pour booster votre e-commerce
        </p>
      </div>

      {/* Featured Extensions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">Extensions Vedettes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredExtensions.map(ext => (
            <Card key={ext.id} className="relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                  Vedette
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ext.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{ext.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{ext.rating}</span>
                      <span>•</span>
                      <span>{ext.downloads.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{ext.shortDescription}</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {ext.price === 0 ? 'Gratuit' : `${ext.price}€`}
                  </span>
                  <Button size="sm" onClick={() => handleInstall(ext)}>
                    {ext.installed ? 'Installé' : 'Installer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Trending Extensions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-semibold">Tendances</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingExtensions.map(ext => (
            <Card key={ext.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-2">
                  <ext.icon className="w-5 h-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{ext.name}</h3>
                    <p className="text-xs text-muted-foreground">{ext.developer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{ext.rating}</span>
                  <Badge variant="outline" className="text-xs">
                    {ext.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des extensions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="popular">Plus populaire</option>
                <option value="rating">Mieux notées</option>
                <option value="newest">Plus récentes</option>
                <option value="price">Prix croissant</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-5 lg:grid-cols-9">
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="text-xs">
              {category === 'all' ? 'Toutes' : category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExtensions.map((extension) => (
                <Card key={extension.id} className="relative hover:shadow-lg transition-shadow">
                  {extension.trending && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Tendance
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <extension.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{extension.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={extension.developer.avatar} />
                              <AvatarFallback className="text-xs">
                                {extension.developer.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {extension.developer.name}
                            </span>
                            {extension.developer.verified && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Vérifié
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <CardDescription className="line-clamp-2">
                      {extension.shortDescription}
                    </CardDescription>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{extension.rating}</span>
                          <span className="text-muted-foreground">({extension.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Download className="w-4 h-4" />
                          <span>{extension.downloads.toLocaleString()}</span>
                        </div>
                      </div>
                      <Badge variant="outline">v{extension.version}</Badge>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {extension.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {extension.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{extension.features.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Price & Install */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-lg font-semibold">
                        {extension.price === 0 ? (
                          <span className="text-green-600">Gratuit</span>
                        ) : (
                          <span>{extension.price}€</span>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleInstall(extension)}
                        variant={extension.installed ? "outline" : "default"}
                        disabled={extension.installed}
                      >
                        {extension.installed ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Installé
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Installer
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredExtensions.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune extension trouvée</h3>
                <p className="text-muted-foreground">
                  Essayez de modifier votre recherche ou vos filtres
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}