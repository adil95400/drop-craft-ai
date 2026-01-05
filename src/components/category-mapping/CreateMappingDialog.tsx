/**
 * Create Mapping Dialog
 */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCategoryMapping, useSourceTypeOptions, useDestinationTypeOptions } from '@/hooks/useCategoryMapping';

interface CreateMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMappingDialog({ open, onOpenChange }: CreateMappingDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<string>('manual');
  const [destinationType, setDestinationType] = useState<string>('google');
  const [defaultCategory, setDefaultCategory] = useState('');
  const [autoMapEnabled, setAutoMapEnabled] = useState(false);

  const createMapping = useCreateCategoryMapping();
  const sourceOptions = useSourceTypeOptions();
  const destinationOptions = useDestinationTypeOptions();

  const resetForm = () => {
    setName('');
    setDescription('');
    setSourceType('manual');
    setDestinationType('google');
    setDefaultCategory('');
    setAutoMapEnabled(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    await createMapping.mutateAsync({
      name,
      description,
      source_type: sourceType as 'supplier' | 'import' | 'manual',
      destination_type: destinationType as 'shopify' | 'google' | 'facebook' | 'custom',
      default_category: defaultCategory || undefined,
      auto_map_enabled: autoMapEnabled,
    });

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau mapping de catégories</DialogTitle>
          <DialogDescription>
            Créez un mapping pour convertir vos catégories vers une plateforme
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Nom du mapping</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Fournisseur A → Google Shopping"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Source</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destination</Label>
              <Select value={destinationType} onValueChange={setDestinationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {destinationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="default">Catégorie par défaut (optionnel)</Label>
            <Input
              id="default"
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value)}
              placeholder="Catégorie utilisée si aucune correspondance"
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Auto-mapping IA</p>
              <p className="text-sm text-muted-foreground">
                Suggestions automatiques basées sur l'IA
              </p>
            </div>
            <Switch
              checked={autoMapEnabled}
              onCheckedChange={setAutoMapEnabled}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!name.trim() || createMapping.isPending}
          >
            Créer le mapping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
