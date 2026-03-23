import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowRight, Award, CheckCircle2, Crown, ExternalLink, Link2, Link2Off,
  Lock, Package, Plus, Search, Shield, Star, TrendingDown, TrendingUp,
  Truck, XCircle, Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SupplierScore {
  supplierId: string;
  score: number;
  priceScore: number;
  stockScore: number;
  reliabilityScore: number;
  isOptimal: boolean;
}

export function ProductSupplierMapping() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'mapped' | 'unmapped' | 'multi' | 'stockout'>('all');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // Fetch supplier_products with their linked products
  const { data: mappings, isLoading } = useQuery({
    queryKey: ['supplier-mappings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('supplier_products')
        .select(`
          *,
          products:product_id (id, title, price, status, image_url),
          suppliers:supplier_id (id, name, platform)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!user,
  });

  // Products without mapping
  const { data: unmappedProducts } = useQuery({
    queryKey: ['unmapped-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: mapped } = await supabase
        .from('supplier_products')
        .select('product_id')
        .eq('user_id', user.id)
        .not('product_id', 'is', null);
      const mappedIds = (mapped || []).map((m: any) => m.product_id).filter(Boolean);

      const { data } = await supabase
        .from('products')
        .select('id, title, price, status, image_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      return (data || []).filter((p: any) => !mappedIds.includes(p.id));
    },
    enabled: !!user,
  });

  // Fallback rules
  const { data: fallbackRules } = useQuery({
    queryKey: ['fallback-rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await (supabase.from('supplier_fallback_rules') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Group mappings by product_id for multi-supplier view
  const productGroups = (mappings || []).reduce((acc: Record<string, any[]>, m: any) => {
    const key = m.product_id || `orphan-${m.id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  // Toggle primary supplier
  const togglePrimaryMutation = useMutation({
    mutationFn: async ({ productId, supplierProductId }: { productId: string; supplierProductId: string }) => {
      // Demote all others
      await (supabase.from('supplier_products') as any)
        .update({ is_primary: false })
        .eq('product_id', productId)
        .eq('user_id', user!.id);
      // Promote selected
      await (supabase.from('supplier_products') as any)
        .update({ is_primary: true })
        .eq('id', supplierProductId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-mappings'] });
      toast({ title: 'Fournisseur principal mis à jour' });
    },
  });

  // Lock supplier
  const toggleLockMutation = useMutation({
    mutationFn: async ({ id, locked }: { id: string; locked: boolean }) => {
      await (supabase.from('supplier_products') as any)
        .update({ is_locked: locked })
        .eq('id', id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-mappings'] });
      toast({ title: variables.locked ? 'Fournisseur verrouillé' : 'Verrouillage retiré' });
    },
  });

  const filtered = Object.entries(productGroups).filter(([key, suppliers]: [string, any[]]) => {
    if (filter === 'mapped') return suppliers.some((s: any) => s.product_id);
    if (filter === 'unmapped') return suppliers.every((s: any) => !s.product_id);
    if (filter === 'multi') return suppliers.length > 1;
    if (filter === 'stockout') return suppliers.some((s: any) => (s.stock_quantity || 0) === 0);
    if (search) {
      return suppliers.some((s: any) =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        (s.products as any)?.title?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return true;
  });

  const stats = {
    total: mappings?.length || 0,
    linked: mappings?.filter((m: any) => m.product_id).length || 0,
    unlinked: mappings?.filter((m: any) => !m.product_id).length || 0,
    outOfStock: mappings?.filter((m: any) => (m.stock_quantity || 0) === 0).length || 0,
    multiSupplier: Object.values(productGroups).filter((g: any[]) => g.length > 1).length,
    withFallback: fallbackRules?.filter((r: any) => r.is_active).length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniStat icon={<Link2 className="h-4 w-4" />} label="Total mappings" value={stats.total} />
        <MiniStat icon={<CheckCircle2 className="h-4 w-4 text-primary" />} label="Liés" value={stats.linked} />
        <MiniStat icon={<Link2Off className="h-4 w-4 text-yellow-500" />} label="Non liés" value={stats.unlinked} />
        <MiniStat icon={<XCircle className="h-4 w-4 text-destructive" />} label="Rupture" value={stats.outOfStock} />
        <MiniStat icon={<Zap className="h-4 w-4 text-primary" />} label="Multi-fournisseur" value={stats.multiSupplier} />
        <MiniStat icon={<Shield className="h-4 w-4 text-primary" />} label="Règles fallback" value={stats.withFallback} />
      </div>

      {/* Unmapped warning */}
      {(unmappedProducts?.length || 0) > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-sm">
              <Link2Off className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{unmappedProducts?.length} produit(s) sans fournisseur</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {unmappedProducts?.slice(0, 5).map((p: any) => (
                <Badge key={p.id} variant="outline" className="text-xs">
                  {p.title?.substring(0, 30)}
                </Badge>
              ))}
              {(unmappedProducts?.length || 0) > 5 && (
                <Badge variant="secondary" className="text-xs">+{(unmappedProducts?.length || 0) - 5}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="mapped">Liés</SelectItem>
            <SelectItem value="unmapped">Non liés</SelectItem>
            <SelectItem value="multi">Multi-fournisseur</SelectItem>
            <SelectItem value="stockout">Rupture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mapping list grouped by product */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Mapping Produit ↔ Fournisseurs
          </CardTitle>
          <CardDescription>
            {filtered.length} groupe(s) • Multi-fournisseurs avec sélection automatique du meilleur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filtered.map(([productId, suppliers]: [string, any[]]) => {
              const catalogProduct = suppliers[0]?.products;
              const isMulti = suppliers.length > 1;
              const primary = suppliers.find((s: any) => s.is_primary) || suppliers[0];
              const hasStockout = suppliers.some((s: any) => (s.stock_quantity || 0) === 0);
              const bestPrice = Math.min(...suppliers.map((s: any) => s.price || Infinity));

              return (
                <div key={productId} className={`rounded-lg border p-4 space-y-3 ${
                  hasStockout ? 'border-destructive/30 bg-destructive/5' :
                  isMulti ? 'border-primary/20 bg-primary/5' :
                  'border-border'
                }`}>
                  {/* Product header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {catalogProduct ? (
                        <>
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                            {catalogProduct.image_url ? (
                              <img src={catalogProduct.image_url} className="w-8 h-8 rounded object-cover" alt="" />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{catalogProduct.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Prix vente: {catalogProduct.price?.toFixed(2)}€</span>
                              <Badge variant={catalogProduct.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                {catalogProduct.status}
                              </Badge>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Produit non lié au catalogue</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isMulti && (
                        <Badge variant="outline" className="text-primary border-primary/30">
                          <Zap className="h-3 w-3 mr-1" />
                          {suppliers.length} fournisseurs
                        </Badge>
                      )}
                      {hasStockout && (
                        <Badge variant="destructive" className="text-[10px]">Rupture</Badge>
                      )}
                    </div>
                  </div>

                  {/* Supplier rows */}
                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    {suppliers
                      .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.priority || 99) - (b.priority || 99))
                      .map((sp: any) => {
                        const supplier = sp.suppliers;
                        const isOutOfStock = (sp.stock_quantity || 0) === 0;
                        const isPrimary = sp.is_primary;
                        const isLocked = sp.is_locked;
                        const isBestPrice = sp.price === bestPrice && suppliers.length > 1;
                        const margin = catalogProduct?.price && sp.cost_price
                          ? ((catalogProduct.price - sp.cost_price) / catalogProduct.price * 100)
                          : null;

                        return (
                          <div key={sp.id} className={`flex items-center gap-3 p-3 rounded-lg transition ${
                            isPrimary ? 'bg-primary/10 border border-primary/20' :
                            isOutOfStock ? 'bg-destructive/5 opacity-60' :
                            'bg-muted/30 hover:bg-muted/50'
                          }`}>
                            {/* Primary indicator */}
                            <div className="shrink-0 w-6">
                              {isPrimary ? (
                                <Crown className="h-4 w-4 text-primary" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                              )}
                            </div>

                            {/* Supplier info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{supplier?.name || supplier?.platform || 'Fournisseur'}</span>
                                {isPrimary && <Badge className="text-[10px]">Principal</Badge>}
                                {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                                {isBestPrice && <Award className="h-3 w-3 text-primary" />}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className={isOutOfStock ? 'text-destructive font-medium' : ''}>
                                  Stock: {sp.stock_quantity ?? '—'}
                                </span>
                                <span>Coût: {sp.cost_price?.toFixed(2) || sp.price?.toFixed(2) || '—'}€</span>
                                {margin !== null && (
                                  <span className={margin > 20 ? 'text-primary' : margin < 10 ? 'text-destructive' : ''}>
                                    Marge: {margin.toFixed(1)}%
                                  </span>
                                )}
                                {sp.last_synced_at && (
                                  <span>Sync: {formatDistanceToNow(new Date(sp.last_synced_at), { addSuffix: true, locale: fr })}</span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              {!isPrimary && catalogProduct && suppliers.length > 1 && (
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => togglePrimaryMutation.mutate({
                                    productId: sp.product_id,
                                    supplierProductId: sp.id,
                                  })}
                                  title="Définir comme principal"
                                  disabled={isOutOfStock}
                                >
                                  <Crown className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => toggleLockMutation.mutate({ id: sp.id, locked: !isLocked })}
                                title={isLocked ? 'Déverrouiller' : 'Verrouiller'}
                              >
                                <Lock className={`h-4 w-4 ${isLocked ? 'text-primary' : 'text-muted-foreground'}`} />
                              </Button>
                              {sp.source_url && (
                                <a href={sp.source_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Optimal supplier indicator */}
                  {isMulti && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pl-4">
                      <Star className="h-3 w-3 text-primary" />
                      <span>
                        Meilleur prix: <strong className="text-foreground">{bestPrice.toFixed(2)}€</strong>
                        {primary && primary.price !== bestPrice && (
                          <span className="text-primary ml-1">
                            (-{((primary.price - bestPrice) / primary.price * 100).toFixed(1)}% possible)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucun mapping trouvé</p>
                <p className="text-xs mt-1">Importez des produits depuis vos fournisseurs pour créer des mappings</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><Crown className="h-3 w-3 text-primary" /> Fournisseur principal</div>
            <div className="flex items-center gap-1"><Lock className="h-3 w-3" /> Verrouillé (pas de switch auto)</div>
            <div className="flex items-center gap-1"><Award className="h-3 w-3 text-primary" /> Meilleur prix</div>
            <div className="flex items-center gap-1"><Shield className="h-3 w-3 text-primary" /> Fallback configuré</div>
            <div className="flex items-center gap-1"><Zap className="h-3 w-3 text-primary" /> Multi-fournisseur</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-3 px-4 flex items-center gap-2">
        {icon}
        <div>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
