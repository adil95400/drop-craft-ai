import { SEO } from '@/components/SEO';
import Header from '@/components/layout/Header';
import FooterNavigation from '@/components/navigation/FooterNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Play, Star, Download } from 'lucide-react';

const Webinars = () => {
  const upcomingWebinars = [
    {
      id: 1,
      title: "Stratégies d'automatisation avec l'IA",
      description: "Découvrez comment utiliser l'intelligence artificielle pour automatiser vos processus e-commerce et multiplier vos revenus.",
      date: "2024-03-15",
      time: "14:00",
      duration: "90 min",
      instructor: "Marie Dubois",
      level: "Intermédiaire",
      attendees: 234,
      price: "Gratuit",
      topics: ["IA Marketing", "Automatisation", "ROI", "Optimisation"]
    },
    {
      id: 2,
      title: "Optimisation SEO pour e-commerce",
      description: "Maîtrisez les techniques SEO avancées pour augmenter votre visibilité et vos ventes organiques.",
      date: "2024-03-22",
      time: "16:00", 
      duration: "60 min",
      instructor: "Thomas Martin",
      level: "Débutant",
      attendees: 189,
      price: "Gratuit",
      topics: ["SEO", "Mots-clés", "Contenu", "Analytics"]
    },
    {
      id: 3,
      title: "Facebook Ads pour le dropshipping",
      description: "Créez des campagnes Facebook Ads rentables et scalez votre business dropshipping efficacement.",
      date: "2024-03-29",
      time: "15:00",
      duration: "120 min", 
      instructor: "Sophie Laurent",
      level: "Avancé",
      attendees: 312,
      price: "29€",
      topics: ["Facebook Ads", "Targeting", "Créatifs", "Scaling"]
    }
  ];

  const pastWebinars = [
    {
      id: 4,
      title: "Introduction au dropshipping",
      date: "2024-02-28",
      views: 1250,
      rating: 4.8,
      duration: "75 min",
      available: true
    },
    {
      id: 5,
      title: "Gestion des stocks et fournisseurs",
      date: "2024-02-14",
      views: 890,
      rating: 4.6,
      duration: "90 min",
      available: true
    },
    {
      id: 6,
      title: "Analyse de la concurrence",
      date: "2024-01-31",
      views: 567,
      rating: 4.7,
      duration: "60 min",
      available: false
    }
  ];

  const instructors = [
    {
      name: "Marie Dubois",
      title: "Expert IA & Automatisation",
      experience: "8 ans d'expérience",
      webinars: 15,
      avatar: "🧑‍💼"
    },
    {
      name: "Thomas Martin", 
      title: "Spécialiste SEO",
      experience: "6 ans d'expérience",
      webinars: 12,
      avatar: "👨‍💻"
    },
    {
      name: "Sophie Laurent",
      title: "Expert Facebook Ads",
      experience: "5 ans d'expérience", 
      webinars: 18,
      avatar: "👩‍💼"
    }
  ];

  return (
    <>
      <SEO
        title="Webinaires | ShopOpti+"
        description="Participez aux webinaires ShopOpti+ gratuits et payants. Apprenez les dernières stratégies e-commerce et dropshipping avec nos experts."
        path="/webinars"
        keywords="webinaires dropshipping, formation e-commerce, expert dropshipping, stratégies marketing"
      />
      <Header />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-4">
              <Calendar className="h-3 w-3 mr-1" />
              Nouveaux webinaires chaque semaine
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Webinaires 
              <span className="bg-gradient-hero bg-clip-text text-transparent"> ShopOpti+</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Participez à nos webinaires exclusifs animés par des experts du dropshipping 
              et accélérez votre croissance e-commerce.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg">
                Voir les prochains webinaires
              </Button>
              <Button variant="outline" size="lg">
                Accéder aux replays
              </Button>
            </div>
          </div>
        </section>

        {/* Upcoming Webinars */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Webinaires à venir
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {upcomingWebinars.map((webinar) => (
                <Card key={webinar.id} className="hover:shadow-premium transition-all duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={webinar.price === "Gratuit" ? "secondary" : "default"}>
                        {webinar.price}
                      </Badge>
                      <Badge variant="outline">{webinar.level}</Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight">{webinar.title}</CardTitle>
                    <CardDescription>{webinar.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{webinar.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{webinar.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{webinar.attendees} inscrits</span>
                      </div>
                      <div className="text-muted-foreground">
                        {webinar.duration}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Intervenant</div>
                      <div className="text-sm text-muted-foreground">{webinar.instructor}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Sujets abordés</div>
                      <div className="flex flex-wrap gap-1">
                        {webinar.topics.map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full">
                      S'inscrire maintenant
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Past Webinars */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Webinaires passés
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastWebinars.map((webinar) => (
                <Card key={webinar.id} className="hover:shadow-card transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg">{webinar.title}</CardTitle>
                    <CardDescription>
                      Diffusé le {webinar.date} • {webinar.duration}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        <span>{webinar.views} vues</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{webinar.rating}/5</span>
                      </div>
                    </div>

                    {webinar.available ? (
                      <Button className="w-full" variant="outline">
                        <Play className="mr-2 h-4 w-4" />
                        Voir le replay
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>
                        Replay non disponible
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Instructors */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Nos experts
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {instructors.map((instructor, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">{instructor.avatar}</div>
                    <h3 className="font-semibold text-lg mb-2">{instructor.name}</h3>
                    <p className="text-muted-foreground mb-2">{instructor.title}</p>
                    <p className="text-sm text-muted-foreground mb-4">{instructor.experience}</p>
                    <Badge variant="secondary">
                      {instructor.webinars} webinaires animés
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-secondary/10 text-center">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">
              Ne ratez plus aucun webinaire
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Inscrivez-vous à notre newsletter pour être informé des prochains webinaires 
              et recevoir des invitations exclusives.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg">
                S'abonner aux notifications
              </Button>
              <Button variant="outline" size="lg">
                <Download className="mr-2 h-4 w-4" />
                Programme complet
              </Button>
            </div>
          </div>
        </section>
      </div>
      
      <FooterNavigation />
    </>
  );
};

export default Webinars;