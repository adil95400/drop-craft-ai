import { lazy, Suspense, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { Boxes, Warehouse, AlertTriangle, ArrowDownUp, Package, Plus, TrendingDown, MapPin, Search, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function InventoryHubPage() {
  const { warehouses, stockLevels, stockAlerts, stockMovements, addWarehouse, recordMovement, resolveAlert, stats } = useInventoryManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [newWarehouse, setNewWarehouse] = useState({ name: '', code: '', city: '', country: 'France', warehouse_type: 'owned' });
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);

  const filteredLevels = stockLevels.data?.filter(sl => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (sl.products as any)?.title?.toLowerCase().includes(q) || (sl.products as any)?.sku?.toLowerCase().includes(q);
  });

  const handleAddWarehouse = () => {
    if (!newWarehouse.name) return;
    addWarehouse.mutate(newWarehouse, {
      onSuccess: () => {
        setWarehouseDialogOpen(false);
        setNewWarehouse({ name: '', code: '', city: '', country: 'France', warehouse_type: 'owned' });
      },
    });
  };

  const getStockBadge = (quantity: number | null, minLevel: number | null) => {
    const qty = quantity ?? 0;
    if (qty === 0) return <Badge variant="destructive">Rupture</Badge>;
    if (minLevel && qty <= minLevel) return <Badge className="bg-warning text-warning-foreground">Faible</Badge>;
    return <Badge className="bg-success/10 text-success border-success/20">En stock</Badge>;
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingDown className="h-4 w-4 text-success rotate-180" />;
      case 'out': return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'transfer': return <ArrowDownUp className="h-4 w-4 text-primary" />;
      default: return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <ChannablePageWrapper
      title="Gestion des Stocks"
      description="Surveillance temps réel, alertes et mouvements multi-entrepôts"
      heroImage="stock"
      badge={{ label: 'Inventory', icon: Boxes }}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Entrepôts', value: stats.totalWarehouses, icon: Warehouse, color: 'text-primary' },
          { label: 'Références', value: stats.totalProducts, icon: Package, color: 'text-success' },
          { label: 'Stock faible', value: stats.lowStockCount, icon: TrendingDown, color: 'text-warning' },
          { label: 'Ruptures', value: stats.outOfStockCount, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Alertes actives', value: stats.activeAlerts, icon: AlertTriangle, color: 'text-orange-500' },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="levels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="levels">Niveaux de stock</TabsTrigger>
          <TabsTrigger value="warehouses">Entrepôts ({stats.totalWarehouses})</TabsTrigger>
          <TabsTrigger value="alerts">Alertes ({stats.activeAlerts})</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
        </TabsList>

        {/* Stock Levels */}
        <TabsContent value="levels" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher par produit ou SKU..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Produit</th>
                      <th className="text-left p-3 font-medium">Entrepôt</th>
                      <th className="text-right p-3 font-medium">Quantité</th>
                      <th className="text-right p-3 font-medium">Réservé</th>
                      <th className="text-right p-3 font-medium">Disponible</th>
                      <th className="text-right p-3 font-medium">Seuil min</th>
                      <th className="text-center p-3 font-medium">Statut</th>
                      <th className="text-left p-3 font-medium">Emplacement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLevels?.length === 0 && (
                      <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">Aucun niveau de stock enregistré</td></tr>
                    )}
                    {filteredLevels?.map(sl => (
                      <tr key={sl.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {(sl.products as any)?.image_url && (
                              <img src={(sl.products as any).image_url} className="w-8 h-8 rounded object-cover" alt="" />
                            )}
                            <div>
                              <p className="font-medium truncate max-w-[200px]">{(sl.products as any)?.title ?? '—'}</p>
                              <p className="text-xs text-muted-foreground">{(sl.products as any)?.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{(sl.warehouses as any)?.name ?? '—'}</td>
                        <td className="p-3 text-right font-mono font-medium">{sl.quantity ?? 0}</td>
                        <td className="p-3 text-right font-mono text-muted-foreground">{sl.reserved_quantity ?? 0}</td>
                        <td className="p-3 text-right font-mono font-medium">{sl.available_quantity ?? (sl.quantity ?? 0) - (sl.reserved_quantity ?? 0)}</td>
                        <td className="p-3 text-right font-mono text-muted-foreground">{sl.min_stock_level ?? '—'}</td>
                        <td className="p-3 text-center">{getStockBadge(sl.quantity, sl.min_stock_level)}</td>
                        <td className="p-3 text-muted-foreground text-xs">{sl.location_in_warehouse ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warehouses */}
        <TabsContent value="warehouses" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Ajouter un entrepôt</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvel entrepôt</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Nom *" value={newWarehouse.name} onChange={e => setNewWarehouse(p => ({ ...p, name: e.target.value }))} />
                  <Input placeholder="Code (ex: WH-PAR)" value={newWarehouse.code} onChange={e => setNewWarehouse(p => ({ ...p, code: e.target.value }))} />
                  <Input placeholder="Ville" value={newWarehouse.city} onChange={e => setNewWarehouse(p => ({ ...p, city: e.target.value }))} />
                  <Input placeholder="Pays" value={newWarehouse.country} onChange={e => setNewWarehouse(p => ({ ...p, country: e.target.value }))} />
                  <Select value={newWarehouse.warehouse_type} onValueChange={v => setNewWarehouse(p => ({ ...p, warehouse_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owned">Propre</SelectItem>
                      <SelectItem value="3pl">3PL</SelectItem>
                      <SelectItem value="dropship">Dropship</SelectItem>
                      <SelectItem value="virtual">Virtuel</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddWarehouse} disabled={addWarehouse.isPending} className="w-full">
                    {addWarehouse.isPending ? 'Ajout...' : 'Ajouter'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.data?.map(wh => (
              <Card key={wh.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{wh.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {[wh.city, wh.country].filter(Boolean).join(', ') || 'Non spécifié'}
                      </div>
                    </div>
                    <Badge variant={wh.is_active !== false ? 'default' : 'secondary'}>
                      {wh.is_active !== false ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-muted">
                      <p className="text-xs text-muted-foreground">Code</p>
                      <p className="font-mono text-sm font-medium">{wh.code ?? '—'}</p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm font-medium capitalize">{wh.warehouse_type ?? '—'}</p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <p className="text-xs text-muted-foreground">Capacité</p>
                      <p className="text-sm font-medium">{wh.capacity ? `${wh.current_occupancy ?? 0}/${wh.capacity}` : '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!warehouses.data || warehouses.data.length === 0) && (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Warehouse className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Aucun entrepôt configuré</p>
                  <p className="text-xs mt-1">Ajoutez votre premier entrepôt pour commencer</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="space-y-4">
          {stockAlerts.data?.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-success opacity-50" />
                <p>Aucune alerte active</p>
              </CardContent>
            </Card>
          )}
          <div className="space-y-3">
            {stockAlerts.data?.map(alert => (
              <Card key={alert.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      alert.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                      alert.severity === 'high' ? 'bg-warning/10 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{(alert.products as any)?.title}</span>
                        {(alert.warehouses as any)?.name && <span>• {(alert.warehouses as any).name}</span>}
                        <span>• Stock: {alert.current_stock ?? '?'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.severity ?? 'info'}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => resolveAlert.mutate(alert.id)}>
                      Résoudre
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Movements */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowDownUp className="h-4 w-4" />
                Historique des mouvements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Produit</th>
                      <th className="text-right p-3 font-medium">Quantité</th>
                      <th className="text-left p-3 font-medium">Entrepôt</th>
                      <th className="text-left p-3 font-medium">Raison</th>
                      <th className="text-left p-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockMovements.data?.length === 0 && (
                      <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">Aucun mouvement enregistré</td></tr>
                    )}
                    {stockMovements.data?.map(mv => (
                      <tr key={mv.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getMovementIcon(mv.movement_type)}
                            <span className="capitalize">{mv.movement_type === 'in' ? 'Entrée' : mv.movement_type === 'out' ? 'Sortie' : mv.movement_type === 'transfer' ? 'Transfert' : mv.movement_type}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-medium truncate max-w-[200px]">{(mv.products as any)?.title ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{(mv.products as any)?.sku}</p>
                        </td>
                        <td className={`p-3 text-right font-mono font-medium ${mv.movement_type === 'in' ? 'text-success' : mv.movement_type === 'out' ? 'text-destructive' : ''}`}>
                          {mv.movement_type === 'in' ? '+' : mv.movement_type === 'out' ? '-' : ''}{mv.quantity}
                        </td>
                        <td className="p-3 text-muted-foreground">{(mv.warehouses as any)?.name ?? '—'}</td>
                        <td className="p-3 text-muted-foreground text-xs">{mv.reason ?? mv.notes ?? '—'}</td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {mv.created_at ? format(new Date(mv.created_at), 'dd MMM yyyy HH:mm', { locale: fr }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
