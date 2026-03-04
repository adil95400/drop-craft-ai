import { Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { SEO } from '@/components/SEO';
import { BreadcrumbSchema, FAQSchema } from '@/components/seo/StructuredData';
import { HreflangTags } from '@/components/seo/HreflangTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Package, Upload, Globe, Sparkles, ArrowRight, Zap, Shield, Clock, RefreshCw } from 'lucide-react';

const faqItems = [
  { question: "Comment importer des produits sur Shopify avec ShopOpti+ ?", answer: "Connectez votre boutique Shopify à ShopOpti+, recherchez des produits parmi 99+ fournisseurs (AliExpress, BigBuy, CJDropshipping…), sélectionnez ceux qui vous intéressent et importez-les en un clic. L'IA optimise automatiquement les titres, descriptions et images." },
  { question: "Combien de produits puis-je importer à la fois ?", answer: "Avec le plan Pro, vous pouvez importer jusqu'à 10 000 produits simultanément. L'import par lot permet de traiter des centaines de produits en quelques minutes avec optimisation IA automatique." },
  { question: "Les variantes produits sont-elles gérées ?", answer: "Oui, ShopOpti+ gère toutes les variantes (taille, couleur, matière…) et les importe correctement sur Shopify avec les prix et stocks correspondants pour chaque variante." },
  { question: "Les images sont-elles optimisées automatiquement ?", answer: "Oui, l'IA compresse et optimise les images produits pour le web (WebP, lazy loading) et génère automatiquement les textes alt SEO pour améliorer votre référencement Google Images." },
  { question: "Depuis quels fournisseurs puis-je importer ?", answer: "ShopOpti+ se connecte à 99+ fournisseurs : AliExpress, BigBuy, CJDropshipping, Spocket, SaleHoo, Printful, et bien d'autres. De nouveaux fournisseurs sont ajoutés chaque mois." },
];

export default function ImportProduitShopifyPage() {
  return (
    <PublicLayout>
      <SEO
        title="Import Produit Shopify | ShopOpti+ - Importez en Masse avec l'IA"
        description="Importez des produits sur Shopify depuis 99+ fournisseurs en un clic. Optimisation IA des fiches, images et SEO. Import par lot. Essai gratuit 14 jours."
        path="/import-produit-shopify"
        keywords="import produit shopify, importer produit shopify, import produits shopify, shopify import produit, import csv shopify, import aliexpress shopify"
      />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Import Produit Shopify", url: "https://shopopti.io/import-produit-shopify" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article className="container max-w-4xl mx-auto py-12 px-4 space-y-12">
        <header className="text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 border-primary/20 text-sm">Import Produit Shopify</Badge>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Importez des produits sur <span className="text-primary">Shopify</span> en un clic
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Accédez à un catalogue de 99+ fournisseurs et importez des milliers de produits sur votre boutique 
            Shopify avec optimisation IA automatique des fiches produits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth?trial=true">Essai gratuit 14 jours <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/integrations">Voir les fournisseurs</Link>
            </Button>
          </div>
        </header>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Pourquoi l'import de produits Shopify est crucial</h2>
          <p className="text-muted-foreground text-lg">
            Le succès d'une boutique Shopify dépend largement de la qualité et de la variété de son catalogue produits. 
            Mais importer manuellement des produits est fastidieux : copier-coller les titres, télécharger les images, 
            rédiger les descriptions, configurer les variantes…
          </p>
          <p className="text-muted-foreground">
            Avec ShopOpti+, l'import de produits devient un processus <strong className="text-foreground">automatisé et intelligent</strong>. 
            L'IA s'occupe de tout : de la sélection des produits gagnants à l'optimisation SEO des fiches, en passant 
            par la compression des images et la gestion des variantes.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Fonctionnalités d'import ShopOpti+</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Upload, title: "Import en 1 clic", desc: "Sélectionnez un produit chez n'importe quel fournisseur et importez-le sur Shopify instantanément." },
              { icon: Package, title: "Import par lot", desc: "Importez des centaines de produits simultanément avec notre outil de traitement par lot." },
              { icon: Sparkles, title: "Optimisation IA", desc: "L'IA réécrit les titres, descriptions et balises SEO pour maximiser votre référencement Google." },
              { icon: Globe, title: "99+ fournisseurs", desc: "AliExpress, BigBuy, CJDropshipping, Spocket, Printful et bien d'autres intégrés nativement." },
              { icon: RefreshCw, title: "Sync automatique", desc: "Prix et stocks mis à jour automatiquement depuis les fournisseurs vers votre boutique Shopify." },
              { icon: Shield, title: "Import sécurisé", desc: "Détection des produits à risque (contrefaçons, marques déposées) avant import sur votre boutique." },
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
          <h2 className="text-3xl font-bold">Import Shopify en 4 étapes simples</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Recherchez des produits", desc: "Explorez le catalogue de 99+ fournisseurs. Filtrez par catégorie, prix, délai de livraison, avis et popularité." },
              { step: "2", title: "Sélectionnez et personnalisez", desc: "Choisissez vos produits et personnalisez les fiches : titres, descriptions, prix, variantes. L'IA vous aide avec des suggestions." },
              { step: "3", title: "Optimisez avec l'IA", desc: "En un clic, l'IA optimise le SEO de vos fiches, compresse les images et génère des descriptions uniques et persuasives." },
              { step: "4", title: "Publiez sur Shopify", desc: "Importez les produits sur votre boutique Shopify. Ils sont immédiatement disponibles à la vente avec stocks synchronisés." },
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
          <h2 className="text-3xl font-bold">Fournisseurs compatibles</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {["AliExpress", "BigBuy", "CJDropshipping", "Spocket", "SaleHoo", "Printful", "Printify", "Modalyst", "Doba", "Worldwide Brands", "Inventory Source", "Syncee"].map((supplier, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                <span className="text-sm font-medium">{supplier}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">Et plus de 87 autres fournisseurs intégrés…</p>
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
          <h2 className="text-3xl font-bold">Prêt à remplir votre catalogue Shopify ?</h2>
          <Button size="lg" asChild>
            <Link to="/auth?trial=true">Commencer l'import gratuit <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
            <Link to="/import-produits-aliexpress" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Import AliExpress</h3>
              <p className="text-sm text-muted-foreground">Guide AliExpress</p>
            </Link>
            <Link to="/logiciel-dropshipping" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
              <h3 className="font-semibold mb-1">Logiciel Dropshipping</h3>
              <p className="text-sm text-muted-foreground">Solution complète</p>
            </Link>
          </div>
        </nav>
      </article>
    </PublicLayout>
  );
}
