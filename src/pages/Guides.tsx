import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Sparkles,
  BookOpen,
  Video,
  Download,
  Clock,
  Users,
  Star,
  Play,
  FileText,
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  ArrowRight,
  Bot,
  BarChart3,
  ShoppingCart
} from "lucide-react";

const Guides = () => {
  const guideCategories = [
    {
      id: "getting-started",
      title: "Premiers Pas",
      description: "Tout pour bien commencer avec ShopOpti",
      icon: <Lightbulb className="w-6 h-6" />,
      color: "bg-gradient-primary",
      guides: [
        {
          title: "Guide de démarrage rapide",
          description: "Configurez votre première boutique en 30 minutes",
          type: "Guide",
          duration: "30 min",
          difficulty: "Débutant",
          downloads: 2850,
          rating: 4.9,
          featured: true
        },
        {
          title: "Configuration des intégrations",
          description: "Connectez Shopify, WooCommerce et vos fournisseurs",
          type: "Tutoriel",
          duration: "45 min",
          difficulty: "Débutant",
          downloads: 1920,
          rating: 4.8
        },
        {
          title: "Comprendre le tableau de bord",
          description: "Maîtrisez l'interface et les métriques importantes",
          type: "Guide",
          duration: "20 min",
          difficulty: "Débutant",
          downloads: 1650,
          rating: 4.7
        }
      ]
    },
    {
      id: "ai-features",
      title: "Intelligence Artificielle",
      description: "Maximisez l'IA pour vos produits gagnants",
      icon: <Bot className="w-6 h-6" />,
      color: "bg-gradient-accent",
      guides: [
        {
          title: "Guide complet de l'IA de détection",
          description: "Comment l'IA identifie les produits gagnants",
          type: "Guide Expert",
          duration: "60 min",
          difficulty: "Intermédiaire",
          downloads: 3200,
          rating: 4.9,
          featured: true
        },
        {
          title: "Optimisation automatique des descriptions",
          description: "Laissez l'IA améliorer vos fiches produits",
          type: "Tutoriel",
          duration: "25 min",
          difficulty: "Débutant",
          downloads: 1800,
          rating: 4.6
        },
        {
          title: "Analyse prédictive des tendances",
          description: "Anticipez les tendances avant vos concurrents",
          type: "Guide",
          duration: "40 min",
          difficulty: "Avancé",
          downloads: 2100,
          rating: 4.8
        }
      ]
    },
    {
      id: "product-research",
      title: "Recherche de Produits",
      description: "Trouvez et validez vos produits gagnants",
      icon: <Target className="w-6 h-6" />,
      color: "bg-gradient-success",
      guides: [
        {
          title: "Méthodologie de recherche produits 2024",
          description: "La stratégie complète pour identifier les gagnants",
          type: "Masterclass",
          duration: "90 min",
          difficulty: "Intermédiaire",
          downloads: 4100,
          rating: 4.9,
          featured: true
        },
        {
          title: "Analyse de la concurrence",
          description: "Espionnez légalement vos concurrents",
          type: "Guide",
          duration: "35 min",
          difficulty: "Intermédiaire",
          downloads: 2650,
          rating: 4.7
        },
        {
          title: "Validation des niches rentables",
          description: "Testez vos idées avant d'investir",
          type: "Tutoriel",
          duration: "50 min",
          difficulty: "Avancé",
          downloads: 1950,
          rating: 4.8
        }
      ]
    },
    {
      id: "marketing",
      title: "Marketing & Ventes",
      description: "Optimisez vos campagnes et conversions",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-gradient-hero",
      guides: [
        {
          title: "Facebook Ads pour dropshippers",
          description: "Créez des campagnes publicitaires rentables",
          type: "Masterclass",
          duration: "120 min",
          difficulty: "Intermédiaire",
          downloads: 5200,
          rating: 4.9,
          featured: true
        },
        {
          title: "Optimisation du taux de conversion",
          description: "Transformez plus de visiteurs en clients",
          type: "Guide",
          duration: "55 min",
          difficulty: "Intermédiaire",
          downloads: 3100,
          rating: 4.8
        },
        {
          title: "Email marketing automatisé",
          description: "Fidélisez et relancez vos clients",
          type: "Tutoriel",
          duration: "40 min",
          difficulty: "Débutant",
          downloads: 2300,
          rating: 4.6
        }
      ]
    },
    {
      id: "analytics",
      title: "Analytics & Optimisation",
      description: "Analysez et optimisez vos performances",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-gradient-soft",
      guides: [
        {
          title: "Maîtriser les KPIs e-commerce",
          description: "Les métriques qui comptent vraiment",
          type: "Guide",
          duration: "45 min",
          difficulty: "Intermédiaire",
          downloads: 2800,
          rating: 4.7
        },
        {
          title: "Rapports personnalisés avancés",
          description: "Créez vos tableaux de bord sur mesure",
          type: "Tutoriel",
          duration: "30 min",
          difficulty: "Avancé",
          downloads: 1600,
          rating: 4.5
        },
        {
          title: "A/B testing pour boutiques",
          description: "Testez et améliorez continuellement",
          type: "Guide",
          duration: "50 min",
          difficulty: "Avancé",
          downloads: 1850,
          rating: 4.8
        }
      ]
    }
  ];

  const featuredResources = [
    {
      title: "Kit de démarrage dropshipping 2024",
      description: "Tous les templates, checklists et outils pour lancer votre business",
      type: "Pack Complet",
      items: ["50+ templates", "Checklists", "Calculateurs", "Scripts"],
      downloads: 12500,
      price: "Gratuit",
      featured: true
    },
    {
      title: "Base de données fournisseurs vérifiés",
      description: "200+ fournisseurs testés et approuvés par notre équipe",
      type: "Database",
      items: ["200+ fournisseurs", "Contacts directs", "Notes qualité", "Temps livraison"],
      downloads: 8900,
      price: "Pro uniquement"
    },
    {
      title: "Scripts d'automatisation avancés",
      description: "Automatisez vos tâches répétitives avec nos scripts prêts à l'emploi",
      type: "Scripts",
      items: ["10+ scripts", "Documentation", "Support", "Mises à jour"],
      downloads: 3200,
      price: "Ultra Pro"
    }
  ];

  const webinars = [
    {
      title: "Masterclass : IA et Dropshipping en 2024",
      date: "Tous les mardis à 14h",
      presenter: "Marie Laurent, CTO ShopOpti",
      attendees: 500,
      live: true
    },
    {
      title: "Q&A Hebdomadaire avec les Experts",
      date: "Tous les vendredis à 16h",
      presenter: "Équipe Support ShopOpti",
      attendees: 300,
      live: true
    },
    {
      title: "Analyse de Boutiques en Direct",
      date: "Premier jeudi du mois à 15h",
      presenter: "Alexandre Dubois, CEO",
      attendees: 800,
      live: true
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
      <section className="py-24 px-4 bg-gradient-hero/5">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <BookOpen className="w-4 h-4 mr-2" />
            Centre de Formation
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Apprenez à{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              maîtriser
            </span>{" "}
            ShopOpti
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Guides détaillés, tutoriels vidéo et formations live pour transformer 
            votre e-commerce en machine à profits.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow">
              <Play className="w-5 h-5 mr-2" />
              Commencer la Formation
            </Button>
            <Button variant="outline" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Télécharger le Kit Gratuit
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ressources Essentielles</h2>
            <p className="text-muted-foreground">Les outils indispensables pour réussir</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredResources.map((resource, index) => (
              <Card key={index} className={`relative overflow-hidden ${resource.featured ? 'border-primary shadow-glow' : ''}`}>
                {resource.featured && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary">
                      <Star className="w-3 h-3 mr-1" />
                      Populaire
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                  <Badge variant="secondary" className="w-fit">{resource.type}</Badge>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2 mb-6">
                    {resource.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      <Download className="w-4 h-4 inline mr-1" />
                      {resource.downloads.toLocaleString()} téléchargements
                    </div>
                    <div className="font-semibold text-primary">{resource.price}</div>
                  </div>
                  
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Guide Categories */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Guides par{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                catégorie
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Formation progressive du débutant à l'expert
            </p>
          </div>

          <div className="space-y-16">
            {guideCategories.map((category) => (
              <div key={category.id}>
                <div className="flex items-center space-x-4 mb-8">
                  <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center text-white`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{category.title}</h3>
                    <p className="text-muted-foreground">{category.description}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.guides.map((guide, index) => (
                    <Card key={index} className={`group hover:shadow-glow transition-all duration-300 cursor-pointer ${guide.featured ? 'border-primary/50' : ''}`}>
                      {guide.featured && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-primary">
                            <Star className="w-3 h-3 mr-1" />
                            Vedette
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs">{guide.type}</Badge>
                          <Badge variant="secondary" className="text-xs">{guide.difficulty}</Badge>
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {guide.title}
                        </CardTitle>
                        <CardDescription>{guide.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{guide.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Download className="w-4 h-4" />
                            <span>{guide.downloads}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{guide.rating}</span>
                          </div>
                        </div>
                        
                        <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Consulter le Guide
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Webinars */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Formations{" "}
              <span className="bg-gradient-success bg-clip-text text-transparent">
                en direct
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Participez à nos webinaires live et posez vos questions aux experts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {webinars.map((webinar, index) => (
              <Card key={index} className="relative overflow-hidden">
                {webinar.live && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-red-500 text-white animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full mr-2" />
                      Live
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-lg">{webinar.title}</CardTitle>
                  <CardDescription>{webinar.date}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{webinar.attendees} participants habituels</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Animé par <strong>{webinar.presenter}</strong>
                    </div>
                    
                    <Button className="w-full bg-gradient-primary hover:bg-primary-hover">
                      <Video className="w-4 h-4 mr-2" />
                      S'inscrire Gratuitement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à devenir un{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                expert
              </span>{" "}
              ?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Accédez à tous nos guides, formations et ressources exclusives 
              avec votre compte ShopOpti.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow text-lg px-12 py-4">
                  <Zap className="w-5 h-5 mr-2" />
                  Accéder aux Formations
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-12 py-4">
                <FileText className="w-5 h-5 mr-2" />
                Télécharger le Guide Gratuit
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>100+ guides disponibles</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Formations live incluses</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Support expert</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Guides;