/**
 * Hub Fournisseurs Moderne - Vue marketplace inspirée d'AutoDS
 * Gestion unifiée des connecteurs et synchronisation
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem'
import { useToast } from '@/hooks/use-toast'
import { Helmet } from 'react-helmet-async'
import { 
  Plus, Search, Filter, Settings, RefreshCw, 
  Database, Globe, Wifi, WifiOff, Package, 
  TrendingUp, Users, AlertCircle, CheckCircle, 
  XCircle, Clock, Zap, Upload, Download,
  Star, Shield, Activity, ArrowRight, DollarSign
} from 'lucide-react'
import { SuppliersUpgradeBanner } from '@/components/suppliers/SuppliersUpgradeBanner'

interface SupplierConnector {
  id: string
  name: string
  displayName: string
  description: string
  category: string
  status: 'available' | 'beta' | 'coming_soon'
  logo?: string
  rating: number
  products: number
  countries: string[]
  features: {
    products: boolean
    inventory: boolean
    orders: boolean
    webhooks: boolean
  }
  pricing: 'free' | 'paid' | 'commission'
  setupComplexity: 'easy' | 'medium' | 'advanced'
  authType: 'api_key' | 'oauth' | 'credentials'
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
  }
}

const ModernSuppliersHub: React.FC = () => {
  const { user, isAdmin, dashboardStats, refresh } = useUnifiedSystem()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [connectDialog, setConnectDialog] = useState<{ open: boolean; connector?: SupplierConnector }>({ open: false })
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connectedSuppliers, setConnectedSuppliers] = useState<string[]>([])
  const [syncProgress, setSyncProgress] = useState<Record<string, number>>({})

  // Mock des connecteurs disponibles - inspiré des leaders du marché
  const [connectors] = useState<SupplierConnector[]>([
    {
      id: 'bigbuy',
      name: 'BigBuy',
      displayName: 'BigBuy',
      description: '300K+ produits européens, synchronisation temps réel, stock garanti',
      category: 'Dropshipping Premium',
      status: 'available',
      logo: '/logos/bigbuy.svg',
      rating: 4.8,
      products: 300000,
      countries: ['ES', 'FR', 'DE', 'IT'],
      features: { products: true, inventory: true, orders: true, webhooks: true },
      pricing: 'paid',
      setupComplexity: 'medium',
      authType: 'api_key',
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 3600 }
    },
    {
      id: 'eprolo',
      name: 'Eprolo',
      displayName: 'Eprolo',
      description: '1M+ produits, expédition européenne 3-7 jours, branding privé',
      category: 'Dropshipping Premium',
      status: 'available',
      logo: '/logos/eprolo.svg',
      rating: 4.7,
      products: 1000000,
      countries: ['CN', 'US', 'EU'],
      features: { products: true, inventory: true, orders: true, webhooks: true },
      pricing: 'free',
      setupComplexity: 'easy',
      authType: 'api_key',
      rateLimits: { requestsPerMinute: 100, requestsPerHour: 6000 }
    },
    {
      id: 'spocket',
      name: 'Spocket',
      displayName: 'Spocket',
      description: '1M+ produits US & EU, branding, expédition rapide',
      category: 'Dropshipping Premium',
      status: 'available',
      logo: '/logos/spocket.svg',
      rating: 4.6,
      products: 1000000,
      countries: ['US', 'EU'],
      features: { products: true, inventory: true, orders: true, webhooks: false },
      pricing: 'paid',
      setupComplexity: 'medium',
      authType: 'oauth',
      rateLimits: { requestsPerMinute: 50, requestsPerHour: 3000 }
    },
    {
      id: 'printful',
      name: 'Printful',
      displayName: 'Printful',
      description: 'Print-on-demand leader, pas de stock, impression à la demande',
      category: 'Print-on-Demand',
      status: 'available',
      logo: '/logos/printful.svg',
      rating: 4.9,
      products: 400,
      countries: ['US', 'EU', 'CA'],
      features: { products: true, inventory: false, orders: true, webhooks: true },
      pricing: 'commission',
      setupComplexity: 'easy',
      authType: 'api_key',
      rateLimits: { requestsPerMinute: 120, requestsPerHour: 7200 }
    },
    {
      id: 'syncee',
      name: 'Syncee',
      displayName: 'Syncee',
      description: '8M+ produits, 12K+ marques, marketplace globale',
      category: 'Marketplace Globale',
      status: 'available',
      logo: '/logos/syncee.svg',
      rating: 4.5,
      products: 8000000,
      countries: ['Global'],
      features: { products: true, inventory: true, orders: false, webhooks: true },
      pricing: 'paid',
      setupComplexity: 'easy',
      authType: 'api_key',
      rateLimits: { requestsPerMinute: 120, requestsPerHour: 7200 }
    },
    {
      id: 'cdiscount-pro',
      name: 'Cdiscount Pro',
      displayName: 'Cdiscount Pro',
      description: 'Marketplace française #1, API/EDI complète',
      category: 'Marketplace Française',
      status: 'beta',
      logo: '/logos/cdiscount.svg',
      rating: 4.3,
      products: 50000000,
      countries: ['FR'],
      features: { products: true, inventory: true, orders: true, webhooks: false },
      pricing: 'commission',
      setupComplexity: 'advanced',
      authType: 'oauth',
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1800 }
    }
  ])

  const categories = ['all', ...Array.from(new Set(connectors.map(c => c.category)))]
  const statuses = ['all', 'available', 'beta', 'coming_soon']

  const filteredConnectors = connectors.filter(connector => {
    const matchesSearch = connector.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connector.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || connector.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || connector.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'beta': return 'bg-orange-500'
      case 'coming_soon': return 'bg-slate-400'
      default: return 'bg-slate-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'beta': return 'Bêta'
      case 'coming_soon': return 'Bientôt'
      default: return 'Inconnu'
    }
  }

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case 'free': return 'text-green-600'
      case 'paid': return 'text-blue-600'
      case 'commission': return 'text-orange-600'
      default: return 'text-slate-600'
    }
  }

  const getPricingText = (pricing: string) => {
    switch (pricing) {
      case 'free': return 'Gratuit'
      case 'paid': return 'Payant'
      case 'commission': return 'Commission'
      default: return 'N/A'
    }
  }

  const handleConnect = (connector: SupplierConnector) => {
    if (connector.status === 'coming_soon') {
      toast({
        title: "Bientôt disponible",
        description: `${connector.displayName} sera bientôt disponible`,
        variant: "default"
      })
      return
    }
    setConnectDialog({ open: true, connector })
  }

  const handleConfirmConnection = async () => {
    if (!connectDialog.connector) return
    
    const { connector } = connectDialog
    setConnecting(connector.id)
    
    try {
      // Simulation de connexion
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setConnectedSuppliers(prev => [...prev, connector.id])
      setConnectDialog({ open: false })
      
      toast({
        title: "Connexion réussie",
        description: `${connector.displayName} a été connecté avec succès`,
      })
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au fournisseur",
        variant: "destructive"
      })
    } finally {
      setConnecting(null)
    }
  }

  const handleSync = async (connectorId: string) => {
    setSyncProgress(prev => ({ ...prev, [connectorId]: 0 }))
    
    try {
      // Simulation de synchronisation avec progression
      for (let i = 0; i <= 100; i += 10) {
        setSyncProgress(prev => ({ ...prev, [connectorId]: i }))
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      toast({
        title: "Synchronisation terminée",
        description: "Les produits ont été synchronisés avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser les produits",
        variant: "destructive"
      })
    } finally {
      setTimeout(() => {
        setSyncProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[connectorId]
          return newProgress
        })
      }, 1000)
    }
  }

  return (
    <>
      <Helmet>
        <title>Hub Fournisseurs - Connecteurs et Intégrations | Drop Craft AI</title>
        <meta name="description" content="Connectez vos fournisseurs dropshipping favoris. BigBuy, Eprolo, Spocket, Printful et plus. Synchronisation automatique des stocks et commandes." />
      </Helmet>

      <div className="space-y-8 p-6">
        {/* Banner de promotion Ultra Pro */}
        <SuppliersUpgradeBanner />
        
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hub Fournisseurs</h1>
            <p className="text-muted-foreground">
              Connectez et synchronisez vos fournisseurs pour automatiser votre dropshipping
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Import Manuel
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="stats-grid">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Connectés</p>
                  <p className="text-2xl font-bold">{connectedSuppliers.length}</p>
                </div>
                <Wifi className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disponibles</p>
                  <p className="text-2xl font-bold">{connectors.filter(c => c.status === 'available').length}</p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produits Total</p>
                  <p className="text-2xl font-bold">{(connectors.reduce((acc, c) => acc + (connectedSuppliers.includes(c.id) ? c.products : 0), 0)).toLocaleString()}</p>
                </div>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sync Aujourd'hui</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un fournisseur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'Toutes catégories' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status === 'all' ? 'Tous' : getStatusText(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grille des connecteurs */}
        <div className="dashboard-grid">
          {filteredConnectors.map((connector) => {
            const isConnected = connectedSuppliers.includes(connector.id)
            const progress = syncProgress[connector.id]
            
            return (
              <Card key={connector.id} className="card-hover">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {connector.logo ? (
                        <img src={connector.logo} alt={connector.displayName} className="h-10 w-10 rounded-lg" />
                      ) : (
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Globe className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{connector.displayName}</CardTitle>
                        <CardDescription>{connector.category}</CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${getStatusColor(connector.status)} text-white text-xs border-0`}
                      >
                        {getStatusText(connector.status)}
                      </Badge>
                      {isConnected ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{connector.description}</p>
                  
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{connector.rating}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span>{connector.products.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className={getPricingColor(connector.pricing)}>
                        {getPricingText(connector.pricing)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {connector.setupComplexity === 'easy' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : connector.setupComplexity === 'medium' ? (
                        <Clock className="h-4 w-4 text-orange-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="capitalize">{connector.setupComplexity}</span>
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="flex gap-2 flex-wrap">
                    {connector.features.products && (
                      <Badge variant="outline" className="text-xs">Produits</Badge>
                    )}
                    {connector.features.inventory && (
                      <Badge variant="outline" className="text-xs">Stock</Badge>
                    )}
                    {connector.features.orders && (
                      <Badge variant="outline" className="text-xs">Commandes</Badge> 
                    )}
                    {connector.features.webhooks && (
                      <Badge variant="outline" className="text-xs">Webhooks</Badge>
                    )}
                  </div>
                  
                  {/* Progress bar si sync en cours */}
                  {progress !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Synchronisation...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {isConnected ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSync(connector.id)}
                          disabled={progress !== undefined}
                          className="flex-1"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => handleConnect(connector)}
                        disabled={connecting === connector.id}
                        className="flex-1 btn-gradient"
                      >
                        {connecting === connector.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Connexion...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Connecter
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Dialog de connexion */}
        <Dialog open={connectDialog.open} onOpenChange={(open) => setConnectDialog({ open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connecter {connectDialog.connector?.displayName}</DialogTitle>
              <DialogDescription>
                Configurez votre connexion à {connectDialog.connector?.displayName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm">{connectDialog.connector?.description}</p>
              </div>
              
              {connectDialog.connector?.authType === 'api_key' ? (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Clé API</Label>
                  <Input 
                    id="apiKey" 
                    type="password" 
                    placeholder="Entrez votre clé API" 
                  />
                </div>
              ) : connectDialog.connector?.authType === 'oauth' ? (
                <div className="text-center py-4">
                  <Button className="btn-gradient">
                    <Shield className="h-4 w-4 mr-2" />
                    Se connecter avec OAuth
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input id="username" />
                  </div>
                  <div>
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input id="password" type="password" />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setConnectDialog({ open: false })}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleConfirmConnection}
                  disabled={connecting === connectDialog.connector?.id}
                  className="btn-gradient"
                >
                  {connecting === connectDialog.connector?.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Connecter'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

export default ModernSuppliersHub