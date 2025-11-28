import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Users, TrendingUp, Sparkles, Shield, Globe, Heart, Zap, Award, Rocket, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VideoPlayer } from '@/components/public/VideoPlayer';
import featureAI from '@/assets/feature-ai.jpg';

const AboutPage = () => {
  const navigate = useNavigate();

  const timeline = [
    {
      year: '2024 Q1',
      title: 'Lancement officiel',
      description: 'Lancement de ShopOpti avec les fonctionnalités core : import produits, automatisation et IA.'
    },
    {
      year: '2024 Q2',
      title: '1 000 utilisateurs',
      description: 'Franchissement du cap des 1000 boutiques connectées et premières intégrations partenaires.'
    },
    {
      year: '2024 Q3',
      title: 'Série A - 2M€',
      description: 'Levée de fonds pour accélérer le développement et expansion européenne.'
    },
    {
      year: '2024 Q4',
      title: '15k+ utilisateurs',
      description: 'Leader français de l\'automatisation e-commerce avec IA. 99+ fournisseurs intégrés.'
    }
  ];

  const achievements = [
    { icon: Users, value: '15 000+', label: 'E-commerçants actifs' },
    { icon: Rocket, value: '250M€', label: 'GMV traité annuellement' },
    { icon: Award, value: '99+', label: 'Fournisseurs partenaires' },
    { icon: Clock, value: '400k+', label: 'Heures économisées' }
  ];

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

        {/* Video Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Découvrez ShopOpti en action</h2>
              <p className="text-lg text-muted-foreground">
                2 minutes pour comprendre comment nous révolutionnons l'e-commerce
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <VideoPlayer
                thumbnail={featureAI}
                title="Comment ShopOpti transforme votre e-commerce"
                description="Automatisation IA, import multi-fournisseurs, optimisation des prix en temps réel"
              />
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Notre parcours</h2>
              <p className="text-lg text-muted-foreground">
                De l'idée à la référence du marché
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block" />
                
                <div className="space-y-8">
                  {timeline.map((item, index) => (
                    <div key={index} className="relative pl-0 md:pl-20 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      {/* Timeline dot */}
                      <div className="absolute left-6 top-2 hidden md:block">
                        <div className="h-4 w-4 rounded-full bg-primary border-4 border-background" />
                      </div>
                      
                      <Card className="hover:shadow-lg transition-all">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <Badge className="w-fit bg-primary/10 text-primary border-primary/20">
                              {item.year}
                            </Badge>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                              <p className="text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Nos réalisations</h2>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:-translate-y-2 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardContent className="pt-6 text-center space-y-3">
                      <div className="flex justify-center">
                        <div className="p-4 bg-gradient-to-br from-primary to-primary-glow rounded-full">
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-primary">{achievement.value}</div>
                      <div className="text-sm text-muted-foreground">{achievement.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Values Section */}
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
