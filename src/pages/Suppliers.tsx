import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Star,
  MapPin,
  Globe,
  Mail,
  Phone,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLegacyPlan } from '@/lib/migration-helper';

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  country?: string;
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  product_count: number;
  created_at: string;
}

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'AliExpress Global',
    email: 'contact@aliexpress.com',
    phone: '+86 571 8502 2088',
    website: 'https://aliexpress.com',
    country: 'Chine',
    status: 'active',
    rating: 4.2,
    product_count: 1250,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'European Fashion Hub',
    email: 'sales@efhub.eu',
    phone: '+33 1 42 36 70 00',
    website: 'https://europeanfashion.eu',
    country: 'France',
    status: 'active',
    rating: 4.8,
    product_count: 580,
    created_at: '2024-02-20T14:20:00Z'
  },
  {
    id: '3',
    name: 'Tech Components Ltd',
    email: 'info@techcomp.co.uk',
    website: 'https://techcomponents.co.uk',
    country: 'Royaume-Uni',
    status: 'pending',
    rating: 4.1,
    product_count: 0,
    created_at: '2024-03-10T09:15:00Z'
  },
  {
    id: '4',
    name: 'Organic Beauty Supply',
    email: 'contact@organicbeauty.de',
    phone: '+49 30 12345678',
    country: 'Allemagne',
    status: 'active',
    rating: 4.6,
    product_count: 320,
    created_at: '2024-01-05T16:45:00Z'
  },
  {
    id: '5',
    name: 'Sports Gear International',
    email: 'sales@sportsgear.it',
    country: 'Italie',
    status: 'inactive',
    rating: 3.9,
    product_count: 190,
    created_at: '2023-11-22T11:30:00Z'
  }
];

const Suppliers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPro, isUltraPro } = useLegacyPlan(user);
  const [suppliers] = useState<Supplier[]>(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.country?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    const matchesCountry = countryFilter === 'all' || supplier.country === countryFilter;
    
    return matchesSearch && matchesStatus && matchesCountry;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const countries = Array.from(new Set(suppliers.map(s => s.country).filter(Boolean)));

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    pending: suppliers.filter(s => s.status === 'pending').length,
    totalProducts: suppliers.reduce((sum, s) => sum + s.product_count, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fournisseurs</h2>
          <p className="text-muted-foreground">
            Gérez vos relations fournisseurs et leurs produits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Synchroniser
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau fournisseur
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fournisseurs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fournisseurs Actifs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Tous fournisseurs confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {renderStars(4.3)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou pays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pays</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Plus de filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des fournisseurs</CardTitle>
          <CardDescription>
            {filteredSuppliers.length} fournisseur(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${supplier.name}`} />
                        <AvatarFallback>
                          {supplier.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.website && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {supplier.website.replace('https://', '')}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {supplier.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {supplier.country && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {supplier.country}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(supplier.status)} flex items-center gap-1`}
                    >
                      {getStatusIcon(supplier.status)}
                      {supplier.status === 'active' ? 'Actif' : 
                       supplier.status === 'pending' ? 'En attente' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {renderStars(supplier.rating)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {supplier.rating.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {supplier.product_count.toLocaleString()}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Synchroniser produits
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Désactiver
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun fournisseur trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Suppliers;