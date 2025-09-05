import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Package, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  Star,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLegacyPlan } from '@/lib/migration-helper';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  currency: string;
  category?: string;
  sku?: string;
  status: string;
  image_urls?: string[];
  ai_optimized: boolean;
  created_at: string;
  supplier_name?: string;
}

const Products = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isUltraPro, isPro } = useLegacyPlan(user);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProductStatus = async (productId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('imported_products')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProducts(products.map(product => 
        product.id === productId ? { ...product, status: newStatus } : product
      ));

      toast({
        title: "Succès",
        description: "Statut du produit mis à jour",
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'pending': return 'outline';
      case 'archived': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const productStats = {
    total: products.length,
    published: products.filter(p => p.status === 'published').length,
    draft: products.filter(p => p.status === 'draft').length,
    optimized: products.filter(p => p.ai_optimized).length,
    totalValue: products.reduce((sum, product) => sum + product.price, 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Produits</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produits</h2>
          <p className="text-muted-foreground">
            Gérez votre catalogue de produits importés
          </p>
        </div>
        <div className="flex gap-2">
          {isUltraPro && (
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analyse AI
            </Button>
          )}
          <Button size="sm" className="gap-2" asChild>
            <a href="/import">
              <Plus className="h-4 w-4" />
              Importer des produits
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publiés</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.published}</div>
            <p className="text-xs text-muted-foreground">
              {productStats.draft} en brouillon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimisés AI</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.optimized}</div>
            <p className="text-xs text-muted-foreground">
              {((productStats.optimized / Math.max(productStats.total, 1)) * 100).toFixed(0)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(productStats.totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prix moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(productStats.totalValue / Math.max(productStats.total, 1))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Products List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catalogue de produits</CardTitle>
              <CardDescription>
                {filteredProducts.length} produit(s) trouvé(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category!}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-muted relative">
                  {product.image_urls?.[0] ? (
                    <img 
                      src={product.image_urls[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center ${product.image_urls?.[0] ? 'hidden' : ''}`}>
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                  
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant={getStatusColor(product.status)} className="text-xs">
                      {product.status}
                    </Badge>
                    {product.ai_optimized && (
                      <Badge variant="default" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-medium line-clamp-2 text-sm">{product.name}</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold">{formatCurrency(product.price, product.currency)}</p>
                        {isPro && product.cost_price && (
                          <p className="text-xs text-muted-foreground">
                            Coût: {formatCurrency(product.cost_price, product.currency)}
                          </p>
                        )}
                      </div>
                      {isPro && product.cost_price && (
                        <div className="text-right">
                          <p className="text-xs text-emerald-600 font-medium">
                            +{((product.price - product.cost_price) / product.cost_price * 100).toFixed(0)}%
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{product.category || 'Sans catégorie'}</span>
                      <span>{product.sku || 'Sans SKU'}</span>
                    </div>
                    
                    {product.supplier_name && (
                      <p className="text-xs text-muted-foreground">
                        Fournisseur: {product.supplier_name}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Dialog onOpenChange={(open) => open && setSelectedProduct(product)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{selectedProduct?.name}</DialogTitle>
                          <DialogDescription>
                            Détails du produit
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedProduct && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Informations générales</h4>
                                <div className="space-y-2 text-sm">
                                  <div><strong>Prix:</strong> {formatCurrency(selectedProduct.price, selectedProduct.currency)}</div>
                                  {isPro && selectedProduct.cost_price && (
                                    <div><strong>Prix de revient:</strong> {formatCurrency(selectedProduct.cost_price, selectedProduct.currency)}</div>
                                  )}
                                  <div><strong>Catégorie:</strong> {selectedProduct.category || 'N/A'}</div>
                                  <div><strong>SKU:</strong> {selectedProduct.sku || 'N/A'}</div>
                                  <div><strong>Statut:</strong> 
                                    <Badge variant={getStatusColor(selectedProduct.status)} className="ml-2">
                                      {selectedProduct.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Optimisation</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <strong>IA Optimisé:</strong> 
                                    {selectedProduct.ai_optimized ? (
                                      <Badge variant="default" className="ml-2">
                                        <Star className="h-3 w-3 mr-1" />
                                        Oui
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="ml-2">Non</Badge>
                                    )}
                                  </div>
                                  <div><strong>Fournisseur:</strong> {selectedProduct.supplier_name || 'N/A'}</div>
                                  <div><strong>Créé le:</strong> {new Date(selectedProduct.created_at).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </div>
                            
                            {selectedProduct.description && (
                              <div>
                                <h4 className="font-medium mb-2">Description</h4>
                                <p className="text-sm text-muted-foreground">
                                  {selectedProduct.description}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center pt-4 border-t">
                              <Select
                                value={selectedProduct.status}
                                onValueChange={(value) => updateProductStatus(selectedProduct.id, value)}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border shadow-md z-50">
                                  <SelectItem value="published">Publié</SelectItem>
                                  <SelectItem value="draft">Brouillon</SelectItem>
                                  <SelectItem value="pending">En attente</SelectItem>
                                  <SelectItem value="archived">Archivé</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Select
                      value={product.status}
                      onValueChange={(value) => updateProductStatus(product.id, value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-50">
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Aucun produit ne correspond aux critères de recherche'
                  : 'Aucun produit importé trouvé'
                }
              </p>
              {products.length === 0 && (
                <Button className="mt-4" asChild>
                  <a href="/import">
                    <Plus className="mr-2 h-4 w-4" />
                    Importer mes premiers produits
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;