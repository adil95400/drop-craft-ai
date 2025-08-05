import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  Download, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Shield, 
  Code, 
  BarChart3,
  Filter,
  Settings,
  Import,
  Globe
} from "lucide-react";
import { AppLayout } from "@/layouts/AppLayout";

const Reviews = () => {
  const [selectedReview, setSelectedReview] = useState<string | null>(null);

  const reviews = [
    {
      id: "1",
      author: "Marie L.",
      rating: 5,
      date: "2024-01-15",
      text: "Produit excellent, livraison rapide. Je recommande vivement !",
      source: "aliexpress",
      product: "Smartphone Case",
      verified: true,
      helpful: 12,
      status: "approved"
    },
    {
      id: "2", 
      author: "Thomas B.",
      rating: 4,
      date: "2024-01-14",
      text: "Bonne qualité mais la couleur est légèrement différente de la photo.",
      source: "amazon",
      product: "Bluetooth Headphones",
      verified: true,
      helpful: 8,
      status: "pending"
    },
    {
      id: "3",
      author: "Sophie M.",
      rating: 5,
      date: "2024-01-13",
      text: "Parfait ! Correspond exactement à mes attentes. Service client au top.",
      source: "google",
      product: "Yoga Mat",
      verified: false,
      helpful: 15,
      status: "approved"
    }
  ];

  const sourceStats = [
    { source: "AliExpress", count: 1247, avgRating: 4.2, color: "bg-orange-500" },
    { source: "Amazon", count: 892, avgRating: 4.5, color: "bg-yellow-500" },
    { source: "Google", count: 567, avgRating: 4.3, color: "bg-blue-500" },
    { source: "Shopify", count: 334, avgRating: 4.6, color: "bg-green-500" }
  ];

  const ratingDistribution = [
    { stars: 5, count: 1840, percentage: 65 },
    { stars: 4, count: 710, percentage: 25 },
    { stars: 3, count: 213, percentage: 7 },
    { stars: 2, count: 57, percentage: 2 },
    { stars: 1, count: 28, percentage: 1 }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'aliexpress': return 'bg-orange-100 text-orange-800';
      case 'amazon': return 'bg-yellow-100 text-yellow-800';
      case 'google': return 'bg-blue-100 text-blue-800';
      case 'shopify': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Avis Clients
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Importez et gérez les avis de vos clients automatiquement
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Widget
            </Button>
            <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
              <Import className="w-4 h-4 mr-2" />
              Importer Avis
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Avis</p>
                  <p className="text-2xl font-bold text-primary">2,848</p>
                </div>
                <MessageSquare className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Note Moyenne</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-secondary">4.4</p>
                    <div className="flex">{renderStars(4)}</div>
                  </div>
                </div>
                <Star className="w-8 h-8 text-secondary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En Attente</p>
                  <p className="text-2xl font-bold text-accent">47</p>
                </div>
                <Shield className="w-8 h-8 text-accent/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vérifiés</p>
                  <p className="text-2xl font-bold text-gradient">89%</p>
                </div>
                <Eye className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border/50">
            <TabsTrigger value="reviews">Tous les Avis</TabsTrigger>
            <TabsTrigger value="import">Importation</TabsTrigger>
            <TabsTrigger value="widget">Widget</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sources</SelectItem>
                  <SelectItem value="aliexpress">AliExpress</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="shopify">Shopify</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Note" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les notes</SelectItem>
                  <SelectItem value="5">5 étoiles</SelectItem>
                  <SelectItem value="4">4 étoiles</SelectItem>
                  <SelectItem value="3">3 étoiles</SelectItem>
                  <SelectItem value="2">2 étoiles</SelectItem>
                  <SelectItem value="1">1 étoile</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>

              <Input 
                placeholder="Rechercher dans les avis..." 
                className="flex-1 min-w-[300px]"
              />
            </div>

            {/* Reviews List */}
            <div className="grid gap-4">
              {reviews.map((review) => (
                <Card key={review.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src="" />
                              <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{review.author}</p>
                                {review.verified && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Vérifié
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex">{renderStars(review.rating)}</div>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(review.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Badge className={getSourceBadgeColor(review.source)}>
                              {review.source.charAt(0).toUpperCase() + review.source.slice(1)}
                            </Badge>
                            <Badge variant={
                              review.status === 'approved' ? 'default' : 
                              review.status === 'pending' ? 'secondary' : 'destructive'
                            }>
                              {review.status === 'approved' ? 'Approuvé' : 
                               review.status === 'pending' ? 'En attente' : 'Rejeté'}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-foreground">{review.text}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Produit: {review.product}</span>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {review.helpful} utiles
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                        <Button variant="outline" size="sm">
                          Approuver
                        </Button>
                        <Button variant="outline" size="sm">
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm">
                          Rejeter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary" />
                    Importation Automatique
                  </CardTitle>
                  <CardDescription>
                    Configurez l'importation depuis vos sources préférées
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sourceStats.map((source) => (
                    <div key={source.source} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${source.color}`} />
                        <div>
                          <p className="font-medium">{source.source}</p>
                          <p className="text-sm text-muted-foreground">
                            {source.count} avis • {source.avgRating}/5
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Configurer
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Import Manuel
                  </CardTitle>
                  <CardDescription>
                    Importez des avis depuis une URL ou un fichier
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">URL du produit</label>
                    <Input placeholder="https://aliexpress.com/item/..." />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Nombre d'avis à importer</label>
                    <Select defaultValue="50">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 avis</SelectItem>
                        <SelectItem value="25">25 avis</SelectItem>
                        <SelectItem value="50">50 avis</SelectItem>
                        <SelectItem value="100">100 avis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="filter-positive" defaultChecked />
                    <label htmlFor="filter-positive" className="text-sm">
                      Filtrer les avis positifs uniquement
                    </label>
                  </div>

                  <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
                    <Download className="w-4 h-4 mr-2" />
                    Importer les Avis
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="widget" className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  Widget d'Avis
                </CardTitle>
                <CardDescription>
                  Intégrez les avis sur votre boutique avec notre widget personnalisable
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Configuration</h3>
                    
                    <div>
                      <label className="text-sm font-medium">Style du widget</label>
                      <Select defaultValue="cards">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cards">Cartes</SelectItem>
                          <SelectItem value="list">Liste</SelectItem>
                          <SelectItem value="carousel">Carrousel</SelectItem>
                          <SelectItem value="stars">Étoiles uniquement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Nombre d'avis à afficher</label>
                      <Select defaultValue="5">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 avis</SelectItem>
                          <SelectItem value="5">5 avis</SelectItem>
                          <SelectItem value="10">10 avis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Couleur principale</label>
                      <Input type="color" defaultValue="#3b82f6" className="w-full h-10" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Aperçu</h3>
                    <div className="border border-border rounded-lg p-4 bg-background">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(5)}</div>
                          <span className="text-sm text-muted-foreground">4.4/5 (2,848 avis)</span>
                        </div>
                        <div className="space-y-2">
                          {reviews.slice(0, 2).map((review) => (
                            <div key={review.id} className="text-sm p-2 bg-muted rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex">{renderStars(review.rating)}</div>
                                <span className="font-medium">{review.author}</span>
                              </div>
                              <p className="text-muted-foreground">{review.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Code d'intégration</label>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    {`<script src="https://shopopti.com/widget.js"></script>
<div id="shopopti-reviews" data-shop="your-shop-id"></div>`}
                  </div>
                  <Button variant="outline" size="sm">
                    Copier le code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Distribution des Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ratingDistribution.map((rating) => (
                    <div key={rating.stars} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm">{rating.stars}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <Progress value={rating.percentage} className="flex-1" />
                      <span className="text-sm text-muted-foreground w-16">
                        {rating.count}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Avis par Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                    Graphique des sources (à implémenter)
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Évolution des Avis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                  Graphique temporel (à implémenter)
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </AppLayout>
  );
};

export default Reviews;