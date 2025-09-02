import React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QuickAction } from "./SidebarConfig";

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (action: string) => void;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  recentActions: string[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  onAction,
  syncStatus,
  recentActions
}) => {
  return (
    <div className="space-y-3">
      {/* Titre de section */}
      <div className="px-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Actions Rapides
        </h3>
      </div>

      {/* Grille d'actions principales */}
      <div className="grid grid-cols-2 gap-2 px-2">
        {actions.slice(0, 4).map((action) => {
          const isSync = action.action === 'sync';
          const isSyncing = isSync && syncStatus === 'syncing';
          const wasRecent = recentActions.includes(action.action);

          return (
            <TooltipProvider key={action.action}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={action.variant}
                    size="sm"
                    onClick={() => onAction(action.action)}
                    disabled={isSyncing}
                    className={cn(
                      "flex flex-col items-center gap-1 h-auto py-3 px-2",
                      "transition-all duration-200 group relative",
                      "hover:scale-105 active:scale-95",
                      wasRecent && "ring-2 ring-primary/20 bg-primary/5",
                      isSyncing && "cursor-not-allowed opacity-75"
                    )}
                  >
                    {/* Icône avec animation spéciale pour sync */}
                    <action.icon 
                      className={cn(
                        "h-5 w-5 transition-all duration-200",
                        isSyncing && action.action === 'sync' && "animate-spin",
                        "group-hover:scale-110"
                      )} 
                    />
                    
                    {/* Titre avec troncature */}
                    <span className="text-xs font-medium leading-none text-center line-clamp-2">
                      {action.title}
                    </span>

                    {/* Badge optionnel */}
                    {action.badge && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-1 -right-1 text-xs scale-75 animate-pulse"
                      >
                        {action.badge}
                      </Badge>
                    )}

                    {/* Indicateur d'action récente */}
                    {wasRecent && (
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-success rounded-full animate-pulse" />
                    )}

                    {/* Statut de synchronisation */}
                    {isSync && syncStatus !== 'idle' && (
                      <div className={cn(
                        "absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full",
                        {
                          'bg-primary animate-pulse': syncStatus === 'syncing',
                          'bg-success': syncStatus === 'success',
                          'bg-destructive animate-pulse': syncStatus === 'error',
                        }
                      )} />
                    )}
                  </Button>
                </TooltipTrigger>
                
                <TooltipContent 
                  side="right" 
                  className="animate-in fade-in-0 zoom-in-95"
                  sideOffset={8}
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{action.title}</p>
                    {action.description && (
                      <p className="text-xs text-muted-foreground max-w-48">
                        {action.description}
                      </p>
                    )}
                    {action.shortcut && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {action.shortcut}
                      </p>
                    )}
                    {isSync && (
                      <p className="text-xs text-muted-foreground">
                        {syncStatus === 'syncing' && 'Synchronisation...'}
                        {syncStatus === 'success' && '✅ Synchronisé'}
                        {syncStatus === 'error' && '❌ Erreur'}
                        {syncStatus === 'idle' && 'Cliquez pour synchroniser'}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Actions supplémentaires (version compacte) */}
      {actions.length > 4 && (
        <div className="px-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {actions.slice(4).map((action) => (
              <TooltipProvider key={action.action}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAction(action.action)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 h-auto shrink-0",
                        "transition-all duration-200",
                        "hover:scale-105 active:scale-95",
                        recentActions.includes(action.action) && "bg-primary/10 text-primary"
                      )}
                    >
                      <action.icon className="h-4 w-4" />
                      <span className="text-xs font-medium whitespace-nowrap">
                        {action.title}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    <div className="space-y-1">
                      <p className="font-semibold">{action.title}</p>
                      {action.description && (
                        <p className="text-xs text-muted-foreground">
                          {action.description}
                        </p>
                      )}
                      {action.shortcut && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {action.shortcut}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}
      
      {/* Séparateur visuel */}
      <div className="mx-2 h-px bg-border/50" />
    </div>
  );
};