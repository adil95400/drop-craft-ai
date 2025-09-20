import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Download, 
  Code, 
  RefreshCw, 
  Shield, 
  Bell,
  Camera,
  Fingerprint,
  Wifi,
  Database,
  QrCode,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings
} from 'lucide-react';

const FlutterMobilePage: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<'ios' | 'android'>('android');

  const coreFeatures = [
    {
      icon: ShoppingCart,
      title: 'Catalogue Produits',
      description: 'Navigation fluide dans le catalogue avec recherche et filtres avancés',
      status: 'ready'
    },
    {
      icon: Package,
      title: 'Gestion Commandes',
      description: 'Suivi complet des commandes avec statuts temps réel',
      status: 'ready'
    },
    {
      icon: RefreshCw,
      title: 'Synchronisation',
      description: 'Sync bidirectionnelle avec le cloud et mode hors-ligne',
      status: 'ready'
    },
    {
      icon: Shield,
      title: 'Authentification',
      description: 'Login sécurisé avec biométrie et 2FA',
      status: 'ready'
    },
    {
      icon: Bell,
      title: 'Notifications Push',
      description: 'Alertes personnalisées pour commandes et stock',
      status: 'ready'
    },
    {
      icon: Camera,
      title: 'Scanner Produits',
      description: 'Scan de codes-barres et reconnaissance d\'images',
      status: 'beta'
    }
  ];

  const nativeFeatures = [
    {
      icon: Fingerprint,
      title: 'Authentification Biométrique',
      description: 'Touch ID, Face ID, empreintes digitales'
    },
    {
      icon: Camera,
      title: 'Appareil Photo',
      description: 'Capture de photos produits haute qualité'
    },
    {
      icon: QrCode,
      title: 'Scanner QR/Codes-barres',
      description: 'Scan rapide pour import produits'
    },
    {
      icon: Wifi,
      title: 'Mode Hors-ligne',
      description: 'Fonctionnalités disponibles sans internet'
    },
    {
      icon: Database,
      title: 'Stockage Local',
      description: 'Cache intelligent des données'
    },
    {
      icon: Bell,
      title: 'Notifications Natives',
      description: 'Intégration système complet'
    }
  ];

  const architectureModules = [
    {
      name: 'Auth Module',
      description: 'Gestion authentification et sécurité',
      files: ['auth_service.dart', 'biometric_auth.dart', 'token_manager.dart']
    },
    {
      name: 'Catalog Module',
      description: 'Navigation et recherche produits',
      files: ['product_repository.dart', 'catalog_controller.dart', 'search_service.dart']
    },
    {
      name: 'Orders Module',
      description: 'Gestion commandes et paiements',
      files: ['order_service.dart', 'payment_controller.dart', 'shipping_tracker.dart']
    },
    {
      name: 'Sync Module',
      description: 'Synchronisation et cache',
      files: ['sync_manager.dart', 'offline_storage.dart', 'conflict_resolver.dart']
    },
    {
      name: 'Notifications Module',
      description: 'Push notifications et alertes',
      files: ['notification_service.dart', 'push_handler.dart', 'alert_manager.dart']
    }
  ];

  const downloadLinks = {
    android: {
      store: 'https://play.google.com/store/apps/details?id=app.lovable.dropcraft',
      apk: 'https://releases.dropcraft.ai/android/latest.apk',
      beta: 'https://play.google.com/apps/testing/app.lovable.dropcraft'
    },
    ios: {
      store: 'https://apps.apple.com/app/drop-craft-ai/id123456789',
      testflight: 'https://testflight.apple.com/join/dropcraft-ai'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      <div className="container mx-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Drop Craft AI Flutter
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Application mobile native haute performance avec Flutter pour une expérience utilisateur optimale
            </p>
          </div>

          {/* Platform Selection & Download */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Télécharger l'Application
              </CardTitle>
              <CardDescription>
                Choisissez votre plateforme et téléchargez Drop Craft AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as 'ios' | 'android')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="android">Android</TabsTrigger>
                  <TabsTrigger value="ios">iOS</TabsTrigger>
                </TabsList>
                
                <TabsContent value="android" className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Button asChild className="h-auto p-4 flex-col gap-2">
                      <a href={downloadLinks.android.store} target="_blank" rel="noopener noreferrer">
                        <Download className="w-6 h-6" />
                        <div className="text-center">
                          <div className="font-semibold">Google Play Store</div>
                          <div className="text-xs opacity-80">Version Stable</div>
                        </div>
                      </a>
                    </Button>
                    
                    <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
                      <a href={downloadLinks.android.apk} target="_blank" rel="noopener noreferrer">
                        <Package className="w-6 h-6" />
                        <div className="text-center">
                          <div className="font-semibold">APK Direct</div>
                          <div className="text-xs opacity-80">Installation manuelle</div>
                        </div>
                      </a>
                    </Button>
                    
                    <Button variant="secondary" asChild className="h-auto p-4 flex-col gap-2">
                      <a href={downloadLinks.android.beta} target="_blank" rel="noopener noreferrer">
                        <Code className="w-6 h-6" />
                        <div className="text-center">
                          <div className="font-semibold">Version Beta</div>
                          <div className="text-xs opacity-80">Fonctionnalités avancées</div>
                        </div>
                      </a>
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="ios" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button asChild className="h-auto p-4 flex-col gap-2">
                      <a href={downloadLinks.ios.store} target="_blank" rel="noopener noreferrer">
                        <Download className="w-6 h-6" />
                        <div className="text-center">
                          <div className="font-semibold">App Store</div>
                          <div className="text-xs opacity-80">Version Stable</div>
                        </div>
                      </a>
                    </Button>
                    
                    <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
                      <a href={downloadLinks.ios.testflight} target="_blank" rel="noopener noreferrer">
                        <Code className="w-6 h-6" />
                        <div className="text-center">
                          <div className="font-semibold">TestFlight Beta</div>
                          <div className="text-xs opacity-80">Accès anticipé</div>
                        </div>
                      </a>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Core Features */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Fonctionnalités Principales</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreFeatures.map((feature, index) => (
                <Card key={index} className="border-border/50 hover:border-primary/20 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-2">
                        <feature.icon className="w-5 h-5 text-primary" />
                        {feature.title}
                      </div>
                      <Badge variant={feature.status === 'ready' ? 'default' : 'secondary'}>
                        {feature.status === 'ready' ? 'Prêt' : 'Beta'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Native Features */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Fonctionnalités Natives</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nativeFeatures.map((feature, index) => (
                <Card key={index} className="border-border/50">
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
          </div>

          {/* Architecture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Architecture Flutter
              </CardTitle>
              <CardDescription>
                Architecture modulaire pour une maintenabilité optimale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {architectureModules.map((module, index) => (
                  <div key={index} className="space-y-3">
                    <h4 className="font-semibold text-primary">{module.name}</h4>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                    <div className="space-y-1">
                      {module.files.map((file, fileIndex) => (
                        <div key={fileIndex} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Specs */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spécifications Techniques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Framework</span>
                    <span className="text-sm font-semibold">Flutter 3.19+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Dart Version</span>
                    <span className="text-sm font-semibold">3.3+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Android Min SDK</span>
                    <span className="text-sm font-semibold">API 23 (Android 6.0)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">iOS Min Version</span>
                    <span className="text-sm font-semibold">iOS 12.0+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Taille App</span>
                    <span className="text-sm font-semibold">~25 MB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prérequis Système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Android</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Android 6.0+ (API 23)</li>
                    <li>• 2 GB RAM minimum</li>
                    <li>• 100 MB espace libre</li>
                    <li>• Connexion internet</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">iOS</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• iOS 12.0+</li>
                    <li>• iPhone 6s / iPad Air 2+</li>
                    <li>• 100 MB espace libre</li>
                    <li>• Connexion internet</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Development Info */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle>Développement & Open Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                L'application Flutter Drop Craft AI est développée avec les meilleures pratiques de l'industrie. 
                Le code source est disponible pour les développeurs souhaitant contribuer ou personnaliser l'application.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" asChild>
                  <a href="https://github.com/dropcraft-ai/flutter-app" target="_blank" rel="noopener noreferrer">
                    <Code className="w-4 h-4 mr-2" />
                    Code Source
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://docs.dropcraft.ai/flutter" target="_blank" rel="noopener noreferrer">
                    Documentation API
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FlutterMobilePage;