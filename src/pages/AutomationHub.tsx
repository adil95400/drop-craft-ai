import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { 
  Package, 
  RefreshCcw, 
  Mail, 
  TrendingUp, 
  Sparkles, 
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react"

const AutomationHub = () => {
  const navigate = useNavigate()

  const modules = [
    {
      id: "stock",
      title: "Gestion du Stock Intelligente",
      description: "ML pour prédiction de stock, alertes automatiques et réapprovisionnement intelligent",
      icon: Package,
      color: "primary",
      route: "/stock",
      features: [
        "Prédictions ML de stock",
        "Alertes automatiques",
        "Réappro intelligent",
        "Analytics avancées"
      ],
      stats: {
        active: true,
        automated: 87,
        savings: "2.3h/jour"
      }
    },
    {
      id: "returns",
      title: "Retours & Remboursements",
      description: "Automatisation IA pour traiter les retours et approuver les remboursements",
      icon: RefreshCcw,
      color: "secondary",
      route: "/returns",
      features: [
        "Approbation IA automatique",
        "Score de confiance",
        "Restauration inventaire",
        "Notifications clients"
      ],
      stats: {
        active: true,
        automated: 87,
        savings: "1.8h/jour"
      }
    },
    {
      id: "marketing",
      title: "Marketing Automation",
      description: "Campagnes automatisées avec génération de contenu IA et segmentation intelligente",
      icon: Mail,
      color: "accent",
      route: "/marketing-automation",
      features: [
        "Génération contenu IA",
        "Segmentation auto",
        "Email automation",
        "Analytics temps réel"
      ],
      stats: {
        active: true,
        automated: 92,
        savings: "3.5h/jour"
      }
    }
  ]

  const globalStats = {
    totalAutomations: 12,
    activeNow: 8,
    timeSaved: "7.6h/jour",
    roi: 328
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hub d'Automatisation</h1>
            <p className="text-muted-foreground mt-1">
              Centre de contrôle pour toutes vos automatisations intelligentes
            </p>
          </div>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Automatisations</p>
              <p className="text-2xl font-bold">{globalStats.totalAutomations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <Zap className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actives maintenant</p>
              <p className="text-2xl font-bold">{globalStats.activeNow}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Temps économisé</p>
              <p className="text-2xl font-bold">{globalStats.timeSaved}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <DollarSign className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ROI moyen</p>
              <p className="text-2xl font-bold">{globalStats.roi}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Automations Alert */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
          <div className="flex-1">
            <h3 className="font-semibold">Automatisations actives</h3>
            <p className="text-sm text-muted-foreground">
              {globalStats.activeNow} processus en cours d'exécution • Dernière activité il y a 2 min
            </p>
          </div>
          <Badge variant="default">Tout fonctionne</Badge>
        </div>
      </Card>

      {/* Modules */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Modules d'Automatisation</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon
            
            return (
              <Card key={module.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className={`p-3 bg-${module.color}/10 rounded-lg`}>
                      <Icon className={`w-6 h-6 text-${module.color}`} />
                    </div>
                    <Badge variant={module.stats.active ? "default" : "outline"}>
                      {module.stats.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {module.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-secondary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Taux auto</p>
                      <p className="text-lg font-bold">{module.stats.automated}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Économie</p>
                      <p className="text-lg font-bold">{module.stats.savings}</p>
                    </div>
                  </div>

                  {/* Action */}
                  <Button 
                    onClick={() => navigate(module.route)}
                    className="w-full"
                  >
                    Accéder au module
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Performance Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Vue d'ensemble des performances</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taux de réussite</span>
              <span className="font-semibold">94.5%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '94.5%' }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Temps de traitement</span>
              <span className="font-semibold">2.3s moy</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-secondary" style={{ width: '78%' }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Satisfaction</span>
              <span className="font-semibold">4.8/5</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: '96%' }} />
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-4">Actions rapides</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Voir analytics
          </Button>
          <Button variant="outline" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Créer automation
          </Button>
          <Button variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Optimiser avec IA
          </Button>
        </div>
      </Card>

      {/* AI Insights */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Insights IA</h3>
            <p className="text-sm text-muted-foreground mb-4">
              L'IA a détecté des opportunités d'optimisation dans vos automatisations
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <span>
                  <strong>Marketing:</strong> Augmenter la fréquence d'envoi le mardi pourrait améliorer le taux d'ouverture de 12%
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <span>
                  <strong>Stock:</strong> 3 produits risquent une rupture dans les 7 prochains jours
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <span>
                  <strong>Retours:</strong> Le seuil d'auto-approbation peut être augmenté à 85% sans risque
                </span>
              </li>
            </ul>
          </div>
          <Button size="sm">Appliquer les recommandations</Button>
        </div>
      </Card>
    </div>
  )
}

export default AutomationHub
