import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual form submission
    toast.success('Message envoyé avec succès ! Nous vous répondrons dans les 24h.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      description: "Notre équipe vous répond sous 24h",
      value: "contact@shopopti.io",
      action: "mailto:contact@shopopti.io"
    },
    {
      icon: MessageSquare,
      title: "Chat en direct",
      description: "Support instantané disponible 24/7",
      value: "Démarrer une conversation",
      action: "/dashboard"
    },
    {
      icon: Phone,
      title: "Téléphone",
      description: "Du lundi au vendredi, 9h-18h",
      value: "+33 1 23 45 67 89",
      action: "tel:+33123456789"
    }
  ];

  const faqCategories = [
    {
      title: "Questions générales",
      items: [
        "Comment fonctionne la période d'essai ?",
        "Quels sont les moyens de paiement acceptés ?",
        "Puis-je changer de plan à tout moment ?"
      ]
    },
    {
      title: "Support technique",
      items: [
        "Comment connecter ma boutique Shopify ?",
        "Problème de synchronisation des stocks",
        "Comment configurer les automatisations ?"
      ]
    },
    {
      title: "Facturation",
      items: [
        "Comment obtenir une facture ?",
        "Politique de remboursement",
        "Questions sur mon abonnement"
      ]
    }
  ];

  return (
    <PublicLayout>
      <Helmet>
        <title>Contact - ShopOpti</title>
        <meta name="description" content="Contactez notre équipe support. Nous sommes disponibles 24/7 pour répondre à toutes vos questions." />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                Nous sommes là pour vous aider
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Contactez-nous
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Une question ? Un problème ? Notre équipe est disponible 24/7 pour vous accompagner
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16 -mt-10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <Card key={index} className="border-2 hover:border-primary/50 transition-all">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{method.title}</CardTitle>
                      </div>
                      <CardDescription>{method.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.location.href = method.action}
                      >
                        {method.value}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Contact Form */}
              <div>
                <div className="space-y-4 mb-8">
                  <h2 className="text-3xl font-bold">Envoyez-nous un message</h2>
                  <p className="text-muted-foreground">
                    Remplissez le formulaire ci-dessous et nous vous répondrons dans les 24h
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      placeholder="Jean Dupont"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jean@exemple.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Sujet</Label>
                    <Input
                      id="subject"
                      placeholder="Question sur les fonctionnalités"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Décrivez votre question ou problème..."
                      className="min-h-[150px]"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer le message
                  </Button>
                </form>
              </div>

              {/* Additional Info */}
              <div className="space-y-8">
                {/* Office Hours */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <CardTitle>Horaires d'ouverture</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lundi - Vendredi</span>
                      <span className="font-medium">9h - 18h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Samedi</span>
                      <span className="font-medium">10h - 16h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dimanche</span>
                      <span className="font-medium">Fermé</span>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Support technique disponible 24/7 via chat en direct
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Office Location */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <CardTitle>Nos bureaux</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      123 Avenue des Champs-Élysées<br />
                      75008 Paris, France
                    </p>
                  </CardContent>
                </Card>

                {/* FAQ Quick Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Questions fréquentes</CardTitle>
                    <CardDescription>
                      Consultez notre base de connaissances
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {faqCategories.map((category, index) => (
                        <div key={index} className="space-y-2">
                          <h4 className="font-medium text-sm">{category.title}</h4>
                          <ul className="space-y-1">
                            {category.items.map((item, idx) => (
                              <li key={idx}>
                                <Button variant="link" className="h-auto p-0 text-sm text-muted-foreground hover:text-primary">
                                  {item}
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default ContactPage;
