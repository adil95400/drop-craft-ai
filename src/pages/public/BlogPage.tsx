import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Calendar, Clock, User, ArrowRight, Search, Tag, TrendingUp, BookOpen } from "lucide-react";
import { useState } from "react";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import { Link } from "react-router-dom";

const blogPosts = [
  {
    id: "1",
    title: "10 Stratégies pour Augmenter vos Ventes en Dropshipping en 2024",
    excerpt: "Découvrez les meilleures pratiques pour optimiser votre boutique et maximiser vos conversions cette année.",
    category: "Stratégie",
    author: "Sophie Martin",
    date: "2024-12-05",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop",
    featured: true,
    tags: ["dropshipping", "e-commerce", "stratégie", "ventes"]
  },
  {
    id: "2",
    title: "Guide Complet : Optimiser vos Fiches Produits avec l'IA",
    excerpt: "L'intelligence artificielle révolutionne la création de contenu. Apprenez à l'utiliser efficacement.",
    category: "IA & Automatisation",
    author: "Marc Dupont",
    date: "2024-12-03",
    readTime: "12 min",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop",
    featured: true,
    tags: ["IA", "optimisation", "produits", "SEO"]
  },
  {
    id: "3",
    title: "Comment Choisir les Meilleurs Fournisseurs pour votre Business",
    excerpt: "Critères essentiels et méthodes pour sélectionner des fournisseurs fiables et rentables.",
    category: "Fournisseurs",
    author: "Julie Chen",
    date: "2024-12-01",
    readTime: "10 min",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop",
    featured: false,
    tags: ["fournisseurs", "sourcing", "qualité"]
  },
  {
    id: "4",
    title: "Multi-Marketplace : Vendre sur Amazon, eBay et Etsy Simultanément",
    excerpt: "Stratégies pour gérer efficacement plusieurs canaux de vente depuis une seule plateforme.",
    category: "Marketplaces",
    author: "Pierre Lambert",
    date: "2024-11-28",
    readTime: "15 min",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop",
    featured: false,
    tags: ["marketplace", "Amazon", "eBay", "Etsy"]
  },
  {
    id: "5",
    title: "SEO E-commerce : Techniques Avancées pour 2024",
    excerpt: "Boostez votre visibilité Google avec ces techniques SEO spécialement adaptées au e-commerce.",
    category: "SEO",
    author: "Emma Wilson",
    date: "2024-11-25",
    readTime: "11 min",
    image: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&auto=format&fit=crop",
    featured: false,
    tags: ["SEO", "Google", "référencement", "trafic"]
  },
  {
    id: "6",
    title: "Automatiser vos Campagnes Marketing avec ShopOpti+",
    excerpt: "Configurez des campagnes email et publicités automatisées pour gagner du temps et augmenter vos revenus.",
    category: "Marketing",
    author: "Thomas Bernard",
    date: "2024-11-22",
    readTime: "9 min",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    featured: false,
    tags: ["marketing", "automatisation", "email", "publicité"]
  }
];

const categories = [
  { name: "Tous", count: 24 },
  { name: "Stratégie", count: 8 },
  { name: "IA & Automatisation", count: 6 },
  { name: "SEO", count: 5 },
  { name: "Fournisseurs", count: 3 },
  { name: "Marketing", count: 2 }
];

const BlogPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog ShopOpti+",
    "description": "Conseils, guides et actualités sur le dropshipping, l'e-commerce et l'automatisation avec l'IA",
    "url": "https://shopopti.io/blog",
    "publisher": {
      "@type": "Organization",
      "name": "ShopOpti+",
      "logo": {
        "@type": "ImageObject",
        "url": "https://shopopti.io/logo.png"
      }
    },
    "blogPost": blogPosts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "author": {
        "@type": "Person",
        "name": post.author
      },
      "datePublished": post.date,
      "image": post.image
    }))
  };

  return (
    <PublicLayout>
      <Helmet>
        <title>Blog E-commerce & Dropshipping | ShopOpti+ - Guides et Conseils</title>
        <meta name="description" content="Découvrez nos guides, conseils et actualités sur le dropshipping, l'e-commerce et l'automatisation avec l'IA. Stratégies pour développer votre business en ligne." />
        <meta name="keywords" content="blog dropshipping, conseils e-commerce, guide IA, stratégie vente en ligne, optimisation boutique" />
        <link rel="canonical" href="https://shopopti.io/blog" />
        
        <meta property="og:title" content="Blog E-commerce & Dropshipping | ShopOpti+" />
        <meta property="og:description" content="Guides, conseils et actualités sur le dropshipping et l'e-commerce avec IA." />
        <meta property="og:type" content="blog" />
        <meta property="og:url" content="https://shopopti.io/blog" />
        
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Blog", url: "https://shopopti.io/blog" },
      ]} />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <BookOpen className="h-4 w-4 mr-2" />
              Blog & Ressources
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Développez votre expertise
              <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                E-commerce & Dropshipping
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Guides pratiques, stratégies éprouvées et dernières tendances pour réussir dans le e-commerce.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto pt-4">
              <Search className="absolute left-4 top-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un article..."
                className="pl-12 h-12 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Rechercher dans le blog"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b bg-background/50 sticky top-16 z-40 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Button
                key={cat.name}
                variant={selectedCategory === cat.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.name)}
                className="whitespace-nowrap"
              >
                {cat.name}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {cat.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {selectedCategory === "Tous" && !searchQuery && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Articles à la Une</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.readTime}
                      </span>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{post.author}</span>
                      <span>•</span>
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(post.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <Link to={`/blog/${post.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}>
                      <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                        Lire <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Articles */}
      <section className="py-12 md:py-16 bg-secondary/20">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold mb-8">
            {searchQuery ? `Résultats pour "${searchQuery}"` : selectedCategory === "Tous" ? "Tous les articles" : selectedCategory}
          </h2>
          
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Aucun article trouvé.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); setSelectedCategory("Tous"); }}>
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground">{post.readTime}</span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{post.author}</span>
                      <span>•</span>
                      <span>{new Date(post.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Charger plus d'articles
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Restez informé des dernières tendances
            </h2>
            <p className="text-lg text-muted-foreground">
              Recevez nos meilleurs conseils e-commerce directement dans votre boîte mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="Votre email" 
                className="h-12"
                aria-label="Email pour la newsletter"
              />
              <Button size="lg" className="h-12">
                S'inscrire
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pas de spam. Désabonnement en un clic.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default BlogPage;
