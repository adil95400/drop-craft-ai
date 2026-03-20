/**
 * AI Business Insights — BI avancé propulsé par l'IA
 * Analyse automatique des données, détection d'anomalies, prédictions
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Lightbulb, Target, DollarSign, Package, Users, ShieldAlert,
  RefreshCw, Loader2, Sparkles, ArrowUpRight, ArrowDownRight,
  BarChart3, Activity, Zap, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BIInsight {
  id: string;
  category: 'revenue' | 'inventory' | 'customers' | 'growth' | 'risk';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  metric_value?: number | null;
  metric_label?: string | null;
}

interface BIPrediction {
  metric: string;
  current_value: number;
  predicted_value: number;
  confidence: number;
  timeframe: string;
  trend: 'up' | 'down' | 'stable';
}

interface BIAnomaly {
  type: 'positive' | 'negative';
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface BIReport {
  summary: string;
  health_score: number;
  insights: BIInsight[];
  predictions: BIPrediction[];
  anomalies: BIAnomaly[];
  generated_at: string;
  data_summary: {
    orders_count: number;
    products_count: number;
    customers_count: number;
    total_revenue: number;
    recent_revenue: number;
    revenue_growth: string;
  };
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Brain; color: string; label: string }> = {
  revenue: { icon: DollarSign, color: 'text-success', label: 'Revenus' },
  inventory: { icon: Package, color: 'text-warning', label: 'Inventaire' },
  customers: { icon: Users, color: 'text-info', label: 'Clients' },
  growth: { icon: TrendingUp, color: 'text-purple-500', label: 'Croissance' },
  risk: { icon: ShieldAlert, color: 'text-destructive', label: 'Risque' },
};

const IMPACT_STYLES: Record<string, string> = {
  high: 'bg-red-500/10 text-destructive border-red-500/20',
  medium: 'bg-amber-500/10 text-warning border-amber-500/20',
  low: 'bg-blue-500/10 text-info border-blue-500/20',
};

export default function AIBusinessInsightsPage() {
  const { toast } = useToast();
  const [analysisType, setAnalysisType] = useState('general');

  const { data: report, isLoading, refetch, isFetching } = useQuery<BIReport>({
    queryKey: ['bi-insights', analysisType],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('bi-insights', {
        body: { analysisType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as BIReport;
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });

  const healthColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const healthBg = (score: number) => {
    if (score >= 80) return 'from-emerald-500/20 to-emerald-500/5';
    if (score >= 60) return 'from-amber-500/20 to-amber-500/5';
    return 'from-red-500/20 to-red-500/5';
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-success" />;
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  return (
    <>
      <Helmet>
        <title>Insights IA Business | ShopOpti</title>
        <meta name="description" content="Analyse IA de vos données business avec prédictions et recommandations actionnables" />
      </Helmet>

      <ChannablePageWrapper
        title="Insights IA Business"
        description="Analyse intelligente de vos données avec recommandations et prédictions"
        heroImage="analytics"
        badge={{ label: 'IA Avancée', icon: Brain }}
        actions={
          <Button
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isFetching ? 'Analyse en cours…' : 'Relancer l\'analyse'}
          </Button>
        }
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <Brain className="h-12 w-12 text-primary animate-pulse" />
              <Sparkles className="h-5 w-5 text-warning absolute -top-1 -right-1 animate-bounce" />
            </div>
            <p className="text-muted-foreground font-medium">L'IA analyse vos données business…</p>
            <p className="text-sm text-muted-foreground">Cela peut prendre quelques secondes</p>
          </div>
        ) : !report ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Lancez votre première analyse IA</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                L'IA analysera vos commandes, produits et clients pour générer des insights actionnables.
              </p>
              <Button onClick={() => refetch()}>
                <Sparkles className="h-4 w-4 mr-2" /> Démarrer l'analyse
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Health Score + Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={cn("bg-gradient-to-br", healthBg(report.health_score))}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Score de Santé</p>
                    <Activity className={cn("h-5 w-5", healthColor(report.health_score))} />
                  </div>
                  <div className={cn("text-4xl font-bold mb-2", healthColor(report.health_score))}>
                    {report.health_score}/100
                  </div>
                  <Progress value={report.health_score} className="h-2" />
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">Résumé Exécutif</p>
                      <p className="text-sm text-muted-foreground">{report.summary}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{report.data_summary.orders_count}</p>
                      <p className="text-xs text-muted-foreground">Commandes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{formatCurrency(report.data_summary.total_revenue)}</p>
                      <p className="text-xs text-muted-foreground">Revenu Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{report.data_summary.revenue_growth}%</p>
                      <p className="text-xs text-muted-foreground">Croissance 30j</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="insights" className="space-y-4">
              <TabsList>
                <TabsTrigger value="insights" className="flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4" /> Insights ({report.insights.length})
                </TabsTrigger>
                <TabsTrigger value="predictions" className="flex items-center gap-1.5">
                  <Target className="h-4 w-4" /> Prédictions ({report.predictions.length})
                </TabsTrigger>
                <TabsTrigger value="anomalies" className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Anomalies ({report.anomalies.length})
                </TabsTrigger>
              </TabsList>

              {/* Insights Tab */}
              <TabsContent value="insights">
                <div className="grid gap-4 md:grid-cols-2">
                  <AnimatePresence>
                    {report.insights.map((insight, i) => {
                      const cat = CATEGORY_CONFIG[insight.category] || CATEGORY_CONFIG.growth;
                      const Icon = cat.icon;
                      return (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                        >
                          <Card className="h-full hover:shadow-md transition-shadow">
                            <CardContent className="pt-5">
                              <div className="flex items-start gap-3 mb-3">
                                <div className={cn("p-2 rounded-lg bg-muted")}>
                                  <Icon className={cn("h-4 w-4", cat.color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                                    <Badge variant="outline" className={cn("text-[10px]", IMPACT_STYLES[insight.impact])}>
                                      {insight.impact === 'high' ? 'Critique' : insight.impact === 'medium' ? 'Important' : 'Info'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                                </div>
                              </div>
                              {insight.metric_value != null && (
                                <div className="flex items-center gap-2 mb-3 p-2 rounded bg-muted/50">
                                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{insight.metric_label}:</span>
                                  <span className="text-xs font-bold">{typeof insight.metric_value === 'number' && insight.metric_value > 100 ? formatCurrency(insight.metric_value) : insight.metric_value}</span>
                                </div>
                              )}
                              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                                <Zap className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-primary font-medium">{insight.action}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </TabsContent>

              {/* Predictions Tab */}
              <TabsContent value="predictions">
                <div className="grid gap-4 md:grid-cols-2">
                  {report.predictions.map((pred, i) => (
                    <motion.div
                      key={pred.metric}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card>
                        <CardContent className="pt-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm">{pred.metric}</h4>
                            <Badge variant="outline" className="text-[10px]">
                              {pred.timeframe}
                            </Badge>
                          </div>
                          <div className="flex items-end gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Actuel</p>
                              <p className="text-lg font-bold">{pred.current_value > 100 ? formatCurrency(pred.current_value) : pred.current_value}</p>
                            </div>
                            <TrendIcon trend={pred.trend} />
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Prédit</p>
                              <p className={cn("text-lg font-bold", pred.trend === 'up' ? 'text-success' : pred.trend === 'down' ? 'text-destructive' : '')}>
                                {pred.predicted_value > 100 ? formatCurrency(pred.predicted_value) : pred.predicted_value}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Confiance</span>
                              <span className="font-medium">{pred.confidence}%</span>
                            </div>
                            <Progress value={pred.confidence} className="h-1.5" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Anomalies Tab */}
              <TabsContent value="anomalies">
                {report.anomalies.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle2 className="h-10 w-10 mx-auto text-success mb-3" />
                      <p className="font-medium">Aucune anomalie détectée</p>
                      <p className="text-sm text-muted-foreground">Tout semble normal dans vos données</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {report.anomalies.map((anomaly, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <Card className={cn(
                          "border-l-4",
                          anomaly.type === 'positive' ? 'border-l-emerald-500' : 'border-l-red-500'
                        )}>
                          <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                              {anomaly.type === 'positive' 
                                ? <TrendingUp className="h-5 w-5 text-success" />
                                : <AlertTriangle className="h-5 w-5 text-destructive" />
                              }
                              <div className="flex-1">
                                <p className="text-sm font-medium">{anomaly.description}</p>
                              </div>
                              <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                                {anomaly.severity === 'high' ? 'Critique' : anomaly.severity === 'medium' ? 'Moyen' : 'Faible'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <p className="text-xs text-muted-foreground text-center">
              Analyse générée le {new Date(report.generated_at).toLocaleString('fr-FR')} — Basée sur {report.data_summary.orders_count} commandes, {report.data_summary.products_count} produits, {report.data_summary.customers_count} clients
            </p>
          </div>
        )}
      </ChannablePageWrapper>
    </>
  );
}
