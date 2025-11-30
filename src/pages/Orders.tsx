import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRealOrders } from '@/hooks/useRealOrders';
import { RefreshCw, Search, Download, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusConfig = {
  pending: { label: 'En attente', variant: 'secondary' as const },
  processing: { label: 'En cours', variant: 'default' as const },
  shipped: { label: 'Expédiée', variant: 'default' as const },
  delivered: { label: 'Livrée', variant: 'default' as const },
  cancelled: { label: 'Annulée', variant: 'destructive' as const },
};

export default function Orders() {
  const navigate = useNavigate();
  const { orders, isLoading } = useRealOrders();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const refetch = () => queryClient.invalidateQueries({ queryKey: ['orders'] });

  const handleExport = () => {
    if (!orders || orders.length === 0) {
      toast.error('Aucune commande à exporter');
      return;
    }

    // Créer les données CSV
    const headers = ['Numéro', 'Client', 'Date', 'Statut', 'Montant', 'Devise', 'Articles'];
    const csvData = orders.map(order => [
      order.order_number || '',
      order.customer_name || '',
      new Date(order.created_at).toLocaleDateString('fr-FR'),
      order.status || '',
      order.total_amount?.toFixed(2) || '0',
      order.currency || 'EUR',
      order.items?.length || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    // Télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${orders.length} commandes exportées`);
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Commandes</h1>
          <p className="text-muted-foreground">Gérez vos commandes et suivez leur statut</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher par numéro ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="processing">En cours</SelectItem>
            <SelectItem value="shipped">Expédiée</SelectItem>
            <SelectItem value="delivered">Livrée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredOrders.length} commande(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
              
              return (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{order.order_number}</span>
                      <Badge variant={statusInfo?.variant || 'secondary'}>
                        {statusInfo?.label || order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.customer_name} • {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{order.total_amount?.toFixed(2)} {order.currency || 'EUR'}</p>
                    <p className="text-sm text-muted-foreground">{order.items?.length || 0} article(s)</p>
                  </div>
                  <div className="ml-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                    >
                      Détails
                    </Button>
                  </div>
                </div>
              );
            })}
            {filteredOrders.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aucune commande trouvée
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
