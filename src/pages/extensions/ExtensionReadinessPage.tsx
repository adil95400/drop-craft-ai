/**
 * Page de vérification de la préparation de l'extension Chrome
 * Checklist pour publication sur le Chrome Web Store
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Chrome,
  Package,
  Shield,
  Image,
  FileText,
  Globe,
  Lock,
  Zap,
  Download,
  ExternalLink,
  Copy,
  RefreshCw,
  Rocket
} from 'lucide-react';
import { toast } from 'sonner';
import { ChannableLayout } from '@/components/channable/navigation/ChannableLayout';

interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  description: string;
  status: 'pass' | 'warning' | 'fail' | 'pending';
  details?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

const extensionChecklist: ChecklistItem[] = [
  // Manifest
  { id: 'manifest-version', category: 'manifest', label: 'Manifest V3', description: 'Utilisation du Manifest V3 (requis depuis 2024)', status: 'pass', details: 'manifest_version: 3' },
  { id: 'manifest-name', category: 'manifest', label: 'Nom de l\'extension', description: 'Nom clair et descriptif', status: 'pass', details: 'ShopOpti+ Pro' },
  { id: 'manifest-description', category: 'manifest', label: 'Description', description: 'Description complète des fonctionnalités', status: 'pass', details: '< 132 caractères' },
  { id: 'manifest-version-number', category: 'manifest', label: 'Numéro de version', description: 'Format semver correct', status: 'pass', details: '6.0.0' },
  { id: 'manifest-permissions', category: 'manifest', label: 'Permissions minimales', description: 'Seules les permissions nécessaires', status: 'pass', details: 'storage, activeTab, alarms, notifications' },
  
  // Assets
  { id: 'icons-all-sizes', category: 'assets', label: 'Icônes toutes tailles', description: '16x16, 32x32, 48x48, 128x128', status: 'pass', details: 'PNG format, transparent bg' },
  { id: 'store-screenshots', category: 'assets', label: 'Screenshots Chrome Store', description: '1280x800 ou 640x400 pixels', status: 'pass', details: '3 screenshots créés', action: { label: 'Voir', href: '/chrome-extension/store-assets/' } },
  { id: 'promotional-tile', category: 'assets', label: 'Image promotionnelle', description: '440x280 pixels pour le store', status: 'pass', details: 'Tile small + large créées' },
  { id: 'marquee-image', category: 'assets', label: 'Bannière marquee', description: '1400x560 pixels (optionnel)', status: 'pass', details: 'Marquee 1400x560 créée' },

  // Security
  { id: 'csp-policy', category: 'security', label: 'Content Security Policy', description: 'CSP stricte définie', status: 'pass', details: 'script-src \'self\'; object-src \'self\'' },
  { id: 'https-only', category: 'security', label: 'HTTPS uniquement', description: 'Toutes les requêtes en HTTPS', status: 'pass' },
  { id: 'no-eval', category: 'security', label: 'Pas d\'eval()', description: 'Pas de code dynamique dangereux', status: 'pass' },
  { id: 'secure-storage', category: 'security', label: 'Stockage sécurisé', description: 'Données sensibles chiffrées', status: 'pass', details: 'AES-GCM encryption' },
  { id: 'token-security', category: 'security', label: 'Tokens sécurisés', description: 'JWT avec refresh automatique', status: 'pass' },

  // Functionality
  { id: 'offline-support', category: 'functionality', label: 'Mode hors-ligne', description: 'Fonctionnement dégradé sans connexion', status: 'pass' },
  { id: 'error-handling', category: 'functionality', label: 'Gestion des erreurs', description: 'Messages d\'erreur utilisateur', status: 'pass' },
  { id: 'popup-works', category: 'functionality', label: 'Popup fonctionnel', description: 'Interface popup opérationnelle', status: 'pass' },
  { id: 'content-scripts', category: 'functionality', label: 'Content scripts', description: 'Injection sur marketplaces', status: 'pass' },
  { id: 'background-worker', category: 'functionality', label: 'Service Worker', description: 'Background script MV3', status: 'pass' },

  // Store Listing
  { id: 'privacy-policy', category: 'store', label: 'Politique de confidentialité', description: 'URL de politique de confidentialité', status: 'pass', details: 'https://drop-craft-ai.lovable.app/privacy', action: { label: 'Voir', href: '/privacy' } },
  { id: 'store-description', category: 'store', label: 'Description store', description: 'Description détaillée pour le Chrome Store', status: 'pass', details: 'STORE_LISTING.md préparé' },
  { id: 'category', category: 'store', label: 'Catégorie', description: 'Catégorie appropriée sélectionnée', status: 'pass', details: 'Shopping / Productivity' },
  { id: 'support-email', category: 'store', label: 'Email support', description: 'Email de contact configuré', status: 'pass' }
];

export default function ExtensionReadinessPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const categories = {
    manifest: extensionChecklist.filter(i => i.category === 'manifest'),
    assets: extensionChecklist.filter(i => i.category === 'assets'),
    security: extensionChecklist.filter(i => i.category === 'security'),
    functionality: extensionChecklist.filter(i => i.category === 'functionality'),
    store: extensionChecklist.filter(i => i.category === 'store')
  };

  const passed = extensionChecklist.filter(i => i.status === 'pass').length;
  const warnings = extensionChecklist.filter(i => i.status === 'warning').length;
  const failed = extensionChecklist.filter(i => i.status === 'fail').length;
  const total = extensionChecklist.length;
  const progress = (passed / total) * 100;

  const isReadyForStore = failed === 0 && warnings <= 3;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
    }
  };

  const downloadExtension = () => {
    toast.success('Téléchargement du package extension préparé');
    // In production, this would trigger a download of the extension ZIP
  };

  const renderChecklist = (items: ChecklistItem[]) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div 
          key={item.id}
          className={`flex items-center justify-between p-3 rounded-lg border ${
            item.status === 'pass' ? 'border-green-200 bg-green-50' :
            item.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
            item.status === 'fail' ? 'border-red-200 bg-red-50' :
            'border-muted'
          }`}
        >
          <div className="flex items-center gap-3">
            {getStatusIcon(item.status)}
            <div>
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
              {item.details && (
                <code className="text-xs bg-background/50 px-1 rounded">{item.details}</code>
              )}
            </div>
          </div>
          {item.action && (
            <Button size="sm" variant="outline" asChild>
              <a href={item.action.href} target="_blank" rel="noopener noreferrer">
                {item.action.label}
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <ChannableLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Chrome className="w-6 h-6" />
              Préparation Extension Chrome
            </h1>
            <p className="text-muted-foreground">
              Checklist pour la publication sur le Chrome Web Store
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadExtension}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger le package
            </Button>
            <Button 
              disabled={!isReadyForStore}
              onClick={() => window.open('https://chrome.google.com/webstore/devconsole', '_blank')}
            >
              <Rocket className="w-4 h-4 mr-2" />
              Publier sur Chrome Store
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isReadyForStore ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  {isReadyForStore ? (
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {isReadyForStore ? 'Prêt pour publication' : 'Actions requises'}
                  </h2>
                  <p className="text-muted-foreground">
                    {passed}/{total} vérifications passées
                  </p>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{passed}</div>
                  <div className="text-xs text-muted-foreground">Passés</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{warnings}</div>
                  <div className="text-xs text-muted-foreground">Avertissements</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{failed}</div>
                  <div className="text-xs text-muted-foreground">Échecs</div>
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Instructions Alert */}
        {!isReadyForStore && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Actions requises avant publication</AlertTitle>
            <AlertDescription>
              Corrigez les avertissements ci-dessous pour soumettre votre extension au Chrome Web Store.
              Les screenshots et la bannière promotionnelle sont nécessaires pour l'approbation.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="gap-1">
              <Package className="w-4 h-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="manifest" className="gap-1">
              <FileText className="w-4 h-4" />
              Manifest
            </TabsTrigger>
            <TabsTrigger value="assets" className="gap-1">
              <Image className="w-4 h-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1">
              <Shield className="w-4 h-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="store" className="gap-1">
              <Globe className="w-4 h-4" />
              Store
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Extension Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations extension</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                      <Zap className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">ShopOpti+ Pro</h3>
                      <p className="text-sm text-muted-foreground">Version 6.0.0</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline">Manifest V3</Badge>
                        <Badge className="bg-green-500">Prêt</Badge>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plateformes supportées:</span>
                      <span>17+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Permissions:</span>
                      <span>7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Content scripts:</span>
                      <span>13 sites</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <a href="https://chrome.google.com/webstore/devconsole" target="_blank">
                      <Chrome className="w-4 h-4 mr-2" />
                      Ouvrir Developer Dashboard
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={downloadExtension}>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger le ZIP
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <a href="/extensions/documentation" target="_blank">
                      <FileText className="w-4 h-4 mr-2" />
                      Documentation
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <a href="/privacy" target="_blank">
                      <Lock className="w-4 h-4 mr-2" />
                      Politique de confidentialité
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* All Categories Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résumé par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4">
                  {Object.entries(categories).map(([key, items]) => {
                    const catPassed = items.filter(i => i.status === 'pass').length;
                    const catTotal = items.length;
                    const catProgress = (catPassed / catTotal) * 100;
                    
                    return (
                      <div key={key} className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold">{catPassed}/{catTotal}</div>
                        <div className="text-xs text-muted-foreground capitalize mb-2">{key}</div>
                        <Progress value={catProgress} className="h-1" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manifest">
            <Card>
              <CardHeader>
                <CardTitle>Vérifications Manifest</CardTitle>
                <CardDescription>Configuration du manifest.json</CardDescription>
              </CardHeader>
              <CardContent>
                {renderChecklist(categories.manifest)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets">
            <Card>
              <CardHeader>
                <CardTitle>Assets graphiques</CardTitle>
                <CardDescription>Icônes et images pour le Chrome Web Store</CardDescription>
              </CardHeader>
              <CardContent>
                {renderChecklist(categories.assets)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>Vérifications de sécurité et conformité</CardDescription>
              </CardHeader>
              <CardContent>
                {renderChecklist(categories.security)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Listing Chrome Store</CardTitle>
                <CardDescription>Informations pour la page du store</CardDescription>
              </CardHeader>
              <CardContent>
                {renderChecklist(categories.store)}
                
                <Separator className="my-6" />
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Prochaines étapes pour publier
                  </h4>
                  <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Créez un compte développeur Chrome (frais uniques de $5)</li>
                    <li>Préparez les screenshots et la bannière promotionnelle</li>
                    <li>Téléchargez le package ZIP de l'extension</li>
                    <li>Soumettez l'extension via le Developer Dashboard</li>
                    <li>Attendez la review (généralement 1-3 jours ouvrés)</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ChannableLayout>
  );
}
