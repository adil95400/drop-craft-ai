/**
 * PHASE 4: Decision Engine
 * Moteur de décision IA pour l'automatisation
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain, TrendingUp, AlertTriangle, CheckCircle,
  Clock, Target, Zap
} from 'lucide-react'

export const DecisionEngine: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Brain className="h-6 w-6 mr-2 text-primary" />
            Moteur de Décision IA
          </h1>
          <p className="text-muted-foreground">
            Intelligence artificielle pour la prise de décision automatisée
          </p>
        </div>
        <Button>
          <Zap className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>

      {/* Statistiques du moteur */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Décisions aujourd'hui</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">+12 depuis hier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de précision</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.7%</div>
            <p className="text-xs text-muted-foreground">+2.1% ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impact positif</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+€2.4K</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Décisions en attente */}
      <Card>
        <CardHeader>
          <CardTitle>Décisions en attente de validation</CardTitle>
          <CardDescription>L'IA recommande ces actions basées sur vos données</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                type: "Ajustement prix",
                product: "Chaise ergonomique Pro",
                action: "Réduire de 12% (€89 → €78)",
                reason: "Nouveau concurrent à €75, demande stable",
                confidence: 87,
                impact: "+15% ventes estimées",
                priority: "high"
              },
              {
                type: "Réapprovisionnement",
                product: "Bureau standing desk",
                action: "Commander 25 unités",
                reason: "Rupture prévue dans 4 jours, délai fournisseur 3 jours",
                confidence: 92,
                impact: "Évite rupture de stock",
                priority: "urgent"
              },
              {
                type: "Campagne marketing",
                product: "Collection hiver",
                action: "Lancer campagne email ciblée",
                reason: "Segment clients inactifs > 30j, forte probabilité achat",
                confidence: 78,
                impact: "+8% réactivation estimée",
                priority: "medium"
              }
            ].map((decision, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      decision.priority === 'urgent' ? 'destructive' :
                      decision.priority === 'high' ? 'default' : 'secondary'
                    }>
                      {decision.priority === 'urgent' ? 'Urgent' :
                       decision.priority === 'high' ? 'Priorité haute' : 'Priorité normale'}
                    </Badge>
                    <span className="font-medium">{decision.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Brain className="h-4 w-4" />
                    {decision.confidence}% confiance
                  </div>
                </div>
                
                <div>
                  <div className="font-semibold text-primary">{decision.product}</div>
                  <div className="text-sm">{decision.action}</div>
                  <div className="text-xs text-muted-foreground mt-1">{decision.reason}</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-green-600">{decision.impact}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Rejeter
                    </Button>
                    <Button size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Appliquer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historique des décisions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique récent</CardTitle>
          <CardDescription>Décisions appliquées et leurs résultats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                time: "Il y a 2h",
                action: "Prix réduit sur Table café vintage",
                result: "success",
                impact: "+23% ventes (4 unités)",
                confidence: 91
              },
              {
                time: "Il y a 5h",
                action: "Email de réactivation envoyé à 247 clients",
                result: "success",
                impact: "12 commandes générées",
                confidence: 76
              },
              {
                time: "Hier",
                action: "Stock augmenté pour Lampe design",
                result: "warning",
                impact: "Ventes plus lentes que prévu",
                confidence: 68
              }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {item.result === 'success' ? 
                    <CheckCircle className="h-5 w-5 text-green-500" /> :
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  }
                  <div>
                    <div className="text-sm font-medium">{item.action}</div>
                    <div className="text-xs text-muted-foreground">{item.time}</div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className={item.result === 'success' ? 'text-green-600' : 'text-yellow-600'}>
                    {item.impact}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.confidence}% confiance
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}