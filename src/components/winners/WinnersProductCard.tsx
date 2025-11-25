import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, TrendingUp, ShoppingCart, ExternalLink, Import, 
  Eye, Heart, Calculator, Package, Clock, AlertTriangle,
  Zap, Target, Award
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [imageLoaded, setImageLoaded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  const getSourceBadge = (source: string) => {
    const sourceMap: Record<string, { label: string; color: string; emoji: string }> = {
      amazon: { label: 'Amazon', color: 'bg-gradient-to-r from-orange-500 to-yellow-500', emoji: '📦' },
      aliexpress: { label: 'AliExpress', color: 'bg-gradient-to-r from-red-500 to-pink-500', emoji: '🛍️' },
      ebay: { label: 'eBay', color: 'bg-gradient-to-r from-blue-500 to-indigo-500', emoji: '🏪' },
      google_trends: { label: 'Trends', color: 'bg-gradient-to-r from-indigo-500 to-purple-500', emoji: '📊' },
      tiktok: { label: 'TikTok', color: 'bg-gradient-to-r from-gray-800 to-gray-900', emoji: '🎵' },
    };
    const normalized = source.toLowerCase().replace('_simulation', '');
    return sourceMap[normalized] || { label: source, color: 'bg-gradient-to-r from-gray-500 to-gray-600', emoji: '🔗' };
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(price);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
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
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -4 }}
      >
        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-500 border-border/50 hover:border-primary/30 bg-card">
          <CardContent className="p-0">
            {/* Image Section */}
            <div className="relative aspect-square overflow-hidden bg-muted">
              {!imageLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/50 to-muted" />
              )}
              
              <img
                src={product.image}
                alt={product.title}
                className={cn(
                  "w-full h-full object-cover transition-all duration-700",
                  imageLoaded ? "opacity-100 scale-100 group-hover:scale-110" : "opacity-0 scale-95"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                  setImageLoaded(true);
                }}
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Hover Actions */}
              <motion.div 
                className="absolute inset-x-0 bottom-0 p-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ y: 20 }}
                whileHover={{ y: 0 }}
              >
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full bg-white/95 hover:bg-white backdrop-blur-sm shadow-lg font-semibold"
                  onClick={() => setShowQuickView(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Aperçu Rapide
                </Button>
              </motion.div>

              {/* Top Left Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <Badge className={cn("text-white shadow-lg backdrop-blur-sm border-0", sourceBadge.color)}>
                  <span className="mr-1">{sourceBadge.emoji}</span>
                  {sourceBadge.label}
                </Badge>
                
                {product.social_proof?.tiktok_views && (
                  <Badge className="bg-gradient-to-r from-gray-900 to-black text-white shadow-lg">
                    🎵 {formatNumber(product.social_proof.tiktok_views)}
                  </Badge>
                )}

                {product.market_demand > 80 && (
                  <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg animate-pulse">
                    <Zap className="h-3 w-3 mr-1" />
                    HOT
                  </Badge>
                )}
              </div>

              {/* Top Right Badges */}
              <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                {product.final_score && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className={cn("text-white font-bold shadow-lg bg-gradient-to-r", getScoreColor(product.final_score))}>
                        <Award className="h-3 w-3 mr-1" />
                        {product.final_score}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Score de performance global</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  className="h-9 w-9 rounded-full bg-white/95 hover:bg-white backdrop-blur-sm shadow-lg flex items-center justify-center"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={cn("h-4 w-4 transition-all", isFavorite && "fill-red-500 text-red-500")} />
                </motion.button>
              </div>

              {/* Competition Badge */}
              {product.competition_level && (
                <Badge 
                  variant="outline" 
                  className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm shadow-lg border-0"
                >
                  <AlertTriangle className={cn(
                    "h-3 w-3 mr-1",
                    product.competition_level === 'low' && "text-green-500",
                    product.competition_level === 'medium' && "text-yellow-500",
                    product.competition_level === 'high' && "text-red-500"
                  )} />
                  {product.competition_level === 'low' && 'Faible'}
                  {product.competition_level === 'medium' && 'Moyenne'}
                  {product.competition_level === 'high' && 'Forte'}
                </Badge>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-3">
              {/* Title */}
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem] text-foreground" title={product.title}>
                {product.title}
              </h3>

              {/* Price & Profit */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    Prix vente
                  </span>
                </div>
                
                <motion.div 
                  className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 rounded-lg p-3 space-y-2 border border-green-200/50 dark:border-green-800/50"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Coût estimé:</span>
                    <span className="font-semibold text-foreground">{formatPrice(cost, product.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Profit estimé:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {formatPrice(profit, product.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 pt-1 border-t border-green-200/50 dark:border-green-800/50">
                    <Target className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">
                      Marge {margin}%
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                {product.rating && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-sm">{product.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-0.5">Note</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Note moyenne client</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {product.reviews && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <span className="font-bold text-sm">{formatNumber(product.reviews)}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">Avis</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{product.reviews.toLocaleString()} avis clients</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {product.sales && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3 text-primary" />
                          <span className="font-bold text-sm">{formatNumber(product.sales)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-0.5">Ventes</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{product.sales.toLocaleString()} ventes</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Trending Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Tendance
                  </span>
                  <span className="font-bold text-sm">{Math.round(product.trending_score)}/100</span>
                </div>
                <Progress 
                  value={product.trending_score} 
                  className="h-2"
                />
              </div>

              {/* Supplier Info */}
              {product.supplier_name && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
                  <Package className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate flex-1">{product.supplier_name}</span>
                  {product.shipping_time && (
                    <>
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="whitespace-nowrap">{product.shipping_time}</span>
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
                  className="w-full gap-2 font-semibold shadow-sm hover:shadow"
                >
                  <Import className="h-4 w-4" />
                  Importer
                </Button>
                
                {product.url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(product.url, '_blank')}
                    className="w-full gap-2 font-semibold"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Source
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick View Modal */}
      <Dialog open={showQuickView} onOpenChange={setShowQuickView}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold pr-8">{product.title}</DialogTitle>
            <DialogDescription>Analyse complète et détaillée du produit</DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-muted aspect-square">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={cn(sourceBadge.color, "text-white shadow-md")}>
                  <span className="mr-1">{sourceBadge.emoji}</span>
                  {sourceBadge.label}
                </Badge>
                {product.final_score && (
                  <Badge className={cn("text-white shadow-md bg-gradient-to-r", getScoreColor(product.final_score))}>
                    <Award className="h-3 w-3 mr-1" />
                    Score: {product.final_score}
                  </Badge>
                )}
                {product.competition_level && (
                  <Badge variant="outline">
                    Concurrence: {product.competition_level}
                  </Badge>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-4">
              {/* Price Calculator */}
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-bold text-lg">Calculateur de Profit</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prix de vente:</span>
                    <span className="font-bold text-lg">{formatPrice(product.price, product.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Coût estimé:</span>
                    <span className="font-semibold">{formatPrice(cost, product.currency)}</span>
                  </div>
                  <div className="h-px bg-green-200 dark:bg-green-800" />
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-semibold">Profit net:</span>
                    <span className="font-bold text-xl text-green-600 dark:text-green-400">
                      {formatPrice(profit, product.currency)}
                    </span>
                  </div>
                  <div className="text-center pt-2">
                    <Badge className="bg-green-600 dark:bg-green-500 text-white">
                      Marge bénéficiaire: {margin}%
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium text-muted-foreground">Note</span>
                  </div>
                  <div className="font-bold text-2xl">{product.rating?.toFixed(1) || 'N/A'}</div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Avis</div>
                  <div className="font-bold text-2xl">{product.reviews ? formatNumber(product.reviews) : 'N/A'}</div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Ventes</span>
                  </div>
                  <div className="font-bold text-2xl">{product.sales ? formatNumber(product.sales) : 'N/A'}</div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Tendance</span>
                  </div>
                  <div className="font-bold text-2xl">{product.trending_score}/100</div>
                </Card>
              </div>

              {/* Social Proof */}
              {product.social_proof && (
                <Card className="p-4">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Preuve Sociale
                  </h4>
                  <div className="space-y-2">
                    {product.social_proof.tiktok_views && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">🎵 TikTok Vues</span>
                        <span className="font-bold">{formatNumber(product.social_proof.tiktok_views)}</span>
                      </div>
                    )}
                    {product.social_proof.instagram_likes && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">📷 Instagram Likes</span>
                        <span className="font-bold">{formatNumber(product.social_proof.instagram_likes)}</span>
                      </div>
                    )}
                    {product.social_proof.facebook_shares && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">👥 Facebook Partages</span>
                        <span className="font-bold">{product.social_proof.facebook_shares.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => {
                    onImportProduct(product);
                    setShowQuickView(false);
                  }}
                  disabled={isImporting}
                  className="w-full font-semibold shadow-lg hover:shadow-xl"
                >
                  <Import className="h-5 w-5 mr-2" />
                  Importer Maintenant
                </Button>
                {product.url && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.open(product.url, '_blank')}
                    className="w-full font-semibold"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Voir la Source
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};