import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, TrendingUp, ShoppingCart, ExternalLink, Import, 
  Eye, Heart, Calculator, Package, Clock, AlertTriangle 
} from 'lucide-react';
import { WinnerProduct } from '@/domains/winners/types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface WinnersProductCardProps {
  product: WinnerProduct;
  onImportProduct: (product: WinnerProduct) => void;
  isImporting?: boolean;
}

export const WinnersProductCard = ({ 
  product, 
  onImportProduct,
  isImporting = false 
}: WinnersProductCardProps) => {
  const [showQuickView, setShowQuickView] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSourceBadge = (source: string) => {
    const sourceMap: Record<string, { label: string; color: string }> = {
      amazon: { label: 'Amazon', color: 'bg-orange-500' },
      aliexpress: { label: 'AliExpress', color: 'bg-red-500' },
      ebay: { label: 'eBay', color: 'bg-blue-500' },
      google_trends: { label: 'Trends', color: 'bg-indigo-500' },
      tiktok: { label: 'TikTok', color: 'bg-black' },
    };
    const normalized = source.toLowerCase().replace('_simulation', '');
    return sourceMap[normalized] || { label: source, color: 'bg-gray-500' };
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(price);
  };

  const calculateProfit = () => {
    const cost = product.estimated_cost || product.price * 0.4;
    const profit = product.price - cost;
    const margin = ((profit / product.price) * 100).toFixed(0);
    return { cost, profit, margin };
  };

  const { cost, profit, margin } = calculateProfit();
  const sourceBadge = getSourceBadge(product.source);

  return (
    <>
      <Card className="group hover:shadow-2xl transition-all duration-300 border-border/50 hover:border-primary/50">
        <CardContent className="p-0">
          {/* Image Section */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            
            {/* Overlay Badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full bg-white/90 hover:bg-white"
                  onClick={() => setShowQuickView(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Aperçu Rapide
                </Button>
              </div>
            </div>

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
              <div className="flex flex-col gap-2">
                <Badge className={cn("text-white", sourceBadge.color)}>
                  {sourceBadge.label}
                </Badge>
                {product.social_proof?.tiktok_views && (
                  <Badge className="bg-black text-white">
                    🎵 {(product.social_proof.tiktok_views / 1000000).toFixed(1)}M
                  </Badge>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                {product.final_score && (
                  <Badge className={cn("text-white font-bold", getScoreColor(product.final_score))}>
                    ⭐ {product.final_score}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white rounded-full"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
                </Button>
              </div>
            </div>

            {/* Competition Badge */}
            {product.competition_level && (
              <Badge 
                variant="outline" 
                className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm"
              >
                <AlertTriangle className={cn(
                  "h-3 w-3 mr-1",
                  product.competition_level === 'low' && "text-green-500",
                  product.competition_level === 'medium' && "text-yellow-500",
                  product.competition_level === 'high' && "text-red-500"
                )} />
                {product.competition_level === 'low' && 'Faible concurrence'}
                {product.competition_level === 'medium' && 'Concurrence moyenne'}
                {product.competition_level === 'high' && 'Forte concurrence'}
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]" title={product.title}>
              {product.title}
            </h3>

            {/* Price & Profit */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(product.price, product.currency)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Prix vente
                </span>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Coût estimé:</span>
                  <span className="font-semibold">{formatPrice(cost, product.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Profit estimé:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatPrice(profit, product.currency)} ({margin}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {product.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{product.rating.toFixed(1)}</span>
                </div>
              )}
              
              {product.reviews && (
                <div className="text-muted-foreground">
                  {product.reviews.toLocaleString()} avis
                </div>
              )}
              
              {product.sales && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ShoppingCart className="h-3 w-3" />
                  <span>{(product.sales / 1000).toFixed(0)}k</span>
                </div>
              )}
            </div>

            {/* Trending Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Tendance
                </span>
                <span className="font-semibold">{Math.round(product.trending_score)}/100</span>
              </div>
              <Progress value={product.trending_score} className="h-1.5" />
            </div>

            {/* Supplier Info */}
            {product.supplier_name && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
                <Package className="h-3 w-3" />
                <span className="truncate">{product.supplier_name}</span>
                {product.shipping_time && (
                  <>
                    <Clock className="h-3 w-3 ml-auto" />
                    <span>{product.shipping_time}</span>
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => onImportProduct(product)}
                disabled={isImporting}
                className="w-full gap-2"
              >
                <Import className="h-4 w-4" />
                Importer
              </Button>
              
              {product.url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(product.url, '_blank')}
                  className="w-full gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Source
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick View Modal */}
      <Dialog open={showQuickView} onOpenChange={setShowQuickView}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{product.title}</DialogTitle>
            <DialogDescription>Analyse détaillée du produit</DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="space-y-4">
              <img
                src={product.image}
                alt={product.title}
                className="w-full rounded-lg"
              />
              <div className="flex gap-2">
                <Badge className={sourceBadge.color + " text-white"}>
                  {sourceBadge.label}
                </Badge>
                {product.final_score && (
                  <Badge className={getScoreColor(product.final_score) + " text-white"}>
                    Score: {product.final_score}
                  </Badge>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Price Info */}
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Calculateur de Profit</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Prix de vente:</span>
                    <span className="font-bold">{formatPrice(product.price, product.currency)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Coût estimé:</span>
                    <span>{formatPrice(cost, product.currency)}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between text-lg">
                    <span>Profit net:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {formatPrice(profit, product.currency)}
                    </span>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    Marge: {margin}%
                  </div>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Note</div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{product.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                </Card>

                <Card className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Avis</div>
                  <div className="font-bold">{product.reviews?.toLocaleString() || 'N/A'}</div>
                </Card>

                <Card className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Ventes</div>
                  <div className="font-bold">{product.sales?.toLocaleString() || 'N/A'}</div>
                </Card>

                <Card className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Tendance</div>
                  <div className="font-bold">{product.trending_score}/100</div>
                </Card>
              </div>

              {/* Social Proof */}
              {product.social_proof && (
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Preuve Sociale</h4>
                  <div className="space-y-2">
                    {product.social_proof.tiktok_views && (
                      <div className="flex justify-between">
                        <span className="text-sm">TikTok Vues:</span>
                        <span className="font-semibold">
                          {(product.social_proof.tiktok_views / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    )}
                    {product.social_proof.instagram_likes && (
                      <div className="flex justify-between">
                        <span className="text-sm">Instagram Likes:</span>
                        <span className="font-semibold">
                          {(product.social_proof.instagram_likes / 1000).toFixed(0)}k
                        </span>
                      </div>
                    )}
                    {product.social_proof.facebook_shares && (
                      <div className="flex justify-between">
                        <span className="text-sm">Facebook Partages:</span>
                        <span className="font-semibold">
                          {product.social_proof.facebook_shares.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    onImportProduct(product);
                    setShowQuickView(false);
                  }}
                  disabled={isImporting}
                  className="w-full"
                >
                  <Import className="h-4 w-4 mr-2" />
                  Importer
                </Button>
                {product.url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(product.url, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Voir Source
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
