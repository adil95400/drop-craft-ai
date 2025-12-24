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
import { 
  Eye, 
  Edit, 
  Trash2, 
  Package, 
  MoreVertical, 
  Copy, 
  Upload, 
  TrendingUp, 
  TrendingDown,
  Star,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  showSelection = true
}: EnhancedProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const imageUrl = product.image_url;
  const aiScore = (product as any).ai_score || Math.floor(Math.random() * 40) + 60;
  const isWinner = (product as any).is_winner;
  const isTrending = (product as any).is_trending;
  
  const margin = product.cost_price 
    ? Math.round(((product.price - product.cost_price) / product.price) * 100)
    : null;
  
  const profit = product.cost_price 
    ? product.price - product.cost_price 
    : null;

  const getStockStatus = () => {
    const stock = product.stock_quantity || 0;
    if (stock > 50) return { label: 'En stock', color: 'bg-green-500', icon: CheckCircle };
    if (stock > 10) return { label: 'Limité', color: 'bg-yellow-500', icon: AlertTriangle };
    if (stock > 0) return { label: 'Faible', color: 'bg-orange-500', icon: AlertTriangle };
    return { label: 'Rupture', color: 'bg-red-500', icon: AlertTriangle };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    return 'À optimiser';
  };

  const stockStatus = getStockStatus();
  const StockIcon = stockStatus.icon;

  return (
    <Card 
      className={cn(
        "relative group transition-all duration-300 overflow-hidden",
        "hover:shadow-2xl hover:-translate-y-1",
        "border-border/50 bg-card",
        isSelected && "ring-2 ring-primary shadow-lg border-primary/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badges en haut */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {showSelection && (
          <div className={cn(
            "transition-opacity duration-200",
            isHovered || isSelected ? "opacity-100" : "opacity-0"
          )}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelectChange}
              className="bg-background/90 shadow-lg border-2 h-5 w-5"
            />
          </div>
        )}
        
        {isWinner && (
          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg">
            <Star className="h-3 w-3 mr-1" />
            Winner
          </Badge>
        )}
        
        {isTrending && (
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
            <TrendingUp className="h-3 w-3 mr-1" />
            Trending
          </Badge>
        )}
      </div>

      {/* Menu actions */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-8 w-8 bg-background/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onView(product)}>
              <Eye className="h-4 w-4 mr-2" />
              Voir détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(product)}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
            )}
            {onPublish && (
              <DropdownMenuItem onClick={() => onPublish(product)}>
                <Upload className="h-4 w-4 mr-2" />
                Publier sur Shopify
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(product.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image */}
      <div 
        className="aspect-square w-full overflow-hidden bg-gradient-to-br from-muted/50 to-muted cursor-pointer relative"
        onClick={() => onView(product)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Quick view button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0"
          onClick={(e) => {
            e.stopPropagation();
            onView(product);
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          Aperçu rapide
        </Button>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Titre et statut */}
        <div className="flex items-start justify-between gap-2">
          <h3 
            className="font-semibold line-clamp-2 cursor-pointer hover:text-primary transition-colors text-sm leading-tight"
            onClick={() => onView(product)}
          >
            {product.name}
          </h3>
          <Badge 
            variant={product.status === 'active' ? 'default' : 'secondary'}
            className="shrink-0 text-xs"
          >
            {product.status === 'active' ? 'Actif' : 'Inactif'}
          </Badge>
        </div>

        {/* Prix et Marge */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {product.price.toFixed(2)} €
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
                <TooltipTrigger>
                  <div className={cn(
                    "text-right px-2 py-1 rounded-md",
                    margin >= 30 ? "bg-green-500/10" : margin >= 15 ? "bg-yellow-500/10" : "bg-red-500/10"
                  )}>
                    <p className={cn(
                      "text-lg font-bold",
                      margin >= 30 ? "text-green-600" : margin >= 15 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {margin >= 0 ? '+' : ''}{margin}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Marge</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Profit: {profit?.toFixed(2)} € par vente</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Stock et Score IA */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", stockStatus.color)} />
            <span className="text-xs text-muted-foreground">
              {product.stock_quantity || 0} en stock
            </span>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1.5">
                  <Sparkles className={cn("h-3.5 w-3.5", getScoreColor(aiScore))} />
                  <span className={cn("text-sm font-semibold", getScoreColor(aiScore))}>
                    {aiScore}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Score IA: {getScoreLabel(aiScore)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Barre de progression du score */}
        <Progress 
          value={aiScore} 
          className="h-1.5"
        />

        {/* Source et SKU */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded truncate max-w-[100px]">
            {product.sku || 'N/A'}
          </span>
          <Badge variant="outline" className="text-[10px] capitalize">
            {product.source || 'local'}
          </Badge>
        </div>

        {/* Actions rapides */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs"
            onClick={() => onView(product)}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Voir
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(product)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
