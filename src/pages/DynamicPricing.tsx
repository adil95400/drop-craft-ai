import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChannableModal, ChannableFormField } from '@/components/channable/ChannableModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Target, 
  LineChart,
  Settings,
  Play,
  Plus,
  Loader2
} from 'lucide-react';
import { 
  useDynamicPricingRules, 
  useDynamicPricingStats, 
  useToggleDynamicRule,
  usePriceAdjustmentHistory,
  useDynamicPricingConfig,
  useUpdateDynamicPricingConfig,
  useCreateDynamicRule,
  useSimulateDynamicRule,
  type DynamicRuleType
} from '@/hooks/useDynamicPricingRules';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DynamicPricing() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<DynamicRuleType>('competitor');
  const [newRuleImpact, setNewRuleImpact] = useState(10);
  const [newRuleDescription, setNewRuleDescription] = useState('');

  const { data: rules = [], isLoading: rulesLoading } = useDynamicPricingRules();
  const { data: stats } = useDynamicPricingStats();
  const { data: history = [], isLoading: historyLoading } = usePriceAdjustmentHistory(20);
  const { data: config } = useDynamicPricingConfig();
  
  const toggleRule = useToggleDynamicRule();
  const updateConfig = useUpdateDynamicPricingConfig();
  const createRule = useCreateDynamicRule();
  const simulateRule = useSimulateDynamicRule();

  const [localConfig, setLocalConfig] = useState<{
    min_margin_percent: number;
    max_margin_percent: number;
    adjustment_frequency_hours: number;
    notifications_enabled: boolean;
  } | null>(null);

  const activeConfig = localConfig || config || {
    min_margin_percent: 25,
    max_margin_percent: 80,
    adjustment_frequency_hours: 6,
    notifications_enabled: true,
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'competitor': return <Target className="h-5 w-5" />;
      case 'demand': return <TrendingUp className="h-5 w-5" />;
      case 'inventory': return <TrendingDown className="h-5 w-5" />;
      case 'time': return <LineChart className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const getRuleColor = (type: string) => {
    switch (type) {
      case 'competitor': return 'text-blue-600';
      case 'demand': return 'text-green-600';
      case 'inventory': return 'text-orange-600';
      case 'time': return 'text-purple-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'competitor': return 'Concurrent';
      case 'demand': return 'Demande';
      case 'inventory': return 'Inventaire';
      case 'time': return 'Horaire';
      default: return type;
    }
  };

  const handleCreateRule = () => {
    if (!newRuleName.trim()) return;
    
    createRule.mutate({
      name: newRuleName,
      type: newRuleType,
      description: newRuleDescription,
      impact: newRuleImpact,
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewRuleName('');
        setNewRuleDescription('');
        setNewRuleImpact(10);
      }
    });
  };

  const handleSaveConfig = () => {
    if (localConfig) {
      updateConfig.mutate(localConfig, {
        onSuccess: () => setLocalConfig(null)
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Pricing Dynamique - Drop Craft AI</title>
        <meta name="description" content="Optimisez vos prix automatiquement avec l'IA et la data concurrentielle" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Pricing Dynamique
            </h1>
            <p className="text-muted-foreground mt-1">
              Intelligence artificielle et règles automatisées
            </p>
          </div>
          <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Règle
          </Button>
        </div>

        {/* Create Rule Modal - Channable Design */}
        <ChannableModal
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title="Créer une règle dynamique"
          description="Définissez une stratégie de pricing intelligente pilotée par l'IA"
          icon={Zap}
          variant="premium"
          size="lg"
          onSubmit={handleCreateRule}
          submitLabel="Créer la règle"
          isSubmitting={createRule.isPending}
          submitDisabled={!newRuleName.trim()}
        >
          <div className="space-y-4">
            <ChannableFormField label="Nom de la règle" required>
              <Input 
                value={newRuleName} 
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="Ex: Alignement Concurrent"
                className="bg-background"
              />
            </ChannableFormField>

            <ChannableFormField label="Type de règle">
              <Select value={newRuleType} onValueChange={(v) => setNewRuleType(v as DynamicRuleType)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[200] bg-popover">
                  <SelectItem value="competitor">🎯 Concurrent</SelectItem>
                  <SelectItem value="demand">📈 Demande</SelectItem>
                  <SelectItem value="inventory">📦 Inventaire</SelectItem>
                  <SelectItem value="time">⏰ Horaire</SelectItem>
                </SelectContent>
              </Select>
            </ChannableFormField>

            <ChannableFormField label="Impact prix (%)" hint="Ajustement positif ou négatif">
              <div className="flex items-center gap-4">
                <Slider 
                  value={[newRuleImpact]} 
                  onValueChange={([v]) => setNewRuleImpact(v)}
                  min={-30}
                  max={30}
                  step={1}
                  className="flex-1"
                />
                <span className={`w-16 text-right font-bold ${newRuleImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {newRuleImpact > 0 ? '+' : ''}{newRuleImpact}%
                </span>
              </div>
            </ChannableFormField>

            <ChannableFormField label="Description" hint="Optionnel">
              <Input 
                value={newRuleDescription} 
                onChange={(e) => setNewRuleDescription(e.target.value)}
                placeholder="Ex: Ajuste les prix pour rester compétitif"
                className="bg-background"
              />
            </ChannableFormField>
          </div>
        </ChannableModal>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats?.revenueChange !== undefined ? (
                  `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%`
                ) : '—'}
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">Revenu ce mois</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats?.productsOptimized || 0}</div>
              <div className="text-sm text-muted-foreground">Produits optimisés</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats?.activeRules || 0}</div>
              <div className="text-sm text-muted-foreground">Règles actives</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <LineChart className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats?.adjustmentsToday || 0}</div>
              <div className="text-sm text-muted-foreground">Ajustements/jour</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rules">Règles</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="simulation">Simulation</TabsTrigger>
            <TabsTrigger value="settings">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            {rulesLoading ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                  Chargement...
                </CardContent>
              </Card>
            ) : rules.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Aucune règle dynamique</h3>
                  <p className="text-muted-foreground mb-4">Créez votre première règle de pricing dynamique</p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une règle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              rules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 bg-primary/10 rounded-lg ${getRuleColor(rule.type)}`}>
                          {getRuleIcon(rule.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{rule.name}</h3>
                            <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                              {rule.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                            <Badge variant="outline">{getRuleTypeLabel(rule.type)}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>{rule.products_count} produits</span>
                            <span className={rule.avg_impact >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              Impact moyen: {rule.avg_impact > 0 ? '+' : ''}{rule.avg_impact}%
                            </span>
                            {rule.last_executed_at && (
                              <span className="text-muted-foreground">
                                Exécuté {formatDistanceToNow(new Date(rule.last_executed_at), { addSuffix: true, locale: fr })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => simulateRule.mutate(rule.id)}
                          disabled={simulateRule.isPending}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Simuler
                        </Button>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => toggleRule.mutate({ ruleId: rule.id, isActive: checked })}
                          disabled={toggleRule.isPending}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Ajustements</CardTitle>
                <CardDescription>
                  Suivez tous les changements de prix automatiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                    Chargement...
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun ajustement enregistré
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((change) => (
                      <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{change.product_name}</p>
                          <p className="text-sm text-muted-foreground">{change.reason}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-sm line-through text-muted-foreground">{change.old_price.toFixed(2)}€</span>
                            <span className="font-bold text-primary">{change.new_price.toFixed(2)}€</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(change.created_at), { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Simulateur de Prix</CardTitle>
                <CardDescription>
                  Testez différentes stratégies avant de les appliquer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {rules.length === 0 ? (
                  <div className="text-center py-8">
                    <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune règle à simuler</h3>
                    <p className="text-muted-foreground mb-4">
                      Créez d'abord une règle de pricing dynamique
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une règle
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-primary/10 rounded ${getRuleColor(rule.type)}`}>
                            {getRuleIcon(rule.type)}
                          </div>
                          <div>
                            <p className="font-medium">{rule.name}</p>
                            <p className="text-sm text-muted-foreground">{rule.products_count} produits concernés</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => simulateRule.mutate(rule.id)}
                          disabled={simulateRule.isPending}
                        >
                          {simulateRule.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Simuler
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Globale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Limites de Marge</p>
                      <p className="text-sm text-muted-foreground">
                        Min: {activeConfig.min_margin_percent}% • Max: {activeConfig.max_margin_percent}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        className="w-20" 
                        value={activeConfig.min_margin_percent}
                        onChange={(e) => setLocalConfig({ ...activeConfig, min_margin_percent: Number(e.target.value) })}
                      />
                      <span>-</span>
                      <Input 
                        type="number" 
                        className="w-20" 
                        value={activeConfig.max_margin_percent}
                        onChange={(e) => setLocalConfig({ ...activeConfig, max_margin_percent: Number(e.target.value) })}
                      />
                      <span>%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Fréquence d'Ajustement</p>
                      <p className="text-sm text-muted-foreground">
                        Toutes les {activeConfig.adjustment_frequency_hours} heures
                      </p>
                    </div>
                    <Select 
                      value={String(activeConfig.adjustment_frequency_hours)}
                      onValueChange={(v) => setLocalConfig({ ...activeConfig, adjustment_frequency_hours: Number(v) })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 heure</SelectItem>
                        <SelectItem value="3">3 heures</SelectItem>
                        <SelectItem value="6">6 heures</SelectItem>
                        <SelectItem value="12">12 heures</SelectItem>
                        <SelectItem value="24">24 heures</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Notifications</p>
                      <p className="text-sm text-muted-foreground">M'alerter des changements importants</p>
                    </div>
                    <Switch 
                      checked={activeConfig.notifications_enabled}
                      onCheckedChange={(checked) => setLocalConfig({ ...activeConfig, notifications_enabled: checked })}
                    />
                  </div>

                  {localConfig && (
                    <Button onClick={handleSaveConfig} className="w-full" disabled={updateConfig.isPending}>
                      {updateConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Enregistrer la configuration
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
