/**
 * Page d'audit catalogue - Vue transversale des résultats d'audit
 * Affiche tous les produits triés par score audit
 */

import { useNavigate } from 'react-router-dom';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { useProductsAudit } from '@/hooks/useProductAuditEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet-async';
import { Target, AlertCircle, CheckCircle, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductAuditPage() {
  const navigate = useNavigate();
  const { products, isLoading } = useUnifiedProducts();
  const { auditResults, stats } = useProductsAudit(products);

  // Trier les produits par score (du plus faible au plus élevé)
  const sortedResults = [...auditResults].sort((a, b) => a.score.global - b.score.global);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'destructive' | 'secondary' => {
    if (score >= 70) return 'default';
    if (score >= 40) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Audit Catalogue - Qualité Produits</title>
        <meta name="description" content="Vue d'ensemble de la qualité de votre catalogue produits" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Audit Catalogue</h1>
          <p className="text-muted-foreground mt-2">
            Tous les produits triés par score de qualité
          </p>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score moyen</p>
                  <p className={cn("text-3xl font-bold", getScoreColor(stats.averageScore))}>
                    {stats.averageScore}/100
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Excellents</p>
                  <p className="text-3xl font-bold text-green-600">{stats.excellentCount}</p>
                  <p className="text-xs text-muted-foreground">
                    Score &gt; 70
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">À améliorer</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.goodCount}</p>
                  <p className="text-xs text-muted-foreground">
                    Score 40-70
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critiques</p>
                  <p className="text-3xl font-bold text-red-600">{stats.poorCount}</p>
                  <p className="text-xs text-muted-foreground">
                    Score &lt; 40
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des produits audités */}
        <Card>
          <CardHeader>
            <CardTitle>Tous les produits ({sortedResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedResults.map((result) => (
                <div
                  key={result.productId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/products/${result.productId}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant={getScoreBadgeVariant(result.score.global)}>
                        {result.score.global}/100
                      </Badge>
                      <h3 className="font-medium">{result.productName}</h3>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>SEO: {result.score.seo}/100</span>
                      <span>Contenu: {result.score.content}/100</span>
                      <span>Images: {result.score.images}/100</span>
                      <span>Data: {result.score.dataCompleteness}/100</span>
                      <span>AI: {result.score.aiReadiness}/100</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {result.issues.length} issue{result.issues.length > 1 ? 's' : ''}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {sortedResults.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Aucun produit à auditer
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
