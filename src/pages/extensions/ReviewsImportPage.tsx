/**
 * Reviews Import Page - Import avancé des avis produits
 * Via extension, URL, CSV ou manuellement
 */
import { useState, useMemo } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { 
  Star, Upload, FileSpreadsheet, Link as LinkIcon, Download, Filter,
  Search, Plus, Trash2, CheckCircle, XCircle, Loader2, RefreshCw,
  MoreHorizontal, Eye, Edit3, Globe, Chrome, FileJson
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AdvancedReviewsImportModal } from '@/components/import/reviews/AdvancedReviewsImportModal';
import { ProductReviewsList } from '@/components/import/reviews/ProductReviewsList';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ReviewsImportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);

  // Fetch imported reviews
  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ['imported-reviews', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('imported_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch products for selection
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-reviews', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, title, sku')
        .eq('user_id', user.id)
        .order('title')
        .limit(200);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Stats
  const stats = useMemo(() => {
    const total = reviews.length;
    const avgRating = total > 0 
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total).toFixed(1)
      : '0';
    const verified = reviews.filter(r => r.verified_purchase).length;
    const sources = [...new Set(reviews.map(r => r.source).filter(Boolean))];
    
    return { total, avgRating, verified, sources };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !review.customer_name?.toLowerCase().includes(query) &&
          !review.title?.toLowerCase().includes(query) &&
          !review.comment?.toLowerCase().includes(query) &&
          !review.product_name?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      
      // Rating filter
      if (ratingFilter !== 'all') {
        if (review.rating !== parseInt(ratingFilter)) return false;
      }
      
      // Source filter
      if (sourceFilter !== 'all') {
        if (review.source !== sourceFilter) return false;
      }
      
      return true;
    });
  }, [reviews, searchQuery, ratingFilter, sourceFilter]);

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('imported_reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
      
      toast.success('Avis supprimé');
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const handleBulkDelete = async () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    setShowBulkDeleteConfirm(false);
    
    try {
      const ids = filteredReviews.map(r => r.id);
      const { error } = await supabase
        .from('imported_reviews')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      
      toast.success(`${ids.length} avis supprimés`);
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < Math.floor(rating) 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <ChannablePageWrapper
      title="Import des Avis"
      description="Importez et gérez les avis clients de vos produits"
      heroImage="extensions"
      badge={{ label: 'Avis', icon: Star }}
      actions={
        <>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />Actualiser
          </Button>
          <Button onClick={() => setShowImportModal(true)}>
            <Plus className="h-4 w-4 mr-2" />Importer des avis
          </Button>
        </>
      }
    >

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Avis</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Note Moyenne</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {stats.avgRating}
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achats Vérifiés</p>
                <p className="text-2xl font-bold">{stats.verified}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sources</p>
                <p className="text-2xl font-bold">{stats.sources.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Méthodes d'import</CardTitle>
          <CardDescription>Choisissez comment importer vos avis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => setShowImportModal(true)}
            >
              <FileSpreadsheet className="h-6 w-6 text-green-500" />
              <span className="text-sm font-medium">CSV / JSON</span>
              <span className="text-xs text-muted-foreground">Fichier local</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => setShowImportModal(true)}
            >
              <LinkIcon className="h-6 w-6 text-blue-500" />
              <span className="text-sm font-medium">Par URL</span>
              <span className="text-xs text-muted-foreground">Amazon, AliExpress...</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => window.open('/extensions', '_blank')}
            >
              <Chrome className="h-6 w-6 text-cyan-500" />
              <span className="text-sm font-medium">Extension</span>
              <span className="text-xs text-muted-foreground">Chrome / Firefox</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => setShowImportModal(true)}
            >
              <Edit3 className="h-6 w-6 text-purple-500" />
              <span className="text-sm font-medium">Manuel</span>
              <span className="text-xs text-muted-foreground">Ajouter un par un</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters & Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Avis importés</CardTitle>
              <CardDescription>
                {filteredReviews.length} avis affichés
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Note" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes notes</SelectItem>
                  {[5, 4, 3, 2, 1].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes sources</SelectItem>
                  {stats.sources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {filteredReviews.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer ({filteredReviews.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Aucun avis trouvé</p>
              <Button className="mt-4" onClick={() => setShowImportModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Importer des avis
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredReviews.map((review) => (
                  <div 
                    key={review.id}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-medium">{review.customer_name}</span>
                          {renderStars(review.rating)}
                          {review.verified_purchase && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              Vérifié
                            </Badge>
                          )}
                          {review.source && (
                            <Badge variant="outline" className="text-xs">
                              {review.source}
                            </Badge>
                          )}
                          {review.product_name && (
                            <Badge variant="secondary" className="text-xs">
                              {review.product_name}
                            </Badge>
                          )}
                        </div>
                        
                        {review.title && (
                          <p className="font-medium text-sm mb-1">{review.title}</p>
                        )}
                        
                        {review.comment && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                        )}
                        
                        {review.review_date && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(review.review_date), 'd MMMM yyyy', { locale: fr })}
                          </p>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Import Modal */}
      <AdvancedReviewsImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        productId={selectedProduct?.id}
        productName={selectedProduct?.name}
        onSuccess={() => {
          refetch();
          setSelectedProduct(null);
        }}
      />

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        title={`Supprimer ${filteredReviews.length} avis ?`}
        description="Cette action est irréversible."
        confirmText="Supprimer tout"
        variant="destructive"
        onConfirm={confirmBulkDelete}
      />
    </ChannablePageWrapper>
  );
}
