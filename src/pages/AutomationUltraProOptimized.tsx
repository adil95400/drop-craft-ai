import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradeButton } from "@/components/common/UpgradeButton";
import { Workflow, Zap, Clock, Brain, GitBranch, Shield, Rocket, Settings } from "lucide-react";

export default function AutomationUltraProOptimized() {
  const features = [
    {
      icon: Workflow,
      title: "Workflows Avancés",
      description: "Créez des automatisations complexes avec conditions et branchements multiples"
    },
    {
      icon: Brain,
      title: "IA Prédictive",
      description: "Automatisation intelligente basée sur l'apprentissage automatique"
    },
    {
      icon: Zap,
      title: "Déclencheurs Multiples",
      description: "Combinez plusieurs événements pour des automatisations sophistiquées"
    },
    {
      icon: Clock,
      title: "Planification Avancée",
      description: "Programmation flexible avec récurrence et conditions temporelles"
    },
    {
      icon: GitBranch,
      title: "Logique Conditionnelle",
      description: "If/Then/Else avancé avec opérateurs logiques complexes"
    },
    {
      icon: Shield,
      title: "Validation & Sécurité",
      description: "Contrôles de sécurité et validation automatique des actions"
    },
    {
      icon: Rocket,
      title: "Performance Optimisée",
      description: "Exécution ultra-rapide avec mise en cache intelligente"
    },
    {
      icon: Settings,
      title: "Configuration Avancée",
      description: "Paramètres fins et personnalisation complète des workflows"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Automation Ultra Pro
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Automatisez votre business avec des workflows intelligents et des déclencheurs avancés
          </p>
          <UpgradeButton feature="automation-ultra-pro" size="lg" />
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

        {/* Workflow Examples */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Exemples de Workflows Ultra Pro</CardTitle>
            <CardDescription className="text-center">
              Découvrez quelques exemples d'automatisations avancées possibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">E-commerce Intelligent</h3>
                <p className="text-sm text-muted-foreground">
                  Réajustement automatique des prix basé sur la concurrence, gestion des stocks avec prédictions IA,
                  et personnalisation des recommandations clients.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Marketing Prédictif</h3>
                <p className="text-sm text-muted-foreground">
                  Segmentation dynamique des clients, campagnes automatisées avec A/B testing,
                  et optimisation des conversions en temps réel.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Relation Client 360°</h3>
                <p className="text-sm text-muted-foreground">
                  Scoring automatique des leads, nurturing personnalisé,
                  et escalade intelligente vers les équipes commerciales.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Opérations Streamline</h3>
                <p className="text-sm text-muted-foreground">
                  Synchronisation multi-plateforme, rapports automatisés,
                  et alertes prédictives pour éviter les problèmes.
                </p>
              </div>
            </div>
            <div className="text-center mt-8">
              <UpgradeButton feature="automation-ultra-pro" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}