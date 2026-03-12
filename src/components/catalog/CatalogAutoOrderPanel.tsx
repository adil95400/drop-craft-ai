/**
 * Panneau Auto-Order inline — commander chez les fournisseurs depuis le catalogue
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ShoppingCart, Truck, Package, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CatalogAutoOrderPanelProps {
  selectedProducts: Array<{
    id: string;
    name: string;
    price: number;
    cost_price?: number | null;
    stock_quantity?: number | null;
    sku?: string | null;
    supplier_name?: string | null;
  }>;
  onClose: () => void;
  onRefresh: () => void;
}

export function CatalogAutoOrderPanel({ selectedProducts, onClose, onRefresh }: CatalogAutoOrderPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(selectedProducts.map(p => [p.id, Math.max(10, 50 - (p.stock_quantity || 0))]))
  );
  const [supplierType, setSupplierType] = useState('auto');
  const [autoFulfill, setAutoFulfill] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const totalCost = useMemo(() =>
    selectedProducts.reduce((sum, p) => sum + (p.cost_price || p.price * 0.4) * (quantities[p.id] || 0), 0),
    [selectedProducts, quantities]
  );

  const lowStockProducts = selectedProducts.filter(p => (p.stock_quantity || 0) < 10);

  const handleOrder = async () => {
    setIsOrdering(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Create bulk order
      const orderNumber = `BO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const { error } = await supabase.from('bulk_orders').insert({
        user_id: user.id,
        order_number: orderNumber,
        status: 'pending',
        total_items: selectedProducts.length,
        total_amount: totalCost,
        notes: `Commande auto depuis le catalogue - ${selectedProducts.length} produit(s)`,
      });
      if (error) throw error;

      setOrderSuccess(true);
      toast({
        title: 'Commande créée',
        description: `${orderNumber} — ${selectedProducts.length} produit(s) pour ${totalCost.toFixed(2)} €`
      });
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="space-y-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-primary">
            <CheckCircle className="h-5 w-5" />
            Commande créée
          </SheetTitle>
        </SheetHeader>
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              Votre commande de {selectedProducts.length} produit(s) a été enregistrée.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Fermer</Button>
              <Button className="flex-1 gap-2" onClick={() => { onClose(); navigate('/orders/fulfillment'); }}>
                <Truck className="h-4 w-4" />
                Voir les commandes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Commander ({selectedProducts.length} produits)
        </SheetTitle>
        <SheetDescription>
          Créez une commande groupée chez vos fournisseurs
        </SheetDescription>
      </SheetHeader>

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm">
              <strong>{lowStockProducts.length}</strong> produit(s) en stock critique
            </p>
          </CardContent>
        </Card>
      )}

      {/* Products list with quantities */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto">
        {selectedProducts.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {p.supplier_name && <Badge variant="outline" className="text-[10px]">{p.supplier_name}</Badge>}
                <span className="text-xs text-muted-foreground">
                  Stock: {p.stock_quantity || 0}
                </span>
                <span className="text-xs text-muted-foreground">
                  Coût: {(p.cost_price || p.price * 0.4).toFixed(2)} €
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Label className="text-xs text-muted-foreground">Qté</Label>
              <Input
                type="number"
                min={1}
                value={quantities[p.id] || 10}
                onChange={e => setQuantities(prev => ({ ...prev, [p.id]: parseInt(e.target.value) || 1 }))}
                className="w-20 h-8 text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Options */}
      <div className="space-y-3 border-t pt-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Source fournisseur</Label>
          <Select value={supplierType} onValueChange={setSupplierType}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (meilleur prix)</SelectItem>
              <SelectItem value="aliexpress">AliExpress</SelectItem>
              <SelectItem value="cj">CJ Dropshipping</SelectItem>
              <SelectItem value="bigbuy">BigBuy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Auto-fulfillment</Label>
          <Switch checked={autoFulfill} onCheckedChange={setAutoFulfill} />
        </div>
      </div>

      {/* Summary */}
      <Card className="border-primary/20">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Produits</span>
            <span>{selectedProducts.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantité totale</span>
            <span>{Object.values(quantities).reduce((a, b) => a + b, 0)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Coût estimé</span>
            <span>{totalCost.toFixed(2)} €</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
        <Button className="flex-1 gap-2" onClick={handleOrder} disabled={isOrdering}>
          {isOrdering ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
          Passer la commande
        </Button>
      </div>
    </div>
  );
}
