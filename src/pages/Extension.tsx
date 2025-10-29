
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Chrome, Download, Settings, Zap, Play, BookOpen, BarChart3, History, Key } from "lucide-react"
import { ExtensionAuthManager } from "@/components/browser-extension/ExtensionAuthManager"
import { ExtensionUpdateNotification } from "@/components/extensions/ExtensionUpdateNotification"
import { ExtensionHealthMonitor } from "@/components/extensions/ExtensionHealthMonitor"
import { ExtensionInstallGuide } from "@/components/extensions/ExtensionInstallGuide"
import { toast } from "@/hooks/use-toast"

export default function Extension() {
  const [activeTab, setActiveTab] = useState("install")
  
  const handleAddToChrome = () => {
    window.open('https://chromewebstore.google.com', '_blank')
    toast({
      title: "Redirection vers Chrome Web Store",
      description: "Vous allez être redirigé vers le Chrome Web Store pour installer l'extension",
    })
  }

  const handleDownloadExtension = () => {
    const extensionPath = '/chrome-extension'
    const link = document.createElement('a')
    link.href = extensionPath
    link.download = 'shopopti-extension'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Téléchargement de l'extension",
      description: "L'extension est disponible dans le dossier public/chrome-extension du projet",
    })
  }

  const handleViewDemo = () => {
    window.open('https://www.youtube.com/watch?v=demo', '_blank')
    toast({
      title: "Démo de l'extension",
      description: "Visionnez la vidéo de démonstration pour découvrir toutes les fonctionnalités",
    })
  }

  const handleOpenGuide = () => {
    setActiveTab("guide")
    toast({
      title: "Guide d'installation",
      description: "Consultez le guide pour installer et configurer l'extension",
    })
  }

  const handleConfigure = () => {
    setActiveTab("auth")
    toast({
      title: "Configuration",
      description: "Configurez votre authentification pour l'extension",
    })
  }
  const features = [
    {
      title: "Import en 1 clic",
      description: "Importez des produits directement depuis n'importe quel site e-commerce",
      icon: Zap
    },
    {
      title: "Analyse automatique",
      description: "Analyse des prix, avis et données concurrentielles en temps réel",
      icon: BarChart3
    },
    {
      title: "Synchronisation",
      description: "Synchronisation automatique avec votre catalogue Shopopti",
      icon: Chrome
    }
  ]

  const supportedSites = [
    "AliExpress", "Amazon", "eBay", "Wish", "Banggood", 
    "DHgate", "Shopify stores", "WooCommerce stores",
    "Bigcommerce stores", "Et bien d'autres..."
  ]

  const recentImports = [
    {
      site: "AliExpress",
      product: "Montre Sport Pro",
      time: "Il y a 2h",
      status: "success"
    },
    {
      site: "Amazon",
      product: "Écouteurs Bluetooth",
      time: "Il y a 5h",
      status: "success"
    },
    {
      site: "eBay",
      product: "Câble USB-C",
      time: "Il y a 1j",
      status: "pending"
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
        {/* Update Notification */}
        <div className="mb-6">
          <ExtensionUpdateNotification />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Extension Chrome</h1>
            <p className="text-muted-foreground mt-2">
              Importez des produits en 1 clic depuis n'importe quel site web
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenGuide}>
              <BookOpen className="w-4 h-4 mr-2" />
              Guide
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleDownloadExtension}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger Extension
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">
                  Shopopti Chrome Extension
                </h2>
                <p className="text-muted-foreground mb-6">
                  Transformez votre navigateur en outil de sourcing ultra-puissant. 
                  Importez, analysez et synchronisez vos produits depuis n'importe quel site e-commerce.
                </p>
                <div className="flex gap-4">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={handleAddToChrome}>
                    <Chrome className="w-5 h-5 mr-2" />
                    Ajouter à Chrome
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleViewDemo}>
                    <Play className="w-5 h-5 mr-2" />
                    Voir Démo
                  </Button>
                </div>
              </div>
              
              <div className="w-full lg:w-1/2">
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Chrome className="w-6 h-6 text-blue-600" />
                    <span className="font-semibold">Extension Shopopti</span>
                    <Badge className="bg-green-500">v2.1.4</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Status</span>
                      <Badge className="bg-green-500">Connecté</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Imports aujourd'hui</span>
                      <span className="font-semibold">23 produits</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <feature.icon className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="install">Installation</TabsTrigger>
            <TabsTrigger value="guide">Guide</TabsTrigger>
            <TabsTrigger value="auth">Authentification</TabsTrigger>
            <TabsTrigger value="usage">Utilisation</TabsTrigger>
            <TabsTrigger value="sites">Sites Supportés</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="install">
            <Card>
              <CardHeader>
                <CardTitle>Installation Rapide</CardTitle>
                <CardDescription>
                  Installez et configurez l'extension en quelques clics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Télécharger l'extension</h3>
                      <p className="text-muted-foreground mb-3">
                        Cliquez sur le bouton ci-dessous pour installer l'extension depuis le Chrome Web Store
                      </p>
                      <Button onClick={handleAddToChrome}>
                        <Chrome className="w-4 h-4 mr-2" />
                        Ajouter à Chrome
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Se connecter</h3>
                      <p className="text-muted-foreground mb-3">
                        Utilisez vos identifiants Shopopti pour connecter l'extension à votre compte
                      </p>
                      <Button variant="outline" size="sm" onClick={handleConfigure}>
                        <Settings className="w-4 h-4 mr-2" />
                        Configurer
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Commencer l'import</h3>
                      <p className="text-muted-foreground">
                        Naviguez sur un site e-commerce et cliquez sur l'icône Shopopti pour importer un produit
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guide">
            <ExtensionInstallGuide />
          </TabsContent>

          <TabsContent value="auth">
            <ExtensionAuthManager />
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Guide d'utilisation</CardTitle>
                <CardDescription>
                  Apprenez à utiliser l'extension efficacement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Import rapide</h3>
                    <p className="text-muted-foreground mb-3">
                      Sur une page produit, cliquez sur l'icône Shopopti dans la barre d'outils pour ouvrir le panel d'import.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm"><strong>Astuce :</strong> L'extension détecte automatiquement les informations produit (titre, prix, images, description)</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Analyse concurrentielle</h3>
                    <p className="text-muted-foreground mb-3">
                      L'extension analyse automatiquement les avis, les prix et la concurrence pour vous aider à prendre de meilleures décisions.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Synchronisation</h3>
                    <p className="text-muted-foreground">
                      Tous les produits importés sont automatiquement synchronisés avec votre catalogue Shopopti.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sites">
            <Card>
              <CardHeader>
                <CardTitle>Sites Supportés</CardTitle>
                <CardDescription>
                  L'extension fonctionne sur plus de 1000+ sites e-commerce
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {supportedSites.map((site, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">{site}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Nouveau site ?</strong> L'extension s'adapte automatiquement à la plupart des sites e-commerce. 
                    Si vous rencontrez des problèmes, contactez notre support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring">
            <ExtensionHealthMonitor />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Historique des Imports
                </CardTitle>
                <CardDescription>
                  Suivez vos imports via l'extension Chrome
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentImports.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Chrome className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">{item.product}</h3>
                          <p className="text-sm text-muted-foreground">
                            Depuis {item.site} • {item.time}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={item.status === 'success' ? 'default' : 'secondary'}
                        className={item.status === 'success' ? 'bg-green-500' : ''}
                      >
                        {item.status === 'success' ? 'Importé' : 'En cours'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}