import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
  AlertTriangle
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Helmet } from 'react-helmet-async';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { theme, setTheme } = useTheme();
  
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

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Paramètres - DropCraft</title>
        <meta name="description" content="Configurez vos préférences et paramètres de compte" />
      </Helmet>

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
            <p className="text-muted-foreground">
              Configurez vos préférences et paramètres de compte
            </p>
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
                <Select value={theme} onValueChange={setTheme}>
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
                  <Select defaultValue="fr">
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
                    setNotifications({ ...notifications, email: checked })
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
                    setNotifications({ ...notifications, push: checked })
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
                    setNotifications({ ...notifications, marketing: checked })
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
                    setNotifications({ ...notifications, security: checked })
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
                    setPrivacy({ ...privacy, profileVisible: checked })
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
                    setPrivacy({ ...privacy, activityVisible: checked })
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
                    setPrivacy({ ...privacy, analyticsEnabled: checked })
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
                <Button variant="outline" size="sm">
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
                <Button variant="outline" size="sm">
                  Configurer
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
                <Button variant="outline" size="sm">
                  Voir tout
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
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
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
                    <Button variant="destructive" size="sm">
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
    </>
  );
};

export default SettingsPage;