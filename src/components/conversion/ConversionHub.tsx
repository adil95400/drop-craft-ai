import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useConversionOptimization } from '@/hooks/useConversionOptimization';
import { Package, TrendingUp, Percent, Clock, Users, Plus, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export const ConversionHub = () => {
  const {
    bundles,
    upsellRules,
    discounts,
    timers,
    widgets,
    analytics,
    createBundle,
    createUpsellRule,
    createDiscount,
    createTimer,
    createWidget,
    generateAIUpsells,
    isGeneratingUpsells
  } = useConversionOptimization();

  const [newBundle, setNewBundle] = useState({ bundle_name: '', product_ids: '', discount_value: '' });
  const [newDiscount, setNewDiscount] = useState({ discount_name: '', discount_type: 'percentage', discount_value: '' });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Optimisation de la Conversion</h1>
        <p className="text-muted-foreground mt-2">
          Bundles, upsells automatiques, remises dynamiques et preuve sociale
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Événements Totaux</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_events || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valeur Conversions</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_conversion_value?.toFixed(2) || 0}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bundles Actifs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bundles?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Widgets Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{widgets?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bundles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bundles">Bundles</TabsTrigger>
          <TabsTrigger value="upsells">Upsells/Cross-sells</TabsTrigger>
          <TabsTrigger value="discounts">Remises</TabsTrigger>
          <TabsTrigger value="timers">Minuteurs</TabsTrigger>
          <TabsTrigger value="social">Preuve Sociale</TabsTrigger>
        </TabsList>

        <TabsContent value="bundles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Regroupement de Produits
                  </CardTitle>
                  <CardDescription>Créez des bundles attractifs avec remises</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />Nouveau Bundle</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer un Bundle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nom du Bundle</Label>
                        <Input
                          value={newBundle.bundle_name}
                          onChange={(e) => setNewBundle({ ...newBundle, bundle_name: e.target.value })}
                          placeholder="Pack Starter"
                        />
                      </div>
                      <div>
                        <Label>IDs Produits (séparés par virgules)</Label>
                        <Input
                          value={newBundle.product_ids}
                          onChange={(e) => setNewBundle({ ...newBundle, product_ids: e.target.value })}
                          placeholder="id1,id2,id3"
                        />
                      </div>
                      <div>
                        <Label>Remise (%)</Label>
                        <Input
                          type="number"
                          value={newBundle.discount_value}
                          onChange={(e) => setNewBundle({ ...newBundle, discount_value: e.target.value })}
                          placeholder="15"
                        />
                      </div>
                      <Button
                        onClick={() => createBundle.mutate({
                          bundle_name: newBundle.bundle_name,
                          product_ids: newBundle.product_ids.split(','),
                          discount_type: 'percentage',
                          discount_value: parseFloat(newBundle.discount_value)
                        })}
                        disabled={createBundle.isPending}
                      >
                        Créer le Bundle
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bundles?.map((bundle: any) => (
                  <div key={bundle.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{bundle.bundle_name}</h3>
                        <p className="text-sm text-muted-foreground">{bundle.product_ids?.length} produits</p>
                        <p className="text-sm mt-1">
                          <span className="text-muted-foreground line-through">{bundle.original_price?.toFixed(2)}€</span>
                          {' → '}
                          <span className="font-bold text-primary">{bundle.bundle_price?.toFixed(2)}€</span>
                          {' '}
                          <Badge variant="secondary">Économie: {bundle.savings?.toFixed(2)}€</Badge>
                        </p>
                      </div>
                      <Badge>{bundle.is_active ? 'Actif' : 'Inactif'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upsells" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Upsells & Cross-sells
                  </CardTitle>
                  <CardDescription>Suggestions automatiques par IA</CardDescription>
                </div>
                <Button
                  onClick={() => generateAIUpsells.mutate({ product_id: 'demo', cart_items: [] })}
                  disabled={isGeneratingUpsells}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer avec IA
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upsellRules?.map((rule: any) => (
                  <div key={rule.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{rule.rule_name}</h3>
                        <Badge variant="outline" className="mt-1">{rule.rule_type}</Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          Affichage: {rule.display_timing}
                        </p>
                      </div>
                      {rule.ai_generated && <Badge variant="secondary">IA</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Remises Dynamiques
                  </CardTitle>
                  <CardDescription>Remises basées sur des conditions</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />Nouvelle Remise</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer une Remise Dynamique</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nom de la Remise</Label>
                        <Input
                          value={newDiscount.discount_name}
                          onChange={(e) => setNewDiscount({ ...newDiscount, discount_name: e.target.value })}
                          placeholder="Remise Panier +100€"
                        />
                      </div>
                      <div>
                        <Label>Type de Remise</Label>
                        <Select
                          value={newDiscount.discount_type}
                          onValueChange={(v) => setNewDiscount({ ...newDiscount, discount_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Pourcentage</SelectItem>
                            <SelectItem value="fixed">Montant Fixe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Valeur</Label>
                        <Input
                          type="number"
                          value={newDiscount.discount_value}
                          onChange={(e) => setNewDiscount({ ...newDiscount, discount_value: e.target.value })}
                          placeholder="10"
                        />
                      </div>
                      <Button
                        onClick={() => createDiscount.mutate({
                          discount_name: newDiscount.discount_name,
                          discount_type: newDiscount.discount_type,
                          discount_value: parseFloat(newDiscount.discount_value),
                          conditions: { min_cart_value: 100 }
                        })}
                        disabled={createDiscount.isPending}
                      >
                        Créer la Remise
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discounts?.map((discount: any) => (
                  <div key={discount.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{discount.discount_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {discount.discount_type === 'percentage' ? `${discount.discount_value}%` : `${discount.discount_value}€`}
                        </p>
                      </div>
                      <Badge>{discount.is_active ? 'Actif' : 'Inactif'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Minuteurs de Rareté
              </CardTitle>
              <CardDescription>Créez l'urgence avec des comptes à rebours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timers?.map((timer: any) => (
                  <div key={timer.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{timer.timer_name}</h3>
                        <Badge variant="outline" className="mt-1">{timer.timer_type}</Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          Urgence: {timer.urgency_level}
                        </p>
                      </div>
                      <Badge>{timer.is_active ? 'Actif' : 'Inactif'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Preuve Sociale
              </CardTitle>
              <CardDescription>Widgets de confiance et d'activité</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {widgets?.map((widget: any) => (
                  <div key={widget.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{widget.widget_name}</h3>
                        <Badge variant="outline" className="mt-1">{widget.widget_type}</Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          Position: {widget.position}
                        </p>
                      </div>
                      <Badge>{widget.is_active ? 'Actif' : 'Inactif'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
