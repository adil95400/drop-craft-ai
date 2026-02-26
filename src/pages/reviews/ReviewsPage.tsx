/**
 * Page Avis Clients - Hub centralisé multi-plateformes
 * Données réelles depuis product_reviews + CRUD complet
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import {
  Star, Download, Upload, Plus, Filter, MessageSquare,
  ThumbsUp, ThumbsDown, AlertTriangle, Trash2, CheckCircle,
  Image as ImageIcon, Globe, MoreHorizontal, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  useProductReviews,
  useReviewStats,
  useCreateReview,
  useDeleteReview,
  type ProductReview,
} from '@/hooks/reviews/useProductReviews';
import { AdvancedReviewsImportModal } from '@/components/import/reviews/AdvancedReviewsImportModal';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

function StatCard({ label, value, icon: Icon, trend, color }: {
  label: string; value: string; icon: React.ElementType; trend?: string; color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && <p className="text-xs text-emerald-600">{trend}</p>}
          </div>
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', color || 'bg-primary/10')}>
            <Icon className={cn('h-5 w-5', color ? 'text-white' : 'text-primary')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} className="focus:outline-none">
          <Star className={`h-6 w-6 transition-colors ${i <= value ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30 hover:text-yellow-400'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New review form
  const [newReview, setNewReview] = useState({
    author: '',
    rating: 5,
    text: '',
    verified_purchase: false,
    source_platform: 'manual',
  });

  const minRating = ratingFilter === 'positive' ? 4 : ratingFilter === 'negative' ? undefined : undefined;
  const maxRating = ratingFilter === 'negative' ? 2 : undefined;

  const { data: reviews = [], isLoading, refetch: refetchReviews } = useProductReviews({
    search: search || undefined,
    platform: platformFilter,
    minRating,
    maxRating,
  });

  const { data: stats } = useReviewStats();
  const createReview = useCreateReview();
  const deleteReview = useDeleteReview();

  const handleCreate = async () => {
    if (!newReview.text.trim() && !newReview.author.trim()) return;
    await createReview.mutateAsync(newReview);
    setCreateModalOpen(false);
    setNewReview({ author: '', rating: 5, text: '', verified_purchase: false, source_platform: 'manual' });
  };

  const handleExport = () => {
    const csv = [
      'Auteur,Note,Commentaire,Plateforme,Date,Vérifié',
      ...reviews.map(r =>
        `"${r.author}",${r.rating},"${r.text?.replace(/"/g, '""') || ''}","${r.source_platform || ''}","${r.review_date || ''}",${r.verified_purchase ? 'Oui' : 'Non'}`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avis-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const positiveReviews = reviews.filter(r => r.rating >= 4);
  const negativeReviews = reviews.filter(r => r.rating <= 2);

  return (
    <ChannablePageWrapper
      title="Avis Clients"
      description={`${stats?.total || 0} avis • Note moyenne ${stats?.average || 0}/5 • Gestion centralisée multi-plateformes`}
      heroImage="products"
      badge={{ label: 'Avis', icon: Star }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setImportModalOpen(true)}>
            <Upload className="h-4 w-4" />
            Importer
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Note Moyenne" value={`${stats?.average || 0}/5`} icon={Star} />
        <StatCard label="Avis Positifs" value={`${stats?.positiveCount || 0}`} icon={ThumbsUp} />
        <StatCard label="Avis Négatifs" value={`${stats?.negativeCount || 0}`} icon={ThumbsDown} />
        <StatCard label="Vérifiés" value={`${stats?.verifiedCount || 0}`} icon={CheckCircle} />
      </div>

      {/* Rating Distribution */}
      {stats && stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribution des Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.distribution[rating] || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm w-8">{rating} ★</span>
                  <Progress value={pct} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-12 text-right">{count} ({Math.round(pct)}%)</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Filters & Reviews */}
      <Tabs defaultValue="all" className="space-y-4" onValueChange={v => setRatingFilter(v)}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Tous ({reviews.length})</TabsTrigger>
            <TabsTrigger value="positive">Positifs ({positiveReviews.length})</TabsTrigger>
            <TabsTrigger value="negative">Négatifs ({negativeReviews.length})</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-48 pl-8"
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Plateforme" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="manual">Manuel</SelectItem>
                <SelectItem value="aliexpress">AliExpress</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="shopify">Shopify</SelectItem>
                <SelectItem value="ebay">eBay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-4">Aucun avis trouvé</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setImportModalOpen(true)} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Importer des avis
                </Button>
                <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Créer un avis
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="all" className="space-y-3 mt-0">
              {reviews.map(review => (
                <ReviewCard key={review.id} review={review} onDelete={deleteReview.mutate} />
              ))}
            </TabsContent>
            <TabsContent value="positive" className="space-y-3 mt-0">
              {positiveReviews.map(review => (
                <ReviewCard key={review.id} review={review} onDelete={deleteReview.mutate} />
              ))}
            </TabsContent>
            <TabsContent value="negative" className="space-y-3 mt-0">
              {negativeReviews.map(review => (
                <ReviewCard key={review.id} review={review} onDelete={deleteReview.mutate} />
              ))}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Import Modal */}
      <AdvancedReviewsImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={() => refetchReviews()}
      />

      {/* Create Review Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un avis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom de l'auteur</Label>
              <Input
                value={newReview.author}
                onChange={e => setNewReview(p => ({ ...p, author: e.target.value }))}
                placeholder="ex: Marie L."
              />
            </div>
            <div>
              <Label>Note</Label>
              <RatingInput value={newReview.rating} onChange={v => setNewReview(p => ({ ...p, rating: v }))} />
            </div>
            <div>
              <Label>Commentaire</Label>
              <Textarea
                value={newReview.text}
                onChange={e => setNewReview(p => ({ ...p, text: e.target.value }))}
                placeholder="Excellent produit..."
                rows={4}
              />
            </div>
            <div>
              <Label>Plateforme source</Label>
              <Select value={newReview.source_platform} onValueChange={v => setNewReview(p => ({ ...p, source_platform: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuel</SelectItem>
                  <SelectItem value="aliexpress">AliExpress</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="shopify">Shopify</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newReview.verified_purchase}
                onCheckedChange={v => setNewReview(p => ({ ...p, verified_purchase: v }))}
              />
              <Label>Achat vérifié</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={createReview.isPending}>
              {createReview.isPending ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChannablePageWrapper>
  );
}

function ReviewCard({ review, onDelete }: { review: ProductReview; onDelete: (id: string) => void }) {
  const platformColors: Record<string, string> = {
    aliexpress: 'bg-orange-100 text-orange-700 border-orange-200',
    amazon: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    tiktok: 'bg-pink-100 text-pink-700 border-pink-200',
    shopify: 'bg-green-100 text-green-700 border-green-200',
    ebay: 'bg-blue-100 text-blue-700 border-blue-200',
    manual: 'bg-muted text-muted-foreground',
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <RatingStars rating={review.rating} />
              {review.verified_purchase && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" />
                  Vérifié
                </Badge>
              )}
              {review.source_platform && (
                <Badge variant="outline" className={cn('text-xs', platformColors[review.source_platform] || '')}>
                  {review.source_platform}
                </Badge>
              )}
              {review.images && review.images.length > 0 && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <ImageIcon className="h-3 w-3" />
                  {review.images.length}
                </Badge>
              )}
            </div>

            {review.product_name && review.product_name !== 'Produit inconnu' && (
              <p className="text-sm font-medium">{review.product_name}</p>
            )}

            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
              {review.text}
            </p>

            {/* Review images */}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2">
                {review.images.slice(0, 4).map((img, i) => (
                  <img key={i} src={img} alt="" className="h-14 w-14 rounded object-cover border" />
                ))}
                {review.images.length > 4 && (
                  <div className="h-14 w-14 rounded bg-muted flex items-center justify-center text-xs font-medium">
                    +{review.images.length - 4}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{review.author}</span>
              {review.review_date && (
                <>
                  <span>•</span>
                  <span>{format(new Date(review.review_date), 'd MMM yyyy', { locale: getDateFnsLocale() })}</span>
                </>
              )}
              {review.country && (
                <>
                  <span>•</span>
                  <Globe className="h-3 w-3" />
                  <span>{review.country}</span>
                </>
              )}
              {review.helpful_count != null && review.helpful_count > 0 && (
                <>
                  <span>•</span>
                  <ThumbsUp className="h-3 w-3" />
                  <span>{review.helpful_count}</span>
                </>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (confirm('Supprimer cet avis ?')) onDelete(review.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
