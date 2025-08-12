import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  BarChart3, 
  Bell, 
  Bot, 
  CheckCircle, 
  Clock, 
  Download, 
  Filter, 
  RefreshCw, 
  Settings, 
  TrendingUp, 
  Upload, 
  Users, 
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { FilterPanel } from "./FilterPanel";
import { ExportButton } from "./ExportButton";
import { ImportButton } from "./ImportButton";
import { ActionButton } from "./ActionButton";
import { useModalHelpers } from "@/hooks/useModalHelpers";

interface ModuleEnhancerProps {
  moduleName: string;
  data: any[];
  actions?: {
    refresh?: () => void | Promise<void>;
    export?: (format: string) => void;
    import?: (data: any[]) => void;
    create?: () => void;
    settings?: () => void;
    notifications?: () => void;
    analytics?: () => void;
    automation?: () => void;
  };
  filters?: {
    categories?: Array<{ label: string; value: string }>;
    statuses?: Array<{ label: string; value: string }>;
    suppliers?: Array<{ label: string; value: string }>;
    priorities?: Array<{ label: string; value: string }>;
    search?: boolean;
    dateRange?: boolean;
  };
  metrics?: {
    total?: number;
    processed?: number;
    pending?: number;
    failed?: number;
    growth?: string;
  };
  children?: React.ReactNode;
}

export function ModuleEnhancer({
  moduleName,
  data,
  actions = {},
  filters,
  metrics,
  children
}: ModuleEnhancerProps) {
  const [currentFilters, setCurrentFilters] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const modalHelpers = useModalHelpers();

  const handleAction = async (actionName: string, actionFn?: () => void | Promise<void>) => {
    if (!actionFn) {
      toast.info(`Action ${actionName} configurée pour ${moduleName}`);
      return;
    }

    setIsLoading(true);
    try {
      await actionFn();
      setLastRefresh(new Date());
    } catch (error) {
      toast.error(`Erreur lors de l'action ${actionName}`);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultActions = {
    refresh: () => {
      toast.success(`${moduleName} actualisé`);
      setLastRefresh(new Date());
    },
    export: (format: string) => {
      toast.success(`Export ${format} de ${moduleName} lancé`);
    },
    import: (importedData: any[]) => {
      toast.success(`${importedData.length} éléments importés dans ${moduleName}`);
    },
    create: () => {
      switch (moduleName.toLowerCase()) {
        case 'produits':
        case 'catalogue':
          modalHelpers.openCreateProduct();
          break;
        case 'commandes':
        case 'orders':
          modalHelpers.openCreateOrder();
          break;
        case 'clients':
        case 'customers':
          modalHelpers.openCreateCustomer();
          break;
        case 'campagnes':
        case 'marketing':
          modalHelpers.openCreateCampaign();
          break;
        default:
          toast.info(`Création d'un nouvel élément dans ${moduleName}`);
      }
    },
    settings: () => {
      modalHelpers.openSettings({ module: moduleName });
    },
    notifications: () => {
      toast.success("Centre de notifications ouvert");
    },
    analytics: () => {
      toast.success(`Analytics de ${moduleName} générées`);
    },
    automation: () => {
      toast.success(`Automation de ${moduleName} configurée`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                {moduleName} - Contrôles Avancés
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Dernière mise à jour: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {data.length} éléments
              </Badge>
              {metrics?.growth && (
                <Badge variant="default">
                  {metrics.growth}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <ActionButton
              onClick={() => handleAction('refresh', actions.refresh || defaultActions.refresh)}
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
              loading={isLoading}
            >
              Actualiser
            </ActionButton>

            <ExportButton
              data={data}
              filename={`${moduleName.toLowerCase()}-export`}
              onExport={actions.export || defaultActions.export}
            />

            <ImportButton
              onImport={actions.import || defaultActions.import}
            />

            <ActionButton
              onClick={() => handleAction('create', actions.create || defaultActions.create)}
              variant="default"
              icon={<Upload className="w-4 h-4" />}
            >
              Créer
            </ActionButton>

            <ActionButton
              onClick={() => handleAction('analytics', actions.analytics || defaultActions.analytics)}
              variant="secondary"
              icon={<BarChart3 className="w-4 h-4" />}
            >
              Analytics
            </ActionButton>

            <ActionButton
              onClick={() => handleAction('automation', actions.automation || defaultActions.automation)}
              variant="secondary"
              icon={<Bot className="w-4 h-4" />}
            >
              Automation
            </ActionButton>

            <ActionButton
              onClick={() => handleAction('notifications', actions.notifications || defaultActions.notifications)}
              variant="outline"
              icon={<Bell className="w-4 h-4" />}
            >
              Notifications
            </ActionButton>

            <ActionButton
              onClick={() => handleAction('settings', actions.settings || defaultActions.settings)}
              variant="ghost"
              icon={<Settings className="w-4 h-4" />}
            >
              Paramètres
            </ActionButton>
          </div>
        </CardContent>
      </Card>

      {/* Métriques */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.total || data.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {metrics.processed !== undefined && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{metrics.processed}</p>
                    <p className="text-sm text-muted-foreground">Traités</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {metrics.pending !== undefined && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{metrics.pending}</p>
                    <p className="text-sm text-muted-foreground">En attente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {metrics.failed !== undefined && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{metrics.failed}</p>
                    <p className="text-sm text-muted-foreground">Échecs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filtres */}
      {filters && (
        <FilterPanel
          filters={currentFilters}
          onFiltersChange={setCurrentFilters}
          options={filters}
          onReset={() => setCurrentFilters({})}
          loading={isLoading}
        />
      )}

      {/* Contenu principal */}
      {children}
    </div>
  );
}