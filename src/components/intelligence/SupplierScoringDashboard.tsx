/**
 * P2-2: Dashboard de scoring fournisseur avancé
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Shield, Truck, Award, DollarSign, MessageSquare, RefreshCw } from 'lucide-react';
import { useSupplierScores } from '@/hooks/useSupplierScores';
import { motion } from 'framer-motion';

const recommendationConfig: Record<string, { label: string; color: string }> = {
  preferred: { label: 'Préféré', color: 'bg-primary text-primary-foreground' },
  recommended: { label: 'Recommandé', color: 'bg-primary/80 text-primary-foreground' },
  neutral: { label: 'Neutre', color: 'bg-secondary text-secondary-foreground' },
  caution: { label: 'Attention', color: 'bg-amber-500 text-white' },
  avoid: { label: 'À éviter', color: 'bg-destructive text-destructive-foreground' },
};

function ScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: typeof Star }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{score.toFixed(0)}%</span>
        </div>
        <Progress value={score} className="h-1.5" />
      </div>
    </div>
  );
}

export function SupplierScoringDashboard() {
  const { scores, isLoading, evaluateSupplier, isEvaluating } = useSupplierScores();

  const avgScore = scores.length
    ? Math.round(scores.reduce((s, sc) => s + sc.overall_score, 0) / scores.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Fournisseurs évalués', value: scores.length, icon: Shield },
          { title: 'Score moyen', value: `${avgScore}%`, icon: Star },
          { title: 'Préférés', value: scores.filter(s => s.recommendation === 'preferred').length, icon: Award },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.title}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className="h-8 w-8 text-primary opacity-70" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Chargement...</CardContent></Card>
        ) : scores.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Aucun fournisseur évalué</h3>
              <p className="text-muted-foreground">Les scores sont calculés automatiquement lors des analyses</p>
            </CardContent>
          </Card>
        ) : (
          scores.map((score, idx) => {
            const rec = recommendationConfig[score.recommendation] || recommendationConfig.neutral;
            return (
              <motion.div key={score.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <Card>
                  <CardContent className="py-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-lg font-bold">{score.overall_score.toFixed(0)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{score.supplier_id?.slice(0, 12)}...</span>
                            <Badge className={rec.color}>{rec.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {score.total_orders} commandes • {score.total_issues} problèmes
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => evaluateSupplier(score.supplier_id)} disabled={isEvaluating}>
                        <RefreshCw className={`h-3 w-3 mr-1 ${isEvaluating ? 'animate-spin' : ''}`} />
                        Réévaluer
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <ScoreBar label="Fiabilité" score={score.reliability_score} icon={Shield} />
                      <ScoreBar label="Livraison" score={score.delivery_score} icon={Truck} />
                      <ScoreBar label="Qualité" score={score.quality_score} icon={Award} />
                      <ScoreBar label="Prix" score={score.price_score} icon={DollarSign} />
                      <ScoreBar label="Communication" score={score.communication_score} icon={MessageSquare} />
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
