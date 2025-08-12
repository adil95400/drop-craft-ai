import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Trash2, 
  Edit, 
  Download, 
  Upload, 
  Tag, 
  Archive, 
  RefreshCw,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface BulkActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: any[];
  onBulkAction?: (action: string, items: any[], options?: any) => Promise<void>;
  availableActions?: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    variant?: "default" | "destructive" | "outline";
    requiresConfirmation?: boolean;
    options?: Array<{ label: string; value: string }>;
  }>;
}

export function BulkActionsDialog({
  open,
  onOpenChange,
  selectedItems,
  onBulkAction,
  availableActions = []
}: BulkActionsDialogProps) {
  const [selectedAction, setSelectedAction] = useState("");
  const [actionOptions, setActionOptions] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);

  const defaultActions = [
    {
      id: "delete",
      label: "Supprimer",
      icon: <Trash2 className="w-4 h-4" />,
      variant: "destructive" as const,
      requiresConfirmation: true
    },
    {
      id: "archive",
      label: "Archiver",
      icon: <Archive className="w-4 h-4" />,
      variant: "outline" as const
    },
    {
      id: "export",
      label: "Exporter",
      icon: <Download className="w-4 h-4" />,
      variant: "outline" as const
    },
    {
      id: "status",
      label: "Changer statut",
      icon: <Tag className="w-4 h-4" />,
      variant: "outline" as const,
      options: [
        { label: "Actif", value: "active" },
        { label: "Inactif", value: "inactive" },
        { label: "En attente", value: "pending" },
        { label: "Suspendu", value: "suspended" }
      ]
    },
    {
      id: "batch_edit",
      label: "Modification groupée",
      icon: <Edit className="w-4 h-4" />,
      variant: "outline" as const
    }
  ];

  const actions = availableActions.length > 0 ? availableActions : defaultActions;
  const currentAction = actions.find(a => a.id === selectedAction);

  const handleExecute = async () => {
    if (!selectedAction || selectedItems.length === 0) {
      toast.error("Veuillez sélectionner une action");
      return;
    }

    if (currentAction?.requiresConfirmation) {
      if (!confirm(`Êtes-vous sûr de vouloir ${currentAction.label.toLowerCase()} ${selectedItems.length} éléments ?`)) {
        return;
      }
    }

    setIsExecuting(true);
    setProgress(0);

    try {
      if (onBulkAction) {
        // Simuler le progrès
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 95) {
              clearInterval(progressInterval);
              return 95;
            }
            return prev + 5;
          });
        }, 100);

        await onBulkAction(selectedAction, selectedItems, actionOptions);
        
        clearInterval(progressInterval);
        setProgress(100);
        
        toast.success(`Action "${currentAction?.label}" exécutée sur ${selectedItems.length} éléments`);
      } else {
        // Action par défaut
        await simulateDefaultAction(selectedAction, selectedItems);
      }

      setTimeout(() => {
        onOpenChange(false);
        setSelectedAction("");
        setActionOptions({});
        setProgress(0);
      }, 1000);

    } catch (error) {
      toast.error("Erreur lors de l'exécution de l'action");
    } finally {
      setIsExecuting(false);
    }
  };

  const simulateDefaultAction = async (action: string, items: any[]) => {
    return new Promise(resolve => {
      setTimeout(() => {
        switch (action) {
          case "delete":
            toast.success(`${items.length} éléments supprimés`);
            break;
          case "archive":
            toast.success(`${items.length} éléments archivés`);
            break;
          case "export":
            toast.success(`Export de ${items.length} éléments lancé`);
            break;
          case "status":
            toast.success(`Statut modifié pour ${items.length} éléments`);
            break;
          case "batch_edit":
            toast.success(`Modification groupée appliquée à ${items.length} éléments`);
            break;
          default:
            toast.success(`Action exécutée sur ${items.length} éléments`);
        }
        resolve(true);
      }, 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Actions groupées
          </DialogTitle>
          <DialogDescription>
            Appliquer une action à {selectedItems.length} éléments sélectionnés
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Éléments sélectionnés */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Éléments sélectionnés</h4>
              <Badge variant="secondary">{selectedItems.length}</Badge>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedItems.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{item.name || item.title || item.id || `Élément ${index + 1}`}</span>
                </div>
              ))}
              {selectedItems.length > 5 && (
                <p className="text-sm text-muted-foreground">
                  ... et {selectedItems.length - 5} autres éléments
                </p>
              )}
            </div>
          </div>

          {/* Sélection d'action */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Choisir une action</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionner une action" />
                </SelectTrigger>
                <SelectContent>
                  {actions.map((action) => (
                    <SelectItem key={action.id} value={action.id}>
                      <div className="flex items-center gap-2">
                        {action.icon}
                        {action.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Options pour l'action sélectionnée */}
            {currentAction?.options && (
              <div>
                <label className="text-sm font-medium">Options</label>
                <Select 
                  value={actionOptions[selectedAction] || ""} 
                  onValueChange={(value) => setActionOptions({
                    ...actionOptions,
                    [selectedAction]: value
                  })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Sélectionner une option" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentAction.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Avertissement pour actions destructives */}
            {currentAction?.requiresConfirmation && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Action irréversible</p>
                  <p className="text-orange-700">
                    Cette action ne peut pas être annulée. Vérifiez votre sélection avant de continuer.
                  </p>
                </div>
              </div>
            )}

            {/* Barre de progression */}
            {isExecuting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Exécution en cours...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isExecuting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleExecute}
            disabled={!selectedAction || isExecuting || selectedItems.length === 0}
            variant={currentAction?.variant || "default"}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exécution...
              </>
            ) : (
              <>
                {currentAction?.icon}
                <span className="ml-2">Exécuter</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}