import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Edit, AlertCircle, CheckCircle } from 'lucide-react';
import { useBulkEdit } from '@/hooks/useBulkEdit';

interface BulkEditField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: { value: string; label: string }[];
  unit?: string;
}

export type BulkEditItemType = 'products' | 'orders' | 'customers' | 'campaigns';

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: string[];
  itemType: BulkEditItemType;
  onApply?: (changes: Record<string, any>, selectedItems: string[]) => void;
  onSuccess?: () => void;
}

const fieldConfigs: Record<string, BulkEditField[]> = {
  products: [
    { key: 'category', label: 'Catégorie', type: 'select', options: [
      { value: 'electronics', label: 'Électronique' },
      { value: 'clothing', label: 'Vêtements' },
      { value: 'home', label: 'Maison' }
    ]},
    { key: 'price', label: 'Prix', type: 'number', unit: '€' },
    { key: 'costPrice', label: 'Prix de revient', type: 'number', unit: '€' },
    { key: 'status', label: 'Statut', type: 'select', options: [
      { value: 'active', label: 'Actif' },
      { value: 'inactive', label: 'Inactif' },
      { value: 'draft', label: 'Brouillon' }
    ]},
    { key: 'isFeatured', label: 'Produit mis en avant', type: 'boolean' }
  ],
  orders: [
    { key: 'status', label: 'Statut', type: 'select', options: [
      { value: 'pending', label: 'En attente' },
      { value: 'processing', label: 'En traitement' },
      { value: 'shipped', label: 'Expédié' },
      { value: 'delivered', label: 'Livré' },
      { value: 'cancelled', label: 'Annulé' }
    ]},
    { key: 'priority', label: 'Priorité', type: 'select', options: [
      { value: 'low', label: 'Basse' },
      { value: 'normal', label: 'Normale' },
      { value: 'high', label: 'Élevée' },
      { value: 'urgent', label: 'Urgente' }
    ]},
    { key: 'carrier', label: 'Transporteur', type: 'select', options: [
      { value: 'dhl', label: 'DHL' },
      { value: 'ups', label: 'UPS' },
      { value: 'fedex', label: 'FedEx' },
      { value: 'colissimo', label: 'Colissimo' }
    ]}
  ],
  customers: [
    { key: 'status', label: 'Statut', type: 'select', options: [
      { value: 'active', label: 'Actif' },
      { value: 'inactive', label: 'Inactif' },
      { value: 'blocked', label: 'Bloqué' }
    ]},
    { key: 'segment', label: 'Segment', type: 'select', options: [
      { value: 'vip', label: 'VIP' },
      { value: 'regular', label: 'Régulier' },
      { value: 'new', label: 'Nouveau' }
    ]},
    { key: 'isSubscribed', label: 'Abonné newsletter', type: 'boolean' }
  ],
  campaigns: [
    { key: 'status', label: 'Statut', type: 'select', options: [
      { value: 'draft', label: 'Brouillon' },
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'En pause' },
      { value: 'completed', label: 'Terminée' }
    ]},
    { key: 'budget', label: 'Budget', type: 'number', unit: '€' },
    { key: 'isAutomated', label: 'Automatisée', type: 'boolean' }
  ]
};

