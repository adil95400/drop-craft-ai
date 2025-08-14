import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Sparkles,
  Send,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Clock,
  Headphones,
  Users,
  Zap,
  CheckCircle,
  Calendar,
  Video,
  Star
} from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
    budget: "",
    timeline: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactMethods = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Chat en Direct",
      description: "Réponse immédiate par notre équipe support",
      availability: "24/7",
      action: "Démarrer le Chat",
      color: "bg-gradient-primary"
    },
    {
      icon: <Phone className="w-8 h-8" />,
      title: "Appel Téléphonique",
      description: "Discutez directement avec un expert",
      availability: "Lun-Ven 9h-18h",
      action: "+33 1 23 45 67 89",
      color: "bg-gradient-success"
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Email Support",
      description: "Réponse détaillée dans les 4h",
      availability: "Toujours disponible",
      action: "support@shopopti.com",
      color: "bg-gradient-accent"
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Démo Personnalisée",
      description: "Session privée avec notre équipe",
      availability: "Sur rendez-vous",
      action: "Planifier une Démo",
      color: "bg-gradient-hero"
    }
  ];

  const supportTypes = [
    {
      title: "Support Technique",
      description: "Aide avec l'utilisation de la plateforme",
      responseTime: "< 4h",
      availability: "24/7"
    },
    {
      title: "Consultation Business",
      description: "Conseils stratégiques pour votre e-commerce",
      responseTime: "< 24h",
      availability: "Lun-Ven"
    },
    {
      title: "Intégrations Personnalisées",
      description: "Développement sur mesure",
      responseTime: "2-5 jours",
      availability: "Sur devis"
    }
  ];

  const testimonials = [
    {
      name: "Julie Moreau",
      role: "E-commercante",
      comment: "L'équipe ShopOpti est exceptionnelle ! Ils m'ont aidée à configurer ma boutique en 30 minutes.",
      rating: 5
    },
    {
      name: "Marc Durand",
      role: "Dropshipper Pro",
      comment: "Support réactif et solutions personnalisées. Exactement ce dont j'avais besoin !",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5" />
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ShopOpti
              </span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-primary hover:bg-primary-hover">
                  Commencer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Headphones className="w-4 h-4 mr-2" />
            Support Expert
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Nous sommes là pour{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              vous aider
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Notre équipe d'experts est disponible 24/7 pour répondre à toutes vos questions 
            et vous accompagner dans votre réussite e-commerce.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choisissez votre mode de contact</h2>
            <p className="text-muted-foreground">Nous nous adaptons à vos préférences</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={index} className="group hover:shadow-glow transition-all duration-300 cursor-pointer">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${method.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    {method.icon}
                  </div>
                  <CardTitle className="text-lg">{method.title}</CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {method.availability}
                  </div>
                  <Button variant="outline" className="w-full">
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Form */}
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Envoyez-nous un{" "}
                <span className="bg-gradient-accent bg-clip-text text-transparent">
                  message
                </span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Décrivez votre projet ou votre question, nous vous répondrons dans les plus brefs délais.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nom complet *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Votre nom"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Entreprise</label>
                  <Input
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="Nom de votre entreprise"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Budget estimé</label>
                    <Select onValueChange={(value) => handleInputChange("budget", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Moins de 100€/mois</SelectItem>
                        <SelectItem value="pro">100€ - 500€/mois</SelectItem>
                        <SelectItem value="enterprise">Plus de 500€/mois</SelectItem>
                        <SelectItem value="custom">Budget personnalisé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Timeline</label>
                    <Select onValueChange={(value) => handleInputChange("timeline", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Quand souhaitez-vous commencer ?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asap">Dès que possible</SelectItem>
                        <SelectItem value="1month">Dans le mois</SelectItem>
                        <SelectItem value="3months">Dans les 3 mois</SelectItem>
                        <SelectItem value="6months">Dans les 6 mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sujet *</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="Sujet de votre message"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message *</label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    placeholder="Décrivez votre projet ou votre question..."
                    rows={6}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-gradient-primary hover:bg-primary-hover shadow-glow"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Envoyer le Message
                </Button>

                <p className="text-xs text-muted-foreground">
                  En envoyant ce formulaire, vous acceptez que nous utilisions vos données 
                  pour vous recontacter concernant votre demande.
                </p>
              </form>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-8">
              {/* Support Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Types de Support</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {supportTypes.map((type, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm">{type.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{type.description}</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-success">⚡ {type.responseTime}</span>
                        <span className="text-muted-foreground">{type.availability}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Nos Coordonnées</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-sm text-muted-foreground">
                        42 Avenue des Champs-Élysées<br />
                        75008 Paris, France
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <p className="text-sm text-muted-foreground">+33 1 23 45 67 89</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        support@shopopti.com<br />
                        sales@shopopti.com
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Horaires</p>
                      <p className="text-sm text-muted-foreground">
                        Lun-Ven: 9h-18h<br />
                        Support 24/7 disponible
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonials */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-5 h-5" />
                    <span>Ce que disent nos clients</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm italic">"{testimonial.comment}"</p>
                      <div className="text-xs text-muted-foreground">
                        <strong>{testimonial.name}</strong> - {testimonial.role}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Questions{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              fréquentes
            </span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Besoin d'une réponse rapide ? Consultez notre FAQ
          </p>
          <Button variant="outline" size="lg">
            <MessageSquare className="w-5 h-5 mr-2" />
            Voir la FAQ Complète
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                commencer
              </span>{" "}
              ?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Ou préférez-vous essayer ShopOpti gratuitement dès maintenant ?
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow text-lg px-12 py-4">
                  <Zap className="w-5 h-5 mr-2" />
                  Essai Gratuit 14 Jours
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-12 py-4">
                <Calendar className="w-5 h-5 mr-2" />
                Planifier une Démo
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Configuration gratuite</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Support inclus</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Aucun engagement</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;