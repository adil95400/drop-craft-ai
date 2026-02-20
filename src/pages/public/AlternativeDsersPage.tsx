import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, X, Zap, Brain, Globe, Package, BarChart3, Shield, TrendingUp, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "Pourquoi chercher une alternative à DSers ?", answer: "DSers se concentre principalement sur AliExpress et manque de fonctionnalités avancées comme l'IA SEO, l'analyse prédictive et le multi-marketplace. ShopOpti+ offre une solution complète avec 99+ fournisseurs, une IA d'optimisation et des analytics avancés." },
  { question: "Peut-on migrer ses produits depuis DSers ?", answer: "Oui, ShopOpti+ supporte l'import CSV compatible avec les exports DSers et Shopify. Migrez votre catalogue complet en quelques minutes avec descriptions, prix, variantes et images." },
  { question: "ShopOpti+ fonctionne-t-il avec AliExpress comme DSers ?", answer: "Oui, et bien plus. ShopOpti+ s'intègre avec AliExpress, CJDropshipping, Spocket, Zendrop et 99+ fournisseurs. Notre extension Chrome permet l'import en 1 clic depuis toutes ces plateformes." },
  { question: "Quels avantages par rapport à DSers pour le SEO ?", answer: "DSers ne propose aucune optimisation SEO. ShopOpti+ inclut un moteur IA qui génère des titres, descriptions et meta tags optimisés pour le référencement, avec un score SEO en temps réel et des recommandations actionnables." },
  { question: "Le support est-il disponible en français ?", answer: "Oui, contrairement à DSers, ShopOpti+ offre une interface et un support client entièrement en français, avec une documentation complète et une académie de formation." },
];

const AlternativeDsersPage = () => {
  const navigate = useNavigate();

  const comparison = [
    { feature: "IA d'optimisation SEO", shopopti: true, dsers: false },
    { feature: "99+ fournisseurs intégrés", shopopti: true, dsers: false },
    { feature: "Multi-marketplace (20+ canaux)", shopopti: true, dsers: false },
    { feature: "Import AliExpress 1 clic", shopopti: true, dsers: true },
    { feature: "Analytics prédictifs IA", shopopti: true, dsers: false },
    { feature: "Interface en français", shopopti: true, dsers: false },
    { feature: "Auto-fulfillment", shopopti: true, dsers: true },
    { feature: "Gestion de catalogue PIM", shopopti: true, dsers: false },
    { feature: "Score SEO produits", shopopti: true, dsers: false },
    { feature: "Extension Chrome avancée", shopopti: true, dsers: true },
  ];

  const advantages = [
    { icon: Brain, title: "IA SEO avancée", desc: "Génération automatique de descriptions, titres et meta tags optimisés pour le référencement naturel." },
    { icon: Globe, title: "Multi-fournisseurs", desc: "99+ fournisseurs contre AliExpress uniquement. CJDropshipping, Spocket, Zendrop et plus." },
    { icon: BarChart3, title: "Analytics prédictifs", desc: "Prévisions de ventes, analyse de rentabilité et insights business propulsés par l'IA." },
    { icon: Shield, title: "Conformité RGPD", desc: "Hébergement européen, données sécurisées et conformité totale au règlement RGPD." },
    { icon: TrendingUp, title: "Recherche produits", desc: "Scanner de tendances, analyse de saturation et détection de produits viraux intégrés." },
    { icon: Package, title: "Gestion catalogue PIM", desc: "Enrichissement automatique, gestion des variantes et publication multi-canaux centralisée." },
  ];

  return (
    <PublicLayout>
      <SEO
        title="Alternative DSers | ShopOpti+ - Meilleure Alternative 2025"
        description="ShopOpti+ est la meilleure alternative à DSers. IA SEO, 99+ fournisseurs, multi-marketplace, analytics prédictifs. Plus puissant que DSers. Essai gratuit."
        path="/alternative-dsers"
        keywords="alternative dsers, remplacer dsers, dsers alternative, meilleur logiciel dropshipping, dsers vs shopopti"
      />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Alternative DSers", url: "https://shopopti.io/alternative-dsers" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <Badge className="mb-6 px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Zap className="h-4 w-4 mr-2" /> Alternative #1 à DSers en 2025
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              La meilleure <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">alternative à DSers</span> pour le dropshipping
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
              DSers se limite à AliExpress ? Passez à ShopOpti+ : <strong className="text-foreground">99+ fournisseurs</strong>, IA SEO avancée, analytics prédictifs et interface 100% française. Tout ce que DSers ne fait pas, nous le faisons.
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

        {/* Comparison Table */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ShopOpti+ vs DSers : comparaison complète</h2>
            <p className="text-lg text-muted-foreground mb-8">
              DSers est populaire pour sa connexion AliExpress, mais il manque de fonctionnalités essentielles pour scaler un business e-commerce. Voici un comparatif objectif.
            </p>

            <div className="border rounded-lg overflow-hidden mb-12">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 font-semibold">Fonctionnalité</th>
                    <th className="text-center p-4 font-semibold text-primary">ShopOpti+</th>
                    <th className="text-center p-4 font-semibold">DSers</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center">
                        {row.shopopti ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />}
                      </td>
                      <td className="p-4 text-center">
                        {row.dsers ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Advantages */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ce que ShopOpti+ fait de plus que DSers</h2>
            <p className="text-lg text-muted-foreground mb-10">
              Des fonctionnalités avancées que DSers ne propose tout simplement pas.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advantages.map((adv, i) => (
                <Card key={i} className="border-border/50 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <adv.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{adv.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{adv.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10">Questions fréquentes</h2>
            <div className="space-y-6">
              {faqItems.map((faq, i) => (
                <div key={i} className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à passer au niveau supérieur ?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez les milliers d'entrepreneurs qui ont choisi ShopOpti+ comme alternative à DSers. Essai gratuit, sans engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth?trial=true')}>
                Commencer gratuitement <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/features">Découvrir les fonctionnalités</Link>
              </Button>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
};

export default AlternativeDsersPage;
