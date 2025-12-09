import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStockLevels, useUpdateStockLevel } from '@/hooks/useStockManagement';
import { Search, Edit, AlertTriangle, Package, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function StockLevelsTable() {
  const { data: stockLevels, isLoading } = useStockLevels();
  const updateStock = useUpdateStockLevel();
  
  const [search, setSearch] = useState('');
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  const filteredLevels = stockLevels?.filter((level) => {
    const searchLower = search.toLowerCase();
    return (
      level.variant?.sku?.toLowerCase().includes(searchLower) ||
      level.variant?.title?.toLowerCase().includes(searchLower) ||
      level.warehouse?.name?.toLowerCase().includes(searchLower) ||
      level.location_in_warehouse?.toLowerCase().includes(searchLower)
    );
  });
  
  const handleEdit = (level: any) => {
    setEditingLevel(level);
    setNewQuantity(level.quantity);
    setAdjustmentReason('');
  };
  
  const handleSaveQuantity = async () => {
    if (!editingLevel) return;
    
    await updateStock.mutateAsync({
      id: editingLevel.id,
      quantity: newQuantity,
      reason: adjustmentReason || 'Ajustement manuel'
    });
    
    setEditingLevel(null);
  };
  
  const getStockStatus = (level: any) => {
    if (level.quantity === 0) {
      return { label: 'Rupture', variant: 'destructive' as const, icon: AlertTriangle };
    }
    if (level.quantity <= level.min_stock_level) {
      return { label: 'Critique', variant: 'destructive' as const, icon: AlertTriangle };
    }
    if (level.quantity <= level.reorder_point) {
      return { label: 'Bas', variant: 'warning' as const, icon: AlertTriangle };
    }
    if (level.quantity > level.max_stock_level) {
      return { label: 'Surstock', variant: 'secondary' as const, icon: Package };
    }
    return { label: 'Normal', variant: 'default' as const, icon: Package };
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
          <CardTitle className="text-lg">Niveaux de stock</CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit / SKU</TableHead>
                <TableHead>Entrepôt</TableHead>
                <TableHead className="text-center">Quantité</TableHead>
                <TableHead className="text-center">Réservé</TableHead>
                <TableHead className="text-center">Disponible</TableHead>
                <TableHead className="text-center">Seuil</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!filteredLevels || filteredLevels.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {search ? 'Aucun résultat trouvé' : 'Aucun niveau de stock configuré'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLevels.map((level) => {
                  const status = getStockStatus(level);
                  return (
                    <TableRow key={level.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{level.variant?.title || 'Produit inconnu'}</p>
                          <p className="text-xs text-muted-foreground">{level.variant?.sku || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{level.warehouse?.name || '-'}</p>
                          {level.location_in_warehouse && (
                            <p className="text-xs text-muted-foreground">{level.location_in_warehouse}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono font-medium">
                        {level.quantity}
                      </TableCell>
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {level.reserved_quantity}
                      </TableCell>
                      <TableCell className="text-center font-mono font-medium text-green-600">
                        {level.available_quantity}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {level.min_stock_level} - {level.max_stock_level}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(level)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingLevel} onOpenChange={(open) => !open && setEditingLevel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuster le stock</DialogTitle>
          </DialogHeader>
          {editingLevel && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{editingLevel.variant?.title}</p>
                <p className="text-sm text-muted-foreground">SKU: {editingLevel.variant?.sku}</p>
                <p className="text-sm text-muted-foreground">Entrepôt: {editingLevel.warehouse?.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantité actuelle</Label>
                  <Input value={editingLevel.quantity} disabled className="mt-1" />
                </div>
                <div>
                  <Label>Nouvelle quantité</Label>
                  <Input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                    min="0"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label>Raison de l'ajustement</Label>
                <Textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Ex: Inventaire physique, réception marchandise..."
                  className="mt-1"
                />
              </div>
              
              {newQuantity !== editingLevel.quantity && (
                <div className={`p-3 rounded-lg ${newQuantity > editingLevel.quantity ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                  <p className="text-sm font-medium">
                    {newQuantity > editingLevel.quantity ? '+' : ''}{newQuantity - editingLevel.quantity} unités
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingLevel(null)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveQuantity} disabled={updateStock.isPending}>
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
