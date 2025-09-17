import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Database, 
  RefreshCcw, 
  Download, 
  Trash2, 
  Settings,
  Users,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminSecurityLogger } from './AdminSecurityLogger';
import { AdminConfirmDialog } from './AdminConfirmDialog';

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
}

const quickActions: QuickAction[] = [
  {
    id: 'refresh-system',
    title: 'Actualiser Système',
    description: 'Recharger toutes les données et métriques',
    icon: RefreshCcw,
    variant: 'default',
    shortcut: 'Ctrl+R'
  },
  {
    id: 'backup-database',
    title: 'Backup Base de Données',
    description: 'Créer une sauvegarde complète',
    icon: Database,
    variant: 'secondary',
    requiresConfirm: true,
    confirmVariant: 'warning'
  },
  {
    id: 'security-scan',
    title: 'Scan de Sécurité',
    description: 'Analyser les vulnérabilités',
    icon: Shield,
    variant: 'outline',
    badge: 'RAPIDE'
  },
  {
    id: 'export-data',
    title: 'Export Données',
    description: 'Exporter les données utilisateur',
    icon: Download,
    variant: 'outline'
  },
  {
    id: 'clear-cache',
    title: 'Vider le Cache',
    description: 'Nettoyer le cache système',
    icon: Zap,
    variant: 'secondary',
    requiresConfirm: true
  },
  {
    id: 'clean-logs',
    title: 'Nettoyer les Logs',
    description: 'Supprimer les anciens logs',
    icon: Trash2,
    variant: 'destructive',
    requiresConfirm: true,
    confirmVariant: 'destructive',
    badge: 'DANGER'
  }
];

export const QuickActionsPanel: React.FC = () => {
  const { toast } = useToast();
  const { logAdminAction } = useAdminSecurityLogger();
  const [loading, setLoading] = useState<string | null>(null);
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
    
    try {
      // Log de l'action admin
      await logAdminAction(action.id, `${action.title}: ${action.description}`);

      // Simuler l'exécution de l'action
      await new Promise(resolve => setTimeout(resolve, 2000));

      switch (action.id) {
        case 'refresh-system':
          toast({
            title: "Système actualisé",
            description: "Toutes les données ont été rechargées"
          });
          break;
        case 'backup-database':
          toast({
            title: "Sauvegarde créée",
            description: "Backup de la base de données terminé avec succès"
          });
          break;
        case 'security-scan':
          toast({
            title: "Scan de sécurité terminé",
            description: "Aucune vulnérabilité critique détectée"
          });
          break;
        case 'export-data':
          toast({
            title: "Export terminé",
            description: "Les données ont été exportées avec succès"
          });
          break;
        case 'clear-cache':
          toast({
            title: "Cache vidé",
            description: "Le cache système a été nettoyé"
          });
          break;
        case 'clean-logs':
          toast({
            title: "Logs nettoyés",
            description: "Les anciens logs ont été supprimés",
            variant: "destructive"
          });
          break;
        default:
          toast({
            title: "Action exécutée",
            description: action.title
          });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Échec de l'action: ${action.title}`,
        variant: "destructive"
      });
    } finally {
      setLoading(null);
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const isLoading = loading === action.id;
              
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
                  {action.shortcut && (
                    <span className="text-xs opacity-50 absolute top-2 right-2">
                      {action.shortcut}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AdminConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, action: null })}
        title={`Confirmer: ${confirmDialog.action?.title}`}
        description={`Êtes-vous sûr de vouloir ${confirmDialog.action?.title.toLowerCase()} ? ${confirmDialog.action?.description}`}
        actionText="Confirmer"
        onConfirm={() => confirmDialog.action && executeAction(confirmDialog.action)}
        variant={confirmDialog.action?.confirmVariant || 'default'}
        requiresDoubleConfirm={confirmDialog.action?.variant === 'destructive'}
      />
    </>
  );
};