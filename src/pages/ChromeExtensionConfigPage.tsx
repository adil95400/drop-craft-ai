import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Chrome, 
  Download, 
  Key, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Code,
  FileCode,
  Settings,
  Zap
} from 'lucide-react';

export default function ChromeExtensionConfigPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate API key (simulation)
  const generateApiKey = () => {
    const newKey = `dk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newKey);
    toast({
      title: "Clé API générée",
      description: "Copiez et conservez cette clé en lieu sûr.",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copié!",
      description: "Le texte a été copié dans le presse-papier.",
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Chrome className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Extension Chrome - Import en 1 Clic</h1>
            <p className="text-muted-foreground">
              Des boutons d'importation automatiques sur chaque page produit
            </p>
          </div>
        </div>
        
        {/* Highlight Box */}
        <Alert className="border-primary/50 bg-primary/5">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <AlertDescription className="text-base">
            <strong className="text-primary">Nouvelle fonctionnalité :</strong> L'extension injecte automatiquement des boutons <strong>"🚀 Importer"</strong> sur les pages produits de Temu, AliExpress, Amazon et plus. Plus besoin d'ouvrir le popup !
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="install" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="install">
            <Download className="h-4 w-4 mr-2" />
            Installation
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="usage">
            <FileCode className="h-4 w-4 mr-2" />
            Utilisation
          </TabsTrigger>
        </TabsList>

        {/* Installation Tab */}
        <TabsContent value="install" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Télécharger l'extension
              </CardTitle>
              <CardDescription>
                Suivez ces étapes pour installer l'extension Chrome
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold">Télécharger l'extension</h3>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur le bouton ci-dessous pour télécharger le fichier .zip de l'extension
                  </p>
                  <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    Télécharger l'extension
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold">Extraire le fichier ZIP</h3>
                  <p className="text-sm text-muted-foreground">
                    Décompressez le fichier téléchargé dans un dossier de votre choix
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold">Ouvrir Chrome Extensions</h3>
                  <p className="text-sm text-muted-foreground">
                    Dans Chrome, allez à <code className="px-2 py-1 bg-muted rounded">chrome://extensions/</code>
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => window.open('chrome://extensions/', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir chrome://extensions/
                  </Button>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold">Activer le mode développeur</h3>
                  <p className="text-sm text-muted-foreground">
                    Activez le toggle "Mode développeur" en haut à droite de la page
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  5
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold">Charger l'extension</h3>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur "Charger l'extension non empaquetée" et sélectionnez le dossier extrait
                  </p>
                </div>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  L'extension est maintenant installée! Vous devriez voir l'icône dans votre barre d'outils Chrome.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Configuration API
              </CardTitle>
              <CardDescription>
                Générez et configurez votre clé API pour l'extension
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  La clé API permet à l'extension de communiquer en toute sécurité avec votre compte
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Identifiant utilisateur</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={user?.id || 'Non connecté'} 
                      readOnly 
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(user?.id || '')}
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Clé API</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={apiKey || 'Aucune clé générée'} 
                      readOnly 
                      type="password"
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(apiKey)}
                      disabled={!apiKey}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {!apiKey && (
                    <Button onClick={generateApiKey} className="gap-2">
                      <Key className="h-4 w-4" />
                      Générer une clé API
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>URL de l'API</Label>
                  <div className="flex gap-2">
                    <Input 
                      value="https://dtozyrmmekdnvekissuh.supabase.co" 
                      readOnly 
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard('https://dtozyrmmekdnvekissuh.supabase.co')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Code className="h-4 w-4" />
                  Configuration de l'extension
                </div>
                <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                  <li>Cliquez sur l'icône de l'extension dans Chrome</li>
                  <li>Cliquez sur "Paramètres" ou l'icône d'engrenage</li>
                  <li>Collez votre ID utilisateur et votre clé API</li>
                  <li>Collez l'URL de l'API</li>
                  <li>Cliquez sur "Sauvegarder" pour valider</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions requises</CardTitle>
              <CardDescription>
                L'extension nécessite ces permissions pour fonctionner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">activeTab</Badge>
                  <p className="text-sm text-muted-foreground">
                    Permet de lire les informations de la page active
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">storage</Badge>
                  <p className="text-sm text-muted-foreground">
                    Stocke votre configuration localement
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">scripting</Badge>
                  <p className="text-sm text-muted-foreground">
                    Permet d'extraire les données produit des pages
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          {/* New Feature Highlight */}
          <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Zap className="h-5 w-5" />
                🚀 Import en 1 Clic - Nouveau !
              </CardTitle>
              <CardDescription className="text-base">
                Les boutons d'import apparaissent automatiquement sur les pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Allez sur une page produit</h4>
                    <p className="text-sm text-muted-foreground">
                      Temu, AliExpress, Amazon ou tout autre site e-commerce supporté
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Le bouton apparaît automatiquement ✨</h4>
                    <p className="text-sm text-muted-foreground">
                      Un bouton <Badge className="mx-1">🚀 Importer dans Drop Craft AI</Badge> s'affiche en haut de la page
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Cliquez et c'est importé !</h4>
                    <p className="text-sm text-muted-foreground">
                      Le produit est extrait et importé automatiquement avec toutes ses infos (titre, prix, images, description)
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Super rapide :</strong> Sur les pages de listing, des mini-boutons "Importer" apparaissent sur chaque produit pour un import instantané !
                </AlertDescription>
              </Alert>

              <div className="pt-2">
                <Badge variant="outline" className="mb-2">Plateformes avec Import en 1 Clic</Badge>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-gradient-to-r from-pink-500 to-rose-500">Temu</Badge>
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500">AliExpress</Badge>
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">Amazon</Badge>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">Shopify</Badge>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">WooCommerce</Badge>
                  <Badge variant="secondary">+ Sites génériques</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Traditional Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Méthode Alternative (Via Popup)
              </CardTitle>
              <CardDescription>
                Vous pouvez aussi utiliser le popup de l'extension
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Cliquez sur l'icône de l'extension</h3>
                    <p className="text-sm text-muted-foreground">
                      L'extension détectera automatiquement les informations du produit
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Utilisez "Scraper cette page"</h3>
                    <p className="text-sm text-muted-foreground">
                      Pour extraire plusieurs produits d'une page de listing
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Cliquez sur "Envoyer à l'app"</h3>
                    <p className="text-sm text-muted-foreground">
                      Les produits seront importés dans votre catalogue
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note :</strong> Le menu contextuel (clic droit) est également disponible sur n'importe quelle page.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fonctionnalités</CardTitle>
              <CardDescription>
                Toutes les capacités de l'extension Chrome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg space-y-2 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary">✨ Nouveau</Badge>
                    <h4 className="font-semibold">Import en 1 Clic Automatique</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Des boutons "Importer" apparaissent automatiquement sur chaque page produit et listing. Plus besoin d'ouvrir le popup !
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold">Scraping Intelligent Multi-Plateforme</h4>
                  <p className="text-sm text-muted-foreground">
                    Détection automatique de Temu, AliExpress, Amazon, Shopify, WooCommerce et sites génériques avec extraction optimisée des données
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold">Extraction Complète</h4>
                  <p className="text-sm text-muted-foreground">
                    Titre, prix, images, description, variations, avis, notes, informations vendeur - tout est automatiquement extrait
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold">Import via API Backend</h4>
                  <p className="text-sm text-muted-foreground">
                    Utilise l'edge function product-url-scraper pour un scraping puissant avec Firecrawl et une extraction de données avancée
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold">Notifications Toast Élégantes</h4>
                  <p className="text-sm text-muted-foreground">
                    Retour visuel immédiat de l'état de l'import (en cours, succès, erreur) directement sur la page
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold">Menu Contextuel</h4>
                  <p className="text-sm text-muted-foreground">
                    Clic droit sur n'importe quelle page pour accéder rapidement aux fonctions de scraping et d'import
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
