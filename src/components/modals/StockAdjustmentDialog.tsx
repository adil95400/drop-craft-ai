import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName?: string;
  currentStock?: number;
}

export const StockAdjustmentDialog = ({ 
  open, 
  onOpenChange, 
  productId, 
  productName = "Produit", 
  currentStock = 0 
}: StockAdjustmentDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    adjustmentType: "add",
    quantity: "",
    reason: "",
    notes: "",
    notifyLowStock: true,
    autoReorder: false
  });

  const handleAdjust = () => {
    if (!formData.quantity || !formData.reason) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const qty = parseInt(formData.quantity);
    const newStock = formData.adjustmentType === "add" 
      ? currentStock + qty 
      : currentStock - qty;

    toast({
      title: "Stock mis à jour",
      description: `Stock de "${productName}" ajusté : ${currentStock} → ${newStock}`,
    });

    onOpenChange(false);
    setFormData({
      adjustmentType: "add",
      quantity: "",
      reason: "",
      notes: "",
      notifyLowStock: true,
      autoReorder: false
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajuster le Stock</DialogTitle>
          <DialogDescription>
            Ajustement du stock pour "{productName}" (Stock actuel: {currentStock})
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adjustmentType">Type d'ajustement</Label>
              <Select value={formData.adjustmentType} onValueChange={(value) => setFormData({ ...formData, adjustmentType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Ajouter au stock</SelectItem>
                  <SelectItem value="remove">Retirer du stock</SelectItem>
                  <SelectItem value="set">Définir le stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Raison de l'ajustement</Label>
            <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une raison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="received">Réception de marchandises</SelectItem>
                <SelectItem value="sold">Vente</SelectItem>
                <SelectItem value="damaged">Produit endommagé</SelectItem>
                <SelectItem value="lost">Produit perdu</SelectItem>
                <SelectItem value="returned">Retour client</SelectItem>
                <SelectItem value="inventory">Inventaire physique</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes additionnelles..."
              rows={3}
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="notifyLowStock"
                checked={formData.notifyLowStock}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyLowStock: checked })}
              />
              <Label htmlFor="notifyLowStock">Notifier si stock faible</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="autoReorder"
                checked={formData.autoReorder}
                onCheckedChange={(checked) => setFormData({ ...formData, autoReorder: checked })}
              />
              <Label htmlFor="autoReorder">Réapprovisionnement automatique</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleAdjust}>
            Ajuster le stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};