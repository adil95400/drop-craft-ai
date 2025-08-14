import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Sparkles,
  Target,
  Users,
  Rocket,
  Heart,
  Award,
  TrendingUp,
  Globe,
  Shield,
  Zap,
  Brain,
  Star,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  Linkedin,
  Twitter
} from "lucide-react";

const About = () => {
  const values = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Innovation",
      description: "Nous repoussons constamment les limites de l'IA pour offrir les meilleures solutions e-commerce"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Passion",
      description: "Notre équipe est passionnée par le succès de nos clients et leur croissance"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Transparence",
      description: "Nous croyons en la transparence totale dans nos prix, notre technologie et nos résultats"
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Performance",
      description: "Chaque fonctionnalité est conçue pour maximiser vos résultats et votre ROI"
    }
  ];

  const team = [
    {
      name: "Alexandre Dubois",
      role: "CEO & Fondateur",
      description: "Ex-Amazon, expert en e-commerce depuis 12 ans",
      avatar: "AD",
      social: {
        linkedin: "#",
        twitter: "#"
      }
    },
    {
      name: "Marie Laurent",
      role: "CTO",
      description: "Experte IA et machine learning, ex-Google",
      avatar: "ML",
      social: {
        linkedin: "#",
        twitter: "#"
      }
    },
    {
      name: "Thomas Martin",
      role: "VP Product",
      description: "Designer UX/UI passionné par l'expérience utilisateur",
      avatar: "TM",
      social: {
        linkedin: "#",
        twitter: "#"
      }
    },
    {
      name: "Sophie Chen",
      role: "Head of AI",
      description: "PhD en Intelligence Artificielle, ex-Meta",
      avatar: "SC",
      social: {
        linkedin: "#",
        twitter: "#"
      }
    }
  ];

  const milestones = [
    {
      year: "2020",
      title: "Création de ShopOpti",
      description: "Lancement de la première version avec 3 fournisseurs connectés"
    },
    {
      year: "2021",
      title: "Première IA intégrée",
      description: "Développement de notre algorithme de détection de produits gagnants"
    },
    {
      year: "2022",
      title: "10,000 utilisateurs",
      description: "Franchissement du cap des 10,000 utilisateurs actifs"
    },
    {
      year: "2023",
      title: "Levée de fonds Série A",
      description: "5M€ pour accélérer le développement de l'IA et l'expansion internationale"
    },
    {
      year: "2024",
      title: "50,000+ utilisateurs",
      description: "Leader du marché français avec 50+ intégrations et IA avancée"
    }
  ];

  const stats = [
    { value: "50,000+", label: "Utilisateurs actifs", icon: <Users className="w-6 h-6" /> },
    { value: "2M+", label: "Produits analysés", icon: <TrendingUp className="w-6 h-6" /> },
    { value: "50+", label: "Pays couverts", icon: <Globe className="w-6 h-6" /> },
    { value: "99.9%", label: "Uptime garanti", icon: <Shield className="w-6 h-6" /> }
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
            <Target className="w-4 h-4 mr-2" />
            Notre Mission
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Révolutionner l'
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              e-commerce
            </span>{" "}
            avec l'IA
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            Chez ShopOpti, nous sommes convaincus que l'intelligence artificielle peut démocratiser 
            le succès en e-commerce. Notre mission est de donner à chaque entrepreneur les outils 
            et l'intelligence nécessaires pour identifier, importer et vendre les produits gagnants.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4 text-primary">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">
                Notre{" "}
                <span className="bg-gradient-accent bg-clip-text text-transparent">
                  histoire
                </span>
              </h2>
              <p className="text-xl text-muted-foreground">
                De l'idée d'un entrepreneur frustré à la plateforme leader du dropshipping
              </p>
            </div>

            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p className="text-lg leading-relaxed mb-6">
                Tout a commencé en 2020 quand Alexandre Dubois, après avoir passé 8 ans chez Amazon, 
                s'est lancé dans le dropshipping. Frustré par le manque d'outils intelligents pour 
                identifier les produits gagnants, il a décidé de créer la solution qu'il aurait 
                aimé avoir.
              </p>
              
              <p className="text-lg leading-relaxed mb-6">
                Avec l'aide de Marie Laurent, experte en intelligence artificielle, ils ont 
                développé le premier algorithme capable d'analyser des millions de produits 
                et d'identifier automatiquement ceux qui ont le plus de potentiel de vente.
              </p>
              
              <p className="text-lg leading-relaxed">
                Aujourd'hui, ShopOpti est utilisé par plus de 50,000 entrepreneurs dans plus 
                de 50 pays. Notre IA analyse plus de 2 millions de produits quotidiennement 
                et aide nos utilisateurs à générer des millions d'euros de chiffre d'affaires.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Nos{" "}
              <span className="bg-gradient-success bg-clip-text text-transparent">
                étapes clés
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              4 années d'innovation et de croissance
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                    {milestone.year}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Nos{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                valeurs
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Les principes qui guident chacune de nos décisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                    {value.icon}
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Notre{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                équipe
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Les experts qui rendent ShopOpti possible
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                    {member.avatar}
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription className="text-primary font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {member.description}
                  </p>
                  <div className="flex justify-center space-x-3">
                    <Button variant="ghost" size="sm">
                      <Linkedin className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Twitter className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Nous{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                contacter
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Notre équipe est là pour vous accompagner
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <CardTitle>Adresse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  42 Avenue des Champs-Élysées<br />
                  75008 Paris, France
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <CardTitle>Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  hello@shopopti.com<br />
                  support@shopopti.com
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                  <Phone className="w-6 h-6" />
                </div>
                <CardTitle>Téléphone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  +33 1 23 45 67 89<br />
                  Lun-Ven 9h-18h
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-hero/5">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Rejoignez l'
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                aventure
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Découvrez comment ShopOpti peut transformer votre e-commerce. 
              Rejoignez les 50,000+ entrepreneurs qui nous font confiance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow text-lg px-12 py-4">
                  <Rocket className="w-5 h-5 mr-2" />
                  Commencer Gratuitement
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="text-lg px-12 py-4">
                  Nous Contacter
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;