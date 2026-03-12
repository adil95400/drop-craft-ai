import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpRight, Gift, Plus, Trash2, TrendingUp,
  Eye, ShoppingCart, Target, BarChart3, Percent
} from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useUpsellRules } from '@/hooks/useUpsellRules';

export default function UpsellCrossSellPage() {
  const { rules, isLoading, stats, createRule, isCreating, toggleRule, deleteRule } = useUpsellRules();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    rule_type: 'upsell',
    trigger_category: '',
    discount_percent: 0,
    min_cart_value: '',
    display_location: 'product_page',
    priority: 5,
  });

  const handleCreate = () => {
    if (!form.name) return;
    createRule({
      name: form.name,
      rule_type: form.rule_type,
      trigger_category: form.trigger_category || null,
      discount_percent: form.discount_percent,
      min_cart_value: form.min_cart_value ? parseFloat(form.min_cart_value) : null,
      display_location: form.display_location,
      priority: form.priority,
    });
    setForm({ name: '', rule_type: 'upsell', trigger_category: '', discount_percent: 0, min_cart_value: '', display_location: 'product_page', priority: 5 });
    setDialogOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Upsell & Cross-Sell — Drop-Craft AI</title>
        <meta name="description" content="Augmentez votre panier moyen avec des offres upsell et cross-sell intelligentes." />
      </Helmet>

      <ChannablePageWrapper
        title="Upsell & Cross-Sell"
        subtitle="Marketing"
        description="Augmentez votre panier moyen avec des recommandations intelligentes"
        heroImage="marketing"
        badge={{ label: "Revenue", icon: ArrowUpRight }}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouvelle règle</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une règle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nom de la règle</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Bundle accessoires" />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.rule_type} onValueChange={v => setForm({ ...form, rule_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upsell">Upsell (montée en gamme)</SelectItem>
                      <SelectItem value="cross_sell">Cross-sell (complémentaire)</SelectItem>
                      <SelectItem value="bundle">Bundle (lot)</SelectItem>
                      <SelectItem value="frequently_bought">Fréquemment achetés ensemble</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Catégorie déclencheur (optionnel)</Label>
                  <Input value={form.trigger_category} onChange={e => setForm({ ...form, trigger_category: e.target.value })} placeholder="Ex: Électronique" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Réduction (%)</Label>
                    <Input type="number" min={0} max={100} value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Panier minimum (€)</Label>
                    <Input type="number" value={form.min_cart_value} onChange={e => setForm({ ...form, min_cart_value: e.target.value })} placeholder="Optionnel" />
                  </div>
                </div>
                <div>
                  <Label>Emplacement</Label>
                  <Select value={form.display_location} onValueChange={v => setForm({ ...form, display_location: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product_page">Page produit</SelectItem>
                      <SelectItem value="cart">Panier</SelectItem>
                      <SelectItem value="checkout">Checkout</SelectItem>
                      <SelectItem value="post_purchase">Post-achat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priorité (1-10)</Label>
                  <Input type="number" min={1} max={10} value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={isCreating || !form.name}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      >
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Règles actives</p>
                <p className="text-2xl font-bold">{stats.active} / {stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Impressions</p>
                <p className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{stats.totalConversions} ({stats.conversionRate}%)</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Revenus générés</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('fr-FR')}€</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="rules" className="w-full">
          <TabsList>
            <TabsTrigger value="rules">Règles ({stats.total})</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-6 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </Card>
                ))}
              </div>
            ) : rules.length === 0 ? (
              <Card className="p-12 text-center">
                <ArrowUpRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">Aucune règle d'upsell</p>
                <p className="text-muted-foreground mb-4">
                  Créez des règles pour recommander des produits complémentaires ou supérieurs
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Créer une règle
                </Button>
              </Card>
            ) : (
              rules.map(rule => (
                <Card key={rule.id} className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant="outline" className="capitalize">
                          {rule.rule_type.replace('_', '-')}
                        </Badge>
                        <Badge variant="outline">{rule.display_location.replace('_', ' ')}</Badge>
                        {rule.discount_percent > 0 && (
                          <Badge className="bg-green-100 text-green-700">
                            <Percent className="h-3 w-3 mr-1" />
                            -{rule.discount_percent}%
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{rule.impressions} impressions</span>
                        <span>{rule.conversions} conversions</span>
                        {Number(rule.revenue_generated) > 0 && (
                          <span className="text-green-600 font-medium">
                            +{Number(rule.revenue_generated).toLocaleString('fr-FR')}€
                          </span>
                        )}
                        {rule.trigger_category && <span>Cat: {rule.trigger_category}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={checked => toggleRule({ id: rule.id, active: checked })}
                      />
                      <Button size="sm" variant="ghost" onClick={() => deleteRule(rule.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Accessoires complémentaires', type: 'cross_sell', desc: 'Propose des accessoires liés au produit consulté', icon: Gift },
                { name: 'Version premium', type: 'upsell', desc: 'Montée en gamme vers un produit supérieur', icon: ArrowUpRight },
                { name: 'Bundle économique', type: 'bundle', desc: 'Lot de produits avec réduction groupée', icon: ShoppingCart },
                { name: 'Achetés ensemble', type: 'frequently_bought', desc: 'Basé sur l\'historique des commandes', icon: BarChart3 },
                { name: 'Offre post-achat', type: 'cross_sell', desc: 'Recommandation après paiement', icon: Target },
                { name: 'Seuil panier minimum', type: 'upsell', desc: 'Ajouter X€ pour livraison gratuite', icon: TrendingUp },
              ].map(tpl => (
                <Card key={tpl.name} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent">
                      <tpl.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{tpl.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{tpl.desc}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setForm({ ...form, name: tpl.name, rule_type: tpl.type });
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />Utiliser ce template
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
