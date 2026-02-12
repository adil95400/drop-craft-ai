import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Zap, Globe, BarChart3, Package, Shield, Brain, Star, TrendingUp, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "Qu'est-ce qu'un logiciel de dropshipping ?", answer: "Un logiciel de dropshipping est une plateforme SaaS qui automatise la gestion d'une boutique en ligne sans stock. Il permet d'importer des produits depuis des fournisseurs, de synchroniser les stocks en temps réel, de traiter les commandes automatiquement et d'optimiser les fiches produits grâce à l'IA." },
  { question: "ShopOpti+ est-il adapté aux débutants ?", answer: "Oui, ShopOpti+ est conçu pour être accessible aux débutants tout en offrant des fonctionnalités avancées pour les professionnels. L'interface intuitive, les tutoriels intégrés et le support client réactif permettent de démarrer rapidement." },
  { question: "Combien de fournisseurs sont disponibles sur ShopOpti+ ?", answer: "ShopOpti+ intègre plus de 99 fournisseurs dont AliExpress, BigBuy, Spocket, CJ Dropshipping et bien d'autres. Vous pouvez également ajouter vos propres fournisseurs via CSV ou API." },
  { question: "ShopOpti+ est-il compatible avec Shopify ?", answer: "Oui, ShopOpti+ s'intègre nativement avec Shopify, WooCommerce, PrestaShop, Amazon, eBay et plus de 24 plateformes e-commerce. La synchronisation des produits et des stocks se fait en temps réel." },
  { question: "Combien coûte ShopOpti+ ?", answer: "ShopOpti+ propose un essai gratuit de 14 jours sans carte bancaire. Les plans payants démarrent à partir de 29€/mois avec un accès complet à toutes les fonctionnalités IA." },
  { question: "L'IA de ShopOpti+ est-elle vraiment efficace pour le SEO ?", answer: "Oui, notre IA propriétaire génère des titres, descriptions et balises meta optimisés pour le référencement Google. Les utilisateurs constatent en moyenne une amélioration de 40% de leur visibilité organique après optimisation." },
];

const LogicielDropshippingPage = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Logiciel Dropshipping IA | ShopOpti+ - Automatisation E-commerce"
        description="Découvrez ShopOpti+, le logiciel de dropshipping propulsé par l'IA. Importez des produits, optimisez vos fiches SEO et automatisez vos commandes. Essai gratuit 14 jours."
        path="/logiciel-dropshipping"
        keywords="logiciel dropshipping, logiciel dropshipping gratuit, outil dropshipping, plateforme dropshipping, automatisation dropshipping"
      />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Logiciel Dropshipping", url: "https://shopopti.io/logiciel-dropshipping" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <Badge className="mb-6 px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Zap className="h-4 w-4 mr-2" /> Logiciel Dropshipping #1 en France
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Le meilleur <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">logiciel de dropshipping</span> propulsé par l'IA
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
              ShopOpti+ automatise l'intégralité de votre business dropshipping : import de produits, optimisation SEO par IA, 
              synchronisation multi-plateformes et traitement automatique des commandes. Rejoignez des milliers d'entrepreneurs qui développent leur business avec notre logiciel de dropshipping.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate('/auth?trial=true')}>
                Essai gratuit 14 jours <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
                Voir les tarifs
              </Button>
            </div>
          </div>
        </section>

        {/* Why ShopOpti+ */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Pourquoi choisir ShopOpti+ comme logiciel de dropshipping ?</h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-3xl">
              Le marché du dropshipping évolue rapidement. En 2025, les entrepreneurs qui réussissent sont ceux qui utilisent des outils intelligents pour automatiser les tâches répétitives et se concentrer sur la stratégie. ShopOpti+ est le logiciel de dropshipping conçu pour cette nouvelle ère.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: Brain, title: "IA d'Optimisation", desc: "Génération automatique de titres SEO, descriptions et balises meta optimisés pour Google. Notre IA analyse la concurrence et propose les meilleures optimisations." },
                { icon: Globe, title: "Multi-Marketplace", desc: "Gérez Shopify, WooCommerce, Amazon, eBay et 20+ plateformes depuis un seul tableau de bord. Synchronisation des stocks en temps réel." },
                { icon: Package, title: "99+ Fournisseurs", desc: "Importez des produits depuis AliExpress, BigBuy, Spocket, CJ Dropshipping et 99+ fournisseurs en quelques clics avec mapping automatique." },
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

            <h3 className="text-2xl font-bold mb-4">Comment fonctionne notre logiciel de dropshipping ?</h3>
            <p className="text-muted-foreground mb-6">
              ShopOpti+ simplifie chaque étape de votre business dropshipping. Voici le processus en 4 étapes :
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {[
                { step: "1", title: "Importez", desc: "Sélectionnez vos produits depuis 99+ fournisseurs et importez-les en 1 clic dans votre catalogue." },
                { step: "2", title: "Optimisez", desc: "Notre IA optimise automatiquement les titres, descriptions et images pour maximiser votre SEO et vos conversions." },
                { step: "3", title: "Publiez", desc: "Publiez vos produits sur Shopify, Amazon, eBay et 20+ marketplaces simultanément." },
                { step: "4", title: "Automatisez", desc: "Les commandes sont traitées automatiquement avec suivi en temps réel et notifications clients." },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-3">{s.step}</div>
                  <h4 className="font-semibold mb-2">{s.title}</h4>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features détaillées */}
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl font-bold mb-10">Fonctionnalités clés de notre logiciel de dropshipping</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Optimisation SEO par Intelligence Artificielle</h3>
                <p className="text-muted-foreground mb-3">
                  Notre logiciel de dropshipping intègre une IA propriétaire qui analyse vos fiches produits et génère automatiquement des titres SEO optimisés, des descriptions engageantes et des balises meta ciblées. L'IA s'appuie sur l'analyse concurrentielle et les tendances de recherche Google pour maximiser votre visibilité organique. Les utilisateurs de ShopOpti+ constatent en moyenne une amélioration de 40% de leur trafic organique après optimisation IA.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Gestion Multi-Marketplace Centralisée</h3>
                <p className="text-muted-foreground mb-3">
                  Vendez sur Shopify, WooCommerce, PrestaShop, Amazon, eBay, Etsy et 20+ plateformes depuis un seul tableau de bord. Notre logiciel synchronise automatiquement les stocks, les prix et les descriptions entre toutes vos boutiques. Fini les ruptures de stock imprévues et les erreurs de prix entre les canaux de vente.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Analytics et Prévisions IA</h3>
                <p className="text-muted-foreground mb-3">
                  Prenez des décisions éclairées grâce à nos tableaux de bord analytiques en temps réel. Notre IA analyse vos données de ventes, identifie les produits les plus rentables et prédit les tendances futures. Vous disposez de KPIs clairs : marge brute par produit, taux de conversion par canal, ROAS et prévisions de revenus.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Sécurité et Conformité RGPD</h3>
                <p className="text-muted-foreground mb-3">
                  Votre logiciel de dropshipping doit protéger vos données et celles de vos clients. ShopOpti+ est conforme RGPD, utilise le chiffrement de bout en bout et effectue des sauvegardes automatiques quotidiennes. Notre infrastructure cloud garantit une disponibilité de 99.9%.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparaison */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl font-bold mb-6">ShopOpti+ vs autres logiciels de dropshipping</h2>
            <p className="text-muted-foreground mb-8">
              Contrairement aux logiciels de dropshipping traditionnels, ShopOpti+ intègre nativement l'intelligence artificielle pour optimiser chaque aspect de votre business.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                "IA d'optimisation SEO intégrée",
                "99+ fournisseurs connectés",
                "Synchronisation multi-marketplace temps réel",
                "Traitement automatique des commandes",
                "Analytics et prévisions par IA",
                "Support client prioritaire en français",
                "Conformité RGPD garantie",
                "Essai gratuit 14 jours sans CB",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Maillage interne */}
        <section className="py-12 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">Ressources complémentaires</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/alternative-autods" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Alternative à AutoDS</h3>
                <p className="text-sm text-muted-foreground">Comparez ShopOpti+ avec AutoDS</p>
              </Link>
              <Link to="/optimisation-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Optimisation Shopify</h3>
                <p className="text-sm text-muted-foreground">Boostez votre boutique Shopify</p>
              </Link>
              <Link to="/gestion-catalogue-ecommerce" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Gestion Catalogue</h3>
                <p className="text-sm text-muted-foreground">Gérez vos produits efficacement</p>
              </Link>
              <Link to="/blog" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Blog E-commerce</h3>
                <p className="text-sm text-muted-foreground">Guides et conseils dropshipping</p>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl font-bold mb-8">Questions fréquentes sur notre logiciel de dropshipping</h2>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à lancer votre business dropshipping ?</h2>
            <p className="text-xl opacity-90 mb-8">
              Rejoignez des milliers d'entrepreneurs qui utilisent notre logiciel de dropshipping pour automatiser et développer leur business en ligne.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => navigate('/auth?trial=true')}>
                Essai gratuit 14 jours <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" onClick={() => navigate('/features')}>
                Découvrir les fonctionnalités
              </Button>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
};

export default LogicielDropshippingPage;
