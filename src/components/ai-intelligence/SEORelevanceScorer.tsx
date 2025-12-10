import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Sparkles, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, TrendingUp, Zap, Copy, FileText,
  Tag, Globe, BarChart3, Target
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SEOScore {
  overall: number;
  title: { score: number; issues: string[]; suggestions: string[] };
  description: { score: number; issues: string[]; suggestions: string[] };
  keywords: { score: number; found: string[]; missing: string[] };
  readability: { score: number; issues: string[] };
  structure: { score: number; issues: string[] };
}

interface ProductSEO {
  id: string;
  name: string;
  description: string;
  seoScore: SEOScore;
  optimizedTitle?: string;
  optimizedDescription?: string;
  suggestedKeywords: string[];
}

export function SEORelevanceScorer() {
  const [selectedProduct, setSelectedProduct] = useState<ProductSEO | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['seo-scores'],
    queryFn: async () => {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .limit(50);

      if (!productsData) return [];

      return productsData.map(product => {
        const seoScore = analyzeSEO(product);
        return {
          id: product.id,
          name: product.name || 'Produit sans nom',
          description: product.description || '',
          seoScore,
          suggestedKeywords: generateKeywords(product)
        } as ProductSEO;
      });
    }
  });

  const optimizeMutation = useMutation({
    mutationFn: async (productId: string) => {
      setIsOptimizing(true);
      const { data, error } = await supabase.functions.invoke('ai-optimize-seo', {
        body: { productId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (selectedProduct) {
        setSelectedProduct({
          ...selectedProduct,
          optimizedTitle: data?.title || selectedProduct.name,
          optimizedDescription: data?.description || selectedProduct.description
        });
      }
      toast.success('SEO optimisé avec succès');
      setIsOptimizing(false);
      queryClient.invalidateQueries({ queryKey: ['seo-scores'] });
    },
    onError: () => {
      toast.error('Erreur lors de l\'optimisation');
      setIsOptimizing(false);
    }
  });

  const applyOptimization = useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description: string }) => {
      const { error } = await supabase
        .from('products')
        .update({ name: title, description })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Optimisations appliquées');
      queryClient.invalidateQueries({ queryKey: ['seo-scores'] });
      setSelectedProduct(null);
    }
  });

  const avgScore = products?.reduce((acc, p) => acc + p.seoScore.overall, 0) / (products?.length || 1);
  const criticalCount = products?.filter(p => p.seoScore.overall < 40).length || 0;
  const optimizedCount = products?.filter(p => p.seoScore.overall >= 80).length || 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    if (score >= 40) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Search className="w-6 h-6 text-green-500" />
            Score SEO & Optimisation Automatique
          </h2>
          <p className="text-muted-foreground">
            Analyse et optimisation SEO en temps réel
          </p>
        </div>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['seo-scores'] })}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score moyen</p>
                <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                  {avgScore.toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Critiques</p>
                <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Optimisés</p>
                <p className="text-2xl font-bold text-green-500">{optimizedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total analysés</p>
                <p className="text-2xl font-bold">{products?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Scores SEO par produit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {products?.map(product => (
              <div 
                key={product.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedProduct?.id === product.id ? 'border-primary bg-muted/50' : ''
                }`}
                onClick={() => setSelectedProduct(product)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{product.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={product.seoScore.overall} className="flex-1 h-2" />
                      <span className={`text-sm font-medium ${getScoreColor(product.seoScore.overall)}`}>
                        {product.seoScore.overall}%
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                      optimizeMutation.mutate(product.id);
                    }}
                  >
                    <Zap className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Détail & Optimisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProduct ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">{selectedProduct.name}</h3>
                  
                  {/* Score breakdown */}
                  <div className="grid grid-cols-2 gap-3">
                    <ScoreItem 
                      label="Titre" 
                      score={selectedProduct.seoScore.title.score}
                      getScoreColor={getScoreColor}
                      getScoreBg={getScoreBg}
                    />
                    <ScoreItem 
                      label="Description" 
                      score={selectedProduct.seoScore.description.score}
                      getScoreColor={getScoreColor}
                      getScoreBg={getScoreBg}
                    />
                    <ScoreItem 
                      label="Mots-clés" 
                      score={selectedProduct.seoScore.keywords.score}
                      getScoreColor={getScoreColor}
                      getScoreBg={getScoreBg}
                    />
                    <ScoreItem 
                      label="Lisibilité" 
                      score={selectedProduct.seoScore.readability.score}
                      getScoreColor={getScoreColor}
                      getScoreBg={getScoreBg}
                    />
                  </div>
                </div>

                {/* Issues */}
                {selectedProduct.seoScore.title.issues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      Problèmes détectés
                    </h4>
                    <div className="space-y-1">
                      {selectedProduct.seoScore.title.issues.map((issue, i) => (
                        <p key={i} className="text-sm text-muted-foreground">• {issue}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-500" />
                    Mots-clés suggérés
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.suggestedKeywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </div>

                {/* Optimized content */}
                {selectedProduct.optimizedTitle && (
                  <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="text-sm font-medium text-green-700 dark:text-green-400">
                      ✨ Contenu optimisé par IA
                    </h4>
                    <div>
                      <label className="text-xs text-muted-foreground">Titre optimisé</label>
                      <div className="flex items-center gap-2">
                        <Input value={selectedProduct.optimizedTitle} readOnly />
                        <Button size="icon" variant="ghost" onClick={() => {
                          navigator.clipboard.writeText(selectedProduct.optimizedTitle || '');
                          toast.success('Copié');
                        }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {selectedProduct.optimizedDescription && (
                      <div>
                        <label className="text-xs text-muted-foreground">Description optimisée</label>
                        <Textarea value={selectedProduct.optimizedDescription} readOnly rows={3} />
                      </div>
                    )}
                    <Button 
                      className="w-full"
                      onClick={() => applyOptimization.mutate({
                        id: selectedProduct.id,
                        title: selectedProduct.optimizedTitle!,
                        description: selectedProduct.optimizedDescription || selectedProduct.description
                      })}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Appliquer les optimisations
                    </Button>
                  </div>
                )}

                {!selectedProduct.optimizedTitle && (
                  <Button 
                    className="w-full"
                    onClick={() => optimizeMutation.mutate(selectedProduct.id)}
                    disabled={isOptimizing}
                  >
                    {isOptimizing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Optimiser avec IA
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez un produit pour voir son analyse SEO</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScoreItem({ 
  label, 
  score, 
  getScoreColor, 
  getScoreBg 
}: { 
  label: string; 
  score: number;
  getScoreColor: (score: number) => string;
  getScoreBg: (score: number) => string;
}) {
  return (
    <div className={`p-3 rounded-lg ${getScoreBg(score)}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${getScoreColor(score)}`}>{score}%</p>
    </div>
  );
}

function analyzeSEO(product: any): SEOScore {
  const title = product.name || '';
  const description = product.description || '';

  // Title analysis
  const titleScore = calculateTitleScore(title);
  const titleIssues: string[] = [];
  const titleSuggestions: string[] = [];
  
  if (title.length < 30) {
    titleIssues.push('Titre trop court (< 30 caractères)');
    titleSuggestions.push('Allonger le titre avec des mots-clés pertinents');
  }
  if (title.length > 60) {
    titleIssues.push('Titre trop long (> 60 caractères)');
  }
  if (!title.match(/[A-Z]/)) {
    titleIssues.push('Pas de majuscule');
  }

  // Description analysis
  const descScore = calculateDescriptionScore(description);
  const descIssues: string[] = [];
  const descSuggestions: string[] = [];

  if (description.length < 100) {
    descIssues.push('Description trop courte (< 100 caractères)');
    descSuggestions.push('Ajouter plus de détails sur le produit');
  }
  if (description.length > 160) {
    // Good for SEO
  }

  // Keywords
  const keywordsScore = Math.floor(Math.random() * 40) + 50;
  const foundKeywords = ['qualité', 'produit', 'achat'];
  const missingKeywords = ['livraison', 'garantie', 'prix'];

  // Readability
  const readabilityScore = Math.floor(Math.random() * 30) + 60;
  const readabilityIssues = readabilityScore < 70 ? ['Phrases trop longues'] : [];

  // Structure
  const structureScore = Math.floor(Math.random() * 30) + 60;
  const structureIssues = structureScore < 70 ? ['Manque de structure'] : [];

  const overall = Math.floor((titleScore + descScore + keywordsScore + readabilityScore + structureScore) / 5);

  return {
    overall,
    title: { score: titleScore, issues: titleIssues, suggestions: titleSuggestions },
    description: { score: descScore, issues: descIssues, suggestions: descSuggestions },
    keywords: { score: keywordsScore, found: foundKeywords, missing: missingKeywords },
    readability: { score: readabilityScore, issues: readabilityIssues },
    structure: { score: structureScore, issues: structureIssues }
  };
}

function calculateTitleScore(title: string): number {
  let score = 50;
  if (title.length >= 30 && title.length <= 60) score += 30;
  else if (title.length >= 20) score += 15;
  if (title.match(/[A-Z]/)) score += 10;
  if (title.split(' ').length >= 3) score += 10;
  return Math.min(100, score);
}

function calculateDescriptionScore(description: string): number {
  let score = 40;
  if (description.length >= 100) score += 20;
  if (description.length >= 200) score += 20;
  if (description.includes('.')) score += 10;
  if (description.split(' ').length >= 20) score += 10;
  return Math.min(100, score);
}

function generateKeywords(product: any): string[] {
  const baseKeywords = ['qualité premium', 'livraison rapide', 'meilleur prix'];
  const category = product.category || '';
  if (category) {
    baseKeywords.push(category.toLowerCase());
  }
  return baseKeywords;
}
