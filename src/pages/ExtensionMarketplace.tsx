import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, 
  Star, 
  Download, 
  TrendingUp,
  Crown,
  Filter,
  Grid,
  List,
  ShoppingBag,
  Zap,
  BarChart3,
  Shield,
  Palette,
  Code,
  MessageSquare,
  Smartphone,
  Mail,
  Users,
  Eye,
  Heart
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'

const categories = [
  { id: 'all', name: 'Toutes', icon: Grid, count: 1250 },
  { id: 'marketing', name: 'Marketing', icon: TrendingUp, count: 234 },
  { id: 'analytics', name: 'Analytics', icon: BarChart3, count: 156 },
  { id: 'productivity', name: 'Productivité', icon: Zap, count: 189 },
  { id: 'security', name: 'Sécurité', icon: Shield, count: 78 },
  { id: 'design', name: 'Design', icon: Palette, count: 145 },
  { id: 'integration', name: 'Intégration', icon: Code, count: 167 },
  { id: 'ai', name: 'Intelligence Artificielle', icon: MessageSquare, count: 89 },
  { id: 'mobile', name: 'Mobile', icon: Smartphone, count: 67 }
]

const featuredExtensions = [
  {
    id: 'ai-optimizer',
    name: 'AI Product Optimizer',
    description: 'Optimise automatiquement vos descriptions produits avec l\'IA',
    developer: 'OpenAI Labs',
    avatar: '/avatars/openai.jpg',
    rating: 4.9,
    reviews: 1250,
    downloads: 15600,
    price: 29.99,
    category: 'ai',
    featured: true,
    trending: true,
    verified: true
  },
  {
    id: 'social-proof',
    name: 'Social Proof Master',
    description: 'Affichez des notifications de vente en temps réel',
    developer: 'ConvertPro',
    avatar: '/avatars/convert.jpg',
    rating: 4.8,
    reviews: 890,
    downloads: 12400,
    price: 19.99,
    category: 'marketing',
    featured: true,
    trending: true,
    verified: false
  },
  {
    id: 'analytics-pro',
    name: 'Analytics Dashboard Pro',
    description: 'Tableau de bord analytics avancé avec prédictions IA',
    developer: 'DataViz Inc',
    avatar: '/avatars/dataviz.jpg',
    rating: 4.7,
    reviews: 654,
    downloads: 8900,
    price: 0,
    category: 'analytics',
    featured: true,
    trending: false,
    verified: true
  }
]

const trendingExtensions = [
  {
    id: 'inventory-ai',
    name: 'Smart Inventory Manager',
    description: 'Gestion intelligente des stocks avec prédictions',
    developer: 'StockGenius',
    rating: 4.6,
    price: 24.99,
    growth: '+127%'
  },
  {
    id: 'email-designer',
    name: 'Email Template Builder',
    description: 'Créateur d\'emails drag & drop professionnel',
    developer: 'MailCraft',
    rating: 4.5,
    price: 14.99,
    growth: '+98%'
  },
  {
    id: 'mobile-app',
    name: 'Mobile App Generator',
    description: 'Créez votre app mobile sans coder',
    developer: 'AppMaker Pro',
    rating: 4.8,
    price: 99.99,
    growth: '+156%'
  }
]

export default function ExtensionMarketplace() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('popular')

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-background">
      <Helmet>
        <title>Marketplace Extensions - Drop Craft AI</title>
        <meta name="description" content="Découvrez et installez des extensions puissantes pour votre boutique e-commerce. Analytics, marketing, IA et plus encore." />
      </Helmet>

      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">Marketplace Extensions</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Boostez votre e-commerce
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez plus de 1 250 extensions premium pour optimiser vos ventes, 
            automatiser vos tâches et améliorer l'expérience client.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary">1,250+</div>
            <div className="text-sm text-muted-foreground">Extensions</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-green-600">50k+</div>
            <div className="text-sm text-muted-foreground">Téléchargements</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">4.8⭐</div>
            <div className="text-sm text-muted-foreground">Note moyenne</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-purple-600">125</div>
            <div className="text-sm text-muted-foreground">Développeurs</div>
          </Card>
        </div>

        {/* Featured Extensions */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Extensions Vedettes</h2>
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">Editor's Choice</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredExtensions.map(ext => (
              <Card key={ext.id} className="group hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    Vedette
                  </Badge>
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={ext.avatar} />
                      <AvatarFallback>{ext.developer[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {ext.name}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>{ext.developer}</span>
                        {ext.verified && (
                          <Badge variant="outline" className="text-xs px-1">Vérifié</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ext.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{ext.rating}</span>
                      <span className="text-muted-foreground">({ext.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{ext.downloads.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold">
                      {ext.price === 0 ? 'Gratuit' : `${ext.price}€`}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80">
                        Installer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trending Extensions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold">Tendances</h2>
              <Badge className="bg-green-500">🔥 Populaire</Badge>
            </div>
            <Button variant="outline" onClick={() => navigate('/extensions/developer')}>
              Voir tout
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trendingExtensions.map((ext, idx) => (
              <Card key={ext.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{ext.name}</h3>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {ext.growth}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{ext.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{ext.rating}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {ext.price === 0 ? 'Gratuit' : `${ext.price}€`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Grid className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Parcourir par Catégorie</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.slice(1).map(category => {
              const Icon = category.icon
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-4 text-center">
                    <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} extensions</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Devenez Développeur d'Extensions</h2>
            <p className="text-lg opacity-90 mb-6">
              Créez et vendez vos propres extensions. Rejoignez notre communauté de développeurs 
              et monétisez vos innovations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" onClick={() => navigate('/extensions/developer')}>
                <Code className="w-5 h-5 mr-2" />
                Devenir Développeur
              </Button>
              <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                <Users className="w-5 h-5 mr-2" />
                Rejoindre la Communauté
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}