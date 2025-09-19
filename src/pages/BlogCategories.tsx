import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Lightbulb, 
  Users, 
  ShoppingCart,
  ArrowRight,
  BookOpen
} from 'lucide-react';

const categories = [
  {
    id: 'strategies',
    name: 'Stratégies',
    description: 'Découvrez les meilleures stratégies pour développer votre business',
    icon: Target,
    color: 'bg-blue-500',
    postCount: 45,
    trending: true,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop'
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Techniques avancées de marketing digital et publicité',
    icon: TrendingUp,
    color: 'bg-green-500',
    postCount: 67,
    trending: true,
    image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=250&fit=crop'
  },
  {
    id: 'analyse',
    name: 'Analyse',
    description: 'Outils et méthodes d\'analyse de marché et de concurrence',
    icon: BarChart3,
    color: 'bg-purple-500',
    postCount: 34,
    trending: false,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop'
  },
  {
    id: 'conseils',
    name: 'Conseils',
    description: 'Conseils pratiques et bonnes pratiques pour réussir',
    icon: Lightbulb,
    color: 'bg-yellow-500',
    postCount: 28,
    trending: false,
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop'
  },
  {
    id: 'fournisseurs',
    name: 'Fournisseurs',
    description: 'Guide pour trouver et gérer vos fournisseurs efficacement',
    icon: Users,
    color: 'bg-orange-500',
    postCount: 23,
    trending: false,
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=250&fit=crop'
  },
  {
    id: 'produits',
    name: 'Produits',
    description: 'Recherche, sélection et optimisation de vos produits',
    icon: ShoppingCart,
    color: 'bg-red-500',
    postCount: 56,
    trending: true,
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=250&fit=crop'
  }
];

export function BlogCategories() {
  const trendingCategories = categories.filter(cat => cat.trending);
  const allCategories = categories;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Catégories du Blog</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Explorez nos articles classés par thématique pour approfondir vos connaissances
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Trending Categories */}
        {trendingCategories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Catégories Tendances</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {trendingCategories.map(category => (
                <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 bg-gradient-to-br from-card to-card/50">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                    <div className={`absolute top-3 left-3 w-8 h-8 rounded-full ${category.color} flex items-center justify-center`}>
                      <category.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {category.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">
                        {category.postCount} articles
                      </span>
                    </div>
                    
                    <Link to={`/blog/category/${category.id}`}>
                      <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Explorer
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* All Categories */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Toutes les Catégories</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCategories.map(category => (
              <Card key={category.id} className="group hover:shadow-md transition-all duration-300 cursor-pointer">
                <Link to={`/blog/category/${category.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                        <category.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="group-hover:text-primary transition-colors text-lg">
                          {category.name}
                        </CardTitle>
                        {category.trending && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Trending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <CardDescription className="text-sm mb-3">
                      {category.description}
                    </CardDescription>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{category.postCount} articles</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-0">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Vous ne trouvez pas ce que vous cherchez ?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Utilisez notre recherche avancée pour trouver des articles spécifiques ou consultez tous nos articles.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/blog">
                  <Button size="lg" className="min-w-40">
                    Tous les articles
                  </Button>
                </Link>
                <Link to="/blog?search=true">
                  <Button variant="outline" size="lg" className="min-w-40">
                    Recherche avancée
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}