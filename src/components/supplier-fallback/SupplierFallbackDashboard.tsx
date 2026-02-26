/**
 * P1-2: Dashboard de gestion du fallback fournisseur
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Shield, ShieldAlert, ArrowRightLeft, Plus, Play,
  Trash2, Zap, PackageX, TrendingDown, RefreshCw
} from 'lucide-react';
import { useSupplierFallback } from '@/hooks/useSupplierFallback';
import { CreateFallbackRuleDialog } from './CreateFallbackRuleDialog';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { motion } from 'framer-motion';

const triggerLabels: Record<string, { label: string; icon: typeof PackageX; color: string }> = {
  out_of_stock: { label: 'Rupture de stock', icon: PackageX, color: 'text-destructive' },
  low_stock: { label: 'Stock bas', icon: ShieldAlert, color: 'text-amber-500' },
  price_increase: { label: 'Hausse de prix', icon: TrendingDown, color: 'text-orange-500' },
};

export function SupplierFallbackDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { rules, isLoading, deleteRule, runFallbackCheck, isChecking, updateRule } = useSupplierFallback();

  const activeRules = rules.filter(r => r.is_active);
  const totalSwitches = rules.reduce((acc, r) => acc + (r.switch_count || 0), 0);

  const statCards = [
    {
      title: 'Règles actives',
      value: activeRules.length,
      total: rules.length,
      icon: Shield,
      color: 'text-primary',
    },
    {
      title: 'Basculements effectués',
      value: totalSwitches,
      icon: ArrowRightLeft,
      color: 'text-amber-500',
    },
    {
      title: 'Auto-switch activé',
      value: rules.filter(r => r.auto_switch && r.is_active).length,
      icon: Zap,
      color: 'text-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <p className="text-2xl font-bold mt-1">
                      {stat.value}
                      {'total' in stat && <span className="text-sm font-normal text-muted-foreground"> / {stat.total}</span>}
                    </p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
        <Button variant="outline" onClick={() => runFallbackCheck()} disabled={isChecking}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Évaluation...' : 'Vérifier maintenant'}
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Chargement des règles...
            </CardContent>
          </Card>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Aucune règle de fallback</h3>
              <p className="text-muted-foreground mb-4">
                Configurez des règles pour basculer automatiquement vers un fournisseur alternatif
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une règle
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule, idx) => {
            const trigger = triggerLabels[rule.trigger_condition] || triggerLabels.out_of_stock;
            const TriggerIcon = trigger.icon;

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
                            updateRule({ id: rule.id, updates: { is_active: checked } })
                          }
                        />
                        <div className="flex items-center gap-2">
                          <TriggerIcon className={`h-5 w-5 ${trigger.color}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{trigger.label}</Badge>
                              {rule.auto_switch && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Zap className="h-3 w-3" /> Auto
                                </Badge>
                              )}
                              {rule.notify_on_switch && (
                                <Badge variant="outline" className="text-xs">Notifie</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{(rule.fallback_suppliers as any[])?.length || 0} fournisseur(s) alternatif(s)</span>
                              <span>{rule.switch_count || 0} basculement(s)</span>
                              {rule.last_switch_at && (
                                <span>Dernier : {formatDistanceToNow(new Date(rule.last_switch_at), { addSuffix: true, locale: getDateFnsLocale() })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => confirm('Supprimer cette règle ?') && deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      <CreateFallbackRuleDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
