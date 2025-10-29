import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useInventoryPredictor } from '@/hooks/useInventoryPredictor';
import { Plus, Package, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { AddItemDialog } from './AddItemDialog';

export function InventoryOverview() {
  const { items, isLoadingItems, generatePrediction, isGeneratingPrediction } = useInventoryPredictor();
  const [showAddDialog, setShowAddDialog] = useState(false);

  if (isLoadingItems) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const getStockStatus = (current: number, reorder: number) => {
    const percentage = (current / reorder) * 100;
    if (current === 0) return { label: 'Rupture', color: 'bg-red-500', variant: 'destructive' as const };
    if (percentage <= 50) return { label: 'Critique', color: 'bg-orange-500', variant: 'destructive' as const };
    if (percentage <= 100) return { label: 'Bas', color: 'bg-yellow-500', variant: 'secondary' as const };
    return { label: 'Normal', color: 'bg-green-500', variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Vue d'ensemble du Stock</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter Produit
        </Button>
      </div>

      {(!items || items.length === 0) ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">
            Aucun produit dans votre inventaire. Ajoutez votre premier produit !
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un Produit
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item: any) => {
            const status = getStockStatus(item.current_stock, item.reorder_point);
            const stockPercentage = Math.min((item.current_stock / (item.reorder_point * 2)) * 100, 100);

            return (
              <Card key={item.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{item.product_name}</h3>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {item.sku && (
                        <Badge variant="outline" className="text-xs">
                          SKU: {item.sku}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {item.category && <span className="capitalize">{item.category}</span>}
                      {item.supplier && <span>• Fournisseur: {item.supplier}</span>}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generatePrediction(item.id)}
                    disabled={isGeneratingPrediction}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyser IA
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Stock Actuel</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      {item.current_stock}
                      {item.current_stock <= item.reorder_point && (
                        <TrendingDown className="h-5 w-5 text-orange-500" />
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Point de Commande</p>
                    <p className="text-2xl font-bold">{item.reorder_point}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Qté Recommandée</p>
                    <p className="text-2xl font-bold">{item.reorder_quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coût Unitaire</p>
                    <p className="text-2xl font-bold">
                      {item.unit_cost ? `${item.unit_cost}€` : '-'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Niveau de stock</span>
                    <span className="font-medium">{stockPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={stockPercentage} className={`h-2 ${status.color}`} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddItemDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}