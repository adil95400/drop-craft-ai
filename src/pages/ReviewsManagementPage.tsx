import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ThumbsUp, MessageSquare, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

const ReviewsManagementPage: React.FC = () => {
  const reviews = [
    {
      id: 1,
      customer: 'Marie Dupont',
      product: 'Product A',
      rating: 5,
      comment: 'Excellent produit, très satisfaite de mon achat!',
      date: '2024-01-15',
      status: 'published',
      helpful: 12,
    },
    {
      id: 2,
      customer: 'Jean Martin',
      product: 'Product B',
      rating: 3,
      comment: 'Produit correct mais livraison un peu longue',
      date: '2024-01-14',
      status: 'pending',
      helpful: 3,
    },
    {
      id: 3,
      customer: 'Sophie Leblanc',
      product: 'Product A',
      rating: 4,
      comment: 'Bon rapport qualité/prix',
      date: '2024-01-13',
      status: 'published',
      helpful: 8,
    },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des avis</h1>
          <p className="text-muted-foreground">
            Gérez les avis et notes de vos clients
          </p>
        </div>
        <Button>
          <MessageSquare className="mr-2 h-4 w-4" />
          Demander des avis
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.6/5</div>
            <p className="text-xs text-muted-foreground">234 avis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avis en attente</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">À modérer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de réponse</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +5% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avis ce mois</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">+12 vs mois dernier</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tous les avis</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="published">Publiés</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tous les avis clients</CardTitle>
              <CardDescription>Modérez et répondez aux avis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{review.customer}</h4>
                            {renderStars(review.rating)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Produit: {review.product} • {review.date}
                          </p>
                          <p className="text-sm">{review.comment}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={review.status === 'published' ? 'default' : 'secondary'}
                        >
                          {review.status === 'published' ? 'Publié' : 'En attente'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{review.helpful} personnes ont trouvé cet avis utile</span>
                      </div>
                      <div className="flex gap-2">
                        {review.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline">
                              Rejeter
                            </Button>
                            <Button size="sm">Publier</Button>
                          </>
                        )}
                        <Button size="sm" variant="outline">
                          Répondre
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Avis en attente de modération</CardTitle>
              <CardDescription>Validez ou rejetez les nouveaux avis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {reviews.filter(r => r.status === 'pending').length} avis en attente
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="published">
          <Card>
            <CardHeader>
              <CardTitle>Avis publiés</CardTitle>
              <CardDescription>Avis visibles par vos clients</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {reviews.filter(r => r.status === 'published').length} avis publiés
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des notes</CardTitle>
                <CardDescription>Distribution des évaluations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 min-w-[80px]">
                        {renderStars(stars)}
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${Math.random() * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground min-w-[40px] text-right">
                        {Math.floor(Math.random() * 50)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produits les mieux notés</CardTitle>
                <CardDescription>Top 5 produits par note</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Product {i}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(5)}
                          <span className="text-xs text-muted-foreground">
                            ({Math.floor(Math.random() * 50)} avis)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReviewsManagementPage;
