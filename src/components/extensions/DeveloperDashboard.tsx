import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Code, 
  DollarSign, 
  Download, 
  Star, 
  TrendingUp, 
  Package, 
  Users, 
  BarChart3,
  Settings,
  Plus,
  Eye,
  Edit,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { productionLogger } from '@/utils/productionLogger'

// Mock developer data
const DEVELOPER_DATA = {
  profile: {
    id: 'dev-123',
    name: 'DataInsights Pro',
    email: 'contact@datainsights.dev',
    verified: true,
    joined: '2023-06-15',
    tier: 'Gold Partner',
    total_revenue: 15420.50,
    total_downloads: 45678,
    extensions_count: 8,
    average_rating: 4.7
  },
  extensions: [
    {
      id: 'advanced-analytics-suite',
      name: 'Advanced Analytics Suite',
      category: 'analytics',
      status: 'published',
      price: 79.99,
      pricing_model: 'monthly',
      downloads: 6789,
      rating: 4.9,
      reviews_count: 1567,
      revenue_this_month: 8543.20,
      created_at: '2023-08-01',
      last_updated: '2024-01-22',
      version: '4.2.1'
    },
    {
      id: 'smart-inventory-manager',
      name: 'Smart Inventory Manager',
      category: 'inventory',
      status: 'published',
      price: 49.99,
      pricing_model: 'monthly',
      downloads: 3421,
      rating: 4.6,
      reviews_count: 892,
      revenue_this_month: 4234.60,
      created_at: '2023-09-15',
      last_updated: '2024-01-18',
      version: '2.1.0'
    },
    {
      id: 'conversion-optimizer-ai',
      name: 'Conversion Optimizer AI',
      category: 'ai_enhancement',
      status: 'pending_review',
      price: 29.99,
      pricing_model: 'monthly',
      downloads: 0,
      rating: 0,
      reviews_count: 0,
      revenue_this_month: 0,
      created_at: '2024-01-20',
      last_updated: '2024-01-20',
      version: '1.0.0'
    }
  ],
  analytics: {
    revenue_history: [
      { month: 'Sep 2023', revenue: 2340.50 },
      { month: 'Oct 2023', revenue: 3456.80 },
      { month: 'Nov 2023', revenue: 4123.20 },
      { month: 'Dec 2023', revenue: 5432.10 },
      { month: 'Jan 2024', revenue: 6789.40 }
    ],
    top_countries: [
      { country: 'France', percentage: 35, revenue: 4523.20 },
      { country: 'Germany', percentage: 22, revenue: 2876.50 },
      { country: 'UK', percentage: 18, revenue: 2341.80 },
      { country: 'Spain', percentage: 15, revenue: 1956.30 },
      { country: 'Others', percentage: 10, revenue: 1302.20 }
    ]
  },
  payouts: [
    {
      id: 'payout-jan-2024',
      period: 'Janvier 2024',
      amount: 4752.58, // 70% of revenue
      status: 'paid',
      paid_date: '2024-02-01',
      extensions_revenue: {
        'advanced-analytics-suite': 3456.20,
        'smart-inventory-manager': 1296.38
      }
    },
    {
      id: 'payout-dec-2023',
      period: 'Décembre 2023',
      amount: 3802.47,
      status: 'paid',
      paid_date: '2024-01-01',
      extensions_revenue: {
        'advanced-analytics-suite': 2841.60,
        'smart-inventory-manager': 960.87
      }
    }
  ]
}

