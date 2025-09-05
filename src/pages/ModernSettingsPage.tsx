import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Database, 
  Key, 
  Globe,
  Save,
  RefreshCw,
  AlertTriangle,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function ModernSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // États pour les différentes sections
  const [profile, setProfile] = useState({
    fullName: 'Jean Dupont',
    email: 'jean.dupont@email.com',
    company: 'Mon E-commerce',
    phone: '+33 1 23 45 67 89',
    timezone: 'Europe/Paris',
    language: 'fr'
  });

  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailMarketing: false,
    smsOrders: true,
    pushNotifications: true,
    weeklyReports: true,
    monthlyReports: true
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: '24',
    ipWhitelist: '',
    apiKey: 'sk_test_******************'
  });

  const [integrations, setIntegrations] = useState({
    autoSync: true,
    syncFrequency: '1hour',
    backupEnabled: true,
    backupFrequency: 'daily'
  });

  const handleSave = async (section: string) => {
    setLoading(true);
    try {
      // Simulation d'une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Paramètres ${section} sauvegardés avec succès`);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const generateNewApiKey = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSecurity(prev => ({ 
        ...prev, 
        apiKey: 'sk_test_' + Math.random().toString(36).substring(2, 18) + '******************'
      }));
      toast.success('Nouvelle clé API générée');
    } catch (error) {
      toast.error('Erreur lors de la génération de la clé');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">Gérez vos préférences et configurations</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Dernière sauvegarde: il y a 5 min
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Intégrations
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Apparence
          </TabsTrigger>
        </TabsList>

        {/* Profil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations Personnelles
              </CardTitle>
              <CardDescription>
                Gérez vos informations de profil et préférences de compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Entreprise</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select value={profile.timezone} onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select value={profile.language} onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave('profil')} disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Sauvegarder le Profil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Préférences de Notifications
              </CardTitle>
              <CardDescription>
                Configurez comment et quand vous souhaitez être notifié
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications Email - Commandes</Label>
                    <p className="text-sm text-muted-foreground">Recevoir un email pour chaque nouvelle commande</p>
                  </div>
                  <Switch
                    checked={notifications.emailOrders}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailOrders: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications Email - Marketing</Label>
                    <p className="text-sm text-muted-foreground">Recevoir nos newsletters et offres spéciales</p>
                  </div>
                  <Switch
                    checked={notifications.emailMarketing}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailMarketing: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications SMS</Label>
                    <p className="text-sm text-muted-foreground">Recevoir des SMS pour les commandes importantes</p>
                  </div>
                  <Switch
                    checked={notifications.smsOrders}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, smsOrders: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Notifications push dans le navigateur</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rapports Hebdomadaires</Label>
                    <p className="text-sm text-muted-foreground">Résumé des performances chaque semaine</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rapports Mensuels</Label>
                    <p className="text-sm text-muted-foreground">Analyse complète chaque mois</p>
                  </div>
                  <Switch
                    checked={notifications.monthlyReports}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, monthlyReports: checked }))}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave('notifications')} disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Sauvegarder les Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Paramètres de Sécurité
                </CardTitle>
                <CardDescription>
                  Renforcez la sécurité de votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Authentification à deux facteurs</Label>
                    <p className="text-sm text-muted-foreground">Ajoutez une couche de sécurité supplémentaire</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {security.twoFactorEnabled && <Badge variant="default">Activé</Badge>}
                    <Switch
                      checked={security.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, twoFactorEnabled: checked }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertes de connexion</Label>
                    <p className="text-sm text-muted-foreground">Recevoir un email pour chaque nouvelle connexion</p>
                  </div>
                  <Switch
                    checked={security.loginAlerts}
                    onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, loginAlerts: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Délai d'expiration de session (heures)</Label>
                  <Select value={security.sessionTimeout} onValueChange={(value) => setSecurity(prev => ({ ...prev, sessionTimeout: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 heure</SelectItem>
                      <SelectItem value="6">6 heures</SelectItem>
                      <SelectItem value="24">24 heures</SelectItem>
                      <SelectItem value="168">1 semaine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ipWhitelist">Liste blanche d'adresses IP</Label>
                  <Textarea
                    id="ipWhitelist"
                    placeholder="192.168.1.1, 10.0.0.1"
                    value={security.ipWhitelist}
                    onChange={(e) => setSecurity(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">Séparez les adresses IP par des virgules</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Clé API
                </CardTitle>
                <CardDescription>
                  Gérez votre clé d'accès API pour les intégrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={security.apiKey}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button onClick={generateNewApiKey} disabled={loading}>
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-start gap-2 p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-700 dark:text-orange-400">Attention</p>
                    <p className="text-orange-600 dark:text-orange-300">
                      La génération d'une nouvelle clé invalidera l'ancienne. Assurez-vous de mettre à jour vos intégrations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => handleSave('sécurité')} disabled={loading}>
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Sauvegarder la Sécurité
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Intégrations */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Paramètres d'Intégration
              </CardTitle>
              <CardDescription>
                Configurez la synchronisation et les sauvegardes automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Synchronisation automatique</Label>
                  <p className="text-sm text-muted-foreground">Synchroniser automatiquement avec les fournisseurs</p>
                </div>
                <Switch
                  checked={integrations.autoSync}
                  onCheckedChange={(checked) => setIntegrations(prev => ({ ...prev, autoSync: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="syncFrequency">Fréquence de synchronisation</Label>
                <Select 
                  value={integrations.syncFrequency} 
                  onValueChange={(value) => setIntegrations(prev => ({ ...prev, syncFrequency: value }))}
                  disabled={!integrations.autoSync}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15min">Toutes les 15 minutes</SelectItem>
                    <SelectItem value="1hour">Toutes les heures</SelectItem>
                    <SelectItem value="6hours">Toutes les 6 heures</SelectItem>
                    <SelectItem value="daily">Quotidiennement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sauvegardes automatiques</Label>
                  <p className="text-sm text-muted-foreground">Créer des sauvegardes automatiques de vos données</p>
                </div>
                <Switch
                  checked={integrations.backupEnabled}
                  onCheckedChange={(checked) => setIntegrations(prev => ({ ...prev, backupEnabled: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Fréquence de sauvegarde</Label>
                <Select 
                  value={integrations.backupFrequency} 
                  onValueChange={(value) => setIntegrations(prev => ({ ...prev, backupFrequency: value }))}
                  disabled={!integrations.backupEnabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidiennement</SelectItem>
                    <SelectItem value="weekly">Hebdomadairement</SelectItem>
                    <SelectItem value="monthly">Mensuellement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave('intégrations')} disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Sauvegarder les Intégrations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apparence */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Apparence et Thème
              </CardTitle>
              <CardDescription>
                Personnalisez l'apparence de votre interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Thème</Label>
                  <p className="text-sm text-muted-foreground mb-3">Choisissez votre thème préféré</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                      <div className="w-full h-20 bg-white border rounded mb-2"></div>
                      <p className="text-sm font-medium text-center">Clair</p>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer hover:border-primary border-primary">
                      <div className="w-full h-20 bg-gray-900 border rounded mb-2"></div>
                      <p className="text-sm font-medium text-center">Sombre</p>
                    </div>
                    <div className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                      <div className="w-full h-20 bg-gradient-to-br from-white to-gray-900 border rounded mb-2"></div>
                      <p className="text-sm font-medium text-center">Auto</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-base font-medium">Densité d'affichage</Label>
                  <p className="text-sm text-muted-foreground mb-3">Ajustez l'espacement des éléments</p>
                  <Select defaultValue="normal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="comfortable">Confortable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave('apparence')}>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder l'Apparence
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}