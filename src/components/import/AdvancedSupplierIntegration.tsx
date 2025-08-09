import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Globe, Settings, Zap, CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react"

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
      isPro: true
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
      isPro: true
    },
    {
      id: 'bigbuy',
      name: 'BigBuy',
      platform: 'bigbuy',
      status: 'connected',
      products: 892,
      icon: '🏪',
      description: 'Fournisseur européen B2B spécialisé dropshipping',
      features: ['Stock européen', 'Livraison 24-48h', 'API complète']
    },
    {
      id: 'eprolo',
      name: 'EPROLO',
      platform: 'eprolo',
      status: 'available',
      products: 567,
      icon: '🚀',
      description: 'Solution complète dropshipping avec entrepôts globaux',
      features: ['Entrepôts US/EU', 'Branding privé', 'Qualité contrôlée']
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
      isPro: true
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
      isPro: true
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
    
    // Simulate connection process
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Intégrations Fournisseurs Avancées
          </CardTitle>
          <CardDescription>
            Connectez-vous directement à plus de 100 fournisseurs et marketplaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="relative hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
                {supplier.isPro && (
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold">
                    PRO
                  </Badge>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{supplier.icon}</span>
                      <div>
                        <h3 className="font-semibold">{supplier.name}</h3>
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
                  <p className="text-sm text-muted-foreground">{supplier.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    {supplier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {supplier.status === 'connected' && (
                    <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded">
                      <span className="text-sm font-medium text-green-800">
                        {supplier.products.toLocaleString()} produits
                      </span>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    variant={supplier.status === 'connected' ? 'outline' : supplier.isPro ? 'default' : 'secondary'}
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
                      'Connecter'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={configDialog.open} onOpenChange={(open) => setConfigDialog({ open, supplier: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{configDialog.supplier?.icon}</span>
              Configuration {configDialog.supplier?.name}
            </DialogTitle>
            <DialogDescription>
              Configurez votre intégration {configDialog.supplier?.name} PRO
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
            <Button onClick={handleProConnect} className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              Connecter {configDialog.supplier?.name}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}