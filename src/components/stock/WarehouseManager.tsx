import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse } from '@/hooks/useStockManagement';
import { Plus, Warehouse, MapPin, Phone, Mail, Edit, Trash2 } from 'lucide-react';

export function WarehouseManager() {
  const { data: warehouses, isLoading } = useWarehouses();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    warehouse_type: 'standard',
    capacity: 1000,
    manager_name: '',
    contact_email: '',
    contact_phone: ''
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      warehouse_type: 'standard',
      capacity: 1000,
      manager_name: '',
      contact_email: '',
      contact_phone: ''
    });
    setEditingWarehouse(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingWarehouse) {
      await updateWarehouse.mutateAsync({ id: editingWarehouse.id, ...formData });
    } else {
      await createWarehouse.mutateAsync(formData);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };
  
  const handleEdit = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      location: warehouse.location || '',
      warehouse_type: warehouse.warehouse_type,
      capacity: warehouse.capacity,
      manager_name: warehouse.manager_name || '',
      contact_email: warehouse.contact_email || '',
      contact_phone: warehouse.contact_phone || ''
    });
    setIsDialogOpen(true);
  };
  
  const warehouseTypeLabels: Record<string, string> = {
    standard: 'Standard',
    cold_storage: 'Chambre froide',
    hazmat: 'Matières dangereuses',
    dropship: 'Dropshipping'
  };
  
  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-3/4 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Entrepôts ({warehouses?.length || 0})</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel entrepôt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingWarehouse ? 'Modifier l\'entrepôt' : 'Ajouter un entrepôt'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Entrepôt principal"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Paris, France"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.warehouse_type}
                      onValueChange={(value) => setFormData({ ...formData, warehouse_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="cold_storage">Chambre froide</SelectItem>
                        <SelectItem value="hazmat">Mat. dangereuses</SelectItem>
                        <SelectItem value="dropship">Dropshipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacité</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manager">Responsable</Label>
                  <Input
                    id="manager"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="contact@..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="+33..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createWarehouse.isPending || updateWarehouse.isPending}>
                  {editingWarehouse ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {(!warehouses || warehouses.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Warehouse className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Aucun entrepôt configuré</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre premier entrepôt pour commencer à gérer votre stock
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un entrepôt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Warehouse className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{warehouse.name}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {warehouseTypeLabels[warehouse.warehouse_type] || warehouse.warehouse_type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(warehouse)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {warehouse.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {warehouse.location}
                  </div>
                )}
                
                {warehouse.manager_name && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Responsable:</span> {warehouse.manager_name}
                  </div>
                )}
                
                <div className="flex gap-4 text-sm">
                  {warehouse.contact_email && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{warehouse.contact_email}</span>
                    </div>
                  )}
                  {warehouse.contact_phone && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {warehouse.contact_phone}
                    </div>
                  )}
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Utilisation</span>
                    <span className="font-medium">
                      {warehouse.current_utilization} / {warehouse.capacity}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, (warehouse.current_utilization / warehouse.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
                
                <Badge variant={warehouse.is_active ? 'default' : 'secondary'} className="w-full justify-center">
                  {warehouse.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
