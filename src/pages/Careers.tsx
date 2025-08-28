import { SEO } from '@/components/SEO';
import Header from '@/components/layout/Header';
import FooterNavigation from '@/components/navigation/FooterNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, Briefcase, Heart, Zap, ArrowRight, ExternalLink } from 'lucide-react';

const Careers = () => {
  const openPositions = [
    {
      id: 1,
      title: "Développeur Full-Stack Senior",
      department: "Engineering",
      location: "Paris / Remote",
      type: "CDI",
      level: "Senior",
      description: "Nous cherchons un développeur expérimenté pour rejoindre notre équipe technique et développer les fonctionnalités IA de ShopOpti+.",
      requirements: ["React/Node.js", "Python", "AWS", "5+ ans d'expérience"],
      urgent: true
    },
    {
      id: 2,
      title: "Product Manager IA", 
      department: "Product",
      location: "Paris",
      type: "CDI",
      level: "Senior",
      description: "Pilotez la roadmap produit de nos solutions d'intelligence artificielle pour le e-commerce.",
      requirements: ["Product Management", "IA/ML", "E-commerce", "3+ ans d'expérience"],
      urgent: false
    },
    {
      id: 3,
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Paris / Remote",
      type: "CDI", 
      level: "Mid-level",
      description: "Accompagnez nos clients dans leur réussite et développez notre programme de satisfaction client.",
      requirements: ["Customer Success", "E-commerce", "Français/Anglais", "2+ ans d'expérience"],
      urgent: false
    },
    {
      id: 4,
      title: "Data Scientist",
      department: "AI/ML",
      location: "Paris",
      type: "CDI",
      level: "Mid-Senior",
      description: "Développez les algorithmes d'IA qui alimentent nos outils d'optimisation e-commerce.",
      requirements: ["Python", "TensorFlow/PyTorch", "Statistiques", "3+ ans d'expérience"],
      urgent: true
    }
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Bien-être au travail",
      items: ["Télétravail hybride", "Horaires flexibles", "Mutuelle premium", "Tickets restaurants"]
    },
    {
      icon: Zap,
      title: "Développement",
      items: ["Formation continue", "Conférences payées", "Budget formation 2k€/an", "Mentorat interne"]
    },
    {
      icon: Users,
      title: "Équipe & Culture",
      items: ["Équipe internationale", "Événements équipe", "Open space moderne", "Café & snacks illimités"]
    },
    {
      icon: Briefcase,
      title: "Avantages",
      items: ["Equity/Actions", "RTT supplémentaires", "Matériel fourni", "Parking gratuit"]
    }
  ];

  const companyValues = [
    {
      title: "Innovation",
      description: "Nous repoussons constamment les limites de la technologie pour créer les meilleures solutions e-commerce."
    },
    {
      title: "Excellence",
      description: "Nous visons l'excellence dans tout ce que nous faisons, de notre code à notre support client."
    },
    {
      title: "Collaboration", 
      description: "Nous croyons que les meilleures idées émergent quand des esprits brillants travaillent ensemble."
    },
    {
      title: "Impact",
      description: "Nous voulons avoir un impact positif sur le business de nos clients et sur l'industrie du e-commerce."
    }
  ];

  return (
    <>
      <SEO
        title="Carrières | ShopOpti+"
        description="Rejoignez l'équipe ShopOpti+ ! Postes ouverts en développement, product, customer success. Startup e-commerce en croissance à Paris."
        path="/careers"
        keywords="emploi ShopOpti, carrières startup, développeur e-commerce, jobs tech Paris"
      />
      <Header />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-4">
              <Users className="h-3 w-3 mr-1" />
              Nous recrutons !
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Construisez l'avenir du 
              <span className="bg-gradient-hero bg-clip-text text-transparent"> e-commerce</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez une équipe passionnée qui révolutionne le dropshipping avec l'intelligence artificielle. 
              Ensemble, créons l'outil e-commerce de demain.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg">
                Voir les postes ouverts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                En savoir plus sur nous
              </Button>
            </div>
          </div>
        </section>

        {/* Company Values */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Nos valeurs
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {companyValues.map((value, index) => (
                <div key={index} className="text-center">
                  <h3 className="font-semibold text-lg mb-3">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Postes ouverts ({openPositions.length})
            </h2>
            
            <div className="space-y-6">
              {openPositions.map((position) => (
                <Card key={position.id} className="hover:shadow-premium transition-all duration-300">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{position.title}</CardTitle>
                          {position.urgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{position.description}</CardDescription>
                      </div>
                      <Button>
                        Postuler
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{position.department}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{position.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{position.type}</span>
                      </div>
                      <div className="text-sm">
                        <Badge variant="outline">{position.level}</Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Compétences requises</h4>
                      <div className="flex flex-wrap gap-2">
                        {position.requirements.map((req, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Pourquoi nous rejoindre ?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="text-center mb-4">
                        <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                        <h3 className="font-semibold">{benefit.title}</h3>
                      </div>
                      <ul className="space-y-2">
                        {benefit.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Application Process */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Processus de recrutement
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold mb-2">Candidature</h3>
                <p className="text-sm text-muted-foreground">
                  Envoyez votre CV et lettre de motivation via notre formulaire
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold mb-2">Entretiens</h3>
                <p className="text-sm text-muted-foreground">
                  Entretien RH puis technique avec l'équipe (2-3 sessions)
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold mb-2">Intégration</h3>
                <p className="text-sm text-muted-foreground">
                  Période d'essai avec mentorat et formation complète
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-secondary/10 text-center">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">
              Prêt à nous rejoindre ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Vous ne trouvez pas le poste idéal ? Envoyez-nous quand même votre candidature, 
              nous sommes toujours à la recherche de talents !
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg">
                Candidature spontanée
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                Nous contacter
              </Button>
            </div>
          </div>
        </section>
      </div>
      
      <FooterNavigation />
    </>
  );
};

export default Careers;