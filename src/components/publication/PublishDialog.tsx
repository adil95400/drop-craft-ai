import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Store, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { PublishProductsService } from '@/services/publishProducts.service';
import { usePublishProducts } from '@/hooks/usePublishProducts';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productIds: string[];
  onComplete?: () => void;
}

export function PublishDialog({ open, onOpenChange, productIds, onComplete }: PublishDialogProps) {
  const { user } = useAuth();
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const { publishToStores, isPublishing, bulkPublish, isBulkPublishing } = usePublishProducts();

  const { data: stores = [], isLoading: isLoadingStores } = useQuery({
    queryKey: ['user-stores', user?.id],
    queryFn: () => PublishProductsService.getUserStores(user!.id),
    enabled: !!user && open,
  });

  const toggleStore = (storeId: string) => {
    setSelectedStores(prev =>
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  const selectAll = () => {
    if (selectedStores.length === stores.length) {
      setSelectedStores([]);
    } else {
      setSelectedStores(stores.map(s => s.id));
    }
  };

  const handlePublish = () => {
    if (stores.length > 0 && selectedStores.length > 0) {
      // Publish each product to selected stores
      for (const productId of productIds) {
        publishToStores(productId, selectedStores);
      }
    } else {
      // Fallback: bulk publish without store selection
      bulkPublish(productIds);
    }
    onOpenChange(false);
    setSelectedStores([]);
    onComplete?.();
  };

  const busy = isPublishing || isBulkPublishing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Publier les produits
          </DialogTitle>
          <DialogDescription>
            Choisissez où publier vos produits sélectionnés
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product count */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {productIds.length} produit{productIds.length > 1 ? 's' : ''} sélectionné{productIds.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Store selection */}
          {isLoadingStores ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Chargement des boutiques...</span>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <Store className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucune boutique connectée. Les produits seront publiés dans le catalogue principal.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Boutiques cibles</Label>
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                  {selectedStores.length === stores.length ? 'Désélectionner tout' : 'Tout sélectionner'}
                </Button>
              </div>
              {stores.map((store) => (
                <label
                  key={store.id}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedStores.includes(store.id)}
                    onCheckedChange={() => toggleStore(store.id)}
                    disabled={busy}
                  />
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{store.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {store.platform}
                    </Badge>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
          <Button
            onClick={handlePublish}
            disabled={busy || (stores.length > 0 && selectedStores.length === 0)}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Publier {productIds.length} produit{productIds.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
