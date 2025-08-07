import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  status: 'active' | 'paused' | 'draft';
  last_run?: string;
  success_rate: number;
  executions_count: number;
  created_at: string;
}

export interface AutomationTrigger {
  type: 'schedule' | 'event' | 'condition';
  schedule?: string; // cron expression
  event?: string;
  condition?: {
    field: string;
    operator: string;
    value: string;
  };
}

export interface AutomationAction {
  id: string;
  type: 'update_price' | 'import_product' | 'send_email' | 'sync_inventory' | 'create_order';
  parameters: Record<string, any>;
}

export interface AutomationLog {
  id: string;
  automation_id: string;
  status: 'success' | 'failed' | 'running';
  message: string;
  execution_time: number;
  created_at: string;
}

export const useAutomation = () => {
  const [automations, setAutomations] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Synchronisation Prix Automatique',
      description: 'Met à jour les prix des produits en fonction des fournisseurs',
      trigger: {
        type: 'schedule',
        schedule: '0 */1 * * *' // Every hour
      },
      actions: [
        {
          id: 'a1',
          type: 'update_price',
          parameters: {
            source: 'aliexpress',
            margin: 30,
            currency: 'EUR'
          }
        }
      ],
      status: 'active',
      last_run: new Date(Date.now() - 300000).toISOString(),
      success_rate: 98,
      executions_count: 247,
      created_at: '2024-01-01'
    },
    {
      id: '2',
      name: 'Import Produits Gagnants',
      description: 'Importe automatiquement les produits tendances d\'AliExpress',
      trigger: {
        type: 'schedule',
        schedule: '0 8 * * *' // Daily at 8am
      },
      actions: [
        {
          id: 'a2',
          type: 'import_product',
          parameters: {
            source: 'aliexpress',
            category: 'trending',
            min_orders: 100,
            max_price: 50
          }
        }
      ],
      status: 'active',
      last_run: new Date(Date.now() - 7200000).toISOString(),
      success_rate: 95,
      executions_count: 28,
      created_at: '2024-01-02'
    },
    {
      id: '3',
      name: 'Mise à jour Stock',
      description: 'Vérifie et met à jour le stock disponible chez les fournisseurs',
      trigger: {
        type: 'schedule',
        schedule: '0 */2 * * *' // Every 2 hours
      },
      actions: [
        {
          id: 'a3',
          type: 'sync_inventory',
          parameters: {
            sources: ['aliexpress', 'amazon'],
            update_quantity: true,
            disable_out_of_stock: true
          }
        }
      ],
      status: 'paused',
      last_run: new Date(Date.now() - 21600000).toISOString(),
      success_rate: 92,
      executions_count: 134,
      created_at: '2024-01-03'
    }
  ]);

  const [logs, setLogs] = useState<AutomationLog[]>([
    {
      id: '1',
      automation_id: '1',
      status: 'success',
      message: '45 prix mis à jour avec succès',
      execution_time: 1200,
      created_at: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: '2',
      automation_id: '2',
      status: 'success',
      message: '12 nouveaux produits importés',
      execution_time: 3400,
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ]);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createAutomation = async (automationData: Omit<AutomationRule, 'id' | 'created_at' | 'success_rate' | 'executions_count'>) => {
    setLoading(true);
    
    try {
      const newAutomation: AutomationRule = {
        ...automationData,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        success_rate: 100,
        executions_count: 0
      };

      setAutomations(prev => [newAutomation, ...prev]);
      
      toast({
        title: "Automation créée",
        description: `"${newAutomation.name}" a été créée avec succès`,
      });

      return newAutomation;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'automation",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (automationId: string) => {
    setAutomations(prev => 
      prev.map(automation => 
        automation.id === automationId 
          ? { 
              ...automation, 
              status: automation.status === 'active' ? 'paused' : 'active'
            }
          : automation
      )
    );

    const automation = automations.find(a => a.id === automationId);
    const newStatus = automation?.status === 'active' ? 'paused' : 'active';

    toast({
      title: `Automation ${newStatus === 'active' ? 'activée' : 'mise en pause'}`,
      description: `L'automation a été ${newStatus === 'active' ? 'activée' : 'mise en pause'}`,
    });
  };

  const runAutomation = async (automationId: string) => {
    setLoading(true);
    
    try {
      const automation = automations.find(a => a.id === automationId);
      if (!automation) throw new Error('Automation non trouvée');

      // Simulate execution
      const executionLog: AutomationLog = {
        id: Math.random().toString(36).substr(2, 9),
        automation_id: automationId,
        status: 'running',
        message: 'Exécution en cours...',
        execution_time: 0,
        created_at: new Date().toISOString()
      };

      setLogs(prev => [executionLog, ...prev]);

      // Simulate execution time
      await new Promise(resolve => setTimeout(resolve, 3000));

      const completedLog: AutomationLog = {
        ...executionLog,
        status: Math.random() > 0.1 ? 'success' : 'failed',
        message: Math.random() > 0.1 ? 'Exécution terminée avec succès' : 'Erreur lors de l\'exécution',
        execution_time: Math.floor(Math.random() * 5000) + 1000
      };

      setLogs(prev => prev.map(log => log.id === executionLog.id ? completedLog : log));

      // Update automation stats
      setAutomations(prev => 
        prev.map(automation => 
          automation.id === automationId 
            ? { 
                ...automation, 
                last_run: new Date().toISOString(),
                executions_count: automation.executions_count + 1
              }
            : automation
        )
      );

      toast({
        title: "Automation exécutée",
        description: completedLog.message,
        variant: completedLog.status === 'success' ? 'default' : 'destructive'
      });

    } catch (error) {
      toast({
        title: "Erreur d'exécution",
        description: "Impossible d'exécuter l'automation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAutomation = async (automationId: string) => {
    setAutomations(prev => prev.filter(automation => automation.id !== automationId));
    setLogs(prev => prev.filter(log => log.automation_id !== automationId));
    
    toast({
      title: "Automation supprimée",
      description: "L'automation a été supprimée avec succès",
    });
  };

  const getStats = () => {
    const active = automations.filter(a => a.status === 'active').length;
    const total = automations.length;
    const avgSuccessRate = automations.length > 0 
      ? automations.reduce((sum, a) => sum + a.success_rate, 0) / automations.length 
      : 0;
    const totalExecutions = automations.reduce((sum, a) => sum + a.executions_count, 0);
    const recentLogs = logs.filter(log => 
      new Date(log.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    return {
      active,
      total,
      avgSuccessRate: Math.round(avgSuccessRate * 10) / 10,
      totalExecutions,
      dailyExecutions: recentLogs.length,
      timeSaved: Math.floor(totalExecutions * 2.5) // Estimate 2.5 hours saved per execution
    };
  };

  const getLogsForAutomation = (automationId: string) => {
    return logs.filter(log => log.automation_id === automationId);
  };

  const duplicateAutomation = async (automationId: string) => {
    const original = automations.find(a => a.id === automationId);
    if (!original) return;

    const duplicate: AutomationRule = {
      ...original,
      id: Math.random().toString(36).substr(2, 9),
      name: `${original.name} (Copie)`,
      status: 'draft',
      created_at: new Date().toISOString(),
      success_rate: 100,
      executions_count: 0,
      last_run: undefined
    };

    setAutomations(prev => [duplicate, ...prev]);
    
    toast({
      title: "Automation dupliquée",
      description: `"${duplicate.name}" a été créée`,
    });

    return duplicate;
  };

  return {
    automations,
    logs,
    loading,
    stats: getStats(),
    createAutomation,
    toggleAutomation,
    runAutomation,
    deleteAutomation,
    duplicateAutomation,
    getLogsForAutomation
  };
};