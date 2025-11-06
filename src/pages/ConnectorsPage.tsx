import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useSupplierConnectors } from '@/hooks/useSupplierConnectors'
import { ConnectorFactory } from '@/services/connectors/ConnectorFactory'
import { 
  Store, 
  ShoppingCart, 
  Package, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Plug,
  Settings,
  RefreshCw,
  Trash2,
  ExternalLink,
  Search
} from 'lucide-react'
import { SupplierCredentials } from '@/types/suppliers'

export default function ConnectorsPage() {
  const { toast } = useToast()
  const { connectors, activeConnectors, connectSupplier, loading } = useSupplierConnectors()
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<SupplierCredentials>({})
  const [connecting, setConnecting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'marketplace' | 'ecommerce' | 'supplier'>('all')

  const allConnectors = [
    // Marketplaces
    { id: 'amazon', name: 'Amazon', category: 'marketplace', logo: '🛒', fields: ['accessToken', 'marketplace_id', 'seller_id'] },
    { id: 'ebay', name: 'eBay', category: 'marketplace', logo: '🔨', fields: ['apiKey', 'apiSecret', 'access_token'] },
    { id: 'etsy', name: 'Etsy', category: 'marketplace', logo: '🎨', fields: ['apiKey', 'shop_id', 'accessToken'] },
    { id: 'cdiscount', name: 'Cdiscount', category: 'marketplace', logo: '🇫🇷', fields: ['apiKey'] },
    { id: 'rakuten', name: 'Rakuten', category: 'marketplace', logo: '🇯🇵', fields: ['access_token'] },
    { id: 'fnac', name: 'Fnac', category: 'marketplace', logo: '📚', fields: ['access_token'] },
    { id: 'zalando', name: 'Zalando', category: 'marketplace', logo: '👗', fields: ['access_token'] },
    { id: 'aliexpress', name: 'AliExpress', category: 'marketplace', logo: '🇨🇳', fields: ['access_token'] },
    { id: 'wish', name: 'Wish', category: 'marketplace', logo: '💫', fields: ['access_token'] },
    { id: 'shopee', name: 'Shopee', category: 'marketplace', logo: '🛍️', fields: ['access_token', 'shop_id'] },
    { id: 'mercadolibre', name: 'MercadoLibre', category: 'marketplace', logo: '🇦🇷', fields: ['access_token', 'user_id'] },
    { id: 'mirakl', name: 'Mirakl', category: 'marketplace', logo: '🏪', fields: ['api_key', 'api_url'] },
    
    // E-commerce platforms
    { id: 'shopify', name: 'Shopify', category: 'ecommerce', logo: '🛍️', fields: ['shop_domain', 'accessToken'] },
    { id: 'woocommerce', name: 'WooCommerce', category: 'ecommerce', logo: '🔧', fields: ['site_url', 'apiKey', 'apiSecret'] },
    { id: 'prestashop', name: 'PrestaShop', category: 'ecommerce', logo: '🛒', fields: ['shop_url', 'apiKey'] },
    { id: 'magento', name: 'Magento', category: 'ecommerce', logo: '🎯', fields: ['base_url', 'access_token'] },
    { id: 'bigcommerce', name: 'BigCommerce', category: 'ecommerce', logo: '💼', fields: ['store_hash', 'access_token'] },
    
    // Suppliers
    { id: 'syncee', name: 'Syncee', category: 'supplier', logo: '🔄', fields: ['apiKey'] },
    { id: 'spocket', name: 'Spocket', category: 'supplier', logo: '📦', fields: ['apiKey'] },
    { id: 'oberlo', name: 'Oberlo', category: 'supplier', logo: '🌍', fields: ['apiKey'] },
    { id: 'dropified', name: 'Dropified', category: 'supplier', logo: '🚀', fields: ['apiKey'] }
  ]

  const filteredConnectors = allConnectors.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleConnect = async () => {
    if (!selectedConnector) return

    setConnecting(true)
    try {
      const success = await connectSupplier(selectedConnector, credentials)
      if (success) {
        toast({
          title: 'Connexion réussie',
          description: `Connecté à ${allConnectors.find(c => c.id === selectedConnector)?.name}`,
        })
        setSelectedConnector(null)
        setCredentials({})
      }
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setConnecting(false)
    }
  }

  const renderCredentialFields = (fields: string[]) => {
    const fieldLabels: Record<string, string> = {
      apiKey: 'API Key',
      apiSecret: 'API Secret',
      accessToken: 'Access Token',
      shop_domain: 'Shop Domain (ex: myshop.myshopify.com)',
      site_url: 'Site URL',
      marketplace_id: 'Marketplace ID',
      seller_id: 'Seller ID',
      shop_id: 'Shop ID',
      user_id: 'User ID',
      api_url: 'API URL',
      base_url: 'Base URL',
      store_hash: 'Store Hash',
      shop_url: 'Shop URL',
    }

    return fields.map((field) => (
      <div key={field} className="space-y-2">
        <Label htmlFor={field}>{fieldLabels[field] || field}</Label>
        <Input
          id={field}
          placeholder={`Entrez votre ${fieldLabels[field] || field}`}
          value={credentials[field] || ''}
          onChange={(e) => setCredentials({ ...credentials, [field]: e.target.value })}
        />
      </div>
    ))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Plug className="h-8 w-8" />
            Gestionnaire de Connecteurs
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez toutes vos intégrations marketplace et fournisseurs
          </p>
        </div>
        <Badge variant="secondary" className="text-lg">
          {activeConnectors.length} Active{activeConnectors.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un connecteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setCategoryFilter('all')}
              >
                Tous
              </Button>
              <Button
                variant={categoryFilter === 'marketplace' ? 'default' : 'outline'}
                onClick={() => setCategoryFilter('marketplace')}
              >
                Marketplaces
              </Button>
              <Button
                variant={categoryFilter === 'ecommerce' ? 'default' : 'outline'}
                onClick={() => setCategoryFilter('ecommerce')}
              >
                E-commerce
              </Button>
              <Button
                variant={categoryFilter === 'supplier' ? 'default' : 'outline'}
                onClick={() => setCategoryFilter('supplier')}
              >
                Fournisseurs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredConnectors.map((connector) => {
          const isConnected = activeConnectors.includes(connector.id)
          
          return (
            <Card key={connector.id} className="hover-scale relative overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{connector.logo}</div>
                    <div>
                      <CardTitle className="text-lg">{connector.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {connector.category}
                      </Badge>
                    </div>
                  </div>
                  {isConnected && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurer
                    </Button>
                    <Button className="w-full" variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Synchroniser
                    </Button>
                    <Button className="w-full" variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Déconnecter
                    </Button>
                  </div>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full"
                        onClick={() => setSelectedConnector(connector.id)}
                      >
                        <Plug className="h-4 w-4 mr-2" />
                        Connecter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Connecter {connector.name}</DialogTitle>
                        <DialogDescription>
                          Entrez vos identifiants pour connecter {connector.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {renderCredentialFields(connector.fields)}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedConnector(null)
                            setCredentials({})
                          }}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleConnect}
                          disabled={connecting}
                        >
                          {connecting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Connexion...
                            </>
                          ) : (
                            'Connecter'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredConnectors.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucun connecteur trouvé pour "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
