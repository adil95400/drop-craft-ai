import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, Trash2, Activity, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  is_active: boolean;
  created_at: string;
  actions: any[];
  executions_count: number;
}

export function AutomationList() {
  const { toast } = useToast();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: triggers, error } = await supabase
        .from('automation_triggers')
        .select(`
          id,
          name,
          description,
          trigger_type,
          is_active,
          created_at,
          automation_actions (
            id,
            action_type,
            execution_order
          )
        `)
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const automationsWithStats = await Promise.all(
        (triggers || []).map(async (trigger) => {
          const { count } = await supabase
            .from('activity_logs')
            .select('id', { count: 'exact', head: true })
            .eq('entity_id', trigger.id)
            .eq('entity_type', 'automation');

          return {
            ...trigger,
            actions: trigger.automation_actions || [],
            executions_count: count || 0
          };
        })
      );

      setAutomations(automationsWithStats);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_triggers')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: currentStatus ? 'Automation Paused' : 'Automation Activated',
        description: `The automation has been ${currentStatus ? 'paused' : 'activated'} successfully`
      });

      loadAutomations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;

    try {
      const { error } = await supabase
        .from('automation_triggers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Automation Deleted',
        description: 'The automation has been removed successfully'
      });

      loadAutomations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading automations...</div>;
  }

  return (
    <div className="space-y-4">
      {automations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle className="mb-2">No Automations Yet</CardTitle>
            <CardDescription>
              Create your first automation to start automating your workflows
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        automations.map((automation) => (
          <Card key={automation.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{automation.name}</CardTitle>
                    <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                      {automation.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                  <CardDescription>{automation.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAutomation(automation.id, automation.is_active)}
                  >
                    {automation.is_active ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteAutomation(automation.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  {automation.trigger_type.replace('_', ' ')}
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  {automation.actions.length} action{automation.actions.length !== 1 ? 's' : ''}
                </div>
                <div>
                  Executed {automation.executions_count} times
                </div>
                <div className="ml-auto">
                  Created {formatDistanceToNow(new Date(automation.created_at), { addSuffix: true })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
