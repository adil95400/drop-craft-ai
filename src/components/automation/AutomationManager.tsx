import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Settings, 
  Calendar, 
  Zap, 
  TrendingUp, 
  Package, 
  ShoppingCart,
  Database,
  Clock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutomationJob {
  id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  schedule_type: 'manual' | 'hourly' | 'daily' | 'weekly';
  schedule_config: any;
  input_data: any;
  output_data: any;
  progress: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

export function AutomationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newJobType, setNewJobType] = useState('');
  const [scheduleType, setScheduleType] = useState<'manual' | 'hourly' | 'daily' | 'weekly'>('manual');
  const [jobConfig, setJobConfig] = useState('{}');

  // Fetch automation jobs - using activity_logs as fallback since automation_jobs table is new
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['automation-jobs'],
    queryFn: async () => {
      // Try to fetch from activity_logs where action contains automation info
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .ilike('action', '%automation%')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.warn('Could not fetch automation jobs:', error);
        return [];
      }
      
      // Transform activity logs to automation job format
      return (data || []).map(log => ({
        id: log.id,
        job_type: log.action,
        status: 'completed' as const,
        schedule_type: 'manual' as const,
        schedule_config: {},
        input_data: log.metadata || {},
        output_data: {},
        progress: 100,
        created_at: log.created_at,
        updated_at: log.created_at
      })) as AutomationJob[];
    }
  });

  // Create automation job
  const createJobMutation = useMutation({
    mutationFn: async ({ jobType, scheduleType, inputData }: any) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'create_job',
          jobType,
          userId: user.data.user.id,
          inputData: {
            ...inputData,
            immediate: scheduleType === 'manual'
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Job créé",
        description: "Le job d'automatisation a été créé avec succès"
      });
      queryClient.invalidateQueries({ queryKey: ['automation-jobs'] });
      setNewJobType('');
      setJobConfig('{}');
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de création",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Process job manually
  const processJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'process_job',
          jobId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Job démarré",
        description: "Le job d'automatisation a été démarré"
      });
      queryClient.invalidateQueries({ queryKey: ['automation-jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de traitement",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCreateJob = () => {
    if (!newJobType) {
      toast({
        title: "Type de job requis",
        description: "Veuillez sélectionner un type de job",
        variant: "destructive"
      });
      return;
    }

    let inputData;
    try {
      inputData = JSON.parse(jobConfig);
    } catch (error) {
      toast({
        title: "Configuration invalide",
        description: "Le format JSON de la configuration est invalide",
        variant: "destructive"
      });
      return;
    }

    createJobMutation.mutate({
      jobType: newJobType,
      scheduleType,
      inputData
    });
  };

  const getJobIcon = (jobType: string) => {
    switch (jobType) {
      case 'sync_inventory': return <Package className="h-4 w-4" />;
      case 'update_prices': return <TrendingUp className="h-4 w-4" />;
      case 'import_catalog': return <Database className="h-4 w-4" />;
      case 'sync_orders': return <ShoppingCart className="h-4 w-4" />;
      case 'cleanup_data': return <Settings className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      case 'pending': return 'outline';
      case 'cancelled': return 'secondary';
      default: return 'outline';
    }
  };

  const getJobTypeDescription = (jobType: string) => {
    switch (jobType) {
      case 'sync_inventory': return 'Synchronise les niveaux de stock avec les plateformes connectées';
      case 'update_prices': return 'Met à jour les prix selon les règles de tarification';
      case 'import_catalog': return 'Importe de nouveaux produits depuis les fournisseurs';
      case 'sync_orders': return 'Synchronise le statut des commandes et le suivi';
      case 'cleanup_data': return 'Nettoie les données anciennes et temporaires';
      default: return 'Job d\'automatisation personnalisé';
    }
  };

  const runningJobs = jobs?.filter(j => j.status === 'running').length || 0;
  const completedJobs = jobs?.filter(j => j.status === 'completed').length || 0;
  const failedJobs = jobs?.filter(j => j.status === 'failed').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestionnaire d'Automatisation</h1>
          <p className="text-muted-foreground">
            Configurez et surveillez les tâches automatisées
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Actifs</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{runningJobs}</div>
            <p className="text-xs text-muted-foreground">En cours d'exécution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complétés</CardTitle>
            <Settings className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{completedJobs}</div>
            <p className="text-xs text-muted-foreground">Dernières 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échecs</CardTitle>
            <Pause className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{failedJobs}</div>
            <p className="text-xs text-muted-foreground">Nécessitent attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Database className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Tous statuts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Jobs Actifs</TabsTrigger>
          <TabsTrigger value="create">Créer Job</TabsTrigger>
          <TabsTrigger value="schedule">Planification</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jobs d'Automatisation</CardTitle>
              <CardDescription>
                Gérez et surveillez vos tâches automatisées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Chargement...</div>
              ) : (
                <div className="space-y-4">
                  {jobs?.map((job) => (
                    <div key={job.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          {getJobIcon(job.job_type)}
                        </div>
                        
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{job.job_type}</span>
                            <Badge variant={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                            <Badge variant="outline">
                              {job.schedule_type}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {getJobTypeDescription(job.job_type)}
                          </p>
                          
                          {job.progress > 0 && job.status === 'running' && (
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all" 
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{job.progress}%</span>
                            </div>
                          )}
                          
                          {job.error_message && (
                            <p className="text-sm text-destructive">{job.error_message}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Créé: {new Date(job.created_at).toLocaleString('fr-FR')}</span>
                            {job.next_run_at && (
                              <span>Prochaine exécution: {new Date(job.next_run_at).toLocaleString('fr-FR')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {job.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => processJobMutation.mutate(job.id)}
                            disabled={processJobMutation.isPending}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Démarrer
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {!jobs?.length && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun job d'automatisation trouvé
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Créer un Nouveau Job</CardTitle>
              <CardDescription>
                Configurez une nouvelle tâche d'automatisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobType">Type de Job</Label>
                  <Select value={newJobType} onValueChange={setNewJobType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type de job" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sync_inventory">Synchronisation Stock</SelectItem>
                      <SelectItem value="update_prices">Mise à jour Prix</SelectItem>
                      <SelectItem value="import_catalog">Import Catalogue</SelectItem>
                      <SelectItem value="sync_orders">Synchronisation Commandes</SelectItem>
                      <SelectItem value="cleanup_data">Nettoyage Données</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scheduleType">Type de Planification</Label>
                  <Select value={scheduleType} onValueChange={(value: any) => setScheduleType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manuel</SelectItem>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobConfig">Configuration (JSON)</Label>
                <Textarea
                  id="jobConfig"
                  value={jobConfig}
                  onChange={(e) => setJobConfig(e.target.value)}
                  placeholder='{"maxProducts": 100, "supplierId": "123"}'
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Configuration JSON pour le job (optionnel)
                </p>
              </div>

              <Button 
                onClick={handleCreateJob}
                disabled={createJobMutation.isPending}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Créer Job d'Automatisation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jobs Planifiés</CardTitle>
              <CardDescription>
                Gérez les tâches récurrentes et leur planification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs?.filter(j => j.schedule_type !== 'manual').map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{job.job_type}</span>
                          <Badge variant="outline">{job.schedule_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {job.next_run_at ? 
                            `Prochaine exécution: ${new Date(job.next_run_at).toLocaleString('fr-FR')}` :
                            'Planification en cours...'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <Switch
                      checked={job.status !== 'cancelled'}
                      onCheckedChange={(checked) => {
                        // TODO: Implement job enable/disable
                        toast({
                          title: "Fonctionnalité à venir",
                          description: "L'activation/désactivation des jobs sera bientôt disponible"
                        });
                      }}
                    />
                  </div>
                ))}
                
                {!jobs?.filter(j => j.schedule_type !== 'manual').length && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun job planifié configuré
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}