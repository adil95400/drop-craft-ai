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
  Settings
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
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Chrome className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Extension Chrome</h1>
          <p className="text-muted-foreground">
            Configuration et installation de l'extension pour l'import 1-clic
          </p>
        </div>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Comment utiliser l'extension
              </CardTitle>
              <CardDescription>
                Guide d'utilisation pour l'import 1-clic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Naviguez vers une page produit</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Allez sur un site de fournisseur (Amazon, AliExpress, eBay, etc.) et ouvrez une page produit
                    </p>
                    <Badge variant="outline">Plateformes supportées</Badge>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge>Amazon</Badge>
                      <Badge>AliExpress</Badge>
                      <Badge>eBay</Badge>
                      <Badge>Walmart</Badge>
                      <Badge>Shopify</Badge>
                      <Badge>Etsy</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Cliquez sur l'icône de l'extension</h3>
                    <p className="text-sm text-muted-foreground">
                      L'extension détectera automatiquement les informations du produit (nom, prix, images, description)
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Vérifiez et ajustez les données</h3>
                    <p className="text-sm text-muted-foreground">
                      Vous pouvez modifier les champs détectés avant l'import (prix, marge, catégorie, etc.)
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Cliquez sur "Importer"</h3>
                    <p className="text-sm text-muted-foreground">
                      Le produit sera automatiquement ajouté à votre catalogue
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Astuce Pro:</strong> Vous pouvez aussi faire un clic droit sur une image de produit et sélectionner "Importer avec l'extension" dans le menu contextuel.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fonctionnalités avancées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold">Import en lot</h4>
                  <p className="text-sm text-muted-foreground">
                    Maintenez Ctrl (ou Cmd sur Mac) et cliquez sur plusieurs produits pour les importer en une seule fois
                  </p>
                </div>
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold">Règles de prix automatiques</h4>
                  <p className="text-sm text-muted-foreground">
                    Configurez des règles pour calculer automatiquement vos prix de vente (marge fixe, pourcentage, paliers)
                  </p>
                </div>
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold">Optimisation IA</h4>
                  <p className="text-sm text-muted-foreground">
                    L'IA peut améliorer automatiquement les titres et descriptions pour le SEO
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
