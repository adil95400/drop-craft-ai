import { SEO } from '@/components/SEO';
import Header from '@/components/layout/Header';
import FooterNavigation from '@/components/navigation/FooterNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle, Calendar, Award, ExternalLink, ArrowRight } from 'lucide-react';

const Community = () => {
  const communityStats = [
    { icon: Users, label: "Membres actifs", value: "15,000+" },
    { icon: MessageCircle, label: "Discussions", value: "2,500+" },
    { icon: Calendar, label: "Événements/mois", value: "8+" },
    { icon: Award, label: "Experts certifiés", value: "50+" }
  ];

  const communityChannels = [
    {
      name: "Discord",
      description: "Rejoignez notre serveur Discord pour des discussions en temps réel",
      members: "8,500+",
      activity: "Très active",
      link: "#"
    },
    {
      name: "Forum",
      description: "Posez vos questions et partagez vos expériences",
      members: "12,000+",
      activity: "Active",
      link: "#"
    },
    {
      name: "Telegram", 
      description: "Groupe Telegram pour les annonces et discussions rapides",
      members: "3,200+",
      activity: "Modérée",
      link: "#"
    }
  ];

  const events = [
    {
      title: "Webinaire : Optimisation SEO",
      date: "15 Mars 2024",
      time: "14h00 CET",
      type: "Webinaire",
      attendees: 156
    },
    {
      title: "Q&A avec les experts",
      date: "22 Mars 2024", 
      time: "16h00 CET",
      type: "Live",
      attendees: 89
    },
    {
      title: "Formation : IA Marketing",
      date: "29 Mars 2024",
      time: "10h00 CET", 
      type: "Formation",
      attendees: 234
    }
  ];

  return (
    <>
      <SEO
        title="Communauté | ShopOpti+"
        description="Rejoignez la communauté ShopOpti+ de plus de 15,000 e-commerçants. Partagez, apprenez et développez votre business ensemble."
        path="/community"
        keywords="communauté dropshipping, forum e-commerce, Discord ShopOpti, entraide entrepreneurs"
      />
      <Header />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-4">
              <Users className="h-3 w-3 mr-1" />
              +15,000 membres actifs
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Rejoignez la communauté 
              <span className="bg-gradient-hero bg-clip-text text-transparent"> ShopOpti+</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connectez-vous avec des milliers d'entrepreneurs e-commerce, partagez vos expériences 
              et accélérez votre croissance ensemble.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg">
                Rejoindre Discord
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                Parcourir le forum
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {communityStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="text-center">
                    <CardContent className="pt-6">
                      <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Community Channels */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Nos canaux de communication
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {communityChannels.map((channel, index) => (
                <Card key={index} className="hover:shadow-premium transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {channel.name}
                      <Badge variant={channel.activity === 'Très active' ? 'default' : 'secondary'}>
                        {channel.activity}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{channel.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-muted-foreground">Membres</span>
                      <span className="font-semibold">{channel.members}</span>
                    </div>
                    <Button className="w-full" variant="outline">
                      Rejoindre
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Events Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Événements à venir
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge>{event.type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {event.attendees} inscrits
                      </span>
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Date</span>
                        <span className="font-medium">{event.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Heure</span>
                        <span className="font-medium">{event.time}</span>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      S'inscrire gratuitement
                    </Button>
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
              Prêt à rejoindre la communauté ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Accédez à des ressources exclusives, des conseils d'experts et un réseau 
              d'entrepreneurs passionnés comme vous.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg">
                Rejoindre maintenant
                <Users className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                En savoir plus
              </Button>
            </div>
          </div>
        </section>
      </div>
      
      <FooterNavigation />
    </>
  );
};

export default Community;