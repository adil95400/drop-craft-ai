import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Upload, Download, Mail, Bell, Settings, BarChart3, 
  Users, Package, ShoppingCart, Zap, FileText, Link2, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
  badge?: string;
  disabled?: boolean;
}

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAction = useCallback((action: QuickAction) => {
    if (action.disabled) {
      toast.info(`${action.title} - Bientôt disponible`);
      return;
    }
    
    setLoadingId(action.id);
    toast.loading(`Chargement de ${action.title}...`, { id: action.id, duration: 800 });
    
    // Petit délai pour le feedback visuel
    setTimeout(() => {
      navigate(action.path);
      toast.dismiss(action.id);
      setLoadingId(null);
    }, 150);
  }, [navigate]);

  const quickActions: QuickAction[] = [
    {
      id: 'add-product',
      title: 'Ajouter produit',
      description: 'Créer un produit',
      icon: <Package className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      path: '/products/create'
    },
    {
      id: 'create-order',
      title: 'Nouvelle commande',
      description: 'Créer commande',
      icon: <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      path: '/orders/create'
    },
    {
      id: 'add-customer',
      title: 'Ajouter client',
      description: 'Nouveau client',
      icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      path: '/customers/create'
    },
    {
      id: 'quick-import-url',
      title: 'Import URL',
      description: 'Coller un lien',
      icon: <Link2 className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
      path: '/import/url',
      badge: 'Nouveau'
    },
    {
      id: 'import-data',
      title: 'Importer',
      description: 'Importer données',
      icon: <Upload className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      path: '/import/quick'
    },
    {
      id: 'create-campaign',
      title: 'Marketing',
      description: 'Nouvelle campagne',
      icon: <Mail className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-pink-500 hover:bg-pink-600',
      path: '/marketing'
    },
    {
      id: 'automation',
      title: 'Automatisation',
      description: 'Workflow auto',
      icon: <Zap className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      path: '/automation/workflow-builder'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Voir performances',
      icon: <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      path: '/analytics'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Gérer alertes',
      icon: <Bell className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-red-500 hover:bg-red-600',
      path: '/notifications/create',
      badge: 'Nouveau'
    },
    {
      id: 'export-data',
      title: 'Exporter',
      description: 'Télécharger',
      icon: <Download className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-teal-500 hover:bg-teal-600',
      path: '/analytics/exports'
    },
    {
      id: 'generate-report',
      title: 'Rapport',
      description: 'Générer rapport',
      icon: <FileText className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-slate-500 hover:bg-slate-600',
      path: '/analytics/reports'
    },
    {
      id: 'suppliers',
      title: 'Fournisseurs',
      description: 'Gérer fournisseurs',
      icon: <Package className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-cyan-500 hover:bg-cyan-600',
      path: '/suppliers'
    },
    {
      id: 'integrations',
      title: 'Intégrations',
      description: 'Connecter',
      icon: <Settings className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'bg-gray-500 hover:bg-gray-600',
      path: '/integrations'
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {/* Mobile: horizontal scroll optimisé, Desktop: grid */}
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide pb-2">
          <div className="flex gap-2 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 sm:gap-3 min-w-max sm:min-w-0">
            {quickActions.map(action => {
              const isLoading = loadingId === action.id;
              
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className={cn(
                    "h-auto p-2 sm:p-3 flex flex-col items-center gap-1 sm:gap-2 relative",
                    "min-h-[70px] sm:min-h-[90px] w-[68px] sm:w-auto flex-shrink-0",
                    "transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary",
                    action.disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:scale-105 active:scale-95 hover:shadow-md'
                  )}
                  onClick={() => handleAction(action)}
                  disabled={action.disabled || isLoading}
                  aria-label={`${action.title}: ${action.description}`}
                >
                  {action.badge && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1.5 -right-1.5 text-[9px] px-1 py-0 bg-primary text-primary-foreground"
                    >
                      {action.badge}
                    </Badge>
                  )}
                  
                  <div className={cn(
                    "p-1.5 sm:p-2 rounded-lg text-white transition-transform",
                    action.color,
                    isLoading && "animate-pulse"
                  )}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    ) : (
                      action.icon
                    )}
                  </div>
                  
                  <div className="text-center w-full overflow-hidden">
                    <div className="font-medium text-[10px] sm:text-xs leading-tight line-clamp-2">
                      {action.title}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};