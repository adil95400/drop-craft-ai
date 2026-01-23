import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logAction } from '@/utils/consoleCleanup';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { useImportUltraPro, type ImportedProduct } from '@/hooks/useImportUltraPro';
import { BulkActionsPanel } from './BulkActionsPanel';
import { ProductQuickEdit } from './ProductQuickEdit';
import { ProductActions } from './ProductActions';
import { ImportFilters } from './ImportFilters';
import { ImportPublishOptions } from './ImportPublishOptions';
import { ImportedProductDetailModal } from './ImportedProductDetailModal';

export const AdvancedImportResults = () => {
  const { importedProducts, isLoadingProducts } = useImportUltraPro();
  
  // State for pagination, filtering, and selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<ImportedProduct | null>(null);
  const [publishProduct, setPublishProduct] = useState<ImportedProduct | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ImportedProduct | null>(null);

  // Filtered and sorted products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = importedProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof ImportedProduct];
      let bValue = b[sortBy as keyof ImportedProduct];
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [importedProducts, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const stats = useMemo(() => {
    const total = importedProducts.length;
    const published = importedProducts.filter(p => p.status === 'published').length;
    const draft = importedProducts.filter(p => p.status === 'draft').length;
    const pending = importedProducts.filter(p => p.review_status === 'pending').length;
    const rejected = importedProducts.filter(p => p.review_status === 'rejected').length;
    const aiOptimized = importedProducts.filter(p => p.ai_optimized).length;
    
    return { total, published, draft, pending, rejected, aiOptimized };
  }, [importedProducts]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Publié</Badge>;
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  const getReviewStatusBadge = (reviewStatus: string) => {
    switch (reviewStatus) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approuvé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(paginatedProducts.map(p => p.id!));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  // Get unique categories for filter
  const categories = useMemo(() => 
    [...new Set(importedProducts.map(p => p.category).filter(Boolean))],
    [importedProducts]
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <p className="text-sm text-muted-foreground">Publié</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            <p className="text-sm text-muted-foreground">Brouillon</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-sm text-muted-foreground">Rejeté</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.aiOptimized}</div>
            <p className="text-sm text-muted-foreground">IA Optimisé</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres et Recherche
            </CardTitle>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 par page</SelectItem>
                <SelectItem value="50">50 par page</SelectItem>
                <SelectItem value="100">100 par page</SelectItem>
                <SelectItem value="200">200 par page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, SKU, fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category!}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Panel */}
      {selectedProducts.length > 0 && (
        <BulkActionsPanel
          selectedCount={selectedProducts.length}
          selectedProducts={selectedProducts}
          onClearSelection={() => setSelectedProducts([])}
        />
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Produits Importés ({filteredAndSortedProducts.length})</span>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                disabled={isLoadingProducts}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingProducts ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Image</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    Produit
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-1">
                    Prix
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Révision</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">
                    Importé le
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingProducts ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Chargement des produits...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                          ? 'Aucun produit ne correspond à vos critères de recherche'
                          : 'Aucun produit importé trouvé'
                        }
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id!)}
                      onCheckedChange={(checked) => handleSelectProduct(product.id!, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    {product.image_urls?.[0] && (
                      <img 
                        src={product.image_urls[0]} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.sku}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {product.currency} {product.price}
                    </div>
                    {product.cost_price && (
                      <div className="text-sm text-muted-foreground">
                        Coût: {product.currency} {product.cost_price}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(product.status!)}</TableCell>
                  <TableCell>{getReviewStatusBadge(product.review_status!)}</TableCell>
                  <TableCell>
                    {product.category && (
                      <Badge variant="outline">{product.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{product.supplier_name}</TableCell>
                  <TableCell className="text-sm">
                    {product.created_at && new Date(product.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                   <TableCell>
                     <div className="flex items-center gap-1">
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => setViewingProduct(product)}
                         title="Voir détails"
                       >
                         <Eye className="h-4 w-4" />
                       </Button>
                       <ProductActions
                         product={product}
                         onEdit={setEditingProduct}
                         onPublish={setPublishProduct}
                         onRefresh={() => window.location.reload()}
                       />
                     </div>
                   </TableCell>
                </TableRow>
               ))
               )}
             </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + Math.max(1, currentPage - 2);
                    if (page > totalPages) return null;
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Edit Modal */}
      {editingProduct && (
        <ProductQuickEdit
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(updatedProduct) => {
            // Handle product update
            logAction('Updating product', updatedProduct);
            setEditingProduct(null);
          }}
        />
      )}
      
      {/* Multi-Channel Publishing Modal */}
      {publishProduct && (
        <ImportPublishOptions
          product={publishProduct}
          isOpen={!!publishProduct}
          onClose={() => setPublishProduct(null)}
        />
      )}

      {/* Product Detail Modal */}
      {viewingProduct && (
        <ImportedProductDetailModal
          productId={viewingProduct.id!}
          isOpen={!!viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      )}
    </div>
  );
};