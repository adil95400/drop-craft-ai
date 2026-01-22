import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Minus, Crown, Zap, Shield, Globe, ArrowRight, Download, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const ExtensionComparisonPage = () => {
  const features = [
    {
      category: 'Import de Produits',
      items: [
        { name: 'Import 1-clic', shopopti: true, autods: true, cartifind: true },
        { name: 'Import bulk (multiple)', shopopti: true, autods: true, cartifind: false },
        { name: 'Import vers multi-boutiques', shopopti: true, autods: true, cartifind: false },
        { name: 'Détection Shopify universelle', shopopti: true, autods: true, cartifind: true },
        { name: 'Import depuis AliExpress', shopopti: true, autods: true, cartifind: true },
        { name: 'Import depuis Amazon', shopopti: true, autods: true, cartifind: true },
        { name: 'Import depuis Temu', shopopti: true, autods: false, cartifind: false },
        { name: 'Import depuis Cdiscount/Fnac', shopopti: true, autods: false, cartifind: false },
        { name: 'Import vidéos HD', shopopti: true, autods: true, cartifind: false },
        { name: 'Import d\'avis avec traduction', shopopti: true, autods: false, cartifind: true },
      ]
    },
    {
      category: 'Optimisation IA',
      items: [
        { name: 'Génération titres SEO', shopopti: true, autods: true, cartifind: true },
        { name: 'Génération descriptions', shopopti: true, autods: true, cartifind: true },
        { name: 'Traduction automatique (11 langues)', shopopti: true, autods: false, cartifind: false },
        { name: 'Score SEO temps réel', shopopti: true, autods: false, cartifind: false },
        { name: 'Suppression watermarks', shopopti: true, autods: false, cartifind: false },
        { name: 'Optimisation images HD', shopopti: true, autods: true, cartifind: false },
      ]
    },
    {
      category: 'Surveillance & Automatisation',
      items: [
        { name: 'Surveillance prix temps réel', shopopti: true, autods: true, cartifind: false },
        { name: 'Alertes stock', shopopti: true, autods: true, cartifind: false },
        { name: 'Sync automatique stock', shopopti: true, autods: true, cartifind: false },
        { name: 'Auto-Order fournisseurs', shopopti: 'partial', autods: true, cartifind: false },
        { name: 'Règles de pricing automatiques', shopopti: true, autods: true, cartifind: false },
      ]
    },
    {
      category: 'Outils Avancés',
      items: [
        { name: 'Search All Suppliers', shopopti: true, autods: true, cartifind: false },
        { name: 'Ads Spy (détection pubs)', shopopti: true, autods: true, cartifind: false },
        { name: 'Comparaison fournisseurs', shopopti: true, autods: true, cartifind: false },
        { name: 'Calculateur de profit', shopopti: true, autods: true, cartifind: true },
        { name: 'Mapping variantes', shopopti: true, autods: true, cartifind: false },
        { name: 'Trend Analyzer', shopopti: true, autods: true, cartifind: false },
      ]
    },
    {
      category: 'Plateformes Supportées',
      items: [
        { name: 'Nombre de plateformes', shopopti: '25+', autods: '20+', cartifind: '4' },
        { name: 'Marketplaces françaises', shopopti: true, autods: false, cartifind: false },
        { name: 'TikTok Shop', shopopti: true, autods: true, cartifind: false },
        { name: 'CJ Dropshipping natif', shopopti: true, autods: true, cartifind: false },
      ]
    },
    {
      category: 'Intégrations',
      items: [
        { name: 'Extension Chrome', shopopti: true, autods: true, cartifind: true },
        { name: 'App Shopify native', shopopti: 'coming', autods: true, cartifind: true },
        { name: 'Dashboard web', shopopti: true, autods: true, cartifind: false },
        { name: 'API REST', shopopti: true, autods: true, cartifind: false },
      ]
    }
  ];

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="h-5 w-5 text-green-500" />;
    }
    if (value === false) {
      return <X className="h-5 w-5 text-red-400" />;
    }
    if (value === 'partial') {
      return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Partiel</Badge>;
    }
    if (value === 'coming') {
      return <Badge variant="outline" className="text-blue-500 border-blue-500">Bientôt</Badge>;
    }
    return <span className="font-semibold text-primary">{value}</span>;
  };

  return (
    <>
      <Helmet>
        <title>Shopopti+ vs AutoDS vs Cartifind - Comparatif Extensions Dropshipping 2025</title>
        <meta name="description" content="Comparaison détaillée des meilleures extensions Chrome pour le dropshipping. Découvrez pourquoi Shopopti+ est l'alternative idéale à AutoDS avec plus de fonctionnalités." />
        <meta name="keywords" content="shopopti, autods alternative, cartifind alternative, extension dropshipping, chrome extension import produits" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <Badge className="mb-4" variant="secondary">
              <Star className="h-3 w-3 mr-1" /> Comparatif 2025
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Shopopti+ vs AutoDS vs Cartifind
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Découvrez pourquoi <span className="text-primary font-semibold">Shopopti+</span> est 
              l'extension de dropshipping la plus complète du marché avec support des marketplaces françaises
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/extensions/chrome">
                  <Download className="mr-2 h-5 w-5" />
                  Télécharger Shopopti+
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">
                  Voir les tarifs
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Comparison Cards */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Shopopti+ */}
              <Card className="border-primary/50 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                  RECOMMANDÉ
                </div>
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Shopopti+</CardTitle>
                  <p className="text-muted-foreground">Extension tout-en-un</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold mb-2">Gratuit</div>
                  <p className="text-sm text-muted-foreground mb-4">à partir de</p>
                  <ul className="text-left space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>25+ plateformes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Marketplaces FR</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>IA SEO avancée</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Import multi-boutiques</span>
                    </li>
                  </ul>
                  <Button className="w-full" asChild>
                    <Link to="/extensions/chrome">Essayer gratuitement</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* AutoDS */}
              <Card>
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center">
                    <Crown className="h-8 w-8 text-yellow-500" />
                  </div>
                  <CardTitle className="text-2xl">AutoDS</CardTitle>
                  <p className="text-muted-foreground">Leader du marché</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold mb-2">$26.90</div>
                  <p className="text-sm text-muted-foreground mb-4">par mois</p>
                  <ul className="text-left space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>20+ plateformes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-400" />
                      <span>Pas de FR marketplaces</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Auto-fulfillment</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>App Shopify</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" disabled>
                    Concurrent
                  </Button>
                </CardContent>
              </Card>

              {/* Cartifind */}
              <Card>
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center">
                    <Shield className="h-8 w-8 text-blue-500" />
                  </div>
                  <CardTitle className="text-2xl">Cartifind</CardTitle>
                  <p className="text-muted-foreground">Basique</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold mb-2">$19</div>
                  <p className="text-sm text-muted-foreground mb-4">par mois</p>
                  <ul className="text-left space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-muted-foreground" />
                      <span>4 plateformes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-400" />
                      <span>Pas de surveillance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>IA basique</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>App Shopify</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" disabled>
                    Concurrent
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Comparaison Détaillée des Fonctionnalités
            </h2>

            <div className="space-y-8">
              {features.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium">Fonctionnalité</th>
                            <th className="text-center py-3 px-4 font-medium text-primary">Shopopti+</th>
                            <th className="text-center py-3 px-4 font-medium">AutoDS</th>
                            <th className="text-center py-3 px-4 font-medium">Cartifind</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.items.map((item) => (
                            <tr key={item.name} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-3 px-4">{item.name}</td>
                              <td className="text-center py-3 px-4">
                                <div className="flex justify-center">
                                  {renderFeatureValue(item.shopopti)}
                                </div>
                              </td>
                              <td className="text-center py-3 px-4">
                                <div className="flex justify-center">
                                  {renderFeatureValue(item.autods)}
                                </div>
                              </td>
                              <td className="text-center py-3 px-4">
                                <div className="flex justify-center">
                                  {renderFeatureValue(item.cartifind)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Shopopti+ */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Pourquoi Choisir Shopopti+ ?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
              Shopopti+ combine le meilleur d'AutoDS avec des fonctionnalités exclusives 
              pour le marché français
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">25+ Plateformes</h3>
                <p className="text-muted-foreground">
                  Support unique des marketplaces françaises: Cdiscount, Fnac, Rakuten, 
                  ManoMano, Leroy Merlin...
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">IA Avancée</h3>
                <p className="text-muted-foreground">
                  Génération SEO en 11 langues, traduction automatique des avis, 
                  suppression de watermarks par IA
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Plan Gratuit</h3>
                <p className="text-muted-foreground">
                  Commencez gratuitement avec toutes les fonctionnalités essentielles. 
                  Upgradez uniquement quand vous en avez besoin.
                </p>
              </div>
            </div>

            <div className="mt-12">
              <Button size="lg" asChild>
                <Link to="/extensions/chrome">
                  <Download className="mr-2 h-5 w-5" />
                  Télécharger Shopopti+ Gratuitement
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Questions Fréquentes
            </h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shopopti+ est-il vraiment gratuit ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Oui ! Notre plan Starter est 100% gratuit et inclut l'import de produits, 
                    la surveillance des prix basique, et la génération SEO IA. Les plans Pro 
                    débloquent des fonctionnalités avancées comme l'import d'avis illimité et 
                    l'auto-fulfillment.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Puis-je migrer depuis AutoDS ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Absolument ! Shopopti+ supporte l'import de vos produits existants. 
                    Notre équipe peut vous accompagner dans la migration. Contactez-nous 
                    pour une transition en douceur.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">L'extension fonctionne-t-elle sur Firefox ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Actuellement, Shopopti+ est disponible uniquement sur Chrome et les 
                    navigateurs basés sur Chromium (Edge, Brave, Opera). Une version Firefox 
                    est prévue pour 2025.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ExtensionComparisonPage;
