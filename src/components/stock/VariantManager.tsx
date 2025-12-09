import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useProductVariants, useCreateVariant, useUpdateVariant, useDeleteVariant } from '@/hooks/useStockManagement';
import { Plus, Edit, Trash2, Package, Search, Filter, Copy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export function VariantManager() {
  const { data: variants, isLoading } = useProductVariants();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();
  
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [formData, setFormData] = useState({
    sku: '',
    title: '',
    product_id: '',
    option1_name: 'Taille',
    option1_value: '',
    option2_name: 'Couleur',
    option2_value: '',
    option3_name: '',
    option3_value: '',
    price: 0,
    compare_at_price: 0,
    cost_price: 0,
    barcode: '',
    weight: 0,
    weight_unit: 'kg',
    inventory_quantity: 0,
    requires_shipping: true,
    taxable: true,
    is_active: true
  });
  
  const filteredVariants = variants?.filter((v) => {
    const searchLower = search.toLowerCase();
    return (
      v.sku?.toLowerCase().includes(searchLower) ||
      v.title?.toLowerCase().includes(searchLower) ||
      v.option1_value?.toLowerCase().includes(searchLower) ||
      v.option2_value?.toLowerCase().includes(searchLower)
    );
  });
  
  const resetForm = () => {
    setFormData({
      sku: '',
      title: '',
      product_id: '',
      option1_name: 'Taille',
      option1_value: '',
      option2_name: 'Couleur',
      option2_value: '',
      option3_name: '',
      option3_value: '',
      price: 0,
      compare_at_price: 0,
      cost_price: 0,
      barcode: '',
      weight: 0,
      weight_unit: 'kg',
      inventory_quantity: 0,
      requires_shipping: true,
      taxable: true,
      is_active: true
    });
    setEditingVariant(null);
  };
  
  const handleEdit = (variant: any) => {
    setEditingVariant(variant);
    setFormData({
      sku: variant.sku,
      title: variant.title || '',
      product_id: variant.product_id,
      option1_name: variant.option1_name || 'Taille',
      option1_value: variant.option1_value || '',
      option2_name: variant.option2_name || 'Couleur',
      option2_value: variant.option2_value || '',
      option3_name: variant.option3_name || '',
      option3_value: variant.option3_value || '',
      price: variant.price || 0,
      compare_at_price: variant.compare_at_price || 0,
      cost_price: variant.cost_price || 0,
      barcode: variant.barcode || '',
      weight: variant.weight || 0,
      weight_unit: variant.weight_unit || 'kg',
      inventory_quantity: variant.inventory_quantity || 0,
      requires_shipping: variant.requires_shipping ?? true,
      taxable: variant.taxable ?? true,
      is_active: variant.is_active ?? true
    });
    setIsDialogOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingVariant) {
      await updateVariant.mutateAsync({ id: editingVariant.id, ...formData });
    } else {
      await createVariant.mutateAsync(formData);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette variante ?')) {
      await deleteVariant.mutateAsync(id);
    }
  };
  
  const handleDuplicate = async (variant: any) => {
    await createVariant.mutateAsync({
      ...variant,
      id: undefined,
      sku: `${variant.sku}-COPY`,
      title: `${variant.title} (copie)`
    });
    toast.success('Variante dupliquée');
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">Variantes produits ({variants?.length || 0})</CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher SKU, titre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle variante
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingVariant ? 'Modifier la variante' : 'Ajouter une variante'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          placeholder="PROD-001-S-RED"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="barcode">Code-barres</Label>
                        <Input
                          id="barcode"
                          value={formData.barcode}
                          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                          placeholder="1234567890123"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="T-shirt - Taille S - Rouge"
                      />
                    </div>
                    
                    {/* Options */}
                    <div className="space-y-3">
                      <Label>Options de variante</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Nom (ex: Taille)"
                          value={formData.option1_name}
                          onChange={(e) => setFormData({ ...formData, option1_name: e.target.value })}
                        />
                        <Input
                          placeholder="Valeur (ex: S, M, L)"
                          value={formData.option1_value}
                          onChange={(e) => setFormData({ ...formData, option1_value: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Nom (ex: Couleur)"
                          value={formData.option2_name}
                          onChange={(e) => setFormData({ ...formData, option2_name: e.target.value })}
                        />
                        <Input
                          placeholder="Valeur (ex: Rouge)"
                          value={formData.option2_value}
                          onChange={(e) => setFormData({ ...formData, option2_value: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Nom (optionnel)"
                          value={formData.option3_name}
                          onChange={(e) => setFormData({ ...formData, option3_name: e.target.value })}
                        />
                        <Input
                          placeholder="Valeur"
                          value={formData.option3_value}
                          onChange={(e) => setFormData({ ...formData, option3_value: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    {/* Pricing */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Prix</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Prix comparé</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.compare_at_price}
                          onChange={(e) => setFormData({ ...formData, compare_at_price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Coût</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.cost_price}
                          onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    
                    {/* Stock & Weight */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Stock</Label>
                        <Input
                          type="number"
                          value={formData.inventory_quantity}
                          onChange={(e) => setFormData({ ...formData, inventory_quantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Poids</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unité</Label>
                        <Select
                          value={formData.weight_unit}
                          onValueChange={(value) => setFormData({ ...formData, weight_unit: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="lb">lb</SelectItem>
                            <SelectItem value="oz">oz</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Toggles */}
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.requires_shipping}
                          onCheckedChange={(checked) => setFormData({ ...formData, requires_shipping: checked })}
                        />
                        <Label>Expédition requise</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.taxable}
                          onCheckedChange={(checked) => setFormData({ ...formData, taxable: checked })}
                        />
                        <Label>Taxable</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={createVariant.isPending || updateVariant.isPending}>
                      {editingVariant ? 'Mettre à jour' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Titre / Options</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="text-right">Coût</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!filteredVariants || filteredVariants.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search ? 'Aucun résultat trouvé' : 'Aucune variante configurée'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredVariants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{variant.title || 'Sans titre'}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {variant.option1_value && (
                            <Badge variant="outline" className="text-xs">
                              {variant.option1_name}: {variant.option1_value}
                            </Badge>
                          )}
                          {variant.option2_value && (
                            <Badge variant="outline" className="text-xs">
                              {variant.option2_name}: {variant.option2_value}
                            </Badge>
                          )}
                          {variant.option3_value && (
                            <Badge variant="outline" className="text-xs">
                              {variant.option3_name}: {variant.option3_value}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {variant.price?.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {variant.cost_price?.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={variant.inventory_quantity > 0 ? 'default' : 'destructive'}>
                        {variant.inventory_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={variant.is_active ? 'default' : 'secondary'}>
                        {variant.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(variant)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(variant)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(variant.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
