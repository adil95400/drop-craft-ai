import { useState } from "react";
import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Book, Search, Rocket, Settings, Code, ShoppingCart, Package, CreditCard,
  Users, BarChart3, Globe, Zap, ArrowRight, ExternalLink, FileText, Video,
  HelpCircle, Shield, Bot, Truck, Palette, PlugZap, Bell, Layers,
  TrendingUp, Target, Mail, RefreshCw, CheckCircle2, Star
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

const DocumentationPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const quickStartGuides = [
    { icon: Rocket, title: "Démarrage rapide", description: "Créez votre première boutique en 5 minutes", link: "/guides/getting-started", time: "5 min", color: "text-blue-500" },
    { icon: Package, title: "Importer des produits", description: "Connectez vos fournisseurs et importez automatiquement", link: "/import", time: "10 min", color: "text-green-500" },
    { icon: ShoppingCart, title: "Configurer votre boutique", description: "Personnalisez et publiez votre catalogue", link: "/products", time: "15 min", color: "text-purple-500" },
    { icon: BarChart3, title: "Analyser vos performances", description: "Maîtrisez les tableaux de bord analytics", link: "/analytics", time: "8 min", color: "text-orange-500" },
  ];

  const categories = [
    {
      title: "Catalogue Produits", icon: Package, color: "bg-blue-500/10 text-blue-600",
      articles: [
        { title: "Importer depuis AliExpress", link: "/import" },
        { title: "Optimisation IA des fiches produits", link: "/ai/optimizer" },
        { title: "Gestion des variantes et options", link: "/products" },
        { title: "Édition groupée (Bulk Edit)", link: "/products" },
        { title: "Catégories et collections", link: "/catalog/categories" },
        { title: "Gestion du stock", link: "/stock" },
      ]
    },
    {
      title: "Fournisseurs & Sourcing", icon: Users, color: "bg-green-500/10 text-green-600",
      articles: [
        { title: "Connecter un fournisseur", link: "/suppliers" },
        { title: "Synchronisation automatique", link: "/sync-manager" },
        { title: "Gestion multi-fournisseurs", link: "/suppliers" },
        { title: "Import CJ Dropshipping", link: "/import" },
        { title: "Import BigBuy", link: "/import" },
        { title: "Résoudre les conflits de stock", link: "/stock" },
      ]
    },
    {
      title: "Boutiques & Canaux", icon: Globe, color: "bg-purple-500/10 text-purple-600",
      articles: [
        { title: "Connexion Shopify", link: "/stores-channels/shopify" },
        { title: "Connexion WooCommerce", link: "/stores-channels/woocommerce" },
        { title: "Publication sur Amazon", link: "/stores-channels/amazon" },
        { title: "Publication sur eBay", link: "/stores-channels/ebay" },
        { title: "Multi-canal avancé", link: "/channels" },
        { title: "Feeds produits XML/CSV", link: "/feeds" },
      ]
    },
    {
      title: "Commandes & Expéditions", icon: Truck, color: "bg-orange-500/10 text-orange-600",
      articles: [
        { title: "Traitement automatique (fulfillment)", link: "/orders/fulfillment" },
        { title: "Suivi des expéditions", link: "/orders/tracking" },
        { title: "Gestion des retours", link: "/orders/returns" },
        { title: "Commandes groupées", link: "/orders/bulk" },
        { title: "Impression d'étiquettes", link: "/orders" },
        { title: "Notifications clients", link: "/notifications" },
      ]
    },
    {
      title: "Marketing & Ventes", icon: Target, color: "bg-red-500/10 text-red-600",
      articles: [
        { title: "Campagnes email automatisées", link: "/marketing/email" },
        { title: "Publicité Facebook & Instagram", link: "/marketing/ads" },
        { title: "Coupons et promotions", link: "/coupons" },
        { title: "CRM et segmentation", link: "/crm" },
        { title: "A/B Testing", link: "/ab-testing" },
        { title: "SEO et contenu", link: "/seo/content-hub" },
      ]
    },
    {
      title: "Analytics & IA", icon: Bot, color: "bg-cyan-500/10 text-cyan-600",
      articles: [
        { title: "Dashboard analytics", link: "/analytics" },
        { title: "Prévisions de ventes IA", link: "/intelligence" },
        { title: "Recommandations IA", link: "/ai-recommendations" },
        { title: "Repricing dynamique", link: "/pricing-manager/repricing" },
        { title: "Rapports personnalisés", link: "/reports" },
        { title: "Alertes intelligentes", link: "/alerts" },
      ]
    },
    {
      title: "Automatisation", icon: RefreshCw, color: "bg-indigo-500/10 text-indigo-600",
      articles: [
        { title: "Workflows automatisés", link: "/automation/workflows" },
        { title: "Règles de traitement", link: "/automation/rules" },
        { title: "Auto-fulfillment", link: "/automation/fulfillment" },
        { title: "Triggers et actions", link: "/automation/triggers" },
        { title: "Planification de tâches", link: "/automation/scheduler" },
        { title: "Webhooks", link: "/api-docs" },
      ]
    },
    {
      title: "Facturation & Plans", icon: CreditCard, color: "bg-yellow-500/10 text-yellow-600",
      articles: [
        { title: "Plans et tarifs", link: "/pricing" },
        { title: "Gérer son abonnement", link: "/subscription" },
        { title: "Factures et paiements", link: "/billing" },
        { title: "Crédits IA", link: "/subscription" },
        { title: "Essai gratuit", link: "/trial" },
        { title: "Programme entreprise", link: "/enterprise" },
      ]
    },
    {
      title: "Intégrations", icon: PlugZap, color: "bg-pink-500/10 text-pink-600",
      articles: [
        { title: "API REST complète", link: "/api-docs" },
        { title: "Extensions Chrome", link: "/extensions" },
        { title: "Zapier & Make", link: "/integrations" },
        { title: "Google Analytics", link: "/settings/tracking" },
        { title: "Facebook Pixel", link: "/settings/tracking" },
        { title: "Webhooks sortants", link: "/api-docs" },
      ]
    },
  ];

  const apiEndpoints = [
    { title: "Introduction à l'API", description: "Authentification, rate limiting et endpoints de base", icon: Code, link: "/api-docs" },
    { title: "Products API", description: "CRUD produits, variantes, images et métadonnées", icon: Package, link: "/api-docs" },
    { title: "Orders API", description: "Gestion des commandes, fulfillment et statuts", icon: ShoppingCart, link: "/api-docs" },
    { title: "Customers API", description: "Gestion des clients, segments et historique", icon: Users, link: "/api-docs" },
    { title: "Analytics API", description: "KPIs, rapports et données de performance", icon: BarChart3, link: "/api-docs" },
    { title: "Webhooks", description: "Events temps réel et notifications push", icon: Bell, link: "/api-docs" },
  ];

  const videoTutorials = [
    { title: "Tour complet de la plateforme", duration: "12:34", views: "15K", level: "Débutant" },
    { title: "Importer 1000 produits en 10 min", duration: "10:15", views: "8.2K", level: "Débutant" },
    { title: "Automatiser le fulfillment", duration: "18:42", views: "5.7K", level: "Intermédiaire" },
    { title: "Optimiser avec l'IA", duration: "14:28", views: "12K", level: "Intermédiaire" },
    { title: "Multi-canal avancé", duration: "22:10", views: "4.3K", level: "Avancé" },
    { title: "Repricing dynamique", duration: "16:55", views: "3.8K", level: "Avancé" },
  ];

  const faqs = [
    { q: "Comment connecter ma boutique Shopify ?", a: "Rendez-vous dans Boutiques & Canaux > Shopify et suivez le wizard de connexion OAuth. La synchronisation est automatique et bidirectionnelle." },
    { q: "Combien de produits puis-je importer ?", a: "Illimité sur les plans Pro et Business. Le plan Starter permet jusqu'à 500 produits. L'import supporte CSV, URL directe et API fournisseurs." },
    { q: "L'IA est-elle incluse dans tous les plans ?", a: "Oui, tous les plans incluent des crédits IA mensuels pour l'optimisation de fiches produits, le repricing et les recommandations. Les plans supérieurs offrent plus de crédits." },
    { q: "Comment fonctionne le fulfillment automatique ?", a: "Configurez vos fournisseurs dans Fournisseurs, activez l'auto-fulfillment dans Automatisation, et chaque commande sera transmise automatiquement avec suivi de livraison." },
    { q: "Puis-je vendre sur plusieurs marketplaces ?", a: "Oui, ShopOpti+ supporte la publication simultanée sur Shopify, Amazon, eBay, Etsy et WooCommerce avec synchronisation des stocks en temps réel." },
    { q: "Comment contacter le support ?", a: "Via le chat en direct (icône en bas à droite), par email à contact@shopopti.io, ou depuis le Centre de support. Le support est disponible 7j/7." },
    { q: "Y a-t-il une API pour les développeurs ?", a: "Oui, une API REST complète est disponible avec documentation interactive, SDKs (JS, Python, PHP) et rate limiting adapté à votre plan." },
    { q: "Comment annuler mon abonnement ?", a: "Rendez-vous dans Paramètres > Abonnement > Gérer. L'annulation est effective à la fin de la période en cours. Aucun engagement minimum." },
  ];

  // Filter categories and articles by search
  const filteredCategories = searchQuery
    ? categories.map(cat => ({
        ...cat,
        articles: cat.articles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
      })).filter(cat => cat.articles.length > 0 || cat.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : categories;

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
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 text-sm">
                  <Book className="w-4 h-4 mr-2" />
                  Documentation
                </Badge>
                <Badge variant="outline" className="px-3 py-2 text-sm">
                  <Layers className="h-3 w-3 mr-1" /> {categories.reduce((acc, c) => acc + c.articles.length, 0)}+ guides
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
                Centre de <span className="bg-gradient-to-r from-primary via-primary to-blue-600 bg-clip-text text-transparent">documentation</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Guides complets, tutoriels vidéo et référence API pour maîtriser chaque fonctionnalité de ShopOpti+
              </p>

              <div className="max-w-xl mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans la documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base rounded-xl border-2 focus:border-primary shadow-sm"
                />
              </div>

              {/* Quick links */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                <span className="text-sm text-muted-foreground">Populaire :</span>
                {["Import produits", "Shopify", "Fulfillment", "API", "IA", "SEO"].map(tag => (
                  <Button key={tag} variant="ghost" size="sm" className="text-xs h-7 rounded-full border border-border/50"
                    onClick={() => setSearchQuery(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Démarrage rapide</h2>
                <p className="text-sm text-muted-foreground">Soyez opérationnel en quelques minutes</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStartGuides.map((guide, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className="hover:shadow-xl transition-all cursor-pointer group h-full border-2 hover:border-primary/30"
                    onClick={() => navigate(guide.link)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <guide.icon className={`h-6 w-6 ${guide.color || 'text-primary'}`} />
                        </div>
                        <Badge variant="outline" className="text-xs">{guide.time}</Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {guide.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">{guide.description}</CardDescription>
                      <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 font-medium">
                        Commencer <ArrowRight className="h-3 w-3" />
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content Tabs */}
        <section className="py-12 px-4 sm:px-6 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="guides" className="space-y-8">
              <TabsList className="grid grid-cols-4 w-full max-w-xl mx-auto h-12">
                <TabsTrigger value="guides" className="text-sm">
                  <FileText className="h-4 w-4 mr-2" /> Guides
                </TabsTrigger>
                <TabsTrigger value="api" className="text-sm">
                  <Code className="h-4 w-4 mr-2" /> API
                </TabsTrigger>
                <TabsTrigger value="videos" className="text-sm">
                  <Video className="h-4 w-4 mr-2" /> Vidéos
                </TabsTrigger>
                <TabsTrigger value="faq" className="text-sm">
                  <HelpCircle className="h-4 w-4 mr-2" /> FAQ
                </TabsTrigger>
              </TabsList>

              {/* Guides Tab */}
              <TabsContent value="guides" className="space-y-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCategories.map((category, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                    >
                      <Card className="hover:shadow-lg transition-all h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3 mb-1">
                            <div className={`p-2.5 rounded-xl ${category.color}`}>
                              <category.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{category.title}</CardTitle>
                              <p className="text-xs text-muted-foreground">{category.articles.length} articles</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {category.articles.map((article, idx) => (
                              <li key={idx}>
                                <Link
                                  to={article.link}
                                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 py-1 group"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-primary/40 group-hover:text-primary transition-colors flex-shrink-0" />
                                  {article.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                {filteredCategories.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun résultat pour "{searchQuery}"</p>
                    <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                      Réinitialiser
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* API Tab */}
              <TabsContent value="api" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {apiEndpoints.map((doc, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate(doc.link)}>
                      <CardContent className="p-5 flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                          <doc.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold group-hover:text-primary transition-colors">{doc.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="flex-1 rounded-xl" onClick={() => navigate("/api-docs")}>
                    <Code className="h-4 w-4 mr-2" />
                    Documentation API interactive
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1 rounded-xl" onClick={() => navigate("/api-documentation")}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    API Reference complète
                  </Button>
                </div>
              </TabsContent>

              {/* Videos Tab */}
              <TabsContent value="videos" className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videoTutorials.map((video, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
                      <CardContent className="p-0">
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
                          <div className="h-14 w-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <Video className="h-6 w-6 text-primary-foreground ml-0.5" />
                          </div>
                          <Badge className="absolute top-3 right-3 bg-black/60 text-white border-0">{video.duration}</Badge>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">{video.title}</h4>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{video.level}</Badge>
                            <span>{video.views} vues</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="text-center pt-4">
                  <Button size="lg" variant="outline" className="rounded-xl" onClick={() => navigate("/academy")}>
                    <Star className="h-4 w-4 mr-2" />
                    Accéder à l'Academy complète
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>

              {/* FAQ Tab */}
              <TabsContent value="faq" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Questions fréquentes
                    </CardTitle>
                    <CardDescription>Trouvez rapidement les réponses à vos questions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`faq-${index}`}>
                          <AccordionTrigger className="text-left font-medium hover:text-primary">
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
                <div className="text-center">
                  <Button size="lg" className="rounded-xl" onClick={() => navigate("/faq")}>
                    Voir toutes les FAQ
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-y bg-background px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { label: "Guides disponibles", value: `${categories.reduce((acc, c) => acc + c.articles.length, 0)}+`, icon: FileText },
                { label: "Catégories", value: String(categories.length), icon: Layers },
                { label: "Tutoriels vidéo", value: `${videoTutorials.length}+`, icon: Video },
                { label: "Endpoints API", value: "24+", icon: Code },
              ].map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <stat.icon className="h-6 w-6 text-primary mx-auto" />
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 mb-6">
              <Zap className="h-4 w-4 mr-2" /> Support
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Besoin d'aide supplémentaire ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Notre équipe support est disponible 7j/7 pour vous accompagner. Chat en direct, email ou documentation avancée.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="rounded-xl" onClick={() => navigate("/contact")}>
                <Mail className="mr-2 h-5 w-5" />
                Contacter le support
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl" onClick={() => navigate("/support")}>
                <HelpCircle className="mr-2 h-5 w-5" />
                Centre de support
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl" onClick={() => navigate("/academy")}>
                <Star className="mr-2 h-5 w-5" />
                Academy
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default DocumentationPage;
