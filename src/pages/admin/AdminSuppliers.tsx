import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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
  TrendingUp,
  Link as LinkIcon
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  website: string;
  country: string;
  category: string;
  productsCount: number;
  status: 'active' | 'inactive' | 'pending';
  connection: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  syncFrequency: string;
  successRate: number;
  totalImports: number;
  rating: number;
}

export const AdminSuppliers = () => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedConnection, setSelectedConnection] = useState('all');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      // Simulate loading suppliers
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSuppliers: Supplier[] = [
        {
          id: '1',
          name: 'TechGlobal Wholesale',
          website: 'https://techglobal.com',
          country: 'Chine',
          category: 'Électronique',
          productsCount: 2547,
          status: 'active',
          connection: 'connected',
          lastSync: '2024-01-15T10:30:00Z',
          syncFrequency: 'daily',
          successRate: 98.5,
          totalImports: 156,
          rating: 4.8
        },
        {
          id: '2',
          name: 'Fashion Europe Ltd',
          website: 'https://fashioneurope.eu',
          country: 'Italie',
          category: 'Mode',
          productsCount: 1832,
          status: 'active',
          connection: 'connected',
          lastSync: '2024-01-15T08:15:00Z',
          syncFrequency: 'weekly',
          successRate: 95.2,
          totalImports: 89,
          rating: 4.6
        },
        {
          id: '3',
          name: 'Home & Living Co',
          website: 'https://homeliving.com',
          country: 'Allemagne',
          category: 'Maison',
          productsCount: 3421,
          status: 'inactive',
          connection: 'disconnected',
          lastSync: '2024-01-10T14:20:00Z',
          syncFrequency: 'manual',
          successRate: 87.3,
          totalImports: 234,
          rating: 4.2
        },
        {
          id: '4',
          name: 'Sports Pro Supplier',
          website: 'https://sportspro.com',
          country: 'France',
          category: 'Sport',
          productsCount: 987,
          status: 'pending',
          connection: 'error',
          lastSync: '2024-01-12T16:45:00Z',
          syncFrequency: 'weekly',
          successRate: 76.8,
          totalImports: 45,
          rating: 3.9
        },
        {
          id: '5',
          name: 'Beauty World International',
          website: 'https://beautyworld.com',
          country: 'Corée du Sud',
          category: 'Beauté',
          productsCount: 1654,
          status: 'active',
          connection: 'connected',
          lastSync: '2024-01-15T12:00:00Z',
          syncFrequency: 'daily',
          successRate: 99.1,
          totalImports: 178,
          rating: 4.9
        }
      ];
      
      setSuppliers(mockSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les fournisseurs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || supplier.status === selectedStatus;
    const matchesConnection = selectedConnection === 'all' || supplier.connection === selectedConnection;
    
    return matchesSearch && matchesStatus && matchesConnection;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      active: 'Actif',
      inactive: 'Inactif',
      pending: 'En attente'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getConnectionBadge = (connection: string) => {
    const config = {
      connected: { className: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Connecté' },
      disconnected: { className: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Déconnecté' },
      error: { className: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Erreur' }
    };
    
    const { className, icon: Icon, label } = config[connection as keyof typeof config];
    
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const supplierStats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    connected: suppliers.filter(s => s.connection === 'connected').length,
    totalProducts: suppliers.reduce((sum, s) => sum + s.productsCount, 0),
    averageRating: suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length
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
                <p className="text-2xl font-bold">{(supplierStats.totalProducts / 1000).toFixed(1)}k</p>
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
                <p className="text-2xl font-bold">{supplierStats.averageRating?.toFixed(1)}</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                ★ {supplierStats.averageRating?.toFixed(1)}
              </Badge>
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
                  placeholder="Rechercher par nom, site web, catégorie ou pays..."
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
                <SelectItem value="pending">En attente</SelectItem>
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
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Site Web</TableHead>
                  <TableHead>Pays / Catégorie</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Connexion</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Dernière Sync</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            ★ {supplier.rating}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={supplier.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {supplier.website.replace('https://', '')}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.country}</div>
                        <Badge variant="outline" className="mt-1">
                          {supplier.category}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-bold text-lg">{supplier.productsCount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">produits</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(supplier.status)}
                    </TableCell>
                    <TableCell>
                      {getConnectionBadge(supplier.connection)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <div className="text-sm font-medium">{supplier.successRate}%</div>
                          <div className={`text-xs ${supplier.successRate > 95 ? 'text-green-600' : supplier.successRate > 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                            succès
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {supplier.totalImports} imports
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(supplier.lastSync).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {supplier.syncFrequency}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};