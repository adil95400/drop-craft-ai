import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Heart, Star, Eye, Package, Layers, ArrowRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type WidgetType = 'similar' | 'bought_together' | 'bundle' | 'upsell';
type LayoutType = 'grid' | 'carousel' | 'compact';

const DEMO_PRODUCTS = [
  { id: '1', name: 'Casque Bluetooth Pro', price: 79.99, oldPrice: 99.99, image: '🎧', rating: 4.7, reviews: 234 },
  { id: '2', name: 'Étui de Protection', price: 19.99, image: '📱', rating: 4.5, reviews: 128 },
  { id: '3', name: 'Câble USB-C Premium', price: 12.99, image: '🔌', rating: 4.8, reviews: 89 },
  { id: '4', name: 'Support Bureau Alu', price: 34.99, oldPrice: 44.99, image: '🖥️', rating: 4.6, reviews: 167 },
];

const WIDGET_CONFIGS: Record<WidgetType, { title: string; subtitle: string; badge: string }> = {
  similar: { title: 'Produits similaires', subtitle: 'Vous pourriez aussi aimer', badge: 'Similaire' },
  bought_together: { title: 'Fréquemment achetés ensemble', subtitle: 'Les clients ayant acheté cet article ont aussi acheté', badge: 'Populaire' },
  bundle: { title: 'Offres groupées', subtitle: 'Économisez en achetant ensemble', badge: 'Bundle' },
  upsell: { title: 'Version premium', subtitle: 'Améliorez votre choix', badge: 'Upgrade' },
};

interface ProductCardProps {
  product: typeof DEMO_PRODUCTS[0];
  layout: LayoutType;
  showBadge?: string;
}

function ProductCard({ product, layout, showBadge }: ProductCardProps) {
  if (layout === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer bg-card">
        <div className="text-3xl shrink-0 w-12 h-12 flex items-center justify-center rounded-md bg-muted">{product.image}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{product.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold text-primary">{product.price} €</span>
            {product.oldPrice && <span className="text-xs text-muted-foreground line-through">{product.oldPrice} €</span>}
          </div>
        </div>
        <Button size="sm" variant="ghost" className="shrink-0"><Plus className="h-4 w-4" /></Button>
      </div>
    );
  }

  return (
    <div className="group rounded-xl border border-border/60 overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer bg-card">
      <div className="relative bg-muted/30 p-6 flex items-center justify-center">
        <span className="text-5xl">{product.image}</span>
        {showBadge && (
          <Badge className="absolute top-2 left-2 text-[10px]">{showBadge}</Badge>
        )}
        <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-2 mb-1">{product.name}</p>
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-xs text-muted-foreground">{product.rating} ({product.reviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">{product.price} €</span>
            {product.oldPrice && <span className="text-xs text-muted-foreground line-through">{product.oldPrice} €</span>}
          </div>
          <Button size="sm" variant="secondary" className="h-7 text-xs">
            <ShoppingCart className="h-3 w-3 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}

function BoughtTogetherPreview() {
  const products = DEMO_PRODUCTS.slice(0, 3);
  const totalPrice = products.reduce((a, p) => a + p.price, 0);
  const bundlePrice = totalPrice * 0.85;
  
  return (
    <div className="p-6 rounded-xl border-2 border-dashed border-primary/20 bg-primary/[0.02]">
      <h3 className="font-semibold mb-1">Fréquemment achetés ensemble</h3>
      <p className="text-sm text-muted-foreground mb-4">Les clients ayant acheté cet article ont aussi acheté</p>
      <div className="flex items-center gap-3 flex-wrap">
        {products.map((p, i) => (
          <React.Fragment key={p.id}>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card border border-border/50 w-28">
              <span className="text-3xl">{p.image}</span>
              <p className="text-xs text-center font-medium line-clamp-2">{p.name}</p>
              <span className="text-xs font-bold text-primary">{p.price} €</span>
            </div>
            {i < products.length - 1 && <Plus className="h-5 w-5 text-muted-foreground shrink-0" />}
          </React.Fragment>
        ))}
        <div className="flex flex-col items-center gap-2 ml-4 pl-4 border-l">
          <p className="text-xs text-muted-foreground line-through">{totalPrice.toFixed(2)} €</p>
          <p className="text-lg font-bold text-primary">{bundlePrice.toFixed(2)} €</p>
          <Badge variant="secondary" className="text-[10px]">-15%</Badge>
          <Button size="sm" className="mt-1">
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            Ajouter les 3
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StorefrontWidgetPreview() {
  const [widgetType, setWidgetType] = useState<WidgetType>('similar');
  const [layout, setLayout] = useState<LayoutType>('grid');

  const config = WIDGET_CONFIGS[widgetType];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={widgetType} onValueChange={(v) => setWidgetType(v as WidgetType)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="similar">Produits similaires</SelectItem>
            <SelectItem value="bought_together">Achetés ensemble</SelectItem>
            <SelectItem value="bundle">Offres groupées</SelectItem>
            <SelectItem value="upsell">Up-sell / Premium</SelectItem>
          </SelectContent>
        </Select>

        {widgetType !== 'bought_together' && (
          <Select value={layout} onValueChange={(v) => setLayout(v as LayoutType)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grille</SelectItem>
              <SelectItem value="carousel">Carrousel</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Badge variant="outline" className="ml-auto">
          <Eye className="h-3 w-3 mr-1" />
          Aperçu en direct
        </Badge>
      </div>

      {/* Preview */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-muted/50 to-muted/30 px-4 py-2 border-b">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
            </div>
            <span className="ml-2">votre-boutique.com/produit/casque-premium</span>
          </div>
        </div>
        <CardContent className="p-6">
          {widgetType === 'bought_together' ? (
            <BoughtTogetherPreview />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{config.title}</h3>
                  <p className="text-sm text-muted-foreground">{config.subtitle}</p>
                </div>
                {layout !== 'compact' && (
                  <Button variant="ghost" size="sm" className="text-primary">
                    Voir tout <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
              <div className={cn(
                layout === 'grid' && 'grid grid-cols-2 md:grid-cols-4 gap-4',
                layout === 'carousel' && 'flex gap-4 overflow-x-auto pb-2 snap-x',
                layout === 'compact' && 'flex flex-col gap-2 max-w-md'
              )}>
                {DEMO_PRODUCTS.map((product) => (
                  <div key={product.id} className={cn(layout === 'carousel' && 'shrink-0 w-48 snap-start')}>
                    <ProductCard product={product} layout={layout} showBadge={config.badge} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
