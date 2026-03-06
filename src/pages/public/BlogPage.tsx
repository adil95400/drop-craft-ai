import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Calendar, Clock, User, ArrowRight, Search, TrendingUp, BookOpen, Loader2, Star, Eye, MessageCircle, Share2, Bookmark, Flame, Zap, Target, BarChart3, Globe, ShieldCheck, Lightbulb, Rocket } from "lucide-react";
import { useState } from "react";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { FALLBACK_BLOG_POSTS, slugify } from "@/data/blogArticles";

const POSTS_PER_PAGE = 9;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Rich fallback posts — comprehensive professional blog
const fallbackPosts = [
  {
    created_at: null, id: "1",
    title: "10 Stratégies pour Augmenter vos Ventes en Dropshipping en 2026",
    excerpt: "Découvrez les meilleures pratiques pour optimiser votre boutique et maximiser vos conversions cette année. Des techniques éprouvées par les top sellers.",
    category: "Stratégie", author: "Sophie Martin", publish_date: "2026-03-01", readTime: "8 min",
    image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop",
    featured: true, tags: ["dropshipping", "e-commerce", "stratégie", "ventes"], content: "", views: 5200, comments: 34,
  },
  {
    created_at: null, id: "2",
    title: "Guide Complet : Optimiser vos Fiches Produits avec l'IA en 2026",
    excerpt: "L'intelligence artificielle révolutionne la création de contenu produit. Apprenez à générer des descriptions SEO-optimisées en quelques secondes.",
    category: "IA & Automatisation", author: "Marc Dupont", publish_date: "2026-02-28", readTime: "12 min",
    image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop",
    featured: true, tags: ["IA", "optimisation", "produits", "SEO"], content: "", views: 4800, comments: 28,
  },
  {
    created_at: null, id: "3",
    title: "Comment Choisir les Meilleurs Fournisseurs pour votre Business",
    excerpt: "Critères essentiels et méthodes pour sélectionner des fournisseurs fiables avec des délais de livraison rapides et des marges rentables.",
    category: "Fournisseurs", author: "Julie Chen", publish_date: "2026-02-25", readTime: "10 min",
    image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop",
    featured: false, tags: ["fournisseurs", "sourcing", "qualité"], content: "", views: 3900, comments: 22,
  },
  {
    created_at: null, id: "4",
    title: "Multi-Marketplace : Vendre sur Amazon, eBay et Etsy Simultanément",
    excerpt: "Stratégies pour gérer efficacement plusieurs canaux de vente depuis une seule plateforme. Synchronisez stocks et commandes automatiquement.",
    category: "Marketplaces", author: "Pierre Lambert", publish_date: "2026-02-22", readTime: "15 min",
    image_url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop",
    featured: false, tags: ["marketplace", "Amazon", "eBay", "Etsy"], content: "", views: 3400, comments: 19,
  },
  {
    created_at: null, id: "5",
    title: "SEO E-commerce : Techniques Avancées pour Dominer Google en 2026",
    excerpt: "Boostez votre visibilité Google avec ces techniques SEO spécialement adaptées au e-commerce : schema markup, Core Web Vitals, et plus.",
    category: "SEO", author: "Emma Wilson", publish_date: "2026-02-20", readTime: "11 min",
    image_url: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&auto=format&fit=crop",
    featured: false, tags: ["SEO", "Google", "référencement", "trafic"], content: "", views: 4100, comments: 25,
  },
  {
    created_at: null, id: "6",
    title: "Automatiser vos Campagnes Marketing : Guide Complet",
    excerpt: "Configurez des campagnes email et publicités automatisées pour gagner du temps et augmenter vos revenus de 40% en moyenne.",
    category: "Marketing", author: "Thomas Bernard", publish_date: "2026-02-18", readTime: "9 min",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    featured: false, tags: ["marketing", "automatisation", "email", "publicité"], content: "", views: 3600, comments: 21,
  },
  {
    created_at: null, id: "7",
    title: "Repricing Dynamique : Comment l'IA Ajuste vos Prix en Temps Réel",
    excerpt: "Découvrez comment les algorithmes de pricing intelligent analysent la concurrence et ajustent automatiquement vos prix pour maximiser vos marges.",
    category: "Tarification", author: "Alexandre Roy", publish_date: "2026-02-15", readTime: "13 min",
    image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
    featured: false, tags: ["pricing", "IA", "marge", "concurrence"], content: "", views: 2800, comments: 17,
  },
  {
    created_at: null, id: "8",
    title: "Fulfillment Automatisé : De la Commande à la Livraison en 1 Clic",
    excerpt: "Automatisez l'ensemble de votre chaîne logistique : traitement des commandes, impression d'étiquettes, suivi de livraison et gestion des retours.",
    category: "Logistique", author: "Marie Laurent", publish_date: "2026-02-12", readTime: "10 min",
    image_url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop",
    featured: false, tags: ["fulfillment", "logistique", "automatisation", "livraison"], content: "", views: 3100, comments: 15,
  },
  {
    created_at: null, id: "9",
    title: "CRM E-commerce : Fidéliser vos Clients et Augmenter le LTV",
    excerpt: "Maîtrisez la gestion de la relation client pour augmenter la lifetime value. Segmentation, scoring, et campagnes de rétention personnalisées.",
    category: "CRM", author: "Camille Petit", publish_date: "2026-02-10", readTime: "11 min",
    image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop",
    featured: false, tags: ["CRM", "fidélisation", "clients", "rétention"], content: "", views: 2600, comments: 14,
  },
  {
    created_at: null, id: "10",
    title: "A/B Testing pour E-commerce : Boostez vos Conversions de 30%",
    excerpt: "Guide complet pour mettre en place des tests A/B sur vos fiches produits, pages de vente et emails. Méthodologie et outils essentiels.",
    category: "Conversion", author: "Lucas Martin", publish_date: "2026-02-08", readTime: "14 min",
    image_url: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop",
    featured: false, tags: ["A/B testing", "conversion", "optimisation", "UX"], content: "", views: 2900, comments: 18,
  },
  {
    created_at: null, id: "11",
    title: "Shopify vs WooCommerce vs ShopOpti : Comparatif Complet 2026",
    excerpt: "Analyse détaillée des forces et faiblesses de chaque plateforme. Fonctionnalités, prix, performances et scalabilité comparés objectivement.",
    category: "Comparatif", author: "Sophie Martin", publish_date: "2026-02-05", readTime: "18 min",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    featured: false, tags: ["comparatif", "Shopify", "WooCommerce", "plateforme"], content: "", views: 5600, comments: 42,
  },
  {
    created_at: null, id: "12",
    title: "Créer une Marque E-commerce qui Dure : Le Guide du Branding",
    excerpt: "Au-delà du dropshipping classique : construisez une identité de marque forte, développez votre packaging et créez une expérience client mémorable.",
    category: "Branding", author: "Émilie Rousseau", publish_date: "2026-02-03", readTime: "12 min",
    image_url: "https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800&auto=format&fit=crop",
    featured: false, tags: ["branding", "marque", "identité", "packaging"], content: "", views: 3200, comments: 20,
  },
  {
    created_at: null, id: "13",
    title: "Les Tendances E-commerce 2026 : Ce qui Va Changer Cette Année",
    excerpt: "IA générative, commerce conversationnel, social commerce, durabilité... Les 10 tendances qui vont transformer le e-commerce cette année.",
    category: "Tendances", author: "Marc Dupont", publish_date: "2026-01-30", readTime: "16 min",
    image_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop",
    featured: false, tags: ["tendances", "2026", "innovation", "futur"], content: "", views: 4500, comments: 31,
  },
  {
    created_at: null, id: "14",
    title: "Publicité Facebook & Instagram pour E-commerce : ROI Maximum",
    excerpt: "Stratégies avancées de publicité Meta pour e-commerce : lookalike audiences, retargeting dynamique, et optimisation des créatives avec l'IA.",
    category: "Marketing", author: "Thomas Bernard", publish_date: "2026-01-28", readTime: "14 min",
    image_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop",
    featured: false, tags: ["Facebook", "Instagram", "publicité", "Meta"], content: "", views: 3800, comments: 23,
  },
  {
    created_at: null, id: "15",
    title: "Sécurité E-commerce : Protégez votre Boutique et vos Clients",
    excerpt: "Meilleures pratiques de sécurité : SSL, authentification 2FA, protection contre la fraude, conformité RGPD et PCI DSS expliquées simplement.",
    category: "Sécurité", author: "Pierre Lambert", publish_date: "2026-01-25", readTime: "10 min",
    image_url: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop",
    featured: false, tags: ["sécurité", "RGPD", "fraude", "protection"], content: "", views: 2400, comments: 12,
  },
  {
    created_at: null, id: "16",
    title: "Email Marketing E-commerce : Séquences qui Convertissent",
    excerpt: "Les 7 séquences email indispensables : welcome series, abandon de panier, post-achat, winback. Templates et taux de conversion moyens inclus.",
    category: "Marketing", author: "Camille Petit", publish_date: "2026-01-22", readTime: "13 min",
    image_url: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&auto=format&fit=crop",
    featured: false, tags: ["email", "marketing", "séquences", "conversion"], content: "", views: 3300, comments: 19,
  },
  {
    created_at: null, id: "17",
    title: "Analytics E-commerce : Les KPIs à Suivre Absolument",
    excerpt: "Tableau de bord idéal : ROAS, CAC, LTV, taux de conversion, panier moyen, taux de retour. Comment les mesurer et les améliorer concrètement.",
    category: "Analytics", author: "Alexandre Roy", publish_date: "2026-01-20", readTime: "11 min",
    image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
    featured: false, tags: ["analytics", "KPI", "données", "performance"], content: "", views: 2700, comments: 16,
  },
  {
    created_at: null, id: "18",
    title: "Dropshipping avec Print-on-Demand : Guide Complet pour Débutants",
    excerpt: "Combinez dropshipping et impression à la demande pour créer des produits uniques sans stock. Plateformes, marges et stratégies de niche.",
    category: "Stratégie", author: "Emma Wilson", publish_date: "2026-01-18", readTime: "9 min",
    image_url: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&auto=format&fit=crop",
    featured: false, tags: ["print-on-demand", "dropshipping", "personnalisation", "niche"], content: "", views: 4200, comments: 27,
  },
];

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  publish_date: string | null;
  image_url: string | null;
  tags: string[] | null;
  content: string;
  created_at: string | null;
  ai_generated?: boolean | null;
  status?: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Stratégie": <Target className="h-4 w-4" />,
  "IA & Automatisation": <Zap className="h-4 w-4" />,
  "SEO": <Globe className="h-4 w-4" />,
  "Marketing": <Rocket className="h-4 w-4" />,
  "Analytics": <BarChart3 className="h-4 w-4" />,
  "Sécurité": <ShieldCheck className="h-4 w-4" />,
  "Tendances": <Lightbulb className="h-4 w-4" />,
  "Conversion": <Flame className="h-4 w-4" />,
};

const BlogPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [page, setPage] = useState(1);

  const { data: dbPosts, isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, excerpt, category, publish_date, image_url, tags, content, created_at, ai_generated, status")
        .eq("status", "published")
        .order("publish_date", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const allPosts = (dbPosts && dbPosts.length > 0) ? dbPosts : fallbackPosts;

  const categoryMap = new Map<string, number>();
  categoryMap.set("Tous", allPosts.length);
  allPosts.forEach((p) => {
    const cat = p.category || "Autre";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });
  const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));

  const getReadTime = (post: typeof allPosts[0]) => {
    if ('readTime' in post && (post as any).readTime) return (post as any).readTime;
    return `${Math.max(1, Math.ceil((post.content?.length || 0) / 1500))} min`;
  };

  const getAuthor = (post: typeof allPosts[0]) => {
    if ('author' in post && (post as any).author) return (post as any).author;
    return "ShopOpti+";
  };

  const getViews = (post: typeof allPosts[0]) => {
    if ('views' in post && (post as any).views) return (post as any).views;
    return Math.floor(Math.random() * 3000) + 500;
  };

  const getComments = (post: typeof allPosts[0]) => {
    if ('comments' in post && (post as any).comments) return (post as any).comments;
    return Math.floor(Math.random() * 20) + 2;
  };

  const isFeatured = (post: typeof allPosts[0], index: number) => {
    if ('featured' in post) return (post as any).featured;
    return index < 2;
  };

  const filteredPosts = allPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Tous" || (post.category || "Autre") === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = allPosts.filter((p, i) => isFeatured(p, i));

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(0, page * POSTS_PER_PAGE);
  const hasMore = page < totalPages;

  const formatViews = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog ShopOpti+",
    "description": "Conseils, guides et actualités sur le dropshipping, l'e-commerce et l'automatisation avec l'IA",
    "url": "https://shopopti.io/blog",
    "publisher": {
      "@type": "Organization",
      "name": "ShopOpti+",
      "logo": { "@type": "ImageObject", "url": "https://shopopti.io/logo.png" }
    },
    "blogPost": allPosts.slice(0, 10).map((post) => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "datePublished": post.publish_date || post.created_at,
      "image": post.image_url,
    })),
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

      {/* Hero Section — Bold & Professional */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 text-sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Blog & Ressources
              </Badge>
              <Badge variant="outline" className="px-3 py-2 text-sm">
                <Flame className="h-3 w-3 mr-1 text-orange-500" />
                {allPosts.length} articles
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Le blog de référence pour
              <span className="block bg-gradient-to-r from-primary via-primary to-blue-600 bg-clip-text text-transparent mt-2">
                l'E-commerce Intelligent
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Guides pratiques, stratégies éprouvées et analyses de tendances par des experts du dropshipping et de l'e-commerce.
            </p>
            <div className="relative max-w-xl mx-auto pt-4">
              <Search className="absolute left-4 top-1/2 translate-y-[2px] h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un article, un sujet..."
                className="pl-12 h-14 text-base rounded-xl border-2 focus:border-primary shadow-sm"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                aria-label="Rechercher dans le blog"
              />
            </div>

            {/* Popular tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <span className="text-sm text-muted-foreground mr-1">Populaire :</span>
              {["Dropshipping", "IA", "SEO", "Marketing", "Pricing"].map((tag) => (
                <Button
                  key={tag}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 rounded-full border border-border/50 hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => { setSearchQuery(tag); setPage(1); }}
                >
                  #{tag}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories — Sticky bar */}
      <section className="py-4 border-b bg-background/80 sticky top-16 z-40 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <Button
                key={cat.name}
                variant={selectedCategory === cat.name ? "default" : "outline"}
                size="sm"
                onClick={() => { setSelectedCategory(cat.name); setPage(1); }}
                className="whitespace-nowrap rounded-full"
              >
                {categoryIcons[cat.name] || null}
                <span className="ml-1">{cat.name}</span>
                <Badge variant="secondary" className="ml-2 text-xs rounded-full">{cat.count}</Badge>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading */}
      {isLoading && (
        <div className="py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Chargement des articles...</p>
        </div>
      )}

      {/* Featured Articles — Premium cards */}
      {!isLoading && selectedCategory === "Tous" && !searchQuery && featuredPosts.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Articles à la Une</h2>
                <p className="text-sm text-muted-foreground">Les articles les plus lus ce mois-ci</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                >
                  <Link to={`/blog/${slugify(post.title)}`} className="group block h-full">
                    <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 h-full shadow-sm hover:shadow-xl">
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={post.image_url || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop"}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          width={640} height={360} loading="lazy" decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge className="bg-primary text-primary-foreground shadow-lg">
                            <Star className="h-3 w-3 mr-1" /> À la une
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <Badge variant="secondary" className="bg-white/90 text-foreground mb-2">{post.category || "Article"}</Badge>
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-2">{post.excerpt}</CardDescription>
                      </CardHeader>
                      <CardFooter className="flex items-center justify-between pt-0">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{getAuthor(post)}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{getReadTime(post)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatViews(getViews(post))}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{getComments(post)}</span>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Articles — Grid */}
      {!isLoading && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                {searchQuery ? `Résultats pour "${searchQuery}"` : selectedCategory === "Tous" ? "Tous les articles" : selectedCategory}
                <span className="text-muted-foreground font-normal text-lg ml-2">({filteredPosts.length})</span>
              </h2>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-16 bg-background rounded-2xl border">
                <Search className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg font-medium">Aucun article trouvé.</p>
                <p className="text-muted-foreground text-sm mt-1">Essayez avec d'autres mots-clés</p>
                <Button variant="outline" className="mt-6" onClick={() => { setSearchQuery(""); setSelectedCategory("Tous"); }}>
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPosts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                  >
                    <Link to={`/blog/${slugify(post.title)}`} className="group block h-full">
                      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full border hover:border-primary/30">
                        <div className="relative aspect-video overflow-hidden bg-muted">
                          <img
                            src={post.image_url || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop"}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            width={640} height={360} loading="lazy" decoding="async"
                          />
                          <div className="absolute top-3 right-3">
                            <button
                              className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                              onClick={(e) => { e.preventDefault(); }}
                              aria-label="Sauvegarder l'article"
                            >
                              <Bookmark className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs rounded-full">
                              {categoryIcons[post.category || ""] || null}
                              <span className="ml-1">{post.category || "Article"}</span>
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {getReadTime(post)}
                            </span>
                          </div>
                          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            {post.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                        </CardContent>
                        <CardFooter className="pt-0 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{getAuthor(post)}</span>
                            <span>•</span>
                            <span>{new Date(post.publish_date || post.created_at || "").toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{formatViews(getViews(post))}</span>
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" onClick={() => setPage((p) => p + 1)} className="rounded-full px-8">
                  Charger plus d'articles
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Stats Bar */}
      <section className="py-12 border-y bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Articles publiés", value: `${allPosts.length}+`, icon: BookOpen },
              { label: "Lecteurs mensuels", value: "15k+", icon: Eye },
              { label: "Catégories", value: String(categories.length - 1), icon: Target },
              { label: "Experts contributeurs", value: "8+", icon: User },
            ].map((stat) => (
              <div key={stat.label} className="text-center space-y-2">
                <stat.icon className="h-6 w-6 text-primary mx-auto" />
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA — Premium */}
      <section className="py-20 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Zap className="h-4 w-4 mr-2" /> Newsletter
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Restez en avance sur la concurrence
            </h2>
            <p className="text-lg text-muted-foreground">
              Recevez chaque semaine nos meilleures analyses, guides et opportunités directement dans votre boîte mail. Rejoint par +5 000 e-commerçants.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="votre@email.com"
                className="h-12 rounded-xl"
                aria-label="Email pour newsletter"
              />
              <Button size="lg" className="h-12 rounded-xl px-6 whitespace-nowrap">
                S'abonner <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Gratuit · Pas de spam · Désabonnement en 1 clic</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default BlogPage;