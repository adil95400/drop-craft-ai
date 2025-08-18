import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradeButton } from "@/components/common/UpgradeButton";
import { Star, MessageSquare, TrendingUp, Shield, Zap, Brain, Globe, BarChart3 } from "lucide-react";

export default function ReviewsUltraProOptimized() {
  const features = [
    {
      icon: Star,
      title: "Collecte Automatisée",
      description: "Demandes d'avis automatiques avec timing optimal et personnalisation"
    },
    {
      icon: MessageSquare,
      title: "Réponses IA",
      description: "Génération automatique de réponses personnalisées aux avis clients"
    },
    {
      icon: TrendingUp,
      title: "Analyse Sentiment",
      description: "Analyse IA du sentiment et détection des tendances émotionnelles"
    },
    {
      icon: Shield,
      title: "Modération Intelligente",
      description: "Filtrage automatique des faux avis et détection de fraude"
    },
    {
      icon: Zap,
      title: "Alertes Temps Réel",
      description: "Notifications instantanées pour les avis négatifs et critiques"
    },
    {
      icon: Brain,
      title: "Insights Prédictifs",
      description: "Prédictions de satisfaction client et recommandations d'amélioration"
    },
    {
      icon: Globe,
      title: "Multi-Plateformes",
      description: "Gestion centralisée des avis sur toutes les plateformes (Google, Amazon, etc.)"
    },
    {
      icon: BarChart3,
      title: "Analytics Avancés",
      description: "Rapports détaillés avec métriques de satisfaction et ROI"
    }
  ];

  const reviewStats = [
    { label: "Avis Collectés", value: "+500%", description: "Augmentation moyenne" },
    { label: "Note Moyenne", value: "+1.2★", description: "Amélioration rating" },
    { label: "Temps de Réponse", value: "< 1min", description: "Réponse automatique" },
    { label: "Détection Fraude", value: "99.8%", description: "Précision IA" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Reviews Ultra Pro
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transformez vos avis clients en avantage concurrentiel avec l'IA
          </p>
          <UpgradeButton feature="reviews-ultra-pro" size="lg" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {reviewStats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm font-medium">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            );
          })}
        </div>

        {/* Platform Integration */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Intégrations Plateformes</CardTitle>
            <CardDescription className="text-center">
              Gérez tous vos avis depuis une interface unique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-sm font-medium">Google Reviews</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-sm font-medium">Amazon</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-blue-600/10 flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium">Facebook</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-sm font-medium">Yelp</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm font-medium">TripAdvisor</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 text-purple-500" />
                </div>
                <p className="text-sm font-medium">Trustpilot</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <UpgradeButton feature="reviews-ultra-pro" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}