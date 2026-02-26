import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShipments } from '@/hooks/useFulfillment';
import { Search, Filter, ExternalLink, Package, Truck, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface ShipmentData {
  id: string;
  tracking_number?: string;
  carrier_name?: string;
  shipping_address?: Record<string, any>;
  status?: string;
  shipping_cost?: number;
  label_url?: string;
  created_at: string;
}

export function ShipmentsTable() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  
  const { data: rawShipments, isLoading } = useShipments(statusFilter || undefined);
  
  // Cast to our expected type
  const shipments = rawShipments as unknown as ShipmentData[] | undefined;
  
  const getAddressField = (address: any, field: string): string => {
    if (!address || typeof address !== 'object') return '';
    return String(address[field] || '');
  };
  
  const filteredShipments = shipments?.filter((s) => {
    const searchLower = search.toLowerCase();
    const address = s.shipping_address;
    return (
      s.tracking_number?.toLowerCase().includes(searchLower) ||
      getAddressField(address, 'name').toLowerCase().includes(searchLower) ||
      getAddressField(address, 'city').toLowerCase().includes(searchLower)
    );
  });
  
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      created: { label: 'Créée', variant: 'secondary', icon: Package },
      label_generated: { label: 'Étiquette générée', variant: 'outline', icon: Package },
      printed: { label: 'Imprimée', variant: 'outline', icon: Package },
      picked_up: { label: 'Collectée', variant: 'default', icon: Truck },
      in_transit: { label: 'En transit', variant: 'default', icon: Truck },
      out_for_delivery: { label: 'En livraison', variant: 'default', icon: Truck },
      delivered: { label: 'Livrée', variant: 'default', icon: CheckCircle },
      failed: { label: 'Échec', variant: 'destructive', icon: AlertTriangle },
      returned: { label: 'Retournée', variant: 'secondary', icon: AlertTriangle }
    };
    return statusMap[status] || { label: status, variant: 'secondary' as const, icon: Clock };
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
          <CardTitle className="text-lg">Expéditions</CardTitle>
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
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="created">Créée</SelectItem>
                <SelectItem value="in_transit">En transit</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="failed">Échec</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking</TableHead>
                <TableHead>Transporteur</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Coût</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!filteredShipments || filteredShipments.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search || statusFilter ? 'Aucun résultat trouvé' : 'Aucune expédition'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredShipments.map((shipment) => {
                  const status = getStatusInfo(shipment.status || 'created');
                  const address = shipment.shipping_address;
                  const shippingCost = shipment.shipping_cost || 0;
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={shipment.id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {shipment.tracking_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {shipment.carrier_name || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getAddressField(address, 'name') || '-'}</p>
                          <p className="text-xs text-muted-foreground">
                            {getAddressField(address, 'city')}, {getAddressField(address, 'country')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {shippingCost.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: getDateFnsLocale() })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {shipment.label_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={shipment.label_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            Détails
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
