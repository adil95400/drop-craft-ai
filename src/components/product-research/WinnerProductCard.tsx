import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart,
  ExternalLink,
  TrendingUp,
  Eye,
  DollarSign,
  Activity,
  ShoppingCart,
  Share2,
  BarChart3,
  Star,
  Flame,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WinnerProduct {
  id: string;
  name: string;
  image: string;
  category: string;
  platform: string;
  winnerScore: number;
  trendScore: number;
  engagementRate: number;
  estimatedProfit: number;
  price: number;
  costPrice: number;
  views: number;
  orders: number;
  saturation: 'low' | 'medium' | 'high';
  tags: string[];
  createdAt: string;
  isFavorite?: boolean;
  supplierUrl?: string;
}

interface WinnerProductCardProps {
  product: WinnerProduct;
  onToggleFavorite?: (id: string) => void;
  onImport?: (product: WinnerProduct) => void;
  onViewDetails?: (product: WinnerProduct) => void;
}

export function WinnerProductCard({ 
  product, 
  onToggleFavorite,
  onImport,
  onViewDetails 
}: WinnerProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getSaturationBadge = (saturation: string) => {
    switch (saturation) {
      case 'low':
        return <Badge className="bg-green-500/20 text-green-700 border-0">🟢 Faible</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-0">🟡 Modérée</Badge>;
      case 'high':
        return <Badge className="bg-red-500/20 text-red-700 border-0">🔴 Élevée</Badge>;
      default:
        return null;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const profitMargin = ((product.price - product.costPrice) / product.price * 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.image || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <div className="flex flex-col gap-2">
              {product.winnerScore >= 80 && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 border-0 gap-1">
                  <Flame className="w-3 h-3" />
                  Winner
                </Badge>
              )}
              <Badge variant="secondary" className="backdrop-blur-sm">
                {product.platform}
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full backdrop-blur-sm transition-colors",
                product.isFavorite 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-white/80 text-gray-600 hover:bg-white"
              )}
              onClick={() => onToggleFavorite?.(product.id)}
            >
              <Heart className={cn("w-4 h-4", product.isFavorite && "fill-current")} />
            </Button>
          </div>

          {/* Bottom Quick Actions */}
          <div className={cn(
            "absolute bottom-3 left-3 right-3 flex gap-2 transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Button 
              size="sm" 
              className="flex-1 backdrop-blur-sm"
              onClick={() => onImport?.(product)}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Importer
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              className="backdrop-blur-sm"
              onClick={() => onViewDetails?.(product)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Title & Category */}
          <div>
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
          </div>

          {/* Winner Score */}
          <div className={cn(
            "p-3 rounded-lg border",
            getScoreBg(product.winnerScore)
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-1">
                <Target className="w-4 h-4" />
                Winner Score
              </span>
              <span className={cn("text-2xl font-bold", getScoreColor(product.winnerScore))}>
                {product.winnerScore}%
              </span>
            </div>
            <Progress value={product.winnerScore} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 rounded bg-blue-500/10">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Tendance</p>
                <p className="font-semibold">{product.trendScore}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 rounded bg-purple-500/10">
                <Activity className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Engagement</p>
                <p className="font-semibold">{product.engagementRate}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 rounded bg-green-500/10">
                <DollarSign className="w-3.5 h-3.5 text-green-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Profit</p>
                <p className="font-semibold text-green-600">+{profitMargin}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 rounded bg-orange-500/10">
                <Eye className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Vues</p>
                <p className="font-semibold">{formatNumber(product.views)}</p>
              </div>
            </div>
          </div>

          {/* Pricing & Saturation */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Prix vente</p>
              <p className="text-lg font-bold">{product.price}€</p>
            </div>
            {getSaturationBadge(product.saturation)}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* External Link */}
          {product.supplierUrl && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-muted-foreground hover:text-primary"
              onClick={() => window.open(product.supplierUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Voir chez le fournisseur
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
