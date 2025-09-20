import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { WorkflowBuilder } from '@/components/automation/WorkflowBuilder';
import { WorkflowManager } from '@/components/automation/WorkflowManager';
import {
  Workflow,
  Bot,
  Zap,
  Settings,
  BarChart3,
  Sparkles,
  Target,
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

export default function AutomationStudio() {
  const [activeTab, setActiveTab] = useState('builder');

  const automationFeatures = [
    {
      id: 'builder',
      name: 'Constructeur de Workflows',
      icon: Workflow,
      description: 'Créez des workflows d\'automatisation personnalisés',
      color: 'text-blue-600',
      badge: 'Visuel'
    },
    {
      id: 'manager',
      name: 'Gestionnaire d\'Automatisations',
      icon: Settings,
      description: 'Gérez et surveillez vos automatisations existantes',
      color: 'text-green-600',
      badge: 'Gestion'
    },
    {
      id: 'analytics',
      name: 'Analyses de Performance',
      icon: BarChart3,
      description: 'Analysez l\'efficacité de vos automatisations',
      color: 'text-purple-600',
      badge: 'Analytics'
    }
  ];

  const stats = [
    {
      label: 'Workflows Actifs',
      value: '12',
      icon: Workflow,
      change: '+3'
    },
    {
      label: 'Tâches Automatisées',
      value: '847',
      icon: Zap,
      change: '+127'
    },
    {
      label: 'Temps Économisé',
      value: '34h',
      icon: Clock,
      change: '+8h'
    },
    {
      label: 'Taux de Succès',
      value: '94%',
      icon: CheckCircle,
      change: '+2%'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Automation Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            Suite complète d'outils d'automatisation pour optimiser votre business
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1">
          <Sparkles className="h-4 w-4" />
          Powered by AI
        </Badge>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <Badge variant="outline" className="text-xs text-green-600">
                      {stat.change}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation des fonctionnalités */}
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités d'Automatisation</CardTitle>
          <CardDescription>
            Explorez nos outils d'automatisation avancés pour votre business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {automationFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    activeTab === feature.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setActiveTab(feature.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                      <Badge variant="outline" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <h3 className="font-medium mb-2">{feature.name}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Constructeur
          </TabsTrigger>
          <TabsTrigger value="manager" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Gestionnaire
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Constructeur de Workflows Visuels
              </CardTitle>
              <CardDescription>
                Créez des workflows d'automatisation complexes avec une interface intuitive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowBuilder 
                workflow={null}
                onSave={(workflow) => {
                  console.log('Workflow saved:', workflow);
                  // Handle workflow save - could show toast, update state, etc.
                }}
                onCancel={() => {
                  console.log('Workflow cancelled');
                  // Handle workflow cancel - could reset form, show message, etc.
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manager" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gestionnaire d'Automatisations
              </CardTitle>
              <CardDescription>
                Surveillez, gérez et optimisez vos workflows d'automatisation existants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendances d'Automatisation
                </CardTitle>
                <CardDescription>
                  Analyse des performances de vos automatisations sur les 30 derniers jours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-medium">Efficacité Globale</h4>
                    <div className="text-3xl font-bold text-green-600">94.2%</div>
                    <p className="text-sm text-muted-foreground">
                      +2.3% par rapport au mois dernier
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Temps Économisé</h4>
                    <div className="text-3xl font-bold text-blue-600">156h</div>
                    <p className="text-sm text-muted-foreground">
                      +23h cette semaine
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">ROI Automatisation</h4>
                    <div className="text-3xl font-bold text-purple-600">340%</div>
                    <p className="text-sm text-muted-foreground">
                      Return on Investment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Workflows par Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Notification Livraison', rate: '98%', executions: 245 },
                      { name: 'Mise à jour Stock', rate: '96%', executions: 189 },
                      { name: 'Email Marketing', rate: '94%', executions: 167 },
                      { name: 'Analyse Produits', rate: '92%', executions: 143 },
                      { name: 'Support Client', rate: '89%', executions: 98 }
                    ].map((workflow, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{workflow.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {workflow.executions} exécutions
                          </p>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          {workflow.rate}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métriques Avancées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Workflows créés ce mois</span>
                      <span className="font-medium">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Taux d'adoption</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Erreurs évitées</span>
                      <span className="font-medium">234</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Coût par automatisation</span>
                      <span className="font-medium">0.23€</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Satisfaction utilisateur</span>
                      <span className="font-medium">4.8/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer avec conseils */}
      <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Conseils pour optimiser vos automatisations</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Commencez par automatiser les tâches répétitives simples</li>
                <li>• Testez toujours vos workflows avant de les activer</li>
                <li>• Surveillez régulièrement les performances et ajustez si nécessaire</li>
                <li>• Utilisez les conditions pour créer des workflows intelligents</li>
                <li>• Combinez plusieurs déclencheurs pour des automatisations avancées</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}