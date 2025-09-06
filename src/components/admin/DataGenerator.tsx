import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Users,
  ShoppingBag,
  Package,
  Store,
  Zap,
  Download,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const DataGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');
  const [category, setCategory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [productCount, setProductCount] = useState(50);

  const generateTestData = async (action: string, count = 10) => {
    try {
      setLoading(true);
      setProgress(0);

      const { data, error } = await supabase.functions.invoke('generate-test-data', {
        body: { action, count }
      });

      if (error) throw error;

      setResults(data.data);
      setProgress(100);
      toast.success(`Données de test générées: ${action}`);
      
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error('Erreur lors de la génération: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const syncMarketplaceData = async () => {
    try {
      setLoading(true);
      setProgress(0);

      const { data, error } = await supabase.functions.invoke('marketplace-sync', {
        body: {
          marketplace: selectedMarketplace,
          category: category || undefined,
          keywords: keywords || undefined,
          limit: productCount
        }
      });

      if (error) throw error;

      setResults(data.data);
      setProgress(100);
      toast.success(`Synchronisation marketplace terminée: ${data.data.products_synced} produits`);
      
    } catch (error: any) {
      console.error('Marketplace sync error:', error);
      toast.error('Erreur lors de la synchronisation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAllData = async () => {
    try {
      setLoading(true);
      setProgress(0);

      // Generate all test data in sequence
      const actions = [
        { action: 'generate_suppliers', count: 8, label: 'Fournisseurs' },
        { action: 'generate_customers', count: 15, label: 'Clients' },
        { action: 'generate_products', count: 25, label: 'Produits' },
        { action: 'generate_orders', count: 10, label: 'Commandes' }
      ];

      let totalGenerated = 0;

      for (let i = 0; i < actions.length; i++) {
        const { action, count, label } = actions[i];
        
        toast.info(`Génération ${label}...`);
        
        const { data, error } = await supabase.functions.invoke('generate-test-data', {
          body: { action, count }
        });

        if (error) throw error;

        totalGenerated += data.data.created;
        setProgress(((i + 1) / actions.length) * 100);
        
        // Small delay between generations
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setResults({ total: totalGenerated, message: 'Toutes les données de test générées' });
      toast.success(`Génération complète: ${totalGenerated} éléments créés`);
      
    } catch (error: any) {
      console.error('Full generation error:', error);
      toast.error('Erreur lors de la génération complète: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Générateur de Données</h2>
          <p className="text-muted-foreground">
            Générez des données de test réalistes pour peupler votre application
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <Database className="w-4 h-4 mr-1" />
          Données Réelles
        </Badge>
      </div>

      {/* Progress */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Génération en cours...</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Génération réussie</p>
                <p className="text-sm text-green-700">
                  {typeof results === 'object' ? JSON.stringify(results, null, 2) : results}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="test-data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test-data">Données de Test</TabsTrigger>
          <TabsTrigger value="marketplace">Synchronisation Marketplace</TabsTrigger>
          <TabsTrigger value="bulk-operations">Opérations en Masse</TabsTrigger>
        </TabsList>

        <TabsContent value="test-data" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Suppliers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-500" />
                  Fournisseurs
                </CardTitle>
                <CardDescription className="text-xs">
                  AliExpress, Amazon, Shopify, etc.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Fournisseurs réels avec APIs et données authentiques
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => generateTestData('generate_suppliers', 8)}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : '8 Fournisseurs'}
                </Button>
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-500" />
                  Produits
                </CardTitle>
                <CardDescription className="text-xs">
                  iPhone, Samsung, PlayStation, etc.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Produits tendance avec vrais prix et images
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => generateTestData('generate_products', 20)}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : '20 Produits'}
                </Button>
              </CardContent>
            </Card>

            {/* Customers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Clients
                </CardTitle>
                <CardDescription className="text-xs">
                  Données françaises réalistes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Noms, adresses et historiques français
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => generateTestData('generate_customers', 12)}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : '12 Clients'}
                </Button>
              </CardContent>
            </Card>

            {/* Orders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-orange-500" />
                  Commandes
                </CardTitle>
                <CardDescription className="text-xs">
                  Commandes avec vrais produits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Historique d'achats cohérent et réaliste
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => generateTestData('generate_orders', 8)}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : '8 Commandes'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generate All Button */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Génération Complète
              </CardTitle>
              <CardDescription>
                Génère toutes les données de test d'un coup pour un environnement complet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={generateAllData}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                Générer Toutes les Données de Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Synchronisation Marketplace
              </CardTitle>
              <CardDescription>
                Importez de vrais produits depuis les marketplaces populaires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marketplace">Marketplace</Label>
                  <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les marketplaces</SelectItem>
                      <SelectItem value="aliexpress">AliExpress</SelectItem>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="shopify">Shopify Apps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie (optionnel)</Label>
                  <Input
                    id="category"
                    placeholder="Electronics, Fashion, Home..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Mots-clés (optionnel)</Label>
                  <Input
                    id="keywords"
                    placeholder="smartphone, gaming, premium..."
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="count">Nombre de produits</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="200"
                    value={productCount}
                    onChange={(e) => setProductCount(parseInt(e.target.value) || 50)}
                  />
                </div>
              </div>

              <Button 
                onClick={syncMarketplaceData}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Synchroniser les Produits Marketplace
              </Button>
            </CardContent>
          </Card>

          {/* Marketplace Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                    🛒
                  </div>
                  AliExpress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Produits électroniques, mode et maison depuis la Chine. Prix compétitifs avec variations de couleur et taille.
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                    📦
                  </div>
                  Amazon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Millions de produits avec avis clients, notes et statut Prime. Livraison rapide disponible.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                    🏪
                  </div>
                  Shopify
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Produits artisanaux et premium de boutiques indépendantes. Qualité supérieure et designs uniques.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk-operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Opérations en Masse
              </CardTitle>
              <CardDescription>
                Opérations de maintenance et nettoyage des données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">Attention</h4>
                    <p className="text-sm text-amber-700">
                      Ces opérations modifient ou suppriment des données en masse. Utilisez avec précaution.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" disabled>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nettoyer les Doublons
                </Button>
                <Button variant="outline" disabled>
                  <Database className="w-4 h-4 mr-2" />
                  Recalculer les Statistiques
                </Button>
                <Button variant="outline" disabled>
                  <Package className="w-4 h-4 mr-2" />
                  Mettre à Jour les Prix
                </Button>
                <Button variant="outline" disabled>
                  <Store className="w-4 h-4 mr-2" />
                  Synchroniser les Stocks
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataGenerator;