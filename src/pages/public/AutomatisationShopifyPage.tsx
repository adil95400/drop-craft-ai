import { Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { SEO } from '@/components/SEO';
import { BreadcrumbSchema, FAQSchema } from '@/components/seo/StructuredData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Zap, ShoppingCart, RefreshCw, BarChart3, ArrowRight, Clock, Globe, Shield, Sparkles } from 'lucide-react';

const faqItems = [
  { question: "Comment automatiser ma boutique Shopify avec ShopOpti+ ?", answer: "ShopOpti+ se connecte à votre boutique Shopify en quelques clics. Une fois connecté, l'IA automatise l'import de produits, la mise à jour des prix et stocks, le traitement des commandes et l'optimisation SEO de vos fiches produits." },
  { question: "L'automatisation Shopify fonctionne-t-elle en temps réel ?", answer: "Oui, ShopOpti+ synchronise vos données Shopify en temps réel. Les prix, stocks et commandes sont mis à jour automatiquement entre vos fournisseurs et votre boutique." },
  { question: "Quels processus Shopify puis-je automatiser ?", answer: "Vous pouvez automatiser l'import de produits, la gestion des prix dynamiques, la synchronisation des stocks, le fulfillment des commandes, l'optimisation SEO, les alertes de rupture de stock et les rapports analytics." },
  { question: "Est-ce compatible avec les apps Shopify existantes ?", answer: "Absolument. ShopOpti+ fonctionne en parallèle de vos apps Shopify existantes sans conflit. Notre API s'intègre via l'API officielle de Shopify." },
  { question: "Combien de temps gagne-t-on avec l'automatisation ?", answer: "Nos utilisateurs économisent en moyenne 20 heures par semaine grâce à l'automatisation des tâches répétitives comme la mise à jour des prix, la gestion des stocks et le traitement des commandes." },
];

export default function AutomatisationShopifyPage() {
  return (
    <PublicLayout>
      <SEO
        title="Automatisation Shopify IA | ShopOpti+ - Automatisez votre Boutique"
        description="Automatisez votre boutique Shopify avec l'IA de ShopOpti+. Import produits, gestion stocks, fulfillment commandes, pricing dynamique. Gagnez 20h/semaine."
        path="/automatisation-shopify"
        keywords="automatisation shopify, automatiser boutique shopify, shopify automatisation, auto order shopify, shopify dropshipping automatique"
      />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Automatisation Shopify", url: "https://shopopti.io/automatisation-shopify" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article className="container max-w-4xl mx-auto py-12 px-4 space-y-12">
        {/* Hero */}
        <header className="text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 border-primary/20 text-sm">Automatisation Shopify</Badge>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Automatisez votre boutique <span className="text-primary">Shopify</span> avec l'IA
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ShopOpti+ automatise l'intégralité de votre workflow Shopify : import produits, pricing dynamique, 
            fulfillment et optimisation SEO. Gagnez 20h par semaine et boostez vos ventes de 40%.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth?trial=true">Essai gratuit 14 jours <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/features">Découvrir les fonctionnalités</Link>
            </Button>
          </div>
        </header>

        {/* Problème */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Le problème : la gestion manuelle de Shopify</h2>
          <p className="text-muted-foreground text-lg">
            Gérer une boutique Shopify manuellement est chronophage et source d'erreurs. Mise à jour des prix, 
            synchronisation des stocks, traitement des commandes, optimisation des fiches produits… Ces tâches 
            répétitives vous empêchent de vous concentrer sur la croissance de votre business.
          </p>
          <p className="text-muted-foreground">
            Les e-commerçants passent en moyenne <strong className="text-foreground">25 heures par semaine</strong> sur des 
            tâches qui pourraient être entièrement automatisées. Sans automatisation, les erreurs de stock, les prix 
            désynchronisés et les commandes en retard impactent directement votre chiffre d'affaires et la satisfaction client.
          </p>
        </section>

        {/* Solution */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">La solution : l'automatisation intelligente ShopOpti+</h2>
          <p className="text-muted-foreground text-lg">
            ShopOpti+ connecte votre boutique Shopify à une plateforme d'automatisation propulsée par l'IA. 
            Chaque processus est optimisé automatiquement pour maximiser vos performances.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: ShoppingCart, title: "Fulfillment automatique", desc: "Les commandes sont transmises automatiquement à vos fournisseurs avec tracking intégré." },
              { icon: RefreshCw, title: "Synchronisation stocks", desc: "Stocks mis à jour en temps réel entre fournisseurs et boutique Shopify. Zéro rupture." },
              { icon: Zap, title: "Pricing dynamique IA", desc: "L'IA ajuste vos prix en fonction de la concurrence, la demande et vos marges cibles." },
              { icon: Sparkles, title: "SEO automatisé", desc: "Optimisation automatique des titres, descriptions et balises meta de vos produits." },
              { icon: BarChart3, title: "Analytics prédictifs", desc: "Prévisions de ventes et recommandations IA pour prendre de meilleures décisions." },
              { icon: Globe, title: "Multi-marketplace", desc: "Synchronisez Shopify avec Amazon, eBay, Etsy et 24+ marketplaces depuis un seul endroit." },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="pt-6 flex gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg h-fit">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Avantages */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Avantages de l'automatisation Shopify</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Gagnez 20h par semaine",
              "Réduisez les erreurs de 95%",
              "+40% de trafic organique",
              "Pricing optimisé par IA",
              "Stocks synchronisés 24/7",
              "Support prioritaire",
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <span className="font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Comment automatiser votre Shopify en 3 étapes</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Connectez votre boutique", desc: "Reliez votre boutique Shopify à ShopOpti+ en un clic. Notre intégration officielle Shopify garantit une connexion sécurisée et stable." },
              { step: "2", title: "Configurez vos automatisations", desc: "Choisissez les processus à automatiser : import produits, pricing, stocks, fulfillment. L'IA vous recommande les meilleures configurations." },
              { step: "3", title: "Laissez l'IA travailler", desc: "ShopOpti+ gère tout automatiquement 24/7. Suivez vos performances en temps réel depuis le dashboard et ajustez si nécessaire." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Preuve sociale */}
        <section className="space-y-6 bg-secondary/30 p-8 rounded-xl">
          <h2 className="text-3xl font-bold text-center">Ce que disent nos utilisateurs Shopify</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <blockquote className="bg-background p-6 rounded-lg border">
              <p className="italic text-muted-foreground mb-4">"Depuis que j'utilise ShopOpti+, ma boutique Shopify tourne quasiment en pilote automatique. J'ai gagné 15h par semaine et mes ventes ont augmenté de 35%."</p>
              <footer className="font-semibold">— Marie D., dropshippeuse Shopify</footer>
            </blockquote>
            <blockquote className="bg-background p-6 rounded-lg border">
              <p className="italic text-muted-foreground mb-4">"L'automatisation du pricing et des stocks a été un game changer. Plus aucune rupture de stock et mes marges sont optimisées automatiquement par l'IA."</p>
              <footer className="font-semibold">— Thomas L., e-commerçant multi-boutiques</footer>
            </blockquote>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Questions fréquentes sur l'automatisation Shopify</h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details key={i} className="border rounded-lg p-4 group">
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                  <h3>{item.question}</h3>
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="text-center space-y-6 py-8">
          <h2 className="text-3xl font-bold">Prêt à automatiser votre Shopify ?</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Rejoignez les e-commerçants qui automatisent leur Shopify avec ShopOpti+. Essai gratuit 14 jours, sans engagement.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth?trial=true">Commencer l'essai gratuit <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </section>

        {/* Maillage interne */}
        <nav className="space-y-4">
          <h2 className="text-2xl font-bold">Ressources complémentaires</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/optimisation-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Optimisation Shopify</h3>
              <p className="text-sm text-muted-foreground">Boostez votre boutique</p>
            </Link>
            <Link to="/outil-pricing-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Outil Pricing Shopify</h3>
              <p className="text-sm text-muted-foreground">Optimisez vos prix</p>
            </Link>
            <Link to="/import-produit-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Import Produit Shopify</h3>
              <p className="text-sm text-muted-foreground">Importez en masse</p>
            </Link>
            <Link to="/analyse-boutique-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Analyse Boutique Shopify</h3>
              <p className="text-sm text-muted-foreground">Analysez vos performances</p>
            </Link>
          </div>
        </nav>
      </article>
    </PublicLayout>
  );
}
