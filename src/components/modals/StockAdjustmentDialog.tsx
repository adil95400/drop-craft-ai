import { useState } from "react";
import { motion } from 'framer-motion';
import { Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { OptimizedModal } from "@/components/ui/optimized-modal";
import { EnhancedInput, EnhancedSelect, EnhancedSwitch, FormGrid } from "@/components/ui/optimized-form";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName?: string;
  currentStock?: number;
}

const ADJUSTMENT_TYPES = [
  { value: 'add', label: 'Ajouter au stock' },
  { value: 'remove', label: 'Retirer du stock' },
  { value: 'set', label: 'Définir le stock' },
];

const ADJUSTMENT_REASONS = [
  { value: 'received', label: 'Réception de marchandises', description: 'Nouvelle livraison fournisseur' },
  { value: 'sold', label: 'Vente', description: 'Vente hors système' },
  { value: 'damaged', label: 'Produit endommagé', description: 'Produit inutilisable' },
  { value: 'lost', label: 'Produit perdu', description: 'Introuvable en entrepôt' },
  { value: 'returned', label: 'Retour client', description: 'Article retourné' },
  { value: 'inventory', label: 'Inventaire physique', description: 'Correction d\'inventaire' },
  { value: 'other', label: 'Autre', description: 'Raison personnalisée' },
];

export const StockAdjustmentDialog = ({ 
  open, 
  onOpenChange, 
  productId, 
  productName = "Produit", 
  currentStock = 0 
}: StockAdjustmentDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    adjustmentType: "add",
    quantity: "",
    reason: "",
    notes: "",
    notifyLowStock: true,
    autoReorder: false
  });

  const calculateNewStock = () => {
    const qty = parseInt(formData.quantity) || 0;
    switch (formData.adjustmentType) {
      case 'add': return currentStock + qty;
      case 'remove': return Math.max(0, currentStock - qty);
      case 'set': return qty;
      default: return currentStock;
    }
  };

  const handleAdjust = async () => {
    if (!formData.quantity || !formData.reason) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newStock = calculateNewStock();

    toast({
      title: "Stock mis à jour",
      description: `Stock de "${productName}" ajusté : ${currentStock} → ${newStock}`,
    });

    setIsSubmitting(false);
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

  const newStock = calculateNewStock();
  const stockDiff = newStock - currentStock;

  return (
    <OptimizedModal
      open={open}
      onOpenChange={onOpenChange}
      title="Ajuster le Stock"
      description={`${productName} • Stock actuel: ${currentStock} unités`}
      icon={<Package className="h-5 w-5" />}
      size="md"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button 
            onClick={handleAdjust} 
            disabled={isSubmitting || !formData.quantity || !formData.reason}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Ajuster le stock
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stock Preview */}
        <motion.div 
          className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Nouveau stock</p>
              <p className="text-3xl font-bold">{newStock}</p>
            </div>
            {formData.quantity && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-lg font-semibold px-3 py-1 rounded-full ${
                  stockDiff > 0 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                    : stockDiff < 0 
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {stockDiff > 0 ? '+' : ''}{stockDiff}
              </motion.div>
            )}
          </div>
        </motion.div>

        <FormGrid columns={2}>
          <EnhancedSelect
            label="Type d'ajustement"
            value={formData.adjustmentType}
            onValueChange={(value) => setFormData({ ...formData, adjustmentType: value })}
            options={ADJUSTMENT_TYPES}
            required
          />
          <EnhancedInput
            label="Quantité"
            type="number"
            min={0}
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="0"
            required
          />
        </FormGrid>
        
        <EnhancedSelect
          label="Raison de l'ajustement"
          value={formData.reason}
          onValueChange={(value) => setFormData({ ...formData, reason: value })}
          options={ADJUSTMENT_REASONS}
          placeholder="Sélectionner une raison"
          required
        />
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optionnel)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes additionnelles..."
            rows={3}
            className="resize-none"
          />
        </div>
        
        <div className="space-y-3">
          <EnhancedSwitch
            label="Notifier si stock faible"
            description="Recevoir une alerte quand le stock descend sous le seuil"
            checked={formData.notifyLowStock}
            onCheckedChange={(checked) => setFormData({ ...formData, notifyLowStock: checked })}
          />
          
          <EnhancedSwitch
            label="Réapprovisionnement automatique"
            description="Commander automatiquement auprès du fournisseur"
            checked={formData.autoReorder}
            onCheckedChange={(checked) => setFormData({ ...formData, autoReorder: checked })}
          />
        </div>
      </div>
    </OptimizedModal>
  );
};
