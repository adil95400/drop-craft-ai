import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Download, Bell, Wifi, Zap, Shield } from 'lucide-react';
import { pwaService } from '@/services/pwa/PWAService';

const PWAInstallPage: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Initialiser le PWA service
    pwaService.initialize();
    
    // Vérifier l'état d'installation
    setCanInstall(pwaService.canInstall());
    setIsInstalled(pwaService.isInstalled());
    
    // Vérifier les permissions de notification
    setNotificationsEnabled(Notification.permission === 'granted');
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await pwaService.promptInstall();
      if (success) {
        setIsInstalled(true);
        setCanInstall(false);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const success = await pwaService.setupPushNotifications();
      setNotificationsEnabled(success);
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
  };

  const features = [
    {
      icon: Smartphone,
      title: 'Installation Native',
      description: 'Installez Drop Craft AI comme une app native sur votre téléphone'
    },
    {
      icon: Wifi,
      title: 'Mode Hors-ligne',
      description: 'Continuez à travailler même sans connexion internet'
    },
    {
      icon: Bell,
      title: 'Notifications Push',
      description: 'Recevez des alertes pour les commandes et les stocks'
    },
    {
      icon: Zap,
      title: 'Performance Optimisée',
      description: 'Chargement ultra-rapide et expérience fluide'
    },
    {
      icon: Shield,
      title: 'Sécurisé',
      description: 'Données chiffrées et synchronisation sécurisée'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Drop Craft AI Mobile
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transformez votre expérience e-commerce avec notre application mobile progressive
            </p>
          </div>

          {/* Installation Status */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                État de l'Installation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Application PWA</span>
                <Badge variant={isInstalled ? "default" : "secondary"}>
                  {isInstalled ? "Installée" : "Non installée"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Notifications Push</span>
                <Badge variant={notificationsEnabled ? "default" : "secondary"}>
                  {notificationsEnabled ? "Activées" : "Désactivées"}
                </Badge>
              </div>

              {!isInstalled && canInstall && (
                <Button 
                  onClick={handleInstall}
                  disabled={installing}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {installing ? "Installation..." : "Installer l'Application"}
                </Button>
              )}

              {!notificationsEnabled && (
                <Button 
                  onClick={handleEnableNotifications}
                  variant="outline"
                  className="w-full"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Activer les Notifications
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <feature.icon className="w-5 h-5 text-primary" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions d'Installation</CardTitle>
              <CardDescription>
                Suivez ces étapes pour installer Drop Craft AI sur votre appareil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Sur Android (Chrome)
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Cliquez sur "Installer l'Application" ci-dessus</li>
                  <li>Ou utilisez le menu Chrome → "Installer l'application"</li>
                  <li>L'icône apparaîtra sur votre écran d'accueil</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Sur iOS (Safari)
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Tapez l'icône de partage en bas de l'écran</li>
                  <li>Sélectionnez "Sur l'écran d'accueil"</li>
                  <li>Confirmez l'ajout</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Sur Desktop
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Recherchez l'icône d'installation dans la barre d'adresse</li>
                  <li>Ou utilisez le menu du navigateur</li>
                  <li>L'application s'ouvrira dans sa propre fenêtre</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle>Pourquoi Installer l'App Mobile ?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h5 className="font-semibold">🚀 Performance</h5>
                  <p className="text-muted-foreground">
                    Chargement instantané et navigation fluide
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-semibold">📱 Expérience Native</h5>
                  <p className="text-muted-foreground">
                    Interface optimisée pour mobile et tablet
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-semibold">🔔 Notifications</h5>
                  <p className="text-muted-foreground">
                    Alertes en temps réel pour vos commandes
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-semibold">💾 Hors-ligne</h5>
                  <p className="text-muted-foreground">
                    Continuez à travailler sans connexion
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPage;