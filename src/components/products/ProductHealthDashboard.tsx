/**
 * Product Health Dashboard - Vue consolidée santé produits avec score qualité
 * Métriques avancées, alertes et optimisations suggérées
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown,
  Package, Image, FileText, DollarSign, Tag, Layers, Search, Filter,
  Zap, Eye, RefreshCw, BarChart3, PieChart, Target, Shield, Clock,
  ArrowUpRight, ArrowDownRight, Sparkles, AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ProductHealth {
  id: string;
  title: string;
  image?: string;
  healthScore: number;
  issues: ProductIssue[];
  metrics: {
    hasImages: boolean;
    hasDescription: boolean;
    hasPrice: boolean;
    hasVariants: boolean;
    hasSEO: boolean;
    imageCount: number;
    descriptionLength: number;
  };
  status: 'healthy' | 'warning' | 'critical';
}

interface ProductIssue {
  type: 'missing_image' | 'short_description' | 'no_price' | 'no_variants' | 'missing_seo' | 'low_quality_image';
  severity: 'low' | 'medium' | 'high';
  message: string;
  fixable: boolean;
}

interface HealthStats {
  totalProducts: number;
  healthyProducts: number;
  warningProducts: number;
  criticalProducts: number;
  averageScore: number;
  commonIssues: { type: string; count: number }[];
}

export function ProductHealthDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');

  // Fetch products and calculate health
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['product-health', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase
        .from('products') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      return (data || []).map(product => {
        const issues: ProductIssue[] = [];
        
        // Check for issues
        const hasImages = (product.image_urls?.length || 0) > 0;
        const imageCount = product.image_urls?.length || 0;
        const hasDescription = (product.description?.length || 0) > 50;
        const descriptionLength = product.description?.length || 0;
        const hasPrice = (product.price || 0) > 0;
        const hasVariants = false; // Not available in catalog_products
        const hasSEO = !!product.description && product.description.length > 100;

        if (!hasImages) {
          issues.push({ type: 'missing_image', severity: 'high', message: 'Aucune image produit', fixable: false });
        } else if (imageCount < 3) {
          issues.push({ type: 'low_quality_image', severity: 'low', message: 'Moins de 3 images', fixable: false });
        }

        if (!hasDescription) {
          issues.push({ type: 'short_description', severity: 'medium', message: 'Description courte (<50 chars)', fixable: true });
        }

        if (!hasPrice) {
          issues.push({ type: 'no_price', severity: 'high', message: 'Prix non défini', fixable: false });
        }

        if (!hasSEO) {
          issues.push({ type: 'missing_seo', severity: 'medium', message: 'SEO non optimisé', fixable: true });
        }

        // Calculate health score (0-100)
        let score = 100;
        issues.forEach(issue => {
          if (issue.severity === 'high') score -= 25;
          else if (issue.severity === 'medium') score -= 15;
          else score -= 5;
        });
        score = Math.max(0, score);

        const status: ProductHealth['status'] = 
          score >= 80 ? 'healthy' : 
          score >= 50 ? 'warning' : 'critical';

        return {
          id: product.id,
          title: product.title,
          image: product.image_urls?.[0],
          healthScore: score,
          issues,
          metrics: {
            hasImages,
            hasDescription,
            hasPrice,
            hasVariants,
            hasSEO,
            imageCount,
            descriptionLength
          },
          status
        } as ProductHealth;
      });
    },
    enabled: !!user,
  });

  // Calculate stats
  const stats: HealthStats = useMemo(() => {
    const healthyProducts = products.filter(p => p.status === 'healthy').length;
    const warningProducts = products.filter(p => p.status === 'warning').length;
    const criticalProducts = products.filter(p => p.status === 'critical').length;
    const averageScore = products.length > 0 
      ? Math.round(products.reduce((sum, p) => sum + p.healthScore, 0) / products.length)
      : 0;

    // Count issues
    const issueMap = new Map<string, number>();
    products.forEach(p => {
      p.issues.forEach(issue => {
        issueMap.set(issue.type, (issueMap.get(issue.type) || 0) + 1);
      });
    });

    const commonIssues = Array.from(issueMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalProducts: products.length,
      healthyProducts,
      warningProducts,
      criticalProducts,
      averageScore,
      commonIssues
    };
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterStatus !== 'all' && p.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [products, searchQuery, filterStatus]);

  const getIssueLabel = (type: string) => {
    const labels: Record<string, string> = {
      missing_image: 'Images manquantes',
      short_description: 'Description courte',
      no_price: 'Prix manquant',
      no_variants: 'Sans variantes',
      missing_seo: 'SEO manquant',
      low_quality_image: 'Peu d\'images'
    };
    return labels[type] || type;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center",
                stats.averageScore >= 80 ? "bg-green-500/10" : 
                stats.averageScore >= 50 ? "bg-yellow-500/10" : "bg-red-500/10"
              )}>
                <Activity className={cn(
                  "h-6 w-6",
                  getScoreColor(stats.averageScore)
                )} />
              </div>
              <div>
                <p className={cn("text-3xl font-bold", getScoreColor(stats.averageScore))}>
                  {stats.averageScore}%
                </p>
                <p className="text-xs text-muted-foreground">Score moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.healthyProducts}</p>
                <p className="text-xs text-muted-foreground">Sains</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.warningProducts}</p>
                <p className="text-xs text-muted-foreground">Attention</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.criticalProducts}</p>
                <p className="text-xs text-muted-foreground">Critiques</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Common Issues */}
      {stats.commonIssues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Problèmes les plus fréquents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.commonIssues.map(issue => (
                <Badge 
                  key={issue.type} 
                  variant="outline" 
                  className="px-3 py-1"
                >
                  {getIssueLabel(issue.type)}
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-muted text-xs font-bold">
                    {issue.count}
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'healthy', 'warning', 'critical'] as const).map(status => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    filterStatus === status && status === 'healthy' && "bg-green-500 hover:bg-green-600",
                    filterStatus === status && status === 'warning' && "bg-yellow-500 hover:bg-yellow-600",
                    filterStatus === status && status === 'critical' && "bg-red-500 hover:bg-red-600"
                  )}
                >
                  {status === 'all' && 'Tous'}
                  {status === 'healthy' && 'Sains'}
                  {status === 'warning' && 'Attention'}
                  {status === 'critical' && 'Critiques'}
                </Button>
              ))}
            </div>
            <Badge variant="secondary">{filteredProducts.length} produits</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par produit</CardTitle>
          <CardDescription>Cliquez sur un produit pour voir les détails et corrections</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                    <div className="h-14 w-14 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 bg-muted rounded" />
                      <div className="h-3 w-1/3 bg-muted rounded" />
                    </div>
                  </div>
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Aucun produit trouvé</p>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className={cn(
                      "flex items-center gap-4 p-4 border rounded-lg transition-all hover:shadow-md cursor-pointer",
                      product.status === 'healthy' && "border-l-4 border-l-green-500",
                      product.status === 'warning' && "border-l-4 border-l-yellow-500",
                      product.status === 'critical' && "border-l-4 border-l-red-500"
                    )}
                  >
                    {/* Image */}
                    <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0">
                      {product.image ? (
                        <img src={product.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.issues.slice(0, 3).map((issue, i) => (
                          <Badge 
                            key={i}
                            variant="outline"
                            className={cn(
                              "text-xs",
                              issue.severity === 'high' && "bg-red-500/10 text-red-600 border-red-500/20",
                              issue.severity === 'medium' && "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                              issue.severity === 'low' && "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            )}
                          >
                            {issue.message}
                          </Badge>
                        ))}
                        {product.issues.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{product.issues.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <div className={cn("text-2xl font-bold", getScoreColor(product.healthScore))}>
                        {product.healthScore}%
                      </div>
                      <div className="w-16 h-1.5 rounded-full bg-muted mt-1">
                        <div 
                          className={cn("h-full rounded-full transition-all", getScoreBg(product.healthScore))}
                          style={{ width: `${product.healthScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 shrink-0">
                      {product.issues.some(i => i.fixable) && (
                        <Button size="sm" variant="outline">
                          <Sparkles className="h-4 w-4 mr-1" />
                          Auto-fix
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
