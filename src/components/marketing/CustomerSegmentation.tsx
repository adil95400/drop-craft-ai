import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Sparkles, TrendingUp, Target, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useCustomerSegments } from "@/hooks/useCustomerSegments"

export const CustomerSegmentation = () => {
  const { segments, isLoading } = useCustomerSegments()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Segmentation intelligente</h3>
            <p className="text-sm text-muted-foreground">
              L'IA segmente automatiquement vos clients selon leur comportement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Segmentation IA active</p>
            <p className="text-xs text-muted-foreground">
              Mise à jour en temps réel basée sur le comportement client
            </p>
          </div>
          <Button size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Créer un segment IA
          </Button>
        </div>
      </Card>

      {segments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Aucun segment créé</p>
          <p className="text-sm text-muted-foreground mt-1">
            Créez des segments pour cibler vos clients
          </p>
          <Button className="mt-4">
            <Users className="w-4 h-4 mr-2" />
            Créer un segment
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {segments.map((segment) => {
            const percentage = segment.total > 0 ? (segment.count / segment.total) * 100 : 0
            
            return (
              <Card key={segment.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{segment.name}</h4>
                      <Badge variant="outline">{segment.count} clients</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {segment.description}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Target className="w-4 h-4 mr-2" />
                    Cibler
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Part de la base</span>
                      <span className="font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Clients</p>
                      <p className="text-lg font-bold">{segment.count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Panier moyen</p>
                      <p className="text-lg font-bold">{segment.avgValue}€</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold">{segment.engagement}%</p>
                        {segment.engagement > 60 && (
                          <TrendingUp className="w-4 h-4 text-secondary" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="p-6 bg-muted/50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-2">IA prédictive</h4>
            <p className="text-sm text-muted-foreground mb-4">
              L'IA identifie automatiquement les segments à fort potentiel:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Clients susceptibles de passer à un segment supérieur</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Risques de churn détectés avant qu'ils ne se produisent</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Opportunités d'upsell basées sur les comportements similaires</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
