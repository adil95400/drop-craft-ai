import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Zap, Brain, Globe, BarChart3, Package, Shield, TrendingUp, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "Comment optimiser ma boutique Shopify pour le SEO ?", answer: "L'optimisation SEO Shopify passe par plusieurs axes : des titres produits contenant vos mots-clés principaux, des descriptions uniques et détaillées, des images avec alt text descriptif, une structure d'URL propre, des balises meta optimisées et un maillage interne cohérent. ShopOpti+ automatise tout cela grâce à son IA." },
  { question: "ShopOpti+ fonctionne-t-il avec Shopify ?", answer: "Oui, ShopOpti+ s'intègre nativement avec Shopify. Vous pouvez importer vos produits existants, synchroniser les stocks en temps réel, et publier de nouveaux produits optimisés directement depuis notre plateforme." },
  { question: "Combien de temps faut-il pour voir les résultats SEO sur Shopify ?", answer: "Les premiers résultats SEO apparaissent généralement entre 2 et 4 semaines après l'optimisation. Avec ShopOpti+, les fiches produits optimisées par IA commencent à se positionner sur Google dans les jours suivant leur indexation." },
  { question: "L'optimisation Shopify est-elle incluse dans tous les plans ?", answer: "Oui, l'intégration Shopify et l'optimisation SEO par IA sont incluses dans tous les plans ShopOpti+, y compris pendant l'essai gratuit de 14 jours." },
  { question: "Puis-je optimiser mes produits Shopify existants ?", answer: "Absolument. ShopOpti+ peut analyser et optimiser vos produits Shopify existants : réécriture des titres et descriptions par IA, génération de balises meta, optimisation des images et amélioration de la structure SEO globale de votre boutique." },
];

const OptimisationShopifyPage = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Optimisation Shopify IA | ShopOpti+ - Boostez votre Boutique"
        description="Optimisez votre boutique Shopify avec l'IA de ShopOpti+. SEO automatisé, descriptions produits optimisées, synchronisation temps réel. +40% de trafic organique."
        path="/optimisation-shopify"
        keywords="optimisation shopify, SEO shopify, optimiser boutique shopify, shopify dropshipping, améliorer SEO shopify"
      />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Optimisation Shopify", url: "https://shopopti.io/optimisation-shopify" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <Badge className="mb-6 px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Zap className="h-4 w-4 mr-2" /> Optimisation Shopify par IA
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Optimisez votre boutique Shopify</span> avec l'intelligence artificielle
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
              ShopOpti+ transforme votre boutique Shopify en machine à vendre. Notre IA optimise automatiquement vos fiches produits pour le SEO Google, synchronise vos stocks et automatise vos commandes. Résultat : +40% de trafic organique en moyenne.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate('/auth?trial=true')}>
                Optimiser ma boutique Shopify <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/features')}>
                Voir les fonctionnalités
              </Button>
            </div>
          </div>
        </section>

        {/* Problème / Solution */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Pourquoi votre boutique Shopify n'atteint pas son potentiel SEO ?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              La plupart des boutiques Shopify souffrent des mêmes problèmes SEO : des descriptions produits génériques copiées depuis le fournisseur, des titres non optimisés pour les mots-clés de recherche, des images sans balises alt, et une structure de navigation confuse. Ces erreurs coûtent des milliers d'euros en trafic organique manqué chaque mois.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: Search, title: "Audit SEO Automatique", desc: "Notre IA analyse chaque fiche produit de votre boutique Shopify et identifie les opportunités d'optimisation : titres, descriptions, mots-clés, images et balises meta." },
                { icon: Brain, title: "Optimisation IA en 1 Clic", desc: "Générez des titres SEO percutants, des descriptions uniques et des balises meta optimisées automatiquement pour chaque produit de votre boutique." },
                { icon: TrendingUp, title: "+40% de Trafic Organique", desc: "Nos utilisateurs Shopify constatent en moyenne une augmentation de 40% de leur trafic Google après optimisation IA de leur catalogue." },
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

        {/* Détails */}
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Comment ShopOpti+ optimise votre boutique Shopify</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-3">1. Import et analyse de votre catalogue existant</h3>
                <p className="text-muted-foreground">
                  Connectez votre boutique Shopify en quelques secondes. ShopOpti+ importe automatiquement tous vos produits et lance un audit SEO complet. Chaque fiche produit reçoit un score de qualité SEO sur 100 avec des recommandations personnalisées.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">2. Optimisation automatique par IA</h3>
                <p className="text-muted-foreground">
                  Notre IA réécrit vos titres avec les mots-clés les plus recherchés sur Google, génère des descriptions uniques et engageantes de 300+ mots, crée des balises meta ciblées et ajoute des alt text descriptifs à vos images. Tout est fait en respectant les bonnes pratiques SEO Google 2025.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">3. Synchronisation en temps réel</h3>
                <p className="text-muted-foreground">
                  Les modifications optimisées sont automatiquement synchronisées avec votre boutique Shopify. Stocks, prix et descriptions restent toujours à jour entre ShopOpti+ et Shopify. Vous pouvez aussi publier vers d'autres canaux simultanément.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">4. Suivi et analytics SEO</h3>
                <p className="text-muted-foreground">
                  Suivez l'évolution de votre positionnement Google, le trafic organique par produit et les conversions. Notre dashboard analytics vous montre l'impact concret de l'optimisation SEO sur vos ventes Shopify.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Checklist */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Ce que ShopOpti+ optimise sur votre boutique Shopify</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Titres produits SEO-optimisés",
                "Descriptions uniques par IA (300+ mots)",
                "Balises meta title et description",
                "Alt text automatique pour toutes les images",
                "Structure d'URLs propres et lisibles",
                "Maillage interne entre produits",
                "Schema.org Product (données structurées)",
                "Optimisation Core Web Vitals",
                "Synchronisation stocks temps réel",
                "Multi-canal : Shopify + Amazon + eBay",
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
                <p className="text-sm text-muted-foreground">Guide complet du dropshipping</p>
              </Link>
              <Link to="/alternative-autods" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Alternative AutoDS</h3>
                <p className="text-sm text-muted-foreground">Comparez les solutions</p>
              </Link>
              <Link to="/gestion-catalogue-ecommerce" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Gestion Catalogue</h3>
                <p className="text-sm text-muted-foreground">PIM e-commerce professionnel</p>
              </Link>
              <Link to="/blog" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Blog E-commerce</h3>
                <p className="text-sm text-muted-foreground">Guides et conseils SEO</p>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">FAQ : Optimisation Shopify avec ShopOpti+</h2>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Optimisez votre Shopify dès aujourd'hui</h2>
            <p className="text-xl opacity-90 mb-8">
              Connectez votre boutique Shopify et laissez notre IA transformer vos fiches produits en machines à vendre SEO.
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

export default OptimisationShopifyPage;
