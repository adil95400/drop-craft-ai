/**
 * ConnectedSupplierCard - Card for displaying connected suppliers
 * Extracted from ChannableStyleSuppliersPage
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Star, RefreshCw, Settings, ExternalLink, Trash2, MoreVertical 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SupplierLogo } from './SupplierLogo';
import { SupplierDefinition, COUNTRY_FLAGS } from '@/data/supplierDefinitions';
import type { Supplier } from '@/hooks/useRealSuppliers';

interface ConnectedSupplierCardProps {
  supplier: Supplier;
  definition?: SupplierDefinition;
  onConfigure: () => void;
  onSync: () => void;
  onDelete: () => void;
  isSyncing: boolean;
}

export const ConnectedSupplierCard = memo(function ConnectedSupplierCard({ 
  supplier,
  definition,
  onConfigure,
  onSync,
  onDelete,
  isSyncing
}: ConnectedSupplierCardProps) {
  const isActive = supplier.status === 'active';
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all",
      isActive ? "border-green-500/30 bg-green-500/5" : "border-muted"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <SupplierLogo 
              name={supplier.name || definition?.name || 'Unknown'}
              logo={definition?.logo}
              country={supplier.country || definition?.country}
              size="lg"
              className="border"
            />
            <div>
              <h4 className="font-medium flex items-center gap-2">
                {supplier.name}
                {COUNTRY_FLAGS[supplier.country || '']}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                  {isActive ? 'Actif' : 'Inactif'}
                </Badge>
                {supplier.rating && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    {supplier.rating}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSync} disabled={isSyncing}>
                <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
                Synchroniser
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onConfigure}>
                <Settings className="w-4 h-4 mr-2" />
                Configurer
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={supplier.website || '#'} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visiter le site
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {definition?.features && (
          <div className="flex flex-wrap gap-1 mt-3">
            {definition.features.slice(0, 3).map(feature => (
              <span key={feature} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {feature}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
