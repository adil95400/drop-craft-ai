import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Search, Filter, Download, Upload, Eye, Edit, Trash2, 
  Star, TrendingUp, Package, ShoppingCart, BarChart3, Settings,
  Image, Tag, Globe, Zap, Copy, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  category: string;
  status: 'draft' | 'active' | 'archived';
  featured: boolean;
  images: string[];
  created_at: string;
  sales_count: number;
  revenue: number;
  conversion_rate: number;
}

const Products = () => {
  const { toast } = useToast();
  
  const [products] = useState<Product[]>([
    {
      id: '1',
      name: 'iPhone 15 Pro Max',
      sku: 'IPH15PM-256',
      price: 1299,
      cost_price: 899,
      stock: 25,
      category: 'Smartphones',
      status: 'active',
      featured: true,
      images: ['/placeholder.svg'],
      created_at: '2024-01-15',
      sales_count: 156,
      revenue: 202644,
      conversion_rate: 0.045
    },
    {
      id: '2',
      name: 'MacBook Pro 16"',
      sku: 'MBP16-512',
      price: 2899,
      cost_price: 2299,
      stock: 12,
      category: 'Ordinateurs',
      status: 'active',
      featured: false,
      images: ['/placeholder.svg'],
      created_at: '2024-01-10',
      sales_count: 89,
      revenue: 258011,
      conversion_rate: 0.032
    },
    {
      id: '3',
      name: 'Samsung Galaxy S24',
      sku: 'SGS24-128',
      price: 899,
      cost_price: 679,
      stock: 0,
      category: 'Smartphones',
      status: 'active',
      featured: false,
      images: ['/placeholder.svg'],
      created_at: '2024-01-08',
      sales_count: 203,
      revenue: 182697,
      conversion_rate: 0.056
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const categories = [...new Set(products.map(p => p.category))];
  
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.price - a.price;
        case 'stock':
          return b.stock - a.stock;
        case 'sales':
          return b.sales_count - a.sales_count;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [products, searchTerm, filterStatus, filterCategory, sortBy]);

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock <= 5).length;

  const handleBulkAction = (action: string) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Aucun produit sélectionné",
        description: "Veuillez sélectionner au moins un produit.",
        variant: "destructive"
      });
      return;
    }

    switch (action) {
      case 'activate':
        toast({
          title: "Produits activés",
          description: `${selectedProducts.length} produits ont été activés.`
        });
        break;
      case 'deactivate':
        toast({
          title: "Produits désactivés",
          description: `${selectedProducts.length} produits ont été désactivés.`
        });
        break;
      case 'delete':
        toast({
          title: "Produits supprimés",
          description: `${selectedProducts.length} produits ont été supprimés.`
        });
        break;
      case 'duplicate':
        toast({
          title: "Produits dupliqués",
          description: `${selectedProducts.length} produits ont été dupliqués.`
        });
        break;
    }
    setSelectedProducts([]);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'destructive';
    if (stock <= 5) return 'secondary';
    return 'default';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Produits</h1>
          <p className="text-muted-foreground">Gérez votre catalogue produit</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importer
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Produit
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">{activeProducts} actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString('fr-FR')}€</div>
            <p className="text-xs text-muted-foreground">Valeur totale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">Produits à réapprovisionner</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + p.revenue, 0).toLocaleString('fr-FR')}€
            </div>
            <p className="text-xs text-muted-foreground">Total des ventes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, SKU ou catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                  <SelectItem value="archived">Archivés</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Plus récent</SelectItem>
                  <SelectItem value="name">Nom A-Z</SelectItem>
                  <SelectItem value="price">Prix décroissant</SelectItem>
                  <SelectItem value="stock">Stock décroissant</SelectItem>
                  <SelectItem value="sales">Ventes décroissant</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Package className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions en lot */}
          {selectedProducts.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedProducts.length} produit(s) sélectionné(s)
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                    <Eye className="w-4 h-4 mr-1" />
                    Activer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                    <Settings className="w-4 h-4 mr-1" />
                    Désactiver
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('duplicate')}>
                    <Copy className="w-4 h-4 mr-1" />
                    Dupliquer
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des produits */}
      <div className="space-y-4">
        {/* En-tête de sélection */}
        <div className="flex items-center gap-2 p-2">
          <input
            type="checkbox"
            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
            onChange={selectAllProducts}
            className="rounded"
          />
          <Label className="text-sm">Sélectionner tout ({filteredProducts.length} produits)</Label>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="rounded"
                    />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {product.featured && (
                      <Badge variant="default" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Vedette
                      </Badge>
                    )}
                    <Badge variant={getStatusColor(product.status)} className="text-xs">
                      {product.status}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg">{product.price}€</p>
                        <p className="text-xs text-muted-foreground">Coût: {product.cost_price}€</p>
                      </div>
                      <Badge variant={getStockColor(product.stock)}>
                        {product.stock} en stock
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Ventes:</span>
                        <span>{product.sales_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenus:</span>
                        <span>{product.revenue.toLocaleString('fr-FR')}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversion:</span>
                        <span>{(product.conversion_rate * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="flex gap-1 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onChange={selectAllProducts}
                          className="rounded"
                        />
                      </th>
                      <th className="p-4">Produit</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Prix</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4">Ventes</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-sm">{product.sku}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold">{product.price}€</p>
                            <p className="text-xs text-muted-foreground">Coût: {product.cost_price}€</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={getStockColor(product.stock)}>
                            {product.stock}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Badge variant={getStatusColor(product.status)}>
                              {product.status}
                            </Badge>
                            {product.featured && (
                              <Badge variant="outline" className="text-xs">
                                <Star className="w-3 h-3" />
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <p>{product.sales_count} ventes</p>
                            <p className="text-muted-foreground">{product.revenue.toLocaleString('fr-FR')}€</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Aucun produit ne correspond à vos critères de recherche.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Créer un nouveau produit
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Products;