import React, { useState } from 'react';
import { logError } from '@/utils/consoleCleanup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAutomation } from '@/hooks/useAutomation';
import { 
  Bot, 
  Plus, 
  Activity, 
  Mail, 
  Package, 
  TrendingUp, 
  Clock,
  Settings,
  Save,
  X
} from 'lucide-react';

interface CreateAutomationRuleProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export function CreateAutomationRule({ onClose, onSuccess }: CreateAutomationRuleProps) {
  const { createTrigger, createAction, isCreatingTrigger, isCreatingAction } = useAutomation();
  
  const [triggerData, setTriggerData] = useState<{
    name: string;
    description: string;
    trigger_type: 'order_status' | 'customer_behavior' | 'inventory_level' | 'price_change' | 'scheduled';
    conditions: any;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    trigger_type: 'order_status',
    conditions: {},
    is_active: true
  });

  const [actionData, setActionData] = useState<{
    action_type: 'send_email' | 'update_inventory' | 'create_order' | 'update_customer' | 'price_adjustment' | 'notification';
    action_config: any;
    execution_order: number;
    is_active: boolean;
  }>({
    action_type: 'send_email',
    action_config: {},
    execution_order: 1,
    is_active: true
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const triggerTypes = [
    { value: 'order_status', label: 'Statut Commande', icon: Activity },
    { value: 'customer_behavior', label: 'Comportement Client', icon: Mail },
    { value: 'inventory_level', label: 'Niveau Stock', icon: Package },
    { value: 'price_change', label: 'Prix Dynamique', icon: TrendingUp },
    { value: 'scheduled', label: 'Programmé', icon: Clock },
  ];

  const actionTypes = [
    { value: 'send_email', label: 'Envoyer Email', description: 'Envoyer un email automatique' },
    { value: 'update_inventory', label: 'Mettre à jour Stock', description: 'Modifier les niveaux de stock' },
    { value: 'create_order', label: 'Créer Commande', description: 'Générer une nouvelle commande' },
    { value: 'update_customer', label: 'Mettre à jour Client', description: 'Modifier les données client' },
    { value: 'price_adjustment', label: 'Ajuster Prix', description: 'Modification automatique des prix' },
    { value: 'notification', label: 'Notification', description: 'Envoyer une notification' },
  ];

  const handleCreateRule = async () => {
    try {
      // Create trigger first
      const newTrigger = await new Promise((resolve, reject) => {
        createTrigger(triggerData, {
          onSuccess: resolve,
          onError: reject
        });
      });

      // Then create action linked to the trigger
      if (newTrigger && typeof newTrigger === 'object' && 'id' in newTrigger) {
        await new Promise((resolve, reject) => {
          createAction({
            ...actionData,
            trigger_id: (newTrigger as any).id
          }, {
            onSuccess: resolve,
            onError: reject
          });
        });
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      logError(error, 'CreateAutomationRule.createRule');
    }
  };

  const updateTriggerConditions = (key: string, value: any) => {
    setTriggerData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [key]: value
      }
    }));
  };

  const updateActionConfig = (key: string, value: any) => {
    setActionData(prev => ({
      ...prev,
      action_config: {
        ...prev.action_config,
        [key]: value
      }
    }));
  };

  const selectedTriggerType = triggerTypes.find(t => t.value === triggerData.trigger_type);
  const selectedActionType = actionTypes.find(a => a.value === actionData.action_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            Créer une Règle d'Automatisation
          </h2>
          <p className="text-muted-foreground">
            Configurez un déclencheur et les actions associées
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button 
            onClick={handleCreateRule}
            disabled={isCreatingTrigger || isCreatingAction || !triggerData.name}
          >
            <Save className="w-4 h-4 mr-2" />
            Créer la Règle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trigger Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedTriggerType && <selectedTriggerType.icon className="w-5 h-5" />}
              Déclencheur
            </CardTitle>
            <CardDescription>
              Définissez quand cette règle doit s'activer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="trigger-name">Nom du déclencheur</Label>
              <Input
                id="trigger-name"
                placeholder="Ex: Commande livrée avec succès"
                value={triggerData.name}
                onChange={(e) => setTriggerData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="trigger-description">Description</Label>
              <Textarea
                id="trigger-description"
                placeholder="Décrivez quand cette règle s'active..."
                value={triggerData.description}
                onChange={(e) => setTriggerData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label>Type de déclencheur</Label>
              <Select 
                value={triggerData.trigger_type} 
                onValueChange={(value: any) => setTriggerData(prev => ({ ...prev, trigger_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trigger-specific conditions */}
            {triggerData.trigger_type === 'order_status' && (
              <div>
                <Label>Statut cible</Label>
                <Select onValueChange={(value) => updateTriggerConditions('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivered">Livré</SelectItem>
                    <SelectItem value="shipped">Expédié</SelectItem>
                    <SelectItem value="processing">En traitement</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {triggerData.trigger_type === 'inventory_level' && (
              <div>
                <Label>Seuil de stock</Label>
                <Input
                  type="number"
                  placeholder="10"
                  onChange={(e) => updateTriggerConditions('threshold', parseInt(e.target.value))}
                />
              </div>
            )}

            {triggerData.trigger_type === 'customer_behavior' && (
              <div>
                <Label>Jours d'inactivité</Label>
                <Input
                  type="number"
                  placeholder="30"
                  onChange={(e) => updateTriggerConditions('days_inactive', parseInt(e.target.value))}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label>Règle active</Label>
                <p className="text-sm text-muted-foreground">
                  Activer cette règle immédiatement
                </p>
              </div>
              <Switch
                checked={triggerData.is_active}
                onCheckedChange={(checked) => setTriggerData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Action
            </CardTitle>
            <CardDescription>
              Définissez ce qui doit se passer quand le déclencheur s'active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Type d'action</Label>
              <Select 
                value={actionData.action_type} 
                onValueChange={(value: any) => setActionData(prev => ({ ...prev, action_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action-specific configuration */}
            {actionData.action_type === 'send_email' && (
              <div className="space-y-3">
                <div>
                  <Label>Template d'email</Label>
                  <Select onValueChange={(value) => updateActionConfig('template', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery_confirmation">Confirmation de livraison</SelectItem>
                      <SelectItem value="reactivation_campaign">Campagne de réactivation</SelectItem>
                      <SelectItem value="order_update">Mise à jour commande</SelectItem>
                      <SelectItem value="welcome">Bienvenue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destinataire</Label>
                  <Select onValueChange={(value) => updateActionConfig('recipient', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Qui reçoit l'email" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Client</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="custom">Email personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {actionData.action_type === 'notification' && (
              <div className="space-y-3">
                <div>
                  <Label>Type de notification</Label>
                  <Select onValueChange={(value) => updateActionConfig('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type de notification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low_stock_alert">Alerte stock faible</SelectItem>
                      <SelectItem value="new_order">Nouvelle commande</SelectItem>
                      <SelectItem value="customer_inactive">Client inactif</SelectItem>
                      <SelectItem value="price_alert">Alerte prix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Niveau d'urgence</Label>
                  <Select onValueChange={(value) => updateActionConfig('urgency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Niveau d'urgence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="high">Élevé</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <Label>Ordre d'exécution</Label>
              <Input
                type="number"
                value={actionData.execution_order}
                onChange={(e) => setActionData(prev => ({ ...prev, execution_order: parseInt(e.target.value) || 1 }))}
                min="1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Ordre d'exécution si plusieurs actions
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Action active</Label>
                <p className="text-sm text-muted-foreground">
                  Activer cette action
                </p>
              </div>
              <Switch
                checked={actionData.is_active}
                onCheckedChange={(checked) => setActionData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rule Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Aperçu de la Règle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-secondary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="outline">QUAND</Badge>
              {selectedTriggerType && <selectedTriggerType.icon className="w-4 h-4" />}
              <span className="font-medium">
                {triggerData.name || selectedTriggerType?.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">ALORS</Badge>
              <Settings className="w-4 h-4" />
              <span className="font-medium">
                {selectedActionType?.label}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}