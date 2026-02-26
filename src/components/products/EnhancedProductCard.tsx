import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';
import { duplicateProduct } from '@/services/api/productHelpers';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Package, 
  MoreVertical, 
  Copy, 
  Upload, 
  TrendingUp, 
  Star,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Zap,
  DollarSign,
  RefreshCw,
  Share2,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { 
  ProductStatusBadges, 
  ProductStatusData,
  ProductMicroInfo,
  ProductAIBadge as ProductAIBadgeType,
  ProductAIBadgeComponent,
  DecisionBadge
} from './command-center';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface EnhancedProductCardProps {
  product: UnifiedProduct;
  onEdit: (product: UnifiedProduct) => void;
  onDelete: (id: string) => void;
  onView: (product: UnifiedProduct) => void;
  onDuplicate?: (product: UnifiedProduct) => void;
  onPublish?: (product: UnifiedProduct) => void;
  isSelected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  showSelection?: boolean;
  // Phase 2: Business mode props
  statusData?: ProductStatusData;
  viewMode?: 'standard' | 'audit' | 'business';
  // V3: AI Badge
  aiBadge?: ProductAIBadgeType;
}

export const EnhancedProductCard = memo(function EnhancedProductCard({
  product,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onPublish,
  isSelected = false,
  onSelectChange,
  showSelection = true,
  statusData,
  viewMode = 'standard',
  aiBadge
}: EnhancedProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(() => {
    const favorites = JSON.parse(localStorage.getItem('product-favorites') || '[]');
    return favorites.includes(product.id);
  });
  const queryClient = useQueryClient();

  const imageUrl = product.image_url;
  // Use real AI score from product_scores or SEO quality, fallback to computed score based on completeness
  const computedScore = [
    product.image_url ? 20 : 0,
    product.description ? 20 : 0,
    product.cost_price ? 15 : 0,
    (product.stock_quantity || 0) > 0 ? 15 : 0,
    product.category ? 10 : 0,
    product.sku ? 10 : 0,
    product.status === 'active' ? 10 : 0,
  ].reduce((a, b) => a + b, 0);
  const aiScore = (product as any).ai_score || (product as any).quality_score || computedScore;
  const isWinner = (product as any).is_winner;
  const isTrending = (product as any).is_trending;
  
  const margin = product.cost_price 
    ? Math.round(((product.price - product.cost_price) / product.price) * 100)
    : null;
  
  const profit = product.cost_price 
    ? product.price - product.cost_price 
    : null;

  // Default status data if not provided
  const defaultStatusData: ProductStatusData = statusData || {
    stockCritical: (product.stock_quantity || 0) < 10,
    lowQuality: aiScore < 40,
    aiOptimized: false,
    hasPriceRule: false,
    recentlySync: true,
    losingMargin: margin !== null && margin < 15,
    qualityScore: aiScore,
    stockQuantity: product.stock_quantity || 0
  };

  // Real duplicate handler
  const handleDuplicate = async () => {
    if (onDuplicate) {
      onDuplicate(product);
      return;
    }
    
    try {
      await duplicateProduct(product);
      toast.success('Produit dupliqué avec succès');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
    } catch (error) {
      console.error('Error duplicating:', error);
      toast.error('Erreur lors de la duplication');
    }
  };

  // Share handler
  const handleShare = async () => {
    const productUrl = `${window.location.origin}/products?id=${product.id}`;
    const shareText = `${product.name} - ${product.price}€`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: productUrl
        });
      } catch {
        await navigator.clipboard.writeText(productUrl);
        toast.success('Lien copié dans le presse-papier');
      }
    } else {
      await navigator.clipboard.writeText(productUrl);
      toast.success('Lien copié dans le presse-papier');
    }
  };

  // Favorites handler
  const handleToggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('product-favorites') || '[]');
    const newFavorites = isFavorite 
      ? favorites.filter((id: string) => id !== product.id)
      : [...favorites, product.id];
    localStorage.setItem('product-favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  // Publish handler
  const handlePublish = async () => {
    if (onPublish) {
      onPublish(product);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return;
      }

      const { error } = await supabase
        .from('products')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', product.id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Produit publié !');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Erreur lors de la publication');
    }
  };

  const getStockStatus = () => {
    const stock = product.stock_quantity || 0;
    if (stock > 50) return { label: 'En stock', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
    if (stock > 10) return { label: 'Limité', color: 'bg-amber-500', textColor: 'text-amber-600' };
    if (stock > 0) return { label: 'Faible', color: 'bg-orange-500', textColor: 'text-orange-600' };
    return { label: 'Rupture', color: 'bg-red-500', textColor: 'text-red-600' };
  };

  const getScoreConfig = (score: number) => {
    if (score >= 80) return { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Excellent', gradient: 'from-emerald-500 to-emerald-400' };
    if (score >= 60) return { color: 'text-amber-500', bg: 'bg-amber-500', label: 'Bon', gradient: 'from-amber-500 to-amber-400' };
    return { color: 'text-red-500', bg: 'bg-red-500', label: 'À optimiser', gradient: 'from-red-500 to-red-400' };
  };

  const stockStatus = getStockStatus();
  const scoreConfig = getScoreConfig(aiScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "relative group overflow-hidden transition-all duration-300",
          "border-border/50 bg-card hover:shadow-2xl hover:shadow-primary/5",
          isSelected && "ring-2 ring-primary shadow-lg shadow-primary/10 border-primary/50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glow effect on hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300",
          isHovered && "opacity-100"
        )} />

        {/* Selection & Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {showSelection && (
            <motion.div 
              initial={false}
              animate={{ opacity: isHovered || isSelected ? 1 : 0, scale: isHovered || isSelected ? 1 : 0.8 }}
              className="transition-all"
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelectChange}
                className="bg-background/95 shadow-lg border-2 h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </motion.div>
          )}
          
          {/* Phase 2: Dynamic Status Badges */}
          <div className="flex flex-col gap-1.5">
            {/* Legacy badges for Winner/Trending */}
            {isWinner && (
              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-lg border-0 text-[10px] px-2">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Winner
              </Badge>
            )}
            
            {isTrending && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg border-0 text-[10px] px-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                Tendance
              </Badge>
            )}
            
            {/* New Phase 2 Status Badges */}
            <ProductStatusBadges 
              status={defaultStatusData} 
              compact={true}
            />
          </div>
        </div>

        {/* Actions Menu */}
        <div className="absolute top-3 right-3 z-10">
          <motion.div
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 bg-background/95 shadow-lg backdrop-blur-sm border border-border/50"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onView(product)} className="gap-2">
                  <Eye className="h-4 w-4" />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(product)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Partager
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleFavorite} className="gap-2">
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
                  {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </DropdownMenuItem>
                {product.status !== 'active' && (
                  <DropdownMenuItem onClick={handlePublish} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Publier
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    if (confirm('Supprimer ce produit ?')) {
                      onDelete(product.id);
                    }
                  }}
                  className="text-destructive focus:text-destructive gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>

        {/* Image Container */}
        <div 
          className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted cursor-pointer"
          onClick={() => onView(product)}
        >
          {imageUrl && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
              )}
              <img
                src={imageUrl}
                alt={product.name}
                className={cn(
                  "w-full h-full object-cover transition-all duration-500",
                  isHovered && "scale-110",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/50">
              <Package className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )} />
          
          {/* Quick View Button */}
          <motion.div
            initial={false}
            animate={{ 
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 10
            }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
          >
            <Button
              variant="secondary"
              size="sm"
              className="shadow-lg backdrop-blur-sm bg-background/90 border border-border/50"
              onClick={(e) => {
                e.stopPropagation();
                onView(product);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </Button>
          </motion.div>

          {/* Sprint 4: Decision Badge - Lecture immédiate sans ouvrir la fiche */}
          <div className="absolute bottom-3 right-3">
            {aiBadge ? (
              <DecisionBadge badge={aiBadge} size="sm" showLabel={true} />
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/95 shadow-lg backdrop-blur-sm border border-border/50"
                    )}>
                      <Sparkles className={cn("h-3.5 w-3.5", scoreConfig.color)} />
                      <span className={cn("text-sm font-bold", scoreConfig.color)}>{aiScore}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Score IA: {scoreConfig.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title & Status */}
          <div className="flex items-start gap-2">
            <h3 
              className="flex-1 font-semibold line-clamp-2 cursor-pointer hover:text-primary transition-colors text-sm leading-tight"
              onClick={() => onView(product)}
            >
              {product.name}
            </h3>
            <Badge 
              variant="outline"
              className={cn(
                "shrink-0 text-[10px] font-medium border-0",
                product.status === 'active' 
                  ? 'bg-emerald-500/10 text-emerald-600' 
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {product.status === 'active' ? 'Actif' : 'Inactif'}
            </Badge>
          </div>

          {/* Price & Margin */}
          <div className="flex items-end justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-2xl font-bold tracking-tight">
                {product.price.toFixed(2)}
                <span className="text-lg ml-0.5">€</span>
              </span>
              {product.cost_price && (
                <p className="text-xs text-muted-foreground">
                  Coût: {product.cost_price.toFixed(2)} €
                </p>
              )}
            </div>
            
            {margin !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "px-2.5 py-1.5 rounded-lg text-right",
                      margin >= 30 ? "bg-emerald-500/10" : margin >= 15 ? "bg-amber-500/10" : "bg-red-500/10"
                    )}>
                      <p className={cn(
                        "text-lg font-bold leading-none",
                        margin >= 30 ? "text-emerald-600" : margin >= 15 ? "text-amber-600" : "text-red-600"
                      )}>
                        {margin >= 0 ? '+' : ''}{margin}%
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">marge</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Profit: {profit?.toFixed(2)} € / vente</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Stock & Score Progress */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", stockStatus.color)} />
                <span className={cn("text-xs font-medium", stockStatus.textColor)}>
                  {product.stock_quantity || 0} unités
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {product.sku || 'N/A'}
              </span>
            </div>
            
            {/* Score Progress Bar */}
            <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${aiScore}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", scoreConfig.gradient)}
              />
            </div>
          </div>

          {/* Phase 2: Micro-infos + Source Badge */}
          <div className="flex items-center justify-between pt-1">
            <Badge variant="outline" className="text-[10px] capitalize bg-muted/50 border-border/50">
              {product.source || 'local'}
            </Badge>
            
            {/* Micro-infos for Business mode */}
            {viewMode === 'business' ? (
              <ProductMicroInfo
                margin={margin ?? undefined}
                lastSyncedAt={product.updated_at}
                hasPriceRule={defaultStatusData.hasPriceRule}
                compact
              />
            ) : (
              product.category && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                  {product.category}
                </span>
              )
            )}
          </div>

          {/* Quick Actions - Sprint 2: Single Primary CTA based on AI status */}
          <div className="flex gap-2 pt-2">
            {/* Primary CTA - AI-driven */}
            {aiBadge?.type === 'risk' ? (
              <Button
                size="sm"
                className="flex-1 h-9 text-xs bg-red-500 hover:bg-red-600 text-white shadow-sm"
                onClick={() => onView(product)}
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                Corriger
              </Button>
            ) : aiBadge?.type === 'opportunity' ? (
              <Button
                size="sm"
                className="flex-1 h-9 text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                onClick={() => onView(product)}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Optimiser
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-9 text-xs bg-background/50 hover:bg-accent border-border/50"
                onClick={() => onView(product)}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Voir
              </Button>
            )}
            
            {/* Secondary: Edit (discrete) */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 hover:bg-muted"
                    onClick={() => onEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Modifier</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Tertiary: More actions in dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0 hover:bg-muted"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onView(product)} className="gap-2">
                  <Eye className="h-4 w-4" />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Partager
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleFavorite} className="gap-2">
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
                  Favoris
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    if (confirm('Supprimer ce produit ?')) {
                      onDelete(product.id);
                    }
                  }}
                  className="text-destructive focus:text-destructive gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
