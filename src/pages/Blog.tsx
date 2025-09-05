import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Calendar, 
  Clock,
  TrendingUp,
  Brain,
  Zap,
  ArrowRight
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";

const Blog = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const articles = [
    {
      id: 1,
      title: "L'IA révolutionne le Dropshipping : Guide complet 2024",
      excerpt: "Découvrez comment l'intelligence artificielle transforme complètement le monde du dropshipping et comment en tirer profit dès maintenant.",
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop",
      author: "Adil Charkaoui",
      publishedAt: "2024-12-15",
      readTime: "8 min",
      category: "IA"
    },
    {
      id: 2,
      title: "10 Produits Gagnants pour Dropshipping en 2024",
      excerpt: "Analyse des tendances de consommation et identification des niches les plus prometteuses pour cette année.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop",
      author: "Marie Dubois",
      publishedAt: "2024-12-10",
      readTime: "6 min",
      category: "Dropshipping"
    }
  ];

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SEO
        title="Blog E-commerce & IA | Shopopti Pro - Guides et Actualités Dropshipping"
        description="Découvrez nos guides experts sur le dropshipping, l'IA en e-commerce, les stratégies marketing et les dernières tendances."
        path="/blog"
        keywords="blog dropshipping, guides e-commerce, IA marketing, tendances dropshipping"
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
          
          <div className="relative max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Brain className="w-4 h-4 mr-2" />
              Blog Expert
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Guides & <span className="text-primary">Actualités</span> E-commerce
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Découvrez les dernières stratégies, tendances et innovations pour réussir 
              votre business e-commerce et dropshipping avec l'IA.
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative mb-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
              />
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="overflow-hidden border-border bg-card shadow-card hover:shadow-intense transition-all duration-300 cursor-pointer group">
                  <div className="relative">
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge 
                      variant="secondary" 
                      className="absolute top-3 right-3 text-xs bg-background/90 backdrop-blur-sm"
                    >
                      {article.category}
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed mb-4 line-clamp-3">
                      {article.excerpt}
                    </CardDescription>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{article.author}</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>{article.readTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-primary/10 via-background to-accent/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Restez à la <span className="text-primary">pointe</span> de l'innovation
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Rejoignez +5000 entrepreneurs qui nous font confiance.
            </p>
            
            <Button 
              size="lg" 
              onClick={() => navigate("/")}
              className="bg-gradient-primary text-lg px-8 py-6 h-auto"
            >
              <Zap className="mr-2 h-5 w-5" />
              Commencer Gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Blog;