import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, 
  Settings, Play, Pause, History, Target, Plus, Loader2, Check
} from 'lucide-react';

interface PriceRule {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'paused';
  products: number;
  savings: string;
}

interface MonitoredProduct {
  id: number;
  name: string;
  myPrice: number;
  competitors: { name: string; price: number; change: number }[];
  recommended: number;
  lastUpdate: string;
}

interface PriceHistoryItem {
  id: number;
  product: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  date: string;
}

export default function PriceMonitoringPage() {
  const { toast } = useToast();
  const [autoPricingEnabled, setAutoPricingEnabled] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);
  const [applyingPrice, setApplyingPrice] = useState<number | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

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

  const [priceRules, setPriceRules] = useState<PriceRule[]>([
    {
      id: 1,
      name: 'Competitive Pricing',
      description: 'Toujours 5% moins cher que le concurrent le moins cher',
      status: 'active',
      products: 245,
      savings: '+12%'
    },
    {
      id: 2,
      name: 'Dynamic Margin',
      description: 'Marge minimum 30%, maximum 50%',
      status: 'active',
      products: 189,
      savings: '+8%'
    },
    {
      id: 3,
      name: 'Flash Sales',
      description: 'Réduction automatique sur stock élevé',
      status: 'paused',
      products: 67,
      savings: '+15%'
    }
  ]);

  const [monitoredProducts, setMonitoredProducts] = useState<MonitoredProduct[]>([
    {
      id: 1,
      name: 'Wireless Headphones Pro',
      myPrice: 79.99,
      competitors: [
        { name: 'Amazon', price: 84.99, change: -2 },
        { name: 'eBay', price: 82.50, change: 0 },
        { name: 'AliExpress', price: 75.00, change: -5 }
      ],
      recommended: 78.99,
      lastUpdate: '2 min ago'
    },
    {
      id: 2,
      name: 'Smart Watch X5',
      myPrice: 149.99,
      competitors: [
        { name: 'Amazon', price: 159.99, change: 0 },
        { name: 'eBay', price: 145.00, change: -3 },
        { name: 'Walmart', price: 152.00, change: +2 }
      ],
      recommended: 147.99,
      lastUpdate: '5 min ago'
    }
  ]);

  const [priceHistory] = useState<PriceHistoryItem[]>([
    { id: 1, product: 'Wireless Headphones Pro', oldPrice: 82.99, newPrice: 79.99, reason: 'Concurrence', date: '2024-01-15 14:30' },
    { id: 2, product: 'Smart Watch X5', oldPrice: 155.00, newPrice: 149.99, reason: 'Marge optimisée', date: '2024-01-15 12:15' },
    { id: 3, product: 'Bluetooth Speaker', oldPrice: 45.00, newPrice: 42.99, reason: 'Stock élevé', date: '2024-01-15 10:00' },
    { id: 4, product: 'USB-C Hub', oldPrice: 28.00, newPrice: 29.99, reason: 'Rupture concurrence', date: '2024-01-14 18:45' },
  ]);

  const handleApplyPrice = async (productId: number, recommendedPrice: number) => {
    setApplyingPrice(productId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMonitoredProducts(products => 
      products.map(p => 
        p.id === productId ? { ...p, myPrice: recommendedPrice } : p
      )
    );
    
    toast({
      title: "Prix mis à jour",
      description: `Le prix a été ajusté à $${recommendedPrice}`,
    });
    setApplyingPrice(null);
  };

  const handleToggleRule = (ruleId: number) => {
    setPriceRules(rules => rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, status: rule.status === 'active' ? 'paused' : 'active' }
        : rule
    ));
    const rule = priceRules.find(r => r.id === ruleId);
    toast({ 
      title: rule?.status === 'active' ? 'Règle mise en pause' : 'Règle activée',
      description: `"${rule?.name}" a été ${rule?.status === 'active' ? 'mise en pause' : 'activée'}`
    });
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Paramètres enregistrés",
      description: "Les paramètres de monitoring ont été mis à jour",
    });
    setSavingSettings(false);
  };

  const handleCreateRule = async () => {
    if (!newRule.name) {
      toast({ title: "Erreur", description: "Le nom de la règle est requis", variant: "destructive" });
      return;
    }
    
    const rule: PriceRule = {
      id: Date.now(),
      name: newRule.name,
      description: newRule.description || `Règle ${newRule.type} avec marge ${newRule.margin}%`,
      status: 'active',
      products: 0,
      savings: '+0%'
    };
    
    setPriceRules(rules => [...rules, rule]);
    setShowNewRuleModal(false);
    setNewRule({ name: '', type: 'competitive', margin: '', description: '' });
    
    toast({
      title: "Règle créée",
      description: `La règle "${rule.name}" a été créée avec succès`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Price Monitoring & Auto-Pricing - ShopOpti</title>
        <meta name="description" content="Surveillance automatique des prix concurrents et ajustement dynamique pour maximiser vos marges" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Price Monitoring & Auto-Pricing</h1>
            <p className="text-muted-foreground mt-2">
              Surveillez les prix concurrents et ajustez automatiquement vos tarifs
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-pricing">Auto-Pricing</Label>
              <Switch 
                id="auto-pricing"
                checked={autoPricingEnabled}
                onCheckedChange={(checked) => {
                  setAutoPricingEnabled(checked);
                  toast({
                    title: checked ? "Auto-Pricing activé" : "Auto-Pricing désactivé",
                    description: checked 
                      ? "Les prix seront ajustés automatiquement selon vos règles" 
                      : "Les ajustements de prix nécessiteront votre approbation"
                  });
                }}
              />
            </div>
            <Button onClick={() => setShowConfigModal(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configurer
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Produits Surveillés</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">+23 cette semaine</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Prix Ajustés (24h)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-green-500">+12% vs hier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Marge Moyenne</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">38.5%</div>
              <p className="text-xs text-green-500">+2.3% ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alertes Prix</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
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
                {monitoredProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Dernière mise à jour: {product.lastUpdate}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Votre prix</div>
                          <div className="text-2xl font-bold">${product.myPrice}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {product.competitors.map((comp, idx) => (
                          <div key={idx} className="border rounded-lg p-3">
                            <div className="text-sm font-medium mb-1">{comp.name}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold">${comp.price}</span>
                              <Badge variant={comp.change < 0 ? 'destructive' : comp.change > 0 ? 'default' : 'secondary'}>
                                {comp.change > 0 ? '+' : ''}{comp.change}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <div className="text-sm font-medium text-green-900">Prix Recommandé</div>
                          <div className="text-xs text-green-700">
                            Optimisé pour compétitivité et marge
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-green-900">${product.recommended}</div>
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleApplyPrice(product.id, product.recommended)}
                            disabled={applyingPrice === product.id || product.myPrice === product.recommended}
                          >
                            {applyingPrice === product.id ? (
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
                ))}
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
                          onClick={() => handleToggleRule(rule.id)}
                        >
                          {rule.status === 'active' ? (
                            <><Pause className="h-4 w-4 mr-2" />Pause</>
                          ) : (
                            <><Play className="h-4 w-4 mr-2" />Activer</>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            toast({ title: "Modification", description: `Édition de "${rule.name}"` });
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                        <TableCell className="text-muted-foreground">${item.oldPrice}</TableCell>
                        <TableCell className={item.newPrice < item.oldPrice ? 'text-red-600' : 'text-green-600'}>
                          ${item.newPrice}
                          {item.newPrice < item.oldPrice ? (
                            <TrendingDown className="inline h-3 w-3 ml-1" />
                          ) : (
                            <TrendingUp className="inline h-3 w-3 ml-1" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.reason}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Monitoring</CardTitle>
                <CardDescription>
                  Configurez vos sources et règles de surveillance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Fréquence de vérification (minutes)</Label>
                  <Input 
                    type="number" 
                    value={settings.checkFrequency}
                    onChange={(e) => setSettings({...settings, checkFrequency: parseInt(e.target.value) || 15})}
                  />
                  <p className="text-xs text-muted-foreground">Minutes entre chaque vérification</p>
                </div>

                <div className="space-y-2">
                  <Label>Marge minimum (%)</Label>
                  <Input 
                    type="number" 
                    value={settings.minMargin}
                    onChange={(e) => setSettings({...settings, minMargin: parseInt(e.target.value) || 20})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Marge maximum (%)</Label>
                  <Input 
                    type="number" 
                    value={settings.maxMargin}
                    onChange={(e) => setSettings({...settings, maxMargin: parseInt(e.target.value) || 60})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications prix</Label>
                    <p className="text-xs text-muted-foreground">
                      Alertes quand un concurrent baisse ses prix
                    </p>
                  </div>
                  <Switch 
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings({...settings, notifications: checked})}
                  />
                </div>

                <Button className="w-full" onClick={handleSaveSettings} disabled={savingSettings}>
                  {savingSettings ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement...</>
                  ) : (
                    'Enregistrer les Paramètres'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Config Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuration Auto-Pricing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mode de pricing</Label>
              <Select defaultValue="competitive">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="competitive">Compétitif - Toujours sous la concurrence</SelectItem>
                  <SelectItem value="margin">Marge - Optimiser les profits</SelectItem>
                  <SelectItem value="dynamic">Dynamique - IA adaptative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sources de prix à surveiller</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Amazon</Badge>
                <Badge variant="default">eBay</Badge>
                <Badge variant="default">AliExpress</Badge>
                <Badge variant="outline">+ Ajouter</Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>Annuler</Button>
            <Button onClick={() => {
              setShowConfigModal(false);
              toast({ title: "Configuration enregistrée" });
            }}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Rule Modal */}
      <Dialog open={showNewRuleModal} onOpenChange={setShowNewRuleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une Règle de Prix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la règle</Label>
              <Input 
                placeholder="Ex: Prix compétitif -5%"
                value={newRule.name}
                onChange={(e) => setNewRule({...newRule, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Type de règle</Label>
              <Select value={newRule.type} onValueChange={(v) => setNewRule({...newRule, type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="competitive">Prix compétitif</SelectItem>
                  <SelectItem value="margin">Marge fixe</SelectItem>
                  <SelectItem value="flash">Flash sale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marge/Réduction (%)</Label>
              <Input 
                type="number"
                placeholder="5"
                value={newRule.margin}
                onChange={(e) => setNewRule({...newRule, margin: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optionnel)</Label>
              <Input 
                placeholder="Description de la règle..."
                value={newRule.description}
                onChange={(e) => setNewRule({...newRule, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRuleModal(false)}>Annuler</Button>
            <Button onClick={handleCreateRule}>Créer la règle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
