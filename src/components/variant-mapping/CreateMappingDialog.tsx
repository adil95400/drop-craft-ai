/**
 * Create Mapping Dialog
 * Formulaire pour créer un nouveau mapping de variante
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateVariantMapping } from '@/hooks/useVariantMapping';
import { Plus, Loader2, ArrowRight, Layers } from 'lucide-react';

interface CreateMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSupplierId?: string;
  defaultProductId?: string;
}

const OPTION_TYPES = [
  { value: 'Size', label: 'Taille' },
  { value: 'Color', label: 'Couleur' },
  { value: 'Material', label: 'Matière' },
  { value: 'Style', label: 'Style' },
  { value: 'Weight', label: 'Poids' },
  { value: 'Custom', label: 'Personnalisé' },
];

export function CreateMappingDialog({ 
  open, 
  onOpenChange,
  defaultSupplierId,
  defaultProductId
}: CreateMappingDialogProps) {
  const [formData, setFormData] = useState({
    source_option_name: 'Size',
    source_option_value: '',
    target_option_name: 'Size',
    target_option_value: '',
    source_sku: '',
    is_active: true,
    auto_sync: true
  });

  const createMutation = useCreateVariantMapping();

  const handleSubmit = () => {
    if (!formData.source_option_value || !formData.target_option_value) return;

    createMutation.mutate({
      supplier_id: defaultSupplierId,
      product_id: defaultProductId,
      ...formData
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({
          source_option_name: 'Size',
          source_option_value: '',
          target_option_name: 'Size',
          target_option_value: '',
          source_sku: '',
          is_active: true,
          auto_sync: true
        });
      }
    });
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Nouveau Mapping de Variante
          </DialogTitle>
          <DialogDescription>
            Créez une correspondance entre une variante fournisseur et votre catalogue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Source Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm text-muted-foreground">Source (Fournisseur)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type d'option</Label>
                <Select
                  value={formData.source_option_name}
                  onValueChange={(v) => {
                    updateField('source_option_name', v);
                    updateField('target_option_name', v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valeur source</Label>
                <Input
                  placeholder="Ex: XL, Rouge, Cotton..."
                  value={formData.source_option_value}
                  onChange={(e) => updateField('source_option_value', e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div>
              <Label>SKU source (optionnel)</Label>
              <Input
                placeholder="SKU du fournisseur"
                value={formData.source_sku}
                onChange={(e) => updateField('source_sku', e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="p-2 bg-primary/10 rounded-full">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* Target Section */}
          <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-medium text-sm text-primary">Cible (Catalogue)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type d'option</Label>
                <Select
                  value={formData.target_option_name}
                  onValueChange={(v) => updateField('target_option_name', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valeur cible</Label>
                <Input
                  placeholder="Ex: Extra Large, Red..."
                  value={formData.target_option_value}
                  onChange={(e) => updateField('target_option_value', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Activer le mapping</p>
                <p className="text-xs text-muted-foreground">
                  Le mapping sera utilisé immédiatement
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => updateField('is_active', v)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Synchronisation automatique</p>
                <p className="text-xs text-muted-foreground">
                  Appliquer lors des imports futurs
                </p>
              </div>
              <Switch
                checked={formData.auto_sync}
                onCheckedChange={(v) => updateField('auto_sync', v)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createMutation.isPending || !formData.source_option_value || !formData.target_option_value}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Créer le Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
