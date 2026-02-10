import React, { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Search,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PublishProductButton } from '@/components/products/PublishProductButton';
import { PublishStatsCard } from '@/components/products/PublishStatsCard';
import { usePublishProducts } from '@/hooks/usePublishProducts';

interface PublishProduct {
  id: string;
  name: string;
  sku?: string;
  price: number;
  category?: string;
  stock_quantity?: number;
  image_url?: string;
  status: string;
  published_product_id?: string;
  sync_status?: 'pending' | 'synced' | 'error' | 'outdated';
}

export default function ProductPublishing() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { bulkPublish } = usePublishProducts();

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['products-publishing', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        category: p.category,
        stock_quantity: p.stock_quantity,
        image_url: p.image_url,
        status: p.status,
        published_product_id: (p as any).shopify_id || null,
        sync_status: p.status === 'active' ? 'synced' : 'pending'
      })) as PublishProduct[];
    },
    enabled: !!user?.id,
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && product.published_product_id) ||
      (statusFilter === 'unpublished' && !product.published_product_id) ||
      (statusFilter === 'synced' && product.sync_status === 'synced') ||
      (statusFilter === 'outdated' && product.sync_status === 'outdated') ||
      (statusFilter === 'pending' && product.sync_status === 'pending') ||
      (statusFilter === 'error' && product.sync_status === 'error');

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: products.length,
    published: products.filter((p) => p.published_product_id).length,
    pending: products.filter((p) => p.sync_status === 'pending').length,
    synced: products.filter((p) => p.sync_status === 'synced').length,
    outdated: products.filter((p) => p.sync_status === 'outdated').length,
    errors: products.filter((p) => p.sync_status === 'error').length,
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  const handleBulkPublish = () => {
    bulkPublish(selectedProducts);
    setSelectedProducts([]);
  };

  const getStatusBadge = (product: PublishProduct) => {
    if (!product.published_product_id) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Non publié
        </Badge>
      );
    }

    switch (product.sync_status) {
      case 'synced':
        return (
          <Badge variant="default">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Synchronisé
          </Badge>
        );
      case 'outdated':
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Obsolète
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erreur
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <ChannablePageWrapper
        title="Publication des Produits"
        description="Gérez la publication de vos produits vers votre catalogue principal"
        heroImage="products"
        badge={{ label: 'Publication', icon: Upload }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </ChannablePageWrapper>
    );
  }

  return (
    <ChannablePageWrapper
      title="Publication des Produits"
      description="Gérez la publication de vos produits vers votre catalogue principal"
      heroImage="products"
      badge={{ label: 'Publication', icon: Upload }}
      actions={
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />Actualiser
        </Button>
      }
    >

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Publiés</div>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Synchronisés</div>
            <div className="text-2xl font-bold text-blue-600">{stats.synced}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Obsolètes</div>
            <div className="text-2xl font-bold text-orange-600">{stats.outdated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">En attente</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Erreurs</div>
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('all')}
                  >
                    Tous
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === 'unpublished' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('unpublished')}
                  >
                    Non publiés
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === 'outdated' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('outdated')}
                  >
                    Obsolètes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedProducts.length} produit(s) sélectionné(s)
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleBulkPublish}>
                      <Upload className="h-4 w-4 mr-1" />
                      Publier la sélection
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedProducts([])}
                    >
                      Désélectionner
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Produits ({filteredProducts.length})
              </h2>
              <Button size="sm" variant="outline" onClick={handleSelectAll}>
                {selectedProducts.length === filteredProducts.length
                  ? 'Désélectionner tout'
                  : 'Sélectionner tout'}
              </Button>
            </div>

            {filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground">
                    Essayez de modifier vos filtres ou critères de recherche
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className={`hover:shadow-md transition-shadow ${
                      selectedProducts.includes(product.id) ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedProducts((prev) =>
                              prev.includes(product.id)
                                ? prev.filter((id) => id !== product.id)
                                : [...prev, product.id]
                            );
                          }}
                          className="mt-1"
                        />

                        {product.image_url && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-semibold line-clamp-1">
                                {product.name}
                              </h3>
                              {product.sku && (
                                <p className="text-sm text-muted-foreground">
                                  SKU: {product.sku}
                                </p>
                              )}
                            </div>
                            {getStatusBadge(product)}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-semibold text-primary">
                                {product.price}€
                              </span>
                              {product.category && (
                                <Badge variant="outline" className="text-xs">
                                  {product.category}
                                </Badge>
                              )}
                              {product.stock_quantity !== undefined && product.stock_quantity !== null && (
                                <span className="text-muted-foreground">
                                  Stock: {product.stock_quantity}
                                </span>
                              )}
                            </div>

                            <PublishProductButton
                              productId={product.id}
                              isPublished={!!product.published_product_id}
                              syncStatus={product.sync_status || null}
                              compact={true}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <PublishStatsCard />
        </div>
      </div>
    </ChannablePageWrapper>
  );
}