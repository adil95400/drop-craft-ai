import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Workflow,
  Plus,
  Play,
  Pause,
  Save,
  Trash2,
  ArrowRight,
  Settings,
  Zap,
  Clock,
  Filter,
  Database,
  Mail,
  ShoppingCart,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  integration: string;
  operation: string;
  config: Record<string, any>;
  description: string;
}

interface IntegrationWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  is_active: boolean;
  trigger_count: number;
  success_rate: number;
  last_run: string;
  created_at: string;
}

export function IntegrationWorkflowBuilder() {
  const [workflows, setWorkflows] = useState<IntegrationWorkflow[]>([
    {
      id: '1',
      name: 'Sync Orders to CRM',
      description: 'Synchronise automatiquement les nouvelles commandes Shopify vers HubSpot',
      steps: [
        {
          id: '1-1',
          type: 'trigger',
          integration: 'Shopify',
          operation: 'new_order',
          config: { status: 'paid' },
          description: 'Nouvelle commande payée sur Shopify'
        },
        {
          id: '1-2',
          type: 'condition',
          integration: 'Internal',
          operation: 'check_value',
          config: { field: 'total', operator: '>', value: 100 },
          description: 'Montant supérieur à 100€'
        },
        {
          id: '1-3',
          type: 'action',
          integration: 'HubSpot',
          operation: 'create_deal',
          config: { pipeline: 'sales', stage: 'qualified' },
          description: 'Créer un deal dans HubSpot'
        }
      ],
      is_active: true,
      trigger_count: 247,
      success_rate: 98.5,
      last_run: '2024-01-15T10:30:00Z',
      created_at: '2024-01-10T09:00:00Z'
    },
    {
      id: '2',
      name: 'Customer Reactivation',
      description: 'Déclencher une campagne email pour les clients inactifs',
      steps: [
        {
          id: '2-1',
          type: 'trigger',
          integration: 'Internal',
          operation: 'scheduled',
          config: { interval: 'daily', time: '09:00' },
          description: 'Tous les jours à 9h'
        },
        {
          id: '2-2',
          type: 'condition',
          integration: 'Internal',
          operation: 'customer_inactive',
          config: { days: 30 },
          description: 'Client inactif depuis 30 jours'
        },
        {
          id: '2-3',
          type: 'action',
          integration: 'MailChimp',
          operation: 'add_to_campaign',
          config: { campaign: 'reactivation', segment: 'inactive' },
          description: 'Ajouter à la campagne de réactivation'
        }
      ],
      is_active: true,
      trigger_count: 45,
      success_rate: 92.3,
      last_run: '2024-01-15T09:00:00Z',
      created_at: '2024-01-12T14:30:00Z'
    }
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState<IntegrationWorkflow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState<Partial<IntegrationWorkflow>>({
    name: '',
    description: '',
    steps: [],
    is_active: false
  });

  const integrationOptions = [
    { value: 'shopify', label: 'Shopify', icon: ShoppingCart, color: 'text-green-600' },
    { value: 'hubspot', label: 'HubSpot', icon: Users, color: 'text-orange-600' },
    { value: 'mailchimp', label: 'MailChimp', icon: Mail, color: 'text-yellow-600' },
    { value: 'stripe', label: 'Stripe', icon: BarChart3, color: 'text-purple-600' },
    { value: 'internal', label: 'Interne', icon: Database, color: 'text-blue-600' }
  ];

  const triggerOperations = {
    shopify: ['new_order', 'product_updated', 'customer_created'],
    hubspot: ['deal_updated', 'contact_created', 'email_opened'],
    mailchimp: ['campaign_sent', 'subscriber_added', 'email_clicked'],
    stripe: ['payment_succeeded', 'subscription_created', 'invoice_paid'],
    internal: ['scheduled', 'data_changed', 'threshold_reached']
  };

  const actionOperations = {
    shopify: ['create_product', 'update_order', 'send_notification'],
    hubspot: ['create_deal', 'update_contact', 'create_task'],
    mailchimp: ['add_to_campaign', 'update_subscriber', 'send_email'],
    stripe: ['create_invoice', 'update_customer', 'process_refund'],
    internal: ['log_event', 'send_notification', 'update_database']
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'trigger': return <Zap className="w-4 h-4 text-green-500" />;
      case 'condition': return <Filter className="w-4 h-4 text-yellow-500" />;
      case 'action': return <Settings className="w-4 h-4 text-blue-500" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getIntegrationIcon = (integration: string) => {
    const option = integrationOptions.find(opt => opt.value === integration.toLowerCase());
    if (option) {
      const Icon = option.icon;
      return <Icon className={`w-4 h-4 ${option.color}`} />;
    }
    return <Database className="w-4 h-4" />;
  };

  const handleCreateWorkflow = () => {
    if (newWorkflow.name && newWorkflow.description) {
      const workflow: IntegrationWorkflow = {
        id: Date.now().toString(),
        name: newWorkflow.name,
        description: newWorkflow.description,
        steps: newWorkflow.steps || [],
        is_active: newWorkflow.is_active || false,
        trigger_count: 0,
        success_rate: 100,
        last_run: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      setWorkflows(prev => [workflow, ...prev]);
      setNewWorkflow({ name: '', description: '', steps: [], is_active: false });
      setIsCreating(false);
    }
  };

  const handleToggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(workflow =>
      workflow.id === workflowId
        ? { ...workflow, is_active: !workflow.is_active }
        : workflow
    ));
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId));
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(null);
    }
  };

  const addStep = (type: 'trigger' | 'condition' | 'action') => {
    const newStep: WorkflowStep = {
      id: `${Date.now()}`,
      type,
      integration: 'Internal',
      operation: '',
      config: {},
      description: `Nouvelle étape ${type}`
    };

    if (isCreating) {
      setNewWorkflow(prev => ({
        ...prev,
        steps: [...(prev.steps || []), newStep]
      }));
    } else if (selectedWorkflow) {
      setSelectedWorkflow(prev => prev ? {
        ...prev,
        steps: [...prev.steps, newStep]
      } : null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Workflow className="w-6 h-6 text-purple-600" />
            Constructeur de Workflows
          </h2>
          <p className="text-muted-foreground">
            Automatisez vos intégrations avec des workflows intelligents
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Workflow className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Workflows Actifs</p>
                <p className="text-2xl font-bold">{workflows.filter(w => w.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exécutions 24h</p>
                <p className="text-2xl font-bold">
                  {workflows.reduce((sum, w) => sum + w.trigger_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de Succès</p>
                <p className="text-2xl font-bold">
                  {Math.round(workflows.reduce((sum, w) => sum + w.success_rate, 0) / workflows.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temps Moyen</p>
                <p className="text-2xl font-bold">1.2s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflows List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflows Existants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workflows.map((workflow) => (
                <div 
                  key={workflow.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedWorkflow?.id === workflow.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium truncate">{workflow.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                        {workflow.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Switch
                        checked={workflow.is_active}
                        onCheckedChange={() => handleToggleWorkflow(workflow.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 truncate">
                    {workflow.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {workflow.steps.length} étapes
                    </span>
                    <span className="text-green-600 font-medium">
                      {workflow.success_rate}% succès
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Workflow Editor */}
        <div className="lg:col-span-2">
          {isCreating ? (
            <Card>
              <CardHeader>
                <CardTitle>Nouveau Workflow</CardTitle>
                <CardDescription>
                  Créez un workflow personnalisé pour automatiser vos intégrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workflow-name">Nom du workflow</Label>
                    <Input
                      id="workflow-name"
                      placeholder="Ex: Sync Orders to CRM"
                      value={newWorkflow.name}
                      onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newWorkflow.is_active}
                      onCheckedChange={(checked) => setNewWorkflow(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Activer immédiatement</Label>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="workflow-description">Description</Label>
                  <Textarea
                    id="workflow-description"
                    placeholder="Décrivez ce que fait ce workflow..."
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* Workflow Steps */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Étapes du Workflow</h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => addStep('trigger')}>
                        <Zap className="w-3 h-3 mr-1" />
                        Déclencheur
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => addStep('condition')}>
                        <Filter className="w-3 h-3 mr-1" />
                        Condition
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => addStep('action')}>
                        <Settings className="w-3 h-3 mr-1" />
                        Action
                      </Button>
                    </div>
                  </div>

                  {newWorkflow.steps && newWorkflow.steps.length > 0 ? (
                    <div className="space-y-3">
                      {newWorkflow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            {getStepIcon(step.type)}
                            {getIntegrationIcon(step.integration)}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{step.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {step.integration} • {step.operation}
                            </div>
                          </div>
                          {index < newWorkflow.steps.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Aucune étape définie. Ajoutez un déclencheur pour commencer.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateWorkflow}>
                    <Save className="w-4 h-4 mr-2" />
                    Créer le Workflow
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedWorkflow ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedWorkflow.name}</CardTitle>
                    <CardDescription>{selectedWorkflow.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Tester
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteWorkflow(selectedWorkflow.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Workflow Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedWorkflow.trigger_count}</div>
                      <div className="text-xs text-muted-foreground">Exécutions</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedWorkflow.success_rate}%</div>
                      <div className="text-xs text-muted-foreground">Succès</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">1.2s</div>
                      <div className="text-xs text-muted-foreground">Temps moyen</div>
                    </div>
                  </div>

                  {/* Workflow Steps */}
                  <div>
                    <h4 className="font-medium mb-4">Étapes du Workflow</h4>
                    <div className="space-y-3">
                      {selectedWorkflow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            {getStepIcon(step.type)}
                            {getIntegrationIcon(step.integration)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{step.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {step.integration} • {step.operation}
                            </div>
                            {Object.keys(step.config).length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Config: {JSON.stringify(step.config)}
                              </div>
                            )}
                          </div>
                          {index < selectedWorkflow.steps.length - 1 && (
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Executions */}
                  <div>
                    <h4 className="font-medium mb-4">Exécutions Récentes</h4>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-2 text-sm border rounded">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Exécution #{247 - i + 1}</span>
                          </div>
                          <div className="text-muted-foreground">
                            Il y a {i * 2}h • 1.{i}s
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Workflow className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sélectionnez un workflow</h3>
                  <p className="text-muted-foreground">
                    Choisissez un workflow existant ou créez-en un nouveau
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}