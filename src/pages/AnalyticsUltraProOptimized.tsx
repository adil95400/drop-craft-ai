import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradeButton } from "@/components/common/UpgradeButton";
import { BarChart3, TrendingUp, Users, ShoppingCart, Eye, Clock, Target, Zap } from "lucide-react";

export default function AnalyticsUltraProOptimized() {
  const features = [
    {
      icon: BarChart3,
      title: "Analyses Avancées",
      description: "Rapports détaillés avec métriques personnalisées et comparaisons historiques"
    },
    {
      icon: TrendingUp,
      title: "Prédictions IA",
      description: "Algorithmes prédictifs pour anticiper les tendances de vente"
    },
    {
      icon: Users,
      title: "Segmentation Client",
      description: "Analyses comportementales et segmentation automatique des clients"
    },
    {
      icon: ShoppingCart,
      title: "Analytics E-commerce",
      description: "Suivi complet du funnel de conversion et optimisation"
    },
    {
      icon: Eye,
      title: "Heatmaps Avancées",
      description: "Cartes de chaleur interactives pour optimiser l'expérience utilisateur"
    },
    {
      icon: Clock,
      title: "Rapports Temps Réel",
      description: "Données en direct avec alertes automatiques"
    },
    {
      icon: Target,
      title: "ROI Tracking",
      description: "Suivi précis du retour sur investissement par canal"
    },
    {
      icon: Zap,
      title: "Automatisation",
      description: "Rapports automatisés et envoi programmé aux équipes"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics Ultra Pro
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Débloquez des insights avancés avec nos outils d'analyse IA et rapports prédictifs
          </p>
          <UpgradeButton feature="analytics-ultra-pro" size="lg" />
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

        {/* Benefits Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Pourquoi Choisir Analytics Ultra Pro ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">+250%</div>
                <p className="text-sm text-muted-foreground">Amélioration des performances</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">Real-time</div>
                <p className="text-sm text-muted-foreground">Données en temps réel</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">IA Avancée</div>
                <p className="text-sm text-muted-foreground">Prédictions intelligentes</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <UpgradeButton feature="analytics-ultra-pro" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}