import { useState } from "react";
import { Zap, Plus, CheckCircle, AlertCircle, Settings, Search, Store, Globe, ExternalLink, Key, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/layouts/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Integrations() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleConnect = (name: string, type: string) => {
    toast({
      title: "Connexion en cours",
      description: `Connexion à ${name}...`,
    });
    
    setTimeout(() => {
      toast({
        title: "Connecté !",
        description: `${name} a été connecté avec succès`,
      });
    }, 2000);
  };

  const handleConfigure = (name: string) => {
    toast({
      title: "Configuration",
      description: `Ouverture des paramètres ${name}`,
    });
  };

  const handleWebhooks = () => {
    toast({
      title: "Webhooks",
      description: "Gestion des webhooks ouverte",
    });
  };

  const handleNewIntegration = () => {
    toast({
      title: "Nouvelle intégration",
      description: "Recherche d'intégrations disponibles...",
    });
  };

  const marketplaces = [
    { name: "Shopify", connected: true, logo: "🛍️", status: "Sync actif", config: { apiKey: "sk_****", domain: "mon-store.myshopify.com" } },
    { name: "Amazon", connected: true, logo: "📦", status: "Sync actif", config: { sellerId: "A****", marketplace: "FR" } },
    { name: "eBay", connected: false, logo: "🏪", status: "Non connecté", config: {} },
    { name: "Cdiscount", connected: true, logo: "💳", status: "Sync actif", config: { token: "cd_****" } },
    { name: "Rakuten", connected: false, logo: "🏮", status: "Non connecté", config: {} },
    { name: "TikTok Shop", connected: false, logo: "🎵", status: "Non connecté", config: {} },
    { name: "Fnac", connected: false, logo: "📚", status: "Non connecté", config: {} },
    { name: "Allegro", connected: false, logo: "🛒", status: "Non connecté", config: {} },
    { name: "Facebook Shop", connected: true, logo: "📘", status: "Sync actif", config: { pageId: "fb_****" } },
    { name: "Instagram Shop", connected: true, logo: "📷", status: "Sync actif", config: { businessId: "ig_****" } },
    { name: "Google Shopping", connected: false, logo: "🛍️", status: "Non connecté", config: {} },
    { name: "Etsy", connected: false, logo: "🎨", status: "Non connecté", config: {} }
  ];

  const suppliers = [
    { name: "BigBuy", connected: true, logo: "🏭", status: "API Active", products: "50K+", config: { apiKey: "bb_****" } },
    { name: "AliExpress", connected: true, logo: "🛒", status: "API Active", products: "1M+", config: { appKey: "ae_****" } },
    { name: "Spocket", connected: false, logo: "📦", status: "Non connecté", products: "100K+", config: {} },
    { name: "CJDropshipping", connected: true, logo: "🚚", status: "API Active", products: "200K+", config: { token: "cj_****" } },
    { name: "EPROLO", connected: false, logo: "🌐", status: "Non connecté", products: "150K+", config: {} },
    { name: "Printful", connected: true, logo: "👕", status: "API Active", products: "500+", config: { token: "pf_****" } },
    { name: "Oberlo", connected: false, logo: "🔗", status: "Non connecté", products: "80K+", config: {} },
    { name: "Dropshipme", connected: false, logo: "📦", status: "Non connecté", products: "60K+", config: {} },
    { name: "Modalyst", connected: true, logo: "👗", status: "API Active", products: "2M+", config: { apiKey: "md_****" } },
    { name: "SaleHoo", connected: false, logo: "💼", status: "Non connecté", products: "8K+", config: {} },
    { name: "Worldwide Brands", connected: false, logo: "🌍", status: "Non connecté", products: "16M+", config: {} },
    { name: "Doba", connected: false, logo: "📊", status: "Non connecté", products: "2M+", config: {} }
  ];

  const tools = [
    { name: "Mailchimp", connected: true, logo: "📧", category: "Email Marketing", config: { apiKey: "mc_****" } },
    { name: "Klaviyo", connected: false, logo: "📊", category: "Email Marketing", config: {} },
    { name: "Zapier", connected: true, logo: "⚡", category: "Automation", config: { webhookUrl: "https://hooks.zapier.com/****" } },
    { name: "Make", connected: false, logo: "🔄", category: "Automation", config: {} },
    { name: "Google Analytics", connected: true, logo: "📈", category: "Analytics", config: { trackingId: "GA_****" } },
    { name: "HubSpot", connected: false, logo: "🎯", category: "CRM", config: {} },
    { name: "Stripe", connected: true, logo: "💳", category: "Payment", config: { publishableKey: "pk_****" } },
    { name: "17track", connected: true, logo: "📍", category: "Tracking", config: { apiKey: "17t_****" } },
    { name: "PayPal", connected: false, logo: "💰", category: "Payment", config: {} },
    { name: "Hotjar", connected: true, logo: "🔥", category: "Analytics", config: { siteId: "hj_****" } },
    { name: "Zendesk", connected: false, logo: "🎧", category: "Support", config: {} },
    { name: "Intercom", connected: false, logo: "💬", category: "Support", config: {} },
    { name: "WhatsApp Business", connected: true, logo: "💚", category: "Communication", config: { phoneNumber: "+33****" } },
    { name: "SMS.to", connected: false, logo: "📱", category: "Communication", config: {} },
    { name: "Sendinblue", connected: false, logo: "📮", category: "Email Marketing", config: {} },
    { name: "Twilio", connected: false, logo: "☁️", category: "Communication", config: {} }
  ];

  const connectedStores = [
    { 
      name: "Ma Boutique Principal", 
      platform: "Shopify", 
      url: "https://ma-boutique.myshopify.com",
      status: "Active",
      orders: 1247,
      revenue: "€45,320",
      products: 156
    },
    { 
      name: "Store Amazon FR", 
      platform: "Amazon", 
      url: "amazon.fr/sp?seller=A1BCDEF2345GHI",
      status: "Active",
      orders: 892,
      revenue: "€32,150",
      products: 89
    },
    { 
      name: "Boutique Cdiscount", 
      platform: "Cdiscount", 
      url: "cdiscount.com/mp-****",
      status: "Synchronisation",
      orders: 324,
      revenue: "€12,450",
      products: 67
    }
  ];

  const webhooksData = [
    {
      name: "Nouvelle Commande",
      url: "https://api.shopopti.io/webhooks/orders",
      events: ["order.created", "order.updated"],
      status: "Actif",
      lastTrigger: "Il y a 2 min",
      success: 99.8
    },
    {
      name: "Produit Mis à Jour",
      url: "https://api.shopopti.io/webhooks/products",
      events: ["product.updated", "product.created"],
      status: "Actif",
      lastTrigger: "Il y a 15 min",
      success: 99.5
    },
    {
      name: "Stock Faible",
      url: "https://api.shopopti.io/webhooks/inventory",
      events: ["inventory.low"],
      status: "Pause",
      lastTrigger: "Il y a 2h",
      success: 98.2
    },
    {
      name: "Retour Client",
      url: "https://api.shopopti.io/webhooks/returns",
      events: ["return.initiated", "return.approved"],
      status: "Actif",
      lastTrigger: "Il y a 45 min",
      success: 99.9
    }
  ];

  const getStatusBadge = (connected: boolean) => {
    return connected ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Connecté
      </Badge>
    ) : (
      <Badge variant="secondary">
        <AlertCircle className="w-3 h-3 mr-1" />
        Non connecté
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Intégrations</h1>
          <p className="text-muted-foreground">Connectez toutes vos plateformes et outils</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleWebhooks}>
            <Settings className="w-4 h-4 mr-2" />
            Webhooks
          </Button>
          <Button onClick={handleNewIntegration}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Intégration
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connectées</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold">45+</p>
              </div>
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sync/Jour</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">99.9%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une intégration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stores" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="stores">Boutiques</TabsTrigger>
          <TabsTrigger value="marketplaces">Marketplaces</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="tools">Outils</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="multi-store">Multi-boutique</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedStores.map((store, index) => (
              <Card key={index} className="hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Store className="w-8 h-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">{store.name}</h3>
                        <p className="text-sm text-muted-foreground">{store.platform}</p>
                      </div>
                    </div>
                    <Badge className={store.status === "Active" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                      {store.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Commandes</span>
                      <span className="font-medium">{store.orders}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenus</span>
                      <span className="font-medium text-green-600">{store.revenue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Produits</span>
                      <span className="font-medium">{store.products}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="w-4 h-4 mr-1" />
                      Config
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(store.url, '_blank')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[200px]">
                <Plus className="w-12 h-12 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-2">Ajouter une boutique</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Connectez une nouvelle boutique ou marketplace
                </p>
                <Button>Connecter</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="marketplaces" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketplaces.map((marketplace, index) => (
              <Card key={index} className="hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{marketplace.logo}</div>
                      <div>
                        <h3 className="font-semibold">{marketplace.name}</h3>
                        <p className="text-sm text-muted-foreground">{marketplace.status}</p>
                      </div>
                    </div>
                    {getStatusBadge(marketplace.connected)}
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant={marketplace.connected ? "outline" : "default"} 
                          size="sm" 
                          className="flex-1"
                        >
                          {marketplace.connected ? "Configurer" : "Connecter"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Configuration {marketplace.name}</DialogTitle>
                          <DialogDescription>
                            Configurez votre connexion à {marketplace.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {marketplace.name === "Shopify" && (
                            <>
                              <div>
                                <Label htmlFor="shopify-domain">Domaine de la boutique</Label>
                                <Input id="shopify-domain" placeholder="votre-boutique.myshopify.com" defaultValue={marketplace.config.domain} />
                              </div>
                              <div>
                                <Label htmlFor="shopify-token">Token d'accès privé</Label>
                                <Input id="shopify-token" type="password" placeholder="shpat_****" defaultValue={marketplace.config.apiKey} />
                              </div>
                            </>
                          )}
                          {marketplace.name === "Amazon" && (
                            <>
                              <div>
                                <Label htmlFor="amazon-seller">Seller ID</Label>
                                <Input id="amazon-seller" placeholder="A1BCDEF2345GHI" defaultValue={marketplace.config.sellerId} />
                              </div>
                              <div>
                                <Label htmlFor="amazon-marketplace">Marketplace</Label>
                                <Input id="amazon-marketplace" placeholder="FR, DE, UK..." defaultValue={marketplace.config.marketplace} />
                              </div>
                            </>
                          )}
                          {marketplace.name === "eBay" && (
                            <>
                              <div>
                                <Label htmlFor="ebay-token">Token eBay</Label>
                                <Input id="ebay-token" type="password" placeholder="v^1.1#i^1#p^3#r^0#f^0#I^3#t^****" />
                              </div>
                              <div>
                                <Label htmlFor="ebay-environment">Environnement</Label>
                                <Input id="ebay-environment" placeholder="sandbox, production" />
                              </div>
                            </>
                          )}
                          <Button className="w-full" onClick={() => handleConnect(marketplace.name, "marketplace")}>
                            {marketplace.connected ? "Mettre à jour" : "Connecter"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {marketplace.connected && (
                      <Button variant="outline" size="sm" onClick={() => handleConfigure(marketplace.name)}>
                        <Key className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier, index) => (
              <Card key={index} className="hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{supplier.logo}</div>
                      <div>
                        <h3 className="font-semibold">{supplier.name}</h3>
                        <p className="text-sm text-muted-foreground">{supplier.products} produits</p>
                      </div>
                    </div>
                    {getStatusBadge(supplier.connected)}
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant={supplier.connected ? "outline" : "default"} 
                          size="sm" 
                          className="flex-1"
                        >
                          {supplier.connected ? "Sync Catalogue" : "Connecter API"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Configuration {supplier.name}</DialogTitle>
                          <DialogDescription>
                            Configurez votre connexion API avec {supplier.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {supplier.name === "BigBuy" && (
                            <>
                              <div>
                                <Label htmlFor="bigbuy-key">Clé API BigBuy</Label>
                                <Input id="bigbuy-key" type="password" placeholder="bb_****" defaultValue={supplier.config.apiKey} />
                              </div>
                              <div>
                                <Label htmlFor="bigbuy-categories">Catégories à synchroniser</Label>
                                <Input id="bigbuy-categories" placeholder="Electronics, Fashion, Home..." />
                              </div>
                            </>
                          )}
                          {supplier.name === "AliExpress" && (
                            <>
                              <div>
                                <Label htmlFor="ali-appkey">App Key</Label>
                                <Input id="ali-appkey" type="password" placeholder="ae_****" defaultValue={supplier.config.appKey} />
                              </div>
                              <div>
                                <Label htmlFor="ali-secret">App Secret</Label>
                                <Input id="ali-secret" type="password" placeholder="Secret AliExpress" />
                              </div>
                            </>
                          )}
                          {supplier.name === "Printful" && (
                            <>
                              <div>
                                <Label htmlFor="printful-token">Token Printful</Label>
                                <Input id="printful-token" type="password" placeholder="pf_****" defaultValue={supplier.config.token} />
                              </div>
                              <div>
                                <Label htmlFor="printful-store">Store ID</Label>
                                <Input id="printful-store" placeholder="12345" />
                              </div>
                            </>
                          )}
                          <Button className="w-full" onClick={() => handleConnect(supplier.name, "supplier")}>
                            {supplier.connected ? "Mettre à jour" : "Connecter"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {supplier.connected && (
                      <Button variant="outline" size="sm" onClick={() => handleConfigure(supplier.name)}>
                        <Monitor className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool, index) => (
              <Card key={index} className="hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{tool.logo}</div>
                      <div>
                        <h3 className="font-semibold">{tool.name}</h3>
                        <p className="text-sm text-muted-foreground">{tool.category}</p>
                      </div>
                    </div>
                    {getStatusBadge(tool.connected)}
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant={tool.connected ? "outline" : "default"} 
                          size="sm" 
                          className="flex-1"
                        >
                          {tool.connected ? "Configurer" : "Connecter"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Configuration {tool.name}</DialogTitle>
                          <DialogDescription>
                            Configurez votre intégration avec {tool.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {tool.name === "Mailchimp" && (
                            <>
                              <div>
                                <Label htmlFor="mailchimp-key">Clé API Mailchimp</Label>
                                <Input id="mailchimp-key" type="password" placeholder="mc_****" defaultValue={tool.config.apiKey} />
                              </div>
                              <div>
                                <Label htmlFor="mailchimp-list">Liste par défaut</Label>
                                <Input id="mailchimp-list" placeholder="ID de la liste" />
                              </div>
                            </>
                          )}
                          {tool.name === "Stripe" && (
                            <>
                              <div>
                                <Label htmlFor="stripe-publishable">Clé publique</Label>
                                <Input id="stripe-publishable" placeholder="pk_****" defaultValue={tool.config.publishableKey} />
                              </div>
                              <div>
                                <Label htmlFor="stripe-secret">Clé secrète</Label>
                                <Input id="stripe-secret" type="password" placeholder="sk_****" />
                              </div>
                            </>
                          )}
                          {tool.name === "Google Analytics" && (
                            <>
                              <div>
                                <Label htmlFor="ga-tracking">ID de suivi</Label>
                                <Input id="ga-tracking" placeholder="GA_****" defaultValue={tool.config.trackingId} />
                              </div>
                              <div>
                                <Label htmlFor="ga-property">ID de propriété</Label>
                                <Input id="ga-property" placeholder="Property ID" />
                              </div>
                            </>
                          )}
                          <Button className="w-full" onClick={() => handleConnect(tool.name, "tool")}>
                            {tool.connected ? "Mettre à jour" : "Connecter"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {tool.connected && (
                      <Button variant="outline" size="sm" onClick={() => handleConfigure(tool.name)}>
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks Configurés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooksData.map((webhook, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{webhook.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{webhook.url}</p>
                      <div className="flex gap-2 mb-2">
                        {webhook.events.map((event, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{event}</Badge>
                        ))}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Dernier trigger: {webhook.lastTrigger}</span>
                        <span>Succès: {webhook.success}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={webhook.status === "Actif" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                        {webhook.status}
                      </Badge>
                      <Button variant="outline" size="sm">Modifier</Button>
                      <Button variant="outline" size="sm">Test</Button>
                    </div>
                  </div>
                ))}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un Webhook
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouveau Webhook</DialogTitle>
                      <DialogDescription>
                        Configurez un nouveau webhook pour recevoir des notifications
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="webhook-name">Nom du webhook</Label>
                        <Input id="webhook-name" placeholder="Nom descriptif" />
                      </div>
                      <div>
                        <Label htmlFor="webhook-url">URL de destination</Label>
                        <Input id="webhook-url" placeholder="https://votre-site.com/webhook" />
                      </div>
                      <div>
                        <Label htmlFor="webhook-events">Événements à écouter</Label>
                        <Input id="webhook-events" placeholder="order.created, product.updated..." />
                      </div>
                      <Button className="w-full">Créer le Webhook</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multi-store" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Configuration Multi-boutique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Synchronisation globale</Label>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Inventaire partagé</span>
                    <Badge className="bg-green-100 text-green-800">Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Prix unifiés</span>
                    <Badge className="bg-green-100 text-green-800">Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Commandes centralisées</span>
                    <Badge className="bg-orange-100 text-orange-800">Pause</Badge>
                  </div>
                </div>
                <Button className="w-full">Configurer la Synchronisation</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Règles de Gestion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="text-sm font-medium">Répartition automatique</span>
                      <p className="text-xs text-muted-foreground">Stock distribué selon les ventes</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="text-sm font-medium">Prix dynamiques</span>
                      <p className="text-xs text-muted-foreground">Ajustement selon la marketplace</p>
                    </div>
                    <Badge variant="secondary">Inactif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="text-sm font-medium">Commandes prioritaires</span>
                      <p className="text-xs text-muted-foreground">Traitement par rentabilité</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full">Gérer les Règles</Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance des Boutiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Shopify Principal</span>
                    <Badge className="bg-green-100 text-green-800">Leader</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conversion</span>
                      <span className="font-medium">3.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Panier moyen</span>
                      <span className="font-medium">€67.50</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Marge</span>
                      <span className="font-medium text-green-600">34.5%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Amazon FR</span>
                    <Badge className="bg-blue-100 text-blue-800">Volume</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conversion</span>
                      <span className="font-medium">8.7%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Panier moyen</span>
                      <span className="font-medium">€42.30</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Marge</span>
                      <span className="font-medium text-orange-600">18.2%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Cdiscount</span>
                    <Badge variant="secondary">Émergent</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conversion</span>
                      <span className="font-medium">2.1%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Panier moyen</span>
                      <span className="font-medium">€58.90</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Marge</span>
                      <span className="font-medium text-green-600">28.7%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}