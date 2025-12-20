import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Copy, Edit, Trash2, Play, Pause, History, Settings } from "lucide-react";

interface AutomationOptionsMenuProps {
  automation: {
    id: number;
    name: string;
    status: string;
  };
  onToggle: (id: number) => void;
  onConfigure: (id: number) => void;
}

export const AutomationOptionsMenu = ({ automation, onToggle, onConfigure }: AutomationOptionsMenuProps) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDuplicate = () => {
    toast({
      title: "Automation dupliquée",
      description: `Une copie de "${automation.name}" a été créée.`,
    });
  };

  const handleDelete = () => {
    toast({
      title: "Automation supprimée",
      description: `"${automation.name}" a été supprimée définitivement.`,
      variant: "destructive",
    });
    setShowDeleteDialog(false);
  };

  const handleViewHistory = () => {
    toast({
      title: "Historique des exécutions",
      description: "Ouverture de l'historique...",
    });
  };

  const handleTest = () => {
    toast({
      title: "Test en cours",
      description: `Test de "${automation.name}" démarré...`,
    });
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
          <DropdownMenuItem onClick={handleTest}>
            <Play className="mr-2 h-4 w-4" />
            Tester maintenant
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
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
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};