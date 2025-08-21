import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { 
  Plus, 
  Play, 
  Pause, 
  Save, 
  Settings, 
  Trash2,
  ArrowRight,
  Zap,
  Timer,
  Filter,
  Database,
  Mail,
  Globe,
  Code,
  GitBranch,
  TestTube,
  Eye,
  Copy,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle
} from "lucide-react"

const TRIGGER_TYPES = [
  { id: 'webhook', name: 'Webhook', icon: Globe, description: 'Déclenché par une requête HTTP' },
  { id: 'schedule', name: 'Planifié', icon: Timer, description: 'Exécution à intervalles réguliers' },
  { id: 'database', name: 'Base de données', icon: Database, description: 'Changement dans la DB' },
  { id: 'email', name: 'Email', icon: Mail, description: 'Réception d\'email' },
  { id: 'api', name: 'API Call', icon: Code, description: 'Appel API externe' }
]

const ACTION_TYPES = [
  { id: 'http_request', name: 'Requête HTTP', icon: Globe, category: 'API' },
  { id: 'database_insert', name: 'Insertion DB', icon: Database, category: 'Database' },
  { id: 'database_update', name: 'Mise à jour DB', icon: Database, category: 'Database' },
  { id: 'send_email', name: 'Envoyer Email', icon: Mail, category: 'Communication' },
  { id: 'transform_data', name: 'Transformer Données', icon: Code, category: 'Transformation' },
  { id: 'conditional', name: 'Condition', icon: GitBranch, category: 'Logique' },
  { id: 'delay', name: 'Délai', icon: Timer, category: 'Utilitaires' },
  { id: 'filter', name: 'Filtre', icon: Filter, category: 'Logique' }
]

