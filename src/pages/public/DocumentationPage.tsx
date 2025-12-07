import { useState } from "react";
import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Book,
  Search,
  Rocket,
  Settings,
  Code,
  ShoppingCart,
  Package,
  CreditCard,
  Users,
  BarChart3,
  Globe,
  Zap,
  ArrowRight,
  ExternalLink,
  FileText,
  Video,
  HelpCircle
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const DocumentationPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const quickStartGuides = [
    {
      icon: Rocket,
      title: "Démarrage rapide",
      description: "Créez votre première boutique en 5 minutes",
      link: "/documentation/quickstart",
      time: "5 min"
    },
    {
      icon: Package,
      title: "Importer des produits",
      description: "Connectez vos fournisseurs et importez automatiquement",
      link: "/documentation/import",
      time: "10 min"
    },
    {
      icon: ShoppingCart,
      title: "Configurer votre boutique",
      description: "Personnalisez et publiez votre catalogue",
      link: "/documentation/setup",
      time: "15 min"
    },
    {
      icon: BarChart3,
      title: "Analyser vos performances",
      description: "Maîtrisez les tableaux de bord analytics",
      link: "/documentation/analytics",
      time: "8 min"
    }
  ];

  const categories = [
    {
      title: "Catalogue Produits",
      icon: Package,
      articles: [
        { title: "Importer depuis AliExpress", slug: "aliexpress-import" },
        { title: "Optimisation IA des fiches", slug: "ai-optimization" },
        { title: "Gestion des variantes", slug: "variants" },
        { title: "Bulk editing", slug: "bulk-edit" }
      ]
    },
    {
      title: "Fournisseurs",
      icon: Users,
      articles: [
        { title: "Connecter un fournisseur", slug: "connect-supplier" },
        { title: "Synchronisation automatique", slug: "auto-sync" },
        { title: "Gestion multi-fournisseurs", slug: "multi-supplier" },
        { title: "Résoudre les conflits", slug: "conflicts" }
      ]
    },
    {
      title: "Boutiques & Canaux",
      icon: Globe,
      articles: [
        { title: "Connexion Shopify", slug: "shopify" },
        { title: "Connexion WooCommerce", slug: "woocommerce" },
        { title: "Publication Amazon", slug: "amazon" },
        { title: "Multi-canal avancé", slug: "multichannel" }
      ]
    },
    {
      title: "Commandes",
      icon: ShoppingCart,
      articles: [
        { title: "Traitement automatique", slug: "auto-fulfillment" },
        { title: "Suivi des expéditions", slug: "tracking" },
        { title: "Gestion des retours", slug: "returns" },
        { title: "Notifications clients", slug: "notifications" }
      ]
    },
    {
      title: "Analytics & IA",
      icon: BarChart3,
      articles: [
        { title: "Dashboard analytics", slug: "dashboard" },
        { title: "Prévisions de ventes", slug: "forecasting" },
        { title: "Recommandations IA", slug: "ai-recommendations" },
        { title: "Rapports personnalisés", slug: "custom-reports" }
      ]
    },
    {
      title: "Facturation",
      icon: CreditCard,
      articles: [
        { title: "Plans et tarifs", slug: "pricing" },
        { title: "Gérer son abonnement", slug: "subscription" },
        { title: "Factures et paiements", slug: "invoices" },
        { title: "Crédits et usage", slug: "credits" }
      ]
    }
  ];

  const apiDocs = [
    { title: "Introduction à l'API", description: "Authentification et endpoints de base" },
    { title: "Products API", description: "CRUD produits, variantes, images" },
    { title: "Orders API", description: "Gestion des commandes et fulfillment" },
    { title: "Webhooks", description: "Events et notifications temps réel" }
  ];

  const videoTutorials = [
    { title: "Tour complet de la plateforme", duration: "12:34", views: "15K" },
    { title: "Importer 1000 produits en 10 min", duration: "10:15", views: "8.2K" },
    { title: "Automatiser le fulfillment", duration: "18:42", views: "5.7K" },
    { title: "Optimiser avec l'IA", duration: "14:28", views: "12K" }
  ];

  return (
    <PublicLayout>
      <SEO
        title="Documentation ShopOpti+ | Guides, Tutoriels et API Reference"
        description="Documentation complète de ShopOpti+. Guides de démarrage rapide, tutoriels vidéo, référence API et ressources pour maîtriser la plateforme e-commerce IA."
        path="/documentation"
        keywords="documentation ShopOpti, tutoriel e-commerce, API dropshipping, guide utilisateur, aide ShopOpti"
      />

      <div className="bg-background min-h-screen">
        {/* Hero Section */}
        <section className="relative py-16 px-6 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Book className="w-4 h-4 mr-2" />
              Documentation
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Centre d'<span className="text-primary">aide</span> ShopOpti+
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour maîtriser la plateforme et développer votre business
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans la documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Démarrage rapide</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStartGuides.map((guide, index) => (
                <Card key={index} className="hover:shadow-lg transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <guide.icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="outline">{guide.time}</Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {guide.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{guide.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content Tabs */}
        <section className="py-12 px-6 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="guides" className="space-y-8">
              <TabsList className="grid grid-cols-4 w-full max-w-lg mx-auto">
                <TabsTrigger value="guides">
                  <FileText className="h-4 w-4 mr-2" />
                  Guides
                </TabsTrigger>
                <TabsTrigger value="api">
                  <Code className="h-4 w-4 mr-2" />
                  API
                </TabsTrigger>
                <TabsTrigger value="videos">
                  <Video className="h-4 w-4 mr-2" />
                  Vidéos
                </TabsTrigger>
                <TabsTrigger value="faq">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  FAQ
                </TabsTrigger>
              </TabsList>

              {/* Guides Tab */}
              <TabsContent value="guides" className="space-y-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((category, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all">
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <category.icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{category.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {category.articles.map((article, idx) => (
                            <li key={idx}>
                              <Link 
                                to={`/documentation/${article.slug}`}
                                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                              >
                                <ArrowRight className="h-3 w-3" />
                                {article.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* API Tab */}
              <TabsContent value="api" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      API Reference
                    </CardTitle>
                    <CardDescription>
                      Documentation technique complète pour intégrer ShopOpti+ à vos systèmes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {apiDocs.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <h4 className="font-medium">{doc.title}</h4>
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      </div>
                    ))}
                    <div className="pt-4">
                      <Button className="w-full" onClick={() => navigate("/api-docs")}>
                        Accéder à la documentation API complète
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Videos Tab */}
              <TabsContent value="videos" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {videoTutorials.map((video, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all cursor-pointer">
                      <CardContent className="p-0">
                        <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                          <Video className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium mb-2">{video.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{video.duration}</span>
                            <span>{video.views} vues</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="text-center">
                  <Button variant="outline" onClick={() => navigate("/academy")}>
                    Voir tous les tutoriels
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>

              {/* FAQ Tab */}
              <TabsContent value="faq" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Questions fréquentes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { q: "Comment connecter ma boutique Shopify ?", a: "Allez dans Boutiques & Canaux, cliquez sur Shopify et suivez le wizard de connexion OAuth." },
                      { q: "Combien de produits puis-je importer ?", a: "Illimité sur les plans Pro et Business. Le plan Starter permet jusqu'à 500 produits." },
                      { q: "L'IA est-elle incluse dans tous les plans ?", a: "Oui, tous les plans incluent des crédits IA mensuels. Les plans supérieurs offrent plus de crédits." },
                      { q: "Comment fonctionne le fulfillment automatique ?", a: "Configurez vos fournisseurs, activez l'auto-fulfillment et les commandes sont transmises automatiquement." }
                    ].map((faq, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">{faq.q}</h4>
                        <p className="text-sm text-muted-foreground">{faq.a}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <div className="text-center">
                  <Button onClick={() => navigate("/faq")}>
                    Voir toutes les FAQ
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Besoin d'aide supplémentaire ?
            </h2>
            <p className="text-muted-foreground mb-8">
              Notre équipe support est disponible 24/7 pour vous accompagner
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/contact")}>
                <Zap className="mr-2 h-5 w-5" />
                Contacter le support
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/academy")}>
                Accéder à l'Academy
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default DocumentationPage;
