import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Zap, Plus, Trash2, Settings, Play, Pause, 
  Mail, MessageSquare, Bell, Clock, Target,
  ArrowRight, ArrowDown, CheckCircle, AlertTriangle,
  Brain, Sparkles, Users, TrendingUp
} from 'lucide-react'

interface AutomationStep {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'wait'
  config: any
  position: { x: number; y: number }
}

interface AutomationFlow {
  id: string
  name: string
  description: string
  status: 'active' | 'draft' | 'paused'
  steps: AutomationStep[]
  stats: {
    triggered: number
    completed: number
    success_rate: number
  }
}

const triggerTypes = [
  { value: 'new_customer', label: 'Nouveau client', icon: Users },
  { value: 'cart_abandon', label: 'Panier abandonné', icon: Target },
  { value: 'purchase', label: 'Achat effectué', icon: CheckCircle },
  { value: 'email_open', label: 'Email ouvert', icon: Mail },
  { value: 'page_visit', label: 'Page visitée', icon: TrendingUp },
  { value: 'date_trigger', label: 'Date spécifique', icon: Clock }
]

const actionTypes = [
  { value: 'send_email', label: 'Envoyer email', icon: Mail },
  { value: 'send_sms', label: 'Envoyer SMS', icon: MessageSquare },
  { value: 'send_push', label: 'Notification push', icon: Bell },
  { value: 'add_tag', label: 'Ajouter tag', icon: Target },
  { value: 'update_field', label: 'Mettre à jour champ', icon: Settings }
]

