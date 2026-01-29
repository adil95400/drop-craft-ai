/**
 * SupplierGridCard - Optimized supplier card for grid display
 * Extracted from ChannableStyleSuppliersPage for better maintainability
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  Star, Package, Truck, Crown, TrendingUp, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SupplierLogo } from './SupplierLogo';
import { SupplierDefinition, COUNTRY_FLAGS } from '@/data/supplierDefinitions';

interface SupplierGridCardProps {
  definition: SupplierDefinition;
  isConnected: boolean;
  onClick: () => void;
}

export const SupplierGridCard = memo(function SupplierGridCard({ 
  definition, 
  isConnected,
  onClick 
}: SupplierGridCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer rounded-xl border bg-card p-4 transition-all",
        "hover:shadow-lg hover:border-primary/50",
        isConnected && "ring-2 ring-green-500/50 bg-green-500/5"
      )}
    >
      {/* Badges */}
      <div className="absolute top-3 right-3 flex gap-1">
        {isConnected && (
          <Badge className="bg-green-600 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connecté
          </Badge>
        )}
        {definition.popular && !isConnected && (
          <Badge variant="secondary" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Populaire
          </Badge>
        )}
        {definition.premium && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        )}
      </div>

      {/* Logo et nom */}
      <div className="flex items-center gap-3 mb-3">
        <SupplierLogo 
          name={definition.name}
          logo={definition.logo}
          country={definition.country}
          size="lg"
        />
        <div>
          <h3 className="font-medium">{definition.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{COUNTRY_FLAGS[definition.country] || '🌍'}</span>
            {definition.rating && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                {definition.rating}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {definition.description}
      </p>

      {/* Infos rapides */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        {definition.productsCount && (
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            {definition.productsCount >= 1000000 
              ? `${(definition.productsCount / 1000000).toFixed(0)}M+` 
              : definition.productsCount >= 1000 
                ? `${(definition.productsCount / 1000).toFixed(0)}K+`
                : definition.productsCount}
          </span>
        )}
        {definition.shippingTime && (
          <span className="flex items-center gap-1">
            <Truck className="w-3 h-3" />
            {definition.shippingTime}
          </span>
        )}
      </div>

      {/* Features */}
      {definition.features && (
        <div className="flex flex-wrap gap-1">
          {definition.features.slice(0, 2).map(feature => (
            <span key={feature} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {feature}
            </span>
          ))}
          {definition.features.length > 2 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              +{definition.features.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>
    </motion.div>
  );
});