export const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  open,
  onOpenChange,
  selectedItems,
  itemType,
  onApply,
  onSuccess
}) => {
  const [changes, setChanges] = useState<Record<string, any>>({});
  const [enabledFields, setEnabledFields] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('fields');
  
  const bulkEditMutation = useBulkEdit(itemType);

  const fields = fieldConfigs[itemType] || [];

  const handleFieldToggle = (fieldKey: string, enabled: boolean) => {
    const newEnabledFields = new Set(enabledFields);
    if (enabled) {
      newEnabledFields.add(fieldKey);
    } else {
      newEnabledFields.delete(fieldKey);
      // Remove the field value when disabled
      setChanges(prev => {
        const { [fieldKey]: removed, ...rest } = prev;
        return rest;
      });
    }
    setEnabledFields(newEnabledFields);
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setChanges(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const handleApply = async () => {
    if (enabledFields.size === 0) {
      return;
    }

    setActiveTab('preview');

    const filteredChanges = Object.fromEntries(
      Object.entries(changes).filter(([key]) => enabledFields.has(key))
    );

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    try {
      await bulkEditMutation.mutateAsync({ 
        ids: selectedItems, 
        changes: filteredChanges 
      });
      
      clearInterval(progressInterval);
      setProgress(100);

      // Also call the legacy onApply if provided
      onApply?.(filteredChanges, selectedItems);
      onSuccess?.();
      
      // Close dialog after short delay
      setTimeout(() => {
        onOpenChange(false);
        // Reset state
        setChanges({});
        setEnabledFields(new Set());
        setActiveTab('fields');
        setProgress(0);
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
    }
  };

  const isProcessing = bulkEditMutation.isPending;

  const renderFieldInput = (field: BulkEditField) => {
    const isEnabled = enabledFields.has(field.key);
    const value = changes[field.key];

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            disabled={!isEnabled}
            placeholder={`Nouveau ${field.label.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value) || 0)}
              disabled={!isEnabled}
              placeholder="0"
              className="flex-1"
            />
            {field.unit && (
              <span className="text-sm text-muted-foreground">{field.unit}</span>
            )}
          </div>
        );

      case 'select':
        return (
          <Select 
            value={value || ''} 
            onValueChange={(val) => handleFieldChange(field.key, val)}
            disabled={!isEnabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Choisir ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
              disabled={!isEnabled}
            />
            <Label htmlFor={field.key}>Activé</Label>
          </div>
        );

      default:
        return null;
    }
  };

  const getItemTypeLabel = () => {
    switch (itemType) {
      case 'products': return 'produits';
      case 'orders': return 'commandes';
      case 'customers': return 'clients';
      case 'campaigns': return 'campagnes';
      default: return 'éléments';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modification en lot - {selectedItems.length} {getItemTypeLabel()}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fields">Champs à modifier</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div className="text-sm text-blue-800">
                  Sélectionnez les champs que vous souhaitez modifier pour tous les éléments sélectionnés.
                </div>
              </div>

              {fields.map(field => (
                <div key={field.key} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`enable-${field.key}`}
                      checked={enabledFields.has(field.key)}
                      onCheckedChange={(checked) => handleFieldToggle(field.key, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`enable-${field.key}`}
                      className="font-medium cursor-pointer"
                    >
                      {field.label}
                    </Label>
                  </div>
                  
                  <div className="ml-6">
                    {renderFieldInput(field)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-amber-600" />
                <div className="text-sm text-amber-800">
                  Vérifiez les modifications qui seront appliquées à {selectedItems.length} {getItemTypeLabel()}.
                </div>
              </div>

              {enabledFields.size > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-medium">Modifications à appliquer :</h3>
                  {Array.from(enabledFields).map(fieldKey => {
                    const field = fields.find(f => f.key === fieldKey);
                    const value = changes[fieldKey];
                    
                    if (!field) return null;

                    let displayValue = value;
                    if (field.type === 'select' && field.options) {
                      const option = field.options.find(o => o.value === value);
                      displayValue = option?.label || value;
                    } else if (field.type === 'boolean') {
                      displayValue = value ? 'Oui' : 'Non';
                    } else if (field.type === 'number' && field.unit) {
                      displayValue = `${value} ${field.unit}`;
                    }

                    return (
                      <div key={fieldKey} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="font-medium">{field.label} :</span>
                        <Badge variant="secondary">{displayValue}</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune modification sélectionnée
                </div>
              )}

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Traitement en cours...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleApply}
            disabled={enabledFields.size === 0 || isProcessing}
          >
            {isProcessing ? 'Traitement...' : `Appliquer à ${selectedItems.length} élément(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};