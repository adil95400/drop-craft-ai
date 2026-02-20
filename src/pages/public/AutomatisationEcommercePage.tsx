import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Brain, Globe, Package, BarChart3, Shield, TrendingUp, Sparkles, Settings, Clock, RefreshCw, Bot } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "Qu'est-ce que l'automatisation e-commerce ?", answer: "L'automatisation e-commerce consiste à utiliser des outils logiciels pour automatiser les tâches répétitives de votre boutique en ligne : import de produits, mise à jour des prix, gestion des commandes, optimisation SEO, envoi d'emails et suivi des performances." },
  { question: "Quelles tâches peut-on automatiser avec ShopOpti+ ?", answer: "ShopOpti+ automatise l'import de produits (17+ sources), l'optimisation SEO par IA, la gestion des prix dynamiques, le fulfillment automatique, le suivi des commandes, les alertes de stock, la génération de contenu et les rapports analytics." },
  { question: "L'automatisation remplace-t-elle le travail humain ?", answer: "Non, l'automatisation vous libère des tâches répétitives pour vous concentrer sur la stratégie et la croissance. ShopOpti+ automatise ce qui peut l'être tout en vous laissant le contrôle total sur les décisions importantes." },
  { question: "Combien de temps peut-on gagner ?", answer: "Nos utilisateurs rapportent un gain moyen de 15 à 20 heures par semaine grâce à l'automatisation complète : import produits, optimisation SEO, gestion des prix et suivi des commandes automatisés." },
  { question: "L'automatisation fonctionne-t-elle avec Shopify ?", answer: "Oui, ShopOpti+ s'intègre nativement avec Shopify, WooCommerce, PrestaShop et 20+ plateformes e-commerce. La synchronisation est bidirectionnelle et en temps réel." },
];

const automations = [
  { icon: Package, title: "Import automatique", desc: "Importez des produits depuis 17+ marketplaces en 1 clic avec l'extension Chrome. Import en masse et détection de doublons inclus.", tag: "Catalogue" },
  { icon: Brain, title: "Optimisation SEO par IA", desc: "Génération automatique de titres, descriptions et meta tags optimisés. Score SEO en temps réel avec recommandations actionnables.", tag: "SEO" },
  { icon: TrendingUp, title: "Pricing dynamique", desc: "Ajustement automatique des prix selon la concurrence, la demande et vos marges cibles. Règles de repricing personnalisables.", tag: "Prix" },
  { icon: RefreshCw, title: "Synchronisation stocks", desc: "Mise à jour automatique des stocks entre vos fournisseurs et vos boutiques. Alertes de rupture en temps réel.", tag: "Stock" },
  { icon: Bot, title: "Fulfillment automatique", desc: "Traitement automatique des commandes auprès de vos fournisseurs. Suivi des expéditions et notifications clients.", tag: "Commandes" },
  { icon: BarChart3, title: "Rapports automatisés", desc: "Génération quotidienne de rapports de performance, insights IA et recommandations d'optimisation envoyés par email.", tag: "Analytics" },
];

const metrics = [
  { value: "15h+", label: "Gagnées par semaine" },
  { value: "99+", label: "Fournisseurs connectés" },
  { value: "20+", label: "Plateformes e-commerce" },
  { value: "100%", label: "Automatisable" },
];

const AutomatisationEcommercePage = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Automatisation E-commerce | ShopOpti+ - IA & Dropshipping"
        description="Automatisez votre e-commerce avec ShopOpti+ : import produits, SEO IA, pricing dynamique, fulfillment auto. Gagnez 15h/semaine. Essai gratuit."
        path="/automatisation-ecommerce"
        keywords="automatisation ecommerce, automatiser boutique en ligne, automatisation dropshipping, logiciel automatisation ecommerce, ecommerce automation"
      />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Automatisation E-commerce", url: "https://shopopti.io/automatisation-ecommerce" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <Badge className="mb-6 px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Settings className="h-4 w-4 mr-2 animate-spin-slow" /> Automatisation complète
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Automatisez votre <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">e-commerce avec l'IA</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
              Importation, SEO, pricing, fulfillment, analytics : automatisez <strong className="text-foreground">100% de vos tâches répétitives</strong> et gagnez plus de 15 heures par semaine avec la plateforme d'automatisation e-commerce la plus complète du marché.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate('/auth?trial=true')}>
                Essai gratuit 14 jours <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/features')}>
                Voir les fonctionnalités
              </Button>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {metrics.map((m, i) => (
                <div key={i}>
                  <p className="text-4xl font-bold text-primary">{m.value}</p>
                  <p className="text-muted-foreground mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Automations Grid */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tout ce que vous pouvez automatiser</h2>
            <p className="text-lg text-muted-foreground mb-10">
              De l'import produits au reporting, chaque étape de votre business peut être automatisée.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {automations.map((auto, i) => (
                <Card key={i} className="border-border/50 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <auto.icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">{auto.tag}</Badge>
                    </div>
                    <CardTitle className="text-lg">{auto.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{auto.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Comment ça fonctionne</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Connectez vos boutiques</h3>
                <p className="text-muted-foreground">Liez vos comptes Shopify, WooCommerce ou PrestaShop en quelques clics. Synchronisation bidirectionnelle automatique.</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Configurez vos règles</h3>
                <p className="text-muted-foreground">Définissez vos marges, vos règles de repricing et vos workflows d'automatisation personnalisés.</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Laissez l'IA travailler</h3>
                <p className="text-muted-foreground">ShopOpti+ automatise tout : import, SEO, pricing, commandes et reporting. Vous gardez le contrôle total.</p>
              </div>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Automatisez votre business dès aujourd'hui</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez les entrepreneurs qui gagnent 15h+ par semaine grâce à l'automatisation ShopOpti+.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth?trial=true')}>
                Commencer gratuitement <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">Voir les tarifs</Link>
              </Button>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
};

export default AutomatisationEcommercePage;
