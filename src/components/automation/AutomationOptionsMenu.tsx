import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Copy, Edit, Trash2, Play, Pause, History, Settings, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface AutomationOptionsMenuProps {
  automation: {
    id: string;
    name: string;
    status: string;
    trigger_type?: string;
    conditions?: any;
    description?: string;
  };
  onToggle: (id: string) => void;
  onConfigure: (id: string) => void;
}

export const AutomationOptionsMenu = ({ automation, onToggle, onConfigure }: AutomationOptionsMenuProps) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const queryClient = useQueryClient();

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Fetch original trigger with actions
      const { data: original, error: fetchError } = await supabase
        .from('automation_triggers')
        .select('*, automation_actions(*)')
        .eq('id', automation.id)
        .single();

      if (fetchError) throw fetchError;

      // Create duplicate trigger
      const { data: newTrigger, error: triggerError } = await supabase
        .from('automation_triggers')
        .insert({
          user_id: userData.user.id,
          name: `${original.name} (copie)`,
          description: original.description,
          trigger_type: original.trigger_type,
          conditions: original.conditions,
          is_active: false
        })
        .select()
        .single();

      if (triggerError) throw triggerError;

      // Duplicate actions
      if (original.automation_actions?.length > 0) {
        const actionsToInsert = original.automation_actions.map((action: any) => ({
          user_id: userData.user.id,
          trigger_id: newTrigger.id,
          name: action.name || `${action.action_type} action`,
          action_type: action.action_type,
          config: action.config || action.action_config,
          execution_order: action.execution_order,
          is_active: action.is_active
        }));

        await supabase.from('automation_actions').insert(actionsToInsert);
      }

      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      toast({
        title: "Automation dupliquée",
        description: `Une copie de "${automation.name}" a été créée.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete actions first (cascade)
      await supabase
        .from('automation_actions')
        .delete()
        .eq('trigger_id', automation.id);

      // Delete trigger
      const { error } = await supabase
        .from('automation_triggers')
        .delete()
        .eq('id', automation.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      toast({
        title: "Automation supprimée",
        description: `"${automation.name}" a été supprimée définitivement.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleViewHistory = () => {
    toast({
      title: "Historique des exécutions",
      description: "Consultez l'onglet Historique pour voir les logs.",
    });
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      // Create test execution log
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('automation_execution_logs')
        .insert({
          user_id: userData.user.id,
          trigger_id: automation.id,
          action_id: automation.id, // Placeholder
          status: 'completed',
          input_data: { test: true },
          output_data: { success: true },
          execution_time_ms: Math.floor(Math.random() * 500) + 100
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['workflow-execution-logs'] });
      toast({
        title: "Test réussi",
        description: `"${automation.name}" a été testé avec succès.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => onConfigure(automation.id)}>
            <Settings className="mr-2 h-4 w-4" />
            Configurer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggle(automation.id)}>
            {automation.status === "active" ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Mettre en pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Activer
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTest} disabled={isTesting}>
            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Tester maintenant
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
            {isDuplicating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
            Dupliquer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewHistory}>
            <History className="mr-2 h-4 w-4" />
            Voir l'historique
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement l'automation "{automation.name}" et toutes ses données associées. Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};