export const DeveloperDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedExtension, setSelectedExtension] = useState<any>(null)

  const handlePublishExtension = async (extensionId: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Non authentifié')
        return
      }
      
      // Mettre à jour le statut de l'extension
      const { error } = await supabase
        .from('integrations')
        .update({ 
          status: 'pending_review',
          config: { submitted_at: new Date().toISOString() }
        })
        .eq('id', extensionId)
        .eq('user_id', user.id)
      
      if (error) throw error
      toast.success('Extension soumise pour révision !')
    } catch (error) {
      console.error('Erreur publication:', error)
      toast.error('Erreur lors de la publication')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Publiée</Badge>
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En révision</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Rejetée</Badge>
      default:
        return <Badge variant="outline">Brouillon</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Developer Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 rounded-2xl text-white">
        <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <Code className="h-8 w-8" />
                Developer Dashboard
              </h1>
              <p className="text-xl opacity-90 mt-2">
                {DEVELOPER_DATA.profile.name} • {DEVELOPER_DATA.profile.tier}
              </p>
            </div>
            {DEVELOPER_DATA.profile.verified && (
              <Badge className="bg-white/20 text-white border-white/30">
                <CheckCircle className="h-4 w-4 mr-2" />
                Développeur Vérifié
              </Badge>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">{DEVELOPER_DATA.profile.total_revenue.toLocaleString()}€</div>
              <div className="text-sm opacity-80">Revenus Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">{DEVELOPER_DATA.profile.total_downloads.toLocaleString()}</div>
              <div className="text-sm opacity-80">Téléchargements</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">{DEVELOPER_DATA.profile.extensions_count}</div>
              <div className="text-sm opacity-80">Extensions</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">{DEVELOPER_DATA.profile.average_rating}</div>
              <div className="text-sm opacity-80">Note Moyenne</div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="payouts">Paiements</TabsTrigger>
          <TabsTrigger value="sdk">SDK & Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue This Month */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Revenus ce mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {DEVELOPER_DATA.extensions.reduce((sum, ext) => sum + ext.revenue_this_month, 0).toLocaleString()}€
                </div>
                <div className="text-sm text-muted-foreground">
                  +23% vs mois dernier
                </div>
                <Progress value={76} className="mt-3" />
              </CardContent>
            </Card>

            {/* Active Extensions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  Extensions Actives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {DEVELOPER_DATA.extensions.filter(ext => ext.status === 'published').length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {DEVELOPER_DATA.extensions.filter(ext => ext.status === 'pending_review').length} en révision
                </div>
                <Progress value={75} className="mt-3" />
              </CardContent>
            </Card>

            {/* Recent Downloads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-purple-500" />
                  Téléchargements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  2.4k
                </div>
                <div className="text-sm text-muted-foreground">
                  Cette semaine
                </div>
                <Progress value={60} className="mt-3" />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Advanced Analytics Suite v4.2.1 approuvée</p>
                    <p className="text-sm text-muted-foreground">Votre mise à jour a été approuvée et est maintenant live</p>
                    <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Paiement de 4,752.58€ effectué</p>
                    <p className="text-sm text-muted-foreground">Revenus de janvier transférés sur votre compte</p>
                    <p className="text-xs text-muted-foreground">Il y a 1 jour</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Conversion Optimizer AI en révision</p>
                    <p className="text-sm text-muted-foreground">Votre extension est en cours d'examen par notre équipe</p>
                    <p className="text-xs text-muted-foreground">Il y a 3 jours</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extensions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Mes Extensions</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Extension
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEVELOPER_DATA.extensions.map(extension => (
              <Card key={extension.id} className="group hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{extension.name}</CardTitle>
                      <CardDescription className="capitalize">{extension.category}</CardDescription>
                    </div>
                    {getStatusBadge(extension.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{extension.downloads.toLocaleString()}</div>
                      <div className="text-muted-foreground">Téléchargements</div>
                    </div>
                    <div>
                      <div className="font-medium">{extension.revenue_this_month.toLocaleString()}€</div>
                      <div className="text-muted-foreground">Ce mois</div>
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {extension.rating}
                      </div>
                      <div className="text-muted-foreground">{extension.reviews_count} avis</div>
                    </div>
                    <div>
                      <div className="font-medium">v{extension.version}</div>
                      <div className="text-muted-foreground">Version</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="font-bold text-lg">{extension.price}€</div>
                    <div className="text-sm text-muted-foreground">/{extension.pricing_model}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEVELOPER_DATA.analytics.revenue_history.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.month}</span>
                      <span className="text-sm font-bold">{item.revenue.toLocaleString()}€</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Countries Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Pays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {DEVELOPER_DATA.analytics.top_countries.map((country, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{country.country}</span>
                        <span className="font-medium">{country.percentage}%</span>
                      </div>
                      <Progress value={country.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Paiements</CardTitle>
              <CardDescription>
                Paiements mensuels (70% des revenus, versés le 1er de chaque mois)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEVELOPER_DATA.payouts.map(payout => (
                  <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{payout.period}</div>
                      <div className="text-sm text-muted-foreground">
                        Payé le {new Date(payout.paid_date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-green-600">
                        {payout.amount.toLocaleString()}€
                      </div>
                      <Badge className="bg-green-100 text-green-800">Payé</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  SDK JavaScript
                </CardTitle>
                <CardDescription>
                  SDK officiel pour développer des extensions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  npm install @lovable/extensions-sdk
                </div>
                <Button className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Documentation complète
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  CLI Tools
                </CardTitle>
                <CardDescription>
                  Outils en ligne de commande pour le développement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  npx create-lovable-extension
                </div>
                <Button className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Guide CLI
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Exemples de Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm">
{`import { createExtension, LovableExtensionsSDK } from '@lovable/extensions-sdk'

const myExtension = createExtension({
  name: 'my-awesome-extension',
  display_name: 'My Awesome Extension',
  description: 'Une extension incroyable pour...',
  category: 'ai_enhancement',
  version: '1.0.0',
  permissions: {
    read_products: true,
    write_products: true,
    ai_processing: true
  }
}, {
  async onInstall() {
    logAction('Extension installée');
  },
  
  async onActivate() {
    const sdk = this.sdk
    const products = await sdk.products.list({ limit: 10 })
    logAction('Produits récupérés', { count: products.length });
  }
})`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}