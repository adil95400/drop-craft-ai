import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductVariant {
  id?: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  stock: number;
  options: Record<string, string>;
}

interface ProductVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  variant?: ProductVariant;
  onSave?: (variant: ProductVariant) => void;
}

export const ProductVariantDialog: React.FC<ProductVariantDialogProps> = ({
  open,
  onOpenChange,
  productId,
  variant,
  onSave
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProductVariant>(() => ({
    name: variant?.name || '',
    sku: variant?.sku || '',
    price: variant?.price || 0,
    costPrice: variant?.costPrice || 0,
    stock: variant?.stock || 0,
    options: variant?.options || {}
  }));

  const [newOptionKey, setNewOptionKey] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sku) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    onSave?.(formData);
    toast({
      title: "Succès",
      description: variant ? "Variante mise à jour" : "Variante créée avec succès"
    });
    onOpenChange(false);
  };

  const addOption = () => {
    if (newOptionKey && newOptionValue) {
      setFormData(prev => ({
        ...prev,
        options: {
          ...prev.options,
          [newOptionKey]: newOptionValue
        }
      }));
      setNewOptionKey('');
      setNewOptionValue('');
    }
  };

  const removeOption = (key: string) => {
    setFormData(prev => ({
      ...prev,
      options: Object.fromEntries(
        Object.entries(prev.options).filter(([k]) => k !== key)
      )
    }));
  };

  const profitMargin = formData.price > 0 && formData.costPrice > 0 
    ? ((formData.price - formData.costPrice) / formData.costPrice * 100).toFixed(1)
    : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {variant ? 'Modifier la variante' : 'Créer une variante'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Informations de base</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la variante *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: iPhone 15 Pro - Noir - 256GB"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="ex: IP15P-BLK-256"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-medium">Prix et coûts</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prix de vente (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="costPrice">Prix de revient (€)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Marge bénéficiaire</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                  <span className="text-sm font-medium">
                    {profitMargin}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-4">
            <h3 className="font-medium">Stock</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Quantité en stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Options/Attributes */}
          <div className="space-y-4">
            <h3 className="font-medium">Options et attributs</h3>
            
            {/* Existing Options */}
            {Object.entries(formData.options).length > 0 && (
              <div className="space-y-2">
                <Label>Options actuelles</Label>
                <div className="space-y-2">
                  {Object.entries(formData.options).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <Badge variant="outline">{key}</Badge>
                      <span className="flex-1">{value}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Option */}
            <div className="space-y-2">
              <Label>Ajouter une option</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={newOptionKey} onValueChange={setNewOptionKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Couleur</SelectItem>
                    <SelectItem value="size">Taille</SelectItem>
                    <SelectItem value="material">Matériau</SelectItem>
                    <SelectItem value="capacity">Capacité</SelectItem>
                    <SelectItem value="style">Style</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Valeur"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  disabled={!newOptionKey || !newOptionValue}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {variant ? 'Mettre à jour' : 'Créer la variante'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
