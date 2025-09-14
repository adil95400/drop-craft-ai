import { useState, useEffect } from "react";
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
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { RealIntegrationsTab } from "@/components/integrations/RealIntegrationsTab";
import { useUserPreferences } from "@/stores/globalStore";
import { useTheme } from "next-themes";
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
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
import { RefreshProfileButton } from '@/components/auth/RefreshProfileButton';

const Settings = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { isAdmin, role } = useEnhancedAuth();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { t } = useTranslation(['settings', 'common', 'navigation']);
  
  // Use global store for preferences
  const {
    theme: storeTheme,
    language: storeLanguage,
    sidebarCollapsed,
    notifications: storeNotifications,
    updateTheme,
    updateLanguage,
    updateNotifications,
    toggleSidebar
  } = useUserPreferences();

  const [profileData, setProfileData] = useState({
    name: profile?.full_name || user?.email?.split('@')[0] || "Utilisateur",
    email: user?.email || "",
    phone: profile?.phone || "",
    company: profile?.company || "",
    website: profile?.website || "",
    bio: profile?.bio || ""
  });

  const [notifications, setNotifications] = useState({
    email: storeNotifications.email,
    push: storeNotifications.push,
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

  // Use store values and local state for appearance
  const [compactMode, setCompactMode] = useState(sidebarCollapsed);
  const [animations, setAnimations] = useState(true);
  const [sounds, setSounds] = useState(storeNotifications.desktop);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // File upload ref
  const fileInputRef = useState<HTMLInputElement | null>(null);

  // Sync local state with store on mount
  useEffect(() => {
    setCompactMode(sidebarCollapsed);
    setSounds(storeNotifications.desktop);
    
    // Sync i18n language with store
    if (storeLanguage && i18n.language !== storeLanguage) {
      i18n.changeLanguage(storeLanguage);
    }
  }, [sidebarCollapsed, storeNotifications.desktop, storeLanguage]);

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
    // Update global store
    updateNotifications({
      email: notifications.email,
      push: notifications.push,
      desktop: notifications.sms
    });
    
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

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (passwordData.new.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Modification du mot de passe...',
        success: () => {
          setPasswordData({ current: "", new: "", confirm: "" });
          return 'Mot de passe modifié avec succès';
        },
        error: 'Erreur lors de la modification'
      }
    );
  };

  const handleToggle2FA = () => {
    const action = twoFactorEnabled ? 'Désactivation' : 'Activation';
    toast.promise(
      new Promise(resolve => {
        setTimeout(() => {
          setTwoFactorEnabled(!twoFactorEnabled);
          resolve('success');
        }, 1200);
      }),
      {
        loading: `${action} du 2FA...`,
        success: `2FA ${twoFactorEnabled ? 'désactivé' : 'activé'} avec succès`,
        error: `Erreur lors de l'${action.toLowerCase()}`
      }
    );
  };

  const handleUpgradePlan = (planName: string, price: number) => {
    if (!isAdmin) {
      toast.info(`Simulation de mise à niveau vers ${planName} (${price}€/mois)`);
      return;
    }
    
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: `Mise à niveau vers ${planName}...`,
        success: `Plan ${planName} activé avec succès`,
        error: 'Erreur lors de la mise à niveau'
      }
    );
  };

  const handleSaveAppearance = () => {
    // Update global store
    updateNotifications({ desktop: sounds });
    if (compactMode !== sidebarCollapsed) {
      toggleSidebar();
    }
    
    toast.success(t('settings:messages.appearanceSaved'));
  };

  // Handle theme change immediately
  const handleThemeChange = (newTheme: string) => {
    updateTheme(newTheme as any);
    setTheme(newTheme);
  };

  // Handle language change immediately
  const handleLanguageChange = (newLanguage: string) => {
    updateLanguage(newLanguage as any);
    i18n.changeLanguage(newLanguage);
    
    const languageNames = {
      fr: 'Français',
      en: 'English',
      es: 'Español',
      de: 'Deutsch'
    };
    
    toast.success(t('settings:messages.languageChanged', { 
      language: languageNames[newLanguage as keyof typeof languageNames] || newLanguage 
    }));
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
    // Créer une page de documentation API dynamique
    const docContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Documentation API - DropCraft</title>
  <style>
    body { font-family: -apple-system, sans-serif; margin: 40px; line-height: 1.6; }
    .endpoint { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .method { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; margin-right: 10px; }
    .get { background: #2196F3; }
    .post { background: #4CAF50; }
    .put { background: #FF9800; }
    .delete { background: #f44336; }
    pre { background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>📚 Documentation API DropCraft</h1>
  <p>Cette API vous permet d'intégrer DropCraft avec vos applications tierces.</p>
  
  <h2>🔑 Authentication</h2>
  <p>Toutes les requêtes doivent inclure votre clé API dans l'en-tête:</p>
  <pre>Authorization: Bearer YOUR_API_KEY</pre>
  
  <h2>📦 Endpoints Produits</h2>
  <div class="endpoint">
    <span class="method get">GET</span><strong>/api/v1/products</strong>
    <p>Récupère la liste de tous vos produits</p>
    <pre>{
  "products": [
    {
      "id": "prod_123",
      "name": "iPhone 15 Pro",
      "price": 1199.00,
      "status": "active"
    }
  ]
}</pre>
  </div>
  
  <div class="endpoint">
    <span class="method post">POST</span><strong>/api/v1/products</strong>
    <p>Crée un nouveau produit</p>
    <pre>{
  "name": "Nouveau produit",
  "description": "Description du produit",
  "price": 99.99,
  "category": "electronics"
}</pre>
  </div>
  
  <h2>🛒 Endpoints Commandes</h2>
  <div class="endpoint">
    <span class="method get">GET</span><strong>/api/v1/orders</strong>
    <p>Récupère toutes vos commandes</p>
  </div>
  
  <h2>👥 Endpoints Clients</h2>
  <div class="endpoint">
    <span class="method get">GET</span><strong>/api/v1/customers</strong>
    <p>Liste tous vos clients</p>
  </div>
  
  <h2>📊 Endpoints Analytics</h2>
  <div class="endpoint">
    <span class="method get">GET</span><strong>/api/v1/analytics/dashboard</strong>
    <p>Données du tableau de bord</p>
  </div>
  
  <h2>🔄 Webhooks</h2>
  <p>Configurez des webhooks pour recevoir des notifications en temps réel:</p>
  <ul>
    <li><strong>order.created</strong> - Nouvelle commande</li>
    <li><strong>product.updated</strong> - Produit modifié</li>
    <li><strong>payment.completed</strong> - Paiement terminé</li>
  </ul>
  
  <h2>⚡ Limites</h2>
  <ul>
    <li>1000 requêtes/heure (plan standard)</li>
    <li>5000 requêtes/heure (plan pro)</li>
    <li>Illimité (plan enterprise)</li>
  </ul>
  
  <hr>
  <p><em>Besoin d'aide ? Contactez notre support à api-support@dropcraft.com</em></p>
</body>
</html>`;
    
    const blob = new Blob([docContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    toast.success('Documentation API ouverte dans un nouvel onglet');
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
            {t('settings:title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('settings:description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLogout} className="border-destructive/20 text-destructive hover:bg-destructive/10">
            <LogOut className="mr-2 h-4 w-4" />
            {t('navigation:logout')}
          </Button>
          <Button variant="default" onClick={handleSaveProfile} className="bg-primary hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* DEBUG: Admin Status - Add this temporarily */}
      {profile && (
        <div className="mb-6">
          <RefreshProfileButton />
        </div>
      )}

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
                  {t('settings:general.profile')}
                </TabsTrigger>
                <TabsTrigger value="notifications" className="justify-start w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Bell className="mr-2 h-4 w-4" />
                  {t('settings:tabs.notifications')}
                </TabsTrigger>
                <TabsTrigger value="security" className="justify-start w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Shield className="mr-2 h-4 w-4" />
                  {t('settings:tabs.security')}
                </TabsTrigger>
                <TabsTrigger value="integrations" className="justify-start w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Database className="mr-2 h-4 w-4" />
                  {t('settings:tabs.integrations')}
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
                  {t('settings:tabs.appearance')}
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
                        <Input 
                          type="password" 
                          placeholder="••••••••"
                          value={passwordData.current}
                          onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nouveau mot de passe</Label>
                        <Input 
                          type="password" 
                          placeholder="••••••••"
                          value={passwordData.new}
                          onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirmer nouveau mot de passe</Label>
                        <Input 
                          type="password" 
                          placeholder="••••••••"
                          value={passwordData.confirm}
                          onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleChangePassword}>
                      <Shield className="mr-2 h-4 w-4" />
                      Changer le Mot de Passe
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Authentification à deux facteurs</h4>
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <div className="font-medium">2FA {twoFactorEnabled && <Badge variant="secondary" className="ml-2">Activé</Badge>}</div>
                        <div className="text-sm text-muted-foreground">Sécurité supplémentaire pour votre compte</div>
                      </div>
                      <Button 
                        variant={twoFactorEnabled ? "destructive" : "outline"}
                        onClick={handleToggle2FA}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        {twoFactorEnabled ? 'Désactiver 2FA' : 'Activer 2FA'}
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
                            <Button 
                              variant="outline" 
                              className="w-full mt-3"
                              onClick={() => handleUpgradePlan(plan.name, plan.price)}
                            >
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
                    <h4 className="font-semibold">{t('settings:appearance.theme')}</h4>
                    <Select value={storeTheme} onValueChange={handleThemeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un thème" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center">
                            <Sun className="mr-2 h-4 w-4" />
                            {t('settings:appearance.themes.light')}
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center">
                            <Moon className="mr-2 h-4 w-4" />
                            {t('settings:appearance.themes.dark')}
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center">
                            <Monitor className="mr-2 h-4 w-4" />
                            {t('settings:appearance.themes.system')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>{t('settings:general.language')}</Label>
                    <Select value={storeLanguage} onValueChange={handleLanguageChange}>
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
                        <Switch 
                          checked={compactMode}
                          onCheckedChange={setCompactMode}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Animations</div>
                          <div className="text-sm text-muted-foreground">Activer les transitions animées</div>
                        </div>
                        <Switch 
                          checked={animations}
                          onCheckedChange={setAnimations}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Sons système</div>
                          <div className="text-sm text-muted-foreground">Sons pour les notifications</div>
                        </div>
                        <Switch 
                          checked={sounds}
                          onCheckedChange={setSounds}
                        />
                      </div>
                    </div>
                  </div>

                  <Button variant="default" onClick={handleSaveAppearance} className="bg-primary hover:bg-primary/90">
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