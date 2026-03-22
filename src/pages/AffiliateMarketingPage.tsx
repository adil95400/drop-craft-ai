import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Users, Link2, DollarSign, TrendingUp, Award, BarChart3,
  Copy, Search, ArrowUpRight, Loader2, MousePointerClick, Percent
} from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { useAffiliateProgram } from '@/hooks/useAffiliateProgram';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const AffiliateMarketingPage: React.FC = () => {
  const { affiliates, stats, isLoading } = useAffiliateProgram();
  const { t: tPages } = useTranslation('pages');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAffiliates = affiliates.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const topPerformers = [...affiliates].sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 5);
  const pieData = topPerformers.map(a => ({ name: a.name, value: a.total_revenue }));
  const barData = topPerformers.map(a => ({ name: a.name.split(' ')[0], revenue: a.total_revenue, commission: a.total_commission, sales: a.total_sales }));

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié !');
  };

  return (
    <>
      <Helmet>
        <title>Marketing d'Affiliation — Drop-Craft AI</title>
        <meta name="description" content="Gérez votre programme d'affiliés, suivez les performances et les commissions en temps réel." />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('marketingDAffiliation.title')}
        subtitle={tPages('marketing.title')}
        description="Gérez votre programme d'affiliés et suivez les performances en temps réel"
        heroImage="marketing"
        badge={{ label: "Affiliates", icon: Users }}
      >
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.affiliate} />

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {[
            { label: 'Affiliés', value: stats.totalAffiliates, icon: Users, color: 'text-primary' },
            { label: 'Actifs', value: stats.activeAffiliates, icon: TrendingUp, color: 'text-success' },
            { label: 'Revenu généré', value: `${stats.totalRevenue.toLocaleString('fr-FR')}€`, icon: DollarSign, color: 'text-chart-2' },
            { label: 'Commissions', value: `${stats.totalCommissions.toLocaleString('fr-FR')}€`, icon: Award, color: 'text-warning' },
            { label: 'Clics totaux', value: stats.totalClicks.toLocaleString('fr-FR'), icon: MousePointerClick, color: 'text-info' },
            { label: 'Taux conv.', value: `${stats.avgConversionRate.toFixed(1)}%`, icon: Percent, color: 'text-chart-4' },
          ].map(kpi => (
            <Card key={kpi.label} className="p-4">
              <div className="flex items-center gap-3">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mt-1" />
                  ) : (
                    <p className="text-xl font-bold">{kpi.value}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="affiliates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="affiliates">Affiliés ({affiliates.length})</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          {/* Affiliates List */}
          <TabsContent value="affiliates" className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un affilié..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'active', 'pending'].map(s => (
                  <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)}>
                    {s === 'all' ? 'Tous' : s === 'active' ? 'Actifs' : 'En attente'}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </Card>
                ))}
              </div>
            ) : filteredAffiliates.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">Aucun affilié trouvé</p>
                <p className="text-muted-foreground">
                  Les clients avec des sources de référence apparaîtront ici automatiquement.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredAffiliates.map((affiliate) => (
                  <Card key={affiliate.id} className="p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{affiliate.name}</h3>
                            <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                              {affiliate.status === 'active' ? 'Actif' : 'En attente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{affiliate.email}</p>
                        </div>
                      </div>

                      <div className="hidden md:flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm font-semibold">{affiliate.total_sales}</p>
                          <p className="text-xs text-muted-foreground">Ventes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold">{affiliate.total_revenue.toLocaleString('fr-FR')}€</p>
                          <p className="text-xs text-muted-foreground">Revenu</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold">{affiliate.total_commission.toLocaleString('fr-FR')}€</p>
                          <p className="text-xs text-muted-foreground">Commission</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold">{affiliate.conversion_rate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Conv.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => copyCode(affiliate.referral_code)}>
                          <Copy className="h-3 w-3" />
                          {affiliate.referral_code}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Performance Charts */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenu par affilié (Top 5)</CardTitle>
                </CardHeader>
                <CardContent>
                  {topPerformers.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                          formatter={(value: number) => `${value.toLocaleString('fr-FR')}€`}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenu" />
                        <Bar dataKey="commission" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Commission" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Répartition du revenu</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }: any) => `${name} (${((percent as number) * 100).toFixed(0)}%)`}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR')}€`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top performer card */}
            {stats.topPerformer && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Meilleur affilié</p>
                      <p className="text-lg font-bold">{stats.topPerformer.name}</p>
                    </div>
                    <div className="ml-auto flex gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{stats.topPerformer.total_revenue.toLocaleString('fr-FR')}€</p>
                        <p className="text-xs text-muted-foreground">Revenu total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{stats.topPerformer.total_sales}</p>
                        <p className="text-xs text-muted-foreground">Ventes</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Commissions */}
          <TabsContent value="commissions" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Structure de commissions</CardTitle>
                  <CardDescription>Taux appliqués par palier de performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { range: '0-10 ventes/mois', rate: '10%', color: 'text-muted-foreground' },
                    { range: '11-50 ventes/mois', rate: '12%', color: 'text-chart-2' },
                    { range: '51-100 ventes/mois', rate: '15%', color: 'text-primary' },
                    { range: '100+ ventes/mois', rate: '20%', color: 'text-success' },
                  ].map(tier => (
                    <div key={tier.range} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">{tier.range}</span>
                      <Badge variant="outline" className={tier.color}>{tier.rate}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Résumé des commissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-4">
                    <p className="text-4xl font-bold text-primary">{stats.totalCommissions.toLocaleString('fr-FR')}€</p>
                    <p className="text-sm text-muted-foreground mt-1">Commissions totales</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-lg font-bold">{stats.activeAffiliates}</p>
                      <p className="text-xs text-muted-foreground">Affiliés éligibles</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-lg font-bold">30j</p>
                      <p className="text-xs text-muted-foreground">Cookie tracking</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du programme</CardTitle>
                <CardDescription>Configuration du programme d'affiliation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Commission par défaut</h4>
                    <p className="text-3xl font-bold text-primary">10%</p>
                    <p className="text-sm text-muted-foreground mt-1">Sur chaque vente validée</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Durée du cookie</h4>
                    <p className="text-3xl font-bold">30 jours</p>
                    <p className="text-sm text-muted-foreground mt-1">Attribution de la conversion</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Seuil de paiement</h4>
                    <p className="text-3xl font-bold">50€</p>
                    <p className="text-sm text-muted-foreground mt-1">Minimum pour retrait</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Fréquence de paiement</h4>
                    <p className="text-3xl font-bold">Mensuel</p>
                    <p className="text-sm text-muted-foreground mt-1">Le 1er de chaque mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
};

export default AffiliateMarketingPage;
