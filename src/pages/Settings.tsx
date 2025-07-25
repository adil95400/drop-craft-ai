import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Key, 
  Palette, 
  Globe, 
  Shield,
  CreditCard,
  Zap,
  Save,
  Upload,
  Moon,
  Sun,
  Monitor,
  Mail,
  Smartphone,
  Database
} from "lucide-react";

const Settings = () => {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "+33 6 12 34 56 78",
    company: "Mon E-commerce",
    website: "https://mon-ecommerce.com"
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: true,
    newFeatures: true,
    orderUpdates: true
  });

  const [integrations, setIntegrations] = useState({
    shopify: true,
    woocommerce: false,
    bigcommerce: false,
    amazon: true,
    aliexpress: true
  });

  const { toast } = useToast();

  const handleSaveProfile = () => {
    toast({
      title: "Profil sauvegardé",
      description: "Vos informations ont été mises à jour",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Préférences sauvegardées",
      description: "Vos notifications ont été configurées",
    });
  };

  const handleApiKeyGenerate = () => {
    toast({
      title: "Clé API générée",
      description: "Nouvelle clé d'API créée avec succès",
    });
  };

  const plans = [
    {
      name: "Starter",
      price: 29,
      current: false,
      features: ["1000 produits", "Suivi basique", "Support email"]
    },
    {
      name: "Professional", 
      price: 79,
      current: true,
      features: ["Produits illimités", "IA avancée", "Support prioritaire", "API"]
    },
    {
      name: "Enterprise",
      price: 199,
      current: false,
      features: ["Tout inclus", "White-label", "Support dédié", "Multi-utilisateurs"]
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Paramètres
          </h1>
          <p className="text-muted-foreground mt-1">
            Configurez votre compte et vos préférences
          </p>
        </div>
        <Button variant="hero">
          <Save className="mr-2 h-4 w-4" />
          Sauvegarder Tout
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Navigation */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="profile" orientation="vertical" className="w-full">
              <TabsList className="grid w-full grid-cols-1 h-auto bg-transparent">
                <TabsTrigger value="profile" className="justify-start w-full">
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </TabsTrigger>
                <TabsTrigger value="notifications" className="justify-start w-full">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" className="justify-start w-full">
                  <Shield className="mr-2 h-4 w-4" />
                  Sécurité
                </TabsTrigger>
                <TabsTrigger value="integrations" className="justify-start w-full">
                  <Database className="mr-2 h-4 w-4" />
                  Intégrations
                </TabsTrigger>
                <TabsTrigger value="billing" className="justify-start w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Facturation
                </TabsTrigger>
                <TabsTrigger value="api" className="justify-start w-full">
                  <Key className="mr-2 h-4 w-4" />
                  API
                </TabsTrigger>
              </TabsList>

              {/* Right Content Area */}
              <div className="lg:col-span-3 ml-6">
                
                {/* Profile Tab */}
                <TabsContent value="profile" className="mt-0">
                  <Card className="border-border bg-card shadow-card">
                    <CardHeader>
                      <CardTitle>Informations Personnelles</CardTitle>
                      <CardDescription>Gérez vos informations de profil</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                            {profile.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <Button variant="outline">
                          <Upload className="mr-2 h-4 w-4" />
                          Changer la photo
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nom complet</Label>
                          <Input
                            id="name"
                            value={profile.name}
                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({...profile, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Téléphone</Label>
                          <Input
                            id="phone"
                            value={profile.phone}
                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Entreprise</Label>
                          <Input
                            id="company"
                            value={profile.company}
                            onChange={(e) => setProfile({...profile, company: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Site web</Label>
                        <Input
                          id="website"
                          value={profile.website}
                          onChange={(e) => setProfile({...profile, website: e.target.value})}
                        />
                      </div>

                      <Button onClick={handleSaveProfile} variant="hero">
                        Sauvegarder le Profil
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="mt-0">
                  <Card className="border-border bg-card shadow-card">
                    <CardHeader>
                      <CardTitle>Préférences de Notification</CardTitle>
                      <CardDescription>Configurez comment vous souhaitez être notifié</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      
                      <div className="space-y-4">
                        <h4 className="font-semibold">Canaux de notification</h4>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">Email</div>
                              <div className="text-sm text-muted-foreground">Notifications par email</div>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.email}
                            onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">Push</div>
                              <div className="text-sm text-muted-foreground">Notifications navigateur</div>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.push}
                            onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">SMS</div>
                              <div className="text-sm text-muted-foreground">Notifications par SMS</div>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.sms}
                            onCheckedChange={(checked) => setNotifications({...notifications, sms: checked})}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Types de notifications</h4>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Mises à jour commandes</div>
                            <div className="text-sm text-muted-foreground">Statut des colis et livraisons</div>
                          </div>
                          <Switch
                            checked={notifications.orderUpdates}
                            onCheckedChange={(checked) => setNotifications({...notifications, orderUpdates: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Nouvelles fonctionnalités</div>
                            <div className="text-sm text-muted-foreground">Annonces produit et mises à jour</div>
                          </div>
                          <Switch
                            checked={notifications.newFeatures}
                            onCheckedChange={(checked) => setNotifications({...notifications, newFeatures: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Marketing</div>
                            <div className="text-sm text-muted-foreground">Conseils et recommandations</div>
                          </div>
                          <Switch
                            checked={notifications.marketing}
                            onCheckedChange={(checked) => setNotifications({...notifications, marketing: checked})}
                          />
                        </div>
                      </div>

                      <Button onClick={handleSaveNotifications} variant="hero">
                        Sauvegarder les Préférences
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="mt-0">
                  <Card className="border-border bg-card shadow-card">
                    <CardHeader>
                      <CardTitle>Sécurité</CardTitle>
                      <CardDescription>Protégez votre compte</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Mot de passe</h4>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Mot de passe actuel</Label>
                            <Input type="password" placeholder="••••••••" />
                          </div>
                          <div className="space-y-2">
                            <Label>Nouveau mot de passe</Label>
                            <Input type="password" placeholder="••••••••" />
                          </div>
                          <div className="space-y-2">
                            <Label>Confirmer nouveau mot de passe</Label>
                            <Input type="password" placeholder="••••••••" />
                          </div>
                        </div>
                        <Button variant="outline">
                          Changer le Mot de Passe
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Authentification à deux facteurs</h4>
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div>
                            <div className="font-medium">2FA</div>
                            <div className="text-sm text-muted-foreground">Sécurité supplémentaire pour votre compte</div>
                          </div>
                          <Button variant="outline">
                            Activer 2FA
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Sessions actives</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                            <div>
                              <div className="font-medium">Chrome sur Windows</div>
                              <div className="text-sm text-muted-foreground">Paris, France • Actuelle</div>
                            </div>
                            <Badge variant="secondary">Actuelle</Badge>
                          </div>
                          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                            <div>
                              <div className="font-medium">Safari sur iPhone</div>
                              <div className="text-sm text-muted-foreground">Paris, France • Il y a 2h</div>
                            </div>
                            <Button variant="outline" size="sm">
                              Déconnecter
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Integrations Tab */}
                <TabsContent value="integrations" className="mt-0">
                  <Card className="border-border bg-card shadow-card">
                    <CardHeader>
                      <CardTitle>Intégrations</CardTitle>
                      <CardDescription>Connectez vos plateformes e-commerce</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {[
                        { name: "Shopify", icon: "🛒", connected: integrations.shopify, key: "shopify" },
                        { name: "WooCommerce", icon: "🏪", connected: integrations.woocommerce, key: "woocommerce" },
                        { name: "BigCommerce", icon: "🛍️", connected: integrations.bigcommerce, key: "bigcommerce" },
                        { name: "Amazon", icon: "📦", connected: integrations.amazon, key: "amazon" },
                        { name: "AliExpress", icon: "🇨🇳", connected: integrations.aliexpress, key: "aliexpress" }
                      ].map((integration, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{integration.icon}</span>
                            <div>
                              <div className="font-medium">{integration.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {integration.connected ? "Connecté" : "Non connecté"}
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={integration.connected}
                            onCheckedChange={(checked) => setIntegrations({
                              ...integrations, 
                              [integration.key]: checked
                            })}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing" className="mt-0">
                  <div className="space-y-6">
                    <Card className="border-border bg-card shadow-card">
                      <CardHeader>
                        <CardTitle>Plan Actuel</CardTitle>
                        <CardDescription>Gérez votre abonnement</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {plans.map((plan, index) => (
                            <div 
                              key={index} 
                              className={`p-4 border rounded-lg ${
                                plan.current ? 'border-primary ring-2 ring-primary shadow-glow' : 'border-border'
                              }`}
                            >
                              <div className="text-center space-y-3">
                                <h3 className="font-semibold">{plan.name}</h3>
                                <div className="text-2xl font-bold">€{plan.price}</div>
                                <ul className="text-sm space-y-1">
                                  {plan.features.map((feature, i) => (
                                    <li key={i} className="text-muted-foreground">• {feature}</li>
                                  ))}
                                </ul>
                                {plan.current ? (
                                  <Badge variant="default">Plan Actuel</Badge>
                                ) : (
                                  <Button variant="outline" className="w-full">
                                    Passer à ce plan
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-card shadow-card">
                      <CardHeader>
                        <CardTitle>Méthode de Paiement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <div className="font-medium">•••• •••• •••• 4242</div>
                              <div className="text-sm text-muted-foreground">Expire 12/25</div>
                            </div>
                          </div>
                          <Button variant="outline">
                            Modifier
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* API Tab */}
                <TabsContent value="api" className="mt-0">
                  <Card className="border-border bg-card shadow-card">
                    <CardHeader>
                      <CardTitle>Clés API</CardTitle>
                      <CardDescription>Gérez l'accès à votre API</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div>
                            <div className="font-medium">Clé API Production</div>
                            <div className="text-sm text-muted-foreground font-mono">sk_prod_••••••••••••••••</div>
                          </div>
                          <Button variant="outline" size="sm">
                            Révéler
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div>
                            <div className="font-medium">Clé API Test</div>
                            <div className="text-sm text-muted-foreground font-mono">sk_test_••••••••••••••••</div>
                          </div>
                          <Button variant="outline" size="sm">
                            Révéler
                          </Button>
                        </div>
                      </div>

                      <Button onClick={handleApiKeyGenerate} variant="hero">
                        <Key className="mr-2 h-4 w-4" />
                        Générer Nouvelle Clé
                      </Button>

                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Documentation API</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Accédez à notre documentation complète pour intégrer l'API Shopopti Pro dans vos applications.
                        </p>
                        <Button variant="outline" size="sm">
                          <Globe className="mr-2 h-4 w-4" />
                          Voir la Documentation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;