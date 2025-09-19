import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDropzone } from 'react-dropzone';
import {
  Package,
  Upload,
  Download,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  FileText,
  Image,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost_price?: number;
  currency: string;
  stock_quantity: number;
  category?: string;
  brand?: string;
  image_url?: string;
  image_urls?: string[];
  variants?: ProductVariant[];
  status: 'active' | 'draft' | 'archived';
  supplier_id?: string;
  supplier_name?: string;
  created_at: string;
  updated_at: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  price: number;
  stock_quantity: number;
  attributes: Record<string, string>;
}

interface ImportJob {
  id: string;
  source_type: 'csv' | 'api' | 'manual';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total_items: number;
  processed_items: number;
  success_items: number;
  error_items: number;
  created_at: string;
  file_name?: string;
  errors?: string[];
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    loadImportJobs();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mappedProducts = data?.map(p => ({
        ...p,
        currency: p.currency || 'EUR',
        variants: []
      })) || [];
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadImportJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      const mappedJobs = data?.map(j => ({
        ...j,
        progress: Math.floor((j.processed_rows / Math.max(j.total_rows, 1)) * 100),
        total_items: j.total_rows,
        processed_items: j.processed_rows,
        success_items: j.success_rows,
        error_items: j.error_rows
      })) || [];
      setImportJobs(mappedJobs);
    } catch (error) {
      console.error('Error loading import jobs:', error);
    }
  };

  const handleCSVImport = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Create import job
      const { data: importJob, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          source_type: 'csv',
          status: 'pending',
          file_data: { name: file.name, size: file.size },
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Process CSV import
      const { data, error } = await supabase.functions.invoke('process-import', {
        body: {
          job_id: importJob.id,
          file_data: await file.text(),
          mapping_config: {
            name: 'name',
            sku: 'sku',
            price: 'price',
            description: 'description',
            category: 'category'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Import démarré",
        description: `${file.name} est en cours d'importation.`,
      });

      await loadImportJobs();
      await loadProducts();
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Erreur d'import",
        description: "L'import a échoué. Vérifiez le format du fichier.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAPIImport = async (platformId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(`${platformId}-sync`, {
        body: {
          action: 'import_products',
          full_sync: false,
          limit: 1000
        }
      });

      if (error) throw error;

      toast({
        title: "Import API démarré",
        description: `Import depuis ${platformId} en cours...`,
      });

      await loadImportJobs();
      setTimeout(() => loadProducts(), 2000);
    } catch (error) {
      console.error('API import failed:', error);
      toast({
        title: "Erreur d'import API",
        description: "Vérifiez la connexion à la plateforme.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSync = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-stock-updater', {
        body: {
          product_ids: Array.from(selectedProducts),
          sync_prices: true,
          sync_stock: true
        }
      });

      if (error) throw error;

      toast({
        title: "Synchronisation en cours",
        description: `${selectedProducts.size} produits en cours de synchronisation.`,
      });

      setSelectedProducts(new Set());
      setTimeout(() => loadProducts(), 3000);
    } catch (error) {
      console.error('Bulk sync failed:', error);
      toast({
        title: "Erreur de synchronisation",
        description: "La synchronisation en lot a échoué.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => p.stock_quantity < 10).length,
    totalValue: products.reduce((acc, p) => acc + (p.price * p.stock_quantity), 0)
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleCSVImport,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xlsx']
    },
    multiple: false
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catalogue Produits</h1>
          <p className="text-muted-foreground mt-2">
            Milestone 1 - Import produits (CSV, API), variantes & images
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowImportDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Importer
          </Button>
          <Button onClick={() => setShowProductDialog(true)}>
            <Package className="w-4 h-4 mr-2" />
            Nouveau Produit
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
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
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              Moins de 10 unités
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Inventaire total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imports Actifs</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {importJobs.filter(j => j.status === 'processing').length}
            </div>
            <p className="text-xs text-muted-foreground">
              En cours
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="imports">Imports</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher par nom ou SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'Toutes catégories' : category}
                    </option>
                  ))}
                </select>
                
                {selectedProducts.size > 0 && (
                  <Button onClick={handleBulkSync} disabled={isLoading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Synchroniser ({selectedProducts.size})
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Produits</CardTitle>
              <CardDescription>
                {filteredProducts.length} produits affichés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
                          } else {
                            setSelectedProducts(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedProducts);
                            if (e.target.checked) {
                              newSet.add(product.id);
                            } else {
                              newSet.delete(product.id);
                            }
                            setSelectedProducts(newSet);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Image className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.category && (
                              <div className="text-sm text-muted-foreground">{product.category}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{product.sku}</TableCell>
                      <TableCell>
                        <div className="font-medium">€{product.price}</div>
                        {product.cost_price && (
                          <div className="text-sm text-muted-foreground">
                            Coût: €{product.cost_price}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          product.stock_quantity > 50 ? 'default' :
                          product.stock_quantity > 10 ? 'secondary' :
                          product.stock_quantity > 0 ? 'destructive' : 'outline'
                        }>
                          {product.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          product.status === 'active' ? 'default' :
                          product.status === 'draft' ? 'secondary' : 'outline'
                        }>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Imports</CardTitle>
              <CardDescription>
                Suivez vos imports CSV et API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {importJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {job.source_type === 'csv' ? '📁' : '🔄'}
                      </div>
                      <div>
                        <div className="font-medium">
                          {job.file_name || `Import ${job.source_type.toUpperCase()}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(job.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {job.processed_items}/{job.total_items}
                        </div>
                        <Progress 
                          value={job.progress} 
                          className="w-32"
                        />
                      </div>
                      <Badge variant={
                        job.status === 'completed' ? 'default' :
                        job.status === 'failed' ? 'destructive' :
                        job.status === 'processing' ? 'secondary' : 'outline'
                      }>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Variantes</CardTitle>
              <CardDescription>
                Configurez les variantes produits (taille, couleur, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  La gestion des variantes sera disponible dans cette section. 
                  Configurez des attributs comme la taille, couleur, matériau pour vos produits.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importer des Produits</DialogTitle>
            <DialogDescription>
              Choisissez votre méthode d'import
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="csv" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv">Import CSV</TabsTrigger>
              <TabsTrigger value="api">Import API</TabsTrigger>
            </TabsList>
            
            <TabsContent value="csv" className="space-y-4">
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Déposez le fichier ici' : 'Glissez votre fichier CSV ici'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  ou cliquez pour sélectionner un fichier
                </p>
                <Badge variant="outline">CSV, XLSX acceptés</Badge>
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Format attendu: name, sku, price, description, category, stock_quantity
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {['shopify', 'woocommerce', 'amazon', 'ebay'].map(platform => (
                  <Button
                    key={platform}
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => handleAPIImport(platform)}
                  >
                    <ShoppingCart className="w-6 h-6" />
                    <span className="capitalize">{platform}</span>
                  </Button>
                ))}
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Assurez-vous que vos connecteurs sont configurés dans la page Connections.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}