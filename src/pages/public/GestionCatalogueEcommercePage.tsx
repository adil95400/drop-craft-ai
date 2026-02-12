import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Zap, Brain, Globe, Package, BarChart3, Layers, Tags, Database, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "Qu'est-ce qu'un PIM e-commerce ?", answer: "Un PIM (Product Information Management) est un système centralisé de gestion des informations produits. Il permet de stocker, enrichir et distribuer toutes les données de votre catalogue (titres, descriptions, images, prix, stocks) vers vos différents canaux de vente depuis une source unique." },
  { question: "Pourquoi utiliser un outil de gestion de catalogue e-commerce ?", answer: "Un catalogue mal géré entraîne des descriptions incohérentes, des ruptures de stock, des erreurs de prix et un mauvais référencement. Un PIM comme ShopOpti+ centralise toutes vos données produits, garantit leur cohérence sur tous vos canaux et optimise automatiquement le SEO." },
  { question: "Combien de produits ShopOpti+ peut-il gérer ?", answer: "ShopOpti+ peut gérer des catalogues de 10 à 100 000+ produits. L'architecture est conçue pour les gros volumes avec import en masse, modification en bulk et synchronisation haute performance." },
  { question: "Peut-on importer un catalogue existant ?", answer: "Oui, ShopOpti+ supporte l'import depuis CSV, Excel, API, et directement depuis Shopify, WooCommerce, PrestaShop et d'autres plateformes. Le mapping des colonnes est automatique grâce à l'IA." },
  { question: "L'enrichissement IA est-il inclus dans la gestion de catalogue ?", answer: "Oui, l'enrichissement IA est natif. Chaque produit peut être automatiquement enrichi : réécriture des titres, génération de descriptions SEO, optimisation des images et suggestion de catégories." },
];

