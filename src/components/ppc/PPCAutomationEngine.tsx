/**
 * PPC Automation Engine - Advanced bid management, budget optimization, campaign rules
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Zap, Plus, Play, Pause, Settings, TrendingUp, TrendingDown,
  DollarSign, Target, BarChart3, ArrowUpRight, ArrowDownRight,
  AlertTriangle, CheckCircle2, Clock, RefreshCw, Shield, Brain,
  Sparkles, Activity, Eye, MousePointerClick, ShoppingCart
} from 'lucide-react';

interface AutoRule {
  id: string;
  name: string;
  platform: string;
  type: 'bid' | 'budget' | 'status' | 'schedule';
  condition: { metric: string; operator: string; value: number };
  action: { type: string; value: number | string };
  isActive: boolean;
  executionCount: number;
  lastTriggered?: string;
}

interface BidStrategy {
  id: string;
  name: string;
  description: string;
  icon: any;
  targetMetric: string;
  isAI: boolean;
}

const BID_STRATEGIES: BidStrategy[] = [
  { id: 'target-roas', name: 'ROAS cible', description: 'Optimise les enchères pour atteindre un ROAS défini', icon: Target, targetMetric: 'ROAS', isAI: true },
  { id: 'target-cpa', name: 'CPA cible', description: 'Minimise le coût par acquisition', icon: DollarSign, targetMetric: 'CPA', isAI: true },
  { id: 'max-clicks', name: 'Maximiser les clics', description: 'Obtenir le plus de clics dans le budget', icon: MousePointerClick, targetMetric: 'Clicks', isAI: false },
  { id: 'max-conversions', name: 'Maximiser les conversions', description: 'IA optimise pour les conversions', icon: ShoppingCart, targetMetric: 'Conversions', isAI: true },
  { id: 'impression-share', name: 'Part d\'impression cible', description: 'Maintenir une visibilité cible', icon: Eye, targetMetric: 'IS%', isAI: false },
  { id: 'dayparting', name: 'Dayparting intelligent', description: 'Ajuste les enchères selon l\'heure', icon: Clock, targetMetric: 'Time', isAI: true },
];

const MOCK_RULES: AutoRule[] = [
  {
    id: '1', name: 'Pause mots-clés non rentables', platform: 'google', type: 'status',
    condition: { metric: 'cost', operator: '>', value: 50 },
    action: { type: 'pause', value: 'keyword' },
    isActive: true, executionCount: 23, lastTriggered: '2h ago',
  },
  {
    id: '2', name: 'Augmenter budget si ROAS > 3', platform: 'meta', type: 'budget',
    condition: { metric: 'roas', operator: '>', value: 3 },
    action: { type: 'increase_budget', value: 20 },
    isActive: true, executionCount: 8, lastTriggered: '1d ago',
  },
  {
    id: '3', name: 'Réduire enchères CPC élevé', platform: 'google', type: 'bid',
    condition: { metric: 'cpc', operator: '>', value: 2.5 },
    action: { type: 'decrease_bid', value: 15 },
    isActive: false, executionCount: 45, lastTriggered: '3d ago',
  },
];

const METRICS = [
  { key: 'spend', label: 'Dépenses', value: '€12,450', change: '+8%', positive: false, icon: DollarSign },
  { key: 'roas', label: 'ROAS moyen', value: '3.2x', change: '+12%', positive: true, icon: TrendingUp },
  { key: 'cpa', label: 'CPA moyen', value: '€18.40', change: '-5%', positive: true, icon: Target },
  { key: 'conversions', label: 'Conversions', value: '678', change: '+15%', positive: true, icon: ShoppingCart },
  { key: 'ctr', label: 'CTR moyen', value: '3.8%', change: '+0.5%', positive: true, icon: MousePointerClick },
  { key: 'impressions', label: 'Impressions', value: '1.2M', change: '+22%', positive: true, icon: Eye },
];

export function PPCAutomationEngine() {
  const [rules, setRules] = useState(MOCK_RULES);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [targetValue, setTargetValue] = useState(300);

  const [newRule, setNewRule] = useState({
    name: '', platform: 'google', type: 'bid' as const,
    metric: 'cost', operator: '>', value: 0,
    actionType: 'decrease_bid', actionValue: 10,
  });

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    toast.success('Règle mise à jour');
  };

  const createRule = () => {
    const rule: AutoRule = {
      id: crypto.randomUUID(),
      name: newRule.name,
      platform: newRule.platform,
      type: newRule.type,
      condition: { metric: newRule.metric, operator: newRule.operator, value: newRule.value },
      action: { type: newRule.actionType, value: newRule.actionValue },
      isActive: true,
      executionCount: 0,
    };
    setRules(prev => [rule, ...prev]);
    setShowCreateRule(false);
    toast.success('Règle d\'automatisation créée');
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {METRICS.map(m => {
          const Icon = m.icon;
          return (
            <Card key={m.key}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {m.positive ? (
                    <Badge variant="secondary" className="text-[10px] text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400">{m.change}</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400">{m.change}</Badge>
                  )}
                </div>
                <p className="text-lg font-bold">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="rules" className="gap-2"><Zap className="h-4 w-4" />Règles auto</TabsTrigger>
          <TabsTrigger value="strategies" className="gap-2"><Brain className="h-4 w-4" />Stratégies IA</TabsTrigger>
          <TabsTrigger value="optimization" className="gap-2"><Sparkles className="h-4 w-4" />Optimisation</TabsTrigger>
        </TabsList>

        {/* Tab: Rules */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Règles d'automatisation PPC</h3>
              <p className="text-sm text-muted-foreground">{rules.filter(r => r.isActive).length} règles actives</p>
            </div>
            <Button onClick={() => setShowCreateRule(true)}><Plus className="h-4 w-4 mr-2" /> Nouvelle règle</Button>
          </div>

          <div className="space-y-3">
            {rules.map(rule => (
              <Card key={rule.id} className={cn(!rule.isActive && 'opacity-60')}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{rule.name}</p>
                      <Badge variant="outline" className="text-[10px]">{rule.platform}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{rule.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Si <code className="bg-muted px-1 rounded">{rule.condition.metric}</code> {rule.condition.operator} {rule.condition.value}
                      → <code className="bg-muted px-1 rounded">{rule.action.type}</code> ({typeof rule.action.value === 'number' ? `${rule.action.value}%` : rule.action.value})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{rule.executionCount}x</p>
                    <p className="text-[10px] text-muted-foreground">{rule.lastTriggered || 'Jamais'}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Strategies */}
        <TabsContent value="strategies" className="space-y-4">
          <h3 className="text-lg font-semibold">Stratégies d'enchères intelligentes</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BID_STRATEGIES.map(strategy => {
              const Icon = strategy.icon;
              const isSelected = selectedStrategy === strategy.id;
              return (
                <Card
                  key={strategy.id}
                  className={cn('cursor-pointer transition-all hover:shadow-md', isSelected && 'ring-2 ring-primary')}
                  onClick={() => setSelectedStrategy(strategy.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      {strategy.isAI && <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px]">IA</Badge>}
                    </div>
                    <h4 className="font-semibold text-sm">{strategy.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{strategy.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">Métrique: {strategy.targetMetric}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedStrategy && (
            <Card className="border-primary">
              <CardContent className="p-4 space-y-4">
                <h4 className="font-semibold">Configuration : {BID_STRATEGIES.find(s => s.id === selectedStrategy)?.name}</h4>
                <div>
                  <Label>Valeur cible ({BID_STRATEGIES.find(s => s.id === selectedStrategy)?.targetMetric})</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider value={[targetValue]} onValueChange={v => setTargetValue(v[0])} max={1000} step={10} className="flex-1" />
                    <span className="text-sm font-mono w-16 text-right">{targetValue}%</span>
                  </div>
                </div>
                <Button className="gap-2">
                  <Play className="h-4 w-4" /> Activer la stratégie
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Optimization */}
        <TabsContent value="optimization" className="space-y-4">
          <h3 className="text-lg font-semibold">Recommandations d'optimisation IA</h3>
          <div className="space-y-3">
            {[
              { title: '5 mots-clés à haute dépense avec 0 conversion', impact: 'Économie: ~€340/mois', severity: 'high', action: 'Mettre en pause' },
              { title: 'Budget sous-utilisé sur la campagne "Produits été"', impact: 'Potentiel: +18% impressions', severity: 'medium', action: 'Augmenter budget' },
              { title: 'Heures creuses identifiées (22h-6h) avec CPA élevé', impact: 'Économie: ~€120/mois', severity: 'medium', action: 'Dayparting' },
              { title: 'Nouvelles extensions d\'annonces recommandées', impact: 'CTR estimé: +0.8%', severity: 'low', action: 'Ajouter extensions' },
              { title: 'Audiences similaires avec ROAS > 4x identifiées', impact: 'Revenue potentiel: +€2,100/mois', severity: 'high', action: 'Créer audiences' },
            ].map((rec, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                    rec.severity === 'high' ? 'bg-red-100 dark:bg-red-950' :
                    rec.severity === 'medium' ? 'bg-amber-100 dark:bg-amber-950' :
                    'bg-blue-100 dark:bg-blue-950'
                  )}>
                    {rec.severity === 'high' ? <AlertTriangle className="h-4 w-4 text-red-500" /> :
                     rec.severity === 'medium' ? <TrendingUp className="h-4 w-4 text-amber-500" /> :
                     <Sparkles className="h-4 w-4 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rec.title}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">{rec.impact}</p>
                  </div>
                  <Button size="sm" variant="outline">{rec.action}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      <Dialog open={showCreateRule} onOpenChange={setShowCreateRule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle règle d'automatisation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom</Label>
              <Input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Pause si CPA > 25€" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plateforme</Label>
                <Select value={newRule.platform} onValueChange={v => setNewRule(p => ({ ...p, platform: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="meta">Meta Ads</SelectItem>
                    <SelectItem value="tiktok">TikTok Ads</SelectItem>
                    <SelectItem value="amazon">Amazon PPC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newRule.type} onValueChange={v => setNewRule(p => ({ ...p, type: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bid">Enchère</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="status">Statut</SelectItem>
                    <SelectItem value="schedule">Planification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Métrique</Label>
                <Select value={newRule.metric} onValueChange={v => setNewRule(p => ({ ...p, metric: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cost">Coût</SelectItem>
                    <SelectItem value="cpc">CPC</SelectItem>
                    <SelectItem value="cpa">CPA</SelectItem>
                    <SelectItem value="roas">ROAS</SelectItem>
                    <SelectItem value="ctr">CTR</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="impressions">Impressions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Opérateur</Label>
                <Select value={newRule.operator} onValueChange={v => setNewRule(p => ({ ...p, operator: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">">Supérieur à</SelectItem>
                    <SelectItem value="<">Inférieur à</SelectItem>
                    <SelectItem value=">=">≥</SelectItem>
                    <SelectItem value="<=">≤</SelectItem>
                    <SelectItem value="=">Égal à</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valeur</Label>
                <Input type="number" value={newRule.value} onChange={e => setNewRule(p => ({ ...p, value: Number(e.target.value) }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Action</Label>
                <Select value={newRule.actionType} onValueChange={v => setNewRule(p => ({ ...p, actionType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="decrease_bid">Baisser enchère (%)</SelectItem>
                    <SelectItem value="increase_bid">Augmenter enchère (%)</SelectItem>
                    <SelectItem value="increase_budget">Augmenter budget (%)</SelectItem>
                    <SelectItem value="decrease_budget">Baisser budget (%)</SelectItem>
                    <SelectItem value="pause">Mettre en pause</SelectItem>
                    <SelectItem value="enable">Réactiver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valeur action (%)</Label>
                <Input type="number" value={newRule.actionValue} onChange={e => setNewRule(p => ({ ...p, actionValue: Number(e.target.value) }))} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRule(false)}>Annuler</Button>
            <Button onClick={createRule} disabled={!newRule.name}>Créer la règle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
