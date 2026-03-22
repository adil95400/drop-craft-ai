import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Zap, Calendar, TrendingUp, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuthOptimized } from '@/shared';
import { usePromotions } from '@/hooks/usePromotions';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function PromotionsAutomationPage() {
  const { user } = useAuthOptimized()
  const { stats, campaigns, rules, createCampaign, createRule } = usePromotions(user?.id || '')
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showCreateRule, setShowCreateRule] = useState(false)
  return (
    <>
      <Helmet>
        <title>Promotions Automatisées - ShopOpti</title>
        <meta name="description" content="Créez et gérez vos promotions multi-marketplace automatiquement" />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('promotionsAutomatisees.title')}
        subtitle="Marketing"
        description="Créez et déployez vos campagnes promotionnelles sur tous vos canaux de vente"
        heroImage="marketing"
        badge={{ label: "Multi-Channel", icon: Tag }}
      >

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campagnes Actives</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_campaigns || 0}</div>
              <p className="text-xs text-muted-foreground">En cours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Règles Auto</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.automation_rules || 0}</div>
              <p className="text-xs text-muted-foreground">Automatisations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planifiées</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.scheduled_campaigns || 0}</div>
              <p className="text-xs text-muted-foreground">À venir</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impact CA</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.revenue_this_month.toFixed(0) || 0}€</div>
              <p className="text-xs text-muted-foreground">Ce mois-ci</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
            <TabsTrigger value="automation">Automatisation</TabsTrigger>
            <TabsTrigger value="scheduled">Planifiées</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Campagnes Promotionnelles</CardTitle>
                  <CardDescription>Gérez vos promotions actives et passées</CardDescription>
                </div>
                <Button onClick={() => setShowCreateCampaign(!showCreateCampaign)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle campagne
                </Button>
              </CardHeader>
              <CardContent>
                {showCreateCampaign && (
                  <div className="mb-6 p-4 border rounded-lg space-y-4">
                    <div className="space-y-2">
                      <Label>Nom de la campagne</Label>
                      <Input id="campaign-name" placeholder="Black Friday 2024" />
                    </div>
                    <div className="space-y-2">
                      <Label>Type de promotion</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">Remise</SelectItem>
                          <SelectItem value="coupon">Code promo</SelectItem>
                          <SelectItem value="flash_sale">Vente flash</SelectItem>
                          <SelectItem value="bundle">Bundle</SelectItem>
                          <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => {
                        createCampaign({
                          campaign_name: (document.getElementById('campaign-name') as HTMLInputElement)?.value || 'Nouvelle campagne',
                          campaign_type: 'discount',
                          discount_type: 'percentage',
                          discount_value: 10,
                          auto_apply: false,
                          starts_at: new Date().toISOString(),
                          ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                          timezone: 'Europe/Paris',
                          auto_start: true,
                          auto_end: true,
                          recurring: false,
                          deployment_status: {},
                          current_uses: 0,
                          revenue_generated: 0,
                          orders_count: 0,
                          avg_discount_per_order: 0,
                          status: 'draft'
                        })
                        setShowCreateCampaign(false)
                      }}>
                        Créer
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {campaigns.length === 0 && !showCreateCampaign ? (
                  <div className="text-center py-12 space-y-4">
                    <p className="text-muted-foreground">Aucune campagne créée</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{campaign.campaign_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {campaign.campaign_type} • {campaign.status}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{campaign.revenue_generated}€ générés</p>
                            <p className="text-xs text-muted-foreground">{campaign.orders_count} commandes</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Règles d'Automatisation</CardTitle>
                  <CardDescription>
                    Configurez des promotions déclenchées automatiquement
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateRule(!showCreateRule)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle règle
                </Button>
              </CardHeader>
              <CardContent>
                {showCreateRule && (
                  <div className="mb-6 p-4 border rounded-lg space-y-4">
                    <div className="space-y-2">
                      <Label>Nom de la règle</Label>
                      <Input id="rule-name" placeholder="Stock bas = -20%" />
                    </div>
                    <div className="space-y-2">
                      <Label>Type de déclencheur</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date_based">Date</SelectItem>
                          <SelectItem value="inventory_based">Stock</SelectItem>
                          <SelectItem value="sales_based">Ventes</SelectItem>
                          <SelectItem value="competitor_based">Concurrence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => {
                        createRule({
                          rule_name: (document.getElementById('rule-name') as HTMLInputElement)?.value || 'Nouvelle règle',
                          trigger_type: 'inventory_based',
                          trigger_conditions: { stock_below: 20 },
                          campaign_template: {
                            campaign_type: 'discount',
                            discount_type: 'percentage',
                            discount_value: 20
                          },
                          check_frequency_hours: 24,
                          is_active: true,
                          execution_count: 0
                        })
                        setShowCreateRule(false)
                      }}>
                        Créer
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateRule(false)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mb-4 border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Types de déclencheurs</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Date:</strong> Black Friday, Noël, soldes</li>
                    <li>• <strong>Stock:</strong> Réduction si stock &lt; seuil</li>
                    <li>• <strong>Ventes:</strong> Promo si pas de vente depuis X jours</li>
                    <li>• <strong>Concurrence:</strong> Alignement automatique</li>
                  </ul>
                </div>

                {rules.length === 0 && !showCreateRule ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Aucune règle configurée</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rules.map((rule) => (
                      <div key={rule.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{rule.rule_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {rule.trigger_type} • {rule.is_active ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{rule.execution_count} exécutions</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Promotions Planifiées</CardTitle>
                <CardDescription>Calendrier de vos promotions futures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Aucune promotion planifiée</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance des Promotions</CardTitle>
                <CardDescription>Analysez l'impact de vos campagnes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Les statistiques de performance apparaîtront ici après vos premières campagnes
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
