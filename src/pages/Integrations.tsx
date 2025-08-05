import { useState } from "react"
import { AppLayout } from "@/layouts/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
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
  Users
} from "lucide-react"

const Integrations = () => {
  const [searchTerm, setSearchTerm] = useState("")

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

  return (
    <AppLayout>
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
              <div className="text-2xl font-bold">{getAllIntegrations().length}</div>
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
                {getAllIntegrations().filter(i => i.status === 'connected').length}
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

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Toutes ({getAllIntegrations().length})</TabsTrigger>
            <TabsTrigger value="ecommerce">E-commerce ({ecommerceIntegrations.length})</TabsTrigger>
            <TabsTrigger value="suppliers">Fournisseurs ({supplierIntegrations.length})</TabsTrigger>
            <TabsTrigger value="marketing">Marketing ({marketingIntegrations.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics ({analyticsIntegrations.length})</TabsTrigger>
            <TabsTrigger value="payments">Paiements ({paymentIntegrations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={integration.logo} 
                          alt={integration.name}
                          className="w-10 h-10 object-contain"
                        />
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {getCategoryIcon(integration.category)}
                            <span className="text-xs text-muted-foreground">{integration.category}</span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">{integration.description}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {integration.popularity}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {integration.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      
                      <Button 
                        className="w-full" 
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                      >
                        {integration.status === 'connected' ? (
                          <>
                            <Settings className="w-4 h-4 mr-2" />
                            Configurer
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Connecter
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ecommerce">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ecommerceIntegrations.map((integration, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={integration.logo} 
                          alt={integration.name}
                          className="w-10 h-10 object-contain"
                        />
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <ShoppingCart className="w-3 h-3" />
                            <span className="text-xs text-muted-foreground">E-commerce</span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">{integration.description}</p>
                    <div className="space-y-3">
                      <Badge variant="outline" className="text-xs">
                        {integration.popularity}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        className="w-full" 
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                      >
                        {integration.status === 'connected' ? 'Gérer' : 'Connecter'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="suppliers">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supplierIntegrations.map((integration, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={integration.logo} 
                          alt={integration.name}
                          className="w-10 h-10 object-contain"
                        />
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Truck className="w-3 h-3" />
                            <span className="text-xs text-muted-foreground">Fournisseur</span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">{integration.description}</p>
                    <div className="space-y-3">
                      <Badge variant="outline" className="text-xs">
                        {integration.popularity}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        className="w-full" 
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                      >
                        {integration.status === 'connected' ? 'Gérer' : 'Connecter'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="marketing">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketingIntegrations.map((integration, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={integration.logo} 
                          alt={integration.name}
                          className="w-10 h-10 object-contain"
                        />
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <BarChart3 className="w-3 h-3" />
                            <span className="text-xs text-muted-foreground">Marketing</span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">{integration.description}</p>
                    <div className="space-y-3">
                      <Badge variant="outline" className="text-xs">
                        {integration.popularity}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        className="w-full" 
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                      >
                        {integration.status === 'connected' ? 'Gérer' : 'Connecter'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyticsIntegrations.map((integration, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={integration.logo} 
                          alt={integration.name}
                          className="w-10 h-10 object-contain"
                        />
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <BarChart3 className="w-3 h-3" />
                            <span className="text-xs text-muted-foreground">Analytics</span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">{integration.description}</p>
                    <div className="space-y-3">
                      <Badge variant="outline" className="text-xs">
                        {integration.popularity}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        className="w-full" 
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                      >
                        {integration.status === 'connected' ? 'Gérer' : 'Connecter'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paymentIntegrations.map((integration, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={integration.logo} 
                          alt={integration.name}
                          className="w-10 h-10 object-contain"
                        />
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <CreditCard className="w-3 h-3" />
                            <span className="text-xs text-muted-foreground">Paiement</span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">{integration.description}</p>
                    <div className="space-y-3">
                      <Badge variant="outline" className="text-xs">
                        {integration.popularity}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        className="w-full" 
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                      >
                        {integration.status === 'connected' ? 'Gérer' : 'Connecter'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

export default Integrations