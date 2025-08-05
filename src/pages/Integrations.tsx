import { useState } from "react";
import { Zap, Plus, CheckCircle, AlertCircle, Settings, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    { name: "Shopify", connected: true, logo: "🛍️", status: "Sync actif" },
    { name: "Amazon", connected: true, logo: "📦", status: "Sync actif" },
    { name: "eBay", connected: false, logo: "🏪", status: "Non connecté" },
    { name: "Cdiscount", connected: true, logo: "💳", status: "Sync actif" },
    { name: "Rakuten", connected: false, logo: "🏮", status: "Non connecté" },
    { name: "TikTok Shop", connected: false, logo: "🎵", status: "Non connecté" }
  ];

  const suppliers = [
    { name: "BigBuy", connected: true, logo: "🏭", status: "API Active", products: "50K+" },
    { name: "AliExpress", connected: true, logo: "🛒", status: "API Active", products: "1M+" },
    { name: "Spocket", connected: false, logo: "📦", status: "Non connecté", products: "100K+" },
    { name: "CJDropshipping", connected: true, logo: "🚚", status: "API Active", products: "200K+" },
    { name: "EPROLO", connected: false, logo: "🌐", status: "Non connecté", products: "150K+" },
    { name: "Printful", connected: true, logo: "👕", status: "API Active", products: "500+" }
  ];

  const tools = [
    { name: "Mailchimp", connected: true, logo: "📧", category: "Email Marketing" },
    { name: "Klaviyo", connected: false, logo: "📊", category: "Email Marketing" },
    { name: "Zapier", connected: true, logo: "⚡", category: "Automation" },
    { name: "Make", connected: false, logo: "🔄", category: "Automation" },
    { name: "Google Analytics", connected: true, logo: "📈", category: "Analytics" },
    { name: "HubSpot", connected: false, logo: "🎯", category: "CRM" },
    { name: "Stripe", connected: true, logo: "💳", category: "Payment" },
    { name: "17track", connected: true, logo: "📍", category: "Tracking" }
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

      <Tabs defaultValue="marketplaces" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketplaces">Marketplaces</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="tools">Outils</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

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
                  <Button 
                    variant={marketplace.connected ? "outline" : "default"} 
                    size="sm" 
                    className="w-full"
                    onClick={() => marketplace.connected ? handleConfigure(marketplace.name) : handleConnect(marketplace.name, "marketplace")}
                  >
                    {marketplace.connected ? "Configurer" : "Connecter"}
                  </Button>
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
                  <Button 
                    variant={supplier.connected ? "outline" : "default"} 
                    size="sm" 
                    className="w-full"
                    onClick={() => supplier.connected ? handleConfigure(supplier.name) : handleConnect(supplier.name, "supplier")}
                  >
                    {supplier.connected ? "Sync Catalogue" : "Connecter API"}
                  </Button>
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
                  <Button 
                    variant={tool.connected ? "outline" : "default"} 
                    size="sm" 
                    className="w-full"
                    onClick={() => tool.connected ? handleConfigure(tool.name) : handleConnect(tool.name, "tool")}
                  >
                    {tool.connected ? "Configurer" : "Connecter"}
                  </Button>
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
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Nouvelle Commande</h4>
                    <p className="text-sm text-muted-foreground">https://api.shopopti.io/webhooks/orders</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Actif</Badge>
                    <Button variant="outline" size="sm">Modifier</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Produit Mis à Jour</h4>
                    <p className="text-sm text-muted-foreground">https://api.shopopti.io/webhooks/products</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Actif</Badge>
                    <Button variant="outline" size="sm">Modifier</Button>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}