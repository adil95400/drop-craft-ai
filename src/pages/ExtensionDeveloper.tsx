import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Code2, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Star,
  Download,
  Eye,
  Settings,
  Upload,
  GitBranch,
  Terminal,
  BookOpen,
  Lightbulb,
  Zap,
  Shield,
  Globe,
  Award,
  Plus,
  BarChart3,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'

const developerStats = {
  totalRevenue: 12450,
  monthlyRevenue: 3200,
  totalDownloads: 45600,
  monthlyDownloads: 8900,
  activeExtensions: 12,
  averageRating: 4.7,
  totalReviews: 1250,
  conversionRate: 12.5
}

const myExtensions = [
  {
    id: 'ai-optimizer',
    name: 'AI Product Optimizer',
    status: 'published',
    version: '2.1.0',
    downloads: 15600,
    revenue: 4680,
    rating: 4.9,
    reviews: 312,
    lastUpdate: '2024-01-15',
    category: 'AI',
    price: 29.99
  },
  {
    id: 'social-proof',
    name: 'Social Proof Master',
    status: 'published',
    version: '1.8.5',
    downloads: 8900,
    revenue: 1780,
    rating: 4.6,
    reviews: 178,
    lastUpdate: '2024-01-12',
    category: 'Marketing',
    price: 19.99
  },
  {
    id: 'analytics-pro',
    name: 'Analytics Dashboard Pro',
    status: 'review',
    version: '3.0.0',
    downloads: 0,
    revenue: 0,
    rating: 0,
    reviews: 0,
    lastUpdate: '2024-01-16',
    category: 'Analytics',
    price: 39.99
  },
  {
    id: 'inventory-ai',
    name: 'Smart Inventory',
    status: 'draft',
    version: '1.0.0',
    downloads: 0,
    revenue: 0,
    rating: 0,
    reviews: 0,
    lastUpdate: '2024-01-14',
    category: 'Productivity',
    price: 24.99
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-800'
    case 'review': return 'bg-yellow-100 text-yellow-800'
    case 'draft': return 'bg-gray-100 text-gray-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'published': return <CheckCircle className="w-4 h-4" />
    case 'review': return <Clock className="w-4 h-4" />
    case 'draft': return <FileText className="w-4 h-4" />
    case 'rejected': return <AlertCircle className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

export default function ExtensionDeveloper() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-background">
      <Helmet>
        <title>Développeur Extensions - Drop Craft AI</title>
        <meta name="description" content="Tableau de bord développeur pour créer, gérer et monétiser vos extensions e-commerce." />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                <Code2 className="w-8 h-8 text-white" />
              </div>
              Espace Développeur
            </h1>
            <p className="text-muted-foreground mt-2">
              Créez, gérez et monétisez vos extensions Drop Craft AI
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Extension
            </Button>
            <Button variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              Documentation
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="extensions">Mes Extensions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="resources">Ressources</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {developerStats.totalRevenue.toLocaleString()}€
                  </div>
                  <div className="text-sm text-muted-foreground">Revenus totaux</div>
                  <div className="text-xs text-green-600 mt-1">
                    +{developerStats.monthlyRevenue}€ ce mois
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Download className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {developerStats.totalDownloads.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Téléchargements</div>
                  <div className="text-xs text-blue-600 mt-1">
                    +{developerStats.monthlyDownloads} ce mois
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {developerStats.activeExtensions}
                  </div>
                  <div className="text-sm text-muted-foreground">Extensions actives</div>
                  <div className="text-xs text-purple-600 mt-1">2 en review</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">
                    {developerStats.averageRating}
                  </div>
                  <div className="text-sm text-muted-foreground">Note moyenne</div>
                  <div className="text-xs text-yellow-600 mt-1">
                    {developerStats.totalReviews} avis
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance des 30 derniers jours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Revenus mensuels</span>
                    <span className="font-bold text-green-600">+24%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span>Téléchargements</span>
                    <span className="font-bold text-blue-600">+18%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span>Taux de conversion</span>
                    <span className="font-bold text-purple-600">12.5%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Plus className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Créer une Extension</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Démarrez un nouveau projet d'extension
                  </p>
                  <Button className="w-full">Commencer</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Upload className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Publier une Extension</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Soumettez votre extension pour review
                  </p>
                  <Button variant="outline" className="w-full">Publier</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Guide Développeur</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Apprenez les meilleures pratiques
                  </p>
                  <Button variant="outline" className="w-full">Lire</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="extensions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Mes Extensions</h2>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Extension
              </Button>
            </div>

            <div className="grid gap-4">
              {myExtensions.map(ext => (
                <Card key={ext.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Package className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{ext.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(ext.status)}>
                              {getStatusIcon(ext.status)}
                              <span className="ml-1 capitalize">{ext.status}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              v{ext.version}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {ext.downloads.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Téléchargements</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {ext.revenue.toLocaleString()}€
                        </div>
                        <div className="text-xs text-muted-foreground">Revenus</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {ext.rating || '--'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ext.reviews || 0} avis
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {ext.price}€
                        </div>
                        <div className="text-xs text-muted-foreground">Prix</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(ext.lastUpdate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-muted-foreground">Dernière MAJ</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics Détaillées</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenus par Extension</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myExtensions.filter(ext => ext.revenue > 0).map(ext => (
                      <div key={ext.id} className="flex justify-between items-center">
                        <span className="font-medium">{ext.name}</span>
                        <span className="text-green-600 font-bold">
                          {ext.revenue.toLocaleString()}€
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Téléchargements par Mois</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Graphique des téléchargements mensuels
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <h2 className="text-2xl font-bold">Ressources Développeur</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <BookOpen className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="font-semibold mb-2">Documentation API</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Guide complet de l'API Drop Craft AI
                  </p>
                  <Button variant="outline" className="w-full">Consulter</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Terminal className="w-12 h-12 text-green-600 mb-4" />
                  <h3 className="font-semibold mb-2">CLI Développeur</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Outils en ligne de commande pour développeurs
                  </p>
                  <Button variant="outline" className="w-full">Télécharger</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <GitBranch className="w-12 h-12 text-purple-600 mb-4" />
                  <h3 className="font-semibold mb-2">Templates GitHub</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Templates de démarrage pour extensions
                  </p>
                  <Button variant="outline" className="w-full">Explorer</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Users className="w-12 h-12 text-orange-600 mb-4" />
                  <h3 className="font-semibold mb-2">Communauté</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Rejoignez notre Discord développeur
                  </p>
                  <Button variant="outline" className="w-full">Rejoindre</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Lightbulb className="w-12 h-12 text-yellow-600 mb-4" />
                  <h3 className="font-semibold mb-2">Exemples</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Exemples d'extensions populaires
                  </p>
                  <Button variant="outline" className="w-full">Explorer</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Shield className="w-12 h-12 text-red-600 mb-4" />
                  <h3 className="font-semibold mb-2">Guidelines Sécurité</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Bonnes pratiques de sécurité
                  </p>
                  <Button variant="outline" className="w-full">Lire</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">Paramètres Développeur</h2>
            
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profil Développeur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Gérez vos informations de développeur et vos préférences
                  </p>
                  <Button>Modifier le Profil</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paiements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Configurez vos informations bancaires pour recevoir vos paiements
                  </p>
                  <Button variant="outline">Gérer les Paiements</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}