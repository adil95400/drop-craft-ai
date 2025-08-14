import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search,
  Plus,
  Settings,
  CheckCircle,
  Clock,
  Zap,
  ShoppingCart,
  BarChart3,
  Truck,
  CreditCard,
  Globe,
  Users,
  ArrowRight,
  Star,
  TrendingUp,
  Shield,
  Activity
} from "lucide-react"
import { useRealIntegrations } from "@/hooks/useRealIntegrations"
import { motion } from "framer-motion"

const IntegrationsOptimized = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { integrations: realIntegrations, stats, isLoading } = useRealIntegrations()

  // Données optimisées des intégrations avec métriques
  const integrationCategories = {
    ecommerce: {
      name: "E-commerce",
      icon: ShoppingCart,
      color: "from-blue-500 to-cyan-500",
      items: [
        {
          name: "Shopify",
          description: "Synchronisez vos produits et commandes avec votre boutique Shopify",
          logo: "https://logos-world.net/wp-content/uploads/2020/11/Shopify-Logo.png",
          status: "connected",
          features: ["Sync produits", "Gestion stock", "Commandes auto"],
          popularity: 98,
          metrics: { stores: "2M+", growth: "+15%" }
        },
        {
          name: "WooCommerce", 
          description: "Intégration complète avec votre boutique WordPress WooCommerce",
          logo: "https://logos-world.net/wp-content/uploads/2020/11/WooCommerce-Logo.png",
          status: "available",
          features: ["Import/Export", "Webhooks", "API REST"],
          popularity: 92,
          metrics: { stores: "5M+", growth: "+8%" }
        },
        {
          name: "PrestaShop",
          description: "Connectez votre boutique PrestaShop en quelques clics",
          logo: "https://logos-world.net/wp-content/uploads/2020/11/PrestaShop-Logo.png", 
          status: "available",
          features: ["Sync bidirectionnelle", "Modules natifs", "Support multi-langues"],
          popularity: 85,
          metrics: { stores: "300K+", growth: "+12%" }
        }
      ]
    },
    suppliers: {
      name: "Fournisseurs",
      icon: Truck,
      color: "from-green-500 to-emerald-500",
      items: [
        {
          name: "AliExpress",
          description: "Import automatique des meilleurs produits AliExpress",
          logo: "https://logos-world.net/wp-content/uploads/2020/05/AliExpress-Logo.png",
          status: "connected",
          features: ["API officielle", "Prix temps réel", "Stock auto"],
          popularity: 96,
          metrics: { products: "100M+", suppliers: "200K+" }
        },
        {
          name: "BigBuy",
          description: "Fournisseur dropshipping européen de confiance",
          logo: "https://www.bigbuy.eu/skin/frontend/bigbuy/default/images/logo.svg",
          status: "available",
          features: ["Catalogue EU", "Livraison rapide", "Support français"],
          popularity: 88,
          metrics: { products: "500K+", delivery: "24-48h" }
        }
      ]
    },
    marketing: {
      name: "Marketing",
      icon: BarChart3,
      color: "from-purple-500 to-pink-500",
      items: [
        {
          name: "Google Ads",
          description: "Créez et gérez vos campagnes publicitaires Google",
          logo: "https://logos-world.net/wp-content/uploads/2020/09/Google-Ads-Logo.png",
          status: "available",
          features: ["Campagnes auto", "Conversion tracking", "Smart bidding"],
          popularity: 94,
          metrics: { reach: "90% web", roas: "4.2x avg" }
        },
        {
          name: "Mailchimp",
          description: "Email marketing automation pour vos clients",
          logo: "https://logos-world.net/wp-content/uploads/2021/02/Mailchimp-Logo.png",
          status: "connected",
          features: ["Segmentation auto", "Abandoned cart", "A/B testing"],
          popularity: 87,
          metrics: { users: "12M+", opens: "21.5%" }
        }
      ]
    },
    payments: {
      name: "Paiements",
      icon: CreditCard,
      color: "from-orange-500 to-red-500",
      items: [
        {
          name: "Stripe",
          description: "Processeur de paiement moderne et sécurisé",
          logo: "https://logos-world.net/wp-content/uploads/2021/03/Stripe-Logo.png",
          status: "connected",
          features: ["Multi-devises", "Subscriptions", "Fraud protection"],
          popularity: 91,
          metrics: { volume: "$640B+", countries: "46+" }
        },
        {
          name: "PayPal",
          description: "Solution de paiement globale et trusted",
          logo: "https://logos-world.net/wp-content/uploads/2020/04/PayPal-Logo.png",
          status: "connected",
          features: ["Express checkout", "Pay Later", "Seller protection"],
          popularity: 89,
          metrics: { users: "426M", merchants: "35M" }
        }
      ]
    }
  }

  // Filtrage optimisé avec mémoisation
  const filteredIntegrations = useMemo(() => {
    let allIntegrations: any[] = []
    
    if (selectedCategory === "all") {
      Object.values(integrationCategories).forEach(category => {
        allIntegrations.push(...category.items.map(item => ({ ...item, category: category.name })))
      })
    } else {
      const category = integrationCategories[selectedCategory as keyof typeof integrationCategories]
      allIntegrations = category?.items.map(item => ({ ...item, category: category.name })) || []
    }

    if (searchTerm) {
      return allIntegrations.filter(integration =>
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return allIntegrations
  }, [selectedCategory, searchTerm])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connecté
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        )
      default:
        return <Badge variant="outline">Disponible</Badge>
    }
  }

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 95) return "text-success"
    if (popularity >= 85) return "text-warning"
    return "text-muted-foreground"
  }

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header avec animation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Intégrations Ultra Pro
          </h1>
          <p className="text-muted-foreground mt-2">
            Connectez vos outils préférés avec notre plateforme IA
          </p>
        </div>
        <Button size="lg" className="self-start lg:self-center">
          <Plus className="w-4 h-4 mr-2" />
          Demander une intégration
        </Button>
      </motion.div>

      {/* Recherche optimisée */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher une intégration..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 border-border/50 focus:border-primary/50"
        />
      </motion.div>

      {/* Stats améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Intégrations",
            value: Object.values(integrationCategories).reduce((acc, cat) => acc + cat.items.length, 0),
            change: "+5 ce mois",
            icon: Globe,
            color: "from-blue-500 to-cyan-500"
          },
          {
            title: "Connectées",
            value: stats.connected || 6,
            change: "Actives maintenant",
            icon: CheckCircle,
            color: "from-green-500 to-emerald-500"
          },
          {
            title: "Catégories",
            value: Object.keys(integrationCategories).length,
            change: "Tous secteurs",
            icon: BarChart3,
            color: "from-purple-500 to-pink-500"
          },
          {
            title: "Popularité",
            value: "94%",
            change: "Taux d'adoption",
            icon: TrendingUp,
            color: "from-orange-500 to-red-500"
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="border-border/50 hover:border-primary/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs optimisées */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Toutes ({Object.values(integrationCategories).reduce((acc, cat) => acc + cat.items.length, 0)})
          </TabsTrigger>
          {Object.entries(integrationCategories).map(([key, category]) => (
            <TabsTrigger 
              key={key} 
              value={key}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <category.icon className="w-4 h-4 mr-2" />
              {category.name} ({category.items.length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map((integration, index) => (
              <motion.div
                key={`${integration.name}-${index}`}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            src={integration.logo} 
                            alt={integration.name}
                            className="w-12 h-12 object-contain rounded-lg"
                          />
                          {integration.status === 'connected' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {integration.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {integration.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {integration.description}
                    </p>
                    
                    {/* Métriques de popularité */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Star className={`w-4 h-4 ${getPopularityColor(integration.popularity)}`} />
                        <span className="text-sm font-medium">{integration.popularity}% popularité</span>
                      </div>
                      {integration.metrics && (
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(integration.metrics).map(([key, value], idx) => (
                            <span key={key}>
                              {String(value)}
                              {idx < Object.entries(integration.metrics).length - 1 && " • "}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Fonctionnalités */}
                    <div className="flex flex-wrap gap-2">
                      {integration.features.map((feature: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Action button */}
                    <Button 
                      className="w-full group/btn" 
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
                          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Section d'aide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">Intégrations sécurisées</h3>
                <p className="text-sm text-muted-foreground">
                  Toutes nos intégrations utilisent des connexions chiffrées et respectent les standards de sécurité.
                </p>
              </div>
              <Button variant="outline" className="ml-auto">
                En savoir plus
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default IntegrationsOptimized