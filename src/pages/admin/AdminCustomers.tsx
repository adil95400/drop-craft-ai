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
  Mail,
  Phone,
  MapPin,
  Calendar,
  Euro,
  ShoppingBag,
  UserPlus,
  TrendingUp
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'vip';
  lastOrder: string;
  joinDate: string;
  averageOrderValue: number;
}

export const AdminCustomers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      // Simulate loading customers
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'Marie Dubois',
          email: 'marie.dubois@email.com',
          phone: '+33 6 12 34 56 78',
          location: 'Paris, France',
          totalOrders: 23,
          totalSpent: 3450.80,
          status: 'vip',
          lastOrder: '2024-01-15',
          joinDate: '2023-03-15',
          averageOrderValue: 150.03
        },
        {
          id: '2',
          name: 'Jean Martin',
          email: 'jean.martin@email.com',
          phone: '+33 6 98 76 54 32',
          location: 'Lyon, France',
          totalOrders: 8,
          totalSpent: 890.50,
          status: 'active',
          lastOrder: '2024-01-12',
          joinDate: '2023-08-20',
          averageOrderValue: 111.31
        },
        {
          id: '3',
          name: 'Sophie Bernard',
          email: 'sophie.bernard@email.com',
          phone: '+33 6 45 67 89 01',
          location: 'Marseille, France',
          totalOrders: 15,
          totalSpent: 2180.90,
          status: 'active',
          lastOrder: '2024-01-10',
          joinDate: '2023-05-10',
          averageOrderValue: 145.39
        },
        {
          id: '4',
          name: 'Pierre Moreau',
          email: 'pierre.moreau@email.com',
          phone: '+33 6 23 45 67 89',
          location: 'Toulouse, France',
          totalOrders: 3,
          totalSpent: 299.97,
          status: 'inactive',
          lastOrder: '2023-12-15',
          joinDate: '2023-11-01',
          averageOrderValue: 99.99
        },
        {
          id: '5',
          name: 'Claire Petit',
          email: 'claire.petit@email.com',
          phone: '+33 6 78 90 12 34',
          location: 'Nice, France',
          totalOrders: 31,
          totalSpent: 5670.25,
          status: 'vip',
          lastOrder: '2024-01-14',
          joinDate: '2022-12-05',
          averageOrderValue: 182.91
        }
      ];
      
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      vip: 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      active: 'Actif',
      inactive: 'Inactif',
      vip: 'VIP'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const customerStats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    vip: customers.filter(c => c.status === 'vip').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    averageOrderValue: customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / customers.length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Gestion des Clients
          </h1>
          <p className="text-muted-foreground">
            Suivi et analyse de votre base clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Nouveau Client
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{customerStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients Actifs</p>
                <p className="text-2xl font-bold text-green-600">{customerStats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients VIP</p>
                <p className="text-2xl font-bold text-purple-600">{customerStats.vip}</p>
              </div>
              <Badge className="bg-purple-100 text-purple-800">
                VIP
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactifs</p>
                <p className="text-2xl font-bold text-gray-600">{customerStats.inactive}</p>
              </div>
              <Users className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CA Total</p>
                <p className="text-2xl font-bold">{(customerStats.totalRevenue / 1000).toFixed(0)}k€</p>
              </div>
              <Euro className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Panier Moyen</p>
                <p className="text-2xl font-bold">{customerStats.averageOrderValue?.toFixed(0)}€</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-600" />
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
                  placeholder="Rechercher par nom, email ou localisation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Base Clients ({filteredCustomers.length})</CardTitle>
          <CardDescription>
            Liste complète de vos clients avec détails et historique
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
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Dépenses</TableHead>
                  <TableHead>Panier Moyen</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière Commande</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Depuis {new Date(customer.joinDate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {customer.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-bold text-lg">{customer.totalOrders}</div>
                        <div className="text-xs text-muted-foreground">commandes</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-green-600">
                        {customer.totalSpent.toFixed(2)}€
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {customer.averageOrderValue.toFixed(2)}€
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(customer.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(customer.lastOrder).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Mail className="h-4 w-4" />
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