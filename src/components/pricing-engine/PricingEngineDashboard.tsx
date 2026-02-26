/**
 * P1-3: Dashboard du moteur de règles Pricing
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator, Plus, Play, Trash2, DollarSign,
  Percent, ArrowUpRight, Target, Layers, Sparkles
} from 'lucide-react';
import { usePricingRules } from '@/hooks/usePricingRules';
import { CreatePricingEngineRuleDialog } from './CreatePricingEngineRuleDialog';
import { PricingSimulator } from './PricingSimulator';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';
import { motion } from 'framer-motion';

const ruleTypeConfig: Record<string, { label: string; icon: typeof Percent; color: string }> = {
  margin: { label: 'Marge cible', icon: Target, color: 'text-emerald-500' },
  markup: { label: 'Markup', icon: ArrowUpRight, color: 'text-primary' },
  fixed: { label: 'Montant fixe', icon: DollarSign, color: 'text-amber-500' },
  competitive: { label: 'Compétitif', icon: Sparkles, color: 'text-violet-500' },
};

export function PricingEngineDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { rules, stats, isLoading, updateRule, deleteRule, applyRule, isApplying } = usePricingRules();
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
        </TabsList>

        <TabsContent value="rules" className="space-y-3">
          <div className="flex items-center justify-between">
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle règle
            </Button>
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

        <TabsContent value="simulator">
          <PricingSimulator rules={rules} />
        </TabsContent>
      </Tabs>

      <CreatePricingEngineRuleDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
