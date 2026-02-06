import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Database, 
  RefreshCcw, 
  Download, 
  Trash2,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminSecurityLogger } from './AdminSecurityLogger';
import { AdminConfirmDialog } from './AdminConfirmDialog';
import { AdminService } from '@/services/adminServices';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  badge?: string;
  requiresConfirm?: boolean;
  confirmVariant?: 'destructive' | 'warning' | 'default';
  shortcut?: string;
  serviceMethod: keyof typeof AdminService;
}

const quickActions: QuickAction[] = [
  {
    id: 'refresh-system',
    title: 'Actualiser Système',
    description: 'Recharger toutes les données et métriques',
    icon: RefreshCcw,
    variant: 'default',
    shortcut: 'Ctrl+R',
    serviceMethod: 'updateData'
  },
  {
    id: 'backup-database',
    title: 'Backup Base de Données',
    description: 'Créer une sauvegarde complète',
    icon: Database,
    variant: 'secondary',
    requiresConfirm: true,
    confirmVariant: 'warning',
    serviceMethod: 'backupDatabase'
  },
  {
    id: 'security-scan',
    title: 'Scan de Sécurité',
    description: 'Analyser les vulnérabilités',
    icon: Shield,
    variant: 'outline',
    badge: 'RAPIDE',
    serviceMethod: 'runSecurityScan'
  },
  {
    id: 'export-data',
    title: 'Export Données',
    description: 'Télécharger toutes les données',
    icon: Download,
    variant: 'outline',
    serviceMethod: 'exportData'
  },
  {
    id: 'clear-cache',
    title: 'Vider le Cache',
    description: 'Nettoyer le cache système',
    icon: Zap,
    variant: 'secondary',
    requiresConfirm: true,
    serviceMethod: 'clearCache'
  },
  {
    id: 'clean-logs',
    title: 'Nettoyer les Logs',
    description: 'Supprimer les logs > 90 jours',
    icon: Trash2,
    variant: 'destructive',
    requiresConfirm: true,
    confirmVariant: 'destructive',
    badge: 'DANGER',
    serviceMethod: 'cleanOldLogs'
  }
];

interface ActionResult {
  actionId: string;
  success: boolean;
  message: string;
  data?: any;
  duration_ms?: number;
}

export const QuickActionsPanel: React.FC = () => {
  const { toast } = useToast();
  const { logAdminAction } = useAdminSecurityLogger();
  const [loading, setLoading] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [lastResults, setLastResults] = useState<ActionResult[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: QuickAction | null;
  }>({ open: false, action: null });

  const handleAction = async (action: QuickAction) => {
    if (action.requiresConfirm) {
      setConfirmDialog({ open: true, action });
      return;
    }

    await executeAction(action);
  };

  const executeAction = async (action: QuickAction) => {
    setLoading(action.id);
    setProgress(10);
    
    try {
      // Log de l'action admin
      await logAdminAction(action.id, `${action.title}: ${action.description}`);
      setProgress(30);

      // Exécuter l'action RÉELLE via AdminService
      const serviceMethod = AdminService[action.serviceMethod];
      if (typeof serviceMethod !== 'function') {
        throw new Error(`Méthode ${action.serviceMethod} non trouvée`);
      }

      setProgress(50);
      const result = await (serviceMethod as () => Promise<any>)();
      setProgress(90);

      // Stocker le résultat
      const actionResult: ActionResult = {
        actionId: action.id,
        success: result.success,
        message: result.message,
        data: result.data,
        duration_ms: result.metrics?.duration_ms
      };

      setLastResults(prev => [actionResult, ...prev.slice(0, 4)]);

      toast({
        title: action.title,
        description: (
          <div className="flex flex-col gap-1">
            <span>{result.message}</span>
            {result.metrics?.duration_ms && (
              <span className="text-xs text-muted-foreground">
                Exécuté en {result.metrics.duration_ms}ms
              </span>
            )}
          </div>
        )
      });

      setProgress(100);
    } catch (error: any) {
      const actionResult: ActionResult = {
        actionId: action.id,
        success: false,
        message: error.message || 'Erreur inconnue'
      };

      setLastResults(prev => [actionResult, ...prev.slice(0, 4)]);

      toast({
        title: "Erreur",
        description: `Échec: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setLoading(null);
        setProgress(0);
      }, 500);
      setConfirmDialog({ open: false, action: null });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Actions Rapides d'Administration
            <Badge variant="outline" className="ml-2 text-xs">
              EXÉCUTION RÉELLE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar pendant l'exécution */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exécution en cours...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Grille d'actions */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const isLoading = loading === action.id;
              const lastResult = lastResults.find(r => r.actionId === action.id);
              
              return (
                <Button
                  key={action.id}
                  variant={action.variant}
                  onClick={() => handleAction(action)}
                  disabled={isLoading || loading !== null}
                  className="h-auto p-4 flex flex-col items-start gap-2 relative"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="font-medium text-sm">{action.title}</span>
                    {action.badge && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    {action.description}
                  </p>
                  
                  {/* Indicateur de dernier résultat */}
                  {lastResult && (
                    <div className="absolute top-2 right-2">
                      {lastResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                  
                  {action.shortcut && (
                    <span className="text-xs opacity-50 absolute bottom-2 right-2">
                      {action.shortcut}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Historique des dernières actions */}
          {lastResults.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-2">Dernières actions exécutées</h4>
              <div className="space-y-2">
                {lastResults.slice(0, 3).map((result, idx) => (
                  <div 
                    key={idx}
                    className={`text-xs p-2 rounded-lg flex items-center gap-2 ${
                      result.success 
                        ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    <span className="flex-1">{result.message}</span>
                    {result.duration_ms && (
                      <Badge variant="outline" className="text-xs">
                        {result.duration_ms}ms
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AdminConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, action: null })}
        title={`Confirmer: ${confirmDialog.action?.title}`}
        description={`Êtes-vous sûr de vouloir ${confirmDialog.action?.title.toLowerCase()} ? ${confirmDialog.action?.description}. Cette action sera exécutée immédiatement.`}
        actionText="Exécuter"
        onConfirm={() => confirmDialog.action && executeAction(confirmDialog.action)}
        variant={confirmDialog.action?.confirmVariant || 'default'}
        requiresDoubleConfirm={confirmDialog.action?.variant === 'destructive'}
      />
    </>
  );
};
