import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { ChannableModal, ChannableFormField } from '@/components/channable/ChannableModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, 
  Settings, Play, Pause, History, Target, Plus, Loader2, Check, Eye
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  usePriceMonitoringStats,
  useMonitoredProducts,
  usePriceMonitorRules,
  usePriceHistory,
  useApplyRecommendedPrice,
  useTogglePriceRule,
  useCreatePriceMonitorRule,
  useSaveMonitoringSettings,
} from '@/hooks/usePriceMonitoring';

export default function PriceMonitoringPage() {
  const [autoPricingEnabled, setAutoPricingEnabled] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);

  // Form states
  const [settings, setSettings] = useState({
    checkFrequency: 15,
    minMargin: 20,
    maxMargin: 60,
    notifications: true
  });

  const [newRule, setNewRule] = useState({
    name: '',
    type: 'competitive',
    margin: '',
    description: ''
  });

  // Hooks
  const { data: stats, isLoading: isLoadingStats } = usePriceMonitoringStats();
  const { data: monitoredProducts = [], isLoading: isLoadingProducts } = useMonitoredProducts();
  const { data: priceRules = [], isLoading: isLoadingRules } = usePriceMonitorRules();
  const { data: priceHistory = [], isLoading: isLoadingHistory } = usePriceHistory(20);
  
  const applyPrice = useApplyRecommendedPrice();
  const toggleRule = useTogglePriceRule();
  const createRule = useCreatePriceMonitorRule();
  const saveSettings = useSaveMonitoringSettings();

  const handleApplyPrice = (productId: string, recommendedPrice: number) => {
    applyPrice.mutate({ productId, newPrice: recommendedPrice });
  };

  const handleToggleRule = (ruleId: string, currentStatus: string) => {
    toggleRule.mutate({ ruleId, isActive: currentStatus !== 'active' });
  };

  const handleSaveSettings = () => {
    saveSettings.mutate(settings);
    setShowConfigModal(false);
  };

  const handleCreateRule = () => {
    if (!newRule.name) {
      toast.error('Le nom de la règle est requis');
      return;
    }
    
    createRule.mutate(newRule, {
      onSuccess: () => {
        setShowNewRuleModal(false);
        setNewRule({ name: '', type: 'competitive', margin: '', description: '' });
      }
    });
  };

  return (
    <>
      <Helmet>
        <title>Price Monitoring & Auto-Pricing - ShopOpti</title>
        <meta name="description" content="Surveillance automatique des prix concurrents et ajustement dynamique pour maximiser vos marges" />
      </Helmet>

      <ChannablePageWrapper
        title="Price Monitoring & Auto-Pricing"
        subtitle="Surveillance automatique"
        description="Surveillez les prix concurrents et ajustez automatiquement vos tarifs"
        heroImage="analytics"
        badge={{ label: 'Auto-Pricing', icon: TrendingUp }}
        actions={
          <>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-pricing" className="text-sm">Auto-Pricing</Label>
              <Switch 
                id="auto-pricing"
                checked={autoPricingEnabled}
                onCheckedChange={(checked) => {
                  setAutoPricingEnabled(checked);
                  toast.success(checked ? "Auto-Pricing activé" : "Auto-Pricing désactivé");
                }}
              />
            </div>
            <Button onClick={() => setShowConfigModal(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configurer
            </Button>
          </>
        }
      >
        <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Produits Surveillés</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.productsMonitored || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">En surveillance active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Prix Ajustés (24h)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.pricesAdjusted24h || 0}</div>
              )}
              <p className="text-xs text-green-500">Ajustements automatiques</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Marge Moyenne</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.avgMargin || 0}%</div>
              )}
              <p className="text-xs text-muted-foreground">Sur produits surveillés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alertes Prix</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.priceAlerts || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Nécessite attention</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList>
            <TabsTrigger value="monitoring">Monitoring en Temps Réel</TabsTrigger>
            <TabsTrigger value="rules">Règles de Prix</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Produits Surveillés</CardTitle>
                <CardDescription>
                  Comparaison en temps réel avec vos concurrents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingProducts ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
                  </div>
                ) : monitoredProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun produit surveillé</p>
                    <p className="text-sm">Activez la surveillance sur vos produits pour commencer</p>
                  </div>
                ) : (
                  monitoredProducts.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              SKU: {product.sku} • Dernière mise à jour: {product.lastUpdate}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Votre prix</div>
                            <div className="text-2xl font-bold">{product.myPrice.toFixed(2)}€</div>
                          </div>
                        </div>

                        {product.competitors.length > 0 && (
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            {product.competitors.map((comp, idx) => (
                              <div key={idx} className="border rounded-lg p-3">
                                <div className="text-sm font-medium mb-1">{comp.name}</div>
                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-bold">{comp.price.toFixed(2)}€</span>
                                  <Badge variant={comp.change < 0 ? 'destructive' : comp.change > 0 ? 'default' : 'secondary'}>
                                    {comp.change > 0 ? '+' : ''}{comp.change.toFixed(1)}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <div>
                            <div className="text-sm font-medium text-green-900 dark:text-green-100">Prix Recommandé</div>
                            <div className="text-xs text-green-700 dark:text-green-300">
                              Optimisé pour compétitivité et marge
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{product.recommended.toFixed(2)}€</div>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleApplyPrice(product.id, product.recommended)}
                              disabled={applyPrice.isPending || product.myPrice === product.recommended}
                            >
                              {applyPrice.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : product.myPrice === product.recommended ? (
                                <><Check className="h-4 w-4 mr-1" /> Appliqué</>
                              ) : (
                                'Appliquer'
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Règles de Prix Automatiques</h3>
                <p className="text-sm text-muted-foreground">
                  Définissez des stratégies de pricing intelligentes
                </p>
              </div>
              <Button onClick={() => setShowNewRuleModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Règle
              </Button>
            </div>

            {isLoadingRules ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : priceRules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune règle configurée</p>
                  <Button className="mt-4" onClick={() => setShowNewRuleModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une règle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {priceRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{rule.name}</h4>
                            <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                              {rule.status === 'active' ? 'Actif' : 'Pausé'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {rule.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              {rule.products} produits
                            </span>
                            <span className="text-green-600 font-medium">
                              {rule.savings} conversions
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleToggleRule(rule.id, rule.status)}
                            disabled={toggleRule.isPending}
                          >
                            {rule.status === 'active' ? (
                              <><Pause className="h-4 w-4 mr-2" />Pause</>
                            ) : (
                              <><Play className="h-4 w-4 mr-2" />Activer</>
                            )}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Changements de Prix</CardTitle>
                <CardDescription>
                  Suivez l'évolution de vos prix et leur impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : priceHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun historique disponible</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Ancien Prix</TableHead>
                        <TableHead>Nouveau Prix</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product}</TableCell>
                          <TableCell className="line-through text-muted-foreground">
                            {item.oldPrice.toFixed(2)}€
                          </TableCell>
                          <TableCell className="font-bold text-primary">
                            {item.newPrice.toFixed(2)}€
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.reason}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Surveillance</CardTitle>
                <CardDescription>
                  Configurez les options de monitoring des prix
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Fréquence de vérification (minutes)</Label>
                    <Input 
                      id="frequency"
                      type="number" 
                      value={settings.checkFrequency}
                      onChange={(e) => setSettings({...settings, checkFrequency: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minMargin">Marge minimum (%)</Label>
                    <Input 
                      id="minMargin"
                      type="number" 
                      value={settings.minMargin}
                      onChange={(e) => setSettings({...settings, minMargin: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxMargin">Marge maximum (%)</Label>
                    <Input 
                      id="maxMargin"
                      type="number" 
                      value={settings.maxMargin}
                      onChange={(e) => setSettings({...settings, maxMargin: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch 
                      id="notifications"
                      checked={settings.notifications}
                      onCheckedChange={(checked) => setSettings({...settings, notifications: checked})}
                    />
                    <Label htmlFor="notifications">Notifications activées</Label>
                  </div>
                </div>
                <Button onClick={handleSaveSettings} disabled={saveSettings.isPending}>
                  {saveSettings.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Sauvegarder les paramètres
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>

        {/* Config Modal - Channable Design */}
        <ChannableModal
          open={showConfigModal}
          onOpenChange={setShowConfigModal}
          title="Configuration du Monitoring"
          description="Ajustez les paramètres de surveillance des prix"
          icon={Settings}
          variant="default"
          size="md"
          onSubmit={handleSaveSettings}
          submitLabel="Sauvegarder"
          isSubmitting={saveSettings.isPending}
        >
          <div className="space-y-4">
            <ChannableFormField label="Fréquence de vérification" hint="En minutes">
              <Input 
                type="number" 
                value={settings.checkFrequency}
                onChange={(e) => setSettings({...settings, checkFrequency: parseInt(e.target.value)})}
                className="bg-background"
              />
            </ChannableFormField>

            <div className="grid grid-cols-2 gap-4">
              <ChannableFormField label="Marge minimum (%)">
                <Input 
                  type="number" 
                  value={settings.minMargin}
                  onChange={(e) => setSettings({...settings, minMargin: parseInt(e.target.value)})}
                  className="bg-background"
                />
              </ChannableFormField>

              <ChannableFormField label="Marge maximum (%)">
                <Input 
                  type="number" 
                  value={settings.maxMargin}
                  onChange={(e) => setSettings({...settings, maxMargin: parseInt(e.target.value)})}
                  className="bg-background"
                />
              </ChannableFormField>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">Recevoir des alertes de prix</p>
              </div>
              <Switch 
                checked={settings.notifications}
                onCheckedChange={(checked) => setSettings({...settings, notifications: checked})}
              />
            </div>
          </div>
        </ChannableModal>

        {/* New Rule Modal - Channable Design */}
        <ChannableModal
          open={showNewRuleModal}
          onOpenChange={setShowNewRuleModal}
          title="Nouvelle Règle de Prix"
          description="Créez une stratégie de pricing intelligente"
          icon={Target}
          variant="premium"
          size="lg"
          onSubmit={handleCreateRule}
          submitLabel="Créer la règle"
          isSubmitting={createRule.isPending}
          submitDisabled={!newRule.name}
        >
          <div className="space-y-4">
            <ChannableFormField label="Nom de la règle" required>
              <Input 
                value={newRule.name}
                onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                placeholder="Ex: Compétitif -5%"
                className="bg-background"
              />
            </ChannableFormField>

            <ChannableFormField label="Type de règle">
              <Select value={newRule.type} onValueChange={(v) => setNewRule({...newRule, type: v})}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[200] bg-popover">
                  <SelectItem value="competitive">🎯 Compétitif</SelectItem>
                  <SelectItem value="margin">💰 Marge cible</SelectItem>
                  <SelectItem value="markup">📈 Markup</SelectItem>
                  <SelectItem value="rounding">🔢 Arrondi psychologique</SelectItem>
                </SelectContent>
              </Select>
            </ChannableFormField>

            <ChannableFormField label="Marge / Pourcentage (%)" hint="Valeur à appliquer">
              <Input 
                type="number"
                value={newRule.margin}
                onChange={(e) => setNewRule({...newRule, margin: e.target.value})}
                placeholder="Ex: 25"
                className="bg-background"
              />
            </ChannableFormField>

            <ChannableFormField label="Description" hint="Optionnel">
              <Input 
                value={newRule.description}
                onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                placeholder="Description de la règle"
                className="bg-background"
              />
            </ChannableFormField>
          </div>
        </ChannableModal>
      </ChannablePageWrapper>
    </>
  );
}
