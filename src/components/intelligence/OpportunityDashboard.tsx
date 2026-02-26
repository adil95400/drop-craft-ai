/**
 * P2-3: Dashboard de détection d'opportunités produit
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, TrendingUp, Target, Zap, Search, Check, X,
  RefreshCw, DollarSign, BarChart3
} from 'lucide-react';
import { useProductOpportunities } from '@/hooks/useProductOpportunities';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { motion } from 'framer-motion';

const typeConfig: Record<string, { label: string; icon: typeof Sparkles; color: string }> = {
  high_margin: { label: 'Forte marge', icon: DollarSign, color: 'text-primary' },
  trending: { label: 'Tendance', icon: TrendingUp, color: 'text-amber-500' },
  low_competition: { label: 'Faible concurrence', icon: Target, color: 'text-primary' },
  seasonal: { label: 'Saisonnier', icon: Zap, color: 'text-destructive' },
  bundle: { label: 'Bundle', icon: BarChart3, color: 'text-violet-500' },
  upsell: { label: 'Upsell', icon: Sparkles, color: 'text-primary' },
};

const competitionColors: Record<string, string> = {
  low: 'text-primary',
  medium: 'text-amber-500',
  high: 'text-orange-500',
  very_high: 'text-destructive',
};

export function OpportunityDashboard() {
  const { opportunities, stats, isLoading, scanOpportunities, updateStatus, isScanning } = useProductOpportunities();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Opportunités', value: stats.total, icon: Sparkles, color: 'text-primary' },
          { title: 'Forte marge', value: stats.highMargin, icon: DollarSign, color: 'text-primary' },
          { title: 'En tendance', value: stats.trending, icon: TrendingUp, color: 'text-amber-500' },
          { title: 'Score moyen', value: stats.avgScore, icon: Target, color: 'text-primary' },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.title}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className={`h-8 w-8 ${s.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Opportunités détectées</h2>
        <Button onClick={() => scanOpportunities()} disabled={isScanning}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Analyse...' : 'Scanner maintenant'}
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Chargement...</CardContent></Card>
        ) : opportunities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Aucune opportunité détectée</h3>
              <p className="text-muted-foreground mb-4">Lancez un scan pour analyser votre catalogue</p>
              <Button onClick={() => scanOpportunities()} disabled={isScanning}>
                <Sparkles className="h-4 w-4 mr-2" />
                Lancer l'analyse
              </Button>
            </CardContent>
          </Card>
        ) : (
          opportunities.map((opp, idx) => {
            const config = typeConfig[opp.opportunity_type] || typeConfig.high_margin;
            const TypeIcon = config.icon;

            return (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <TypeIcon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{config.label}</Badge>
                            <Badge variant="secondary">Score: {opp.opportunity_score.toFixed(0)}</Badge>
                            {opp.estimated_margin && (
                              <Badge variant="outline" className="gap-1">
                                Marge: {opp.estimated_margin.toFixed(1)}%
                              </Badge>
                            )}
                            {opp.competition_level && (
                              <span className={`text-xs ${competitionColors[opp.competition_level]}`}>
                                Concurrence: {opp.competition_level}
                              </span>
                            )}
                          </div>
                          {opp.reasoning && (
                            <p className="text-sm text-muted-foreground mt-1">{opp.reasoning}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {opp.estimated_demand && <span>Demande: ~{opp.estimated_demand}/mois</span>}
                            <span>{formatDistanceToNow(new Date(opp.created_at), { addSuffix: true, locale: getDateFnsLocale() })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => updateStatus({ id: opp.id, status: 'accepted' })}>
                          <Check className="h-4 w-4 text-primary" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus({ id: opp.id, status: 'rejected' })}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
