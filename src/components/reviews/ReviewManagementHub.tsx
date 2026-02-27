import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReviewManagement } from '@/hooks/useReviewManagement';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import {
  Star,
  MessageSquare,
  Image,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Download,
  Settings
} from 'lucide-react';

export const ReviewManagementHub = () => {
  const {
    reviews,
    reviewsLoading,
    moderateReview,
    bulkModerate,
    manualModerate,
    moderationStats,
    analytics,
    widgets,
    importJobs,
    createImportJob
  } = useReviewManagement();

  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);

  if (reviewsLoading) {
    return <LoadingSpinner text="Chargement des avis..." />;
  }

  const statCards = [
    {
      title: 'Total des avis',
      value: analytics?.total_reviews || 0,
      icon: MessageSquare,
      color: 'text-info',
      href: '/reviews'
    },
    {
      title: 'Note moyenne',
      value: analytics?.average_rating?.toFixed(1) || '0.0',
      icon: Star,
      color: 'text-warning',
      href: '/reviews'
    },
    {
      title: 'En attente',
      value: analytics?.by_status?.pending || 0,
      icon: Clock,
      color: 'text-warning',
      href: '/reviews'
    },
    {
      title: 'Approuvés',
      value: analytics?.by_status?.approved || 0,
      icon: CheckCircle,
      color: 'text-success',
      href: '/reviews'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Avis</h1>
          <p className="text-muted-foreground">
            Importation automatique, modération IA et widgets d'évaluation
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const navigate = useNavigate();
          return (
            <Card 
              key={index}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => stat.href && navigate(stat.href)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reviews">
            <MessageSquare className="h-4 w-4 mr-2" />
            Avis
          </TabsTrigger>
          <TabsTrigger value="moderation">
            <Sparkles className="h-4 w-4 mr-2" />
            Modération IA
          </TabsTrigger>
          <TabsTrigger value="import">
            <Download className="h-4 w-4 mr-2" />
            Import
          </TabsTrigger>
          <TabsTrigger value="widgets">
            <Settings className="h-4 w-4 mr-2" />
            Widgets
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des avis</CardTitle>
                <div className="flex gap-2">
                  {selectedReviews.length > 0 && (
                    <Button
                      onClick={() => bulkModerate.mutate(selectedReviews)}
                      disabled={bulkModerate.isPending}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Modérer ({selectedReviews.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews?.map((review: any) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedReviews.includes(review.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedReviews([...selectedReviews, review.id]);
                              } else {
                                setSelectedReviews(selectedReviews.filter(id => id !== review.id));
                              }
                            }}
                            className="rounded"
                          />
                          <h4 className="font-semibold">{review.title || 'Sans titre'}</h4>
                          <Badge variant={
                            review.status === 'approved' ? 'default' :
                            review.status === 'rejected' ? 'destructive' :
                            review.status === 'flagged' ? 'secondary' : 'outline'
                          }>
                            {review.status}
                          </Badge>
                          {review.ai_sentiment && (
                            <Badge variant="outline">
                              {review.ai_sentiment === 'positive' ? '😊' :
                               review.ai_sentiment === 'negative' ? '😞' : '😐'}
                              {' '}{review.ai_sentiment}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'fill-warning text-warning'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                          <span className="text-sm text-muted-foreground ml-2">
                            {review.customer_name} • {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.content}</p>
                        {review.photos?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {review.photos.slice(0, 3).map((photo: string, idx: number) => (
                              <div key={idx} className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                                <Image className="h-6 w-6 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moderateReview.mutate(review.id)}
                          disabled={moderateReview.isPending}
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => manualModerate.mutate({ id: review.id, status: 'approved' })}
                        >
                          <CheckCircle className="h-4 w-4 text-success" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => manualModerate.mutate({ id: review.id, status: 'rejected' })}
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modération par IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Positifs</p>
                        <h3 className="text-2xl font-bold text-success">
                          {moderationStats?.sentiment?.positive || 0}
                        </h3>
                      </div>
                      <div className="text-3xl">😊</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Neutres</p>
                        <h3 className="text-2xl font-bold text-warning">
                          {moderationStats?.sentiment?.neutral || 0}
                        </h3>
                      </div>
                      <div className="text-3xl">😐</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Négatifs</p>
                        <h3 className="text-2xl font-bold text-destructive">
                          {moderationStats?.sentiment?.negative || 0}
                        </h3>
                      </div>
                      <div className="text-3xl">😞</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4" />
                <p>L'IA analyse automatiquement le sentiment, détecte le spam et catégorise les avis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importation automatique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Importer des avis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Importez automatiquement depuis AliExpress, Amazon, Shopify
                  </p>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Configurer l'import
                  </Button>
                </div>
                {importJobs?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Imports récents</h4>
                    {importJobs.map((job: any) => (
                      <Card key={job.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{job.source_platform}</p>
                            <p className="text-sm text-muted-foreground">
                              {job.imported_reviews} / {job.total_reviews} importés
                            </p>
                          </div>
                          <Badge>{job.status}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Widgets Tab */}
        <TabsContent value="widgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Widgets d'évaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Créer un widget</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Affichez vos avis sur votre site avec des widgets personnalisables
                </p>
                <Button>Créer un widget</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics des avis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">Par plateforme</h4>
                    {analytics?.by_platform && Object.entries(analytics.by_platform).map(([platform, count]: any) => (
                      <div key={platform} className="flex items-center justify-between mb-2">
                        <span className="text-sm">{platform}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">Tendance (30 jours)</h4>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-8 w-8 text-success" />
                      <div>
                        <p className="text-2xl font-bold">{analytics?.recent_trend || 0}</p>
                        <p className="text-sm text-muted-foreground">Nouveaux avis</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
