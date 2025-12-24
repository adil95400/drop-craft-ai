import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RepricingPreview } from '@/hooks/useRepricingEngine';

interface RepricingPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: {
    success: boolean;
    total_products: number;
    preview_count: number;
    preview: RepricingPreview[];
  } | null;
  onApply?: () => void;
  isApplying?: boolean;
}

export function RepricingPreviewDialog({ 
  open, 
  onOpenChange, 
  preview,
  onApply,
  isApplying
}: RepricingPreviewDialogProps) {
  if (!preview) return null;

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const totalIncrease = preview.preview.filter(p => p.price_change > 0).length;
  const totalDecrease = preview.preview.filter(p => p.price_change < 0).length;
  const totalUnchanged = preview.preview.filter(p => p.price_change === 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Prévisualisation des changements</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Badge variant="outline" className="bg-green-50">
            <TrendingUp className="h-3 w-3 mr-1" />
            {totalIncrease} hausses
          </Badge>
          <Badge variant="outline" className="bg-red-50">
            <TrendingDown className="h-3 w-3 mr-1" />
            {totalDecrease} baisses
          </Badge>
          <Badge variant="outline">
            {totalUnchanged} inchangés
          </Badge>
          <Badge variant="secondary">
            {preview.total_products} produits au total
          </Badge>
        </div>

        <ScrollArea className="h-[400px] rounded-md border">
          <div className="p-4">
            <table className="w-full text-sm">
              <thead className="border-b sticky top-0 bg-background">
                <tr>
                  <th className="text-left py-2 font-medium">Produit</th>
                  <th className="text-right py-2 font-medium">Prix actuel</th>
                  <th className="text-right py-2 font-medium">Nouveau prix</th>
                  <th className="text-right py-2 font-medium">Variation</th>
                  <th className="text-right py-2 font-medium">Marge</th>
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((item) => (
                  <tr key={item.product_id} className="border-b">
                    <td className="py-2 max-w-[200px] truncate">
                      {item.product_name}
                    </td>
                    <td className="text-right py-2">
                      {item.current_price.toFixed(2)}€
                    </td>
                    <td className="text-right py-2 font-medium">
                      {item.new_price.toFixed(2)}€
                    </td>
                    <td className={`text-right py-2 ${getPriceChangeColor(item.price_change)}`}>
                      <span className="flex items-center justify-end gap-1">
                        {getPriceChangeIcon(item.price_change)}
                        {item.price_change > 0 ? '+' : ''}{item.price_change.toFixed(2)}€
                        <span className="text-xs">
                          ({item.price_change_percent}%)
                        </span>
                      </span>
                    </td>
                    <td className="text-right py-2">
                      <span className="text-muted-foreground">{item.current_margin}%</span>
                      {' → '}
                      <span className="font-medium">{item.new_margin}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {onApply && (
            <Button onClick={onApply} disabled={isApplying}>
              {isApplying ? 'Application...' : 'Appliquer ces changements'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
