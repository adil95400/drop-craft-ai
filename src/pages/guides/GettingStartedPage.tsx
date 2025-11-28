import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Play, Book, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GettingStartedPage = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: 'Créez votre compte',
      description: 'Inscrivez-vous gratuitement en quelques secondes. Aucune carte bancaire requise pour l\'essai de 14 jours.',
      action: 'Créer un compte',
      link: '/auth'
    },
    {
      number: 2,
      title: 'Connectez votre boutique',
      description: 'Intégrez Shopify, WooCommerce ou PrestaShop en un clic. Synchronisation instantanée de vos produits.',
      action: 'Connecter une boutique',
      link: '/integrations'
    },
    {
      number: 3,
      title: 'Importez des produits',
      description: 'Parcourez notre bibliothèque de 10M+ produits depuis 99+ fournisseurs et importez en 1 clic.',
      action: 'Explorer les produits',
      link: '/products/import'
    },
    {
      number: 4,
      title: 'Activez l\'automatisation',
      description: 'Configurez les règles d\'automatisation pour les prix, stocks et commandes. L\'IA s\'occupe du reste.',
      action: 'Configurer l\'automatisation',
      link: '/automation'
    }
  ];

  const quickLinks = [
    {
      title: 'Tutoriel vidéo',
      description: 'Regardez notre guide complet de 15 minutes',
      icon: Play,
      link: '/academy'
    },
    {
      title: 'Documentation',
      description: 'Consultez la documentation technique complète',
      icon: Book,
      link: '/documentation'
    },
    {
      title: 'Support en direct',
      description: 'Chattez avec notre équipe d\'experts',
      icon: Zap,
      link: '/support'
    }
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
                De zéro à première vente en moins de 30 minutes
              </p>
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
                        <CardTitle className="text-2xl mb-2">{step.title}</CardTitle>
                        <CardDescription className="text-base">
                          {step.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
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

        {/* Quick Links */}
        <section className="py-20 bg-secondary/30">
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
