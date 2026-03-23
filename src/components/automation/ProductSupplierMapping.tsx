import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ExternalLink, Link2, Link2Off, Package, Search,
  CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ProductSupplierMapping() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

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
        .limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  // Products without mapping
  const { data: unmappedProducts } = useQuery({
    queryKey: ['unmapped-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Get product IDs that have mappings
      const { data: mapped } = await supabase
        .from('supplier_products')
        .select('product_id')
        .eq('user_id', user.id)
        .not('product_id', 'is', null);
      const mappedIds = (mapped || []).map((m: any) => m.product_id).filter(Boolean);

      let query = supabase
        .from('products')
        .select('id, title, price, status, image_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (mappedIds.length > 0) {
        // Use a workaround: fetch all and filter client-side
        const { data } = await query;
        return (data || []).filter((p: any) => !mappedIds.includes(p.id));
      }
      const { data } = await query;
      return data || [];
    },
    enabled: !!user,
  });

  const filtered = (mappings || []).filter((m: any) =>
    !search || m.title?.toLowerCase().includes(search.toLowerCase()) ||
    (m.products as any)?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: mappings?.length || 0,
    linked: mappings?.filter((m: any) => m.product_id).length || 0,
    unlinked: mappings?.filter((m: any) => !m.product_id).length || 0,
    outOfStock: mappings?.filter((m: any) => (m.stock_quantity || 0) === 0).length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={<Link2 className="h-4 w-4" />} label="Mappings total" value={stats.total} />
        <MiniStat icon={<CheckCircle2 className="h-4 w-4 text-primary" />} label="Liés à un produit" value={stats.linked} />
        <MiniStat icon={<Link2Off className="h-4 w-4 text-yellow-500" />} label="Non liés" value={stats.unlinked} />
        <MiniStat icon={<XCircle className="h-4 w-4 text-destructive" />} label="Rupture fournisseur" value={stats.outOfStock} />
      </div>

      {/* Unmapped products warning */}
      {(unmappedProducts?.length || 0) > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-sm">
              <Link2Off className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{unmappedProducts?.length} produit(s) sans fournisseur associé</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {unmappedProducts?.slice(0, 5).map((p: any) => (
                <Badge key={p.id} variant="outline" className="text-xs">
                  {p.title?.substring(0, 30)}
                </Badge>
              ))}
              {(unmappedProducts?.length || 0) > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{(unmappedProducts?.length || 0) - 5} autres
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un mapping..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Mapping list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Associations Produit ↔ Fournisseur
          </CardTitle>
          <CardDescription>{filtered.length} mapping(s) trouvé(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filtered.map((mapping: any) => {
              const product = mapping.products;
              const supplier = mapping.suppliers;
              const isLinked = !!mapping.product_id;
              const isOutOfStock = (mapping.stock_quantity || 0) === 0;
              const marginPercent = product?.price && mapping.cost_price
                ? (((product.price - mapping.cost_price) / product.price) * 100).toFixed(1)
                : null;

              return (
                <div
                  key={mapping.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isOutOfStock ? 'border-destructive/30 bg-destructive/5' :
                    !isLinked ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-border hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Supplier product */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {supplier?.platform || supplier?.name || 'Fournisseur'}
                        </Badge>
                        {isOutOfStock && <Badge variant="destructive" className="text-[10px]">Rupture</Badge>}
                      </div>
                      <p className="text-sm font-medium truncate">{mapping.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Coût: {mapping.cost_price?.toFixed(2) || '—'} €</span>
                        <span>Stock: {mapping.stock_quantity ?? '—'}</span>
                        {mapping.last_synced_at && (
                          <span>Sync: {formatDistanceToNow(new Date(mapping.last_synced_at), { addSuffix: true, locale: fr })}</span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className={`h-5 w-5 shrink-0 ${isLinked ? 'text-primary' : 'text-muted-foreground/30'}`} />

                    {/* Linked product */}
                    <div className="flex-1 min-w-0">
                      {isLinked && product ? (
                        <>
                          <p className="text-sm font-medium truncate">{product.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>Prix: {product.price?.toFixed(2) || '—'} €</span>
                            {marginPercent && (
                              <span className={+marginPercent > 20 ? 'text-primary' : +marginPercent < 10 ? 'text-destructive' : ''}>
                                Marge: {marginPercent}%
                              </span>
                            )}
                            <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                              {product.status}
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Non associé à un produit</p>
                      )}
                    </div>

                    {/* External link */}
                    {mapping.source_url && (
                      <a
                        href={mapping.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-muted-foreground hover:text-primary transition"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucun mapping trouvé</p>
                <p className="text-xs mt-1">Les mappings sont créés lors de l'import depuis vos fournisseurs</p>
              </div>
            )}
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
