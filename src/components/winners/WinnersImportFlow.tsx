import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { WinnerProduct } from "@/domains/winners/types";
import { Check, Package, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WinnersImportFlowProps {
  product: WinnerProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: WinnerProduct, customData: any) => Promise<void>;
}

export const WinnersImportFlow = ({ product, isOpen, onClose, onConfirm }: WinnersImportFlowProps) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [customPrice, setCustomPrice] = useState(product?.price || 0);
  const [customMargin, setCustomMargin] = useState(30);
  const [stockQuantity, setStockQuantity] = useState(100);

  if (!product) return null;

  const estimatedCost = product.price * 0.7;
  const suggestedPrice = estimatedCost * (1 + customMargin / 100);
  const profitPerSale = suggestedPrice - estimatedCost;

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await onConfirm(product, {
        custom_price: customPrice,
        margin: customMargin,
        stock_quantity: stockQuantity,
        estimated_cost: estimatedCost
      });
      toast({
        title: "Produit importé !",
        description: `${product.title} a été ajouté à votre catalogue`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'importer le produit",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer un Winner</DialogTitle>
          <DialogDescription>
            Configurez les paramètres d'importation pour ce produit gagnant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Preview */}
          <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
            <img 
              src={product.image} 
              alt={product.title}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-semibold line-clamp-2">{product.title}</h3>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{product.source}</Badge>
                <Badge variant="outline">Score: {product.trending_score}/100</Badge>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <h4 className="font-semibold text-sm">Insights IA</h4>
            </div>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-500" />
                Forte demande du marché ({product.market_demand}/100)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-500" />
                {product.reviews || 0} avis positifs
              </li>
              <li className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3 text-orange-500" />
                Optimisez votre marge pour rester compétitif
              </li>
            </ul>
          </div>

          {/* Pricing Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prix de vente (€)</Label>
              <Input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(parseFloat(e.target.value))}
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Marge (%)</Label>
              <Input
                type="number"
                value={customMargin}
                onChange={(e) => setCustomMargin(parseFloat(e.target.value))}
                step="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Stock initial</Label>
            <Input
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(parseInt(e.target.value))}
            />
          </div>

          {/* Profit Calculation */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-emerald-500/10 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Coût estimé</p>
              <p className="text-lg font-bold text-emerald-600">€{estimatedCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prix suggéré</p>
              <p className="text-lg font-bold text-blue-600">€{suggestedPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Profit/vente</p>
              <p className="text-lg font-bold text-purple-600">€{profitPerSale.toFixed(2)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={isImporting}
              className="flex-1"
            >
              {isImporting ? (
                <>Importation...</>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Importer ce Winner
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
