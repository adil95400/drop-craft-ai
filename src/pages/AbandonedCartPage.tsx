import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ShoppingCart, Mail, DollarSign, TrendingUp, Clock, Target, Plus, Loader2, Settings } from 'lucide-react';
import { useAbandonedCarts } from '@/hooks/useAbandonedCarts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const AbandonedCartPage: React.FC = () => {
  const { carts, campaigns, stats, isLoading, sendRecoveryEmail, createCampaign, toggleCampaignStatus } = useAbandonedCarts();
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    delay_hours: 1,
    discount_percent: 10,
    is_active: true
  });
  const [settings, setSettings] = useState({
    first_contact_delay: 1,
    discount_percent: 10,
    min_cart_value: 20
  });

  const handleSendEmail = (cartId: string) => {
    sendRecoveryEmail.mutate(cartId);
  };

  const handleCreateCampaign = () => {
    createCampaign.mutate(newCampaign);
    setIsNewCampaignOpen(false);
    setNewCampaign({
      name: '',
      description: '',
      delay_hours: 1,
      discount_percent: 10,
      is_active: true
    });
  };

  const handleToggleCampaign = (id: string, currentStatus: boolean) => {
    toggleCampaignStatus.mutate({ id, is_active: !currentStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Paniers abandonnés</h1>
          <p className="text-muted-foreground">
            Récupérez les ventes perdues avec des campagnes automatiques
          </p>
        </div>
        <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
          <DialogTrigger asChild>
            <Button>
              <Mail className="mr-2 h-4 w-4" />
              Nouvelle campagne
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une campagne de récupération</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Nom de la campagne</Label>
                <Input
                  id="campaign-name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Ex: Email 1h après abandon"
                />
              </div>
              <div>
                <Label htmlFor="campaign-desc">Description</Label>
                <Textarea
                  id="campaign-desc"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="Description de la campagne..."
                />
              </div>
              <div>
                <Label htmlFor="delay">Délai après abandon (heures)</Label>
                <Input
                  id="delay"
                  type="number"
                  value={newCampaign.delay_hours}
                  onChange={(e) => setNewCampaign({ ...newCampaign, delay_hours: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="discount">Réduction offerte (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={newCampaign.discount_percent}
                  onChange={(e) => setNewCampaign({ ...newCampaign, discount_percent: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newCampaign.is_active}
                  onCheckedChange={(checked) => setNewCampaign({ ...newCampaign, is_active: checked })}
                />
                <Label>Activer immédiatement</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewCampaignOpen(false)}>Annuler</Button>
              <Button onClick={handleCreateCampaign} disabled={!newCampaign.name || createCampaign.isPending}>
                {createCampaign.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paniers abandonnés</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCarts}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Revenue potentiel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de récupération</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recoveryRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {stats.recoveredCount} récupérés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue récupéré</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.recoveredValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="carts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="carts">Paniers actifs</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="carts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paniers abandonnés récents</CardTitle>
              <CardDescription>Récupérez ces ventes maintenant</CardDescription>
            </CardHeader>
            <CardContent>
              {carts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun panier abandonné pour le moment
                </div>
              ) : (
                <div className="space-y-4">
                  {carts.map((cart) => (
                    <div
                      key={cart.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <ShoppingCart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{cart.customer_name}</h3>
                          <p className="text-sm text-muted-foreground">{cart.customer_email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {cart.items_count} articles • Abandonné {formatDistanceToNow(new Date(cart.abandoned_at), { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-semibold">€{cart.cart_value.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">Valeur panier</div>
                        </div>
                        <Badge
                          variant={
                            cart.status === 'recovered'
                              ? 'default'
                              : cart.status === 'emailed'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {cart.status === 'recovered'
                            ? 'Récupéré'
                            : cart.status === 'emailed'
                            ? 'Email envoyé'
                            : 'Non contacté'}
                        </Badge>
                        {cart.status === 'not_contacted' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleSendEmail(cart.id)}
                            disabled={sendRecoveryEmail.isPending}
                          >
                            {sendRecoveryEmail.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="mr-2 h-4 w-4" />
                            )}
                            Envoyer email
                          </Button>
                        )}
                        {cart.status === 'emailed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSendEmail(cart.id)}
                            disabled={sendRecoveryEmail.isPending}
                          >
                            Relancer
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Campagnes de récupération</CardTitle>
                <CardDescription>Séquences d'emails automatiques</CardDescription>
              </div>
              <Button onClick={() => setIsNewCampaignOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle campagne
              </Button>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune campagne configurée. Créez votre première campagne de récupération.
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {campaign.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Délai: {campaign.delay_hours}h • {campaign.discount_percent ? `${campaign.discount_percent}% de réduction` : 'Sans réduction'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={campaign.is_active}
                            onCheckedChange={() => handleToggleCampaign(campaign.id, campaign.is_active)}
                          />
                          <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                            {campaign.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <div className="text-sm font-semibold">{campaign.open_rate.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Taux d'ouverture</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{campaign.click_rate.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Taux de clic</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{campaign.conversion_rate.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Taux de conversion</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{campaign.emails_sent}</div>
                          <div className="text-xs text-muted-foreground">Emails envoyés</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Taux d'abandon par heure</CardTitle>
                <CardDescription>Moments critiques de l'abandon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Graphique des abandons par heure</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Raisons d'abandon</CardTitle>
                <CardDescription>Principales causes identifiées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { reason: 'Frais de livraison trop élevés', percentage: 35 },
                    { reason: 'Juste en train de comparer', percentage: 28 },
                    { reason: 'Processus de paiement complexe', percentage: 18 },
                    { reason: 'Manque de modes de paiement', percentage: 12 },
                    { reason: 'Autres raisons', percentage: 7 },
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.reason}</span>
                        <span className="font-medium">{item.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de récupération</CardTitle>
              <CardDescription>Configurez vos campagnes automatiques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Délai avant premier contact</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Temps d'attente avant d'envoyer le premier email
                  </p>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={settings.first_contact_delay}
                      onChange={(e) => setSettings({ ...settings, first_contact_delay: parseInt(e.target.value) || 1 })}
                      className="w-20"
                    />
                    <span className="text-sm">heure(s)</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Code promo automatique</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Réduction offerte dans les emails de relance
                  </p>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={settings.discount_percent}
                      onChange={(e) => setSettings({ ...settings, discount_percent: parseInt(e.target.value) || 0 })}
                      className="w-20"
                    />
                    <span className="text-sm">% de réduction</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Valeur minimum du panier</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Montant minimum pour déclencher les emails
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">€</span>
                    <Input 
                      type="number" 
                      value={settings.min_cart_value}
                      onChange={(e) => setSettings({ ...settings, min_cart_value: parseInt(e.target.value) || 0 })}
                      className="w-20"
                    />
                  </div>
                </div>

                <Button className="mt-4">
                  <Settings className="h-4 w-4 mr-2" />
                  Sauvegarder les paramètres
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AbandonedCartPage;
