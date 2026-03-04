import { Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { SEO } from '@/components/SEO';
import { BreadcrumbSchema, FAQSchema } from '@/components/seo/StructuredData';
import { HreflangTags } from '@/components/seo/HreflangTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, DollarSign, TrendingUp, Target, BarChart3, ArrowRight, Sparkles, Shield, RefreshCw, Zap } from 'lucide-react';

const faqItems = [
  { question: "Comment fonctionne l'outil de pricing Shopify de ShopOpti+ ?", answer: "Notre outil analyse en temps réel les prix de la concurrence, la demande du marché et vos coûts pour recommander le prix optimal. L'IA ajuste automatiquement vos prix sur Shopify pour maximiser vos marges tout en restant compétitif." },
  { question: "Le pricing dynamique est-il compatible avec toutes les boutiques Shopify ?", answer: "Oui, l'outil de pricing fonctionne avec toutes les boutiques Shopify (Basic, Shopify, Advanced et Plus). Il se connecte via l'API officielle Shopify et met à jour les prix en temps réel." },
  { question: "Puis-je définir des règles de prix personnalisées ?", answer: "Absolument. Vous pouvez définir des marges minimales, des prix planchers/plafonds, des règles par catégorie et des stratégies de pricing (cost-plus, competitive, value-based). L'IA respecte toujours vos contraintes." },
  { question: "Combien de produits puis-je optimiser ?", answer: "Avec le plan Pro, vous pouvez optimiser jusqu'à 10 000 produits simultanément. Le plan Enterprise offre un nombre illimité de produits avec des stratégies de pricing avancées." },
  { question: "L'outil suit-il les prix des concurrents ?", answer: "Oui, ShopOpti+ surveille les prix de vos concurrents sur Shopify, Amazon, eBay et autres marketplaces. Vous recevez des alertes en temps réel et l'IA peut ajuster vos prix automatiquement." },
];

export default function OutilPricingShopifyPage() {
  return (
    <PublicLayout>
      <SEO
        title="Outil Pricing Shopify IA | ShopOpti+ - Optimisez vos Prix"
        description="Optimisez vos prix Shopify avec l'IA de ShopOpti+. Pricing dynamique, veille concurrentielle, marges optimisées automatiquement. Augmentez vos profits de 25%."
        path="/outil-pricing-shopify"
        keywords="outil pricing shopify, prix shopify, pricing dynamique shopify, optimisation prix shopify, repricing shopify, shopify price optimization"
      />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Outil Pricing Shopify", url: "https://shopopti.io/outil-pricing-shopify" },
      ]} />
      <FAQSchema questions={faqItems} />
      <HreflangTags entries={[
        { lang: "fr", href: "https://shopopti.io/outil-pricing-shopify" },
        { lang: "en", href: "https://shopopti.io/shopify-pricing-automation" },
      ]} xDefault="https://shopopti.io/shopify-pricing-automation" />

      <article className="container max-w-4xl mx-auto py-12 px-4 space-y-12">
        <header className="text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 border-primary/20 text-sm">Pricing Shopify</Badge>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Outil de pricing <span className="text-primary">Shopify</span> propulsé par l'IA
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Maximisez vos marges avec le pricing dynamique intelligent de ShopOpti+. L'IA analyse la concurrence, 
            la demande et vos coûts pour trouver le prix parfait pour chaque produit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth?trial=true">Essai gratuit 14 jours <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing">Voir les tarifs</Link>
            </Button>
          </div>
        </header>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Le défi du pricing sur Shopify</h2>
          <p className="text-muted-foreground text-lg">
            Fixer le bon prix sur Shopify est un exercice d'équilibre délicat. Trop cher, vous perdez des clients. 
            Trop bas, vous sacrifiez vos marges. La concurrence évolue constamment, les coûts fournisseurs fluctuent, 
            et la demande varie selon les saisons.
          </p>
          <p className="text-muted-foreground">
            Sans outil dédié, la gestion des prix sur une boutique de <strong className="text-foreground">plusieurs centaines de produits</strong> devient 
            impossible à maintenir manuellement. Résultat : des marges sous-optimales et des opportunités manquées.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Comment ShopOpti+ optimise vos prix Shopify</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: TrendingUp, title: "Pricing dynamique IA", desc: "L'algorithme analyse 15+ facteurs (concurrence, demande, saisonnalité, coûts) pour ajuster vos prix en continu." },
              { icon: Target, title: "Veille concurrentielle", desc: "Surveillance automatique des prix concurrents sur Shopify, Amazon, eBay. Alertes et ajustements en temps réel." },
              { icon: DollarSign, title: "Protection des marges", desc: "Définissez vos marges minimales et l'IA s'assure que vos prix ne descendent jamais en dessous de vos seuils." },
              { icon: BarChart3, title: "Analytics pricing", desc: "Visualisez l'impact de chaque changement de prix sur vos ventes, marges et positionnement marché." },
              { icon: Sparkles, title: "Recommandations IA", desc: "Recevez des suggestions de prix basées sur l'analyse de données historiques et les tendances du marché." },
              { icon: RefreshCw, title: "Sync multi-canal", desc: "Les prix sont synchronisés sur tous vos canaux de vente (Shopify, marketplaces, comparateurs) simultanément." },
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

        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Résultats concrets</h2>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { value: "+25%", label: "Augmentation des marges" },
              { value: "-15%", label: "Réduction des invendus" },
              { value: "24/7", label: "Surveillance automatique" },
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-secondary/30 rounded-xl">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Stratégies de pricing disponibles</h2>
          <div className="space-y-4">
            {[
              { title: "Cost-Plus Pricing", desc: "Appliquez une marge fixe ou en pourcentage sur vos coûts fournisseurs. Idéal pour garantir une rentabilité constante." },
              { title: "Competitive Pricing", desc: "Alignez automatiquement vos prix sur ceux de la concurrence, avec la possibilité de vous positionner légèrement en dessous ou au-dessus." },
              { title: "Value-Based Pricing", desc: "L'IA évalue la valeur perçue de chaque produit et fixe un prix qui maximise le revenu basé sur l'élasticité de la demande." },
              { title: "Bundle Pricing", desc: "Créez des offres groupées avec des prix calculés pour augmenter le panier moyen tout en maintenant des marges saines." },
            ].map((strategy, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">{strategy.title}</h3>
                <p className="text-muted-foreground mt-1">{strategy.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Questions fréquentes</h2>
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

        <section className="text-center space-y-6 py-8">
          <h2 className="text-3xl font-bold">Optimisez vos prix Shopify dès maintenant</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Essayez l'outil de pricing IA de ShopOpti+ gratuitement pendant 14 jours. Sans engagement.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth?trial=true">Démarrer l'essai gratuit <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </section>

        <nav className="space-y-4">
          <h2 className="text-2xl font-bold">Ressources complémentaires</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/automatisation-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Automatisation Shopify</h3>
              <p className="text-sm text-muted-foreground">Automatisez tout</p>
            </Link>
            <Link to="/optimisation-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Optimisation Shopify</h3>
              <p className="text-sm text-muted-foreground">Boostez votre SEO</p>
            </Link>
            <Link to="/import-produit-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Import Produit</h3>
              <p className="text-sm text-muted-foreground">Importez en masse</p>
            </Link>
            <Link to="/analyse-boutique-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Analyse Boutique</h3>
              <p className="text-sm text-muted-foreground">KPIs & analytics</p>
            </Link>
          </div>
        </nav>
      </article>
    </PublicLayout>
  );
}
