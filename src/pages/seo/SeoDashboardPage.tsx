/**
 * Sprint 8: SEO Dashboard Page
 * Integrates SeoScoringEngine with live product data
 */
import { Helmet } from 'react-helmet-async';
import { useSeoDashboard, type ProductSeoScore } from '@/hooks/useSeoDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import SeoGradeDistribution from '@/components/seo/SeoGradeDistribution';
import SeoTopIssues from '@/components/seo/SeoTopIssues';
import SeoProductTable from '@/components/seo/SeoProductTable';
import {
  Search, TrendingUp, AlertTriangle, CheckCircle2,
  BarChart3, Target
} from 'lucide-react';

const gradeColors: Record<string, string> = {
  A: 'bg-primary/10 text-primary border-primary',
  B: 'bg-primary/5 text-primary/80 border-primary/60',
  C: 'bg-accent/10 text-accent-foreground border-accent',
  D: 'bg-destructive/10 text-destructive border-destructive/60',
  F: 'bg-destructive/20 text-destructive border-destructive',
};

export default function SeoDashboardPage() {
  const { isLoading, products, stats, totalProducts } = useSeoDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const avgScore = stats?.avg_score ?? 0;
  const optimized = products.filter(p => p.result.status === 'optimized').length;
  const needsWork = products.filter(p => p.result.status === 'needs_work').length;
  const critical = products.filter(p => p.result.status === 'critical').length;
  const totalIssues = products.reduce((s, p) => s + p.result.issues.length, 0);

  return (
    <>
      <Helmet>
        <title>SEO Dashboard | ShopOpti</title>
        <meta name="description" content="Analysez et optimisez le SEO de votre catalogue produit" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            SEO Dashboard
          </h1>
          <p className="text-muted-foreground">
            Analyse en temps réel de {totalProducts} produit{totalProducts > 1 ? 's' : ''}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Score moyen</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{avgScore}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <Progress value={avgScore} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Optimisés</span>
              </div>
              <span className="text-3xl font-bold">{optimized}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {totalProducts > 0 ? Math.round((optimized / totalProducts) * 100) : 0}% du catalogue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-accent-foreground" />
                <span className="text-xs text-muted-foreground">À améliorer</span>
              </div>
              <span className="text-3xl font-bold">{needsWork}</span>
              <p className="text-xs text-muted-foreground mt-1">Score 50-79</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Critiques</span>
              </div>
              <span className="text-3xl font-bold">{critical}</span>
              <p className="text-xs text-muted-foreground mt-1">{totalIssues} problèmes détectés</p>
            </CardContent>
          </Card>
        </div>

        {/* Distribution + Issues */}
        <div className="grid md:grid-cols-2 gap-4">
          <SeoGradeDistribution byGrade={stats?.by_grade ?? {}} total={totalProducts} />
          <SeoTopIssues topIssues={stats?.top_issues ?? []} />
        </div>

        {/* Product Table */}
        <SeoProductTable products={products} />
      </div>
    </>
  );
}
