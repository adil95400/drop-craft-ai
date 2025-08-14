import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { RealIntegrationsTab } from "@/components/integrations/RealIntegrationsTab";
import { Settings as SettingsIcon, User, Bell, Key, Palette, Globe, Shield, CreditCard, Zap, Save, Upload, Moon, Sun, Monitor, Mail, Smartphone, Database, Copy, Eye, EyeOff, Trash2, Plus, Check, X, Crown, Briefcase, Users } from "lucide-react";
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
    aliexpress: true,
    ebay: false,
    facebook: true,
    google: false
  });
  const [apiKeys, setApiKeys] = useState([{
    id: 1,
    name: "Production API",
    key: "sk_live_***************************",
    visible: false,
    created: "2024-01-15"
  }, {
    id: 2,
    name: "Development API",
    key: "sk_test_***************************",
    visible: false,
    created: "2024-01-10"
  }]);
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("fr");
  const navigate = useNavigate();
  const handleSaveProfile = () => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 1000)), {
      loading: 'Sauvegarde du profil...',
      success: 'Profil sauvegardé avec succès',
      error: 'Erreur lors de la sauvegarde'
    });
  };
  const handleSaveNotifications = () => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 800)), {
      loading: 'Sauvegarde des préférences...',
      success: 'Préférences de notification sauvegardées',
      error: 'Erreur lors de la sauvegarde'
    });
  };
  const handleApiKeyGenerate = () => {
    toast.promise(new Promise(resolve => {
      setTimeout(() => {
        const newKey = {
          id: Date.now(),
          name: "Nouvelle API Key",
          key: `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
          visible: false,
          created: new Date().toISOString().split('T')[0]
        };
        setApiKeys([...apiKeys, newKey]);
        resolve('success');
      }, 1200);
    }), {
      loading: 'Génération de la nouvelle clé API...',
      success: 'Nouvelle clé API créée avec succès',
      error: 'Erreur lors de la génération'
    });
  };
  const toggleKeyVisibility = (id: number) => {
    setApiKeys(apiKeys.map(key => key.id === id ? {
      ...key,
      visible: !key.visible
    } : key));
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Clé API copiée dans le presse-papier');
  };
  const deleteApiKey = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette clé API ?')) {
      setApiKeys(apiKeys.filter(key => key.id !== id));
      toast.success('Clé API supprimée avec succès');
    }
  };
  const plans = [{
    name: "Starter",
    price: 29,
    current: false,
    features: ["1000 produits", "Suivi basique", "Support email"]
  }, {
    name: "Professional",
    price: 79,
    current: true,
    features: ["Produits illimités", "IA avancée", "Support prioritaire", "API"]
  }, {
    name: "Enterprise",
    price: 199,
    current: false,
    features: ["Tout inclus", "White-label", "Support dédié", "Multi-utilisateurs"]
  }];
  return <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-purple-500">
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

      <Tabs defaultValue="profile" className="w-full">
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
              <TabsList className="grid w-full grid-cols-1 h-auto bg-transparent p-1 space-y-1">
                <TabsTrigger value="profile" className="justify-start w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </TabsTrigger>
                <TabsTrigger value="notifications" className="justify-start w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" className="justify-start w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Shield className="mr-2 h-4 w-4" />
                  Sécurité
                </TabsTrigger>
                <TabsTrigger value="integrations" className="justify-start w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Database className="mr-2 h-4 w-4" />
                  Intégrations
                </TabsTrigger>
                <TabsTrigger value="billing" className="justify-start w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Facturation
                </TabsTrigger>
                <TabsTrigger value="api" className="justify-start w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Key className="mr-2 h-4 w-4" />
                  API
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
                
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
                          <Input id="name" value={profile.name} onChange={e => setProfile({
                      ...profile,
                      name: e.target.value
                    })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={profile.email} onChange={e => setProfile({
                      ...profile,
                      email: e.target.value
                    })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Téléphone</Label>
                          <Input id="phone" value={profile.phone} onChange={e => setProfile({
                      ...profile,
                      phone: e.target.value
                    })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Entreprise</Label>
                          <Input id="company" value={profile.company} onChange={e => setProfile({
                      ...profile,
                      company: e.target.value
                    })} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Site web</Label>
                        <Input id="website" value={profile.website} onChange={e => setProfile({
                    ...profile,
                    website: e.target.value
                  })} />
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
                          <Switch checked={notifications.email} onCheckedChange={checked => setNotifications({
                      ...notifications,
                      email: checked
                    })} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">Push</div>
                              <div className="text-sm text-muted-foreground">Notifications navigateur</div>
                            </div>
                          </div>
                          <Switch checked={notifications.push} onCheckedChange={checked => setNotifications({
                      ...notifications,
                      push: checked
                    })} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">SMS</div>
                              <div className="text-sm text-muted-foreground">Notifications par SMS</div>
                            </div>
                          </div>
                          <Switch checked={notifications.sms} onCheckedChange={checked => setNotifications({
                      ...notifications,
                      sms: checked
                    })} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Types de notifications</h4>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Mises à jour commandes</div>
                            <div className="text-sm text-muted-foreground">Statut des colis et livraisons</div>
                          </div>
                          <Switch checked={notifications.orderUpdates} onCheckedChange={checked => setNotifications({
                      ...notifications,
                      orderUpdates: checked
                    })} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Nouvelles fonctionnalités</div>
                            <div className="text-sm text-muted-foreground">Annonces produit et mises à jour</div>
                          </div>
                          <Switch checked={notifications.newFeatures} onCheckedChange={checked => setNotifications({
                      ...notifications,
                      newFeatures: checked
                    })} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Marketing</div>
                            <div className="text-sm text-muted-foreground">Conseils et recommandations</div>
                          </div>
                          <Switch checked={notifications.marketing} onCheckedChange={checked => setNotifications({
                      ...notifications,
                      marketing: checked
                    })} />
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
                  <RealIntegrationsTab />
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
                          {plans.map((plan, index) => <div key={index} className={`p-4 border rounded-lg ${plan.current ? 'border-primary ring-2 ring-primary shadow-glow' : 'border-border'}`}>
                              <div className="text-center space-y-3">
                                <h3 className="font-semibold">{plan.name}</h3>
                                <div className="text-2xl font-bold">€{plan.price}</div>
                                <ul className="text-sm space-y-1">
                                  {plan.features.map((feature, i) => <li key={i} className="text-muted-foreground">• {feature}</li>)}
                                </ul>
                                {plan.current ? <Badge variant="default">Plan Actuel</Badge> : <Button variant="outline" className="w-full">
                                    Passer à ce plan
                                  </Button>}
                              </div>
                            </div>)}
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
                      <CardDescription>Gérez l'accès à votre API Shopopti Pro</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        {apiKeys.map(apiKey => <div key={apiKey.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{apiKey.name}</div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {apiKey.visible ? apiKey.key : `${apiKey.key.substring(0, 12)}${'•'.repeat(20)}`}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Créée le {apiKey.created}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => toggleKeyVisibility(apiKey.id)}>
                                {apiKey.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiKey.key)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteApiKey(apiKey.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>)}
                      </div>

                      <Button onClick={handleApiKeyGenerate} variant="hero">
                        <Plus className="mr-2 h-4 w-4" />
                        Générer Nouvelle Clé
                      </Button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-border bg-muted/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Documentation API</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                              Guide complet pour intégrer notre API
                            </p>
                            <Button variant="outline" size="sm" onClick={() => navigate('/integrations')}>
                              <Globe className="mr-2 h-4 w-4" />
                              Voir Documentation
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="border-border bg-muted/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Limite d'utilisation</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Utilisé ce mois</span>
                                <span>2,847 / 10,000</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full" style={{
                            width: '28%'
                          }}></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preferences Tab */}
                  <Card className="border-border bg-card shadow-card mt-6">
                    <CardHeader>
                      <CardTitle>Préférences Globales</CardTitle>
                      <CardDescription>Configurez l'apparence et le comportement de l'application</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label>Thème</Label>
                          <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir un thème" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">
                                <div className="flex items-center gap-2">
                                  <Sun className="h-4 w-4" />
                                  Clair
                                </div>
                              </SelectItem>
                              <SelectItem value="dark">
                                <div className="flex items-center gap-2">
                                  <Moon className="h-4 w-4" />
                                  Sombre
                                </div>
                              </SelectItem>
                              <SelectItem value="system">
                                <div className="flex items-center gap-2">
                                  <Monitor className="h-4 w-4" />
                                  Système
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label>Langue</Label>
                          <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir une langue" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fr">🇫🇷 Français</SelectItem>
                              <SelectItem value="en">🇬🇧 English</SelectItem>
                              <SelectItem value="es">🇪🇸 Español</SelectItem>
                              <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Paramètres d'affichage</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Mode compact</div>
                              <div className="text-sm text-muted-foreground">Réduire l'espacement de l'interface</div>
                            </div>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Animations</div>
                              <div className="text-sm text-muted-foreground">Activer les transitions animées</div>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Sons système</div>
                              <div className="text-sm text-muted-foreground">Sons pour les notifications</div>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>;
};
export default Settings;