export const SmartAutomationBuilder: React.FC = () => {
  const [flows, setFlows] = useState<AutomationFlow[]>([
    {
      id: '1',
      name: 'Séquence Nouveau Client',
      description: 'Onboarding automatique pour les nouveaux inscrits',
      status: 'active',
      steps: [],
      stats: { triggered: 89, completed: 87, success_rate: 97.8 }
    },
    {
      id: '2', 
      name: 'Récupération Panier',
      description: 'Relance automatique pour paniers abandonnés',
      status: 'active',
      steps: [],
      stats: { triggered: 145, completed: 142, success_rate: 97.9 }
    },
    {
      id: '3',
      name: 'Réactivation VIP',
      description: 'Campagne de réactivation pour clients VIP inactifs',
      status: 'draft',
      steps: [],
      stats: { triggered: 0, completed: 0, success_rate: 0 }
    }
  ])

  const [selectedFlow, setSelectedFlow] = useState<string | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [newFlowName, setNewFlowName] = useState('')
  const [showNewFlow, setShowNewFlow] = useState(false)

  const createNewFlow = () => {
    const newFlow: AutomationFlow = {
      id: Date.now().toString(),
      name: newFlowName,
      description: 'Nouvelle séquence d\'automation',
      status: 'draft',
      steps: [],
      stats: { triggered: 0, completed: 0, success_rate: 0 }
    }
    
    setFlows(prev => [...prev, newFlow])
    setSelectedFlow(newFlow.id)
    setShowBuilder(true)
    setShowNewFlow(false)
    setNewFlowName('')
  }

  const toggleFlowStatus = useCallback((flowId: string) => {
    setFlows(prev => prev.map(flow => 
      flow.id === flowId 
        ? { 
            ...flow, 
            status: flow.status === 'active' ? 'paused' : 'active' 
          }
        : flow
    ))
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white'
      case 'paused': return 'bg-yellow-500 text-white'
      case 'draft': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'paused': return 'En pause'
      case 'draft': return 'Brouillon'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Automation Builder
          </h2>
          <p className="text-muted-foreground">
            Créez des séquences intelligentes avec IA
          </p>
        </div>
        
        <Button onClick={() => setShowNewFlow(true)} className="bg-gradient-to-r from-primary to-primary/80">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau workflow
        </Button>
      </div>

      {/* AI Suggestions */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Suggestions IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-3 border rounded-lg hover:shadow-md cursor-pointer transition-all">
              <div className="font-medium text-sm mb-1">Récupération Express</div>
              <div className="text-xs text-muted-foreground mb-2">
                Email + SMS 30min après abandon panier
              </div>
              <div className="text-xs text-primary font-medium">ROI estimé: +35%</div>
            </div>
            
            <div className="p-3 border rounded-lg hover:shadow-md cursor-pointer transition-all">
              <div className="font-medium text-sm mb-1">Upsell Intelligent</div>
              <div className="text-xs text-muted-foreground mb-2">
                Recommandations basées sur l'historique
              </div>
              <div className="text-xs text-primary font-medium">ROI estimé: +28%</div>
            </div>
            
            <div className="p-3 border rounded-lg hover:shadow-md cursor-pointer transition-all">
              <div className="font-medium text-sm mb-1">Win-back Campaign</div>
              <div className="text-xs text-muted-foreground mb-2">
                Réactivation clients inactifs 90j+
              </div>
              <div className="text-xs text-primary font-medium">ROI estimé: +42%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Flows */}
      <div className="grid gap-4">
        {flows.map(flow => (
          <Card key={flow.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    {flow.name}
                    <Badge className={getStatusColor(flow.status)}>
                      {getStatusText(flow.status)}
                    </Badge>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground mt-1">
                    {flow.description}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFlowStatus(flow.id)}
                  >
                    {flow.status === 'active' ? 
                      <Pause className="h-3 w-3" /> : 
                      <Play className="h-3 w-3" />
                    }
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedFlow(flow.id)
                      setShowBuilder(true)
                    }}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {flow.stats.triggered}
                  </div>
                  <div className="text-xs text-muted-foreground">Déclenchements</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {flow.stats.completed}
                  </div>
                  <div className="text-xs text-muted-foreground">Complétés</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {flow.stats.success_rate}%
                  </div>
                  <div className="text-xs text-muted-foreground">Taux de succès</div>
                </div>
              </div>

              {/* Mini workflow preview */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <div className="text-xs font-medium mb-2">Aperçu du workflow:</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Trigger
                  </div>
                  <ArrowRight className="h-3 w-3" />
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Délai 2h
                  </div>
                  <ArrowRight className="h-3 w-3" />
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </div>
                  <ArrowRight className="h-3 w-3" />
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Tag
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Flow Dialog */}
      <Dialog open={showNewFlow} onOpenChange={setShowNewFlow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom du workflow</label>
              <Input
                placeholder="Ex: Séquence bienvenue"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              Vous pourrez configurer les triggers, conditions et actions dans l'éditeur.
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewFlow(false)}>
                Annuler
              </Button>
              <Button 
                onClick={createNewFlow}
                disabled={!newFlowName.trim()}
              >
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workflow Builder Modal */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Éditeur de workflow
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Triggers */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Déclencheurs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {triggerTypes.map(trigger => {
                    const Icon = trigger.icon
                    return (
                      <div 
                        key={trigger.value}
                        className="p-2 border rounded cursor-pointer hover:bg-muted/50 text-xs flex items-center gap-2"
                      >
                        <Icon className="h-3 w-3" />
                        {trigger.label}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {actionTypes.map(action => {
                    const Icon = action.icon
                    return (
                      <div 
                        key={action.value}
                        className="p-2 border rounded cursor-pointer hover:bg-muted/50 text-xs flex items-center gap-2"
                      >
                        <Icon className="h-3 w-3" />
                        {action.label}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Canvas Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Aperçu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-xs">
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
                      <Users className="h-3 w-3 text-blue-600" />
                      <span>Nouveau client</span>
                    </div>
                    <ArrowDown className="h-3 w-3 text-muted-foreground mx-auto" />
                    <div className="p-2 bg-orange-50 border border-orange-200 rounded flex items-center gap-2">
                      <Clock className="h-3 w-3 text-orange-600" />
                      <span>Attendre 1h</span>
                    </div>
                    <ArrowDown className="h-3 w-3 text-muted-foreground mx-auto" />
                    <div className="p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                      <Mail className="h-3 w-3 text-green-600" />
                      <span>Email bienvenue</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowBuilder(false)}>
                Fermer
              </Button>
              <Button>
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}