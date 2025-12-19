import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Play, Save, Zap } from 'lucide-react';

interface Trigger {
  id?: string;
  name: string;
  description: string;
  trigger_type: string;
  conditions: any;
  is_active: boolean;
}

interface Action {
  id?: string;
  action_type: string;
  action_config: any;
  execution_order: number;
  is_active: boolean;
}

export function AutomationBuilder() {
  const { toast } = useToast();
  const [trigger, setTrigger] = useState<Trigger>({
    name: '',
    description: '',
    trigger_type: 'order_status',
    conditions: {},
    is_active: true
  });
  const [actions, setActions] = useState<Action[]>([]);
  const [saving, setSaving] = useState(false);

  const triggerTypes = [
    { value: 'order_status', label: 'Order Status Change' },
    { value: 'customer_behavior', label: 'Customer Behavior' },
    { value: 'inventory_level', label: 'Inventory Level' },
    { value: 'price_change', label: 'Price Change' },
    { value: 'schedule', label: 'Scheduled Trigger' }
  ];

  const actionTypes = [
    { value: 'send_email', label: 'Send Email' },
    { value: 'notification', label: 'Send Notification' },
    { value: 'update_price', label: 'Update Price' },
    { value: 'update_inventory', label: 'Update Inventory' },
    { value: 'webhook', label: 'Call Webhook' }
  ];

  const addAction = () => {
    setActions([...actions, {
      action_type: 'send_email',
      action_config: {},
      execution_order: actions.length + 1,
      is_active: true
    }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, updates: Partial<Action>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    setActions(newActions);
  };

  const saveAutomation = async () => {
    if (!trigger.name || actions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a trigger name and at least one action',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Insert trigger
      const { data: triggerData, error: triggerError } = await supabase
        .from('automation_triggers')
        .insert({
          user_id: userData.user.id,
          name: trigger.name,
          description: trigger.description,
          trigger_type: trigger.trigger_type,
          conditions: trigger.conditions,
          is_active: trigger.is_active
        })
        .select()
        .single();

      if (triggerError) throw triggerError;

      // Insert actions
      const actionsToInsert = actions.map((action, index) => ({
        user_id: userData.user.id,
        trigger_id: triggerData.id,
        action_type: action.action_type,
        action_config: action.action_config,
        execution_order: index + 1,
        is_active: action.is_active
      }));

      const { error: actionsError } = await supabase
        .from('automation_actions')
        .insert(actionsToInsert);

      if (actionsError) throw actionsError;

      toast({
        title: 'Automation Created',
        description: 'Your automation workflow has been saved successfully'
      });

      // Reset form
      setTrigger({
        name: '',
        description: '',
        trigger_type: 'order_status',
        conditions: {},
        is_active: true
      });
      setActions([]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Trigger Configuration
          </CardTitle>
          <CardDescription>Define when this automation should run</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trigger-name">Automation Name</Label>
            <Input
              id="trigger-name"
              placeholder="e.g., Welcome New Customers"
              value={trigger.name}
              onChange={(e) => setTrigger({ ...trigger, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger-description">Description</Label>
            <Input
              id="trigger-description"
              placeholder="What does this automation do?"
              value={trigger.description}
              onChange={(e) => setTrigger({ ...trigger, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger-type">Trigger Type</Label>
            <Select
              value={trigger.trigger_type}
              onValueChange={(value) => setTrigger({ ...trigger, trigger_type: value })}
            >
              <SelectTrigger id="trigger-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {triggerTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Define what happens when the trigger fires</CardDescription>
            </div>
            <Button onClick={addAction} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No actions added yet. Click "Add Action" to get started.
            </div>
          ) : (
            actions.map((action, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Step {index + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Action Type</Label>
                    <Select
                      value={action.action_type}
                      onValueChange={(value) => updateAction(index, { action_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={saveAutomation} disabled={saving} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Automation'}
        </Button>
      </div>
    </div>
  );
}
