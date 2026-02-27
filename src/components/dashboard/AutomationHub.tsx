import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  Zap, 
  Bot, 
  PlayCircle, 
  PauseCircle, 
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  RefreshCw,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: string
  actions: string[]
  isActive: boolean
  executionCount: number
  successRate: number
  lastExecution?: string
  category: 'inventory' | 'marketing' | 'customer' | 'orders' | 'analytics'
  priority: 'low' | 'medium' | 'high'
  estimatedSavings: string
}

export function AutomationHub() {
  const [automations, setAutomations] = useState<AutomationRule[]>([])
  const [stats, setStats] = useState({
    totalAutomations: 0,
    activeAutomations: 0,
    totalExecutions: 0,
    avgSuccessRate: 0,
    timeSavedHours: 0
  })

  useEffect(() => {
    generateAutomations()
  }, [])

  const generateAutomations = () => {
    const mockAutomations: AutomationRule[] = [
      {
        id: '1',
        name: 'Réapprovisionnement Intelligent',
        description: 'Commande automatique lorsque le stock atteint 10 unités',
        trigger: 'Stock < 10 unités',
        actions: ['Générer bon de commande', 'Notifier fournisseur', 'Mettre à jour planning'],
        isActive: true,
        executionCount: 47,
        successRate: 96,
        lastExecution: '2024-01-20T10:30:00',
        category: 'inventory',
        priority: 'high',
        estimatedSavings: '15h/semaine'
      },
      {
        id: '2', 
        name: 'Email de Bienvenue',
        description: 'Envoi automatique d\'emails aux nouveaux clients',
        trigger: 'Nouvelle inscription client',
        actions: ['Envoyer email bienvenue', 'Ajouter à newsletter', 'Créer tâche suivi'],
        isActive: true,
        executionCount: 234,
        successRate: 98,
        lastExecution: '2024-01-20T15:22:00',
        category: 'marketing',
        priority: 'medium',
        estimatedSavings: '8h/semaine'
      },
      {
        id: '3',
        name: 'Suivi Commandes Livrées',
        description: 'Email de satisfaction 48h après livraison',
        trigger: 'Statut = Livré + 48h',
        actions: ['Envoyer questionnaire', 'Proposer produits complémentaires'],
        isActive: true,
        executionCount: 89,
        successRate: 87,
        lastExecution: '2024-01-20T08:15:00',
        category: 'customer',
        priority: 'medium',
        estimatedSavings: '5h/semaine'
      },
      {
        id: '4',
        name: 'Optimisation Prix Automatique',
        description: 'Ajustement des prix selon la demande et concurrence',
        trigger: 'Analyse quotidienne à 06:00',
        actions: ['Analyser concurrence', 'Calculer prix optimal', 'Appliquer changements'],
        isActive: false,
        executionCount: 15,
        successRate: 92,
        lastExecution: '2024-01-19T06:00:00',
        category: 'analytics',
        priority: 'high',
        estimatedSavings: '12h/semaine'
      },
      {
        id: '5',
        name: 'Relance Paniers Abandonnés',
        description: 'Série d\'emails pour récupérer les paniers abandonnés',
        trigger: 'Panier abandonné > 1h',
        actions: ['Email J+1', 'Email J+3 avec remise', 'Email J+7 dernière chance'],
        isActive: true,
        executionCount: 156,
        successRate: 23,
        lastExecution: '2024-01-20T14:45:00',
        category: 'marketing',
        priority: 'medium',
        estimatedSavings: '6h/semaine'
      }
    ]

    setAutomations(mockAutomations)

    // Calculer les stats
    const totalAutomations = mockAutomations.length
    const activeAutomations = mockAutomations.filter(a => a.isActive).length
    const totalExecutions = mockAutomations.reduce((sum, a) => sum + a.executionCount, 0)
    const avgSuccessRate = mockAutomations.reduce((sum, a) => sum + a.successRate, 0) / totalAutomations
    const timeSavedHours = 46 // Calculé à partir des estimatedSavings

    setStats({
      totalAutomations,
      activeAutomations,
      totalExecutions,
      avgSuccessRate,
      timeSavedHours
    })
  }

  const toggleAutomation = async (automationId: string) => {
    const automation = automations.find(a => a.id === automationId)
    if (!automation) return

    toast.loading(
      automation.isActive ? 'Désactivation...' : 'Activation...',
      { id: `toggle-${automationId}` }
    )

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      setAutomations(prev => 
        prev.map(a => 
          a.id === automationId ? { ...a, isActive: !a.isActive } : a
        )
      )

      toast.success(
        `Automation ${automation.isActive ? 'désactivée' : 'activée'} avec succès`,
        { id: `toggle-${automationId}` }
      )
    } catch (error) {
      toast.error('Erreur lors de la modification', { id: `toggle-${automationId}` })
    }
  }

  const executeAutomation = async (automationId: string) => {
    const automation = automations.find(a => a.id === automationId)
    if (!automation) return

    toast.loading('Exécution en cours...', { id: `exec-${automationId}` })

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      setAutomations(prev => 
        prev.map(a => 
          a.id === automationId ? { 
            ...a, 
            executionCount: a.executionCount + 1,
            lastExecution: new Date().toISOString()
          } : a
        )
      )

      toast.success('Automation exécutée avec succès', { id: `exec-${automationId}` })
    } catch (error) {
      toast.error('Erreur lors de l\'exécution', { id: `exec-${automationId}` })
    }
  }

  const getCategoryIcon = (category: AutomationRule['category']) => {
    const icons = {
      inventory: '📦',
      marketing: '📊',
      customer: '👥',
      orders: '🛒',
      analytics: '📈'
    }
    return icons[category] || '⚡'
  }

  const getCategoryColor = (category: AutomationRule['category']) => {
    switch (category) {
      case 'inventory': return 'bg-info'
      case 'marketing': return 'bg-success'
      case 'customer': return 'bg-primary'
      case 'orders': return 'bg-warning'
      case 'analytics': return 'bg-accent'
      default: return 'bg-muted'
    }
  }

  const getPriorityColor = (priority: AutomationRule['priority']) => {
    switch (priority) {
      case 'high': return 'text-destructive bg-destructive/10'
      case 'medium': return 'text-warning bg-warning/10'
      case 'low': return 'text-success bg-success/10'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-info">{stats.totalAutomations}</div>
            <div className="text-sm text-muted-foreground">Automations Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{stats.activeAutomations}</div>
            <div className="text-sm text-muted-foreground">Actives</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats.totalExecutions}</div>
            <div className="text-sm text-muted-foreground">Exécutions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{stats.avgSuccessRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Taux de Réussite</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-accent-foreground">{stats.timeSavedHours}h</div>
            <div className="text-sm text-muted-foreground">Temps Économisé/sem.</div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-500" />
                Hub d'Automatisation
              </CardTitle>
              <CardDescription>
                Gérez vos règles d'automatisation pour optimiser vos processus
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Règle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automations.map((automation, index) => (
              <div key={automation.id}>
                <div className="p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-2xl">{getCategoryIcon(automation.category)}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{automation.name}</h3>
                          <Badge className={`${getCategoryColor(automation.category)} text-white text-xs`}>
                            {automation.category}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(automation.priority)}`}>
                            {automation.priority}
                          </Badge>
                          {automation.isActive && (
                            <Badge className="bg-green-500 text-white text-xs">
                              Actif
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{automation.description}</p>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-3">
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">Déclencheur:</div>
                            <div className="text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-500">
                              {automation.trigger}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">Actions:</div>
                            <div className="space-y-1">
                              {automation.actions.map((action, idx) => (
                                <div key={idx} className="text-sm bg-green-50 p-2 rounded flex items-center gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  {action}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">Performance:</div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Exécutions:</span>
                                <span className="font-semibold">{automation.executionCount}</span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Taux de réussite:</span>
                                  <span>{automation.successRate}%</span>
                                </div>
                                <Progress value={automation.successRate} className="h-2" />
                              </div>
                              {automation.lastExecution && (
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Dernière exécution:</span>
                                  <span>{new Date(automation.lastExecution).toLocaleDateString('fr-FR')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            💰 Économies estimées: <span className="font-semibold text-green-600">{automation.estimatedSavings}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={automation.isActive}
                          onCheckedChange={() => toggleAutomation(automation.id)}
                        />
                        <span className="text-sm text-gray-600">
                          {automation.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => executeAutomation(automation.id)}
                          disabled={!automation.isActive}
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                {index < automations.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Zap className="h-8 w-8 mx-auto text-blue-500" />
              <h3 className="font-semibold">Templates d'Automation</h3>
              <p className="text-sm text-gray-600">Utilisez des modèles prêts à l'emploi</p>
              <Button variant="outline" size="sm" className="w-full">
                Parcourir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Calendar className="h-8 w-8 mx-auto text-green-500" />
              <h3 className="font-semibold">Planificateur</h3>
              <p className="text-sm text-gray-600">Programmez vos automations</p>
              <Button variant="outline" size="sm" className="w-full">
                Planifier
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <TrendingUp className="h-8 w-8 mx-auto text-purple-500" />
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm text-gray-600">Analysez les performances</p>
              <Button variant="outline" size="sm" className="w-full">
                Voir Rapports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}