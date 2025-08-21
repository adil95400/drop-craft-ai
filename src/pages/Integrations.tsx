import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Search,
  Plus,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  ShoppingCart,
  BarChart3,
  Mail,
  MessageSquare,
  Truck,
  CreditCard,
  Globe,
  Users,
  ExternalLink,
  RotateCw,
  Activity
} from "lucide-react"
import { useRealIntegrations } from "@/hooks/useRealIntegrations"
import { useToast } from "@/hooks/use-toast"
import { IntegrationModal } from "@/components/integrations/IntegrationModal"
import { IntegrationsTable } from "@/components/integrations/IntegrationsTable"
import { SyncLogsTable } from "@/components/integrations/SyncLogsTable"
import { CreateIntegrationForm } from "@/components/integrations/CreateIntegrationForm"
import { RealIntegrationsManager } from "@/components/integrations/RealIntegrationsManager"
import { WebhookManager } from "@/components/integrations/WebhookManager"
import { RealTimeMonitor } from "@/components/integrations/RealTimeMonitor"
import { APIKeysManager } from "@/components/integrations/APIKeysManager"
import { IntegrationHealthMonitor } from "@/components/integrations/IntegrationHealthMonitor"
import { IntegrationAnalytics } from "@/components/integrations/IntegrationAnalytics"
import { ConnectionManager } from "@/components/integrations/ConnectionManager"
import { TemplateMarketplace } from "@/components/integrations/TemplateMarketplace"
import { WorkflowBuilder } from "@/components/integrations/WorkflowBuilder"
import { AdvancedFiltering } from "@/components/integrations/AdvancedFiltering"
import { CompleteMarketplace } from "@/components/integrations/CompleteMarketplace"
import { QuickSetup } from "@/components/integrations/QuickSetup"

