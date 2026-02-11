import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductImports } from '@/hooks/useProductImports';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  Package, 
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function ImportPublishingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { importedProducts, loading, fetchImportedProducts } = useProductImports();
  const [publishing, setPublishing] = useState(false);
  const [publishingProgress, setPublishingProgress] = useState(0);

  const draftProducts = importedProducts.filter(p => p.status === 'draft');
  const publishedProducts = importedProducts.filter(p => p.status === 'published');
  const approvedProducts = importedProducts.filter(p => p.ai_optimized === true);

  const handlePublishAll = async () => {
    setPublishing(true);
    setPublishingProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const productsToPublish = draftProducts.filter(p => p.ai_optimized === true);
      
      if (productsToPublish.length === 0) {
        toast({
          title: 'Aucun produit à publier',
          description: 'Aucun produit optimisé n\'est disponible pour publication.',
        });
        setPublishing(false);
        return;
      }

      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < productsToPublish.length; i += batchSize) {
        batches.push(productsToPublish.slice(i, i + batchSize));
      }

      let publishedCount = 0;

      for (const batch of batches) {
        const { error } = await supabase
          .from('imported_products')
          .update({ 
            status: 'published',
            updated_at: new Date().toISOString()
          })
          .in('id', batch.map(p => p.id));

        if (error) throw error;

        publishedCount += batch.length;
        setPublishingProgress(Math.round((publishedCount / productsToPublish.length) * 100));
      }

      toast({
        title: 'Publication réussie',
        description: `${productsToPublish.length} produits ont été publiés avec succès.`,
      });

      await fetchImportedProducts();
    } catch (error) {
      console.error('Erreur publication:', error);
      toast({
        title: 'Erreur de publication',
        description: error instanceof Error ? error.message : 'Impossible de publier les produits',
        variant: 'destructive',
      });
    } finally {
      setPublishing(false);
      setPublishingProgress(0);
    }
  };

  const handlePublishToShopify = async () => {
    try {
      const productsToPublish = publishedProducts.slice(0, 50); // Limite de sécurité
      
      toast({
        title: 'Synchronisation Shopify',
        description: `Publication de ${productsToPublish.length} produits vers Shopify en cours...`,
      });

      const { data, error } = await supabase.functions.invoke('import-to-shopify', {
        body: {
          action: 'import_bulk',
          supplier_product_ids: productsToPublish.map(p => p.id),
        },
      });

      if (error) throw error;

      toast({
        title: 'Synchronisation lancée',
        description: `Job ID: ${data.job_id}. Consultez l'historique pour suivre la progression.`,
      });
    } catch (error) {
      console.error('Erreur Shopify sync:', error);
      toast({
        title: 'Erreur de synchronisation',
        description: 'Impossible de publier vers Shopify',
        variant: 'destructive',
      });
    }
  };

  return (
    <ChannablePageWrapper
      title="Publication de Produits"
      description="Publiez vos produits importés vers votre boutique et les marketplaces"
      heroImage="import"
      badge={{ label: 'Publication', icon: Upload }}
      actions={
        <Button onClick={() => fetchImportedProducts()} variant="outline" size="icon">
          <RefreshCw className="w-4 h-4" />
        </Button>
      }
    >

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Brouillons</p>
                <p className="text-2xl font-bold">{draftProducts.length}</p>
              </div>
              <Package className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approuvés</p>
                <p className="text-2xl font-bold">{approvedProducts.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Publiés</p>
                <p className="text-2xl font-bold">{publishedProducts.length}</p>
              </div>
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux Publication</p>
                <p className="text-2xl font-bold">
                  {importedProducts.length > 0
                    ? Math.round((publishedProducts.length / importedProducts.length) * 100)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publication Progress */}
      {publishing && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="font-medium mb-2">Publication en cours...</p>
                <Progress value={publishingProgress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">{publishingProgress}% complété</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publishing Actions */}
      <Tabs defaultValue="internal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="internal">Publication Interne</TabsTrigger>
          <TabsTrigger value="external">Marketplaces</TabsTrigger>
        </TabsList>

        <TabsContent value="internal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publier sur votre Boutique</CardTitle>
              <CardDescription>
                Publiez les produits approuvés vers votre catalogue interne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Produits prêts à publier</p>
                  <p className="text-sm text-muted-foreground">
                    {draftProducts.filter(p => p.ai_optimized === true).length} produits optimisés en attente
                  </p>
                </div>
                <Button 
                  onClick={handlePublishAll}
                  disabled={publishing || draftProducts.filter(p => p.ai_optimized === true).length === 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Publier Tout
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Synchroniser avec Shopify</p>
                  <p className="text-sm text-muted-foreground">
                    {publishedProducts.length} produits publiés disponibles
                  </p>
                </div>
                <Button 
                  onClick={handlePublishToShopify}
                  variant="outline"
                  disabled={publishedProducts.length === 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Vers Shopify
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="external" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publication Multi-Canaux</CardTitle>
              <CardDescription>
                Publiez vos produits sur toutes les plateformes e-commerce
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amazon */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">Amazon</p>
                      <p className="text-sm text-muted-foreground">Marketplace mondiale</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Connecter</Button>
                </div>

                {/* eBay */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">eBay</p>
                      <p className="text-sm text-muted-foreground">Enchères et ventes</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Connecter</Button>
                </div>

                {/* TikTok Shop */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">TikTok Shop</p>
                      <p className="text-sm text-muted-foreground">Social commerce</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Connecter</Button>
                </div>

                {/* Meta/Facebook */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-medium">Meta Commerce</p>
                      <p className="text-sm text-muted-foreground">Facebook & Instagram</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Connecter</Button>
                </div>

                {/* Google Shopping */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Google Shopping</p>
                      <p className="text-sm text-muted-foreground">Publicité produits</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Connecter</Button>
                </div>

                {/* Etsy */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-600/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-orange-700" />
                    </div>
                    <div>
                      <p className="font-medium">Etsy</p>
                      <p className="text-sm text-muted-foreground">Produits artisanaux</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Connecter</Button>
                </div>

                {/* Walmart */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-800/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-900" />
                    </div>
                    <div>
                      <p className="font-medium">Walmart</p>
                      <p className="text-sm text-muted-foreground">Retail américain</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Connecter</Button>
                </div>

                {/* Cdiscount */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Cdiscount</p>
                      <p className="text-sm text-muted-foreground">Leader français</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Connecter</Button>
                </div>

                {/* AliExpress */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-red-700" />
                    </div>
                    <div>
                      <p className="font-medium">AliExpress</p>
                      <p className="text-sm text-muted-foreground">Marketplace chinoise</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Connecter</Button>
                </div>

                {/* Wish */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Wish</p>
                      <p className="text-sm text-muted-foreground">Petits prix</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Connecter</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Publications */}
      <Card>
        <CardHeader>
          <CardTitle>Publications Récentes</CardTitle>
          <CardDescription>Derniers produits publiés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {publishedProducts.slice(0, 10).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {product.image_urls?.[0] ? (
                    <img 
                      src={product.image_urls[0]} 
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                </div>
                <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Publié
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  );
}
