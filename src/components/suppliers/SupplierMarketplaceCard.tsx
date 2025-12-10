// CARTE FOURNISSEUR/MARKETPLACE AMÉLIORÉE
// Design inspiré AutoDS/Spocket avec logos, badges et actions

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, Globe, MapPin, Package, CheckCircle2, Plug, Unplug,
  ExternalLink, Loader2, TrendingUp, Clock, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getMarketplaceLogo } from './MarketplaceLogos';
import type { BaseSupplier } from '@/types/suppliers';

interface SupplierMarketplaceCardProps {
  supplier: BaseSupplier;
  viewMode: 'grid' | 'list';
  onConnect: () => void;
  onDisconnect?: () => void;
  isConnecting?: boolean;
}

// Mapping type -> badge color
const categoryColors: Record<string, string> = {
  'dropshipping': 'bg-blue-500/10 text-blue-600 border-blue-200',
  'marketplace': 'bg-green-500/10 text-green-600 border-green-200',
  'wholesale': 'bg-purple-500/10 text-purple-600 border-purple-200',
  'print-on-demand': 'bg-pink-500/10 text-pink-600 border-pink-200',
  'premium': 'bg-amber-500/10 text-amber-600 border-amber-200',
  'electronics': 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
  'fashion': 'bg-rose-500/10 text-rose-600 border-rose-200',
};

export const SupplierMarketplaceCard = memo(({ 
  supplier, 
  viewMode, 
  onConnect, 
  onDisconnect,
  isConnecting 
}: SupplierMarketplaceCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isConnected = supplier.status === 'connected';

  const handleConnect = () => {
    if (isConnecting) return;
    onConnect();
  };

  const handleVisitWebsite = () => {
    if (supplier.website) {
      window.open(supplier.website, '_blank');
    }
  };

  // Mode liste
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
      >
        <Card className="hover:shadow-lg transition-all border-border/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {getMarketplaceLogo(supplier.id, 'md')}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">
                    {supplier.displayName}
                  </h3>
                  {isConnected && (
                    <Badge className="bg-green-500 text-white text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connecté
                    </Badge>
                  )}
                  <Badge 
                    variant="outline" 
                    className={cn("text-[10px] capitalize", categoryColors[supplier.category] || '')}
                  >
                    {supplier.category}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                  {supplier.description}
                </p>
                
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {supplier.country && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {supplier.country}
                    </span>
                  )}
                  {supplier.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {supplier.rating}/5
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={handleConnect}
                variant={isConnected ? 'outline' : 'default'}
                size="sm"
                disabled={isConnecting}
                className="flex-1 sm:flex-none"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plug className="h-4 w-4 mr-2" />
                    {isConnected ? 'Gérer' : 'Connecter'}
                  </>
                )}
              </Button>
              
              {supplier.website && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleVisitWebsite}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              
              {isConnected && onDisconnect && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={onDisconnect}
                >
                  <Unplug className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Mode grille
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className={cn(
        "h-full flex flex-col transition-all duration-300",
        "hover:shadow-xl hover:border-primary/30",
        isConnected && "border-green-500/30 bg-green-500/5"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            {getMarketplaceLogo(supplier.id, 'lg')}
            
            <div className="flex flex-col items-end gap-1">
              {isConnected && (
                <Badge className="bg-green-500 text-white text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connecté
                </Badge>
              )}
              {supplier.rating && (
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{supplier.rating}</span>
                </div>
              )}
            </div>
          </div>
          
          <h3 className="font-semibold text-lg mt-3">{supplier.displayName}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
            {supplier.description}
          </p>
        </CardHeader>

        <CardContent className="flex-1 pb-3">
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className={cn("text-[10px] capitalize", categoryColors[supplier.category] || '')}
            >
              {supplier.category}
            </Badge>
            
            {supplier.country && (
              <Badge variant="secondary" className="text-[10px]">
                <MapPin className="h-3 w-3 mr-1" />
                {supplier.country}
              </Badge>
            )}
          </div>

          {/* Quick stats on hover */}
          <motion.div 
            className="mt-4 pt-3 border-t border-border/50"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: isHovered ? 1 : 0.7 }}
          >
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <Package className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="text-xs font-medium mt-1">10k+</p>
                <p className="text-[10px] text-muted-foreground">Produits</p>
              </div>
              <div>
                <Clock className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="text-xs font-medium mt-1">2-5j</p>
                <p className="text-[10px] text-muted-foreground">Livraison</p>
              </div>
              <div>
                <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="text-xs font-medium mt-1">+15%</p>
                <p className="text-[10px] text-muted-foreground">Marge</p>
              </div>
            </div>
          </motion.div>
        </CardContent>

        <CardFooter className="pt-0 gap-2">
          <Button 
            onClick={handleConnect}
            variant={isConnected ? 'outline' : 'default'}
            className="flex-1"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {isConnected ? (
                  <>Gérer</>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Connecter
                  </>
                )}
              </>
            )}
          </Button>
          
          {isConnected && onDisconnect && (
            <Button 
              variant="destructive" 
              size="icon"
              onClick={onDisconnect}
            >
              <Unplug className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
});

SupplierMarketplaceCard.displayName = 'SupplierMarketplaceCard';

export default SupplierMarketplaceCard;
