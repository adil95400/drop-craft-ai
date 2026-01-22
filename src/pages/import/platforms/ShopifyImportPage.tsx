import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Link, 
  Upload, 
  Search, 
  Store, 
  Package, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  RefreshCw,
  Download,
  Filter,
  Grid3X3,
  List,
  Star,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';

export default function ShopifyImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [connectedStores, setConnectedStores] = useState([
    { id: '1', name: 'Ma Boutique Shopify', url: 'ma-boutique.myshopify.com', products: 245, status: 'connected', lastSync: '2026-01-22' }
  ]);

  const handleImport = async () => {
    if (!url) {
      toast.error('Veuillez entrer une URL de produit Shopify');
      return;
    }
    setIsImporting(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          toast.success('Produit importé avec succès !');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#96bf48] to-[#5e8e3e] text-white">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/20 mb-4"
            onClick={() => navigate('/import')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Hub
          </Button>
          
          <div className="flex items-center gap-4">
            <img src="/logos/shopify.svg" alt="Shopify" className="w-16 h-16 bg-white rounded-xl p-2" />
            <div>
              <h1 className="text-3xl font-bold">Import Shopify</h1>
              <p className="text-white/80">Importez des produits depuis n'importe quelle boutique Shopify</p>
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-0">
              <CheckCircle2 className="w-3 h-3 mr-1" /> API Officielle
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <Zap className="w-3 h-3 mr-1" /> Import Instantané
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <Package className="w-3 h-3 mr-1" /> Produits Illimités
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="url" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="url">Par URL</TabsTrigger>
            <TabsTrigger value="store">Boutique</TabsTrigger>
            <TabsTrigger value="bulk">Import en Masse</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5 text-[#96bf48]" />
                  Import par URL
                </CardTitle>
                <CardDescription>
                  Collez l'URL d'un produit Shopify pour l'importer instantanément
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://store.myshopify.com/products/product-name"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="bg-[#96bf48] hover:bg-[#5e8e3e]"
                  >
                    {isImporting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Importer
                  </Button>
                </div>
                
                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">Import en cours... {progress}%</p>
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Formats supportés :</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• https://store.myshopify.com/products/product-name</li>
                    <li>• https://store.com/products/product-name (domaine personnalisé)</li>
                    <li>• https://store.myshopify.com/collections/all</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#96bf48]" />
                  Boutiques Connectées
                </CardTitle>
                <CardDescription>
                  Gérez vos connexions Shopify et synchronisez vos produits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="bg-[#96bf48] hover:bg-[#5e8e3e]">
                  <Store className="w-4 h-4 mr-2" />
                  Connecter une Boutique
                </Button>

                <div className="space-y-3">
                  {connectedStores.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#96bf48]/10 rounded-lg flex items-center justify-center">
                          <Store className="w-5 h-5 text-[#96bf48]" />
                        </div>
                        <div>
                          <p className="font-medium">{store.name}</p>
                          <p className="text-sm text-muted-foreground">{store.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{store.products} produits</p>
                          <p className="text-xs text-muted-foreground">Sync: {store.lastSync}</p>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Connecté
                        </Badge>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#96bf48]" />
                  Import en Masse
                </CardTitle>
                <CardDescription>
                  Importez plusieurs produits ou collections entières
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium mb-2">Glissez un fichier CSV ou cliquez pour sélectionner</p>
                  <p className="text-sm text-muted-foreground mb-4">Format: URL par ligne ou export Shopify</p>
                  <Button variant="outline">
                    Sélectionner un fichier
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Options d'import :</p>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked className="rounded" />
                      Importer les images
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked className="rounded" />
                      Importer les variantes
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked className="rounded" />
                      Conserver les tags
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" />
                      Appliquer les règles auto
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#96bf48]/10 rounded-lg">
                  <Package className="w-5 h-5 text-[#96bf48]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1,234</p>
                  <p className="text-sm text-muted-foreground">Produits importés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Store className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Boutiques</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">98%</p>
                  <p className="text-sm text-muted-foreground">Taux de succès</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Zap className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">&lt;2s</p>
                  <p className="text-sm text-muted-foreground">Temps moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
