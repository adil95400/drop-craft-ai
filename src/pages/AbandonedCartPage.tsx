import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart, Mail, DollarSign, TrendingUp, Clock,
  Target, CheckCircle, XCircle, Send, Filter, BarChart3
} from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useAbandonedCarts } from '@/hooks/useAbandonedCarts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const AbandonedCartPage: React.FC = () => {
  const { carts, isLoading, stats, sendRecoveryEmail, isSending, markRecovered, dismissCart } = useAbandonedCarts();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCarts = carts.filter(c => {
    const matchSearch = !search || c.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      (c.customer_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.recovery_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-warning border-orange-300">En attente</Badge>;
      case 'contacted': return <Badge variant="outline" className="text-info border-blue-300">Contacté</Badge>;
      case 'recovered': return <Badge className="bg-green-500 text-white">Récupéré</Badge>;
      case 'dismissed': return <Badge variant="secondary">Ignoré</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Paniers Abandonnés — Drop-Craft AI</title>
        <meta name="description" content="Récupérez les ventes perdues avec des campagnes de relance automatiques." />
      </Helmet>

      <ChannablePageWrapper
        title="Paniers Abandonnés"
        subtitle="Marketing"
        description="Récupérez les ventes perdues avec des campagnes automatiques"
        heroImage="marketing"
        badge={{ label: "Recovery", icon: ShoppingCart }}
      >
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Paniers abandonnés</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Valeur perdue</p>
                <p className="text-2xl font-bold">{stats.totalValue.toLocaleString('fr-FR')}€</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Récupérés</p>
                <p className="text-2xl font-bold">{stats.recovered}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Taux de récupération</p>
                <p className="text-2xl font-bold">{stats.recoveryRate}%</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="carts" className="w-full">
          <TabsList>
            <TabsTrigger value="carts">Paniers ({stats.total})</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="carts" className="mt-6 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                placeholder="Rechercher par email ou nom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex gap-2">
                {['all', 'pending', 'contacted', 'recovered'].map(s => (
                  <Button
                    key={s}
                    size="sm"
                    variant={statusFilter === s ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === 'all' ? 'Tous' : s === 'pending' ? 'En attente' : s === 'contacted' ? 'Contactés' : 'Récupérés'}
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
            ) : filteredCarts.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">Aucun panier abandonné</p>
                <p className="text-muted-foreground">
                  Les paniers non finalisés apparaîtront ici automatiquement
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredCarts.map(cart => (
                  <Card key={cart.id} className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold truncate">
                            {cart.customer_name || cart.customer_email}
                          </h3>
                          {getStatusBadge(cart.recovery_status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{cart.customer_email}</span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="h-3 w-3" />
                            {Array.isArray(cart.cart_items) ? cart.cart_items.length : 0} article(s)
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(cart.abandoned_at), { addSuffix: true, locale: fr })}
                          </span>
                          {cart.recovery_attempts > 0 && (
                            <span>{cart.recovery_attempts} relance(s)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold whitespace-nowrap">
                          {Number(cart.cart_value).toLocaleString('fr-FR')}€
                        </span>
                        {cart.recovery_status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => sendRecoveryEmail(cart.id)}
                            disabled={isSending}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Relancer
                          </Button>
                        )}
                        {cart.recovery_status === 'contacted' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => markRecovered(cart.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Récupéré
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => dismissCart(cart.id)}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Répartition par statut</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'En attente', count: stats.pending, color: 'bg-orange-500' },
                    { label: 'Contactés', count: stats.contacted, color: 'bg-blue-500' },
                    { label: 'Récupérés', count: stats.recovered, color: 'bg-green-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Valeur récupérée</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <p className="text-4xl font-bold text-success">
                      {stats.recoveredValue.toLocaleString('fr-FR')}€
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      sur {stats.totalValue.toLocaleString('fr-FR')}€ de valeur abandonnée
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
};

export default AbandonedCartPage;
