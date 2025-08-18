import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradeButton } from "@/components/common/UpgradeButton";
import { Search, TrendingUp, Globe, FileText, Target, BarChart3, Zap, Brain } from "lucide-react";

export default function SEOUltraProOptimized() {
  const features = [
    {
      icon: Search,
      title: "Recherche de Mots-clés IA",
      description: "Découverte intelligente de mots-clés avec analyse de la concurrence"
    },
    {
      icon: FileText,
      title: "Optimisation de Contenu",
      description: "Suggestions automatiques pour améliorer le ranking de vos pages"
    },
    {
      icon: TrendingUp,
      title: "Suivi de Position",
      description: "Monitoring en temps réel de vos positions sur Google et autres moteurs"
    },
    {
      icon: Globe,
      title: "SEO Technique",
      description: "Audit complet et corrections automatiques des problèmes techniques"
    },
    {
      icon: Target,
      title: "Stratégie Concurrentielle",
      description: "Analyse approfondie de la concurrence et opportunités de ranking"
    },
    {
      icon: BarChart3,
      title: "Rapports Avancés",
      description: "Analytics SEO détaillés avec insights prédictifs"
    },
    {
      icon: Zap,
      title: "Automatisation SEO",
      description: "Optimisations automatiques et mises à jour de contenu"
    },
    {
      icon: Brain,
      title: "IA Générative",
      description: "Génération de contenu optimisé SEO avec intelligence artificielle"
    }
  ];

  const seoStats = [
    { label: "Mots-clés Trackés", value: "50,000+", description: "Suivi simultané" },
    { label: "Pages Optimisées", value: "Illimitées", description: "Aucune limitation" },
    { label: "Rapports", value: "Temps Réel", description: "Données actualisées" },
    { label: "Intégrations", value: "200+", description: "Outils compatibles" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            SEO Ultra Pro
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dominez les moteurs de recherche avec nos outils SEO alimentés par l'IA
          </p>
          <UpgradeButton feature="seo-ultra-pro" size="lg" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {seoStats.map((stat, index) => (
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

        {/* Benefits Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Résultats Garantis avec SEO Ultra Pro</CardTitle>
            <CardDescription className="text-center">
              Nos clients voient en moyenne ces améliorations dans les 90 premiers jours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">+300%</div>
                <p className="text-sm text-muted-foreground">Trafic organique</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">Top 3</div>
                <p className="text-sm text-muted-foreground">Positions moyennes</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">-80%</div>
                <p className="text-sm text-muted-foreground">Temps d'optimisation</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <UpgradeButton feature="seo-ultra-pro" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}