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
import { useAuth } from "@/contexts/AuthContext";
import { RealIntegrationsTab } from "@/components/integrations/RealIntegrationsTab";
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
  Database, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  Crown, 
  Briefcase, 
  Users,
  LogOut,
  ExternalLink,
  FileText
} from "lucide-react";
import AvatarUpload from '@/components/common/AvatarUpload';

const Settings = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    name: profile?.full_name || user?.email?.split('@')[0] || "Utilisateur",
    email: user?.email || "",
    phone: profile?.phone || "",
    company: profile?.company || "",
    website: profile?.website || "",
    bio: profile?.bio || ""
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
  
  // File upload ref
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        full_name: profileData.name,
        phone: profileData.phone,
        company: profileData.company,
        website: profileData.website,
        bio: profileData.bio
      });
      
      toast.success('Profil sauvegardé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde du profil');
    }
  };

  const handleSaveNotifications = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 800)), 
      {
        loading: 'Sauvegarde des préférences...',
        success: 'Préférences de notification sauvegardées',
        error: 'Erreur lors de la sauvegarde'
      }
    );
  };

  const handleApiKeyGenerate = () => {
    toast.promise(
      new Promise(resolve => {
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
      }), 
      {
        loading: 'Génération de la nouvelle clé API...',
        success: 'Nouvelle clé API créée avec succès',
        error: 'Erreur lors de la génération'
      }
    );
  };

  const toggleKeyVisibility = (id: number) => {
    setApiKeys(apiKeys.map(key => 
      key.id === id ? { ...key, visible: !key.visible } : key
    ));
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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      navigate('/');
    }
  };

  // Remove this function as we'll use AvatarUpload component

  const goToApiDocumentation = () => {
    // Ouvrir la documentation API dans un nouvel onglet
    window.open('/api-docs', '_blank');
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
          <Button variant="hero" onClick={handleSaveProfile}>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
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
                <TabsTrigger value="appearance" className="justify-start w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Palette className="mr-2 h-4 w-4" />
                  Apparence
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
                  <AvatarUpload 
                    currentAvatarUrl={profile?.avatar_url}
                    userName={profileData.name}
                    size="lg"
                    showUploadButton={true}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input 
                        id="name" 
                        value={profileData.name} 
                        onChange={e => setProfileData({
                          ...profileData,
                          name: e.target.value
                        })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={profileData.email} 
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input 
                        id="phone" 
                        value={profileData.phone} 
                        onChange={e => setProfileData({
                          ...profileData,
                          phone: e.target.value
                        })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Entreprise</Label>
                      <Input 
                        id="company" 
                        value={profileData.company} 
                        onChange={e => setProfileData({
                          ...profileData,
                          company: e.target.value
                        })} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Site web</Label>
                    <Input 
                      id="website" 
                      value={profileData.website} 
                      onChange={e => setProfileData({
                        ...profileData,
                        website: e.target.value
                      })} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      value={profileData.bio} 
                      onChange={e => setProfileData({
                        ...profileData,
                        bio: e.target.value
                      })} 
                      placeholder="Parlez-nous de vous..."
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleSaveProfile} variant="hero">
                    <Save className="mr-2 h-4 w-4" />
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
                        onCheckedChange={checked => setNotifications({
                          ...notifications,
                          email: checked
                        })} 
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
                        onCheckedChange={checked => setNotifications({
                          ...notifications,
                          push: checked
                        })} 
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
                        onCheckedChange={checked => setNotifications({
                          ...notifications,
                          sms: checked
                        })} 
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
                        onCheckedChange={checked => setNotifications({
                          ...notifications,
                          orderUpdates: checked
                        })} 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Nouvelles fonctionnalités</div>
                        <div className="text-sm text-muted-foreground">Annonces produit et mises à jour</div>
                      </div>
                      <Switch 
                        checked={notifications.newFeatures} 
                        onCheckedChange={checked => setNotifications({
                          ...notifications,
                          newFeatures: checked
                        })} 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Marketing</div>
                        <div className="text-sm text-muted-foreground">Conseils et recommandations</div>
                      </div>
                      <Switch 
                        checked={notifications.marketing} 
                        onCheckedChange={checked => setNotifications({
                          ...notifications,
                          marketing: checked
                        })} 
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveNotifications} variant="hero">
                    <Save className="mr-2 h-4 w-4" />
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
                      <Shield className="mr-2 h-4 w-4" />
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
                        <Key className="mr-2 h-4 w-4" />
                        Activer 2FA
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Sessions actives</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <div className="font-medium">Session actuelle</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date().toLocaleString('fr-FR')}
                          </div>
                        </div>
                        <Badge variant="secondary">Actuelle</Badge>
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
              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <CardTitle>Facturation & Abonnement</CardTitle>
                  <CardDescription>Gérez votre plan et vos paiements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Plan actuel</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {plans.map((plan) => (
                        <div 
                          key={plan.name} 
                          className={`p-4 border rounded-lg ${plan.current ? 'border-primary bg-primary/5' : 'border-border'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold">{plan.name}</h5>
                            {plan.current && <Badge variant="secondary">Actuel</Badge>}
                          </div>
                          <div className="text-2xl font-bold mb-2">{plan.price}€<span className="text-sm font-normal">/mois</span></div>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center">
                                <Check className="h-3 w-3 mr-2 text-primary" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          {!plan.current && (
                            <Button variant="outline" className="w-full mt-3">
                              Passer à ce plan
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Historique des paiements</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <div className="font-medium">Plan Professional - Février 2024</div>
                          <div className="text-sm text-muted-foreground">01/02/2024</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">79€</div>
                          <Badge variant="secondary">Payé</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <div className="font-medium">Plan Professional - Janvier 2024</div>
                          <div className="text-sm text-muted-foreground">01/01/2024</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">79€</div>
                          <Badge variant="secondary">Payé</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Tab */}
            <TabsContent value="api" className="mt-0">
              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Gestion des API</CardTitle>
                      <CardDescription>Gérez vos clés API et accédez à la documentation</CardDescription>
                    </div>
                    <Button variant="outline" onClick={goToApiDocumentation}>
                      <FileText className="mr-2 h-4 w-4" />
                      Voir Documentation API
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Clés API</h4>
                    <Button variant="hero" onClick={handleApiKeyGenerate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Générer nouvelle clé
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{apiKey.name}</div>
                          <div className="font-mono text-sm text-muted-foreground">
                            {apiKey.visible ? apiKey.key : apiKey.key.replace(/./g, '•')}
                          </div>
                          <div className="text-xs text-muted-foreground">Créée le {apiKey.created}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {apiKey.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteApiKey(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h5 className="font-semibold mb-2">Informations importantes</h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Les clés API donnent accès à toutes vos données</li>
                      <li>• Ne partagez jamais vos clés API publiquement</li>
                      <li>• Utilisez des environnements séparés pour dev/prod</li>
                      <li>• Régénérez vos clés si elles sont compromises</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="mt-0">
              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <CardTitle>Apparence</CardTitle>
                  <CardDescription>Personnalisez l'interface utilisateur</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Thème</h4>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un thème" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center">
                            <Sun className="mr-2 h-4 w-4" />
                            Clair
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center">
                            <Moon className="mr-2 h-4 w-4" />
                            Sombre
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center">
                            <Monitor className="mr-2 h-4 w-4" />
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

                  <Button variant="hero">
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder l'Apparence
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default Settings;