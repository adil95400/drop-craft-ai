/**
 * Dashboard de consommation pour les utilisateurs
 * Vue complète avec quotas, historique et alertes
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  Download, 
  Sparkles, 
  Store, 
  Truck, 
  Workflow, 
  HardDrive,
  Crown,
  TrendingUp,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import { useUnifiedQuotas, QuotaKey } from '@/hooks/useUnifiedQuotas';
import { useMonetization } from '@/hooks/useMonetization';
import { useNavigate } from 'react-router-dom';
import { CreditPurchaseCard } from './CreditPurchaseCard';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const QUOTA_ICONS: Record<QuotaKey, React.ReactNode> = {
  products: <Package className="h-5 w-5 text-blue-500" />,
  imports_monthly: <Download className="h-5 w-5 text-green-500" />,
  ai_generations: <Sparkles className="h-5 w-5 text-purple-500" />,
  stores: <Store className="h-5 w-5 text-orange-500" />,
  suppliers: <Truck className="h-5 w-5 text-cyan-500" />,
  workflows: <Workflow className="h-5 w-5 text-pink-500" />,
  storage_mb: <HardDrive className="h-5 w-5 text-gray-500" />,
  seo_audits: <BarChart3 className="h-5 w-5 text-indigo-500" />,
  seo_generations: <Sparkles className="h-5 w-5 text-violet-500" />,
  seo_applies: <TrendingUp className="h-5 w-5 text-emerald-500" />,
  seo_category_audits: <BarChart3 className="h-5 w-5 text-indigo-400" />,
  seo_site_audits: <BarChart3 className="h-5 w-5 text-indigo-600" />,
  seo_languages: <Sparkles className="h-5 w-5 text-teal-500" />,
  seo_bulk_limit: <Package className="h-5 w-5 text-amber-500" />,
  seo_history_days: <TrendingUp className="h-5 w-5 text-slate-500" />,
};

const PLAN_LABELS: Record<string, { label: string; color: string; badge: string }> = {
  free: { label: 'Gratuit', color: 'bg-gray-500', badge: 'secondary' },
  standard: { label: 'Standard', color: 'bg-blue-500', badge: 'default' },
  pro: { label: 'Pro', color: 'bg-purple-500', badge: 'default' },
  ultra_pro: { label: 'Ultra Pro', color: 'bg-gradient-to-r from-amber-500 to-orange-500', badge: 'default' },
};

interface QuotaCardProps {
  quotaKey: QuotaKey;
  label: string;
  current: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
}

function QuotaCard({ quotaKey, label, current, limit, percentage, isUnlimited }: QuotaCardProps) {
  const icon = QUOTA_ICONS[quotaKey];
  const isNearLimit = percentage >= 80;
  const isExhausted = percentage >= 100;

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      isExhausted && 'border-red-500 bg-red-50/50 dark:bg-red-950/20',
      isNearLimit && !isExhausted && 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
          </div>
          {isExhausted && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Épuisé
            </Badge>
          )}
          {isNearLimit && !isExhausted && (
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Bas
            </Badge>
          )}
          {isUnlimited && (
            <Badge variant="secondary" className="text-xs">
              ∞ Illimité
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">{current.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">
              / {isUnlimited ? '∞' : limit.toLocaleString()}
            </span>
          </div>
          {!isUnlimited && (
            <Progress 
              value={percentage} 
              className={cn(
                'h-2',
                isExhausted && '[&>div]:bg-red-500',
                isNearLimit && !isExhausted && '[&>div]:bg-yellow-500'
              )} 
            />
          )}
          <div className="text-xs text-muted-foreground">
            {isUnlimited ? 'Utilisation illimitée' : `${Math.round(limit - current)} restants`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserConsumptionDashboard() {
  const navigate = useNavigate();
  const { currentPlan, getAllQuotas, isLoading: quotasLoading } = useUnifiedQuotas();
  const { history, isLoading: monetizationLoading } = useMonetization();
  
  const quotas = getAllQuotas();
  const planInfo = PLAN_LABELS[currentPlan] || PLAN_LABELS.free;
  const isLoading = quotasLoading || monetizationLoading;

  const stats = history ? {
    by_day: history.by_day,
    by_source: history.by_source as Record<string, number>,
    by_quota_key: {} as Record<string, { total_actions: number; total_tokens: number }>,
  } : null;

  // Check for near-limit quotas
  const nearLimitQuotas = quotas.filter(q => !q.isUnlimited && q.percentage >= 80);
  const exhaustedQuotas = quotas.filter(q => !q.isUnlimited && q.percentage >= 100);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-amber-500" />
                Mon Abonnement
                <Badge className={cn(planInfo.color, 'text-white')}>
                  {planInfo.label}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2">
                Suivez votre consommation en temps réel
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {currentPlan !== 'ultra_pro' && (
                <Button onClick={() => navigate('/dashboard/subscription')}>
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Passer au plan supérieur
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {(nearLimitQuotas.length > 0 || exhaustedQuotas.length > 0) && (
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {exhaustedQuotas.map(q => (
                <Badge key={q.key} variant="destructive">
                  {q.label}: Quota épuisé
                </Badge>
              ))}
              {nearLimitQuotas.filter(q => !exhaustedQuotas.includes(q)).map(q => (
                <Badge key={q.key} variant="outline" className="text-yellow-600 border-yellow-500">
                  {q.label}: {Math.round(100 - q.percentage)}% restant
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="quotas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="quotas">
            <BarChart3 className="h-4 w-4 mr-2" />
            Quotas
          </TabsTrigger>
          <TabsTrigger value="history">
            <Calendar className="h-4 w-4 mr-2" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="sources">
            <TrendingUp className="h-4 w-4 mr-2" />
            Sources
          </TabsTrigger>
        </TabsList>

        {/* Quotas Tab */}
        <TabsContent value="quotas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quotas.map((quota) => (
              <QuotaCard
                key={quota.key}
                quotaKey={quota.key}
                label={quota.label}
                current={quota.current}
                limit={quota.limit}
                percentage={quota.percentage}
                isUnlimited={quota.isUnlimited}
              />
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consommation sur 30 jours</CardTitle>
              <CardDescription>
                Évolution de votre utilisation par jour
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.by_day && stats.by_day.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.by_day}>
                      <defs>
                        <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: fr })}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{format(new Date(data.date), 'PPP', { locale: fr })}</p>
                                <p className="text-sm text-muted-foreground">Actions: {data.actions}</p>
                                <p className="text-sm text-muted-foreground">Tokens: {data.tokens}</p>
                                <p className="text-sm text-muted-foreground">Coût: ${data.cost.toFixed(4)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="actions"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorActions)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune donnée de consommation</p>
                    <p className="text-sm">Commencez à utiliser l'application pour voir l'historique</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Par source</CardTitle>
                <CardDescription>Répartition de la consommation par source</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.by_source && Object.keys(stats.by_source).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.by_source).map(([source, count]) => {
                      const total = Object.values(stats.by_source).reduce((a: number, b: number) => a + b, 0);
                      const percentage = ((count as number) / total) * 100;
                      const labels: Record<string, string> = {
                        web: 'Application Web',
                        api: 'API',
                        chrome_extension: 'Extension Chrome',
                        automation: 'Automatisation',
                      };
                      return (
                        <div key={source} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{labels[source] || source}</span>
                            <span className="font-medium">{count as number} actions</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Par type de quota</CardTitle>
                <CardDescription>Consommation par ressource</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.by_quota_key && Object.keys(stats.by_quota_key).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.by_quota_key).map(([key, data]) => {
                      const d = data as { total_actions: number; total_tokens: number };
                      return (
                      <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {QUOTA_ICONS[key as QuotaKey]}
                          <span className="text-sm font-medium">{key}</span>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">{d.total_actions} actions</div>
                          <div className="text-muted-foreground text-xs">
                            {d.total_tokens} tokens
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Credit Purchase Card - Upsell */}
      <CreditPurchaseCard />

      {/* Upsell Plan Card */}
      {nearLimitQuotas.length > 0 && currentPlan !== 'ultra_pro' && (
        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Augmentez vos limites</h4>
                  <p className="text-sm text-muted-foreground">
                    {nearLimitQuotas.length} quota(s) proche(s) de la limite. Passez au plan supérieur pour plus de ressources.
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/dashboard/subscription')}>
                Voir les plans
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
