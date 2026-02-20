import { Helmet } from 'react-helmet-async';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Globe, BarChart3, Zap, ShoppingCart, Shield, Package, TrendingUp, Users, Star, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";

const Features = () => {
  const navigate = useNavigate();

  const mainFeatures = [
    {
      icon: Sparkles,
      title: "IA d'optimisation",
      description: "Optimisez automatiquement vos prix, descriptions produits et SEO grâce à l'intelligence artificielle avancée.",
      features: [
        "Génération automatique de descriptions SEO",
        "Optimisation des prix en temps réel",
        "Suggestions de mots-clés",
        "Analyse de la concurrence"
      ],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Globe,
      title: "Multi-marketplace",
      description: "Gérez Shopify, WooCommerce, PrestaShop et plus depuis une seule plateforme centralisée.",
      features: [
        "Synchronisation multi-plateformes",
        "Gestion centralisée des stocks",
        "Import/Export en masse",
        "API robuste et documentée"
      ],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: BarChart3,
      title: "Analytics avancés",
      description: "Tableaux de bord en temps réel avec insights business et prévisions de ventes powered by AI.",
      features: [
        "Tableaux de bord personnalisables",
        "Prévisions de ventes par IA",
        "Analyse des performances produits",
        "Rapports automatisés"
      ],
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Zap,
      title: "Import automatique",
      description: "Importez des milliers de produits en quelques clics depuis AliExpress, BigBuy, Spocket et 99+ fournisseurs.",
      features: [
        "99+ fournisseurs connectés",
        "Import en 1 clic",
        "Mapping automatique des catégories",
        "Synchronisation des stocks en temps réel"
      ],
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: ShoppingCart,
      title: "Gestion commandes",
      description: "Automatisez le traitement des commandes et le tracking avec synchronisation multi-plateformes.",
      features: [
        "Traitement automatique des commandes",
        "Suivi des expéditions en temps réel",
        "Notifications clients automatiques",
        "Gestion des retours simplifiée"
      ],
      color: "from-red-500 to-rose-500"
    },
    {
      icon: Shield,
      title: "Sécurité garantie",
      description: "Protection des données, conformité RGPD et sauvegarde automatique de toutes vos informations.",
      features: [
        "Conformité RGPD complète",
        "Chiffrement des données",
        "Sauvegardes automatiques quotidiennes",
        "Authentification à deux facteurs"
      ],
      color: "from-indigo-500 to-blue-500"
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Fonctionnalités ShopOpti+",
    "description": "Découvrez toutes les fonctionnalités de ShopOpti+ : IA, multi-marketplace, analytics avancés, import automatique.",
    "url": "https://shopopti.io/features",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "ShopOpti+",
      "applicationCategory": "BusinessApplication",
      "featureList": mainFeatures.map(f => f.title).join(", ")
    }
  };

  return (
    <PublicLayout>
      <Helmet>
        <title>Fonctionnalités E-commerce | ShopOpti+ - IA, Multi-Marketplace, Analytics</title>
        <meta name="description" content="Découvrez toutes les fonctionnalités de ShopOpti+ : IA d'optimisation, multi-marketplace (Shopify, Amazon, eBay), analytics avancés, import automatique de 99+ fournisseurs." />
        <meta name="keywords" content="fonctionnalités e-commerce, IA dropshipping, multi-marketplace, analytics e-commerce, import automatique" />
        <link rel="canonical" href="https://shopopti.io/features" />
        <meta property="og:title" content="Fonctionnalités ShopOpti+ | Automatisation E-commerce" />
        <meta property="og:description" content="IA d'optimisation, multi-marketplace, analytics avancés et plus." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://shopopti.io/features" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Fonctionnalités", url: "https://shopopti.io/features" },
      ]} />
          {/* Hero Section */}
          <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="text-center space-y-6 max-w-3xl mx-auto">
                <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                  Fonctionnalités
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold">
                  Tout ce dont vous avez besoin
                  <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    pour réussir en e-commerce
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Une suite complète d'outils professionnels pour automatiser, gérer et développer votre business en ligne.
                </p>
                <Button size="lg" onClick={() => {
                  try { localStorage.setItem('pending_trial', 'true'); } catch {}
                  navigate('/auth?trial=true');
                }}>
                  Essayer gratuitement
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mainFeatures.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                      <CardHeader>
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} w-fit mb-4`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {feature.features.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Star className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
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

          {/* CTA Section */}
          <section className="py-20 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="text-center space-y-6 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold">
                  Prêt à démarrer ?
                </h2>
                <p className="text-xl opacity-90">
                  Rejoignez des milliers d'entrepreneurs qui utilisent ShopOpti+ pour développer leur business.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button size="lg" variant="secondary" onClick={() => {
                    try { localStorage.setItem('pending_trial', 'true'); } catch {}
                    navigate('/auth?trial=true');
                  }}>
                    Essai gratuit 14 jours
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" onClick={() => navigate('/pricing')}>
                    Voir les tarifs
                  </Button>
                </div>
              </div>
            </div>
          </section>
    </PublicLayout>
  );
};

export default Features;
