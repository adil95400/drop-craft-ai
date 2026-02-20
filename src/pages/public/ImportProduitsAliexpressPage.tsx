import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Zap, Brain, Globe, Package, BarChart3, Shield, Download, MousePointer, Sparkles, Chrome } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "Comment importer des produits AliExpress en 1 clic ?", answer: "Installez l'extension Chrome ShopOpti+, naviguez sur AliExpress et cliquez sur le bouton 'Importer' qui apparaît sur chaque fiche produit. Le produit est automatiquement ajouté à votre catalogue avec toutes ses variantes, images et descriptions." },
  { question: "Les descriptions sont-elles optimisées automatiquement ?", answer: "Oui, notre IA réécrit automatiquement les descriptions AliExpress en textes SEO-friendly, professionnels et uniques. Fini le contenu traduit par Google Translate !" },
  { question: "Peut-on importer en masse depuis AliExpress ?", answer: "Oui, vous pouvez importer jusqu'à 100 produits simultanément depuis une page de résultats AliExpress. L'import en masse traite les variantes, prix et images automatiquement." },
  { question: "Les prix sont-ils automatiquement calculés ?", answer: "ShopOpti+ applique vos règles de pricing automatiquement : marge fixe, multiplicateur, ou prix psychologique. Le calcul de rentabilité est intégré avec prise en compte des frais de livraison." },
  { question: "L'extension fonctionne-t-elle avec d'autres fournisseurs ?", answer: "Oui ! L'extension ShopOpti+ fonctionne sur AliExpress, Amazon, CJDropshipping, Temu, Shein, eBay et 17+ marketplaces. Un seul outil pour tous vos fournisseurs." },
];

const steps = [
  { step: "1", icon: Chrome, title: "Installez l'extension", desc: "Ajoutez l'extension Chrome ShopOpti+ en 30 secondes. Gratuite et sans configuration." },
  { step: "2", icon: MousePointer, title: "Naviguez sur AliExpress", desc: "Parcourez AliExpress normalement. Un bouton 'Importer' apparaît sur chaque produit." },
  { step: "3", icon: Download, title: "Importez en 1 clic", desc: "Cliquez sur Importer : variantes, images, descriptions et prix sont récupérés automatiquement." },
  { step: "4", icon: Sparkles, title: "Optimisez avec l'IA", desc: "Notre IA réécrit les descriptions, optimise le SEO et calcule votre marge de profit." },
];

const features = [
  { icon: Brain, title: "Réécriture IA des descriptions", desc: "Transformez les descriptions AliExpress en textes professionnels et SEO-optimisés en un clic." },
  { icon: Package, title: "Import des variantes complet", desc: "Toutes les tailles, couleurs et options sont importées avec leurs images et prix respectifs." },
  { icon: BarChart3, title: "Calcul de marge intégré", desc: "Visualisez votre profit instantanément avec prise en compte des coûts produit, livraison et taxes." },
  { icon: Globe, title: "17+ marketplaces supportées", desc: "AliExpress, Amazon, CJ, Temu, Shein, eBay, Etsy, Cdiscount et bien d'autres." },
  { icon: Shield, title: "Détection de doublons", desc: "L'IA détecte les produits déjà dans votre catalogue pour éviter les imports en double." },
  { icon: Zap, title: "Import en masse", desc: "Importez jusqu'à 100 produits simultanément depuis une page de recherche AliExpress." },
];

const ImportProduitsAliexpressPage = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Import Produits AliExpress | ShopOpti+ - Import 1 Clic"
        description="Importez des produits AliExpress en 1 clic avec l'extension Chrome ShopOpti+. IA SEO, calcul de marge, 17+ marketplaces. Essai gratuit."
        path="/import-produits-aliexpress"
        keywords="import aliexpress, importer produits aliexpress, extension chrome aliexpress, dropshipping aliexpress, import aliexpress shopify"
      />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Import Produits AliExpress", url: "https://shopopti.io/import-produits-aliexpress" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <Badge className="mb-6 px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <Download className="h-4 w-4 mr-2" /> Import AliExpress en 1 clic
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Importez des produits <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">AliExpress en 1 clic</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
              L'extension Chrome ShopOpti+ vous permet d'importer n'importe quel produit AliExpress dans votre boutique en un seul clic. Descriptions réécrites par IA, variantes complètes, calcul de marge automatique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate('/extensions/download')}>
                Télécharger l'extension <Chrome className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth?trial=true')}>
                Essai gratuit 14 jours
              </Button>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-lg text-muted-foreground mb-10">
              4 étapes simples pour importer vos produits AliExpress.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s, i) => (
                <Card key={i} className="border-border/50 relative hover:shadow-lg transition-shadow">
                  <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {s.step}
                  </div>
                  <CardHeader className="pt-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <s.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Fonctionnalités d'import avancées</h2>
            <p className="text-lg text-muted-foreground mb-10">
              Bien plus qu'un simple importeur : un outil complet d'optimisation de catalogue.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <Card key={i} className="border-border/50 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <f.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-primary">17+</p>
                <p className="text-muted-foreground mt-1">Marketplaces supportées</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">1 clic</p>
                <p className="text-muted-foreground mt-1">Pour importer un produit</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">100</p>
                <p className="text-muted-foreground mt-1">Produits importés en masse</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">IA</p>
                <p className="text-muted-foreground mt-1">Optimisation automatique</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10">Questions fréquentes</h2>
            <div className="space-y-6">
              {faqItems.map((faq, i) => (
                <div key={i} className="border rounded-lg p-6 bg-background">
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Commencez à importer dès maintenant</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Installez l'extension gratuite et importez vos premiers produits AliExpress en moins de 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/extensions/download')}>
                Installer l'extension Chrome <Chrome className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/features">Toutes les fonctionnalités</Link>
              </Button>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
};

export default ImportProduitsAliexpressPage;
