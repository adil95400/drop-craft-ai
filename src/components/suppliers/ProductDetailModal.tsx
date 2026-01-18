/**
 * ProductDetailModal - Modal optimisé pour les détails produit
 * Design moderne avec galerie d'images, animations et UX améliorée
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  ShoppingCart,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  TrendingUp,
  Star,
  Truck,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Copy,
  ExternalLink,
  Heart,
  Share2,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductData {
  id: string;
  name: string;
  supplier_name?: string;
  sku?: string;
  image_url?: string;
  images?: string[];
  retail_price: number;
  cost_price: number;
  profit_margin: number;
  stock_quantity?: number;
  ai_score?: number;
  description?: string;
  category?: string;
  is_winner?: boolean;
  delivery_time?: string;
  supplier_rating?: number;
}

interface ProductDetailModalProps {
  product: ProductData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport?: (productId: string) => void;
  isImporting?: boolean;
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  onImport,
  isImporting = false
}: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  if (!product) return null;

  // Construire la liste des images
  const images = product.images?.length 
    ? product.images 
    : product.image_url 
      ? [product.image_url] 
      : ['/placeholder.svg'];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const aiScore = product.ai_score ? Math.round(product.ai_score * 100) : 0;
  const profit = product.retail_price - product.cost_price;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStockStatus = (quantity?: number) => {
    if (!quantity || quantity <= 0) return { label: 'Rupture', color: 'destructive' as const, icon: AlertTriangle };
    if (quantity < 10) return { label: 'Stock faible', color: 'secondary' as const, icon: AlertTriangle };
    return { label: 'En stock', color: 'default' as const, icon: CheckCircle };
  };

  const stockStatus = getStockStatus(product.stock_quantity);

  const handleCopySku = () => {
    if (product.sku) {
      navigator.clipboard.writeText(product.sku);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-background border-border">
        {/* Header avec actions */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            {product.is_winner && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                <Star className="h-3 w-3 mr-1" />
                Winner
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-xs">
              {product.sku || 'N/A'}
              <button onClick={handleCopySku} className="ml-1.5 hover:text-primary transition-colors">
                <Copy className="h-3 w-3" />
              </button>
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={cn("h-4 w-4 transition-colors", isLiked && "fill-red-500 text-red-500")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[80vh]">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Galerie d'images */}
            <div className="relative bg-muted/20 p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative aspect-square rounded-xl overflow-hidden bg-background shadow-lg"
                >
                  <img
                    src={images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  
                  {/* Score IA overlay */}
                  <div className="absolute top-3 right-3">
                    <div className={cn(
                      "px-3 py-1.5 rounded-full backdrop-blur-md bg-background/80 border border-border",
                      "flex items-center gap-2 shadow-lg"
                    )}>
                      <Sparkles className={cn("h-4 w-4", getScoreColor(aiScore))} />
                      <span className={cn("font-bold text-sm", getScoreColor(aiScore))}>
                        {aiScore}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation images */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-8 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur-sm"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-8 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur-sm"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {images.slice(0, 5).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200",
                        idx === currentImageIndex 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img 
                        src={img} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </button>
                  ))}
                  {images.length > 5 && (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                      +{images.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Informations produit */}
            <div className="p-6 flex flex-col">
              <DialogHeader className="text-left space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{product.supplier_name || 'Fournisseur'}</span>
                  {product.category && (
                    <>
                      <span>•</span>
                      <span>{product.category}</span>
                    </>
                  )}
                </div>
                <DialogTitle className="text-xl font-bold leading-tight">
                  {product.name}
                </DialogTitle>
              </DialogHeader>

              {/* Prix et marge */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">Prix de vente</p>
                  <p className="text-2xl font-bold text-primary">
                    {product.retail_price.toFixed(2)}€
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Prix d'achat</p>
                  <p className="text-xl font-semibold">
                    {product.cost_price.toFixed(2)}€
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                  <p className="text-xs text-muted-foreground mb-1">Marge</p>
                  <p className="text-xl font-bold text-green-600">
                    +{profit.toFixed(2)}€
                  </p>
                  <p className="text-xs text-green-600/80">
                    {product.profit_margin.toFixed(1)}%
                  </p>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Métriques */}
              <div className="space-y-4 mb-6">
                {/* Stock */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>Stock disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={stockStatus.color} className="gap-1">
                      <stockStatus.icon className="h-3 w-3" />
                      {stockStatus.label}
                    </Badge>
                    <span className="font-medium">
                      {product.stock_quantity ?? 0} unités
                    </span>
                  </div>
                </div>

                {/* Score IA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span>Score IA</span>
                    </div>
                    <span className={cn("font-bold", getScoreColor(aiScore))}>
                      {aiScore}%
                    </span>
                  </div>
                  <Progress 
                    value={aiScore} 
                    className="h-2"
                    style={{
                      ['--progress-background' as any]: aiScore >= 80 
                        ? 'rgb(34 197 94)' 
                        : aiScore >= 60 
                          ? 'rgb(234 179 8)' 
                          : 'rgb(239 68 68)'
                    }}
                  />
                </div>

                {/* Note fournisseur */}
                {product.supplier_rating && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span>Note fournisseur</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < Math.floor(product.supplier_rating || 0)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                      <span className="ml-1 font-medium">
                        {product.supplier_rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Délai livraison */}
                {product.delivery_time && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span>Délai livraison</span>
                    </div>
                    <span className="font-medium">{product.delivery_time}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto pt-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Fermer
                </Button>
                <Button
                  className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  onClick={() => onImport?.(product.id)}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Package className="h-4 w-4" />
                      </motion.div>
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Importer ce produit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