const GestionCatalogueEcommercePage = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Gestion Catalogue E-commerce | ShopOpti+ - PIM IA Professionnel"
        description="Centralisez et optimisez votre catalogue e-commerce avec le PIM IA de ShopOpti+. Import en masse, enrichissement automatique, synchronisation multi-canal. Essai gratuit."
        path="/gestion-catalogue-ecommerce"
        keywords="gestion catalogue ecommerce, PIM ecommerce, gestion produits en ligne, catalogue produits, gestion stock ecommerce"
      />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Gestion Catalogue E-commerce", url: "https://shopopti.io/gestion-catalogue-ecommerce" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <Badge className="mb-6 px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Layers className="h-4 w-4 mr-2" /> PIM E-commerce Professionnel
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Gestion de catalogue e-commerce</span> intelligente par IA
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
              Centralisez, enrichissez et distribuez votre catalogue produits sur tous vos canaux de vente avec le PIM IA de ShopOpti+. Importez des milliers de produits, optimisez-les automatiquement et synchronisez tout en temps réel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate('/auth?trial=true')}>
                Essai gratuit 14 jours <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/features')}>
                Découvrir le PIM
              </Button>
            </div>
          </div>
        </section>

        {/* Problème */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Les défis de la gestion de catalogue e-commerce</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Gérer un catalogue e-commerce de centaines ou milliers de produits est un défi complexe. Entre les descriptions à rédiger, les prix à maintenir, les stocks à synchroniser et les images à optimiser, les erreurs se multiplient et le référencement en souffre. C'est pourquoi les e-commerçants performants utilisent un PIM (Product Information Management) professionnel.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: Database, title: "Source Unique de Vérité", desc: "Toutes les données de vos produits centralisées : titres, descriptions, images, prix, stocks, variantes, attributs. Plus jamais d'incohérences entre vos canaux de vente." },
                { icon: Brain, title: "Enrichissement IA Automatique", desc: "Notre IA réécrit les titres, génère des descriptions SEO uniques, optimise les images et catégorise vos produits automatiquement. Gagnez des heures de travail manuel." },
                { icon: RefreshCw, title: "Synchronisation Temps Réel", desc: "Publiez et mettez à jour vos produits sur Shopify, Amazon, eBay et 20+ canaux simultanément. Stocks et prix toujours synchronisés." },
              ].map((f, i) => (
                <Card key={i} className="border-2 hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-primary/10 w-fit mb-3"><f.icon className="h-6 w-6 text-primary" /></div>
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-muted-foreground text-sm">{f.desc}</p></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Fonctionnalités détaillées */}
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Fonctionnalités de gestion de catalogue ShopOpti+</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Import en masse multi-sources</h3>
                <p className="text-muted-foreground">
                  Importez votre catalogue depuis CSV, Excel, API ou directement depuis vos boutiques existantes. ShopOpti+ détecte automatiquement la structure de vos données et mappe les colonnes grâce à l'IA. Importez 10 000 produits en quelques minutes avec dédoublonnage automatique et validation des données.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Enrichissement et optimisation IA</h3>
                <p className="text-muted-foreground">
                  Chaque produit de votre catalogue peut être enrichi automatiquement par notre IA : réécriture des titres avec mots-clés SEO, génération de descriptions uniques de 300+ mots, création de balises meta optimisées, catégorisation intelligente et suggestion de tags. Le tout avec contrôle de qualité et historique des versions.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Tags className="h-5 w-5 text-primary" /> Variantes et attributs avancés</h3>
                <p className="text-muted-foreground">
                  Gérez des produits complexes avec variantes multiples (taille, couleur, matière), attributs personnalisés et options de prix. Notre système de variantes supporte les bundles, les lots et les produits configurables avec pricing dynamique par canal.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Distribution multi-canal</h3>
                <p className="text-muted-foreground">
                  Publiez votre catalogue optimisé sur tous vos canaux de vente depuis un seul endroit. ShopOpti+ adapte automatiquement le format de vos données aux exigences spécifiques de chaque plateforme (Shopify, Amazon, eBay, Google Shopping, Facebook Shops). La synchronisation bidirectionnelle maintient la cohérence en temps réel.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Analytics catalogue et health score</h3>
                <p className="text-muted-foreground">
                  Visualisez la santé de votre catalogue en un coup d'œil. Notre health score analyse la complétude de chaque fiche produit (titre, description, images, SEO) et identifie les produits nécessitant une optimisation. Suivez la performance de chaque produit par canal avec des KPIs clairs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Checklist */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Tout ce qu'inclut notre PIM e-commerce</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Import CSV / Excel / API en masse",
                "Mapping automatique IA des colonnes",
                "Enrichissement IA (titre, description, SEO)",
                "Gestion des variantes et attributs",
                "Pricing multi-canal dynamique",
                "Synchronisation temps réel 24+ canaux",
                "Health score par produit",
                "Historique des modifications (versioning)",
                "Actions en bulk (modifier, publier, supprimer)",
                "Export vers Google Shopping, Facebook",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Maillage */}
        <section className="py-12 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">Ressources complémentaires</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/logiciel-dropshipping" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Logiciel Dropshipping</h3>
                <p className="text-sm text-muted-foreground">Automatisez votre business</p>
              </Link>
              <Link to="/alternative-autods" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Alternative AutoDS</h3>
                <p className="text-sm text-muted-foreground">Comparez les solutions</p>
              </Link>
              <Link to="/optimisation-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Optimisation Shopify</h3>
                <p className="text-sm text-muted-foreground">Boostez votre boutique</p>
              </Link>
              <Link to="/features" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Fonctionnalités</h3>
                <p className="text-sm text-muted-foreground">Toutes nos fonctionnalités</p>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">FAQ : Gestion de catalogue e-commerce</h2>
            <div className="space-y-4">
              {faqItems.map((faq, i) => (
                <div key={i} className="border rounded-lg p-5 bg-card">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Prenez le contrôle de votre catalogue</h2>
            <p className="text-xl opacity-90 mb-8">
              Centralisez, enrichissez et distribuez votre catalogue e-commerce avec le PIM IA le plus avancé du marché.
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate('/auth?trial=true')}>
              Essai gratuit 14 jours <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
};

export default GestionCatalogueEcommercePage;
