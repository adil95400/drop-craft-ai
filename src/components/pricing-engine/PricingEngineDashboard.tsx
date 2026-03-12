/**
 * Dashboard du moteur de règles Pricing - Enhanced v2
 * Tabs: Règles | Simulateur | Historique | Jobs
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calculator, Plus, Play, Trash2, DollarSign,
  Percent, ArrowUpRight, Target, Layers, Sparkles,
  History, Zap, Clock, CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';
import { usePricingRules } from '@/hooks/usePricingRules';
import { CreatePricingEngineRuleDialog } from './CreatePricingEngineRuleDialog';
import { PricingSimulator } from './PricingSimulator';
import { formatDistanceToNow, format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';
import { motion } from 'framer-motion';

const ruleTypeConfig: Record<string, { label: string; icon: typeof Percent; color: string }> = {
  margin: { label: 'Marge cible', icon: Target, color: 'text-emerald-500' },
  markup: { label: 'Markup', icon: ArrowUpRight, color: 'text-primary' },
  fixed: { label: 'Montant fixe', icon: DollarSign, color: 'text-amber-500' },
  competitive: { label: 'Compétitif', icon: Sparkles, color: 'text-violet-500' },
};

const jobStatusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: 'En attente', icon: Clock, color: 'text-muted-foreground' },
  processing: { label: 'En cours', icon: RefreshCw, color: 'text-primary' },
  completed: { label: 'Terminé', icon: CheckCircle2, color: 'text-emerald-500' },
  failed: { label: 'Échoué', icon: XCircle, color: 'text-destructive' },
};

export function PricingEngineDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const {
    rules, priceHistory, repricingJobs, stats, isLoading,
    updateRule, deleteRule, applyRule, applyAllRules, isApplying
  } = usePricingRules();
  const locale = useDateFnsLocale();

  const statCards = [
    { title: 'Règles totales', value: stats.totalRules, icon: Layers, color: 'text-primary' },
    { title: 'Règles actives', value: stats.activeRules, icon: Calculator, color: 'text-emerald-500' },
    { title: 'Changements récents', value: stats.recentChanges, icon: ArrowUpRight, color: 'text-amber-500' },
    { title: 'Jobs en cours', value: stats.activeJobs, icon: Play, color: 'text-violet-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Règles</TabsTrigger>
          <TabsTrigger value="simulator" className="gap-1">
            <Calculator className="h-4 w-4" />
            Simulateur
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1">
            <History className="h-4 w-4" />
            Historique
            {priceHistory.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                {priceHistory.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-1">
            <Zap className="h-4 w-4" />
            Jobs
            {stats.activeJobs > 0 && (
              <Badge className="ml-1 text-xs h-5 px-1.5 bg-primary">
                {stats.activeJobs}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══ RULES TAB ═══ */}
        <TabsContent value="rules" className="space-y-3">
          <div className="flex items-center justify-between">
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle règle
            </Button>
            {stats.activeRules > 0 && (
              <Button
                variant="outline"
                onClick={() => confirm('Appliquer toutes les règles actives ?') && applyAllRules()}
                disabled={isApplying}
              >
                <Zap className="h-4 w-4 mr-2" />
                Appliquer tout ({stats.activeRules})
              </Button>
            )}
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Chargement...
              </CardContent>
            </Card>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Aucune règle de pricing</h3>
                <p className="text-muted-foreground mb-4">
                  Créez des règles pour ajuster automatiquement vos prix
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer
                </Button>
              </CardContent>
            </Card>
          ) : (
            rules.map((rule, idx) => {
              const typeConfig = ruleTypeConfig[rule.rule_type] || ruleTypeConfig.markup;
              const TypeIcon = typeConfig.icon;

              return (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className={!rule.is_active ? 'opacity-60' : ''}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(checked) =>
                              updateRule({ id: rule.id, is_active: checked })
                            }
                          />
                          <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{rule.name}</h3>
                              <Badge variant="outline" className="text-xs">{typeConfig.label}</Badge>
                              <Badge variant="secondary" className="text-xs">P{rule.priority}</Badge>
                              {rule.rounding_strategy && rule.rounding_strategy !== 'none' && (
                                <Badge variant="outline" className="text-xs">
                                  Arrondi: {rule.rounding_strategy.replace('nearest_', 'x.')}
                                </Badge>
                              )}
                            </div>
                            {rule.description && (
                              <p className="text-sm text-muted-foreground">{rule.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span>{rule.products_affected} produits</span>
                              <span>{rule.execution_count} exécutions</span>
                              {rule.target_margin && (
                                <span>Marge cible: {rule.target_margin}%</span>
                              )}
                              {rule.margin_protection > 0 && (
                                <span>Protection: {rule.margin_protection}%</span>
                              )}
                              {rule.last_executed_at && (
                                <span>
                                  Dernière exec: {formatDistanceToNow(new Date(rule.last_executed_at), { addSuffix: true, locale })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => applyRule({ rule_id: rule.id, apply_to_all: true })}
                            disabled={!rule.is_active || isApplying}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Appliquer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => confirm('Supprimer cette règle ?') && deleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </TabsContent>

        {/* ═══ SIMULATOR TAB ═══ */}
        <TabsContent value="simulator">
          <PricingSimulator rules={rules} />
        </TabsContent>

        {/* ═══ HISTORY TAB ═══ */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Historique des changements de prix
              </CardTitle>
              <CardDescription>
                Les {priceHistory.length} derniers ajustements de prix
              </CardDescription>
            </CardHeader>
            <CardContent>
              {priceHistory.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Aucun changement de prix enregistré</p>
                  <p className="text-xs mt-1">Les modifications apparaîtront ici après l'application d'une règle</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {priceHistory.map((entry: any, idx: number) => {
                      const oldPrice = entry.old_price ?? 0;
                      const newPrice = entry.new_price ?? 0;
                      const diff = newPrice - oldPrice;
                      const diffPercent = oldPrice > 0 ? ((diff / oldPrice) * 100) : 0;

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${diff >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                              <ArrowUpRight className={`h-4 w-4 ${diff >= 0 ? 'text-emerald-500' : 'text-destructive rotate-90'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {entry.product_id?.substring(0, 8)}...
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.rule_name || entry.change_reason || 'Règle appliquée'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">{oldPrice.toFixed(2)}€</span>
                              <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                              <span className="font-bold">{newPrice.toFixed(2)}€</span>
                            </div>
                            <p className={`text-xs ${diff >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                              {diff >= 0 ? '+' : ''}{diff.toFixed(2)}€ ({diffPercent.toFixed(1)}%)
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground ml-4">
                            {entry.created_at && formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ JOBS TAB ═══ */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Jobs de repricing
              </CardTitle>
              <CardDescription>
                Suivi des exécutions de règles en cours et terminées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {repricingJobs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Zap className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Aucun job de repricing</p>
                  <p className="text-xs mt-1">Appliquez une règle pour lancer un job</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {repricingJobs.map((job: any, idx: number) => {
                      const statusConf = jobStatusConfig[job.status] || jobStatusConfig.pending;
                      const StatusIcon = statusConf.icon;

                      return (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <StatusIcon className={`h-5 w-5 ${statusConf.color} ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                            <div>
                              <p className="text-sm font-medium">
                                {job.target_type === 'rule' ? 'Application de règle' : 'Repricing'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {job.target_id?.substring(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}
                            >
                              {statusConf.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {job.created_at && formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreatePricingEngineRuleDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
