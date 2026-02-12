/**
 * Page Avis Clients - Design Channable Premium
 * Gestion centralisée des avis clients multi-plateformes
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Star, Download, Filter, MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface Review {
  id: string;
  product: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  platform: string;
  status: 'published' | 'pending' | 'flagged';
  response?: string;
}

const MOCK_REVIEWS: Review[] = [
  { id: '1', product: 'Écouteurs Bluetooth Pro', author: 'Marie L.', rating: 5, comment: 'Excellent produit, qualité sonore incroyable !', date: '2026-02-08', platform: 'Shopify', status: 'published' },
  { id: '2', product: 'Coque iPhone 15', author: 'Pierre D.', rating: 4, comment: 'Bonne qualité mais un peu chère.', date: '2026-02-07', platform: 'Amazon', status: 'published' },
  { id: '3', product: 'Lampe LED Bureau', author: 'Sophie M.', rating: 2, comment: 'Déçue, la luminosité est faible.', date: '2026-02-06', platform: 'eBay', status: 'flagged' },
  { id: '4', product: 'Chargeur Sans Fil', author: 'Lucas R.', rating: 5, comment: 'Parfait, charge rapide et design élégant.', date: '2026-02-05', platform: 'Shopify', status: 'published' },
  { id: '5', product: 'Support Téléphone Voiture', author: 'Emma B.', rating: 3, comment: 'Correct mais la ventouse lâche parfois.', date: '2026-02-04', platform: 'Amazon', status: 'pending' },
];

function StatCard({ label, value, icon: Icon, trend, onClick }: { label: string; value: string; icon: React.ElementType; trend?: string; onClick?: () => void }) {
  return (
    <Card className={cn(onClick && "cursor-pointer hover:shadow-md transition-shadow")} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && <p className="text-xs text-emerald-600">{trend}</p>}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
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

export default function ReviewsPage() {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredReviews = MOCK_REVIEWS.filter(r => {
    if (search && !r.product.toLowerCase().includes(search.toLowerCase()) && !r.comment.toLowerCase().includes(search.toLowerCase())) return false;
    if (platformFilter !== 'all' && r.platform !== platformFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const avgRating = (MOCK_REVIEWS.reduce((acc, r) => acc + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);
  const positiveCount = MOCK_REVIEWS.filter(r => r.rating >= 4).length;
  const negativeCount = MOCK_REVIEWS.filter(r => r.rating <= 2).length;
  const pendingCount = MOCK_REVIEWS.filter(r => r.status === 'pending').length;

  return (
    <ChannablePageWrapper
      title="Avis Clients"
      description={`${MOCK_REVIEWS.length} avis • Note moyenne ${avgRating}/5 • Gérez et répondez aux avis multi-plateformes`}
      heroImage="products"
      badge={{ label: 'Avis', icon: Star }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Note Moyenne" value={`${avgRating}/5`} icon={Star} trend="+0.2 ce mois" />
        <StatCard label="Avis Positifs" value={`${positiveCount}`} icon={ThumbsUp} />
        <StatCard label="Avis Négatifs" value={`${negativeCount}`} icon={ThumbsDown} />
        <StatCard label="En Attente" value={`${pendingCount}`} icon={AlertTriangle} />
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribution des Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = MOCK_REVIEWS.filter(r => r.rating === rating).length;
            const pct = (count / MOCK_REVIEWS.length) * 100;
            return (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm w-8">{rating} ★</span>
                <Progress value={pct} className="flex-1 h-2" />
                <span className="text-sm text-muted-foreground w-8">{count}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Tous ({MOCK_REVIEWS.length})</TabsTrigger>
            <TabsTrigger value="positive">Positifs ({positiveCount})</TabsTrigger>
            <TabsTrigger value="negative">Négatifs ({negativeCount})</TabsTrigger>
            <TabsTrigger value="pending">En attente ({pendingCount})</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Plateforme" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Shopify">Shopify</SelectItem>
                <SelectItem value="Amazon">Amazon</SelectItem>
                <SelectItem value="eBay">eBay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-3">
          {filteredReviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </TabsContent>
        <TabsContent value="positive" className="space-y-3">
          {filteredReviews.filter(r => r.rating >= 4).map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </TabsContent>
        <TabsContent value="negative" className="space-y-3">
          {filteredReviews.filter(r => r.rating <= 2).map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </TabsContent>
        <TabsContent value="pending" className="space-y-3">
          {filteredReviews.filter(r => r.status === 'pending').map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const statusColors: Record<string, string> = {
    published: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
    flagged: 'bg-red-500/10 text-red-700 border-red-200',
  };
  const statusLabels: Record<string, string> = {
    published: 'Publié',
    pending: 'En attente',
    flagged: 'Signalé',
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <RatingStars rating={review.rating} />
              <Badge variant="outline" className={statusColors[review.status]}>
                {statusLabels[review.status]}
              </Badge>
              <Badge variant="outline">{review.platform}</Badge>
            </div>
            <p className="text-sm font-medium">{review.product}</p>
            <p className="text-sm text-muted-foreground">{review.comment}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{review.author}</span>
              <span>•</span>
              <span>{new Date(review.date).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
            <MessageSquare className="h-3.5 w-3.5" />
            Répondre
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
