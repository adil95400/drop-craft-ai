import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradeButton } from "@/components/common/UpgradeButton";
import { Mail, Target, BarChart3, Users, Megaphone, Brain, Zap, Globe } from "lucide-react";

export default function MarketingUltraProOptimized() {
  const features = [
    {
      icon: Mail,
      title: "Email Marketing IA",
      description: "Campagnes automatisées avec personnalisation intelligente et A/B testing"
    },
    {
      icon: Target,
      title: "Segmentation Avancée",
      description: "Ciblage précis basé sur le comportement et les prédictions IA"
    },
    {
      icon: BarChart3,
      title: "Analytics Prédictifs",
      description: "Prévisions de performance et optimisation automatique des campagnes"
    },
    {
      icon: Users,
      title: "Lead Scoring IA",
      description: "Qualification automatique des prospects avec score de conversion"
    },
    {
      icon: Megaphone,
      title: "Multi-Canal",
      description: "Orchestration cross-platform avec attribution unifiée"
    },
    {
      icon: Brain,
      title: "Contenu Généré IA",
      description: "Création automatique de contenus optimisés pour chaque audience"
    },
    {
      icon: Zap,
      title: "Automatisation Avancée",
      description: "Workflows marketing sophistiqués avec déclencheurs intelligents"
    },
    {
      icon: Globe,
      title: "Marketing Global",
      description: "Campagnes internationales avec adaptation culturelle automatique"
    }
  ];

  const marketingStats = [
    { label: "Taux d'Ouverture", value: "+45%", description: "Amélioration moyenne" },
    { label: "Conversion", value: "+250%", description: "Augmentation des ventes" },
    { label: "ROI Marketing", value: "+400%", description: "Retour sur investissement" },
    { label: "Gain de Temps", value: "85%", description: "Automatisation complète" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Marketing Ultra Pro
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Révolutionnez votre marketing avec l'IA et l'automatisation intelligente
          </p>
          <UpgradeButton feature="marketing-ultra-pro" size="lg" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {marketingStats.map((stat, index) => (
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

        {/* Campaign Types */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Types de Campagnes Ultra Pro</CardTitle>
            <CardDescription className="text-center">
              Explorez les différents formats de campagnes disponibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Campagnes Prédictives</h3>
                <p className="text-sm text-muted-foreground">
                  L'IA prédit le meilleur moment, canal et message pour chaque prospect
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Nurturing Intelligent</h3>
                <p className="text-sm text-muted-foreground">
                  Parcours client adaptatif basé sur le comportement en temps réel
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Retargeting Avancé</h3>
                <p className="text-sm text-muted-foreground">
                  Reciblage cross-platform avec lookalike audiences automatiques
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Marketing Conversationnel</h3>
                <p className="text-sm text-muted-foreground">
                  Chatbots IA et marketing automation personnalisé en temps réel
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Attribution Multi-Touch</h3>
                <p className="text-sm text-muted-foreground">
                  Tracking complet du parcours client avec attribution précise
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Optimisation Continue</h3>
                <p className="text-sm text-muted-foreground">
                  A/B testing automatique avec optimisation en temps réel
                </p>
              </div>
            </div>
            <div className="text-center mt-8">
              <UpgradeButton feature="marketing-ultra-pro" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}