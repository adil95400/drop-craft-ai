import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Sparkles,
  Calendar,
  Clock,
  Star,
  Plus,
  Zap,
  Bot,
  BarChart3,
  Shield,
  Package,
  Globe,
  Smartphone,
  CheckCircle,
  ArrowUp,
  Bug,
  Wrench
} from "lucide-react";

const Changelog = () => {
  const updates = [
    {
      version: "3.2.0",
      date: "2024-01-15",
      type: "major",
      title: "IA de Prédiction v3.0",
      description: "Nouvelle génération d'intelligence artificielle avec 40% de précision en plus",
      features: [
        {
          type: "new",
          title: "Algorithme de prédiction avancé",
          description: "Analyse prédictive des tendances sur 6 mois avec 95% de précision"
        },
        {
          type: "new",
          title: "Détection en temps réel",
          description: "Identification instantanée des produits viraux dès leur émergence"
        },
        {
          type: "improvement",
          title: "Interface IA repensée",
          description: "Nouveau dashboard avec visualisations interactives et insights personnalisés"
        },
        {
          type: "improvement",
          title: "Performance optimisée",
          description: "Temps de traitement réduit de 60% pour l'analyse de millions de produits"
        }
      ],
      featured: true
    },
    {
      version: "3.1.5",
      date: "2024-01-10",
      type: "minor",
      title: "Intégrations TikTok Shop",
      description: "Nouvelles intégrations avec TikTok Shop et améliorations des performances",
      features: [
        {
          type: "new",
          title: "TikTok Shop intégration",
          description: "Synchronisation complète avec TikTok Shop pour le dropshipping"
        },
        {
          type: "new",
          title: "Analyse des vidéos virales",
          description: "Détection automatique des produits dans les vidéos TikTok trending"
        },
        {
          type: "fix",
          title: "Correction Shopify Plus",
          description: "Résolution des problèmes de synchronisation avec Shopify Plus"
        }
      ]
    },
    {
      version: "3.1.4",
      date: "2024-01-05",
      type: "patch",
      title: "Corrections et Optimisations",
      description: "Améliorations de stabilité et corrections de bugs",
      features: [
        {
          type: "fix",
          title: "Import AliExpress stabilisé",
          description: "Correction des timeouts lors des imports massifs"
        },
        {
          type: "fix",
          title: "Notifications en temps réel",
          description: "Résolution des problèmes de latence des notifications"
        },
        {
          type: "improvement",
          title: "Performance mobile",
          description: "Amélioration de la réactivité sur appareils mobiles"
        }
      ]
    },
    {
      version: "3.1.3",
      date: "2024-01-01",
      type: "minor",
      title: "Marketplace Européen",
      description: "Nouveaux fournisseurs européens et fonctionnalités de conformité",
      features: [
        {
          type: "new",
          title: "25 nouveaux fournisseurs EU",
          description: "Expansion massive avec des fournisseurs européens vérifiés"
        },
        {
          type: "new",
          title: "Conformité RGPD renforcée",
          description: "Outils automatiques de conformité pour les boutiques européennes"
        },
        {
          type: "improvement",
          title: "Temps de livraison optimisés",
          description: "Livraisons 3-7 jours pour l'Europe avec les nouveaux partenaires"
        }
      ]
    },
    {
      version: "3.1.2",
      date: "2023-12-20",
      type: "major",
      title: "Dashboard Ultra Pro",
      description: "Refonte complète du tableau de bord avec analytics avancés",
      features: [
        {
          type: "new",
          title: "Analytics en temps réel",
          description: "Métriques live avec mise à jour toutes les 30 secondes"
        },
        {
          type: "new",
          title: "Rapports personnalisables",
          description: "Créateur de rapports avec 50+ métriques disponibles"
        },
        {
          type: "new",
          title: "Alertes intelligentes",
          description: "Notifications automatiques basées sur vos KPIs critiques"
        },
        {
          type: "improvement",
          title: "Performance x3",
          description: "Chargement des données 3 fois plus rapide"
        }
      ]
    },
    {
      version: "3.1.1",
      date: "2023-12-15",
      type: "minor",
      title: "Automatisation Avancée",
      description: "Nouveaux workflows d'automatisation et API v2",
      features: [
        {
          type: "new",
          title: "Workflows visuels",
          description: "Créateur de workflows par glisser-déposer sans code"
        },
        {
          type: "new",
          title: "API v2 complète",
          description: "Nouvelle API REST avec 200+ endpoints documentés"
        },
        {
          type: "improvement",
          title: "Intégrations Zapier",
          description: "Connectez ShopOpti à 3000+ applications via Zapier"
        }
      ]
    }
  ];

  const roadmap = [
    {
      quarter: "Q2 2024",
      title: "IA Multimodale",
      description: "Analyse des images, vidéos et textes pour une détection encore plus précise",
      status: "En développement",
      features: ["Analyse d'images", "Reconnaissance vidéo", "NLP avancé"]
    },
    {
      quarter: "Q3 2024",
      title: "Expansion Internationale",
      description: "Support de 20 nouvelles langues et marchés locaux",
      status: "Planifié",
      features: ["Support multilingue", "Devises locales", "Fournisseurs régionaux"]
    },
    {
      quarter: "Q4 2024",
      title: "ShopOpti Enterprise",
      description: "Solution dédiée aux grandes entreprises avec fonctionnalités avancées",
      status: "Planifié",
      features: ["Multi-tenant", "SLA garantis", "Support dédié"]
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "new":
        return <Plus className="w-4 h-4 text-success" />;
      case "improvement":
        return <ArrowUp className="w-4 h-4 text-primary" />;
      case "fix":
        return <Bug className="w-4 h-4 text-warning" />;
      default:
        return <Wrench className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "new":
        return "Nouveau";
      case "improvement":
        return "Amélioration";
      case "fix":
        return "Correction";
      default:
        return "Modification";
    }
  };

  const getVersionBadge = (type: string) => {
    switch (type) {
      case "major":
        return <Badge className="bg-primary">Majeure</Badge>;
      case "minor":
        return <Badge variant="secondary">Mineure</Badge>;
      case "patch":
        return <Badge variant="outline">Correction</Badge>;
      default:
        return <Badge variant="outline">Mise à jour</Badge>;
    }
  };

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
            <Calendar className="w-4 h-4 mr-2" />
            Nouveautés & Mises à Jour
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Changelog{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              ShopOpti
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Découvrez toutes les nouveautés, améliorations et corrections apportées 
            à ShopOpti. Nous innovons continuellement pour votre succès.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow">
              <Zap className="w-5 h-5 mr-2" />
              Voir les Dernières Nouveautés
            </Button>
            <Button variant="outline" size="lg">
              <Star className="w-5 h-5 mr-2" />
              S'abonner aux Notifications
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Version actuelle</span>
                  <Badge className="bg-primary">v3.2.0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Dernière MAJ</span>
                  <span className="text-sm font-medium">15 Jan 2024</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Nouveautés</span>
                  <span className="text-sm font-medium text-success">12 cette semaine</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Prochaine MAJ</span>
                  <span className="text-sm font-medium">~22 Jan 2024</span>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Catégories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: <Bot className="w-4 h-4" />, name: "Intelligence Artificielle", count: 8 },
                  { icon: <BarChart3 className="w-4 h-4" />, name: "Analytics", count: 12 },
                  { icon: <Package className="w-4 h-4" />, name: "Intégrations", count: 15 },
                  { icon: <Shield className="w-4 h-4" />, name: "Sécurité", count: 6 },
                  { icon: <Smartphone className="w-4 h-4" />, name: "Mobile", count: 4 },
                  { icon: <Globe className="w-4 h-4" />, name: "API", count: 9 }
                ].map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="text-primary">{category.icon}</div>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{category.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Updates List */}
            <div className="space-y-8">
              {updates.map((update, index) => (
                <Card key={index} className={`relative overflow-hidden ${update.featured ? 'border-primary shadow-glow' : ''}`}>
                  {update.featured && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary">
                        <Star className="w-3 h-3 mr-1" />
                        Nouveau
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="font-mono">{update.version}</Badge>
                          {getVersionBadge(update.type)}
                        </div>
                        <CardTitle className="text-2xl">{update.title}</CardTitle>
                        <CardDescription className="text-base">{update.description}</CardDescription>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(update.date).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {update.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start space-x-3 p-4 rounded-lg bg-muted/30">
                          <div className="flex-shrink-0 mt-0.5">
                            {getTypeIcon(feature.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(feature.type)}
                              </Badge>
                              <h4 className="font-semibold text-sm">{feature.title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Roadmap Section */}
            <div className="border-t border-border pt-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  Roadmap{" "}
                  <span className="bg-gradient-accent bg-clip-text text-transparent">
                    2024
                  </span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Découvrez ce qui vous attend dans les prochains mois
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {roadmap.map((item, index) => (
                  <Card key={index} className="hover:shadow-glow transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{item.quarter}</Badge>
                        <Badge 
                          className={
                            item.status === "En développement" 
                              ? "bg-yellow-500" 
                              : "bg-muted-foreground"
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-2">
                        {item.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Restez{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              informé
            </span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Recevez les notifications des nouvelles fonctionnalités directement dans votre tableau de bord
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow">
              <Star className="w-5 h-5 mr-2" />
              Activer les Notifications
            </Button>
            <Button variant="outline" size="lg">
              <Calendar className="w-5 h-5 mr-2" />
              S'abonner au Changelog
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Changelog;