import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  Sparkles,
  BookOpen,
  Calendar,
  User,
  Eye,
  ThumbsUp,
  MessageSquare,
  Search,
  TrendingUp,
  Star,
  ArrowRight,
  Clock,
  Filter,
  Tag
} from "lucide-react";

const BlogNew = () => {
  const categories = [
    { name: "Tous", count: 156 },
    { name: "Dropshipping", count: 45 },
    { name: "E-commerce", count: 38 },
    { name: "Marketing", count: 32 },
    { name: "IA & Tech", count: 25 },
    { name: "Études de Cas", count: 16 }
  ];

  const featuredPost = {
    id: 1,
    title: "Comment j'ai automatisé mon dropshipping avec l'IA et généré 100k€ en 3 mois",
    excerpt: "Découvrez la stratégie exacte que j'ai utilisée pour passer de 0 à 100,000€ de chiffre d'affaires en seulement 3 mois grâce à l'intelligence artificielle de ShopOpti.",
    author: "Marie Laurent",
    authorRole: "CTO ShopOpti",
    date: "15 décembre 2024",
    readTime: "12 min",
    category: "Études de Cas",
    views: 15420,
    likes: 324,
    comments: 87,
    image: "/blog/featured-ai-automation.jpg",
    featured: true
  };

  const blogPosts = [
    {
      id: 2,
      title: "Les 10 erreurs fatales du dropshipping en 2024 (et comment les éviter)",
      excerpt: "Évitez ces pièges courants qui coûtent des milliers d'euros aux débutants chaque année.",
      author: "Alexandre Dubois",
      authorRole: "CEO ShopOpti",
      date: "12 décembre 2024",
      readTime: "8 min",
      category: "Dropshipping",
      views: 8950,
      likes: 156,
      comments: 43,
      image: "/blog/dropshipping-errors.jpg"
    },
    {
      id: 3,
      title: "Facebook Ads vs Google Ads : Quel canal choisir pour vos produits ?",
      excerpt: "Analyse comparative détaillée des deux géants de la publicité en ligne pour le e-commerce.",
      author: "Sophie Chen",
      authorRole: "Head of Marketing",
      date: "10 décembre 2024",
      readTime: "15 min",
      category: "Marketing",
      views: 12340,
      likes: 289,
      comments: 67,
      image: "/blog/facebook-vs-google.jpg"
    },
    {
      id: 4,
      title: "L'IA va-t-elle remplacer les dropshippers ? Notre analyse pour 2025",
      excerpt: "Une analyse approfondie de l'impact de l'intelligence artificielle sur l'avenir du dropshipping.",
      author: "Thomas Martin",
      authorRole: "VP Product",
      date: "8 décembre 2024",
      readTime: "10 min",
      category: "IA & Tech",
      views: 9876,
      likes: 234,
      comments: 56,
      image: "/blog/ai-future.jpg"
    },
    {
      id: 5,
      title: "Guide complet : Créer une boutique Shopify rentable en 2024",
      excerpt: "Tous les secrets pour lancer une boutique Shopify qui génère des profits dès le premier mois.",
      author: "Camille Rousseau",
      authorRole: "E-commerce Expert",
      date: "5 décembre 2024",
      readTime: "20 min",
      category: "E-commerce",
      views: 18500,
      likes: 445,
      comments: 129,
      image: "/blog/shopify-guide.jpg"
    },
    {
      id: 6,
      title: "5 niches dropshipping ultra-rentables découvertes par notre IA",
      excerpt: "Nos algorithmes ont identifié ces 5 niches avec un potentiel de profit exceptionnel pour 2024.",
      author: "Marie Laurent",
      authorRole: "CTO ShopOpti",
      date: "3 décembre 2024",
      readTime: "6 min",
      category: "Dropshipping",
      views: 22100,
      likes: 567,
      comments: 198,
      image: "/blog/profitable-niches.jpg"
    },
    {
      id: 7,
      title: "Conversion Rate Optimization : +300% de ventes avec ces techniques",
      excerpt: "Les techniques avancées de CRO qui ont permis à nos clients de tripler leurs ventes.",
      author: "Julien Bernard",
      authorRole: "Growth Hacker",
      date: "1er décembre 2024",
      readTime: "14 min",
      category: "Marketing",
      views: 14230,
      likes: 378,
      comments: 92,
      image: "/blog/cro-techniques.jpg"
    },
    {
      id: 8,
      title: "Étude de cas : Comment Lisa a quitté son job grâce au dropshipping",
      excerpt: "L'histoire inspirante de Lisa qui a démissionné après 6 mois de dropshipping à 15k€/mois.",
      author: "Lisa Moreau",
      authorRole: "Success Story",
      date: "28 novembre 2024",
      readTime: "11 min",
      category: "Études de Cas",
      views: 16780,
      likes: 456,
      comments: 134,
      image: "/blog/lisa-success.jpg"
    },
    {
      id: 9,
      title: "Intelligence artificielle : Comment elle révolutionne le e-commerce",
      excerpt: "Découvrez comment l'IA transforme radicalement le paysage du commerce électronique.",
      author: "Sophie Chen",
      authorRole: "Head of AI",
      date: "25 novembre 2024",
      readTime: "13 min",
      category: "IA & Tech",
      views: 11450,
      likes: 267,
      comments: 78,
      image: "/blog/ai-revolution.jpg"
    }
  ];

  const trendingTopics = [
    "Dropshipping 2024",
    "IA E-commerce", 
    "Facebook Ads",
    "Shopify Tips",
    "Produits Gagnants",
    "CRO",
    "TikTok Marketing",
    "Instagram Shopping"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5" />
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ShopOpti
              </span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-primary hover:bg-primary-hover">
                  Commencer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <BookOpen className="w-4 h-4 mr-2" />
            Blog ShopOpti
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Maîtrisez l'
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              e-commerce
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Guides experts, stratégies avancées et études de cas pour transformer 
            votre dropshipping en machine à profits.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Rechercher un article, une stratégie, un sujet..."
              className="pl-12 py-6 text-lg"
            />
            <Button className="absolute right-2 top-1/2 transform -translate-y-1/2">
              Rechercher
            </Button>
          </div>
        </div>
      </section>

      {/* Trending Topics */}
      <section className="py-8 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-medium">Sujets tendance :</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {trendingTopics.map((topic, index) => (
              <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                <Tag className="w-3 h-3 mr-1" />
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category, index) => (
              <Button 
                key={index}
                variant={index === 0 ? "default" : "outline"}
                className="flex items-center space-x-2"
              >
                <span>{category.name}</span>
                <Badge variant="secondary" className="ml-2">{category.count}</Badge>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Article Vedette</h2>
            <p className="text-muted-foreground">Notre contenu le plus populaire cette semaine</p>
          </div>

          <Card className="max-w-6xl mx-auto overflow-hidden shadow-glow border-primary/20">
            <div className="grid lg:grid-cols-2">
              <div className="relative bg-gradient-primary/10">
                <div className="absolute inset-0 bg-gradient-primary/20" />
                <div className="absolute top-6 left-6">
                  <Badge className="bg-primary">
                    <Star className="w-3 h-3 mr-1" />
                    Article Vedette
                  </Badge>
                </div>
              </div>
              
              <div className="p-8 lg:p-12">
                <Badge className="mb-4">{featuredPost.category}</Badge>
                <h3 className="text-2xl lg:text-3xl font-bold mb-4 leading-tight">
                  {featuredPost.title}
                </h3>
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                      {featuredPost.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{featuredPost.author}</div>
                      <div className="text-xs text-muted-foreground">{featuredPost.authorRole}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{featuredPost.date}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{featuredPost.readTime}</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{featuredPost.views.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{featuredPost.likes}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{featuredPost.comments}</span>
                    </span>
                  </div>
                </div>
                
                <Button className="w-full lg:w-auto">
                  Lire l'Article Complet
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Derniers{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                articles
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Restez à jour avec nos dernières stratégies et analyses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.id} className="group hover:shadow-glow transition-all duration-300 cursor-pointer overflow-hidden">
                <div className="relative h-48 bg-gradient-primary/10">
                  <div className="absolute inset-0 bg-gradient-primary/20" />
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary">{post.category}</Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {post.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{post.author}</div>
                      <div className="text-xs text-muted-foreground">{post.authorRole}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{post.date}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.readTime}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{post.views.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{post.likes}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{post.comments}</span>
                      </span>
                    </div>
                  </div>
                  
                  <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Lire l'Article
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              <Filter className="w-5 h-5 mr-2" />
              Charger Plus d'Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-12">
              <BookOpen className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">
                Ne ratez aucun{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  conseil expert
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Recevez nos derniers articles, stratégies exclusives et études de cas 
                directement dans votre boîte mail.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input placeholder="votre@email.com" className="flex-1" />
                <Button className="bg-gradient-primary hover:bg-primary-hover">
                  S'abonner
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">
                Plus de 25,000 entrepreneurs nous font confiance. Désinscription en 1 clic.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default BlogNew;