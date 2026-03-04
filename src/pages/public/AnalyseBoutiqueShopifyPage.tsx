import { Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { SEO } from '@/components/SEO';
import { BreadcrumbSchema, FAQSchema } from '@/components/seo/StructuredData';
import { HreflangTags } from '@/components/seo/HreflangTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, BarChart3, TrendingUp, Target, Eye, ArrowRight, Sparkles, DollarSign, Users, Search } from 'lucide-react';

const faqItems = [
  { question: "Que comprend l'analyse de boutique Shopify de ShopOpti+ ?", answer: "L'analyse couvre 6 domaines : performance SEO (score 0-100), analytics de vente, analyse concurrentielle, audit des fiches produits, santé technique du site et métriques d'engagement client." },
  { question: "Comment fonctionne l'audit SEO de ma boutique Shopify ?", answer: "L'IA scanne chaque page de votre boutique et évalue les balises title, meta descriptions, structure H1-H6, vitesse de chargement, mobile-friendliness et optimisation des images. Un score SEO global et des recommandations actionnables sont générés." },
  { question: "Puis-je comparer mes performances avec la concurrence ?", answer: "Oui, ShopOpti+ vous permet de suivre les métriques de vos concurrents : prix, positionnement SEO, catalogue produits et stratégie marketing. Vous recevez des rapports comparatifs hebdomadaires." },
  { question: "Les données analytics sont-elles en temps réel ?", answer: "Oui, les métriques de vente, de trafic et d'engagement sont mises à jour en temps réel. Les rapports prévisionnels IA sont recalculés quotidiennement." },
  { question: "Comment améliorer mon score de boutique ?", answer: "Après chaque analyse, l'IA génère des recommandations priorisées par impact. Vous pouvez appliquer les optimisations en un clic (SEO, descriptions, images) ou les planifier." },
];

export default function AnalyseBoutiqueShopifyPage() {
  return (
    <PublicLayout>
      <SEO
        title="Analyse Boutique Shopify | ShopOpti+ - Audit & Analytics IA"
        description="Analysez votre boutique Shopify avec l'IA : audit SEO, analytics de vente, analyse concurrentielle, rapport performance. Score et recommandations instantanés."
        path="/analyse-boutique-shopify"
        keywords="analyse boutique shopify, audit shopify, analytics shopify, performance shopify, audit seo shopify, analyse concurrentielle shopify"
      />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Analyse Boutique Shopify", url: "https://shopopti.io/analyse-boutique-shopify" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article className="container max-w-4xl mx-auto py-12 px-4 space-y-12">
        <header className="text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 border-primary/20 text-sm">Analyse Boutique Shopify</Badge>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Analysez votre boutique <span className="text-primary">Shopify</span> avec l'IA
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Obtenez un audit complet de votre boutique Shopify en quelques secondes : SEO, ventes, concurrence, 
            performance technique. Recevez des recommandations IA actionnables.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth?trial=true">Analyser ma boutique gratuitement <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </header>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Pourquoi analyser votre boutique Shopify ?</h2>
          <p className="text-muted-foreground text-lg">
            Une boutique Shopify performante ne se limite pas à de beaux produits. Le référencement, la vitesse de 
            chargement, la conversion et l'expérience utilisateur sont des facteurs critiques que la plupart des 
            e-commerçants négligent faute d'outils adaptés.
          </p>
          <p className="text-muted-foreground">
            ShopOpti+ fournit une <strong className="text-foreground">analyse à 360°</strong> de votre boutique avec des 
            métriques concrètes et des recommandations classées par priorité d'impact sur vos ventes.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Les 6 piliers de notre analyse</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Search, title: "Audit SEO complet", desc: "Score SEO 0-100, analyse des balises, structure de contenu, vitesse mobile, liens internes et recommandations IA." },
              { icon: BarChart3, title: "Analytics de ventes", desc: "Chiffre d'affaires, panier moyen, taux de conversion, produits top et flop, tendances saisonnières." },
              { icon: Target, title: "Analyse concurrentielle", desc: "Benchmark prix, positionnement marché, catalogue concurrent, stratégies SEO et marketing identifiées." },
              { icon: Eye, title: "Audit fiches produits", desc: "Qualité des titres, descriptions, images, variantes. Score par produit avec suggestions d'amélioration IA." },
              { icon: TrendingUp, title: "Performance technique", desc: "Core Web Vitals (LCP, CLS, FID), vitesse de chargement, optimisation mobile, erreurs techniques." },
              { icon: Users, title: "Engagement client", desc: "Taux de rebond, pages par session, durée moyenne, parcours d'achat, points de friction identifiés." },
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

        <section className="space-y-6 bg-secondary/30 p-8 rounded-xl">
          <h2 className="text-3xl font-bold text-center">Métriques clés suivies par ShopOpti+</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              "Score SEO global",
              "Core Web Vitals",
              "Taux de conversion",
              "Panier moyen",
              "Taux de rebond",
              "Positionnement mots-clés",
              "Vitesse mobile",
              "Qualité des fiches",
              "ROI publicitaire",
            ].map((metric, i) => (
              <div key={i} className="flex items-center gap-2 p-3">
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                <span className="text-sm font-medium">{metric}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Comment lancer votre analyse</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Connectez votre boutique", desc: "Reliez votre Shopify à ShopOpti+ via l'API officielle. Connexion sécurisée en moins de 2 minutes." },
              { step: "2", title: "Lancez l'audit IA", desc: "Notre IA scanne l'ensemble de votre boutique : pages, produits, performance technique, SEO et concurrence." },
              { step: "3", title: "Recevez votre rapport", desc: "Un rapport détaillé avec scores, recommandations priorisées et actions en 1 clic pour améliorer votre boutique." },
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
          <h2 className="text-3xl font-bold">Analysez votre boutique gratuitement</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Recevez votre audit complet avec score et recommandations. Essai gratuit 14 jours, sans engagement.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth?trial=true">Lancer l'analyse gratuite <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </section>

        <nav className="space-y-4">
          <h2 className="text-2xl font-bold">Ressources complémentaires</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/optimisation-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Optimisation Shopify</h3>
              <p className="text-sm text-muted-foreground">Boostez votre SEO</p>
            </Link>
            <Link to="/automatisation-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Automatisation Shopify</h3>
              <p className="text-sm text-muted-foreground">Automatisez tout</p>
            </Link>
            <Link to="/outil-pricing-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Outil Pricing</h3>
              <p className="text-sm text-muted-foreground">Optimisez vos prix</p>
            </Link>
            <Link to="/alternative-autods" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Alternative AutoDS</h3>
              <p className="text-sm text-muted-foreground">Comparez les solutions</p>
            </Link>
          </div>
        </nav>
      </article>
    </PublicLayout>
  );
}
