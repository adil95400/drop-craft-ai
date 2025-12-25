import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Search, 
  Filter, 
  Eye,
  Download,
  Plus,
  Edit,
  Settings,
  Globe,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const AdminSuppliers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedConnection, setSelectedConnection] = useState('all');

  // Fetch supplier connections from database
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: async () => {
      const result: any = await supabase
        .from('supplier_connections' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (result.error) throw result.error;
      return result.data || [];
    },
  });

  // Fetch products count per supplier
  const { data: productCounts } = useQuery({
    queryKey: ['supplier-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_products')
        .select('supplier_name');

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(p => {
        if (p.supplier_name) {
          counts[p.supplier_name] = (counts[p.supplier_name] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const filteredSuppliers = suppliers?.filter((supplier: any) => {
    const matchesSearch = 
      supplier.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplier_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && supplier.is_active) ||
      (selectedStatus === 'inactive' && !supplier.is_active);
    
    const matchesConnection = selectedConnection === 'all' || 
      supplier.connection_status === selectedConnection;
    
    return matchesSearch && matchesStatus && matchesConnection;
  }) || [];

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Actif</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>
    );
  };

  const getConnectionBadge = (status: string | null) => {
    const config: Record<string, { className: string; icon: any; label: string }> = {
      connected: { className: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Connecté' },
      disconnected: { className: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Déconnecté' },
      error: { className: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Erreur' },
      pending: { className: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'En attente' }
    };
    
    const { className, icon: Icon, label } = config[status || 'disconnected'] || config.disconnected;
    
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const supplierStats = {
    total: suppliers?.length || 0,
    active: suppliers?.filter((s: any) => s.is_active).length || 0,
    connected: suppliers?.filter((s: any) => s.connection_status === 'connected').length || 0,
    totalProducts: Object.values(productCounts || {}).reduce((a: number, b: number) => a + b, 0),
    autoOrder: suppliers?.filter((s: any) => s.auto_order_enabled).length || 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Gestion des Fournisseurs
          </h1>
          <p className="text-muted-foreground">
            Gérez vos relations fournisseurs et leurs catalogues
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Fournisseur
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Fournisseurs</p>
                <p className="text-2xl font-bold">{supplierStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fournisseurs Actifs</p>
                <p className="text-2xl font-bold text-green-600">{supplierStats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connectés</p>
                <p className="text-2xl font-bold text-blue-600">{supplierStats.connected}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits Total</p>
                <p className="text-2xl font-bold">
                  {supplierStats.totalProducts > 1000 
                    ? `${(supplierStats.totalProducts / 1000).toFixed(1)}k` 
                    : supplierStats.totalProducts}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Auto-Commande</p>
                <p className="text-2xl font-bold">{supplierStats.autoOrder}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Auto</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom ou type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedConnection} onValueChange={setSelectedConnection}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Connexion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes connexions</SelectItem>
                <SelectItem value="connected">Connecté</SelectItem>
                <SelectItem value="disconnected">Déconnecté</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fournisseurs ({filteredSuppliers.length})</CardTitle>
          <CardDescription>
            Liste complète de vos fournisseurs avec statuts de connexion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSuppliers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Connexion</TableHead>
                  <TableHead>Auto-Commande</TableHead>
                  <TableHead>Dernière Sync</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier: any) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="font-medium">{supplier.supplier_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{supplier.supplier_type || 'Non défini'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-bold">
                          {productCounts?.[supplier.supplier_name] || 0}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(supplier.is_active)}
                    </TableCell>
                    <TableCell>
                      {getConnectionBadge(supplier.connection_status)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.auto_order_enabled ? 'default' : 'secondary'}>
                        {supplier.auto_order_enabled ? 'Activé' : 'Désactivé'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {supplier.last_sync_at 
                          ? format(new Date(supplier.last_sync_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                          : 'Jamais'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun fournisseur</h3>
              <p className="text-muted-foreground mb-4">
                Ajoutez des connexions fournisseurs pour les voir ici
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un fournisseur
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
