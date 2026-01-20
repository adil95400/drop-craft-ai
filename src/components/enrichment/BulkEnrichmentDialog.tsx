/**
 * BulkEnrichmentDialog - Modal d'enrichissement en masse optimisé et avancé
 * Version 2.0 - Production-ready avec animations, états de progression améliorés
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Globe,
  Wand2,
  Package,
  FolderOpen,
  ShoppingBag,
  Store,
  TrendingUp,
  Zap,
  AlertCircle,
  RotateCw,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BulkEnrichmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productIds?: string[];
  categoryIds?: string[];
  categories?: { id: string; name: string; productCount?: number }[];
  onComplete?: () => void;
}

interface MarketplaceSource {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface EnrichmentResult {
  id: string;
  status: 'success' | 'error' | 'pending';
  message?: string;
  productName?: string;
}

const marketplaceSources: MarketplaceSource[] = [
  { 
    id: 'amazon', 
    name: 'Amazon', 
    description: 'PA-API / Rainforest',
    icon: ShoppingBag,
    color: 'bg-orange-500'
  },
  { 
    id: 'aliexpress', 
    name: 'AliExpress', 
    description: 'Affiliate API',
    icon: Globe,
    color: 'bg-red-500'
  },
  { 
    id: 'ebay', 
    name: 'eBay', 
    description: 'Browse API',
    icon: Store,
    color: 'bg-blue-500'
  },
  { 
    id: 'cdiscount', 
    name: 'Cdiscount', 
    description: 'Marketplace API',
    icon: TrendingUp,
    color: 'bg-purple-500'
  },
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
  const [currentProduct, setCurrentProduct] = useState<string>('');
  const [results, setResults] = useState<EnrichmentResult[]>([]);
  const [selectionMode, setSelectionMode] = useState<'products' | 'categories'>(
    productIds.length > 0 ? 'products' : 'categories'
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryIds);
  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string; productCount: number }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [step, setStep] = useState<'config' | 'processing' | 'complete'>('config');
  const { toast } = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('config');
      setProgress(0);
      setResults([]);
      setCurrentProduct('');
      setSelectedSources(['amazon', 'aliexpress']);
      setIncludeAI(true);
    }
  }, [open]);

  // Load categories
  useEffect(() => {
    if (open && categories.length === 0) {
      loadCategories();
    } else if (categories.length > 0) {
      setAvailableCategories(categories.map(c => ({ ...c, productCount: c.productCount || 0 })));
    }
  }, [open, categories]);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: products } = await supabase
        .from('products')
        .select('category')
        .eq('user_id', user.id);

      const categoryCount: Record<string, number> = {};
      products?.forEach(p => {
        const cat = p.category || 'Non catégorisé';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const cats = Object.entries(categoryCount)
        .map(([name, count]) => ({
          id: name,
          name,
          productCount: count
        }))
        .sort((a, b) => b.productCount - a.productCount);

      setAvailableCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const toggleSource = useCallback((sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  const getProductIdsToEnrich = useCallback(async (): Promise<string[]> => {
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
  }, [selectionMode, productIds, selectedCategories]);

  const handleEnrich = useCallback(async () => {
    if (selectedSources.length === 0) {
      toast({
        title: 'Sélection requise',
        description: 'Veuillez sélectionner au moins une source de données',
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

    setStep('processing');
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      const batchSize = 3;
      const batches: string[][] = [];
      for (let i = 0; i < idsToEnrich.length; i += batchSize) {
        batches.push(idsToEnrich.slice(i, i + batchSize));
      }

      let processedCount = 0;
      const allResults: EnrichmentResult[] = [];

      for (const batch of batches) {
        // Set current product for UI feedback
        setCurrentProduct(`Traitement lot ${Math.floor(processedCount / batchSize) + 1}/${batches.length}`);

        try {
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erreur lors de l\'enrichissement marketplace');
          }

          const data = await response.json();
          
          // Process marketplace results
          const batchResults = data.results?.map((r: any) => ({
            id: r.product_id,
            status: r.status === 'success' ? 'success' : 'error',
            message: r.message,
            productName: r.product_name,
          })) || batch.map(id => ({ id, status: 'success' as const }));

          // AI enrichment if enabled
          if (includeAI) {
            for (const result of batchResults) {
              if (result.status === 'success') {
                try {
                  setCurrentProduct(`Optimisation IA: ${result.productName || result.id.slice(0, 8)}...`);
                  
                  const aiResponse = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-product-ai`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ product_id: result.id }),
                    }
                  );

                  if (!aiResponse.ok) {
                    result.message = 'Marketplace OK, IA partielle';
                  }
                } catch {
                  result.message = 'Marketplace OK, IA échouée';
                }
              }
            }
          }

          allResults.push(...batchResults);
        } catch (batchError: any) {
          // Mark all items in failed batch as errors
          batch.forEach(id => {
            allResults.push({
              id,
              status: 'error',
              message: batchError.message || 'Erreur de traitement',
            });
          });
        }

        processedCount += batch.length;
        setProgress((processedCount / idsToEnrich.length) * 100);
        setResults([...allResults]);
      }

      setStep('complete');
      
      const successCount = allResults.filter(r => r.status === 'success').length;
      const errorCount = allResults.filter(r => r.status === 'error').length;

      toast({
        title: 'Enrichissement terminé',
        description: `${successCount}/${idsToEnrich.length} produits enrichis avec succès${errorCount > 0 ? `, ${errorCount} erreurs` : ''}`,
        variant: errorCount === allResults.length ? 'destructive' : 'default',
      });

    } catch (error: any) {
      console.error('Bulk enrichment error:', error);
      setStep('config');
      toast({
        title: 'Erreur critique',
        description: error.message || 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setCurrentProduct('');
    }
  }, [selectedSources, includeAI, getProductIdsToEnrich, selectionMode, toast]);

  const handleComplete = useCallback(() => {
    onComplete?.();
    onOpenChange(false);
  }, [onComplete, onOpenChange]);

  const handleRetry = useCallback(() => {
    setStep('config');
    setResults([]);
    setProgress(0);
  }, []);

  // Computed values
  const successCount = useMemo(() => results.filter(r => r.status === 'success').length, [results]);
  const errorCount = useMemo(() => results.filter(r => r.status === 'error').length, [results]);
  
  const totalSelectedProducts = useMemo(() => {
    if (selectionMode === 'products') return productIds.length;
    return availableCategories
      .filter(c => selectedCategories.includes(c.id))
      .reduce((sum, c) => sum + c.productCount, 0);
  }, [selectionMode, productIds.length, availableCategories, selectedCategories]);

  const canEnrich = useMemo(() => 
    selectedSources.length > 0 && totalSelectedProducts > 0,
    [selectedSources.length, totalSelectedProducts]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              Enrichissement en masse
            </DialogTitle>
            <DialogDescription className="text-sm mt-2">
              {step === 'config' && 'Enrichir automatiquement vos produits depuis les marketplaces et optimiser avec l\'IA'}
              {step === 'processing' && 'Enrichissement en cours, veuillez patienter...'}
              {step === 'complete' && 'L\'enrichissement est terminé'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            {/* Configuration Step */}
            {step === 'config' && (
              <motion.div
                key="config"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Selection Tabs */}
                <Tabs 
                  value={selectionMode} 
                  onValueChange={(v) => setSelectionMode(v as 'products' | 'categories')}
                >
                  <TabsList className="grid w-full grid-cols-2 h-12">
                    <TabsTrigger value="products" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Package className="h-4 w-4" />
                      Produits ({productIds.length})
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <FolderOpen className="h-4 w-4" />
                      Catégories
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="products" className="mt-4">
                    {productIds.length > 0 ? (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="p-3 rounded-full bg-primary/10">
                            <Package className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{productIds.length} produits</p>
                            <p className="text-sm text-muted-foreground">
                              seront enrichis avec les données marketplaces
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <p className="font-medium">Aucun produit sélectionné</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Sélectionnez des produits ou utilisez les catégories
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="categories" className="mt-4">
                    {loadingCategories ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : availableCategories.length > 0 ? (
                      <>
                        <ScrollArea className="h-44 rounded-lg border">
                          <div className="p-2 space-y-1">
                            {availableCategories.map((category) => (
                              <motion.div
                                key={category.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                  selectedCategories.includes(category.id)
                                    ? "bg-primary/10 border border-primary/30"
                                    : "hover:bg-accent/50 border border-transparent"
                                )}
                                onClick={() => toggleCategory(category.id)}
                              >
                                <Checkbox
                                  checked={selectedCategories.includes(category.id)}
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="flex-1 flex items-center justify-between">
                                  <span className="font-medium">{category.name}</span>
                                  <Badge variant="secondary">
                                    {category.productCount} produits
                                  </Badge>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                        
                        {selectedCategories.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
                          >
                            <p className="font-medium text-primary flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              {selectedCategories.length} catégorie(s) → {totalSelectedProducts} produits
                            </p>
                          </motion.div>
                        )}
                      </>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground">Aucune catégorie trouvée</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>

                <Separator />

                {/* Data Sources */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Sources de données
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {marketplaceSources.map((source) => {
                      const isSelected = selectedSources.includes(source.id);
                      const IconComponent = source.icon;
                      return (
                        <motion.div
                          key={source.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all",
                            isSelected
                              ? "bg-primary/5 border-primary/30 shadow-sm"
                              : "bg-card hover:bg-accent/30 border-border"
                          )}
                          onClick={() => toggleSource(source.id)}
                        >
                          <div className={cn(
                            "p-1.5 rounded-md transition-colors",
                            isSelected ? source.color : "bg-muted"
                          )}>
                            <IconComponent className={cn(
                              "h-4 w-4",
                              isSelected ? "text-white" : "text-muted-foreground"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{source.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{source.description}</p>
                          </div>
                          <Checkbox
                            checked={isSelected}
                            className="data-[state=checked]:bg-primary"
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Optimization */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all",
                    includeAI
                      ? "bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/40"
                      : "bg-card hover:bg-accent/30 border-border"
                  )}
                  onClick={() => setIncludeAI(!includeAI)}
                >
                  <div className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    includeAI ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Wand2 className={cn(
                      "h-5 w-5",
                      includeAI ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Optimisation IA</span>
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Lovable AI
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Génération de titres, descriptions et tags SEO optimisés
                    </p>
                  </div>
                  <Checkbox
                    checked={includeAI}
                    className="data-[state=checked]:bg-primary h-5 w-5"
                  />
                </motion.div>
              </motion.div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 py-4"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <div className="p-4 rounded-full bg-primary/10">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                  </motion.div>
                  
                  <div>
                    <p className="font-semibold text-lg">Enrichissement en cours</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentProduct || 'Initialisation...'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {results.length > 0 && (
                  <div className="flex items-center justify-center gap-4">
                    <Badge variant="outline" className="gap-1.5 py-1 px-3">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      {successCount} réussis
                    </Badge>
                    {errorCount > 0 && (
                      <Badge variant="outline" className="gap-1.5 py-1 px-3">
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                        {errorCount} erreurs
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Complete Step */}
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 py-4"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="inline-block"
                  >
                    <div className={cn(
                      "p-4 rounded-full",
                      errorCount === 0 ? "bg-green-500/10" : "bg-yellow-500/10"
                    )}>
                      {errorCount === 0 ? (
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                      ) : (
                        <AlertCircle className="h-10 w-10 text-yellow-500" />
                      )}
                    </div>
                  </motion.div>
                  
                  <div>
                    <p className="font-semibold text-xl">
                      {errorCount === 0 ? 'Enrichissement terminé !' : 'Enrichissement terminé avec erreurs'}
                    </p>
                    <p className="text-muted-foreground mt-1">
                      {successCount} produit(s) enrichi(s) sur {results.length}
                    </p>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-green-500/5 border-green-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-500/10">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{successCount}</p>
                        <p className="text-xs text-muted-foreground">Réussis</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className={cn(
                    "border",
                    errorCount > 0 ? "bg-destructive/5 border-destructive/20" : "bg-muted/30"
                  )}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        errorCount > 0 ? "bg-destructive/10" : "bg-muted"
                      )}>
                        <XCircle className={cn(
                          "h-5 w-5",
                          errorCount > 0 ? "text-destructive" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <p className={cn(
                          "text-2xl font-bold",
                          errorCount > 0 ? "text-destructive" : "text-muted-foreground"
                        )}>{errorCount}</p>
                        <p className="text-xs text-muted-foreground">Erreurs</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Error Details */}
                {errorCount > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Détails des erreurs
                    </Label>
                    <ScrollArea className="h-32 rounded-lg border bg-muted/30 p-3">
                      <div className="space-y-2">
                        {results
                          .filter(r => r.status === 'error')
                          .map((r, i) => (
                            <div key={i} className="text-sm flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">
                                <span className="font-mono text-xs">{r.id.slice(0, 8)}...</span>
                                {r.message && ` : ${r.message}`}
                              </span>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-muted/30">
          <DialogFooter className="gap-2 sm:gap-2">
            {step === 'config' && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleEnrich} 
                  disabled={!canEnrich}
                  className="gap-2 min-w-[180px]"
                >
                  <Sparkles className="h-4 w-4" />
                  Enrichir {totalSelectedProducts} produit{totalSelectedProducts > 1 ? 's' : ''}
                </Button>
              </>
            )}
            
            {step === 'processing' && (
              <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement en cours...
              </Button>
            )}
            
            {step === 'complete' && (
              <>
                {errorCount > 0 && (
                  <Button variant="outline" onClick={handleRetry} className="gap-2">
                    <RotateCw className="h-4 w-4" />
                    Réessayer
                  </Button>
                )}
                <Button onClick={handleComplete} className="gap-2">
                  <Check className="h-4 w-4" />
                  Terminer
                </Button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
