import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Check, X, Sparkles, Edit, Trash2, RefreshCw } from "lucide-react";
import { useProductImports } from '@/hooks/useProductImports';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ImportedProducts() {
  const { 
    importedProducts, 
    loading, 
    fetchImportedProducts, 
    approveProduct, 
    rejectProduct, 
    optimizeWithAI 
  } = useProductImports();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'draft': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const filteredProducts = importedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(importedProducts.map(p => p.category).filter(Boolean)));

  const stats = {
    total: importedProducts.length,
    draft: importedProducts.filter(p => p.status === 'draft').length,
    published: importedProducts.filter(p => p.status === 'published').length,
    rejected: importedProducts.filter(p => p.status === 'rejected').length,
    aiOptimized: importedProducts.filter(p => p.ai_optimized).length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produits Importés</h1>
          <p className="text-muted-foreground">
            Gérez et validez vos produits importés avant publication
          </p>
        </div>
        <Button onClick={() => fetchImportedProducts()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Brouillons</p>
                <p className="text-2xl font-bold text-blue-600">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Publiés</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejetés</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">IA Optimisés</p>
                <p className="text-2xl font-bold text-purple-600">{stats.aiOptimized}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, SKU ou fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des produits...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Aucun produit ne correspond à vos critères de recherche.'
                : 'Vous n\'avez pas encore de produits importés.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              {product.image_urls?.[0] && (
                <div className="aspect-video bg-gray-100">
                  <img 
                    src={product.image_urls[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={getStatusColor(product.status)}>
                    {getStatusText(product.status)}
                  </Badge>
                  {product.ai_optimized && (
                    <Badge variant="outline" className="border-purple-200 text-purple-700">
                      <Sparkles className="w-3 h-3 mr-1" />
                      IA
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {product.name}
                </h3>

                {product.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prix:</span>
                    <span className="font-semibold">
                      {product.price.toFixed(2)} {product.currency}
                    </span>
                  </div>
                  
                  {product.cost_price && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Coût:</span>
                      <span className="text-sm">
                        {product.cost_price.toFixed(2)} {product.currency}
                      </span>
                    </div>
                  )}

                  {product.sku && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">SKU:</span>
                      <span className="text-sm font-mono">{product.sku}</span>
                    </div>
                  )}

                  {product.category && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Catégorie:</span>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                  )}

                  {product.supplier_name && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Fournisseur:</span>
                      <span className="text-sm">{product.supplier_name}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mb-4">
                  Importé le {format(new Date(product.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    Voir
                  </Button>
                  
                  {product.status === 'draft' && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => approveProduct(product.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approuver
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => rejectProduct(product.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rejeter
                      </Button>

                      {!product.ai_optimized && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => optimizeWithAI(product.id)}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          <Sparkles className="w-4 h-4 mr-1" />
                          IA
                        </Button>
                      )}
                    </>
                  )}

                  {product.status === 'published' && (
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                  )}
                </div>

                {product.tags && product.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {product.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {product.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{product.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}