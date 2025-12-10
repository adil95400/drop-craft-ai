import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useWarehouses, useStockLevels } from '@/hooks/useStockManagement';
import { 
  Warehouse, 
  Package, 
  ArrowRightLeft, 
  Search,
  Filter,
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye
} from 'lucide-react';

interface TransferRequest {
  productId: string;
  productName: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
}

export function MultiWarehouseInventory() {
  const { toast } = useToast();
  const { data: warehouses = [], isLoading: warehousesLoading } = useWarehouses();
  const { data: stockLevels = [], isLoading: stockLoading } = useStockLevels();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferRequest, setTransferRequest] = useState<TransferRequest | null>(null);

  // Group stock levels by product for multi-warehouse view
  const productInventory = useMemo(() => {
    const grouped: Record<string, {
      productId: string;
      productName: string;
      sku?: string;
      imageUrl?: string;
      totalQuantity: number;
      totalReserved: number;
      warehouseStock: Array<{
        warehouseId: string;
        warehouseName: string;
        quantity: number;
        reserved: number;
        available: number;
        reorderPoint: number;
      }>;
    }> = {};

    stockLevels.forEach(level => {
      const productId = level.product_id;
      const productName = level.product?.name || 'Produit inconnu';
      
      if (!grouped[productId]) {
        grouped[productId] = {
          productId,
          productName,
          sku: level.product?.sku,
          imageUrl: level.product?.image_url,
          totalQuantity: 0,
          totalReserved: 0,
          warehouseStock: []
        };
      }
      
      grouped[productId].totalQuantity += level.quantity;
      grouped[productId].totalReserved += level.reserved_quantity;
      grouped[productId].warehouseStock.push({
        warehouseId: level.warehouse_id,
        warehouseName: level.warehouse?.name || 'Inconnu',
        quantity: level.quantity,
        reserved: level.reserved_quantity,
        available: level.available_quantity,
        reorderPoint: level.reorder_point
      });
    });

    return Object.values(grouped);
  }, [stockLevels]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return productInventory.filter(product => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!product.productName.toLowerCase().includes(search) &&
            !product.sku?.toLowerCase().includes(search)) {
          return false;
        }
      }
      
      // Warehouse filter
      if (selectedWarehouse !== 'all') {
        if (!product.warehouseStock.some(ws => ws.warehouseId === selectedWarehouse)) {
          return false;
        }
      }
      
      // Stock level filter
      if (stockFilter === 'low') {
        return product.warehouseStock.some(ws => ws.available <= ws.reorderPoint && ws.available > 0);
      } else if (stockFilter === 'out') {
        return product.warehouseStock.some(ws => ws.available === 0);
      } else if (stockFilter === 'ok') {
        return product.warehouseStock.every(ws => ws.available > ws.reorderPoint);
      }
      
      return true;
    });
  }, [productInventory, searchTerm, selectedWarehouse, stockFilter]);

  const handleTransfer = async () => {
    if (!transferRequest) return;
    
    // Simulate transfer API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Transfert créé",
      description: `${transferRequest.quantity} unités de "${transferRequest.productName}" transférées avec succès.`
    });
    
    setShowTransferDialog(false);
    setTransferRequest(null);
  };

  const initiateTransfer = (productId: string, productName: string, fromWarehouseId: string) => {
    setTransferRequest({
      productId,
      productName,
      fromWarehouseId,
      toWarehouseId: '',
      quantity: 0
    });
    setShowTransferDialog(true);
  };

  const getStockStatusBadge = (available: number, reorderPoint: number) => {
    if (available === 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    } else if (available <= reorderPoint) {
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Stock bas</Badge>;
    }
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">OK</Badge>;
  };

  if (warehousesLoading || stockLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entrepôts</p>
                <p className="text-2xl font-bold">{warehouses.length}</p>
              </div>
              <Warehouse className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">{productInventory.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock total</p>
                <p className="text-2xl font-bold">
                  {productInventory.reduce((sum, p) => sum + p.totalQuantity, 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertes</p>
                <p className="text-2xl font-bold text-orange-500">
                  {productInventory.filter(p => 
                    p.warehouseStock.some(ws => ws.available <= ws.reorderPoint)
                  ).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Répartition par entrepôt
          </CardTitle>
          <CardDescription>
            Vue consolidée du stock par emplacement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {warehouses.map(warehouse => {
              const warehouseStock = stockLevels.filter(sl => sl.warehouse_id === warehouse.id);
              const totalItems = warehouseStock.reduce((sum, s) => sum + s.quantity, 0);
              const utilizationPct = warehouse.capacity > 0 
                ? Math.min(100, (warehouse.current_utilization / warehouse.capacity) * 100) 
                : 0;
              
              return (
                <Card key={warehouse.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedWarehouse(warehouse.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Warehouse className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{warehouse.name}</h4>
                          <p className="text-xs text-muted-foreground">{warehouse.location}</p>
                        </div>
                      </div>
                      <Badge variant={warehouse.is_active ? 'default' : 'secondary'} className="text-xs">
                        {warehouse.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Produits</span>
                        <span className="font-medium">{warehouseStock.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Unités</span>
                        <span className="font-medium">{totalItems.toLocaleString()}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Capacité</span>
                          <span>{utilizationPct.toFixed(0)}%</span>
                        </div>
                        <Progress value={utilizationPct} className="h-1.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Product Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Inventaire multi-entrepôts</CardTitle>
              <CardDescription>
                Vue consolidée du stock par produit sur tous les entrepôts
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entrepôt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les entrepôts</SelectItem>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="ok">Stock OK</SelectItem>
                <SelectItem value="low">Stock bas</SelectItem>
                <SelectItem value="out">Rupture</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-center">Stock Total</TableHead>
                  {warehouses.slice(0, 4).map(w => (
                    <TableHead key={w.id} className="text-center hidden lg:table-cell">
                      {w.name}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6 + warehouses.slice(0, 4).length} className="text-center py-8">
                      <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Aucun produit trouvé</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.slice(0, 50).map(product => {
                    const hasLowStock = product.warehouseStock.some(
                      ws => ws.available <= ws.reorderPoint && ws.available > 0
                    );
                    const hasOutOfStock = product.warehouseStock.some(ws => ws.available === 0);
                    
                    return (
                      <TableRow key={product.productId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.productName}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm line-clamp-1">{product.productName}</p>
                              {product.sku && (
                                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium">{product.totalQuantity}</div>
                          {product.totalReserved > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {product.totalReserved} réservés
                            </div>
                          )}
                        </TableCell>
                        {warehouses.slice(0, 4).map(w => {
                          const ws = product.warehouseStock.find(s => s.warehouseId === w.id);
                          return (
                            <TableCell key={w.id} className="text-center hidden lg:table-cell">
                              {ws ? (
                                <div>
                                  <span className={ws.available === 0 ? 'text-red-500' : 
                                                   ws.available <= ws.reorderPoint ? 'text-orange-500' : ''}>
                                    {ws.available}
                                  </span>
                                  {ws.reserved > 0 && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      (+{ws.reserved})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          {hasOutOfStock ? (
                            <Badge variant="destructive">Rupture</Badge>
                          ) : hasLowStock ? (
                            <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                              Stock bas
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => initiateTransfer(
                                product.productId, 
                                product.productName,
                                product.warehouseStock[0]?.warehouseId || ''
                              )}
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredProducts.length > 50 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Affichage de 50 sur {filteredProducts.length} produits
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfert inter-entrepôts
            </DialogTitle>
            <DialogDescription>
              Transférer du stock entre deux entrepôts
            </DialogDescription>
          </DialogHeader>
          
          {transferRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{transferRequest.productName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Depuis</Label>
                  <Select 
                    value={transferRequest.fromWarehouseId}
                    onValueChange={(v) => setTransferRequest(prev => prev ? {...prev, fromWarehouseId: v} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Entrepôt source" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Vers</Label>
                  <Select 
                    value={transferRequest.toWarehouseId}
                    onValueChange={(v) => setTransferRequest(prev => prev ? {...prev, toWarehouseId: v} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Entrepôt destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses
                        .filter(w => w.id !== transferRequest.fromWarehouseId)
                        .map(w => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Quantité à transférer</Label>
                <Input
                  type="number"
                  min={1}
                  value={transferRequest.quantity}
                  onChange={(e) => setTransferRequest(prev => 
                    prev ? {...prev, quantity: parseInt(e.target.value) || 0} : null
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleTransfer}
                  disabled={!transferRequest.toWarehouseId || transferRequest.quantity <= 0}
                >
                  Créer le transfert
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