export const WorkflowBuilder = () => {
  const [workflow, setWorkflow] = useState<any>({
    id: null,
    name: 'Nouveau Workflow',
    description: '',
    trigger: null,
    actions: [],
    conditions: [],
    status: 'draft',
    isActive: false
  })
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const { toast } = useToast()
  const canvasRef = useRef<HTMLDivElement>(null)

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState<any>(null)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })

  const handleDragStart = (item: any, e: React.DragEvent) => {
    setDraggedItem(item)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedItem) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - dragPosition.x
    const y = e.clientY - rect.top - dragPosition.y

    if (draggedItem.category === 'trigger') {
      setWorkflow(prev => ({
        ...prev,
        trigger: { ...draggedItem, position: { x, y } }
      }))
    } else {
      const newAction = {
        id: Date.now(),
        ...draggedItem,
        position: { x, y },
        config: {}
      }
      setWorkflow(prev => ({
        ...prev,
        actions: [...prev.actions, newAction]
      }))
    }

    setDraggedItem(null)
    toast({
      title: "Élément ajouté",
      description: `${draggedItem.name} ajouté au workflow`
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const saveWorkflow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const workflowData = {
        name: workflow.name,
        description: workflow.description,
        trigger_type: workflow.trigger?.id,
        trigger_config: workflow.trigger?.config || {},
        steps: workflow.actions.map((action: any, index: number) => ({
          step_type: action.id,
          step_config: action.config || {},
          position: index,
          conditions: action.conditions || []
        })),
        status: workflow.status,
        user_id: user.id
      }

      if (workflow.id) {
        const { error } = await supabase
          .from('automation_workflows')
          .update(workflowData)
          .eq('id', workflow.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('automation_workflows')
          .insert([workflowData])
          .select()
          .single()
        if (error) throw error
        setWorkflow(prev => ({ ...prev, id: data.id }))
      }

      toast({
        title: "Workflow sauvegardé",
        description: "Le workflow a été sauvegardé avec succès"
      })
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder le workflow",
        variant: "destructive"
      })
    }
  }

  const testWorkflow = async () => {
    if (!workflow.trigger) {
      toast({
        title: "Configuration incomplète",
        description: "Ajoutez au moins un déclencheur",
        variant: "destructive"
      })
      return
    }

    setIsRunning(true)
    try {
      // Simulate test execution
      const results = []
      
      // Test trigger
      results.push({
        step: 'trigger',
        name: workflow.trigger.name,
        status: 'success',
        data: { message: 'Trigger simulé avec succès' },
        duration: Math.random() * 200 + 50
      })

      // Test actions
      for (const [index, action] of workflow.actions.entries()) {
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate delay
        
        const success = Math.random() > 0.1 // 90% success rate
        results.push({
          step: `action_${index}`,
          name: action.name,
          status: success ? 'success' : 'error',
          data: success 
            ? { message: `Action ${action.name} exécutée` }
            : { error: 'Erreur de simulation' },
          duration: Math.random() * 500 + 100
        })
      }

      setTestResults(results)
      toast({
        title: "Test terminé",
        description: "Le test du workflow est terminé"
      })
    } catch (error) {
      toast({
        title: "Erreur de test",
        description: "Le test du workflow a échoué",
        variant: "destructive"
      })
    } finally {
      setIsRunning(false)
    }
  }

  const deleteNode = (nodeId: string) => {
    if (workflow.trigger?.id === nodeId) {
      setWorkflow(prev => ({ ...prev, trigger: null }))
    } else {
      setWorkflow(prev => ({
        ...prev,
        actions: prev.actions.filter((action: any) => action.id !== nodeId)
      }))
    }
    setSelectedNode(null)
  }

  const NodeComponent = ({ node, type }: { node: any, type: 'trigger' | 'action' }) => {
    const Icon = node.icon || Zap
    const isSelected = selectedNode?.id === node.id
    
    return (
      <div
        className={`absolute bg-white border-2 rounded-lg p-3 min-w-[160px] cursor-pointer transition-all duration-200 ${
          isSelected ? 'border-primary shadow-lg scale-105' : 'border-gray-300 hover:border-gray-400'
        } ${type === 'trigger' ? 'bg-blue-50' : 'bg-gray-50'}`}
        style={{ 
          left: node.position?.x || 0, 
          top: node.position?.y || 0,
          zIndex: isSelected ? 10 : 1
        }}
        onClick={() => setSelectedNode(node)}
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4" />
          <span className="font-medium text-sm">{node.name}</span>
        </div>
        <div className="text-xs text-gray-500">
          {type === 'trigger' ? 'Déclencheur' : 'Action'}
        </div>
        {node.status && (
          <div className="mt-2">
            <Badge variant={node.status === 'success' ? 'default' : 'destructive'} className="text-xs">
              {node.status === 'success' ? 'OK' : 'Erreur'}
            </Badge>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Input
            value={workflow.name}
            onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
            className="text-lg font-semibold border-none shadow-none p-0 h-auto"
          />
          <p className="text-sm text-muted-foreground">
            Constructeur de workflow visuel avec drag & drop
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={testWorkflow} disabled={isRunning}>
            {isRunning ? (
              <>
                <TestTube className="w-4 h-4 mr-2 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Tester
              </>
            )}
          </Button>
          <Button variant="outline" onClick={saveWorkflow}>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
          <Button>
            <Play className="w-4 h-4 mr-2" />
            Publier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Toolbox */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Déclencheurs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {TRIGGER_TYPES.map(trigger => {
                const Icon = trigger.icon
                return (
                  <div
                    key={trigger.id}
                    className="p-3 border rounded-lg cursor-grab hover:bg-gray-50 transition-colors"
                    draggable
                    onDragStart={(e) => handleDragStart({ ...trigger, category: 'trigger' }, e)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">{trigger.name}</div>
                        <div className="text-xs text-gray-500">{trigger.description}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-80 overflow-y-auto">
              {ACTION_TYPES.map(action => {
                const Icon = action.icon
                return (
                  <div
                    key={action.id}
                    className="p-3 border rounded-lg cursor-grab hover:bg-gray-50 transition-colors"
                    draggable
                    onDragStart={(e) => handleDragStart(action, e)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="font-medium text-sm">{action.name}</div>
                        <div className="text-xs text-gray-500">{action.category}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Canvas du Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <div
                ref={canvasRef}
                className="relative w-full h-full border-2 border-dashed border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {!workflow.trigger && workflow.actions.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Glissez-déposez des éléments ici pour créer votre workflow</p>
                    </div>
                  </div>
                )}

                {/* Render Trigger */}
                {workflow.trigger && (
                  <NodeComponent node={workflow.trigger} type="trigger" />
                )}

                {/* Render Actions */}
                {workflow.actions.map((action: any) => (
                  <NodeComponent key={action.id} node={action} type="action" />
                ))}

                {/* Connections */}
                {workflow.trigger && workflow.actions.length > 0 && (
                  <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                    {workflow.actions.map((action: any, index: number) => {
                      const startX = (workflow.trigger?.position?.x || 0) + 80
                      const startY = (workflow.trigger?.position?.y || 0) + 40
                      const endX = (action.position?.x || 0)
                      const endY = (action.position?.y || 0) + 40
                      
                      return (
                        <line
                          key={`connection-${index}`}
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />
                      )
                    })}
                  </svg>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Propriétés</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Nom</Label>
                    <Input 
                      value={selectedNode.name} 
                      onChange={(e) => {
                        const newName = e.target.value
                        if (workflow.trigger?.id === selectedNode.id) {
                          setWorkflow(prev => ({
                            ...prev,
                            trigger: { ...prev.trigger, name: newName }
                          }))
                        } else {
                          setWorkflow(prev => ({
                            ...prev,
                            actions: prev.actions.map((action: any) =>
                              action.id === selectedNode.id 
                                ? { ...action, name: newName }
                                : action
                            )
                          }))
                        }
                        setSelectedNode(prev => ({ ...prev, name: newName }))
                      }}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea 
                      placeholder="Description de l'étape..."
                      className="mt-1 text-xs"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsConfigOpen(true)}
                      className="flex-1"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Config
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteNode(selectedNode.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Sélectionnez un élément pour voir ses propriétés
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Résultats du Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
                    {result.status === 'success' ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{result.name}</div>
                      <div className="text-gray-500">{result.duration}ms</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}