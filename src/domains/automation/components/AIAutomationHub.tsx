/**
 * PHASE 4: AI Automation Hub
 * Hub d'automatisation intelligente avec workflows IA
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bot, Zap, Brain, TrendingUp, 
  Play, Pause, Settings, Plus,
  CheckCircle, Clock, AlertTriangle
} from 'lucide-react'

export const AIAutomationHub: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('workflows')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Bot className="h-8 w-8 mr-3 text-primary" />
            AI Automation Hub
            <Badge variant="secondary" className="ml-3">
              PHASE 4
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Automatisation intelligente avec IA pour optimiser vos processus
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau workflow
          </Button>
        </div>
      </div>

      {/* Statistiques d'automatisation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows actifs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches automatisées</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps économisé</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89h</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">97.8%</div>
            <p className="text-xs text-muted-foreground">+2.1% ce mois</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="decisions">Décisions IA</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid gap-4">
            {[
              {
                name: "Optimisation prix automatique",
                description: "Ajuste les prix selon la concurrence et la demande",
                status: "active",
                executions: 45,
                success_rate: 98.2,
                last_run: "Il y a 2h"
              },
              {
                name: "Gestion stock intelligent",
                description: "Réapprovisionnement automatique basé sur les prédictions",
                status: "active",
                executions: 23,
                success_rate: 100,
                last_run: "Il y a 4h"
              },
              {
                name: "Marketing automation",
                description: "Campagnes ciblées selon le comportement client",
                status: "paused",
                executions: 67,
                success_rate: 94.5,
                last_run: "Il y a 1 jour"
              }
            ].map((workflow) => (
              <Card key={workflow.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                          {workflow.status === 'active' ? 'Actif' : 'En pause'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {workflow.executions} exécutions
                        </div>
                        <div>{workflow.success_rate}% réussite</div>
                        <div>Dernière: {workflow.last_run}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={workflow.status === 'active'}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Démarrer
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={workflow.status === 'paused'}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Config
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Décisions IA récentes</CardTitle>
              <CardDescription>Décisions automatisées prises par l'IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    type: "Prix",
                    description: "Réduction de 15% sur 'Chaise bureau' suite à baisse concurrent",
                    confidence: 94,
                    impact: "+12% ventes",
                    status: "applied",
                    time: "Il y a 1h"
                  },
                  {
                    type: "Stock",
                    description: "Commande de 50 unités 'Table café' - rupture prévue dans 3 jours",
                    confidence: 89,
                    impact: "Évite rupture",
                    status: "pending",
                    time: "Il y a 3h"
                  },
                  {
                    type: "Marketing",
                    description: "Campagne email ciblée - clients inactifs > 30 jours",
                    confidence: 76,
                    impact: "+8% réactivation",
                    status: "applied",
                    time: "Il y a 6h"
                  }
                ].map((decision, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Brain className="h-5 w-5 text-primary" />
                        <Badge variant="outline">{decision.type}</Badge>
                        <Badge variant={decision.status === 'applied' ? 'default' : 'secondary'}>
                          {decision.status === 'applied' ? 'Appliquée' : 'En attente'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{decision.time}</span>
                    </div>
                    <p className="text-sm">{decision.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div>Confiance: {decision.confidence}%</div>
                      <div className="text-green-600">{decision.impact}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance des workflows</CardTitle>
                <CardDescription>Efficacité sur les 30 derniers jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded">
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>Graphiques de performance</p>
                    <p className="text-sm">Intégration avec charts à venir</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact business</CardTitle>
                <CardDescription>ROI de l'automatisation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Revenus supplémentaires</span>
                    <span className="font-bold text-green-600">+€12,450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Coûts évités</span>
                    <span className="font-bold text-green-600">+€8,900</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Temps économisé</span>
                    <span className="font-bold text-blue-600">89h</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold">ROI total</span>
                    <span className="font-bold text-primary">+245%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "E-commerce Optimizer",
                description: "Optimisation complète pour boutiques en ligne",
                workflows: 5,
                category: "E-commerce"
              },
              {
                name: "Inventory Master",
                description: "Gestion intelligente des stocks et approvisionnements",
                workflows: 3,
                category: "Logistique"
              },
              {
                name: "Marketing Automation",
                description: "Campagnes marketing automatisées et personnalisées",
                workflows: 4,
                category: "Marketing"
              }
            ].map((template) => (
              <Card key={template.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{template.category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {template.workflows} workflows
                    </span>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Utiliser ce template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}