import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useSettingsActions } from '@/hooks/useSettingsActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { 
  Settings, 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  Mail,
  Smartphone,
  Lock,
  Eye,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Helmet } from 'react-helmet-async';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const { theme, setTheme } = useTheme();
  const { saveSettings, changePassword, exportData, deleteAccount, loading } = useSettingsActions();
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
    security: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    activityVisible: false,
    analyticsEnabled: true
  });

  const [language, setLanguage] = useState('fr');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.loading('Actualisation des paramètres...', { id: 'refresh' });
    await new Promise(r => setTimeout(r, 800));
    toast.success('Paramètres actualisés', { id: 'refresh' });
    setIsRefreshing(false);
  };

  // Auto-save settings when they change
  useEffect(() => {
    if (hasChanges) {
      const timeoutId = setTimeout(() => {
        saveSettings({
          notifications,
          privacy,
          language
        });
        setHasChanges(false);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [notifications, privacy, language, hasChanges, saveSettings]);

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    toast.success(`Notification ${key} ${value ? 'activée' : 'désactivée'}`);
  };

  const handlePrivacyChange = (key: keyof typeof privacy, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    toast.success(`Confidentialité ${key} ${value ? 'activée' : 'désactivée'}`);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    toast.success(`Langue changée: ${value === 'fr' ? 'Français' : 'English'}`);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(`Thème changé: ${newTheme === 'light' ? 'Clair' : newTheme === 'dark' ? 'Sombre' : 'Système'}`);
  };

  const handleExportData = async () => {
    toast.loading('Export en cours...', { id: 'export' });
    await exportData();
    toast.success('Données exportées avec succès', { id: 'export' });
  };

  const handleChangePassword = async () => {
    toast.loading('Modification du mot de passe...', { id: 'password' });
    await changePassword();
    toast.success('Instructions envoyées par email', { id: 'password' });
    setHasChanges(true);
  };

  const handleDeleteAccount = async () => {
    const success = await deleteAccount();
    if (success) {
      signOut();
    }
  };

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Paramètres - ShopOpti</title>
        <meta name="description" content="Configurez vos préférences et paramètres de compte" />
      </Helmet>

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-center sm:text-left space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Paramètres</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Configurez vos préférences et paramètres de compte
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
          </div>

          {/* Apparence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Apparence
              </CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="theme">Thème</Label>
                  <p className="text-sm text-muted-foreground">
                    Choisissez votre thème préféré
                  </p>
                </div>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Langue</Label>
                  <p className="text-sm text-muted-foreground">
                    Langue d'affichage de l'interface
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Gérez vos préférences de notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Notifications par e-mail
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recevez les notifications importantes par e-mail
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => 
                    handleNotificationChange('email', checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Notifications push
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications instantanées dans le navigateur
                  </p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => 
                    handleNotificationChange('push', checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Nouvelles fonctionnalités et mises à jour produit
                  </p>
                </div>
                <Switch
                  checked={notifications.marketing}
                  onCheckedChange={(checked) => 
                    handleNotificationChange('marketing', checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Sécurité
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Alertes de sécurité et connexions suspectes
                  </p>
                </div>
                <Switch
                  checked={notifications.security}
                  onCheckedChange={(checked) => 
                    handleNotificationChange('security', checked)
                  }
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          {/* Confidentialité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Confidentialité et données
              </CardTitle>
              <CardDescription>
                Contrôlez la visibilité de vos données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Profil public</Label>
                  <p className="text-sm text-muted-foreground">
                    Rendre votre profil visible aux autres utilisateurs
                  </p>
                </div>
                <Switch
                  checked={privacy.profileVisible}
                  onCheckedChange={(checked) => 
                    handlePrivacyChange('profileVisible', checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Activité visible</Label>
                  <p className="text-sm text-muted-foreground">
                    Partager votre activité avec l'équipe
                  </p>
                </div>
                <Switch
                  checked={privacy.activityVisible}
                  onCheckedChange={(checked) => 
                    handlePrivacyChange('activityVisible', checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Aider à améliorer le produit avec des données anonymisées
                  </p>
                </div>
                <Switch
                  checked={privacy.analyticsEnabled}
                  onCheckedChange={(checked) => 
                    handlePrivacyChange('analyticsEnabled', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Sécurité
              </CardTitle>
              <CardDescription>
                Gérez la sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Mot de passe</Label>
                  <p className="text-sm text-muted-foreground">
                    Dernière modification : Il y a 30 jours
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleChangePassword} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Modifier
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Authentification à deux facteurs</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Non configurée</p>
                    <Badge variant="outline" className="text-xs">
                      Recommandé
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled
                >
                  Bientôt disponible
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Sessions actives</Label>
                  <p className="text-sm text-muted-foreground">
                    Gérer les appareils connectés
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled
                >
                  Bientôt disponible
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions de compte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Actions de compte
              </CardTitle>
              <CardDescription>
                Exporter ou supprimer vos données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Exporter mes données</Label>
                  <p className="text-sm text-muted-foreground">
                    Téléchargez une archive de toutes vos données
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportData} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Exporter
                </Button>
              </div>

              <Separator />

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium">Zone dangereuse</p>
                    <p className="text-sm">
                      Ces actions sont irréversibles. Procédez avec prudence.
                    </p>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer mon compte
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer le compte"
        description="Cette action est irréversible. Toutes vos données seront définitivement supprimées."
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        onConfirm={handleDeleteAccount}
        variant="destructive"
        icon={<AlertTriangle className="h-5 w-5" />}
      />
    </>
  );
};

export default SettingsPage;