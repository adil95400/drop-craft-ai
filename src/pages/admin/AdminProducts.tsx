import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  MoreHorizontal,
  Star,
  TrendingUp
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  supplier: string;
  created_at: string;
  sales: number;
  rating: number;
}

export const AdminProducts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    if (user?.id) {
      loadProducts();
    }
  }, [user?.id]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProducts: Product[] = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku || '',
        category: p.category || 'Non catégorisé',
        price: p.price,
        stock: p.stock_quantity || 0,
        status: p.stock_quantity === 0 ? 'out_of_stock' : p.status === 'active' ? 'active' : 'inactive',
        supplier: 'N/A',
        created_at: p.created_at,
        sales: 0,
        rating: 0
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      out_of_stock: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      active: 'Actif',
      inactive: 'Inactif',
      out_of_stock: 'Rupture'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const productStats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    outOfStock: products.filter(p => p.status === 'out_of_stock').length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Gestion des Produits
          </h1>
          <p className="text-muted-foreground">
            Gérez votre catalogue de produits et stocks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Produit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Produits</p>
                <p className="text-2xl font-bold">{productStats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits Actifs</p>
                <p className="text-2xl font-bold text-green-600">{productStats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ruptures Stock</p>
                <p className="text-2xl font-bold text-red-600">{productStats.outOfStock}</p>
              </div>
              <Badge className="bg-red-100 text-red-800">
                {productStats.outOfStock}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valeur Stock</p>
                <p className="text-2xl font-bold">{(productStats.totalValue / 1000).toFixed(0)}k€</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                Total
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
                  placeholder="Rechercher par nom, SKU ou fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="Électronique">Électronique</SelectItem>
                <SelectItem value="Informatique">Informatique</SelectItem>
                <SelectItem value="Audio">Audio</SelectItem>
                <SelectItem value="Mode">Mode</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="out_of_stock">Rupture</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Catalogue Produits ({filteredProducts.length})</CardTitle>
          <CardDescription>
            Liste complète de vos produits avec détails et actions
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
                  <TableHead>Produit</TableHead>
                  <TableHead>SKU / Catégorie</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Créé le {new Date(product.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-mono text-sm">{product.sku}</div>
                        <Badge variant="outline" className="mt-1">
                          {product.category}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">{product.price}€</div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${product.stock === 0 ? 'text-red-600' : product.stock < 20 ? 'text-orange-600' : 'text-green-600'}`}>
                        {product.stock}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(product.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{product.supplier}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm">{product.rating}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.sales} ventes
                        </div>
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
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
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