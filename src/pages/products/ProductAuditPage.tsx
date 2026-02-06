/**
 * Page d'audit catalogue - Style Channable Premium
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { useProductsAudit } from '@/hooks/useProductAuditEngine';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, AlertCircle, CheckCircle, TrendingUp, ArrowRight, Loader2,
  Sparkles, RefreshCw, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  color = 'primary'
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  subtext?: string;
  color?: string;
}) => {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    green: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600',
    orange: 'from-amber-500/20 to-amber-500/5 text-amber-600',
    red: 'from-red-500/20 to-red-500/5 text-red-600',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} opacity-50`} />
        <CardContent className="relative p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
              {subtext && (
                <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
              )}
            </div>
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} flex items-center justify-center`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function ProductAuditPage() {
  const navigate = useNavigate();
  const { products, isLoading, refetch } = useUnifiedProducts();
  const { auditResults, stats } = useProductsAudit(products);

  const sortedResults = [...auditResults].sort((a, b) => a.score.global - b.score.global);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'destructive' | 'secondary' => {
    if (score >= 70) return 'default';
    if (score >= 40) return 'secondary';
    return 'destructive';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Analyse du catalogue en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <ChannablePageWrapper
      title="Audit Catalogue"
      subtitle="Qualité produits"
      description="Vue d'ensemble de la qualité de votre catalogue avec scores détaillés et recommandations"
      heroImage="analytics"
      badge={{ label: 'Quality', icon: Target }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Rapport
          </Button>
        </div>
      }
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.productAudit} />
      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Target} 
          label="Score moyen" 
          value={`${stats.averageScore}/100`}
          color={stats.averageScore >= 70 ? 'green' : stats.averageScore >= 40 ? 'orange' : 'red'}
        />
        <StatCard 
          icon={CheckCircle} 
          label="Excellents" 
          value={stats.excellentCount}
          subtext="Score > 70"
          color="green"
        />
        <StatCard 
          icon={TrendingUp} 
          label="À améliorer" 
          value={stats.goodCount}
          subtext="Score 40-70"
          color="orange"
        />
        <StatCard 
          icon={AlertCircle} 
          label="Critiques" 
          value={stats.poorCount}
          subtext="Score < 40"
          color="red"
        />
      </div>

      {/* Score Distribution */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Distribution des scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-3xl font-bold text-emerald-600 mb-1">
                {Math.round((stats.excellentCount / (products.length || 1)) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Excellents</p>
              <Progress value={(stats.excellentCount / (products.length || 1)) * 100} className="h-2 mt-2" />
            </div>
            <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {Math.round((stats.goodCount / (products.length || 1)) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">À améliorer</p>
              <Progress value={(stats.goodCount / (products.length || 1)) * 100} className="h-2 mt-2" />
            </div>
            <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {Math.round((stats.poorCount / (products.length || 1)) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Critiques</p>
              <Progress value={(stats.poorCount / (products.length || 1)) * 100} className="h-2 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits audités */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Tous les produits ({sortedResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedResults.map((result, index) => (
              <motion.div
                key={result.productId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:bg-accent/50 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/products/${result.productId}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={getScoreBadgeVariant(result.score.global)} className="font-bold">
                      {result.score.global}/100
                    </Badge>
                    <h3 className="font-medium truncate">{result.productName}</h3>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full", getScoreBarColor(result.score.seo))} />
                      SEO: {result.score.seo}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full", getScoreBarColor(result.score.content))} />
                      Contenu: {result.score.content}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full", getScoreBarColor(result.score.images))} />
                      Images: {result.score.images}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full", getScoreBarColor(result.score.dataCompleteness))} />
                      Data: {result.score.dataCompleteness}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {result.issues.length > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {result.issues.length} issue{result.issues.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}

            {sortedResults.length === 0 && (
              <div className="text-center py-16">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Aucun produit à auditer</p>
                <p className="text-muted-foreground">Ajoutez des produits pour voir leur score qualité</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  );
}
