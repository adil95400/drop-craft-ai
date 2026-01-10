import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Search, Sparkles, FileText, TrendingUp, AlertTriangle, 
  CheckCircle, Loader2, Wand2, RefreshCw, BarChart3, Globe,
  Target, Eye, ArrowRight, Download, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSEOKeywords, useSEOContentGenerator } from '@/hooks/useSEOKeywords';

interface ProductSEO {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
}

export default function SEOManager() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('products');

  const { stats: keywordStats } = useSEOKeywords();
  const { generateContent, isGenerating } = useSEOContentGenerator();

  // Fetch products with SEO data
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['seo-products', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name, description, category, seo_title, seo_description')
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        seo_keywords: [] as string[],
      })) as ProductSEO[];
    }
  });

  // Calculate SEO score from available data
  const calculateSEOScore = (product: ProductSEO): number => {
    let score = 0;
    if (product.seo_title && product.seo_title.length > 10) score += 25;
    if (product.seo_description && product.seo_description.length > 50) score += 25;
    if (product.seo_keywords && product.seo_keywords.length > 0) score += 25;
    if (product.description && product.description.length > 100) score += 25;
    return score;
  };

  // Calculate SEO stats
  const seoStats = {
    totalProducts: products.length,
    optimized: products.filter(p => calculateSEOScore(p) >= 70).length,
    needsWork: products.filter(p => calculateSEOScore(p) >= 40 && calculateSEOScore(p) < 70).length,
    critical: products.filter(p => calculateSEOScore(p) < 40).length,
    avgScore: products.length > 0 
      ? Math.round(products.reduce((sum, p) => sum + calculateSEOScore(p), 0) / products.length)
      : 0
  };

  // Generate SEO for single product
  const generateSEOMutation = useMutation({
    mutationFn: async (productId: string) => {
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');

      const generated = await generateContent(product.name || 'Produit', 'product');
      if (!generated) throw new Error('Failed to generate content');

      // Update product with SEO data
      const { error: updateError } = await supabase
        .from('products')
        .update({
          seo_title: generated.title.substring(0, 60),
          seo_description: generated.metaDescription.substring(0, 160),
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      return generated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-products'] });
      toast.success('SEO généré avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Bulk generate SEO
  const bulkGenerateSEO = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Sélectionnez des produits');
      return;
    }

    setIsProcessing(true);
    setBulkProgress(0);

    let completed = 0;
    for (const productId of selectedProducts) {
      try {
        await generateSEOMutation.mutateAsync(productId);
        completed++;
        setBulkProgress(Math.round((completed / selectedProducts.length) * 100));
      } catch (error) {
        console.error(`Error processing ${productId}:`, error);
      }
    }

    setIsProcessing(false);
    setSelectedProducts([]);
    toast.success(`${completed}/${selectedProducts.length} produits optimisés`);
  };

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all products
  const selectAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  // Get score badge variant
  const getScoreBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Bon ({score}%)</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Moyen ({score}%)</Badge>;
    return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Critique ({score}%)</Badge>;
  };

  // SEO Tools navigation cards
  const seoTools = [
    {
      title: 'Recherche de mots-clés',
      description: 'Trouvez les meilleurs mots-clés pour votre secteur',
      icon: Search,
      path: '/marketing/seo/keywords',
      color: 'bg-blue-500/10 text-blue-500'
    },
    {
      title: 'Suivi des positions',
      description: 'Suivez vos positions dans Google',
      icon: TrendingUp,
      path: '/marketing/seo/rank-tracker',
      color: 'bg-green-500/10 text-green-500'
    },
    {
      title: 'Générateur Schema.org',
      description: 'Créez des données structurées',
      icon: FileText,
      path: '/marketing/seo/schema',
      color: 'bg-purple-500/10 text-purple-500'
    },
    {
      title: 'Outils SEO avancés',
      description: 'Générateur de contenu et audit',
      icon: Sparkles,
      path: '/marketing/seo/tools',
      color: 'bg-orange-500/10 text-orange-500'
    }
  ];

  return (
    <>
      <Helmet>
        <title>SEO Manager - ShopOpti</title>
        <meta name="description" content="Optimisez le SEO de vos produits avec l'IA" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              SEO Manager
            </h1>
            <p className="text-muted-foreground">Optimisez le référencement de vos produits avec l'IA</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['seo-products'] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button 
              onClick={bulkGenerateSEO}
              disabled={selectedProducts.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Optimiser ({selectedProducts.length})
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{seoStats.totalProducts}</p>
                  <p className="text-sm text-muted-foreground">Total Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-500">{seoStats.optimized}</p>
                  <p className="text-sm text-muted-foreground">Optimisés (≥70%)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{seoStats.needsWork}</p>
                  <p className="text-sm text-muted-foreground">À améliorer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-500">{seoStats.critical}</p>
                  <p className="text-sm text-muted-foreground">Critiques (&lt;40%)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{seoStats.avgScore}%</p>
                  <p className="text-sm text-muted-foreground">Score Moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Progress */}
        {isProcessing && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Optimisation en cours...</span>
                  <span>{bulkProgress}%</span>
                </div>
                <Progress value={bulkProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEO Tools Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Outils SEO
            </CardTitle>
            <CardDescription>Accédez rapidement à tous les outils SEO</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {seoTools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <div
                    key={tool.path}
                    onClick={() => navigate(tool.path)}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-all duration-200 hover:shadow-md group"
                  >
                    <div className={`w-10 h-10 rounded-lg ${tool.color} flex items-center justify-center mb-3`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      {tool.title}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Keywords Stats */}
        {keywordStats.total > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Mots-clés Suivis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-accent/30">
                  <p className="text-2xl font-bold">{keywordStats.total}</p>
                  <p className="text-sm text-muted-foreground">Total suivis</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-accent/30">
                  <p className="text-2xl font-bold">{keywordStats.avgPosition || '-'}</p>
                  <p className="text-sm text-muted-foreground">Position moyenne</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-accent/30">
                  <p className="text-2xl font-bold text-green-500">{keywordStats.top10}</p>
                  <p className="text-sm text-muted-foreground">Top 10</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-accent/30">
                  <p className="text-2xl font-bold text-blue-500">{keywordStats.improving}</p>
                  <p className="text-sm text-muted-foreground">En progression</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/marketing/seo/rank-tracker')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir le suivi complet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Produits</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onCheckedChange={selectAllProducts}
                      />
                    </TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Meta Title</TableHead>
                    <TableHead>Meta Description</TableHead>
                    <TableHead>Score SEO</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium truncate max-w-[200px]">
                          {product.name || 'Produit sans nom'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {product.category || 'Non catégorisé'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[200px] text-sm">
                          {product.seo_title || (
                            <span className="text-muted-foreground italic">Non défini</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[200px] text-sm">
                          {product.seo_description ? (
                            `${product.seo_description.substring(0, 50)}...`
                          ) : (
                            <span className="text-muted-foreground italic">Non défini</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getScoreBadge(calculateSEOScore(product))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => generateSEOMutation.mutate(product.id)}
                          disabled={generateSEOMutation.isPending}
                        >
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {products.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun produit trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
