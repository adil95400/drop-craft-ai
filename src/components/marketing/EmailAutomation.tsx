import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Mail, Zap, Clock, Users, TrendingUp } from "lucide-react"

export const EmailAutomation = () => {
  const automations = [
    {
      id: 1,
      name: "Email de bienvenue",
      trigger: "Nouvelle inscription",
      status: "active",
      sent: 342,
      openRate: 45.2,
      description: "Envoyé automatiquement aux nouveaux inscrits"
    },
    {
      id: 2,
      name: "Panier abandonné",
      trigger: "Panier non finalisé 1h",
      status: "active",
      sent: 128,
      openRate: 38.5,
      description: "Relance après 1h d'inactivité"
    },
    {
      id: 3,
      name: "Réengagement",
      trigger: "Inactif 30 jours",
      status: "paused",
      sent: 89,
      openRate: 22.1,
      description: "Récupération des clients inactifs"
    },
    {
      id: 4,
      name: "Upsell post-achat",
      trigger: "7 jours après achat",
      status: "active",
      sent: 215,
      openRate: 31.8,
      description: "Suggestions de produits complémentaires"
    }
  ]

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Automation d'emails</h3>
            <p className="text-sm text-muted-foreground">
              Emails déclenchés automatiquement selon le comportement client
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Emails envoyés</p>
                <p className="text-2xl font-bold">774</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Taux d'ouverture</p>
                <p className="text-2xl font-bold">34.4%</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">127</p>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      <div className="space-y-4">
        {automations.map((automation) => (
          <Card key={automation.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold">{automation.name}</h4>
                  <Badge variant={automation.status === 'active' ? 'default' : 'secondary'}>
                    {automation.status === 'active' ? 'Actif' : 'En pause'}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {automation.description}
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Trigger:</span>
                    <span className="font-medium">{automation.trigger}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{automation.sent} envoyés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{automation.openRate}% ouverture</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={automation.status === 'active'}
                    id={`automation-${automation.id}`}
                  />
                  <Label htmlFor={`automation-${automation.id}`}>
                    {automation.status === 'active' ? 'Actif' : 'Inactif'}
                  </Label>
                </div>
                <Button size="sm" variant="outline">
                  Modifier
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-muted/50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-2">Optimisation IA</h4>
            <p className="text-sm text-muted-foreground mb-4">
              L'IA analyse continuellement les performances de vos automations et optimise:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Meilleur moment d'envoi selon le comportement de chaque client</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Personnalisation du contenu basée sur l'historique d'achat</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Ajustement automatique de la fréquence pour éviter la fatigue</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
