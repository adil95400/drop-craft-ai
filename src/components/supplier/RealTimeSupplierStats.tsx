import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Package,
  Clock,
  Users,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SupplierStatsProps {
  connectorIds: string[];
}

async function fetchSupplierStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, status, last_sync_at')
    .eq('user_id', user.id);

  if (!suppliers?.length) return [];

  // Get product counts per supplier name
  const { data: products } = await supabase
    .from('products')
    .select('supplier')
    .eq('user_id', user.id);

  const productCountBySupplier = new Map<string, number>();
  (products || []).forEach(p => {
    if (p.supplier) {
      productCountBySupplier.set(p.supplier, (productCountBySupplier.get(p.supplier) || 0) + 1);
    }
  });

  return suppliers.map(s => ({
    id: s.id,
    name: s.name,
    status: s.status || 'active',
    productCount: productCountBySupplier.get(s.name) || 0,
    lastSync: s.last_sync_at ? new Date(s.last_sync_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'Jamais',
  }));
}

const RealTimeSupplierStats: React.FC<SupplierStatsProps> = ({ connectorIds }) => {
  const { data: suppliers = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['supplier-stats'],
    queryFn: fetchSupplierStats,
    refetchInterval: 30000, // Refresh every 30s
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
      case 'inactive':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!suppliers.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Aucun fournisseur connecté. Connectez vos premiers fournisseurs pour voir les statistiques.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalProducts = suppliers.reduce((sum, s) => sum + s.productCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Statistiques Fournisseurs</h2>
          <p className="text-muted-foreground">Performances de vos fournisseurs connectés</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fournisseurs</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits Total</p>
                <p className="text-2xl font-bold">{totalProducts.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {suppliers.map((supplier) => (
          <Card key={supplier.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {supplier.name}
                  {getStatusIcon(supplier.status)}
                </CardTitle>
                <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                  {supplier.status}
                </Badge>
              </div>
              <CardDescription>Dernière sync : {supplier.lastSync}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold">{supplier.productCount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RealTimeSupplierStats;