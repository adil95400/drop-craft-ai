import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ShoppingCart,
  Search,
  Filter,
  Calendar,
  Award,
  Bookmark
} from "lucide-react";

const GuidesNew = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "Tous les guides", count: 156 },
    { id: "getting-started", name: "Premiers Pas", count: 24 },
    { id: "ai-features", name: "Intelligence Artificielle", count: 18 },
    { id: "product-research", name: "Recherche de Produits", count: 32 },
    { id: "marketing", name: "Marketing & Ventes", count: 28 },
    { id: "analytics", name: "Analytics", count: 22 },
    { id: "automation", name: "Automatisation", count: 16 },
    { id: "advanced", name: "Techniques Avancées", count: 16 }
  ];

  const featuredGuides = [
    {
      id: 1,
      title: "Guide Complet du Dropshipping 2024",
      description: "Le guide ultime pour démarrer et réussir en dropshipping avec ShopOpti",
      author: "Équipe ShopOpti",
      category: "getting-started",
      type: "Guide Complet",
      duration: "120 min",
      difficulty: "Débutant",
      rating: 4.9,
      downloads: 15420,
      lessons: 15,
      updated: "2024-01-15",
      featured: true,
      premium: false,
      videoCount: 8,
      worksheets: 5,
      tags: ["dropshipping", "débutant", "stratégie", "2024"]
    },
    {
      id: 2,
      title: "Maîtriser l'IA de ShopOpti",
      description: "Exploitez toute la puissance de notre intelligence artificielle",
      author: "Marie Laurent, CTO",
      category: "ai-features",
      type: "Masterclass",
      duration: "90 min",
      difficulty: "Intermédiaire",
      rating: 4.8,
      downloads: 8950,
      lessons: 12,
      updated: "2024-01-10",
      featured: true,
      premium: true,
      videoCount: 12,
      worksheets: 3,
      tags: ["IA", "automatisation", "tendances", "prédictif"]
    },
    {
      id: 3,
      title: "Stratégies Marketing Avancées",
      description: "Techniques avancées pour optimiser vos campagnes publicitaires",
      author: "Alexandre Dubois, CMO",
      category: "marketing",
      type: "Formation Expert",
      duration: "150 min",
      difficulty: "Avancé",
      rating: 4.9,
      downloads: 6720,
      lessons: 18,
      updated: "2024-01-08",
      featured: true,
      premium: true,
      videoCount: 15,
      worksheets: 7,
      tags: ["facebook ads", "google ads", "conversion", "ROI"]
    }
  ];

  const guideCategories = [
    {
      id: "getting-started",
      title: "Premiers Pas",
      description: "Démarrez votre aventure e-commerce",
      icon: <Lightbulb className="w-6 h-6" />,
      color: "bg-gradient-primary",
      guides: [
        {
          title: "Configuration initiale de ShopOpti",
          description: "Paramétrez votre compte en 30 minutes",
          type: "Guide",
          duration: "30 min",
          difficulty: "Débutant",
          rating: 4.8,
          downloads: 3400,
          lessons: 8,
          free: true
        },
        {
          title: "Intégrations essentielles",
          description: "Connectez Shopify, WooCommerce et vos outils",
          type: "Tutoriel",
          duration: "45 min",
          difficulty: "Débutant",
          rating: 4.7,
          downloads: 2890,
          lessons: 10,
          free: true
        },
        {
          title: "Comprendre les métriques",
          description: "Analysez vos performances comme un pro",
          type: "Formation",
          duration: "35 min",
          difficulty: "Débutant",
          rating: 4.6,
          downloads: 2150,
          lessons: 7,
          free: false
        }
      ]
    },
    {
      id: "ai-features",
      title: "Intelligence Artificielle",
      description: "Exploitez la puissance de l'IA",
      icon: <Bot className="w-6 h-6" />,
      color: "bg-gradient-accent",
      guides: [
        {
          title: "IA de détection des produits gagnants",
          description: "Comment l'IA identifie les opportunités",
          type: "Masterclass",
          duration: "75 min",
          difficulty: "Intermédiaire",
          rating: 4.9,
          downloads: 5200,
          lessons: 12,
          free: false
        },
        {
          title: "Optimisation automatique SEO",
          description: "L'IA améliore vos contenus automatiquement",
          type: "Guide",
          duration: "40 min",
          difficulty: "Débutant",
          rating: 4.7,
          downloads: 3800,
          lessons: 8,
          free: false
        },
        {
          title: "Prédictions de tendances",
          description: "Anticipez les tendances avec l'IA prédictive",
          type: "Formation Expert",
          duration: "60 min",
          difficulty: "Avancé",
          rating: 4.8,
          downloads: 2950,
          lessons: 10,
          free: false
        }
      ]
    },
    {
      id: "product-research",
      title: "Recherche de Produits",
      description: "Trouvez vos produits gagnants",
      icon: <Target className="w-6 h-6" />,
      color: "bg-gradient-success",
      guides: [
        {
          title: "Méthodologie de recherche 2024",
          description: "La stratégie complète pour identifier les gagnants",
          type: "Masterclass",
          duration: "90 min",
          difficulty: "Intermédiaire",
          rating: 4.9,
          downloads: 6800,
          lessons: 15,
          free: false
        },
        {
          title: "Analyse de la concurrence",
          description: "Espionnez légalement vos concurrents",
          type: "Guide",
          duration: "50 min",
          difficulty: "Intermédiaire",
          rating: 4.6,
          downloads: 4200,
          lessons: 9,
          free: true
        },
        {
          title: "Validation de niches rentables",
          description: "Testez vos idées avant d'investir",
          type: "Formation",
          duration: "65 min",
          difficulty: "Avancé",
          rating: 4.8,
          downloads: 3600,
          lessons: 11,
          free: false
        }
      ]
    }
  ];

  const learningPaths = [
    {
      title: "Parcours Débutant Complet",
      description: "De zéro à votre première vente en 30 jours",
      duration: "8 heures",
      courses: 6,
      level: "Débutant",
      color: "bg-gradient-primary",
      icon: <BookOpen className="w-6 h-6" />
    },
    {
      title: "Expert en IA E-commerce",
      description: "Maîtrisez toutes les fonctionnalités IA",
      duration: "12 heures",
      courses: 8,
      level: "Intermédiaire",
      color: "bg-gradient-accent",
      icon: <Bot className="w-6 h-6" />
    },
    {
      title: "Scaling & Automatisation",
      description: "Développez un empire e-commerce automatisé",
      duration: "15 heures",
      courses: 10,
      level: "Avancé",
      color: "bg-gradient-hero",
      icon: <TrendingUp className="w-6 h-6" />
    }
  ];

  const liveEvents = [
    {
      title: "Webinaire : Tendances Q1 2024",
      date: "Jeudi 25 Jan • 14h00",
      presenter: "Marie Laurent, CTO",
      attendees: 450,
      type: "live",
      free: true
    },
    {
      title: "Workshop : Facebook Ads Avancé",
      date: "Vendredi 26 Jan • 16h00",
      presenter: "Alexandre Dubois, CMO",
      attendees: 200,
      type: "workshop",
      free: false
    },
    {
      title: "Q&A Communauté",
      date: "Samedi 27 Jan • 10h00",
      presenter: "Équipe Support",
      attendees: 350,
      type: "qa",
      free: true
    }
  ];

  const filteredCategories = guideCategories.filter(category => 
    selectedCategory === "all" || category.id === selectedCategory
  );

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
            Université{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              ShopOpti
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Formations complètes, guides détaillés et masterclass exclusives pour 
            maîtriser l'e-commerce moderne avec l'intelligence artificielle.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow">
              <Play className="w-5 h-5 mr-2" />
              Commencer les Formations
            </Button>
            <Button variant="outline" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Kit de Démarrage Gratuit
            </Button>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Rechercher guides, formations, tutoriels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2"
              >
                <span>{category.name}</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Formations{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                vedettes
              </span>
            </h2>
            <p className="text-muted-foreground">Les plus populaires ce mois-ci</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {featuredGuides.map((guide) => (
              <Card key={guide.id} className="group hover:shadow-glow transition-all duration-300 cursor-pointer relative overflow-hidden">
                {guide.featured && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-primary">
                      <Star className="w-3 h-3 mr-1" />
                      Vedette
                    </Badge>
                  </div>
                )}
                {guide.premium && (
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-gradient-hero text-white">
                      <Award className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                )}
                
                <div className="h-48 bg-gradient-primary/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-primary/20" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between text-white text-sm">
                      <div className="flex items-center space-x-2">
                        <Video className="w-4 h-4" />
                        <span>{guide.videoCount} vidéos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>{guide.worksheets} fiches</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardHeader>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="text-xs">{guide.type}</Badge>
                    <Badge variant="secondary" className="text-xs">{guide.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {guide.title}
                  </CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                  <div className="text-sm text-muted-foreground">
                    Par {guide.author}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{guide.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{guide.lessons} leçons</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{guide.rating}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {guide.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      <Download className="w-4 h-4 inline mr-1" />
                      {guide.downloads.toLocaleString()} téléchargements
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Màj: {new Date(guide.updated).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  
                  <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {guide.premium ? (
                      <>
                        <Award className="w-4 h-4 mr-2" />
                        Accès Premium
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Commencer Gratuitement
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Parcours d'Apprentissage</h2>
            <p className="text-muted-foreground">Formations structurées par niveau</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {learningPaths.map((path, index) => (
              <Card key={index} className="group hover:shadow-glow transition-all duration-300 cursor-pointer">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${path.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-4`}>
                    {path.icon}
                  </div>
                  <CardTitle className="text-xl">{path.title}</CardTitle>
                  <CardDescription>{path.description}</CardDescription>
                  <Badge variant="outline" className="w-fit mx-auto">{path.level}</Badge>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                      <div className="font-semibold">{path.duration}</div>
                      <div className="text-muted-foreground">de formation</div>
                    </div>
                    <div>
                      <div className="font-semibold">{path.courses}</div>
                      <div className="text-muted-foreground">cours inclus</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Voir le Parcours
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
                expertise
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Du débutant à l'expert : trouvez le contenu adapté à votre niveau
            </p>
          </div>

          <div className="space-y-16">
            {filteredCategories.map((category) => (
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
                    <Card key={index} className="group hover:shadow-glow transition-all duration-300 cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">{guide.type}</Badge>
                            <Badge variant="secondary" className="text-xs">{guide.difficulty}</Badge>
                          </div>
                          {guide.free && (
                            <Badge className="bg-success text-xs">Gratuit</Badge>
                          )}
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
                            <BookOpen className="w-4 h-4" />
                            <span>{guide.lessons} leçons</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{guide.rating}</span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-4">
                          <Download className="w-4 h-4 inline mr-1" />
                          {guide.downloads} téléchargements
                        </div>
                        
                        <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {guide.free ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Accès Gratuit
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-4 h-4 mr-2" />
                              Voir le Guide
                            </>
                          )}
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

      {/* Live Events */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Événements{" "}
              <span className="bg-gradient-success bg-clip-text text-transparent">
                en direct
              </span>
            </h2>
            <p className="text-muted-foreground">Participez à nos formations live</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {liveEvents.map((event, index) => (
              <Card key={index} className="group hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`
                      ${event.type === 'live' ? 'bg-destructive' : ''}
                      ${event.type === 'workshop' ? 'bg-primary' : ''}
                      ${event.type === 'qa' ? 'bg-success' : ''}
                    `}>
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                      {event.type === 'live' ? 'Live' : event.type === 'workshop' ? 'Workshop' : 'Q&A'}
                    </Badge>
                    {event.free && (
                      <Badge variant="outline" className="text-success border-success">
                        Gratuit
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {event.date}
                  </CardDescription>
                  <div className="text-sm text-muted-foreground">
                    Par {event.presenter}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      <Users className="w-4 h-4 inline mr-1" />
                      {event.attendees} participants
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    S'inscrire
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default GuidesNew;