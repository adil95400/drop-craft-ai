import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Users, TrendingUp, Sparkles, Shield, Globe, Heart, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AboutPage = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Target,
      title: "Mission",
      description: "Démocratiser l'e-commerce en rendant les outils professionnels accessibles à tous les entrepreneurs, du débutant au confirmé."
    },
    {
      icon: Sparkles,
      title: "Innovation",
      description: "Intégrer l'IA de manière intelligente pour automatiser les tâches répétitives et permettre aux entrepreneurs de se concentrer sur l'essentiel."
    },
    {
      icon: Heart,
      title: "Engagement",
      description: "Accompagner chaque utilisateur dans sa réussite avec un support réactif, des formations de qualité et une communauté active."
    },
    {
      icon: Shield,
      title: "Confiance",
      description: "Garantir la sécurité des données, la transparence des prix et la fiabilité de notre plateforme en toutes circonstances."
    }
  ];

  const stats = [
    { value: "2024", label: "Année de création" },
    { value: "15k+", label: "Utilisateurs actifs" },
    { value: "99+", label: "Fournisseurs partenaires" },
    { value: "98%", label: "Satisfaction client" }
  ];

  const team = [
    {
      name: "Innovation",
      description: "Notre équipe d'ingénieurs travaille sans relâche pour intégrer les dernières technologies IA et améliorer continuellement la plateforme.",
      icon: Zap
    },
    {
      name: "Support",
      description: "Une équipe dédiée disponible 24/7 pour répondre à vos questions et vous accompagner dans votre réussite.",
      icon: Users
    },
    {
      name: "Croissance",
      description: "Nous investissons constamment dans de nouvelles intégrations et fonctionnalités pour rester à la pointe du marché.",
      icon: TrendingUp
    }
  ];

  return (
    <PublicLayout>
      <Helmet>
        <title>À propos - ShopOpti</title>
        <meta name="description" content="Découvrez ShopOpti, la plateforme qui révolutionne l'e-commerce avec l'intelligence artificielle." />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                Notre histoire
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Révolutionner l'e-commerce
                <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  avec l'intelligence artificielle
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                ShopOpti est née de la volonté de rendre l'e-commerce accessible à tous, 
                en combinant la puissance de l'IA avec une interface intuitive et des outils professionnels.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Nos valeurs</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Ce qui nous guide au quotidien dans le développement de ShopOpti
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="border-2 hover:border-primary/50 transition-all">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="p-3 bg-primary/10 rounded-lg w-fit">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">{value.title}</h3>
                        <p className="text-muted-foreground">{value.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Notre équipe</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Des experts passionnés au service de votre réussite
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {team.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <div className="flex justify-center">
                          <div className="p-4 bg-gradient-to-br from-primary to-primary-glow rounded-full">
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold">{item.name}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Technologie de pointe</h2>
                <p className="text-lg text-muted-foreground">
                  Une infrastructure moderne et scalable
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="p-3 bg-primary/10 rounded-lg w-fit">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">Intelligence Artificielle</h3>
                      <p className="text-muted-foreground">
                        Utilisation des modèles IA les plus avancés pour optimiser automatiquement 
                        vos prix, descriptions et stratégies marketing.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="p-3 bg-primary/10 rounded-lg w-fit">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">Infrastructure Cloud</h3>
                      <p className="text-muted-foreground">
                        Hébergement sécurisé avec uptime garanti à 99.9%, scalabilité automatique 
                        et sauvegardes quotidiennes de vos données.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">
                Rejoignez l'aventure ShopOpti
              </h2>
              <p className="text-lg text-muted-foreground">
                Faites partie des entrepreneurs qui transforment leur e-commerce avec l'IA
              </p>
              <Button size="lg" onClick={() => navigate('/auth')}>
                Commencer gratuitement
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default AboutPage;
