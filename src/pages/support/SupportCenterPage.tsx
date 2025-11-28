import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Book, Mail, Phone, Search, HelpCircle, FileText, Video, Zap, ArrowRight, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupportCenterPage = () => {
  const navigate = useNavigate();

  const supportChannels = [
    {
      icon: MessageSquare,
      title: 'Chat en direct',
      description: 'Réponse instantanée 24/7',
      action: 'Démarrer un chat',
      badge: 'En ligne',
      badgeVariant: 'default' as const,
      onClick: () => navigate('/dashboard')
    },
    {
      icon: Mail,
      title: 'Email',
      description: 'Réponse sous 24h',
      action: 'Envoyer un email',
      badge: 'Support',
      badgeVariant: 'secondary' as const,
      onClick: () => navigate('/contact')
    },
    {
      icon: Phone,
      title: 'Téléphone',
      description: 'Lun-Ven 9h-18h',
      action: 'Appeler maintenant',
      badge: 'Premium',
      badgeVariant: 'outline' as const,
      onClick: () => window.location.href = 'tel:+33123456789'
    }
  ];

  const popularTopics = [
    {
      icon: Zap,
      title: 'Configuration initiale',
      description: 'Connecter votre première boutique',
      articles: 12
    },
    {
      icon: FileText,
      title: 'Import de produits',
      description: 'Importer depuis les fournisseurs',
      articles: 18
    },
    {
      icon: Video,
      title: 'Automatisation',
      description: 'Configurer les règles automatiques',
      articles: 15
    },
    {
      icon: Book,
      title: 'Intégrations',
      description: 'Connecter vos outils favoris',
      articles: 22
    }
  ];

  const faqs = [
    {
      question: 'Comment connecter ma boutique Shopify ?',
      answer: 'Accédez à Intégrations > Shopify, cliquez sur "Connecter" et suivez les étapes d\'autorisation.'
    },
    {
      question: 'Les imports sont-ils automatiques ?',
      answer: 'Oui, une fois configurés, les produits se synchronisent automatiquement selon la fréquence que vous définissez.'
    },
    {
      question: 'Comment fonctionne le pricing automatique ?',
      answer: 'L\'IA analyse vos concurrents et ajuste vos prix selon les règles que vous définissez (marge min, compétitivité, etc.).'
    },
    {
      question: 'Puis-je gérer plusieurs boutiques ?',
      answer: 'Oui, avec le plan Pro vous pouvez connecter un nombre illimité de boutiques sur différentes plateformes.'
    },
    {
      question: 'Comment annuler mon abonnement ?',
      answer: 'Allez dans Paramètres > Abonnement et cliquez sur "Annuler l\'abonnement". Aucune pénalité.'
    }
  ];

  return (
    <PublicLayout>
      <Helmet>
        <title>Centre d'aide - ShopOpti</title>
        <meta name="description" content="Support 24/7, documentation complète et réponses à toutes vos questions sur ShopOpti." />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                <HelpCircle className="h-4 w-4 mr-2" />
                Centre d'aide
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Comment pouvons-nous
                <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  vous aider ?
                </span>
              </h1>
              
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto pt-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans l'aide..."
                  className="pl-12 h-14 text-base"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Support Channels */}
        <section className="py-16 -mt-8">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {supportChannels.map((channel, index) => {
                const Icon = channel.icon;
                return (
                  <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant={channel.badgeVariant}>{channel.badge}</Badge>
                      </div>
                      <CardTitle>{channel.title}</CardTitle>
                      <CardDescription>{channel.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" onClick={channel.onClick}>
                        {channel.action}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Popular Topics */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Sujets populaires</h2>
              <p className="text-lg text-muted-foreground">
                Les guides les plus consultés par notre communauté
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {popularTopics.map((topic, index) => {
                const Icon = topic.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/documentation')}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="p-3 bg-primary/10 rounded-lg w-fit">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{topic.title}</h3>
                          <p className="text-sm text-muted-foreground">{topic.description}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {topic.articles} articles
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Questions fréquentes</h2>
              <p className="text-lg text-muted-foreground">
                Les réponses aux questions les plus posées
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button variant="outline" size="lg" onClick={() => navigate('/faq')}>
                Voir toutes les questions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2">
              <CardContent className="p-12 text-center space-y-6">
                <MessageSquare className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-3xl md:text-4xl font-bold">
                  Vous ne trouvez pas votre réponse ?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Notre équipe de support est disponible 24/7 pour vous aider
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" onClick={() => navigate('/contact')}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contacter le support
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/academy')}>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Voir l'académie
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default SupportCenterPage;
