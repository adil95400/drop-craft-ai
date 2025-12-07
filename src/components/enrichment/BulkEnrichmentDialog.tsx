import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Globe,
  Wand2,
  Package,
  FolderOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkEnrichmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productIds?: string[];
  categoryIds?: string[];
  categories?: { id: string; name: string; productCount?: number }[];
  onComplete?: () => void;
}

const marketplaceSources = [
  { id: 'amazon', name: 'Amazon', description: 'Données PA-API/Rainforest' },
  { id: 'aliexpress', name: 'AliExpress', description: 'Affiliate API' },
  { id: 'ebay', name: 'eBay', description: 'Browse API' },
  { id: 'cdiscount', name: 'Cdiscount', description: 'Marketplace API' },
];

export function BulkEnrichmentDialog({
  open,
  onOpenChange,
  productIds = [],
  categoryIds = [],
  categories = [],
  onComplete,
}: BulkEnrichmentDialogProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>(['amazon', 'aliexpress']);
  const [includeAI, setIncludeAI] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ id: string; status: 'success' | 'error'; message?: string }[]>([]);
  const [selectionMode, setSelectionMode] = useState<'products' | 'categories'>(
    productIds.length > 0 ? 'products' : 'categories'
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryIds);
  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string; productCount: number }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const { toast } = useToast();

  // Charger les catégories disponibles
  useEffect(() => {
    if (open && categories.length === 0) {
      loadCategories();
    } else if (categories.length > 0) {
      setAvailableCategories(categories.map(c => ({ ...c, productCount: c.productCount || 0 })));
    }
  }, [open, categories]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer les catégories avec le nombre de produits
      const { data: products } = await supabase
        .from('products')
        .select('category')
        .eq('user_id', user.id);

      const categoryCount: Record<string, number> = {};
      products?.forEach(p => {
        const cat = p.category || 'Non catégorisé';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const cats = Object.entries(categoryCount).map(([name, count]) => ({
        id: name,
        name,
        productCount: count
      })).sort((a, b) => b.productCount - a.productCount);

      setAvailableCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getProductIdsToEnrich = async (): Promise<string[]> => {
    if (selectionMode === 'products' && productIds.length > 0) {
      return productIds;
    }

    if (selectionMode === 'categories' && selectedCategories.length > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: products } = await supabase
        .from('products')
        .select('id, category')
        .eq('user_id', user.id)
        .in('category', selectedCategories);

      return products?.map(p => p.id) || [];
    }

    return [];
  };

  const handleEnrich = async () => {
    if (selectedSources.length === 0) {
      toast({
        title: 'Sélection requise',
        description: 'Sélectionnez au moins une marketplace',
        variant: 'destructive',
      });
      return;
    }

    const idsToEnrich = await getProductIdsToEnrich();
    
    if (idsToEnrich.length === 0) {
      toast({
        title: 'Aucun produit',
        description: selectionMode === 'products' 
          ? 'Sélectionnez des produits à enrichir'
          : 'Sélectionnez des catégories contenant des produits',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session non trouvée');
      }

      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < idsToEnrich.length; i += batchSize) {
        batches.push(idsToEnrich.slice(i, i + batchSize));
      }

      let processedCount = 0;
      const allResults: typeof results = [];

      for (const batch of batches) {
        // Marketplace enrichment
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-product`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_ids: batch,
              sources: selectedSources,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Erreur lors de l\'enrichissement marketplace');
        }

        const data = await response.json();
        
        // AI enrichment if enabled
        if (includeAI) {
          for (const productId of batch) {
            try {
              await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-product-ai`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ product_id: productId }),
                }
              );
              allResults.push({ id: productId, status: 'success' });
            } catch (error) {
              allResults.push({ id: productId, status: 'error', message: 'Erreur IA' });
            }
          }
        } else {
          data.results?.forEach((r: any) => {
            allResults.push({
              id: r.product_id,
              status: r.status === 'success' ? 'success' : 'error',
              message: r.message,
            });
          });
        }

        processedCount += batch.length;
        setProgress((processedCount / idsToEnrich.length) * 100);
        setResults([...allResults]);
      }

      toast({
        title: 'Enrichissement terminé',
        description: `${allResults.filter(r => r.status === 'success').length}/${idsToEnrich.length} produits enrichis`,
      });

      onComplete?.();
    } catch (error: any) {
      console.error('Bulk enrichment error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'enrichissement',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  const totalSelectedProducts = selectionMode === 'products' 
    ? productIds.length 
    : availableCategories
        .filter(c => selectedCategories.includes(c.id))
        .reduce((sum, c) => sum + c.productCount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enrichissement en masse
          </DialogTitle>
          <DialogDescription>
            Enrichir automatiquement vos produits depuis les marketplaces
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode de sélection */}
          <Tabs value={selectionMode} onValueChange={(v) => setSelectionMode(v as 'products' | 'categories')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products" className="gap-2">
                <Package className="h-4 w-4" />
                Produits ({productIds.length})
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Catégories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-4">
              {productIds.length > 0 ? (
                <div className="p-3 rounded-lg border bg-muted/50">
                  <p className="text-sm font-medium">{productIds.length} produits sélectionnés</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ces produits seront enrichis avec les données marketplaces
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed text-center">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucun produit sélectionné. Sélectionnez des produits dans le tableau ou utilisez les catégories.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="categories" className="mt-4">
              {loadingCategories ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : availableCategories.length > 0 ? (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {availableCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-accent/50 cursor-pointer"
                        onClick={() => toggleCategory(category.id)}
                      >
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm font-medium">{category.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {category.productCount} produits
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-3 rounded-lg border border-dashed text-center">
                  <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucune catégorie trouvée
                  </p>
                </div>
              )}
              
              {selectedCategories.length > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-primary">
                    {selectedCategories.length} catégorie(s) → {totalSelectedProducts} produits
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Sources Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Sources de données</Label>
            <div className="grid gap-2">
              {marketplaceSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center space-x-3 p-2.5 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer"
                  onClick={() => toggleSource(source.id)}
                >
                  <Checkbox
                    checked={selectedSources.includes(source.id)}
                    onCheckedChange={() => toggleSource(source.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{source.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{source.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Option */}
          <div
            className="flex items-center space-x-3 p-3 rounded-lg border bg-primary/5 border-primary/20 cursor-pointer"
            onClick={() => setIncludeAI(!includeAI)}
          >
            <Checkbox
              checked={includeAI}
              onCheckedChange={(checked) => setIncludeAI(!!checked)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Optimisation IA</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Générer des titres, descriptions et tags SEO optimisés
              </p>
            </div>
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progression</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {successCount} réussis
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <XCircle className="h-3 w-3 text-destructive" />
                    {errorCount} erreurs
                  </Badge>
                )}
              </div>
              
              {errorCount > 0 && (
                <ScrollArea className="h-24 rounded-md border p-2">
                  {results
                    .filter(r => r.status === 'error')
                    .map((r, i) => (
                      <p key={i} className="text-xs text-destructive">
                        {r.id.slice(0, 8)}... : {r.message || 'Erreur'}
                      </p>
                    ))}
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isProcessing ? 'Fermer' : 'Annuler'}
          </Button>
          <Button 
            onClick={handleEnrich} 
            disabled={isProcessing || selectedSources.length === 0 || totalSelectedProducts === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enrichissement...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Enrichir {totalSelectedProducts} produits
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
