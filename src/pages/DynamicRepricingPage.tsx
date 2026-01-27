import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { ChannableModal, ChannableFormField } from '@/components/channable/ChannableModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRepricingRules, useRepricingHistory, useRepricingDashboard } from '@/hooks/useRepricingRules';
import { TrendingUp, Target, Zap, DollarSign, Plus, Play, Pause, Edit2, Trash2, History, ArrowUpDown, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { RepricingRule } from '@/types/marketplace-repricing';

export default function DynamicRepricingPage() {
  const { 
    rules, 
    isLoading: isLoadingRules, 
    createRule, 
    toggleRule, 
    deleteRule, 
    executeRule,
    isCreating,
    isExecuting 
  } = useRepricingRules();
  
  const { data: history = [], isLoading: isLoadingHistory } = useRepricingHistory(20);
  const { data: dashboard, isLoading: isLoadingDashboard } = useRepricingDashboard();
  
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({ 
    name: '', 
    strategy: 'competitive' as RepricingRule['strategy'], 
    minMargin: 15, 
    maxDiscount: 20 
  });

  const handleToggleRule = (ruleId: string, currentStatus: boolean) => {
    toggleRule({ ruleId, isActive: !currentStatus });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      deleteRule(ruleId);
    }
  };

  const handleCreateRule = () => {
    if (!newRule.name) return;
    
    createRule({
      name: newRule.name,
      strategy: newRule.strategy,
      min_margin_percent: newRule.minMargin,
      max_discount_percent: newRule.maxDiscount,
      target_margin_percent: 25,
      rounding_strategy: 'nearest_99',
      competitor_analysis_enabled: true,
      update_frequency_minutes: 60,
      is_active: false
    });
    
    setShowCreateRuleModal(false);
    setNewRule({ name: '', strategy: 'competitive', minMargin: 15, maxDiscount: 20 });
  };

  const strategyLabels: Record<string, string> = {
    beat_competition: 'Battre la concurrence',
    match_competition: 'Aligner sur concurrence',
    competitive: 'Compétitif',
    margin_based: 'Basé sur marge',
    buybox: 'Buy Box',
    dynamic: 'Dynamique IA'
  };

  return (
    <>
      <Helmet>
        <title>Repricing Dynamique - ShopOpti</title>
        <meta name="description" content="Optimisez vos prix automatiquement avec notre moteur de repricing intelligent" />
      </Helmet>

      <ChannablePageWrapper
        title="Repricing Dynamique"
        subtitle="Automatisation des prix"
        description="Optimisez vos prix automatiquement en fonction de la concurrence et des marges"
        heroImage="automation"
        badge={{ label: 'Repricing IA', icon: TrendingUp }}
      >
        <div className="space-y-6">

        {/* KPIs Dashboard */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Règles Actives</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{dashboard?.active_rules || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Automatisation en cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits Monitorés</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{dashboard?.products_monitored || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Surveillance continue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repricing Aujourd'hui</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{dashboard?.repricing_executions_today || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Modifications automatiques
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impact Marge</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {(dashboard?.avg_margin_change || 0) > 0 ? '+' : ''}{(dashboard?.avg_margin_change || 0).toFixed(2)}%
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Changement moyen
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rules">Règles de repricing</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="buybox">Performance Buy Box</TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Règles de Repricing</CardTitle>
                  <CardDescription>Configurez vos stratégies de prix automatiques</CardDescription>
                </div>
                <Button onClick={() => setShowCreateRuleModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle règle
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingRules ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : rules.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Aucune règle configurée</p>
                    <p className="text-sm">Créez votre première règle de repricing pour commencer l'automatisation.</p>
                    <Button className="mt-4" onClick={() => setShowCreateRuleModal(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer une règle
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${rule.is_active ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                            {rule.is_active ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium">{rule.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{strategyLabels[rule.strategy] || rule.strategy}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {rule.execution_count || 0} produits • Marge min: {rule.min_margin_percent}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <p className="font-medium">{rule.execution_count || 0} exécutions</p>
                            <p className="text-muted-foreground">
                              {rule.last_executed_at 
                                ? `Dernière: ${new Date(rule.last_executed_at).toLocaleDateString()}`
                                : 'Jamais exécutée'
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleToggleRule(rule.id, rule.is_active)}
                              title={rule.is_active ? 'Mettre en pause' : 'Activer'}
                            >
                              {rule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => executeRule(rule.id)}
                              disabled={isExecuting}
                              title="Exécuter maintenant"
                            >
                              {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" title="Modifier">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteRule(rule.id)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historique des Exécutions
                  </CardTitle>
                  <CardDescription>Toutes les modifications de prix</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    Filtrer
                  </Button>
                  <Button variant="outline" size="sm">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Trier
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun historique de repricing disponible</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Ancien Prix</TableHead>
                        <TableHead>Nouveau Prix</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead>Marge</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-muted-foreground">
                            {new Date(entry.date).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">{entry.product}</TableCell>
                          <TableCell className="line-through text-muted-foreground">
                            {entry.oldPrice?.toFixed(2)}€
                          </TableCell>
                          <TableCell className="font-bold text-primary">
                            {entry.newPrice?.toFixed(2)}€
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.reason}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={entry.margin >= 20 ? 'default' : 'secondary'}>
                              {entry.margin?.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Changements Récents</CardTitle>
                <CardDescription>Dernières modifications de prix automatiques</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDashboard ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : !dashboard?.recent_changes || dashboard.recent_changes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun changement récent
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboard.recent_changes.map((change, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div>
                          <p className="font-medium">{change.product_name}</p>
                          <p className="text-sm text-muted-foreground">{change.marketplace}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="line-through text-muted-foreground">{change.old_price}€</span>
                            <span className="font-bold text-primary">{change.new_price}€</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Marge: {change.margin_impact > 0 ? '+' : ''}{change.margin_impact.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buybox">
            <Card>
              <CardHeader>
                <CardTitle>Performance Buy Box</CardTitle>
                <CardDescription>Votre position sur chaque marketplace</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDashboard ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : !dashboard?.buybox_performance || dashboard.buybox_performance.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune donnée Buy Box disponible
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboard.buybox_performance.map((perf, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-4 mb-4 last:border-0">
                        <div>
                          <p className="font-medium">{perf.marketplace}</p>
                          <p className="text-sm text-muted-foreground">
                            Position moyenne: {perf.avg_position.toFixed(1)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{perf.buybox_win_rate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">
                            {perf.products_in_buybox} produits en Buy Box
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </ChannablePageWrapper>

      {/* Create Rule Modal - Channable Design */}
      <ChannableModal
        open={showCreateRuleModal}
        onOpenChange={setShowCreateRuleModal}
        title="Nouvelle Règle de Repricing"
        description="Configurez une stratégie de prix automatique pour maximiser vos marges"
        icon={Zap}
        variant="premium"
        size="lg"
        onSubmit={handleCreateRule}
        submitLabel="Créer la règle"
        isSubmitting={isCreating}
        submitDisabled={!newRule.name}
      >
        <div className="space-y-4">
          <ChannableFormField label="Nom de la règle" required>
            <Input
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              placeholder="Ex: Battre Amazon -5%"
              className="bg-background"
            />
          </ChannableFormField>

          <ChannableFormField label="Stratégie de repricing">
            <Select 
              value={newRule.strategy} 
              onValueChange={(value: RepricingRule['strategy']) => setNewRule({ ...newRule, strategy: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-popover">
                <SelectItem value="competitive">🎯 Compétitif</SelectItem>
                <SelectItem value="buybox">🏆 Buy Box</SelectItem>
                <SelectItem value="margin_based">💰 Basé sur marge</SelectItem>
                <SelectItem value="dynamic">🤖 Dynamique IA</SelectItem>
              </SelectContent>
            </Select>
          </ChannableFormField>

          <div className="grid grid-cols-2 gap-4">
            <ChannableFormField label="Marge minimum (%)" hint="Seuil de rentabilité">
              <Input
                type="number"
                value={newRule.minMargin}
                onChange={(e) => setNewRule({ ...newRule, minMargin: Number(e.target.value) })}
                className="bg-background"
              />
            </ChannableFormField>

            <ChannableFormField label="Remise maximum (%)" hint="Limite de réduction">
              <Input
                type="number"
                value={newRule.maxDiscount}
                onChange={(e) => setNewRule({ ...newRule, maxDiscount: Number(e.target.value) })}
                className="bg-background"
              />
            </ChannableFormField>
          </div>
        </div>
      </ChannableModal>
    </>
  );
}
