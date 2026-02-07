import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useSuppliersUnified } from '@/hooks/unified'
import { useSupplierSync } from '@/hooks/useSupplierSync'
import { useSupplierConnection } from '@/hooks/useSupplierConnection'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Star,
  Globe,
  Zap,
  RefreshCw,
  Settings,
  Plus,
  Filter,
  ArrowUpDown,
  MapPin,
  DollarSign,
  Package,
  Truck,
  Activity,
  Target,
  Award
} from 'lucide-react'

export function AdvancedSupplierManager() {
  const navigate = useNavigate()
  const { suppliers, isLoading, refetch } = useSuppliersUnified()
  const { syncSupplier, syncAllSuppliers, isSyncing } = useSupplierSync()
  const { 
    isSupplierConnected, 
    disconnectSupplier, 
    isDisconnecting,
    refreshConnections 
  } = useSupplierConnection()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('rating')

  const handleSyncAll = async () => {
    await syncAllSuppliers()
  }

  const handleSyncSupplier = async (supplierId: string) => {
    if (!isSupplierConnected(supplierId)) {
      toast.error('Ce fournisseur n\'est pas connecté. Connectez-le d\'abord.')
      navigate('/products/suppliers/browse')
      return
    }
    await syncSupplier(supplierId)
  }

  const handleDisconnect = async (supplierId: string, supplierName: string) => {
    if (confirm(`Voulez-vous vraiment déconnecter ${supplierName} ?`)) {
      const result = await disconnectSupplier(supplierId)
      if (result.success) {
        refreshConnections()
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />
      case 'inactive': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500">Actif</Badge>
      case 'warning': return <Badge variant="destructive">Attention</Badge>
      case 'pending': return <Badge variant="secondary">En attente</Badge>
      case 'inactive': return <Badge variant="outline">Inactif</Badge>
      default: return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 85) return 'text-blue-600'
    if (score >= 75) return 'text-orange-600'
    return 'text-red-600'
  }

  // Calculer les métriques de performance
  const performanceMetrics = [
    { label: 'Fournisseurs Actifs', value: suppliers.filter(s => s.status === 'verified').length, trend: '+12%', icon: Users, color: 'text-blue-500' },
    { label: 'Total Fournisseurs', value: suppliers.length, trend: '+8%', icon: Package, color: 'text-green-500' },
    { label: 'Note moyenne', value: (suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / (suppliers.length || 1)).toFixed(1), trend: '+3%', icon: Star, color: 'text-yellow-500' },
    { label: 'Pays', value: new Set(suppliers.map(s => s.country).filter(Boolean)).size, trend: '+15%', icon: Globe, color: 'text-orange-500' }
  ]

  const filteredSuppliers = suppliers
    .filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.country?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating': return (b.rating || 0) - (a.rating || 0)
        case 'name': return a.name.localeCompare(b.name)
        default: return 0
      }
    })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec métriques */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">Gestion Fournisseurs Avancée</h2>
            <p className="text-muted-foreground">
              Monitoring temps réel et optimisation de vos relations fournisseurs
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleSyncAll}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Tous
            </Button>
            <Button onClick={() => navigate('/products/suppliers/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Fournisseur
            </Button>
          </div>
        </div>

        {/* Métriques de performance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {performanceMetrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className={`text-xs ${metric.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.trend} vs mois dernier
                    </p>
                  </div>
                  <metric.icon className={`h-8 w-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          {/* Filtres et recherche */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher fournisseurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
              >
                Tous
              </Button>
              <Button 
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
              >
                Actifs
              </Button>
              <Button 
                variant={filterStatus === 'warning' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('warning')}
              >
                Attention
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Trier par: {sortBy === 'rating' ? 'Note' : 'Nom'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('rating')}>
                    Note
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('name')}>
                    Nom
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Liste des fournisseurs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => (
              <Card 
                key={supplier.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedSupplier?.id === supplier.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedSupplier(supplier)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {supplier.country}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getStatusBadge(supplier.status)}
                      {!isSupplierConnected(supplier.id) && (
                        <Badge variant="outline" className="text-xs">
                          Non connecté
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Rating et métriques principales */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-bold">{supplier.rating || 'N/A'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{supplier.country || 'Non renseigné'}</p>
                      <p className="text-xs text-muted-foreground">{supplier.website || ''}</p>
                    </div>
                  </div>

                  {/* Informations */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">API:</span>
                      <span className="font-medium">{supplier.api_endpoint ? 'Configuré' : 'Non configuré'}</span>
                    </div>
                    {supplier.api_endpoint && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">API configurée</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {isSupplierConnected(supplier.id) ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSyncSupplier(supplier.id)
                          }}
                          disabled={isSyncing}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                          Sync
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/products/suppliers/${supplier.id}`)}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Voir Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/products/suppliers/${supplier.id}/edit`)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Paramètres
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDisconnect(supplier.id, supplier.name)
                              }}
                              disabled={isDisconnecting}
                              className="text-red-600"
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Déconnecter
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/products/suppliers/browse')
                        }}
                      >
                        Connecter
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Fournisseurs avec les meilleures performances globales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSuppliers
                    .slice(0, 5)
                    .map((supplier, index) => (
                      <div key={supplier.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' : 'bg-muted'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">{supplier.country}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{supplier.rating || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">Note</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes & Actions</CardTitle>
                <CardDescription>Points d'attention et recommandations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">HomeDecor Masters</p>
                      <p className="text-xs text-muted-foreground">Pas de sync depuis 2h - vérifier la connexion API</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate('/products/suppliers/manage')}
                    >
                      Résoudre
                    </Button>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg border-blue-200 bg-blue-50">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Opportunité de négociation</p>
                      <p className="text-xs text-muted-foreground">TechGlobal - volumes élevés, renégocier les tarifs</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate('/products/suppliers')}
                    >
                      Contacter
                    </Button>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Nouveau certification</p>
                      <p className="text-xs text-muted-foreground">SportMax a obtenu une nouvelle certification ISO</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate('/products/suppliers')}
                    >
                      Voir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Fiabilité</span>
                    <span className="font-bold">93.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Qualité</span>
                    <span className="font-bold">94.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Délai livraison</span>
                    <span className="font-bold">9.2 jours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Temps de réponse</span>
                    <span className="font-bold">2.1 heures</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Évolution Mensuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Nouveaux fournisseurs</span>
                    <span className="font-bold text-green-600">+3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Commandes traitées</span>
                    <span className="font-bold text-green-600">+18%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Délais moyens</span>
                    <span className="font-bold text-green-600">-15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Coûts logistiques</span>
                    <span className="font-bold text-red-600">+3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">ROI Fournisseurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">€186K</p>
                    <p className="text-sm text-muted-foreground">Économies ce mois</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">23%</p>
                    <p className="text-sm text-muted-foreground">Marge moyenne améliorée</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribution Géographique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { country: 'Chine', suppliers: 18, revenue: '€420K' },
                  { country: 'Allemagne', suppliers: 12, revenue: '€340K' },
                  { country: 'Italie', suppliers: 8, revenue: '€180K' },
                  { country: 'Pologne', suppliers: 9, revenue: '€220K' }
                ].map((data) => (
                  <div key={data.country} className="text-center p-3 border rounded-lg">
                    <Globe className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium">{data.country}</p>
                    <p className="text-sm text-muted-foreground">{data.suppliers} fournisseurs</p>
                    <p className="text-sm font-bold">{data.revenue}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Règles d'Automatisation</CardTitle>
                <CardDescription>
                  Configurez des actions automatiques basées sur les performances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Auto-sync quotidien</span>
                      <Badge className="bg-green-500">Actif</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Synchronisation automatique des stocks et prix à 6h00
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Alertes performance</span>
                      <Badge className="bg-green-500">Actif</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Notification si fiabilité &lt; 85% ou délai &gt; 15 jours
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Prix dynamiques</span>
                      <Badge variant="outline">Configuration</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ajustement automatique des prix selon la concurrence
                    </p>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => navigate('/automation/workflows')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Nouvelle règle
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflows Intelligents</CardTitle>
                <CardDescription>
                  Processus automatisés pour optimiser la gestion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4"
                    onClick={() => navigate('/automation/workflows')}
                  >
                    <div className="text-left">
                      <div className="font-medium">Onboarding Nouveau Fournisseur</div>
                      <div className="text-sm text-muted-foreground">
                        Processus automatisé de validation et intégration
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4"
                    onClick={() => navigate('/automation/workflows')}
                  >
                    <div className="text-left">
                      <div className="font-medium">Évaluation Performance</div>
                      <div className="text-sm text-muted-foreground">
                        Scoring automatique et recommandations IA
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4"
                    onClick={() => navigate('/automation/workflows')}
                  >
                    <div className="text-left">
                      <div className="font-medium">Gestion des Conflits</div>
                      <div className="text-sm text-muted-foreground">
                        Résolution automatique des problèmes courants
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4"
                    onClick={() => navigate('/automation/workflows')}
                  >
                    <div className="text-left">
                      <div className="font-medium">Optimisation Commandes</div>
                      <div className="text-sm text-muted-foreground">
                        Regroupement intelligent et négociation auto
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}