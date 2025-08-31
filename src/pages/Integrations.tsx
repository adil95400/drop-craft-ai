import { useState, useEffect, memo } from "react"
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth"
import { useIntegrations } from "@/hooks/useIntegrations"
import { useCanvaIntegration } from "@/hooks/useCanvaIntegration"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { IntegrationsSkeleton } from "@/components/common/IntegrationsSkeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  ExternalLink,
  Plus,
  FileText,
  Database,
  Image,
  Code,
  Download,
  Sheet,
  CheckCircle,
  XCircle,
  Clock,
  Info
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ShopifyConfigDialog } from "@/components/modals/ShopifyConfigDialog"
import { PrestaShopConfigDialog } from "@/components/modals/PrestaShopConfigDialog"
import { XMLConfigDialog } from "@/components/modals/XMLConfigDialog"
import { CSVConfigDialog } from "@/components/modals/CSVConfigDialog"

const Integrations = memo(() => {
  const { user, loading: authLoading } = useEnhancedAuth()
  const { 
    integrations, 
    connectedIntegrations, 
    addIntegration, 
    isAdding,
    isLoading: integrationsLoading,
    error: integrationsError
  } = useIntegrations()
  const { checkConnectionStatus } = useCanvaIntegration()
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null)
  const [canvaConnected, setCanvaConnected] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [configDialog, setConfigDialog] = useState(false)
  const [shopifyDialog, setShopifyDialog] = useState(false)
  const [prestashopDialog, setPrestashopDialog] = useState(false)
  const [xmlDialog, setXmlDialog] = useState(false)
  const [csvDialog, setCsvDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    credentials: ''
  })
  const { toast } = useToast()

  // Check Canva connection status and set loading timeout
  useEffect(() => {
    const checkCanva = async () => {
      try {
        const connected = await checkConnectionStatus()
        setCanvaConnected(connected)
      } catch (error) {
        console.warn('Failed to check Canva status:', error)
      }
    }
    
    checkCanva()
    
    // Set timeout for loading state
    const timeout = setTimeout(() => {
      setLoadingTimeout(true)
    }, 10000) // 10 seconds timeout
    
    return () => clearTimeout(timeout)
  }, [checkConnectionStatus])

  // Données des plateformes inspirées de l'image de référence
  const platforms = [
    {
      id: "afosto",
      name: "Afosto",
      logo: "https://images.g2crowd.com/uploads/product/image/social_landscape/social_landscape_4c9b6c1e9c4a4c9b6a1c9b6a1c9b6a1c/afosto.png",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "bigcommerce", 
      name: "BigCommerce",
      logo: "https://logos-world.net/wp-content/uploads/2021/02/BigCommerce-Logo.png",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "ccv",
      name: "CCV Shop",
      logo: "https://www.ccv.eu/app/uploads/2023/03/ccv-shop-logo.svg",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "crawler",
      name: "Crawler",
      logo: "https://via.placeholder.com/120x60/6366f1/ffffff?text=Crawler",
      category: "Tools",
      platform_type: "tools"
    },
    {
      id: "itsperfect",
      name: "ItsPerfect",
      logo: "https://via.placeholder.com/120x60/059669/ffffff?text=ItsPerfect",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "lightspeed",
      name: "Lightspeed",
      logo: "https://logos-world.net/wp-content/uploads/2021/05/Lightspeed-Logo.png",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "lightspeed-e",
      name: "Lightspeed E - Series",
      logo: "https://logos-world.net/wp-content/uploads/2021/05/Lightspeed-Logo.png",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "magento",
      name: "Magento",
      logo: "https://logos-world.net/wp-content/uploads/2020/09/Magento-Logo.png",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "mijnwebwinkel",
      name: "Mijnwebwinkel",
      logo: "https://via.placeholder.com/120x60/22c55e/ffffff?text=Mijnwebwinkel",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "oxid",
      name: "Oxid",
      logo: "https://via.placeholder.com/120x60/1f2937/ffffff?text=OXID",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "prestashop",
      name: "PrestaShop",
      logo: "https://logos-world.net/wp-content/uploads/2020/11/PrestaShop-Logo.png",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "shopify",
      name: "Shopify", 
      logo: "https://logos-world.net/wp-content/uploads/2020/11/Shopify-Logo.png",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "shoptrader",
      name: "Shoptrader",
      logo: "https://via.placeholder.com/120x60/3b82f6/ffffff?text=SHOPTRADER",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "shopware5",
      name: "Shopware 5",
      logo: "https://via.placeholder.com/120x60/0ea5e9/ffffff?text=shopware",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "shopware6",
      name: "Shopware 6", 
      logo: "https://via.placeholder.com/120x60/0ea5e9/ffffff?text=shopware",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "squarespace",
      name: "Squarespace",
      logo: "https://logos-world.net/wp-content/uploads/2020/11/Squarespace-Logo.png",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "woocommerce",
      name: "WooCommerce",
      logo: "https://logos-world.net/wp-content/uploads/2020/11/WooCommerce-Logo.png",
      category: "E-commerce",
      platform_type: "ecommerce"
    },
    {
      id: "akeneo",
      name: "Akeneo",
      logo: "https://via.placeholder.com/120x60/8b5cf6/ffffff?text=akeneo",
      category: "PIM",
      platform_type: "pim"
    }
  ]

  // Fiches techniques avec design system
  const technicalFiles = [
    {
      id: "xml",
      name: "XML",
      icon: <Code className="w-8 h-8 text-warning" />,
      description: "Configuration XML"
    },
    {
      id: "csv", 
      name: "CSV",
      icon: <Sheet className="w-8 h-8 text-success" />,
      description: "Format CSV"
    },
    {
      id: "text",
      name: "Text",
      icon: <FileText className="w-8 h-8 text-destructive" />,
      description: "Fichier texte"
    },
    {
      id: "json",
      name: "JSON", 
      icon: <Database className="w-8 h-8 text-primary" />,
      description: "Format JSON"
    },
    {
      id: "google",
      name: "Google Sheets",
      icon: <Sheet className="w-8 h-8 text-success" />,
      description: "Google Sheets"
    }
  ]

  // Check if platform is already connected
  const isPlatformConnected = (platformId: string) => {
    return (connectedIntegrations || []).some((int: any) => int.platform_name?.toLowerCase() === platformId)
  }

  // Get connection status icon
  const getStatusIcon = (platformId: string) => {
    if (isPlatformConnected(platformId)) {
      return <CheckCircle className="w-4 h-4 text-success" />
    }
    return null
  }

  const handlePlatformClick = (platform: any) => {
    if (platform.id === 'shopify') {
      setShopifyDialog(true)
    } else if (platform.id === 'prestashop') {
      setPrestashopDialog(true)
    } else {
      setSelectedPlatform(platform)
      setFormData({
        name: platform.name,
        url: '',
        credentials: ''
      })
      setConfigDialog(true)
    }
  }

  const handleTechnicalFileClick = (fileId: string) => {
    if (fileId === 'xml') {
      setXmlDialog(true)
    } else if (fileId === 'csv') {
      setCsvDialog(true)
    }
  }

  const handleConnect = async () => {
    if (!selectedPlatform || !formData.name || !formData.url || !formData.credentials) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont requis",
        variant: "destructive"
      })
      return
    }

    try {
      await addIntegration({
        platform_name: selectedPlatform.name,
        platform_type: selectedPlatform.platform_type,
        platform_url: formData.url,
        connection_status: 'connected',
        is_active: true,
        sync_frequency: 'daily',
        credentials: {
          api_key: formData.credentials
        }
      })
      setConfigDialog(false)
      setFormData({ name: '', url: '', credentials: '' })
    } catch (error) {
      console.error('Connection error:', error)
    }
  }

  // Show loading state
  if (authLoading || (integrationsLoading && !loadingTimeout)) {
    return <IntegrationsSkeleton />
  }

  // Show error state
  if (integrationsError && loadingTimeout) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <Card className="mx-auto max-w-md mt-8">
          <CardHeader className="text-center">
            <CardTitle className="text-lg text-destructive">Erreur de chargement</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              Impossible de charger les intégrations. Veuillez réessayer.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Authentification requise</h2>
          <p className="text-muted-foreground">Connectez-vous pour accéder aux intégrations.</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-primary-soft/20 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <Info className="w-3 h-3 text-primary-foreground" />
            </div>
            <p className="text-sm text-primary">
              Vous débutez avec Channable ? Commencez par notre démo interactive pour voir comment cela fonctionne: aucun import de données n'est nécessaire !
            </p>
            <Button variant="link" className="text-primary p-0 h-auto">
              Voir la démo de Channable
            </Button>
          </div>
        </div>
        <h1 className="text-2xl font-semibold mb-2">
          Configurez votre import avec des plugins
        </h1>
      </div>

      {/* Connected Integrations */}
      {(connectedIntegrations || []).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Intégrations connectées ({(connectedIntegrations || []).length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {(connectedIntegrations || []).map((integration: any) => (
              <Card key={integration.id} className="border hover:shadow-card transition-smooth bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <div>
                        <h3 className="font-medium text-foreground">{integration.platform_name}</h3>
                        <p className="text-sm text-muted-foreground">{integration.platform_url}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      Connecté
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Grille des plateformes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-12">
        {platforms.map((platform) => {
          const isConnected = isPlatformConnected(platform.id)
          return (
            <Card 
              key={platform.id}
              className={`cursor-pointer hover:shadow-card transition-smooth border bg-card ${
                isConnected ? 'border-success/30 bg-success/5' : 'hover:border-primary/30'
              }`}
              onClick={() => !isConnected && handlePlatformClick(platform)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center space-y-3 relative">
                {isConnected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                )}
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src={platform.logo} 
                    alt={platform.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/80x40/6366f1/ffffff?text=${platform.name.charAt(0)}`
                    }}
                  />
                </div>
                <h3 className="font-medium text-sm text-foreground leading-tight">
                  {platform.name}
                </h3>
                {isConnected && (
                  <Badge className="bg-success/10 text-success border-success/20 text-xs">
                    Connecté
                  </Badge>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Section fiches techniques */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">
          Ou configuration à l'aide de fiches techniques
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {technicalFiles.map((file) => (
            <Card 
              key={file.id}
              className="cursor-pointer hover:shadow-card transition-smooth border bg-card hover:border-primary/30"
              onClick={() => handleTechnicalFileClick(file.id)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  {file.icon}
                </div>
                <h3 className="font-medium text-sm text-foreground">
                  {file.name}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog de configuration */}
      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <ExternalLink className="w-5 h-5 text-primary" />
              <DialogTitle>Connecter avec</DialogTitle>
            </div>
            {selectedPlatform && (
              <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg border">
                <img 
                  src={selectedPlatform.logo} 
                  alt={selectedPlatform.name}
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/48x24/6366f1/ffffff?text=${selectedPlatform.name.charAt(0)}`
                  }}
                />
                <span className="font-medium text-foreground">{selectedPlatform.name}</span>
              </div>
            )}
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder={selectedPlatform?.name}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">URL de la plateforme *</Label>
              <Input 
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="ex: https://www.exempleboutique.fr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentials">Clé API / Token *</Label>
              <Input 
                id="credentials"
                value={formData.credentials}
                onChange={(e) => setFormData({...formData, credentials: e.target.value})}
                placeholder="Votre clé d'API ou token d'accès"
                type="password"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" className="text-primary">
                Aide
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setConfigDialog(false)}>
                  Fermer
                </Button>
                <Button 
                  onClick={handleConnect} 
                  disabled={isAdding}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  {isAdding ? 'Connexion...' : `Se connecter avec ${selectedPlatform?.name}`}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Specialized Dialogs */}
      <ShopifyConfigDialog 
        open={shopifyDialog} 
        onOpenChange={setShopifyDialog} 
      />
      <PrestaShopConfigDialog 
        open={prestashopDialog} 
        onOpenChange={setPrestashopDialog} 
      />
      <XMLConfigDialog 
        open={xmlDialog} 
        onOpenChange={setXmlDialog} 
      />
      <CSVConfigDialog 
        open={csvDialog} 
        onOpenChange={setCsvDialog} 
      />
      </div>
    </ErrorBoundary>
  )
})

Integrations.displayName = 'Integrations'

export default Integrations