import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Sparkles,
  MapPin,
  Globe,
  Users,
  Award,
  Target,
  TrendingUp,
  Shield,
  Rocket,
  Star,
  ArrowRight,
  CheckCircle,
  Calendar,
  Building,
  UserCheck,
  Trophy,
  BarChart3,
  Zap
} from "lucide-react";

const CompanyPage = () => {
  const companyValues = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Excellence",
      description: "Nous visons l'excellence dans chaque fonctionnalité, chaque interaction et chaque résultat client."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Client-Centrisme",
      description: "Nos clients sont au cœur de chaque décision. Leur succès est notre unique priorité."
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Innovation",
      description: "Nous repoussons constamment les limites de l'IA pour créer l'avenir du e-commerce."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Transparence",
      description: "Transparence totale dans nos prix, notre technologie et nos résultats."
    }
  ];

  const timeline = [
    {
      year: "2020",
      title: "Fondation de ShopOpti",
      description: "Alexandre et Marie lancent la première version avec 5 fournisseurs connectés",
      achievement: "500 premiers utilisateurs"
    },
    {
      year: "2021", 
      title: "Première IA de Détection",
      description: "Lancement de notre algorithme révolutionnaire d'identification de produits gagnants",
      achievement: "5,000 utilisateurs actifs"
    },
    {
      year: "2022",
      title: "Expansion Européenne",
      description: "Ouverture en Belgique, Suisse et Allemagne avec 25+ fournisseurs",
      achievement: "25,000 utilisateurs"
    },
    {
      year: "2023",
      title: "Levée de Fonds Série A",
      description: "7M€ levés pour accélérer l'IA et l'expansion internationale",
      achievement: "50,000 utilisateurs"
    },
    {
      year: "2024",
      title: "Leader du Marché Français",
      description: "Plus grande plateforme de dropshipping IA en France avec 100+ intégrations",
      achievement: "75,000+ utilisateurs"
    }
  ];

  const team = [
    {
      name: "Alexandre Dubois",
      role: "CEO & Co-Fondateur",
      bio: "Ex-Amazon (8 ans), expert e-commerce. Diplômé HEC Paris. Passionné d'entrepreneuriat et d'innovation.",
      experience: "12 ans e-commerce",
      avatar: "AD",
      social: { linkedin: "#", twitter: "#" }
    },
    {
      name: "Marie Laurent", 
      role: "CTO & Co-Fondatrice",
      bio: "Ex-Google AI (6 ans), PhD Intelligence Artificielle Stanford. Experte machine learning et big data.",
      experience: "10 ans IA",
      avatar: "ML",
      social: { linkedin: "#", twitter: "#" }
    },
    {
      name: "Thomas Martin",
      role: "VP Product & Design",
      bio: "Ex-Figma, designer produit passionné par l'UX. Créateur d'interfaces utilisées par millions de personnes.",
      experience: "8 ans Product",
      avatar: "TM", 
      social: { linkedin: "#", twitter: "#" }
    },
    {
      name: "Sophie Chen",
      role: "Head of AI & Data Science",
      bio: "Ex-DeepMind, PhD MIT en Machine Learning. Spécialiste des algorithmes prédictifs et NLP.",
      experience: "7 ans AI Research",
      avatar: "SC",
      social: { linkedin: "#", twitter: "#" }
    },
    {
      name: "Julien Bernard",
      role: "VP Engineering",
      bio: "Ex-Spotify, architecte logiciel senior. Expert infrastructure cloud et systèmes distribués.",
      experience: "9 ans Engineering",
      avatar: "JB",
      social: { linkedin: "#", twitter: "#" }
    },
    {
      name: "Camille Rousseau",
      role: "Head of Customer Success",
      bio: "Ex-Zendesk, experte en relation client et croissance. Passionnée par la réussite des entrepreneurs.",
      experience: "6 ans Customer Success",
      avatar: "CR",
      social: { linkedin: "#", twitter: "#" }
    }
  ];

  const achievements = [
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Prix Innovation 2024",
      description: "Meilleure solution IA e-commerce France",
      organization: "Tech Awards France"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Top 3 FrenchTech",
      description: "Startup française la plus prometteuse",
      organization: "La French Tech"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Excellence Client",
      description: "98% de satisfaction client",
      organization: "TrustPilot"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Croissance +400%",
      description: "Revenue growth année sur année",
      organization: "Les Échos"
    }
  ];

  const stats = [
    { value: "75,000+", label: "Entrepreneurs nous font confiance", icon: <Users className="w-6 h-6" /> },
    { value: "€50M+", label: "CA généré par nos clients", icon: <TrendingUp className="w-6 h-6" /> },
    { value: "100+", label: "Intégrations disponibles", icon: <Globe className="w-6 h-6" /> },
    { value: "98%", label: "Taux de satisfaction", icon: <Star className="w-6 h-6" /> }
  ];

  const offices = [
    {
      city: "Paris, France",
      address: "42 Avenue des Champs-Élysées, 75008",
      type: "Siège Social",
      size: "150 employés"
    },
    {
      city: "Lyon, France", 
      address: "15 Rue de la République, 69002",
      type: "Hub R&D",
      size: "50 employés"
    },
    {
      city: "London, UK",
      address: "25 Old Street, EC1V 9HL",
      type: "Bureau International",
      size: "25 employés"
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
            <Building className="w-4 h-4 mr-2" />
            À Propos de ShopOpti
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Nous révolutionnons l'
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              e-commerce
            </span>{" "}
            avec l'IA
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-4xl mx-auto">
            Depuis 2020, ShopOpti démocratise le succès en dropshipping grâce à l'intelligence 
            artificielle. Notre mission : donner à chaque entrepreneur les outils pour réussir.
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
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Notre{" "}
                <span className="bg-gradient-accent bg-clip-text text-transparent">
                  Mission
                </span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Démocratiser le succès en e-commerce en rendant l'intelligence artificielle 
                accessible à tous les entrepreneurs, peu importe leur niveau technique ou leur budget.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Nous croyons que chaque personne mérite d'avoir accès aux mêmes outils 
                que les grandes entreprises pour réussir son business en ligne.
              </p>
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Notre{" "}
                <span className="bg-gradient-success bg-clip-text text-transparent">
                  Vision
                </span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Devenir la plateforme de référence mondiale pour l'e-commerce intelligent, 
                où l'IA transforme chaque décision business en opportunité de croissance.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                D'ici 2027, permettre à 1 million d'entrepreneurs de créer des business 
                durables et rentables grâce à notre technologie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Notre{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Histoire
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              4 années d'innovation et de croissance continue
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {timeline.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {milestone.year}
                  </div>
                  <Card className="flex-1">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{milestone.title}</CardTitle>
                        <Badge className="bg-success text-success-foreground">
                          {milestone.achievement}
                        </Badge>
                      </div>
                      <CardDescription className="text-base">
                        {milestone.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
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
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Valeurs
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Les principes qui guident chacune de nos actions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {companyValues.map((value, index) => (
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

      {/* Team Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Notre{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                Équipe
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Les experts qui rendent ShopOpti possible
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {member.avatar}
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription className="text-primary font-medium">
                    {member.role}
                  </CardDescription>
                  <Badge variant="secondary" className="mt-2">
                    {member.experience}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Nos{" "}
              <span className="bg-gradient-success bg-clip-text text-transparent">
                Récompenses
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Reconnaissance de notre excellence et innovation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <Card key={index} className="text-center hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-success rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                    {achievement.icon}
                  </div>
                  <CardTitle className="text-lg">{achievement.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                  <p className="text-xs text-primary font-medium">{achievement.organization}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Nos{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Bureaux
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Présence internationale avec des équipes locales
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {offices.map((office, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{office.city}</CardTitle>
                  <Badge variant="secondary">{office.type}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{office.address}</p>
                  <p className="text-xs text-primary font-medium">{office.size}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-12">
              <UserCheck className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">
                Rejoignez l'
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  aventure
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Découvrez comment ShopOpti peut transformer votre e-commerce. 
                Rejoignez les 75,000+ entrepreneurs qui nous font confiance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow">
                    <Rocket className="w-5 h-5 mr-2" />
                    Commencer Gratuitement
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg">
                    Rencontrer l'Équipe
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Essai gratuit 14 jours</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Support français</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Données sécurisées en France</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default CompanyPage;