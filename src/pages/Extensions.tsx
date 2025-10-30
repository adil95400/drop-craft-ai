import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnhancedIntegrationsHub } from '@/components/integrations/EnhancedIntegrationsHub'
import { ExtensionStore } from '@/components/extensions/ExtensionStore'
import { ExtensionNavigator } from '@/components/extensions/ExtensionNavigator'
import { ExtensionAuthManager } from '@/components/extensions/ExtensionAuthManager'
import { ExtensionInstallGuide } from '@/components/extensions/ExtensionInstallGuide'
import { ExtensionDashboard } from '@/components/extensions/ExtensionDashboard'
import { ReviewImporterConfig } from '@/components/extensions/ReviewImporterConfig'
import { AliExpressImporter } from '@/components/extensions/AliExpressImporter'
import { PriceMonitoring, StockAlerts, AutoOrders, MonitoringConfig, AutomationDashboard } from '@/components/autods'
import { 
  Puzzle, Zap, Grid, Chrome, BookOpen, Activity, Star, ShoppingCart, 
  TrendingUp, Package, ShoppingBag, Settings, Bot, ArrowRight, Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function Extensions() {
  const [activeTab, setActiveTab] = useState('overview')

  const automationFeatures = [
    {
      icon: TrendingUp,
      title: "Monitoring Prix",
      description: "Surveillance automatique des prix fournisseurs en temps réel",
      value: "price-monitoring",
      badge: "Auto",
      color: "text-blue-500"
    },
    {
      icon: Package,
      title: "Alertes Stock",
      description: "Notifications instantanées pour les niveaux de stock critiques",
      value: "stock-alerts",
      badge: "Live",
      color: "text-orange-500"
    },
    {
      icon: ShoppingBag,
      title: "Commandes Auto",
      description: "Système de commande automatique avec fournisseurs",
      value: "auto-orders",
      badge: "Smart",
      color: "text-green-500"
    },
    {
      icon: Bot,
      title: "Automation Hub",
      description: "Centre de contrôle pour toutes vos automatisations",
      value: "automation-dashboard",
      badge: "Pro",
      color: "text-purple-500"
    },
  ]

  const extensionTools = [
    {
      icon: Activity,
      title: "Dashboard",
      description: "Vue d'ensemble de vos extensions et intégrations",
      value: "dashboard",
      color: "text-indigo-500"
    },
    {
      icon: Grid,
      title: "Centre Extensions",
      description: "Gérez toutes vos extensions depuis un seul endroit",
      value: "navigator",
      color: "text-cyan-500"
    },
    {
      icon: Puzzle,
      title: "Extension Store",
      description: "Découvrez et installez de nouvelles extensions",
      value: "store",
      color: "text-pink-500"
    },
  ]

  const integrationTools = [
    {
      icon: Zap,
      title: "Intégrations",
      description: "Connectez vos plateformes e-commerce",
      value: "integrations",
      color: "text-yellow-500"
    },
    {
      icon: Chrome,
      title: "Extension Chrome",
      description: "Gestion de l'authentification Chrome",
      value: "chrome",
      color: "text-blue-600"
    },
    {
      icon: Star,
      title: "Importeur d'Avis",
      description: "Importez des avis clients automatiquement",
      value: "reviews",
      color: "text-amber-500"
    },
    {
      icon: ShoppingCart,
      title: "AliExpress",
      description: "Importation rapide depuis AliExpress",
      value: "aliexpress",
      color: "text-red-500"
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-heading font-bold tracking-tight flex items-center gap-3">
                <Sparkles className="w-10 h-10 text-primary animate-pulse-subtle" />
                Extensions & Automatisations
              </h1>
              <p className="text-lg text-muted-foreground">
                Automatisez votre business avec nos outils intelligents
              </p>
            </div>
            <Button className="btn-gradient">
              <Settings className="w-4 h-4 mr-2" />
              Configuration
            </Button>
          </div>
        </motion.div>

        {/* Main Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">AutoDS</span>
            </TabsTrigger>
            <TabsTrigger value="extensions" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Puzzle className="w-4 h-4" />
              <span className="hidden sm:inline">Extensions</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Intégrations</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Featured AutoDS Section */}
              <motion.div variants={fadeIn}>
                <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50">
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-heading flex items-center gap-2">
                        <Bot className="w-6 h-6 text-primary" />
                        Système AutoDS
                        <Badge variant="default" className="ml-2 bg-gradient-primary">
                          Nouveau
                        </Badge>
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveTab('automation')}
                        className="hover:bg-primary/10"
                      >
                        Voir tout
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                    <CardDescription className="text-base">
                      Automatisation complète du dropshipping avec monitoring intelligent et commandes automatiques
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {automationFeatures.map((feature, index) => (
                        <motion.div
                          key={feature.value}
                          variants={fadeIn}
                          custom={index}
                          whileHover={{ scale: 1.05, y: -5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Card 
                            className="cursor-pointer card-hover border-border/50 bg-card/80 backdrop-blur-sm"
                            onClick={() => {
                              setActiveTab('automation')
                              // Add logic to scroll to specific section if needed
                            }}
                          >
                            <CardContent className="pt-6 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-xl bg-gradient-to-br from-background to-muted ${feature.color}`}>
                                  <feature.icon className="w-6 h-6" />
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {feature.badge}
                                </Badge>
                              </div>
                              <div>
                                <h3 className="font-semibold text-base mb-1">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {feature.description}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Extensions Section */}
              <motion.div variants={fadeIn}>
                <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
                  <Puzzle className="w-6 h-6 text-primary" />
                  Outils & Extensions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {extensionTools.map((tool) => (
                    <Card 
                      key={tool.value}
                      className="card-hover cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm"
                      onClick={() => setActiveTab('extensions')}
                    >
                      <CardContent className="pt-6 space-y-3">
                        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br from-background to-muted ${tool.color}`}>
                          <tool.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{tool.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {tool.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>

              {/* Integrations Section */}
              <motion.div variants={fadeIn}>
                <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-primary" />
                  Intégrations Disponibles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {integrationTools.map((tool) => (
                    <Card 
                      key={tool.value}
                      className="card-hover cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm"
                      onClick={() => setActiveTab('integrations')}
                    >
                      <CardContent className="pt-6 space-y-3">
                        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br from-background to-muted ${tool.color}`}>
                          <tool.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{tool.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {tool.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Tabs defaultValue="price-monitoring" className="space-y-4">
              <TabsList className="w-full justify-start bg-card/50 backdrop-blur-sm flex-wrap h-auto gap-2 p-2">
                <TabsTrigger value="price-monitoring" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Prix
                </TabsTrigger>
                <TabsTrigger value="stock-alerts" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Stock
                </TabsTrigger>
                <TabsTrigger value="auto-orders" className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Commandes
                </TabsTrigger>
                <TabsTrigger value="monitoring-config" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Config
                </TabsTrigger>
                <TabsTrigger value="automation-dashboard" className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="price-monitoring">
                <PriceMonitoring />
              </TabsContent>
              
              <TabsContent value="stock-alerts">
                <StockAlerts />
              </TabsContent>
              
              <TabsContent value="auto-orders">
                <AutoOrders />
              </TabsContent>
              
              <TabsContent value="monitoring-config">
                <MonitoringConfig />
              </TabsContent>
              
              <TabsContent value="automation-dashboard">
                <AutomationDashboard />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Extensions Tab */}
          <TabsContent value="extensions" className="space-y-6">
            <Tabs defaultValue="dashboard" className="space-y-4">
              <TabsList className="w-full justify-start bg-card/50 backdrop-blur-sm flex-wrap h-auto gap-2 p-2">
                <TabsTrigger value="dashboard">
                  <Activity className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="navigator">
                  <Grid className="w-4 h-4 mr-2" />
                  Centre
                </TabsTrigger>
                <TabsTrigger value="store">
                  <Puzzle className="w-4 h-4 mr-2" />
                  Store
                </TabsTrigger>
                <TabsTrigger value="guide">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Guide
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard">
                <ExtensionDashboard />
              </TabsContent>
              
              <TabsContent value="navigator">
                <ExtensionNavigator />
              </TabsContent>
              
              <TabsContent value="store">
                <ExtensionStore />
              </TabsContent>
              
              <TabsContent value="guide">
                <ExtensionInstallGuide />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Tabs defaultValue="hub" className="space-y-4">
              <TabsList className="w-full justify-start bg-card/50 backdrop-blur-sm flex-wrap h-auto gap-2 p-2">
                <TabsTrigger value="hub">
                  <Zap className="w-4 h-4 mr-2" />
                  Hub
                </TabsTrigger>
                <TabsTrigger value="chrome">
                  <Chrome className="w-4 h-4 mr-2" />
                  Chrome
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  <Star className="w-4 h-4 mr-2" />
                  Avis
                </TabsTrigger>
                <TabsTrigger value="aliexpress">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  AliExpress
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="hub">
                <EnhancedIntegrationsHub />
              </TabsContent>
              
              <TabsContent value="chrome">
                <ExtensionAuthManager />
              </TabsContent>
              
              <TabsContent value="reviews">
                <ReviewImporterConfig />
              </TabsContent>
              
              <TabsContent value="aliexpress">
                <AliExpressImporter />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
