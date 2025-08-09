import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Globe, 
  Settings, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Network,
  Shield,
  Star
} from "lucide-react"

interface Supplier {
  id: string
  name: string
  platform: string
  status: 'connected' | 'available' | 'configuring' | 'error'
  products: number
  icon: string
  description: string
  features: string[]
  isPro?: boolean
  apiEndpoint?: string
  rating?: number
}

export const AdvancedSupplierIntegration = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: 'aliexpress',
      name: 'AliExpress',
      platform: 'aliexpress',
      status: 'connected',
      products: 2456,
      icon: '🛒',
      description: 'Plus grand marketplace mondial avec millions de produits',
      features: ['API Fournisseur', 'Import automatique', 'Suivi commandes'],
      isPro: true,
      rating: 4.8
    },
    {
      id: 'amazon',
      name: 'Amazon',
      platform: 'amazon',
      status: 'available',
      products: 1834,
      icon: '📦',
      description: 'Marketplace premium avec livraison rapide',
      features: ['API Avancée', 'FBA Integration', 'Prime shipping'],
      isPro: true,
      rating: 4.9
    },
    {
      id: 'bigbuy',
      name: 'BigBuy',
      platform: 'bigbuy',
      status: 'connected',
      products: 892,
      icon: '🏪',
      description: 'Fournisseur européen B2B spécialisé dropshipping',
      features: ['Stock européen', 'Livraison 24-48h', 'API complète'],
      rating: 4.7
    },
    {
      id: 'eprolo',
      name: 'EPROLO',
      platform: 'eprolo',
      status: 'available',
      products: 567,
      icon: '🚀',
      description: 'Solution complète dropshipping avec entrepôts globaux',
      features: ['Entrepôts US/EU', 'Branding privé', 'Qualité contrôlée'],
      rating: 4.6
    },
    {
      id: 'xmlftp',
      name: 'XML/FTP',
      platform: 'xmlftp',
      status: 'available',
      products: 0,
      icon: '🔗',
      description: 'Import automatique des flux fournisseurs',
      features: ['Import automatique', 'Flux temps réel', 'Multi-formats'],
      isPro: true,
      rating: 4.5
    },
    {
      id: 'chrome',
      name: 'Extension Chrome',
      platform: 'chrome',
      status: 'available',
      products: 0,
      icon: '🌐',
      description: 'Import en 1 clic depuis n\'importe quel site',
      features: ['1-click import', 'Multi-sites', 'OCR Images'],
      isPro: true,
      rating: 4.4
    }
  ])

  const [connectingSupplier, setConnectingSupplier] = useState<string | null>(null)
  const [configDialog, setConfigDialog] = useState<{ open: boolean; supplier: Supplier | null }>({
    open: false,
    supplier: null
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'configuring':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Settings className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'configuring':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleConnect = async (supplier: Supplier) => {
    if (supplier.isPro) {
      setConfigDialog({ open: true, supplier })
      return
    }

    setConnectingSupplier(supplier.id)
    
    setTimeout(() => {
      setSuppliers(prev => prev.map(s => 
        s.id === supplier.id 
          ? { ...s, status: 'connected' as const, products: Math.floor(Math.random() * 1000) + 100 }
          : s
      ))
      setConnectingSupplier(null)
    }, 2000)
  }

  const handleProConnect = () => {
    if (!configDialog.supplier) return
    
    setConnectingSupplier(configDialog.supplier.id)
    setConfigDialog({ open: false, supplier: null })
    
    setTimeout(() => {
      setSuppliers(prev => prev.map(s => 
        s.id === configDialog.supplier!.id 
          ? { ...s, status: 'connected' as const, products: Math.floor(Math.random() * 2000) + 500 }
          : s
      ))
      setConnectingSupplier(null)
    }, 3000)
  }

  const connectedSuppliers = suppliers.filter(s => s.status === 'connected').length
  const totalProducts = suppliers.filter(s => s.status === 'connected').reduce((sum, s) => sum + s.products, 0)

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-hero p-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-2">Fournisseurs Ultra Pro</h2>
              <p className="text-xl opacity-90">
                Connectez-vous directement à plus de 100 fournisseurs mondiaux
              </p>
            </div>
            <Badge className="bg-gradient-accent text-white px-4 py-2 font-bold animate-pulse-glow">
              <Network className="h-4 w-4 mr-2" />
              NETWORK PRO
            </Badge>
          </div>

          {/* Integration Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{connectedSuppliers}</div>
                    <p className="text-sm opacity-80">Fournisseurs Connectés</p>
                  </div>
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">{totalProducts.toLocaleString()}</div>
                    <p className="text-sm opacity-80">Produits Disponibles</p>
                  </div>
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Globe className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-2xl font-bold">99.8%</div>
                    <p className="text-sm opacity-80">Fiabilité API</p>
                  </div>
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Suppliers Grid */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Intégrations Fournisseurs
          </CardTitle>
          <CardDescription className="text-lg">
            Connectez-vous aux meilleures plateformes mondiales de dropshipping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <Card 
                key={supplier.id} 
                className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-glow hover-scale"
              >
                {supplier.isPro && (
                  <Badge className="absolute -top-2 -right-2 bg-gradient-accent text-white font-bold z-10">
                    <Star className="h-3 w-3 mr-1" />
                    PRO
                  </Badge>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                        <span className="text-2xl">{supplier.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{supplier.name}</h3>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(supplier.status)}
                          <Badge className={getStatusColor(supplier.status)}>
                            {supplier.status === 'connected' ? 'Connecté' : 
                             supplier.status === 'configuring' ? 'Configuration' :
                             supplier.status === 'error' ? 'Erreur' : 'Disponible'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {supplier.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < Math.floor(supplier.rating!) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-1">{supplier.rating}</span>
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground mt-2">{supplier.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {supplier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {supplier.status === 'connected' && (
                    <div className="flex items-center justify-between py-3 px-4 bg-green-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-green-800">
                          {supplier.products.toLocaleString()} produits
                        </span>
                        <div className="text-xs text-green-600">Synchronisé</div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-100">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    className={`w-full ${
                      supplier.status === 'connected' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' 
                        : supplier.isPro 
                          ? 'bg-gradient-primary hover:bg-gradient-accent' 
                          : 'bg-secondary hover:bg-secondary/80'
                    } transition-all duration-300`}
                    onClick={() => handleConnect(supplier)}
                    disabled={connectingSupplier === supplier.id}
                  >
                    {connectingSupplier === supplier.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connexion...
                      </>
                    ) : supplier.status === 'connected' ? (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Configurer
                      </>
                    ) : supplier.isPro ? (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Connecter PRO
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Connecter
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={configDialog.open} onOpenChange={(open) => setConfigDialog({ open, supplier: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-2xl">{configDialog.supplier?.icon}</span>
              Configuration {configDialog.supplier?.name} PRO
            </DialogTitle>
            <DialogDescription>
              Configurez votre intégration sécurisée avec {configDialog.supplier?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Clé API</label>
              <Input placeholder="Entrez votre clé API..." type="password" />
            </div>
            <div>
              <label className="text-sm font-medium">Secret API</label>
              <Input placeholder="Entrez votre secret API..." type="password" />
            </div>
            {configDialog.supplier?.platform === 'xmlftp' && (
              <div>
                <label className="text-sm font-medium">URL du flux XML/FTP</label>
                <Input placeholder="https://example.com/feed.xml" />
              </div>
            )}
            <Button 
              onClick={handleProConnect} 
              className="w-full bg-gradient-primary hover:bg-gradient-accent"
            >
              <Zap className="h-4 w-4 mr-2" />
              Connecter {configDialog.supplier?.name}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}