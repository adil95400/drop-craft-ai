/**
 * ToProcessPage - Backlog intelligent (Version simplifiée)
 */
import { useState, useMemo } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, CheckCircle, Zap, Filter, ArrowUpDown, Package } from 'lucide-react';
import { useProductsUnified } from '@/hooks/unified';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function ToProcessPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'actions' | 'opportunities'>('all');
  const { products, isLoading } = useProductsUnified();
  
  // Compter les produits par catégorie avec les bons noms de propriétés
  const counts = useMemo(() => {
    if (!products) return { actions: 0, opportunities: 0, total: 0 };
    
    const actions = products.filter(p => (p.stock_quantity || 0) < 5).length;
    const opportunities = products.filter(p => (p.profit_margin || 0) < 15).length;
    
    return { actions, opportunities, total: actions + opportunities };
  }, [products]);

  // Filtrer les produits selon l'onglet
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(p => {
      const isAction = (p.stock_quantity || 0) < 5;
      const isOpportunity = (p.profit_margin || 0) < 15;
      
      if (activeTab === 'actions') return isAction;
      if (activeTab === 'opportunities') return isOpportunity && !isAction;
      return isAction || isOpportunity;
    }).sort((a, b) => (a.stock_quantity || 0) - (b.stock_quantity || 0));
  }, [products, activeTab]);

  return (
    <ChannablePageWrapper
      title="À traiter"
      subtitle="Backlog intelligent"
      description="Actions requises et opportunités triées par priorité IA"
      heroImage="products"
      badge={{ label: `${counts.total} produits`, variant: 'secondary' }}
      actions={
        <Button onClick={() => {}}>
          <Zap className="h-4 w-4 mr-2" />
          Traiter en masse
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={cn("cursor-pointer transition-all hover:shadow-md", activeTab === 'all' && "ring-2 ring-primary")} onClick={() => setActiveTab('all')}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted"><Filter className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="text-2xl font-bold">{counts.total}</p>
                <p className="text-sm text-muted-foreground">Total à traiter</p>
              </div>
            </CardContent>
          </Card>

          <Card className={cn("cursor-pointer transition-all hover:shadow-md", activeTab === 'actions' && "ring-2 ring-destructive")} onClick={() => setActiveTab('actions')}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10"><AlertCircle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-2xl font-bold text-destructive">{counts.actions}</p>
                <p className="text-sm text-muted-foreground">Actions requises</p>
              </div>
              <Badge variant="destructive" className="ml-auto">⚠️</Badge>
            </CardContent>
          </Card>

          <Card className={cn("cursor-pointer transition-all hover:shadow-md", activeTab === 'opportunities' && "ring-2 ring-amber-500")} onClick={() => setActiveTab('opportunities')}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{counts.opportunities}</p>
                <p className="text-sm text-muted-foreground">Opportunités</p>
              </div>
              <Badge className="ml-auto bg-amber-500">💰</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Liste des produits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Produits à traiter</CardTitle>
            <Button variant="outline" size="sm"><ArrowUpDown className="h-4 w-4 mr-2" />Tri IA</Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Tout est en ordre !</h3>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.slice(0, 10).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <Package className="h-6 w-6 m-3 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-medium line-clamp-1">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Stock: {product.stock_quantity || 0}</p>
                      </div>
                    </div>
                    <Button size="sm">Traiter</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  );
}
