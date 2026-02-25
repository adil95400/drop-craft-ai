import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Crown, Shield, Star, Package, Truck, Search, Filter,
  BadgeCheck, TrendingUp, Globe, Award, DollarSign, ArrowUpRight,
  ShoppingCart, Gem, BarChart3,
} from 'lucide-react';

const TIER_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  platinum: { label: 'Platinum', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200', icon: <Crown className="h-4 w-4" /> },
  gold: { label: 'Gold', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: <Award className="h-4 w-4" /> },
  silver: { label: 'Silver', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: <Shield className="h-4 w-4" /> },
  standard: { label: 'Standard', color: 'bg-muted text-muted-foreground', icon: <Package className="h-4 w-4" /> },
};

function getMarginColor(margin: number) {
  if (margin >= 50) return 'text-green-600 dark:text-green-400';
  if (margin >= 30) return 'text-emerald-500 dark:text-emerald-400';
  if (margin >= 15) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-500 dark:text-red-400';
}

function getMarginBadge(margin: number) {
  if (margin >= 50) return { label: 'Haute marge', variant: 'default' as const, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  if (margin >= 30) return { label: 'Bonne marge', variant: 'default' as const, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' };
  if (margin >= 15) return { label: 'Marge moyenne', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
  return { label: 'Marge faible', variant: 'destructive' as const, className: '' };
}

export default function PremiumSuppliersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [marginFilter, setMarginFilter] = useState('all');
  const [catalogSort, setCatalogSort] = useState('margin_desc');

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['premium-suppliers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('is_verified', { ascending: false })
        .order('rating', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch premium catalog products (products with cost_price for margin calculation)
  const { data: catalogProducts = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ['premium-catalog-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, cost_price, currency, category, brand, supplier, image_url, main_image_url, stock_quantity, status, sku')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .not('cost_price', 'is', null)
        .not('price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []).map((p: any) => {
        const margin = p.cost_price > 0 ? ((p.price - p.cost_price) / p.price) * 100 : 0;
        const profit = p.price - (p.cost_price || 0);
        return { ...p, margin: Math.round(margin * 10) / 10, profit: Math.round(profit * 100) / 100 };
      });
    },
    enabled: !!user?.id,
  });

  // Filter suppliers
  const filtered = suppliers.filter((s: any) => {
    const matchesSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.country?.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'all' || s.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  // Filter & sort catalog
  const filteredCatalog = useMemo(() => {
    let result = catalogProducts.filter((p: any) => {
      const matchesSearch = !catalogSearch || p.title?.toLowerCase().includes(catalogSearch.toLowerCase()) || p.brand?.toLowerCase().includes(catalogSearch.toLowerCase()) || p.supplier?.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesMargin = marginFilter === 'all'
        || (marginFilter === 'high' && p.margin >= 50)
        || (marginFilter === 'good' && p.margin >= 30 && p.margin < 50)
        || (marginFilter === 'medium' && p.margin >= 15 && p.margin < 30)
        || (marginFilter === 'low' && p.margin < 15);
      return matchesSearch && matchesMargin;
    });

    result.sort((a: any, b: any) => {
      switch (catalogSort) {
        case 'margin_desc': return b.margin - a.margin;
        case 'margin_asc': return a.margin - b.margin;
        case 'profit_desc': return b.profit - a.profit;
        case 'price_desc': return b.price - a.price;
        default: return b.margin - a.margin;
      }
    });

    return result;
  }, [catalogProducts, catalogSearch, marginFilter, catalogSort]);

  // Stats
  const verified = suppliers.filter((s: any) => s.is_verified);
  const avgRating = verified.length > 0 ? (verified.reduce((sum: number, s: any) => sum + (s.rating || 0), 0) / verified.length).toFixed(1) : '0';
  const avgMargin = catalogProducts.length > 0 ? (catalogProducts.reduce((s: number, p: any) => s + p.margin, 0) / catalogProducts.length).toFixed(1) : '0';
  const highMarginCount = catalogProducts.filter((p: any) => p.margin >= 30).length;

  if (isLoading) {
    return (
      <ChannablePageWrapper title="Fournisseurs Premium" description="Chargement..." heroImage="suppliers" badge={{ label: 'Premium', icon: Crown }}>
        <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
      </ChannablePageWrapper>
    );
  }

  return (
    <ChannablePageWrapper
      title="Fournisseurs Premium"
      description="Fournisseurs vérifiés et catalogue haute marge"
      heroImage="suppliers"
      badge={{ label: 'Premium', icon: Crown }}
    >
      <Tabs defaultValue="suppliers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="suppliers" className="gap-2"><Shield className="h-4 w-4" />Fournisseurs</TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2"><Gem className="h-4 w-4" />Catalogue Premium</TabsTrigger>
        </TabsList>

        {/* ═══ TAB: Fournisseurs ═══ */}
        <TabsContent value="suppliers" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total fournisseurs</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{suppliers.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vérifiés</CardTitle>
                <BadgeCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{verified.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{avgRating}/5</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platinum/Gold</CardTitle>
                <Crown className="h-4 w-4 text-violet-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{suppliers.filter((s: any) => s.tier === 'platinum' || s.tier === 'gold').length}</div></CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un fournisseur..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les tiers</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Supplier Cards */}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun fournisseur trouvé</h3>
                <p className="text-muted-foreground">Ajoutez des fournisseurs depuis la page Fournisseurs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((supplier: any) => {
                const tier = TIER_CONFIG[supplier.tier || 'standard'];
                return (
                  <Card key={supplier.id} className="relative overflow-hidden">
                    {supplier.is_verified && (
                      <div className="absolute top-3 right-3"><BadgeCheck className="h-5 w-5 text-green-500" /></div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {supplier.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{supplier.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={tier.color}>{tier.icon}<span className="ml-1">{tier.label}</span></Badge>
                            {supplier.country && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" />{supplier.country}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {supplier.description && <p className="text-sm text-muted-foreground line-clamp-2">{supplier.description}</p>}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-500" /><span className="font-semibold text-sm">{supplier.rating || '—'}</span></div>
                          <span className="text-xs text-muted-foreground">Note</span>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1"><Truck className="h-3.5 w-3.5 text-blue-500" /><span className="font-semibold text-sm">{supplier.avg_delivery_days ? `${supplier.avg_delivery_days}j` : '—'}</span></div>
                          <span className="text-xs text-muted-foreground">Livraison</span>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-green-500" /><span className="font-semibold text-sm">{supplier.total_orders || 0}</span></div>
                          <span className="text-xs text-muted-foreground">Commandes</span>
                        </div>
                      </div>
                      {supplier.specialties?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {supplier.specialties.slice(0, 3).map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="w-full">Voir le catalogue</Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ TAB: Catalogue Premium ═══ */}
        <TabsContent value="catalog" className="space-y-6">
          {/* Catalog Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produits analysés</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{catalogProducts.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Marge moyenne</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{avgMargin}%</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Haute marge (≥30%)</CardTitle>
                <Gem className="h-4 w-4 text-violet-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{highMarginCount}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit total estimé</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {catalogProducts.reduce((s: number, p: any) => s + p.profit, 0).toFixed(0)}€
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Catalog Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un produit, marque, fournisseur..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={marginFilter} onValueChange={setMarginFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Marge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marges</SelectItem>
                <SelectItem value="high">Haute marge (≥50%)</SelectItem>
                <SelectItem value="good">Bonne marge (30-50%)</SelectItem>
                <SelectItem value="medium">Moyenne (15-30%)</SelectItem>
                <SelectItem value="low">Faible (&lt;15%)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={catalogSort} onValueChange={setCatalogSort}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="margin_desc">Marge ↓</SelectItem>
                <SelectItem value="margin_asc">Marge ↑</SelectItem>
                <SelectItem value="profit_desc">Profit ↓</SelectItem>
                <SelectItem value="price_desc">Prix ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Catalog Products */}
          {isLoadingCatalog ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
            </div>
          ) : filteredCatalog.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gem className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun produit premium trouvé</h3>
                <p className="text-muted-foreground">Importez des produits avec prix d'achat et prix de vente pour analyser les marges</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCatalog.map((product: any) => {
                const marginBadge = getMarginBadge(product.margin);
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        {(product.main_image_url || product.image_url) ? (
                          <img
                            src={product.main_image_url || product.image_url}
                            alt={product.title}
                            className="h-14 w-14 rounded-lg object-cover bg-muted flex-shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">{product.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={marginBadge.className || ''} variant={marginBadge.variant}>
                              {marginBadge.label}
                            </Badge>
                            {product.brand && <span className="text-xs text-muted-foreground">{product.brand}</span>}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Pricing row */}
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-muted-foreground">Coût: </span>
                          <span className="font-medium">{product.cost_price?.toFixed(2)}€</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Vente: </span>
                          <span className="font-semibold">{product.price?.toFixed(2)}€</span>
                        </div>
                      </div>

                      {/* Margin bar */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Marge</span>
                          <span className={`font-bold ${getMarginColor(product.margin)}`}>{product.margin}%</span>
                        </div>
                        <Progress value={Math.min(product.margin, 100)} className="h-2" />
                      </div>

                      {/* Profit */}
                      <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                        <span className="text-muted-foreground">Profit unitaire</span>
                        <span className="font-bold text-green-600 dark:text-green-400">+{product.profit.toFixed(2)}€</span>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {product.supplier && <span>📦 {product.supplier}</span>}
                        {product.category && <span>🏷️ {product.category}</span>}
                        {product.stock_quantity != null && <span>📊 Stock: {product.stock_quantity}</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
