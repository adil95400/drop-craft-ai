import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAutomation } from '@/hooks/useAutomation';
import { Bot, Play, Pause } from 'lucide-react';

export function AutomationManager() {
  const { triggers, processTrigger, updateTrigger } = useAutomation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Gestionnaire d'Automatisation
        </CardTitle>
        <CardDescription>
          Contrôlez vos automatisations en temps réel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {triggers.map((trigger) => (
            <div key={trigger.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">{trigger.name}</h4>
                <Badge variant={trigger.is_active ? 'default' : 'secondary'} className="text-xs">
                  {trigger.trigger_type}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => processTrigger({ triggerId: trigger.id })}
                  disabled={!trigger.is_active}
                >
                  <Play className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTrigger({ 
                    id: trigger.id, 
                    updates: { is_active: !trigger.is_active } 
                  })}
                >
                  {trigger.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}