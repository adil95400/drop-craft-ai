import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, X, Zap, Brain, Globe, Package, BarChart3, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "Pourquoi chercher une alternative à AutoDS ?", answer: "AutoDS est un bon outil, mais il présente certaines limites : interface uniquement en anglais, IA basique sans optimisation SEO avancée, tarifs élevés pour les fonctionnalités premium, et support client limité en français. ShopOpti+ comble ces lacunes avec une IA plus puissante, une interface en français et un meilleur rapport qualité-prix." },
  { question: "Peut-on migrer ses produits depuis AutoDS vers ShopOpti+ ?", answer: "Oui, ShopOpti+ propose un import CSV compatible avec les exports AutoDS. Vous pouvez migrer l'intégralité de votre catalogue en quelques minutes, y compris les descriptions, prix et images." },
  { question: "ShopOpti+ est-il plus abordable qu'AutoDS ?", answer: "Oui, ShopOpti+ propose des tarifs compétitifs avec un essai gratuit de 14 jours sans carte bancaire. Les plans démarrent à 29€/mois avec un accès complet à l'IA, là où AutoDS facture des suppléments pour chaque fonctionnalité avancée." },
  { question: "Quelles plateformes ShopOpti+ supporte-t-il ?", answer: "ShopOpti+ s'intègre avec Shopify, WooCommerce, PrestaShop, Amazon, eBay, Etsy et 20+ plateformes e-commerce. La synchronisation est bidirectionnelle et en temps réel." },
  { question: "L'IA de ShopOpti+ est-elle meilleure que celle d'AutoDS ?", answer: "Notre IA propriétaire va bien au-delà de la simple traduction ou réécriture. Elle analyse la concurrence SEO, optimise les balises meta, génère des descriptions uniques et propose des stratégies de prix basées sur l'analyse du marché." },
];

