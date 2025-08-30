import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Store,
  Search,
  Plus,
  Settings,
  BarChart3,
  Globe,
  Package,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  MoreHorizontal,
  Eye,
  Play,
  Pause,
  Trash2,
  Edit
} from 'lucide-react';
import { useModals } from '@/hooks/useModals';
import { useSupplierManagement } from '@/hooks/useSupplierManagement';
import { DataTable } from '@/components/tables/DataTable';
import { AdvancedFilters } from '@/components/filters/AdvancedFilters';

export const SupplierDashboard: React.FC = () => {
  const { openModal } = useModals();
  const { 
    suppliers, 
    importBatches, 
    loading, 
    stats,
    fetchSuppliers,
    deleteSupplier,
    testConnection,
    startImport
  } = useSupplierManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    country: '',
    sector: '',
    supplier_type: '',
    connection_status: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'disconnected': return 'text-gray-600 bg-gray-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api': return <Zap className="h-4 w-4" />;
      case 'csv': return <Package className="h-4 w-4" />;
      case 'xml': return <Settings className="h-4 w-4" />;
      default: return <Store className="h-4 w-4" />;
    }
  };

  const supplierColumns = [
    {
      key: 'name',
      header: 'Fournisseur',
      render: (supplier) => (
        <div className="flex items-center gap-3">
          {supplier.logo_url ? (
            <img 
              src={supplier.logo_url} 
              alt={supplier.name}
              className="w-8 h-8 rounded object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
              <Store className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <div className="font-medium">{supplier.name}</div>
            <div className="text-sm text-muted-foreground">{supplier.country}</div>
          </div>
        </div>
      )
    },
    {
      key: 'supplier_type',
      label: 'Type',
      render: (supplier) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(supplier.supplier_type)}
          <span className="capitalize">{supplier.supplier_type}</span>
        </div>
      )
    },
    {
      key: 'connection_status',
      label: 'Statut',
      render: (supplier) => (
        <Badge className={getStatusColor(supplier.connection_status)}>
          {supplier.connection_status === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
          {supplier.connection_status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
          {supplier.connection_status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
          {supplier.connection_status}
        </Badge>
      )
    },
    {
      key: 'product_count',
      label: 'Produits',
      render: (supplier) => (
        <div className="text-center">
          <div className="font-medium">{supplier.product_count.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">produits</div>
        </div>
      )
    },
    {
      key: 'last_sync_at',
      label: 'Dernière sync',
      render: (supplier) => (
        <div className="text-sm">
          {supplier.last_sync_at ? 
            new Date(supplier.last_sync_at).toLocaleDateString('fr-FR') : 
            'Jamais'
          }
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (supplier) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => testConnection(supplier.id)}
            disabled={loading}
          >
            <Zap className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startImport(supplier.id)}
            disabled={loading || supplier.connection_status !== 'connected'}
          >
            <Play className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal('createSupplier', { supplierId: supplier.id })}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ];

  const batchColumns = [
    {
      key: 'supplier',
      label: 'Fournisseur',
      render: (batch) => {
        const supplier = suppliers.find(s => s.id === batch.supplier_id);
        return supplier?.name || 'Inconnu';
      }
    },
    {
      key: 'batch_type',
      label: 'Type',
      render: (batch) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(batch.batch_type)}
          <span className="uppercase">{batch.batch_type}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (batch) => (
        <Badge className={getStatusColor(batch.status)}>
          {batch.status}
        </Badge>
      )
    },
    {
      key: 'progress',
      label: 'Progression',
      render: (batch) => (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{batch.processed_products}/{batch.total_products}</span>
            <span>{Math.round((batch.processed_products / batch.total_products) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${(batch.processed_products / batch.total_products) * 100}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'results',
      label: 'Résultats',
      render: (batch) => (
        <div className="text-sm">
          <div className="text-green-600">✓ {batch.successful_imports}</div>
          {batch.failed_imports > 0 && (
            <div className="text-red-600">✗ {batch.failed_imports}</div>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Créé le',
      render: (batch) => (
        <div className="text-sm">
          {new Date(batch.created_at).toLocaleDateString('fr-FR')}
        </div>
      )
    }
  ];

  React.useEffect(() => {
    fetchSuppliers(filters);
  }, [filters, searchTerm]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            Gestion des Fournisseurs
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos {stats.totalSuppliers} fournisseurs et {stats.totalProducts.toLocaleString()} produits
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.open('/supplier-marketplace', '_blank')}>
            <Globe className="h-4 w-4 mr-2" />
            Marketplace
          </Button>
          <Button onClick={() => openModal('createSupplier')}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un fournisseur
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Fournisseurs</p>
                <p className="text-2xl font-bold">{stats.totalSuppliers}</p>
              </div>
              <Store className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connectés</p>
                <p className="text-2xl font-bold">{stats.connectedSuppliers}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.connectedSuppliers / stats.totalSuppliers) * 100)}% du total
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Produits</p>
                <p className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Note Moyenne</p>
                <p className="text-2xl font-bold">{stats.avgRating}/5</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="imports">Imports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Recherche et filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un fournisseur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filters.country} onValueChange={(value) => setFilters(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les pays</SelectItem>
                    {stats.topCountries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filters.supplier_type} onValueChange={(value) => setFilters(prev => ({ ...prev, supplier_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les types</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="manual">Manuel</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.connection_status} onValueChange={(value) => setFilters(prev => ({ ...prev, connection_status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les statuts</SelectItem>
                    <SelectItem value="connected">Connecté</SelectItem>
                    <SelectItem value="disconnected">Déconnecté</SelectItem>
                    <SelectItem value="error">Erreur</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={() => setFilters({ country: '', sector: '', supplier_type: '', connection_status: '' })}>
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des fournisseurs</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={suppliers}
                columns={supplierColumns}
                loading={loading}
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Historique des imports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={importBatches}
                columns={batchColumns}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par type</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Analytics charts would go here */}
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Graphiques à venir
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance des imports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Métriques de performance
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};