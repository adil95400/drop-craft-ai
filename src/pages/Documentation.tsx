import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Book, Search, FileText, Code, Lightbulb, Video, ArrowRight, ExternalLink } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { PublicLayout } from "@/layouts/PublicLayout";

const Documentation = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const docCategories = [
    {
      icon: Book,
      title: "Guide de démarrage",
      description: "Apprenez les bases pour commencer avec ShopOpti+",
      articles: [
        "Installation et configuration",
        "Première connexion",
        "Créer votre première boutique",
        "Importer vos premiers produits"
      ],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: FileText,
      title: "Guides d'utilisation",
      description: "Documentation détaillée de toutes les fonctionnalités",
      articles: [
        "Gestion des produits",
        "Traitement des commandes",
        "Synchronisation multi-plateformes",
        "Configuration des intégrations"
      ],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Code,
      title: "API & Développeurs",
      description: "Documentation technique pour les développeurs",
      articles: [
        "Référence API",
        "Webhooks",
        "Authentification",
        "Exemples de code"
      ],
      color: "from-green-500 to-emerald-500",
      link: "/api-documentation"
    },
    {
      icon: Lightbulb,
      title: "Bonnes pratiques",
      description: "Conseils et astuces pour optimiser votre utilisation",
      articles: [
        "Optimisation SEO",
        "Stratégies de pricing",
        "Gestion des stocks",
        "Service client"
      ],
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Video,
      title: "Tutoriels vidéo",
      description: "Apprenez visuellement avec nos vidéos",
      articles: [
        "Import de produits en masse",
        "Configuration des automatisations",
        "Analytics et reporting",
        "Gestion multi-boutiques"
      ],
      color: "from-red-500 to-rose-500"
    }
  ];

  return (
    <PublicLayout>
      <Helmet>
        <title>Documentation | ShopOpti+ - Centre d'aide et guides</title>
        <meta name="description" content="Consultez la documentation complète de ShopOpti+ : guides, tutoriels, API, bonnes pratiques et plus encore." />
      </Helmet>
          {/* Hero Section with Search */}
          <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="text-center space-y-6 max-w-3xl mx-auto">
                <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                  Documentation
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold">
                  Centre d'aide
                  <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    ShopOpti+
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Trouvez rapidement les réponses à toutes vos questions
                </p>
                <div className="relative max-w-2xl mx-auto pt-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher dans la documentation..."
                    className="pl-12 py-6 text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Documentation Categories */}
          <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docCategories.map((category, index) => {
                  const IconComponent = category.icon;
                  return (
                    <Card 
                      key={index} 
                      className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl cursor-pointer"
                      onClick={() => category.link ? navigate(category.link) : null}
                    >
                      <CardHeader>
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${category.color} w-fit mb-4`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-xl flex items-center justify-between">
                          {category.title}
                          {category.link && <ExternalLink className="h-4 w-4" />}
                        </CardTitle>
                        <CardDescription className="text-base">{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {category.articles.map((article, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                              <ArrowRight className="h-3 w-3 flex-shrink-0" />
                              <span>{article}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Quick Links */}
          <section className="py-20 bg-secondary/30">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Liens utiles</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Support</CardTitle>
                    <CardDescription>Contactez notre équipe d'assistance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/support')}>
                      Accéder au support
                    </Button>
                  </CardContent>
                </Card>
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>API Documentation</CardTitle>
                    <CardDescription>Documentation technique complète</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/api-documentation')}>
                      Voir l'API
                    </Button>
                  </CardContent>
                </Card>
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Blog</CardTitle>
                    <CardDescription>Actualités et conseils</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/blog')}>
                      Lire le blog
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
    </PublicLayout>
  );
};

export default Documentation;
