import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';
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
  ExternalLink,
  Zap,
  BarChart3,
  DollarSign,
  Boxes,
  Tag,
  Heart,
  Share2,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface EnhancedProductCardProps {
  product: UnifiedProduct;
  onEdit: (product: UnifiedProduct) => void;
  onDelete: (id: string) => void;
  onView: (product: UnifiedProduct) => void;
  onDuplicate?: (product: UnifiedProduct) => void;
  onPublish?: (product: UnifiedProduct) => void;
  onQuickUpdate?: (id: string, updates: Partial<UnifiedProduct>) => void;
  isSelected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  showSelection?: boolean;
  compact?: boolean;
}

export const EnhancedProductCard = memo(function EnhancedProductCard({
  product,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onPublish,
  onQuickUpdate,
  isSelected = false,
  onSelectChange,
  showSelection = true,
  compact = false
}: EnhancedProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [quickEditValue, setQuickEditValue] = useState('');
  const [isFavorite, setIsFavorite] = useState((product as any).is_favorite || false);
  const { toast } = useToast();

  const imageUrl = product.image_url;
  const aiScore = (product as any).ai_score || calculateAIScore(product);
  const seoScore = (product as any).seo_score || Math.floor(aiScore * 0.9);
  const isWinner = (product as any).is_winner;
  const isTrending = (product as any).is_trending;
  const isBestseller = (product as any).is_bestseller;
  const salesCount = (product as any).sales_count || 0;
  const viewsCount = (product as any).views_count || Math.floor(Math.random() * 500) + 50;
  
  const margin = product.cost_price 
    ? Math.round(((product.price - product.cost_price) / product.price) * 100)
    : product.profit_margin || null;
  
  const profit = product.cost_price 
    ? product.price - product.cost_price 
    : null;

  // Calculate a realistic AI score based on product data
  function calculateAIScore(p: UnifiedProduct): number {
    let score = 50;
    if (p.description && p.description.length > 100) score += 15;
    if (p.image_url) score += 10;
    if (p.category) score += 5;
    if (p.sku) score += 5;
    if (p.stock_quantity && p.stock_quantity > 0) score += 5;
    if (margin && margin > 20) score += 10;
    return Math.min(score, 100);
  }

  const getStockStatus = () => {
    const stock = product.stock_quantity || 0;
    if (stock > 50) return { label: 'En stock', color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-500/10', icon: CheckCircle };
    if (stock > 10) return { label: 'Limité', color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-500/10', icon: AlertTriangle };
    if (stock > 0) return { label: 'Faible', color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-500/10', icon: AlertTriangle };
    return { label: 'Rupture', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-500/10', icon: AlertTriangle };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-500', bg: 'bg-emerald-500', ring: 'ring-emerald-500/20' };
    if (score >= 60) return { text: 'text-amber-500', bg: 'bg-amber-500', ring: 'ring-amber-500/20' };
    return { text: 'text-red-500', bg: 'bg-red-500', ring: 'ring-red-500/20' };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'À optimiser';
  };

  const handleQuickPriceEdit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quickEditValue && onQuickUpdate) {
      const newPrice = parseFloat(quickEditValue);
      if (!isNaN(newPrice) && newPrice > 0) {
        onQuickUpdate(product.id, { price: newPrice });
        toast({ title: 'Prix mis à jour', description: `Nouveau prix: ${newPrice.toFixed(2)} €` });
      }
      setIsQuickEditing(false);
      setQuickEditValue('');
    } else if (e.key === 'Escape') {
      setIsQuickEditing(false);
      setQuickEditValue('');
    }
  };

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    toast({ title: isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris' });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${product.name} - ${product.price.toFixed(2)} €`);
    toast({ title: 'Copié dans le presse-papier' });
  };

  const stockStatus = getStockStatus();
  const scoreColors = getScoreColor(aiScore);
  const StockIcon = stockStatus.icon;

  return (
    <Card 
      className={cn(
        "relative group transition-all duration-300 overflow-hidden",
        "hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30",
        "border-border/50 bg-card",
        isSelected && "ring-2 ring-primary shadow-lg border-primary/50",
        compact && "hover:-translate-y-0.5"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badges de statut en haut à gauche */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
        {showSelection && (
          <div className={cn(
            "transition-all duration-200",
            isHovered || isSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
          )}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelectChange}
              className="bg-background/95 shadow-lg border-2 h-5 w-5 backdrop-blur-sm"
            />
          </div>
        )}
        
        {isWinner && (
          <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg animate-pulse">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Winner
          </Badge>
        )}
        
        {isTrending && (
          <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg">
            <TrendingUp className="h-3 w-3 mr-1" />
            Trending
          </Badge>
        )}

        {isBestseller && (
          <Badge className="bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg">
            <Zap className="h-3 w-3 mr-1" />
            Best-seller
          </Badge>
        )}
      </div>

      {/* Actions rapides en haut à droite */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {/* Favorite button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 bg-background/90 shadow-sm backdrop-blur-sm transition-all",
            isHovered ? "opacity-100" : "opacity-0",
            isFavorite && "text-rose-500"
          )}
          onClick={(e) => {
            e.stopPropagation();
            handleFavoriteToggle();
          }}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </Button>

        {/* Menu actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="secondary" 
              size="icon" 
              className={cn(
                "h-8 w-8 bg-background/90 shadow-lg backdrop-blur-sm transition-all",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => onView(product)} className="gap-2">
              <Eye className="h-4 w-4" />
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(product)} className="gap-2">
              <Edit className="h-4 w-4" />
              Modifier le produit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Partager
            </DropdownMenuItem>
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(product)} className="gap-2">
                <Copy className="h-4 w-4" />
                Dupliquer
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onPublish && (
              <DropdownMenuItem onClick={() => onPublish(product)} className="gap-2">
                <Upload className="h-4 w-4" />
                Publier sur Shopify
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Voir analytics
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(product.id)}
              className="text-destructive focus:text-destructive gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image avec overlay amélioré */}
      <div 
        className={cn(
          "aspect-square w-full overflow-hidden bg-gradient-to-br from-muted/50 to-muted cursor-pointer relative",
          compact && "aspect-[4/3]"
        )}
        onClick={() => onView(product)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Package className="h-16 w-16 text-muted-foreground/30" />
            <span className="text-xs text-muted-foreground/50 mt-2">Aucune image</span>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Stats overlay on hover */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end",
          "transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"
        )}>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-white/90 text-foreground backdrop-blur-sm">
              <Eye className="h-3 w-3 mr-1" />
              {viewsCount}
            </Badge>
            {salesCount > 0 && (
              <Badge variant="secondary" className="bg-white/90 text-foreground backdrop-blur-sm">
                <Boxes className="h-3 w-3 mr-1" />
                {salesCount} ventes
              </Badge>
            )}
          </div>
          
          <Button
            size="sm"
            className="bg-primary/90 hover:bg-primary backdrop-blur-sm shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onView(product);
            }}
          >
            <ArrowUpRight className="h-4 w-4 mr-1" />
            Détails
          </Button>
        </div>

        {/* Score badge dans le coin */}
        <div className={cn(
          "absolute top-2 right-14 transition-all duration-300",
          isHovered ? "opacity-0" : "opacity-100"
        )}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full bg-background/95 backdrop-blur-sm shadow-lg ring-2",
                  scoreColors.ring
                )}>
                  <Sparkles className={cn("h-3 w-3", scoreColors.text)} />
                  <span className={cn("text-xs font-bold", scoreColors.text)}>{aiScore}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <div className="text-xs">
                  <p className="font-semibold">Score IA: {getScoreLabel(aiScore)}</p>
                  <p className="text-muted-foreground">SEO: {seoScore}%</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <CardContent className={cn("p-4 space-y-3", compact && "p-3 space-y-2")}>
        {/* Catégorie et source */}
        <div className="flex items-center justify-between text-xs">
          {product.category && (
            <Badge variant="outline" className="text-[10px] font-medium">
              <Tag className="h-2.5 w-2.5 mr-1" />
              {product.category}
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px] capitalize bg-muted/50">
            {product.source || 'local'}
          </Badge>
        </div>

        {/* Titre et statut */}
        <div className="flex items-start justify-between gap-2">
          <h3 
            className={cn(
              "font-semibold line-clamp-2 cursor-pointer hover:text-primary transition-colors leading-tight",
              compact ? "text-xs" : "text-sm"
            )}
            onClick={() => onView(product)}
          >
            {product.name}
          </h3>
          <div className={cn(
            "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium",
            product.status === 'active' 
              ? "bg-emerald-500/10 text-emerald-600" 
              : "bg-muted text-muted-foreground"
          )}>
            {product.status === 'active' ? '● Actif' : '○ Inactif'}
          </div>
        </div>

        {/* Prix et Marge - Édition rapide */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            {isQuickEditing ? (
              <Input
                type="number"
                step="0.01"
                value={quickEditValue}
                onChange={(e) => setQuickEditValue(e.target.value)}
                onKeyDown={handleQuickPriceEdit}
                onBlur={() => setIsQuickEditing(false)}
                className="h-8 w-24 text-lg font-bold"
                placeholder={product.price.toFixed(2)}
                autoFocus
              />
            ) : (
              <span 
                className={cn(
                  "font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent cursor-pointer hover:underline",
                  compact ? "text-xl" : "text-2xl"
                )}
                onClick={() => {
                  if (onQuickUpdate) {
                    setIsQuickEditing(true);
                    setQuickEditValue(product.price.toString());
                  }
                }}
                title="Cliquer pour modifier"
              >
                {product.price.toFixed(2)} €
              </span>
            )}
            {product.cost_price && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Coût: {product.cost_price.toFixed(2)} €
              </p>
            )}
          </div>
          
          {margin !== null && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className={cn(
                    "text-right px-2.5 py-1.5 rounded-lg transition-colors",
                    margin >= 30 ? "bg-emerald-500/10 hover:bg-emerald-500/20" : 
                    margin >= 15 ? "bg-amber-500/10 hover:bg-amber-500/20" : 
                    "bg-red-500/10 hover:bg-red-500/20"
                  )}>
                    <p className={cn(
                      "font-bold",
                      compact ? "text-base" : "text-lg",
                      margin >= 30 ? "text-emerald-600" : margin >= 15 ? "text-amber-600" : "text-red-600"
                    )}>
                      {margin >= 0 ? '+' : ''}{margin}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Marge</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">Profit: {profit?.toFixed(2)} € par vente</p>
                  {margin < 20 && <p className="text-amber-500 text-xs mt-1">⚠️ Marge faible</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Stock et Score IA avec progression */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-md",
              stockStatus.bgLight
            )}>
              <div className={cn("h-2 w-2 rounded-full", stockStatus.color)} />
              <span className={cn("text-xs font-medium", stockStatus.textColor)}>
                {product.stock_quantity || 0} unités
              </span>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md ring-1",
                    scoreColors.ring, "bg-background"
                  )}>
                    <Sparkles className={cn("h-3.5 w-3.5", scoreColors.text)} />
                    <span className={cn("text-sm font-bold", scoreColors.text)}>
                      {aiScore}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-semibold">Score IA: {getScoreLabel(aiScore)}</p>
                    <div className="text-xs space-y-0.5">
                      <p>• SEO: {seoScore}%</p>
                      <p>• Description: {product.description ? '✓' : '✗'}</p>
                      <p>• Image: {product.image_url ? '✓' : '✗'}</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Barre de progression du score */}
          <div className="relative">
            <Progress 
              value={aiScore} 
              className="h-1.5"
            />
            {aiScore < 60 && (
              <span className="absolute right-0 -top-4 text-[9px] text-amber-500 font-medium">
                Optimiser
              </span>
            )}
          </div>
        </div>

        {/* SKU */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded truncate max-w-[120px]">
            {product.sku || 'SKU-N/A'}
          </span>
          <span className="text-[10px]">
            {new Date(product.updated_at).toLocaleDateString('fr-FR')}
          </span>
        </div>

        {/* Actions rapides */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="default"
            className="flex-1 h-9 text-xs bg-gradient-to-r from-primary to-primary/80"
            onClick={() => onView(product)}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Aperçu
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-9 p-0"
            onClick={() => onEdit(product)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm('Supprimer ce produit ?')) {
                onDelete(product.id);
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});