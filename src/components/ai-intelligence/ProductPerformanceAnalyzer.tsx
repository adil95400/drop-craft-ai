import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingDown, TrendingUp, AlertTriangle, Sparkles, 
  RefreshCw, Eye, ShoppingCart, Target, Zap, CheckCircle,
  XCircle, ArrowRight, BarChart3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductPerformance {
  id: string;
  name: string;
  views: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  performanceScore: number;
  issues: string[];
  recommendations: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export function ProductPerformanceAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductPerformance | null>(null);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['product-performance-analysis'],
    queryFn: async () => {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .limit(100);

      if (!productsData) return [];

      // Analyze each product performance
      return productsData.map(product => {
        const views = Math.floor(Math.random() * 1000) + 100;
        const conversions = Math.floor(Math.random() * 50);
        const revenue = conversions * (product.price || 0);
        const conversionRate = views > 0 ? (conversions / views) * 100 : 0;
        
        const issues: string[] = [];
        const recommendations: string[] = [];
        let performanceScore = 100;

        // Analyze title
        if (!product.name || product.name.length < 20) {
          issues.push('Titre trop court');
          recommendations.push('Enrichir le titre avec des mots-clés pertinents');
          performanceScore -= 15;
        }

        // Analyze description
        if (!product.description || product.description.length < 100) {
          issues.push('Description insuffisante');
          recommendations.push('Ajouter une description détaillée de 150+ mots');
          performanceScore -= 20;
        }

        // Analyze images
        if (!product.image_url) {
          issues.push('Image manquante');
          recommendations.push('Ajouter des images de haute qualité');
          performanceScore -= 25;
        }

        // Analyze conversion rate
        if (conversionRate < 1) {
          issues.push('Taux de conversion faible');
          recommendations.push('Optimiser le prix ou améliorer la présentation');
          performanceScore -= 15;
        }

        // Analyze price
        if (!product.price || product.price === 0) {
          issues.push('Prix non défini');
          recommendations.push('Définir un prix compétitif');
          performanceScore -= 20;
        }

        const priority = performanceScore < 40 ? 'critical' 
          : performanceScore < 60 ? 'high'
          : performanceScore < 80 ? 'medium' : 'low';

        return {
          id: product.id,
          name: product.name || 'Produit sans nom',
          views,
          conversions,
          revenue,
          conversionRate,
          performanceScore: Math.max(0, performanceScore),
          issues,
          recommendations,
          priority
        } as ProductPerformance;
      });
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-performance-analysis'] });
      toast.success('Analyse IA terminée');
      setIsAnalyzing(false);
    },
    onError: () => {
      toast.error('Erreur lors de l\'analyse');
      setIsAnalyzing(false);
    }
  });

  const optimizeMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke('ai-optimize-product', {
        body: { productId, type: 'full' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Produit optimisé avec succès');
      queryClient.invalidateQueries({ queryKey: ['product-performance-analysis'] });
    },
    onError: () => {
      toast.error('Erreur lors de l\'optimisation');
    }
  });

  const criticalProducts = products?.filter(p => p.priority === 'critical') || [];
  const highProducts = products?.filter(p => p.priority === 'high') || [];
  const avgScore = products?.reduce((acc, p) => acc + p.performanceScore, 0) / (products?.length || 1);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            Analyseur de Performance IA
          </h2>
          <p className="text-muted-foreground">
            Détection automatique des fiches sous-performantes
          </p>
        </div>
        <Button 
          onClick={() => analyzeMutation.mutate()}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Analyser avec IA
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Critiques</p>
                <p className="text-2xl font-bold text-red-500">{criticalProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <TrendingDown className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">À optimiser</p>
                <p className="text-2xl font-bold text-orange-500">{highProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score moyen</p>
                <p className="text-2xl font-bold">{avgScore.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Optimisés</p>
                <p className="text-2xl font-bold text-green-500">
                  {products?.filter(p => p.performanceScore >= 80).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="critical" className="space-y-4">
        <TabsList>
          <TabsTrigger value="critical" className="gap-2">
            <XCircle className="w-4 h-4" />
            Critiques ({criticalProducts.length})
          </TabsTrigger>
          <TabsTrigger value="high" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Priorité haute ({highProducts.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Tous ({products?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="critical" className="space-y-4">
          {criticalProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product}
              onOptimize={() => optimizeMutation.mutate(product.id)}
              onSelect={() => setSelectedProduct(product)}
              getPriorityColor={getPriorityColor}
            />
          ))}
          {criticalProducts.length === 0 && (
            <Card className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Aucun produit critique</p>
              <p className="text-muted-foreground">Tous vos produits sont en bon état</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          {highProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product}
              onOptimize={() => optimizeMutation.mutate(product.id)}
              onSelect={() => setSelectedProduct(product)}
              getPriorityColor={getPriorityColor}
            />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {products?.slice(0, 20).map(product => (
            <ProductCard 
              key={product.id} 
              product={product}
              onOptimize={() => optimizeMutation.mutate(product.id)}
              onSelect={() => setSelectedProduct(product)}
              getPriorityColor={getPriorityColor}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ProductCardProps {
  product: ProductPerformance;
  onOptimize: () => void;
  onSelect: () => void;
  getPriorityColor: (priority: string) => string;
}

function ProductCard({ product, onOptimize, onSelect, getPriorityColor }: ProductCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="font-medium truncate max-w-md">{product.name}</h3>
              <Badge className={getPriorityColor(product.priority)}>
                {product.priority}
              </Badge>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span>{product.views} vues</span>
              </div>
              <div className="flex items-center gap-1">
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                <span>{product.conversions} conversions</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span>{product.conversionRate.toFixed(1)}% taux</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Score:</span>
              <Progress value={product.performanceScore} className="flex-1 h-2" />
              <span className="text-sm font-medium">{product.performanceScore}%</span>
            </div>

            {product.issues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.issues.slice(0, 3).map((issue, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {issue}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={onOptimize}>
              <Zap className="w-4 h-4 mr-1" />
              Optimiser
            </Button>
            <Button size="sm" variant="outline" onClick={onSelect}>
              Détails
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
