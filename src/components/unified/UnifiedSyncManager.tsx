import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Database,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  Globe,
  Settings
} from 'lucide-react';
import { useGlobalSync } from '@/components/layout/GlobalSyncProvider';
import { useToast } from '@/hooks/use-toast';

interface ModuleSync {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  status: 'synced' | 'syncing' | 'error' | 'pending';
  lastSync: Date | null;
  enabled: boolean;
  progress?: number;
  dependencies?: string[];
}

export function UnifiedSyncManager() {
  const { enableAutoSync, isSyncing, lastSyncTime, manualSync, setAutoSync } = useGlobalSync();
  const { toast } = useToast();
  
  const [modules, setModules] = useState<ModuleSync[]>([
    {
      id: 'products',
      name: 'Produits',
      icon: Package,
      status: 'synced',
      lastSync: new Date(Date.now() - 300000), // 5 min ago
      enabled: true,
      dependencies: ['suppliers', 'inventory']
    },
    {
      id: 'orders',
      name: 'Commandes',
      icon: ShoppingCart,
      status: 'synced',
      lastSync: new Date(Date.now() - 180000), // 3 min ago
      enabled: true,
      dependencies: ['products', 'customers', 'inventory']
    },
    {
      id: 'customers',
      name: 'Clients',
      icon: Users,
      status: 'syncing',
      lastSync: new Date(Date.now() - 600000), // 10 min ago
      enabled: true,
      progress: 65
    },
    {
      id: 'suppliers',
      name: 'Fournisseurs',
      icon: Database,
      status: 'synced',
      lastSync: new Date(Date.now() - 120000), // 2 min ago
      enabled: true
    },
    {
      id: 'inventory',
      name: 'Inventaire',
      icon: Package,
      status: 'error',
      lastSync: new Date(Date.now() - 900000), // 15 min ago
      enabled: true,
      dependencies: ['products', 'suppliers']
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: TrendingUp,
      status: 'pending',
      lastSync: null,
      enabled: false
    },
    {
      id: 'seo',
      name: 'SEO',
      icon: Globe,
      status: 'synced',
      lastSync: new Date(Date.now() - 240000), // 4 min ago
      enabled: true
    },
    {
      id: 'integrations',
      name: 'Intégrations',
      icon: Zap,
      status: 'synced',
      lastSync: new Date(Date.now() - 360000), // 6 min ago
      enabled: true
    }
  ]);

  const handleModuleSync = async (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, status: 'syncing', progress: 0 }
        : module
    ));

    try {
      // Simuler la progression
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setModules(prev => prev.map(module => 
          module.id === moduleId 
            ? { ...module, progress }
            : module
        ));
        
        if (progress >= 100) {
          clearInterval(interval);
          setModules(prev => prev.map(module => 
            module.id === moduleId 
              ? { 
                  ...module, 
                  status: 'synced', 
                  lastSync: new Date(),
                  progress: undefined 
                }
              : module
          ));
        }
      }, 200);

      await manualSync([moduleId]);
      
      toast({
        title: "Synchronisation réussie",
        description: `Module ${modules.find(m => m.id === moduleId)?.name} synchronisé`
      });
    } catch (error) {
      setModules(prev => prev.map(module => 
        module.id === moduleId 
          ? { ...module, status: 'error', progress: undefined }
          : module
      ));
      
      toast({
        title: "Erreur de synchronisation",
        description: "Échec de la synchronisation du module",
        variant: "destructive"
      });
    }
  };

  const handleBulkSync = async () => {
    const enabledModules = modules.filter(m => m.enabled).map(m => m.id);
    
    try {
      await manualSync(enabledModules);
      toast({
        title: "Synchronisation globale réussie",
        description: `${enabledModules.length} modules synchronisés`
      });
    } catch (error) {
      toast({
        title: "Erreur de synchronisation globale",
        description: "Certains modules ont échoué",
        variant: "destructive"
      });
    }
  };

  const toggleModuleSync = (moduleId: string, enabled: boolean) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId ? { ...module, enabled } : module
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'syncing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      synced: 'default',
      syncing: 'secondary',
      error: 'destructive',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status === 'synced' && 'Synchronisé'}
        {status === 'syncing' && 'En cours'}
        {status === 'error' && 'Erreur'}
        {status === 'pending' && 'En attente'}
      </Badge>
    );
  };

  const formatLastSync = (lastSync: Date | null) => {
    if (!lastSync) return 'Jamais';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSync.getTime()) / 1000 / 60);
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `il y a ${diff} min`;
    const hours = Math.floor(diff / 60);
    return `il y a ${hours}h${diff % 60}min`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Gestionnaire de Synchronisation Unifiée
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Auto-sync</span>
                <Switch
                  checked={enableAutoSync}
                  onCheckedChange={setAutoSync}
                />
              </div>
              <Button onClick={handleBulkSync} disabled={isSyncing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Synchroniser Tout
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Gérez la synchronisation entre tous vos modules et intégrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="modules" className="space-y-4">
            <TabsList>
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="dependencies">Dépendances</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="space-y-4">
              <div className="grid gap-4">
                {modules.map((module) => {
                  const IconComponent = module.icon;
                  return (
                    <Card key={module.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-5 h-5" />
                            <div>
                              <div className="font-medium">{module.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Dernière sync: {formatLastSync(module.lastSync)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {getStatusIcon(module.status)}
                            {getStatusBadge(module.status)}
                            
                            <Switch
                              checked={module.enabled}
                              onCheckedChange={(enabled) => toggleModuleSync(module.id, enabled)}
                              disabled={module.status === 'syncing'}
                            />
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleModuleSync(module.id)}
                              disabled={module.status === 'syncing' || !module.enabled}
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${module.status === 'syncing' ? 'animate-spin' : ''}`} />
                              Sync
                            </Button>
                          </div>
                        </div>
                        
                        {module.progress !== undefined && (
                          <div className="mt-3">
                            <Progress value={module.progress} className="h-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                              {module.progress}% complété
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="dependencies">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Visualisation des dépendances entre modules
                </div>
                {modules.filter(m => m.dependencies?.length).map(module => (
                  <Card key={module.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{module.name}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          Dépend de:
                          {module.dependencies?.map(dep => (
                            <Badge key={dep} variant="outline" className="text-xs">
                              {modules.find(m => m.id === dep)?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistiques de Sync</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Modules actifs</span>
                      <span className="font-medium">{modules.filter(m => m.enabled).length}/{modules.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dernière sync globale</span>
                      <span className="font-medium">{formatLastSync(new Date(lastSyncTime))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Modules en erreur</span>
                      <span className="font-medium text-red-500">
                        {modules.filter(m => m.status === 'error').length}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions Rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurer la synchronisation
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Résoudre les erreurs
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Forcer la synchronisation
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}