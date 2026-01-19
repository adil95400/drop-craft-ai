import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDynamicRepricing } from '@/hooks/useMarketplacePhase2';
import { TrendingUp, Target, Zap, DollarSign, Plus, Play, Pause, Edit2, Trash2, History, ArrowUpDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthOptimized } from '@/shared';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RepricingRule {
  id: string;
  name: string;
  strategy: 'beat_competition' | 'match_competition' | 'margin_based' | 'dynamic';
  minMargin: number;
  maxDiscount: number;
  products: number;
  status: 'active' | 'paused';
  lastRun: string;
  priceChanges: number;
}

interface HistoryEntry {
  id: string;
  date: string;
  product: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  rule: string;
  margin: number;
}

export default function DynamicRepricingPage() {
  const { toast } = useToast();
  const { user } = useAuthOptimized();
  const { dashboard, isLoadingDashboard, executeRepricing, isRepricingExecuting } = useDynamicRepricing(user?.id || '');
  
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', strategy: 'beat_competition', minMargin: 15, maxDiscount: 20 });
  
  // Mock rules data
  const [rules, setRules] = useState<RepricingRule[]>([
    { id: '1', name: 'Battre Amazon -5%', strategy: 'beat_competition', minMargin: 15, maxDiscount: 10, products: 156, status: 'active', lastRun: '2h', priceChanges: 23 },
    { id: '2', name: 'Marge optimale 25%', strategy: 'margin_based', minMargin: 25, maxDiscount: 5, products: 89, status: 'active', lastRun: '1h', priceChanges: 12 },
    { id: '3', name: 'Prix dynamique IA', strategy: 'dynamic', minMargin: 20, maxDiscount: 15, products: 234, status: 'paused', lastRun: '1j', priceChanges: 0 },
  ]);

  // Mock history data
  const [history] = useState<HistoryEntry[]>([
    { id: '1', date: '2024-01-15 14:32', product: 'iPhone 15 Case', oldPrice: 29.99, newPrice: 27.99, reason: 'Concurrence -5%', rule: 'Battre Amazon -5%', margin: 18 },
    { id: '2', date: '2024-01-15 14:30', product: 'USB-C Cable Pro', oldPrice: 19.99, newPrice: 18.49, reason: 'Marge optimisée', rule: 'Marge optimale 25%', margin: 25 },
    { id: '3', date: '2024-01-15 14:28', product: 'Wireless Charger', oldPrice: 34.99, newPrice: 32.99, reason: 'Concurrence -5%', rule: 'Battre Amazon -5%', margin: 22 },
    { id: '4', date: '2024-01-15 13:45', product: 'Screen Protector Pack', oldPrice: 12.99, newPrice: 11.99, reason: 'Demande faible', rule: 'Prix dynamique IA', margin: 28 },
    { id: '5', date: '2024-01-15 13:20', product: 'Laptop Stand', oldPrice: 49.99, newPrice: 47.99, reason: 'Concurrence -5%', rule: 'Battre Amazon -5%', margin: 19 },
  ]);

  const handleToggleRule = (ruleId: string) => {
    setRules(rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, status: rule.status === 'active' ? 'paused' : 'active' }
        : rule
    ));
    toast({ title: "Statut de la règle modifié" });
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId));
    toast({ title: "Règle supprimée", variant: "destructive" });
  };

  const handleCreateRule = () => {
    if (!newRule.name) {
      toast({ title: "Nom requis", variant: "destructive" });
      return;
    }
    const rule: RepricingRule = {
      id: Date.now().toString(),
      name: newRule.name,
      strategy: newRule.strategy as RepricingRule['strategy'],
      minMargin: newRule.minMargin,
      maxDiscount: newRule.maxDiscount,
      products: 0,
      status: 'paused',
      lastRun: '-',
      priceChanges: 0
    };
    setRules([...rules, rule]);
    setShowCreateRuleModal(false);
    setNewRule({ name: '', strategy: 'beat_competition', minMargin: 15, maxDiscount: 20 });
    toast({ title: "Règle créée", description: "Activez-la pour commencer le repricing" });
  };

  const strategyLabels: Record<string, string> = {
    beat_competition: 'Battre la concurrence',
    match_competition: 'Aligner sur concurrence',
    margin_based: 'Basé sur marge',
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
        {dashboard && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Règles Actives</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rules.filter(r => r.status === 'active').length}</div>
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
                <div className="text-2xl font-bold">{dashboard.products_monitored}</div>
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
                <div className="text-2xl font-bold">{dashboard.repricing_executions_today}</div>
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
                <div className="text-2xl font-bold">
                  {dashboard.avg_margin_change > 0 ? '+' : ''}{dashboard.avg_margin_change.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Changement moyen
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="rules">Règles de repricing</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="buybox">Performance Buy Box</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Changements Récents</CardTitle>
                <CardDescription>Dernières modifications de prix automatiques</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDashboard ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : dashboard?.recent_changes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun changement récent
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboard?.recent_changes.map((change, idx) => (
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
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${rule.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                          {rule.status === 'active' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{strategyLabels[rule.strategy]}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {rule.products} produits • Marge min: {rule.minMargin}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="font-medium">{rule.priceChanges} changements</p>
                          <p className="text-muted-foreground">Dernière exec: {rule.lastRun}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleRule(rule.id)}
                          >
                            {rule.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {rules.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune règle configurée. Créez votre première règle de repricing.
                    </div>
                  )}
                </div>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Ancien Prix</TableHead>
                      <TableHead>Nouveau Prix</TableHead>
                      <TableHead>Raison</TableHead>
                      <TableHead>Règle</TableHead>
                      <TableHead>Marge</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-muted-foreground">{entry.date}</TableCell>
                        <TableCell className="font-medium">{entry.product}</TableCell>
                        <TableCell className="line-through text-muted-foreground">{entry.oldPrice.toFixed(2)}€</TableCell>
                        <TableCell className="font-bold text-primary">{entry.newPrice.toFixed(2)}€</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.reason}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{entry.rule}</TableCell>
                        <TableCell>
                          <Badge variant={entry.margin >= 20 ? 'default' : 'secondary'}>
                            {entry.margin}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                {dashboard?.buybox_performance.map((perf, idx) => (
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </ChannablePageWrapper>

      {/* Create Rule Modal */}
      <Dialog open={showCreateRuleModal} onOpenChange={setShowCreateRuleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle règle de repricing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la règle</Label>
              <Input 
                placeholder="Ex: Battre Amazon -5%"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Stratégie</Label>
              <Select value={newRule.strategy} onValueChange={(v) => setNewRule({ ...newRule, strategy: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beat_competition">Battre la concurrence</SelectItem>
                  <SelectItem value="match_competition">Aligner sur concurrence</SelectItem>
                  <SelectItem value="margin_based">Basé sur marge</SelectItem>
                  <SelectItem value="dynamic">Dynamique IA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marge minimum (%)</Label>
                <Input 
                  type="number"
                  value={newRule.minMargin}
                  onChange={(e) => setNewRule({ ...newRule, minMargin: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Réduction max (%)</Label>
                <Input 
                  type="number"
                  value={newRule.maxDiscount}
                  onChange={(e) => setNewRule({ ...newRule, maxDiscount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRuleModal(false)}>Annuler</Button>
            <Button onClick={handleCreateRule}>Créer la règle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
