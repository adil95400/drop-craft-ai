import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { 
  Search, TrendingUp, Globe, Star, Filter, Download, Eye, Heart, 
  Package, Truck, DollarSign, Flame, RotateCcw, Calculator,
  ArrowUpDown, Zap, ShoppingCart, BarChart3, X
} from 'lucide-react'
import { useSupplierDiscovery, type DiscoveryProduct } from '@/hooks/useSupplierDiscovery'
import { cn } from '@/lib/utils'

// ─── Winning Score Badge ─────────────────────────────────────
function WinningBadge({ score }: { score: number }) {
  if (score >= 80) return (
    <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 gap-1">
      <Flame className="h-3 w-3" /> Winner {score}
    </Badge>
  );
  if (score >= 60) return (
    <Badge variant="default" className="gap-1">
      <TrendingUp className="h-3 w-3" /> Potentiel {score}
    </Badge>
  );
  if (score >= 40) return (
    <Badge variant="secondary" className="gap-1">
      <BarChart3 className="h-3 w-3" /> Moyen {score}
    </Badge>
  );
  return <Badge variant="outline" className="gap-1">Score {score}</Badge>;
}

// ─── Margin Indicator ────────────────────────────────────────
function MarginBar({ percent }: { percent: number }) {
  const color = percent >= 50 ? 'bg-primary' : percent >= 30 ? 'bg-accent' : percent >= 15 ? 'bg-secondary' : 'bg-destructive';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <span className={cn("text-xs font-bold", percent >= 30 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
        {percent}%
      </span>
    </div>
  );
}

// ─── Profit Calculator Modal ─────────────────────────────────
function ProfitCalculator({ product }: { product: DiscoveryProduct }) {
  const [quantity, setQuantity] = useState(100);
  const [customSell, setCustomSell] = useState(product.selling_price);
  const shippingCost = 2.5;
  const profit = (customSell - product.cost_price - shippingCost) * quantity;
  const margin = customSell > 0 ? ((customSell - product.cost_price - shippingCost) / customSell * 100) : 0;

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Calculator className="h-4 w-4 text-primary" />
        Simulateur de Profit
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <Label className="text-xs text-muted-foreground">Prix de vente</Label>
          <Input 
            type="number" 
            value={customSell} 
            onChange={e => setCustomSell(Number(e.target.value))} 
            className="h-8 mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Quantité</Label>
          <Input 
            type="number" 
            value={quantity} 
            onChange={e => setQuantity(Number(e.target.value))} 
            className="h-8 mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-background rounded">
          <p className="text-xs text-muted-foreground">Coût unitaire</p>
          <p className="font-bold text-sm">{(product.cost_price + shippingCost).toFixed(2)}€</p>
        </div>
        <div className="p-2 bg-background rounded">
          <p className="text-xs text-muted-foreground">Marge nette</p>
          <p className={cn("font-bold text-sm", margin >= 30 ? 'text-emerald-600' : 'text-amber-600')}>{margin.toFixed(1)}%</p>
        </div>
        <div className="p-2 bg-background rounded">
          <p className="text-xs text-muted-foreground">Profit total</p>
          <p className={cn("font-bold text-sm", profit > 0 ? 'text-emerald-600' : 'text-destructive')}>{profit.toFixed(2)}€</p>
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ────────────────────────────────────────────
function ProductCard({ product, onImport, isImporting }: {
  product: DiscoveryProduct;
  onImport: (p: DiscoveryProduct) => void;
  isImporting: boolean;
}) {
  const [showCalc, setShowCalc] = useState(false);

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-44 object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-44 bg-muted flex items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <WinningBadge score={product.winning_score} />
        </div>
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs">
            {product.source_platform}
          </Badge>
        </div>
        {product.stock_quantity <= 0 && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="destructive">Rupture de stock</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{product.title}</h3>
        
        {/* Price grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Coût</p>
            <p className="font-bold">{product.cost_price.toFixed(2)}€</p>
          </div>
          <div>
            <p className="text-muted-foreground">Vente</p>
            <p className="font-bold text-primary">{product.selling_price.toFixed(2)}€</p>
          </div>
          <div>
            <p className="text-muted-foreground">Profit</p>
            <p className="font-bold text-emerald-600 dark:text-emerald-400">
              {(product.selling_price - product.cost_price).toFixed(2)}€
            </p>
          </div>
        </div>

        {/* Margin bar */}
        <MarginBar percent={product.margin_percent} />

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {product.rating}
          </span>
          <span className="flex items-center gap-1">
            <Truck className="h-3 w-3" />
            {product.shipping_time_days}j
          </span>
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {product.stock_quantity > 0 ? `${product.stock_quantity}` : 'Rupture'}
          </span>
        </div>

        <Separator />

        {/* Calculator toggle */}
        {showCalc && <ProfitCalculator product={product} />}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 gap-1"
            onClick={() => onImport(product)}
            disabled={isImporting || product.is_imported}
          >
            {product.is_imported ? (
              <>Importé</>
            ) : (
              <><Download className="h-3.5 w-3.5" /> Importer</>
            )}
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            className="h-8 w-8"
            onClick={() => setShowCalc(!showCalc)}
          >
            <Calculator className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function ProductSourcingHub() {
  const {
    products, isLoading, filters, updateFilter, resetFilters,
    categories, platformList, stats, importProduct, isImporting
  } = useSupplierDiscovery();

  const [showFilters, setShowFilters] = useState(false);

  const FilterPanel = () => (
    <div className="space-y-5">
      {/* Platform */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plateforme</Label>
        <Select value={filters.platform} onValueChange={v => updateFilter('platform', v)}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {platformList.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Catégorie</Label>
        <Select value={filters.category} onValueChange={v => updateFilter('category', v)}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Min Margin */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Marge min: {filters.minMargin}%
        </Label>
        <Slider 
          value={[filters.minMargin]} 
          onValueChange={([v]) => updateFilter('minMargin', v)} 
          min={0} max={80} step={5} 
          className="mt-2"
        />
      </div>

      {/* Max Price */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Prix max: {filters.maxPrice < 9999 ? `${filters.maxPrice}€` : '∞'}
        </Label>
        <Slider 
          value={[filters.maxPrice]} 
          onValueChange={([v]) => updateFilter('maxPrice', v)} 
          min={1} max={500} step={5} 
          className="mt-2"
        />
      </div>

      {/* Min Rating */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Note min: {filters.minRating > 0 ? `${filters.minRating}★` : 'Toutes'}
        </Label>
        <Slider 
          value={[filters.minRating]} 
          onValueChange={([v]) => updateFilter('minRating', v)} 
          min={0} max={5} step={0.5} 
          className="mt-2"
        />
      </div>

      {/* In Stock */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">En stock uniquement</Label>
        <Switch checked={filters.inStock} onCheckedChange={v => updateFilter('inStock', v)} />
      </div>

      <Button variant="ghost" size="sm" className="w-full gap-2" onClick={resetFilters}>
        <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
      </Button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Supplier Discovery Hub - ShopOpti</title>
        <meta name="description" content="Découvrez les meilleurs produits gagnants depuis AliExpress, CJ, Alibaba et plus. Calculateur de profit intégré." />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Supplier Discovery Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Trouvez les produits gagnants depuis {stats.suppliers} fournisseurs
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Produits</p>
                <p className="text-xl font-bold">{stats.totalProducts}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Marge moy.</p>
                <p className="text-xl font-bold">{stats.avgMargin}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Winners</p>
                <p className="text-xl font-bold">{stats.winningProducts}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fournisseurs</p>
                <p className="text-xl font-bold">{stats.suppliers}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search + Sort + Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher produits, fournisseurs, catégories..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10 h-10"
                />
                {filters.search && (
                  <Button 
                    variant="ghost" size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => updateFilter('search', '')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <Select value={filters.sortBy} onValueChange={(v: any) => updateFilter('sortBy', v)}>
                <SelectTrigger className="w-[200px] h-10">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="winning_score">🔥 Score Winner</SelectItem>
                  <SelectItem value="margin">💰 Meilleure marge</SelectItem>
                  <SelectItem value="price_asc">↗️ Prix croissant</SelectItem>
                  <SelectItem value="price_desc">↘️ Prix décroissant</SelectItem>
                  <SelectItem value="rating">⭐ Meilleures notes</SelectItem>
                  <SelectItem value="newest">🆕 Plus récents</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile filter sheet */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 sm:hidden">
                    <Filter className="h-4 w-4" /> Filtres
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Filtres</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active filter badges */}
            {(filters.platform !== 'all' || filters.category !== 'all' || filters.minMargin > 0 || filters.inStock) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.platform !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.platform}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('platform', 'all')} />
                  </Badge>
                )}
                {filters.category !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.category}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('category', 'all')} />
                  </Badge>
                )}
                {filters.minMargin > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    Marge ≥ {filters.minMargin}%
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('minMargin', 0)} />
                  </Badge>
                )}
                {filters.inStock && (
                  <Badge variant="secondary" className="gap-1">
                    En stock
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('inStock', false)} />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main content: sidebar filters + grid */}
        <div className="flex gap-6">
          {/* Desktop filter sidebar */}
          <div className="hidden sm:block w-56 shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filtres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilterPanel />
              </CardContent>
            </Card>
          </div>

          {/* Product grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {products.length} produit{products.length !== 1 ? 's' : ''} trouvé{products.length !== 1 ? 's' : ''}
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-44 w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onImport={importProduct}
                    isImporting={isImporting}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground mb-4">
                    Ajoutez des produits fournisseurs ou ajustez vos filtres
                  </p>
                  <Button variant="outline" onClick={resetFilters}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Réinitialiser les filtres
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