const Integrations = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const { 
    integrations: realIntegrations, 
    stats, 
    isLoading,
    connectShopify,
    connectAliExpress,
    connectBigBuy,
    testConnection,
    syncProducts,
    syncOrders,
    deleteIntegration
  } = useRealIntegrations()
  const { toast } = useToast()

  const ecommerceIntegrations = [
    {
      name: "Shopify",
      description: "Synchronisez vos produits et commandes avec votre boutique Shopify",
      logo: "https://logos-world.net/wp-content/uploads/2020/11/Shopify-Logo.png",
      category: "E-commerce",
      status: "connected",
      features: ["Sync produits", "Gestion stock", "Commandes auto"],
      popularity: "Très populaire"
    },
    {
      name: "WooCommerce", 
      description: "Intégration complète avec votre boutique WordPress WooCommerce",
      logo: "https://logos-world.net/wp-content/uploads/2020/11/WooCommerce-Logo.png",
      category: "E-commerce",
      status: "available",
      features: ["Import/Export", "Webhooks", "API REST"],
      popularity: "Populaire"
    },
    {
      name: "PrestaShop",
      description: "Connectez votre boutique PrestaShop en quelques clics",
      logo: "https://logos-world.net/wp-content/uploads/2020/11/PrestaShop-Logo.png", 
      category: "E-commerce",
      status: "available",
      features: ["Sync bidirectionnelle", "Modules natifs", "Support multi-langues"],
      popularity: "Populaire"
    },
    {
      name: "Magento",
      description: "Solution enterprise pour boutiques Magento",
      logo: "https://logos-world.net/wp-content/uploads/2020/09/Magento-Logo.png",
      category: "E-commerce", 
      status: "available",
      features: ["API GraphQL", "Sync temps réel", "Multi-stores"],
      popularity: "Enterprise"
    }
  ]

  const supplierIntegrations = [
    {
      name: "AliExpress",
      description: "Import automatique des meilleurs produits AliExpress",
      logo: "https://logos-world.net/wp-content/uploads/2020/05/AliExpress-Logo.png",
      category: "Fournisseurs",
      status: "connected",
      features: ["API officielle", "Prix temps réel", "Stock auto"],
      popularity: "Leader mondial"
    },
    {
      name: "Amazon",
      description: "Accès aux produits Amazon via API officielle",
      logo: "https://logos-world.net/wp-content/uploads/2020/04/Amazon-Logo.png",
      category: "Fournisseurs", 
      status: "connected",
      features: ["Products API", "Advertising API", "FBA Integration"],
      popularity: "Marketplace #1"
    },
    {
      name: "eBay",
      description: "Synchronisation avec la marketplace eBay",
      logo: "https://logos-world.net/wp-content/uploads/2020/11/eBay-Logo.png",
      category: "Fournisseurs",
      status: "available", 
      features: ["Trading API", "Finding API", "Shopping API"],
      popularity: "Marketplace historique"
    },
    {
      name: "BigBuy",
      description: "Fournisseur dropshipping européen de confiance",
      logo: "https://www.bigbuy.eu/skin/frontend/bigbuy/default/images/logo.svg",
      category: "Fournisseurs",
      status: "available",
      features: ["Catalogue EU", "Livraison rapide", "Support français"],
      popularity: "Premium EU"
    }
  ]

  const marketingIntegrations = [
    {
      name: "Google Ads",
      description: "Créez et gérez vos campagnes publicitaires Google",
      logo: "https://logos-world.net/wp-content/uploads/2020/09/Google-Ads-Logo.png",
      category: "Marketing",
      status: "available",
      features: ["Campagnes auto", "Conversion tracking", "Smart bidding"],
      popularity: "Essentiel"
    },
    {
      name: "Facebook Ads",
      description: "Publicités Facebook et Instagram optimisées IA",
      logo: "https://logos-world.net/wp-content/uploads/2020/05/Facebook-Logo.png", 
      category: "Marketing",
      status: "available",
      features: ["Pixel Facebook", "Catalogues produits", "Lookalike audiences"],
      popularity: "Social #1"
    },
    {
      name: "Mailchimp",
      description: "Email marketing automation pour vos clients",
      logo: "https://logos-world.net/wp-content/uploads/2021/02/Mailchimp-Logo.png",
      category: "Marketing",
      status: "connected",
      features: ["Segmentation auto", "Abandoned cart", "A/B testing"],
      popularity: "Email leader"
    },
    {
      name: "Klaviyo",
      description: "Plateforme email marketing avancée pour e-commerce",
      logo: "https://logos-world.net/wp-content/uploads/2021/03/Klaviyo-Logo.png",
      category: "Marketing", 
      status: "available",
      features: ["CDP intégré", "Flows avancés", "Revenue attribution"],
      popularity: "E-commerce spécialisé"
    }
  ]

  const analyticsIntegrations = [
    {
      name: "Google Analytics",
      description: "Suivi avancé des performances de votre boutique",
      logo: "https://logos-world.net/wp-content/uploads/2020/03/Google-Analytics-Logo.png",
      category: "Analytics",
      status: "connected",
      features: ["GA4", "E-commerce tracking", "Custom events"],
      popularity: "Standard web"
    },
    {
      name: "Hotjar",
      description: "Heatmaps et enregistrements de sessions utilisateurs",
      logo: "https://logos-world.net/wp-content/uploads/2021/01/Hotjar-Logo.png",
      category: "Analytics",
      status: "available", 
      features: ["Heatmaps", "Session recordings", "Feedback polls"],
      popularity: "UX insights"
    },
    {
      name: "Mixpanel",
      description: "Analytics produit avancé et cohort analysis",
      logo: "https://logos-world.net/wp-content/uploads/2021/02/Mixpanel-Logo.png",
      category: "Analytics",
      status: "available",
      features: ["Event tracking", "Funnels", "Retention analysis"],
      popularity: "Product analytics"
    }
  ]

  const paymentIntegrations = [
    {
      name: "Stripe",
      description: "Processeur de paiement moderne et sécurisé",
      logo: "https://logos-world.net/wp-content/uploads/2021/03/Stripe-Logo.png",
      category: "Paiement",
      status: "connected",
      features: ["Multi-devises", "Subscriptions", "Fraud protection"],
      popularity: "Fintech leader"
    },
    {
      name: "PayPal",
      description: "Solution de paiement globale et trusted",
      logo: "https://logos-world.net/wp-content/uploads/2020/04/PayPal-Logo.png",
      category: "Paiement", 
      status: "connected",
      features: ["Express checkout", "Pay Later", "Seller protection"],
      popularity: "Confiance mondiale"
    },
    {
      name: "Klarna",
      description: "Paiement en plusieurs fois pour vos clients",
      logo: "https://logos-world.net/wp-content/uploads/2021/02/Klarna-Logo.png",
      category: "Paiement",
      status: "available",
      features: ["Buy now pay later", "Installments", "Banking"],
      popularity: "BNPL leader"
    }
  ]

  const getAllIntegrations = () => {
    return [
      ...ecommerceIntegrations,
      ...supplierIntegrations, 
      ...marketingIntegrations,
      ...analyticsIntegrations,
      ...paymentIntegrations
    ]
  }

  const filteredIntegrations = getAllIntegrations().filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Connecté</Badge>
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />En attente</Badge>
      default:
        return <Badge variant="outline">Disponible</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "E-commerce": return <ShoppingCart className="w-4 h-4" />
      case "Fournisseurs": return <Truck className="w-4 h-4" />
      case "Marketing": return <BarChart3 className="w-4 h-4" />
      case "Analytics": return <BarChart3 className="w-4 h-4" />
      case "Paiement": return <CreditCard className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const handleConnect = async (integration: any, credentials?: any) => {
    try {
      switch (integration.name) {
        case 'Shopify':
          await connectShopify(credentials)
          break
        case 'AliExpress':
          await connectAliExpress(credentials)
          break
        case 'BigBuy':
          await connectBigBuy(credentials)
          break
        default:
          toast({
            title: "Intégration en cours de développement",
            description: `L'intégration ${integration.name} sera bientôt disponible.`
          })
      }
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Impossible de connecter l'intégration.",
        variant: "destructive"
      })
    }
  }

  const handleSync = async (integration: any) => {
    try {
      await syncProducts({ integrationId: integration.id, platform: 'products' })
      toast({
        title: "Synchronisation lancée",
        description: `Synchronisation des données ${integration.name} en cours.`
      })
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de lancer la synchronisation.",
        variant: "destructive"
      })
    }
  }

  const handleTest = async (integration: any) => {
    try {
      await testConnection(integration.id)
      toast({
        title: "Test réussi",
        description: `La connexion à ${integration.name} fonctionne correctement.`
      })
    } catch (error) {
      toast({
        title: "Test échoué",
        description: "La connexion ne fonctionne pas correctement.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Intégrations</h1>
            <p className="text-muted-foreground">
              Connectez vos outils préférés en quelques clics
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Demander une intégration
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher une intégration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Intégrations</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realIntegrations.length || getAllIntegrations().length}</div>
              <p className="text-xs text-muted-foreground">
                +5 ce mois-ci
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connectées</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.connected || getAllIntegrations().filter(i => i.status === 'connected').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Actives maintenant
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                E-commerce, Marketing, etc.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Popularité</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">
                Taux d'adoption moyen
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="real" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-1 p-1 bg-muted/30 rounded-lg h-auto">
            <TabsTrigger value="real" className="flex-col gap-1 h-auto py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50">
              <CheckCircle className="h-3 w-3" />
              <span className="text-xs font-medium">Réelles</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex-col gap-1 h-auto py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50">
              <Settings className="h-3 w-3" />
              <span className="text-xs font-medium">Gestion</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex-col gap-1 h-auto py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50">
              <Plus className="h-3 w-3" />
              <span className="text-xs font-medium">Créer</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-col gap-1 h-auto py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50">
              <BarChart3 className="h-3 w-3" />
              <span className="text-xs font-medium">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex-col gap-1 h-auto py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50">
              <Zap className="h-3 w-3" />
              <span className="text-xs font-medium">Webhooks</span>
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex-col gap-1 h-auto py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50">
              <Activity className="h-3 w-3" />
              <span className="text-xs font-medium">Monitor</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex-col gap-1 h-auto py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50">
              <ExternalLink className="h-3 w-3" />
              <span className="text-xs font-medium">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex-col gap-1 h-auto py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50">
              <Users className="h-3 w-3" />
              <span className="text-xs font-medium">Santé</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-col gap-1 h-auto py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50">
              <BarChart3 className="h-3 w-3" />
              <span className="text-xs font-medium">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex-col gap-1 h-auto py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50">
              <Globe className="h-3 w-3" />
              <span className="text-xs font-medium">Connexions</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex-col gap-1 h-auto py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50">
              <Globe className="h-3 w-3" />
              <span className="text-xs font-medium">Complet</span>
            </TabsTrigger>
            <TabsTrigger value="quick" className="flex-col gap-1 h-auto py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 hover:bg-background/50">
              <Zap className="h-3 w-3" />
              <span className="text-xs font-medium">Setup</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="real" className="space-y-6">
            <RealIntegrationsManager />
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <IntegrationsTable />
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <CreateIntegrationForm />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <SyncLogsTable />
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <WebhookManager />
          </TabsContent>

          <TabsContent value="monitor" className="space-y-6">
            <RealTimeMonitor />
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <APIKeysManager />
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <IntegrationHealthMonitor />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <IntegrationAnalytics />
          </TabsContent>

          <TabsContent value="connections" className="space-y-6">
            <ConnectionManager />
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-6">
            <CompleteMarketplace />
          </TabsContent>

          <TabsContent value="quick">
            <QuickSetup />
          </TabsContent>
        </Tabs>
    </div>
  )
}

export default Integrations