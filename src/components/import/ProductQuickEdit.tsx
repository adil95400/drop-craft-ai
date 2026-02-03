import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Save, X, Calculator } from 'lucide-react';
import type { ImportedProduct } from '@/types/import';

interface ProductQuickEditProps {
  product: ImportedProduct;
  onClose: () => void;
  onSave: (product: ImportedProduct) => void;
}

export const ProductQuickEdit = ({ product, onClose, onSave }: ProductQuickEditProps) => {
  const [editedProduct, setEditedProduct] = useState<ImportedProduct>({ ...product });

  const handleSave = () => {
    onSave(editedProduct);
  };

  const calculateProfitMargin = () => {
    if (editedProduct.price && editedProduct.cost_price) {
      const margin = ((Number(editedProduct.price) - Number(editedProduct.cost_price)) / Number(editedProduct.price)) * 100;
      return margin.toFixed(2);
    }
    return '0';
  };

  const updateField = (field: keyof ImportedProduct, value: any) => {
    setEditedProduct(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Édition rapide - {editedProduct.name}
          </DialogTitle>
          <DialogDescription>
            Modifiez rapidement les informations essentielles du produit
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informations de base</TabsTrigger>
            <TabsTrigger value="pricing">Prix & Marges</TabsTrigger>
            <TabsTrigger value="status">Statut & Révision</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom du produit</Label>
                <Input
                  id="name"
                  value={editedProduct.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={editedProduct.sku || ''}
                  onChange={(e) => updateField('sku', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedProduct.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select value={editedProduct.category || ''} onValueChange={(value) => updateField('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Électronique</SelectItem>
                    <SelectItem value="clothing">Vêtements</SelectItem>
                    <SelectItem value="home">Maison & Jardin</SelectItem>
                    <SelectItem value="sports">Sports & Loisirs</SelectItem>
                    <SelectItem value="beauty">Beauté & Santé</SelectItem>
                    <SelectItem value="automotive">Automobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="supplier_name">Fournisseur</Label>
                <Input
                  id="supplier_name"
                  value={editedProduct.supplier_name || ''}
                  onChange={(e) => updateField('supplier_name', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cost_price">Prix de coût</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  value={editedProduct.cost_price || ''}
                  onChange={(e) => updateField('cost_price', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="price">Prix de vente</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={editedProduct.price}
                  onChange={(e) => updateField('price', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="currency">Devise</Label>
                <Select value={editedProduct.currency || 'EUR'} onValueChange={(value) => updateField('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <Label className="text-sm font-medium">Analyse des prix</Label>
              <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                <div>
                  <span className="text-muted-foreground">Marge bénéficiaire:</span>
                  <span className="font-medium ml-2">{calculateProfitMargin()}%</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Statut de publication</Label>
                <Select value={editedProduct.status || 'draft'} onValueChange={(value) => updateField('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="review_status">Statut de révision</Label>
                <Select value={editedProduct.review_status || 'pending'} onValueChange={(value) => updateField('review_status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ai_optimized"
                checked={editedProduct.ai_optimized || false}
                onCheckedChange={(checked) => updateField('ai_optimized', checked)}
              />
              <Label htmlFor="ai_optimized">Optimisé par IA</Label>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-1" />
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};