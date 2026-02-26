import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Play, Book, Zap, ArrowRight, Clock, Lightbulb, AlertTriangle, ShoppingCart, Package, BarChart3, Settings, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GettingStartedPage = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: 'Créez votre compte',
      description: 'Inscrivez-vous gratuitement en quelques secondes. Aucune carte bancaire requise pour l\'essai de 14 jours.',
      action: 'Créer un compte',
      link: '/auth',
      duration: '2 min',
      details: [
        'Renseignez votre email professionnel et un mot de passe sécurisé (8+ caractères, 1 majuscule, 1 chiffre).',
        'Confirmez votre adresse email via le lien de vérification envoyé dans votre boîte de réception.',
        'Complétez votre profil : nom de boutique, secteur d\'activité et devise préférée.',
        'Choisissez votre plan (Free pour découvrir, Pro pour démarrer sérieusement).',
      ],
      tips: 'Utilisez un email dédié à votre activité e-commerce pour séparer vos communications personnelles et professionnelles.',
      warning: null,
    },
    {
      number: 2,
      title: 'Connectez votre boutique',
      description: 'Intégrez Shopify, WooCommerce ou PrestaShop en un clic. Synchronisation instantanée de vos produits.',
      action: 'Connecter une boutique',
      link: '/integrations',
      duration: '5 min',
      details: [
        'Rendez-vous dans Intégrations > Marketplaces et sélectionnez votre plateforme.',
        'Pour Shopify : créez une app privée et copiez les clés API (Admin API access token).',
        'Pour WooCommerce : activez l\'API REST dans Réglages > Avancé > REST API et générez vos clés.',
        'Testez la connexion — vous verrez un indicateur vert si tout fonctionne.',
        'Lancez la première synchronisation pour importer votre catalogue existant.',
      ],
      tips: 'Accordez uniquement les permissions nécessaires (lecture/écriture produits et commandes). Évitez "full access" pour des raisons de sécurité.',
      warning: 'Si vous utilisez un pare-feu ou des restrictions IP, ajoutez nos serveurs à votre liste blanche.',
    },
    {
      number: 3,
      title: 'Importez des produits',
      description: 'Parcourez notre bibliothèque de 10M+ produits depuis 99+ fournisseurs et importez en 1 clic.',
      action: 'Explorer les produits',
      link: '/products/import',
      duration: '10 min',
      details: [
        'Méthode 1 — Catalogue fournisseurs : parcourez AliExpress, BigBuy, Spocket et importez en 1 clic.',
        'Méthode 2 — Import CSV : téléchargez notre template, remplissez vos données et uploadez (max 500 lignes/batch).',
        'Méthode 3 — Import par URL : collez l\'URL d\'un produit et l\'IA extrait automatiquement les informations.',
        'Enrichissez vos fiches : l\'IA génère titres SEO, descriptions et tags en un clic.',
        'Vérifiez les marges calculées automatiquement avant de publier.',
      ],
      tips: 'Commencez par 5-10 produits pour valider votre workflow avant d\'importer en masse.',
      warning: 'Les fichiers CSV doivent être encodés en UTF-8 avec séparateur virgule. Téléchargez le template pour éviter les erreurs.',
    },
    {
      number: 4,
      title: 'Activez l\'automatisation',
      description: 'Configurez les règles d\'automatisation pour les prix, stocks et commandes. L\'IA s\'occupe du reste.',
      action: 'Configurer l\'automatisation',
      link: '/automation',
      duration: '15 min',
      details: [
        'Règles de prix : définissez vos marges cibles et l\'IA ajuste les prix en fonction du marché.',
        'Alertes de stock : recevez des notifications quand un produit passe sous le seuil critique.',
        'Auto-commande : configurez le réapprovisionnement automatique chez vos fournisseurs.',
        'Synchronisation CRON : programmez des syncs réguliers (toutes les heures, quotidien, hebdomadaire).',
        'Workflows avancés : combinez conditions et actions pour des automatisations sur mesure.',
      ],
      tips: 'Activez le mode "simulation" pendant 48h pour valider vos règles avant de les passer en production.',
      warning: null,
    },
  ];

  const quickLinks = [
    { title: 'Tutoriels vidéo', description: 'Regardez nos guides complets en vidéo', icon: Play, link: '/academy' },
    { title: 'Documentation', description: 'Consultez la documentation technique', icon: Book, link: '/help-center/documentation' },
    { title: 'Centre d\'aide', description: 'FAQ, articles et playbook de dépannage', icon: Zap, link: '/knowledge-base' },
  ];

  const checklist = [
    { label: 'Compte créé et vérifié', icon: Shield },
    { label: 'Boutique connectée', icon: ShoppingCart },
    { label: 'Au moins 5 produits importés', icon: Package },
    { label: 'Règle de prix configurée', icon: Settings },
    { label: 'Première commande test passée', icon: CheckCircle2 },
    { label: 'Dashboard Analytics consulté', icon: BarChart3 },
  ];

  return (
    <>
      <Helmet>
        <title>Guide de démarrage - ShopOpti</title>
        <meta name="description" content="Commencez avec ShopOpti en 4 étapes simples. Guide complet pour lancer votre boutique e-commerce." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                Guide de démarrage
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Lancez votre boutique en
                <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  4 étapes simples
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                De zéro à première vente en moins de 30 minutes — suivez le guide pas à pas
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />~30 min</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-success" />Aucune CB requise</span>
                <span className="flex items-center gap-1"><Zap className="h-4 w-4 text-warning" />14 jours d'essai</span>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {steps.map((step, index) => (
                <Card key={index} className="border-2 hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                          {step.number}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-2xl">{step.title}</CardTitle>
                          <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{step.duration}</Badge>
                        </div>
                        <CardDescription className="text-base">
                          {step.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Detailed sub-steps */}
                    <Accordion type="single" collapsible>
                      <AccordionItem value="details" className="border-none">
                        <AccordionTrigger className="text-sm font-medium text-primary hover:no-underline py-2">
                          Voir les étapes détaillées ({step.details.length} sous-étapes)
                        </AccordionTrigger>
                        <AccordionContent>
                          <ol className="space-y-2 ml-1">
                            {step.details.map((detail, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">
                                  {i + 1}
                                </span>
                                {detail}
                              </li>
                            ))}
                          </ol>

                          {step.tips && (
                            <div className="flex items-start gap-2 mt-4 p-3 bg-primary/5 rounded-lg">
                              <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Astuce :</strong> {step.tips}</p>
                            </div>
                          )}

                          {step.warning && (
                            <div className="flex items-start gap-2 mt-3 p-3 bg-warning/5 rounded-lg border border-warning/20">
                              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-muted-foreground">{step.warning}</p>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <Button onClick={() => navigate(step.link)}>
                      {step.action}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Checklist */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Checklist de lancement</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {checklist.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                        <div className="p-1.5 rounded bg-primary/10">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Ressources complémentaires</h2>
              <p className="text-lg text-muted-foreground">
                Explorez nos ressources pour approfondir vos connaissances
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-all">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <div className="flex justify-center">
                          <div className="p-3 bg-primary/10 rounded-full">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold">{link.title}</h3>
                        <p className="text-muted-foreground">{link.description}</p>
                        <Button variant="outline" className="w-full" onClick={() => navigate(link.link)}>
                          Accéder
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2">
              <CardContent className="p-12 text-center space-y-6">
                <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
                <h2 className="text-3xl md:text-4xl font-bold">
                  Prêt à démarrer ?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Créez votre compte gratuitement et lancez votre boutique en quelques minutes
                </p>
                <Button size="lg" onClick={() => navigate('/auth')}>
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
};

export default GettingStartedPage;
