import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { WinnerProduct } from "@/domains/winners/types";
import { Package, Check, X, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WinnersBatchImportProps {
  products: WinnerProduct[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (products: WinnerProduct[]) => Promise<void>;
}

export const WinnersBatchImport = ({ products, isOpen, onClose, onConfirm }: WinnersBatchImportProps) => {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);

  const topProducts = products
    .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
    .slice(0, 20);

  const toggleProduct = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === topProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(topProducts.map(p => p.id)));
    }
  };

  const handleBatchImport = async () => {
    if (selectedIds.size === 0) {
      toast({ title: "Sélectionnez au moins un produit", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setImported([]);
    setFailed([]);

    const selectedProducts = topProducts.filter(p => selectedIds.has(p.id));
    const total = selectedProducts.length;

    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i];
      try {
        await onConfirm([product]);
        setImported(prev => [...prev, product.id]);
        toast({
          title: `✅ ${product.title}`,
          description: `Importé avec succès (${i + 1}/${total})`
        });
      } catch (error) {
        setFailed(prev => [...prev, product.id]);
        console.error(`Failed to import ${product.title}:`, error);
      }
      setProgress(((i + 1) / total) * 100);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsImporting(false);
    
    toast({
      title: "🎉 Import terminé !",
      description: `${imported.length} produits importés, ${failed.length} échecs`
    });

    if (failed.length === 0) {
      onClose();
    }
  };

  const estimatedRevenue = topProducts
    .filter(p => selectedIds.has(p.id))
    .reduce((sum, p) => sum + (p.price * 0.3), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import en Masse - Winners</DialogTitle>
          <DialogDescription>
            Sélectionnez les produits à importer dans votre catalogue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Sélectionnés</p>
              <p className="text-2xl font-bold text-blue-600">{selectedIds.size}</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Importés</p>
              <p className="text-2xl font-bold text-green-600">{imported.length}</p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Profit estimé</p>
              <p className="text-2xl font-bold text-purple-600">€{estimatedRevenue.toFixed(0)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          {isImporting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Import en cours... {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={selectAll}
              disabled={isImporting}
              className="flex-1"
            >
              {selectedIds.size === topProducts.length ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>
            <Button 
              onClick={handleBatchImport}
              disabled={isImporting || selectedIds.size === 0}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              Importer {selectedIds.size} produits
            </Button>
          </div>

          {/* Product List */}
          <div className="space-y-2">
            {topProducts.map(product => {
              const isSelected = selectedIds.has(product.id);
              const isImported = imported.includes(product.id);
              const isFailed = failed.includes(product.id);

              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleProduct(product.id)}
                    disabled={isImporting || isImported}
                  />
                  
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{product.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Score: {product.trending_score}
                      </Badge>
                      <span className="text-sm font-semibold text-primary">
                        €{product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {isImported && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                  {isFailed && (
                    <X className="h-5 w-5 text-destructive" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