const AlternativeAutodsPage = () => {
  const navigate = useNavigate();

  const comparison = [
    { feature: "IA d'optimisation SEO avancée", shopopti: true, autods: false },
    { feature: "Interface en français", shopopti: true, autods: false },
    { feature: "99+ fournisseurs intégrés", shopopti: true, autods: true },
    { feature: "Multi-marketplace (20+ canaux)", shopopti: true, autods: false },
    { feature: "Analytics prédictifs par IA", shopopti: true, autods: false },
    { feature: "Support client en français", shopopti: true, autods: false },
    { feature: "Essai gratuit sans CB", shopopti: true, autods: false },
    { feature: "Conformité RGPD", shopopti: true, autods: false },
    { feature: "API ouverte documentée", shopopti: true, autods: true },
    { feature: "Gestion de catalogue PIM", shopopti: true, autods: false },
  ];

  return (
    <PublicLayout>
      <SEO
        title="Alternative AutoDS | ShopOpti+ - Meilleure Alternative Française"
        description="ShopOpti+ est la meilleure alternative à AutoDS en français. IA SEO avancée, 99+ fournisseurs, multi-marketplace, analytics prédictifs. Essai gratuit 14 jours."
        path="/alternative-autods"
        keywords="alternative autods, remplacer autods, autods alternative, meilleur logiciel dropshipping, autods vs shopopti"
      />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Alternative AutoDS", url: "https://shopopti.io/alternative-autods" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <Badge className="mb-6 px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Zap className="h-4 w-4 mr-2" /> Alternative #1 à AutoDS
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              La meilleure <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">alternative à AutoDS</span> pour le dropshipping
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
              Vous cherchez une alternative à AutoDS plus puissante, en français et avec une IA SEO avancée ? ShopOpti+ offre tout ce qu'AutoDS propose — et bien plus — avec une interface intuitive, un support en français et des tarifs compétitifs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate('/auth?trial=true')}>
                Essai gratuit 14 jours <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
                Comparer les tarifs
              </Button>
            </div>
          </div>
        </section>

        {/* Tableau comparatif */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">ShopOpti+ vs AutoDS : comparaison détaillée</h2>
            <p className="text-lg text-muted-foreground mb-8">
              AutoDS est un outil populaire pour le dropshipping, mais il présente des limitations importantes pour les entrepreneurs francophones. Voici une comparaison objective des deux plateformes.
            </p>

            <div className="border rounded-lg overflow-hidden mb-12">
              <div className="grid grid-cols-3 bg-muted/50 p-4 font-semibold text-sm">
                <span>Fonctionnalité</span>
                <span className="text-center text-primary">ShopOpti+</span>
                <span className="text-center">AutoDS</span>
              </div>
              {comparison.map((row, i) => (
                <div key={i} className="grid grid-cols-3 p-4 border-t text-sm items-center">
                  <span>{row.feature}</span>
                  <span className="flex justify-center">{row.shopopti ? <CheckCircle className="h-5 w-5 text-primary" /> : <X className="h-5 w-5 text-muted-foreground" />}</span>
                  <span className="flex justify-center">{row.autods ? <CheckCircle className="h-5 w-5 text-muted-foreground" /> : <X className="h-5 w-5 text-muted-foreground" />}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Avantages clés */}
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Pourquoi ShopOpti+ surpasse AutoDS</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Une IA SEO infiniment plus puissante</h3>
                <p className="text-muted-foreground">
                  Là où AutoDS se limite à une traduction automatique basique, ShopOpti+ intègre une IA propriétaire qui analyse la concurrence SEO, identifie les mots-clés les plus rentables, génère des descriptions uniques optimisées pour Google et crée des balises meta ciblées. Résultat : vos produits se classent mieux dans les résultats de recherche et génèrent plus de trafic organique qualifié.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Multi-marketplace natif vs mono-canal</h3>
                <p className="text-muted-foreground">
                  AutoDS se concentre principalement sur eBay et Shopify. ShopOpti+ connecte votre catalogue à plus de 24 plateformes simultanément : Shopify, WooCommerce, PrestaShop, Amazon, eBay, Etsy, Cdiscount, Rakuten et bien plus. La synchronisation des stocks et des prix se fait en temps réel entre tous vos canaux.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Analytics prédictifs avancés</h3>
                <p className="text-muted-foreground">
                  ShopOpti+ va au-delà des simples statistiques de ventes. Notre IA analyse vos données historiques pour prédire les tendances, identifier les produits gagnants avant vos concurrents et optimiser vos marges automatiquement. Des fonctionnalités absentes chez AutoDS.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Support français et conformité RGPD</h3>
                <p className="text-muted-foreground">
                  Contrairement à AutoDS qui n'offre qu'un support en anglais, ShopOpti+ dispose d'une équipe de support client réactive en français. Notre plateforme est 100% conforme RGPD, un critère essentiel pour les entrepreneurs européens souvent négligé par les solutions américaines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Maillage interne */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">Ressources complémentaires</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/logiciel-dropshipping" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Logiciel Dropshipping</h3>
                <p className="text-sm text-muted-foreground">Guide complet du dropshipping</p>
              </Link>
              <Link to="/optimisation-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Optimisation Shopify</h3>
                <p className="text-sm text-muted-foreground">Boostez votre boutique Shopify</p>
              </Link>
              <Link to="/gestion-catalogue-ecommerce" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Gestion Catalogue</h3>
                <p className="text-sm text-muted-foreground">PIM e-commerce professionnel</p>
              </Link>
              <Link to="/features" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Fonctionnalités</h3>
                <p className="text-sm text-muted-foreground">Toutes nos fonctionnalités</p>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Questions fréquentes : AutoDS vs ShopOpti+</h2>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Passez à la meilleure alternative à AutoDS</h2>
            <p className="text-xl opacity-90 mb-8">
              Migrez vos produits en quelques minutes et découvrez une plateforme de dropshipping plus puissante, plus intelligente et en français.
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

export default AlternativeAutodsPage;
