import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Save, BarChart, TrendingUp, Users, ShoppingCart, Trash2, Play, Clock, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';

interface Report {
  id: string;
  report_name: string;
  report_type: string;
  filters: any;
  schedule: string | null;
  status: string | null;
  is_favorite: boolean | null;
  last_generated_at: string | null;
  created_at: string;
}

interface ReportConfig {
  name: string;
  description: string;
  type: 'sales' | 'products' | 'customers' | 'marketing' | 'custom';
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
}

export function CustomReportsBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [report, setReport] = useState<ReportConfig>({
    name: '',
    description: '',
    type: 'sales',
    schedule: 'manual',
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['advanced-reports', user?.id],
    queryFn: async (): Promise<Report[]> => {
      if (!user?.id) return [];
      const res = await shopOptiApi.request<Report[]>('/reports');
      if (!res.success) return [];
      return res.data || [];
    },
    enabled: !!user?.id,
  });

  const createReport = useMutation({
    mutationFn: async (reportConfig: ReportConfig) => {
      if (!user?.id) throw new Error('User not authenticated');
      const res = await shopOptiApi.request('/reports', {
        method: 'POST',
        body: {
          report_name: reportConfig.name,
          report_type: reportConfig.type,
          filters: { description: reportConfig.description },
          schedule: reportConfig.schedule,
        },
      });
      if (!res.success) throw new Error(res.error || 'Failed to create report');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reports'] });
      toast({
        title: '✅ Rapport créé',
        description: `Le rapport "${report.name}" a été créé avec succès`,
      });
      setReport({ name: '', description: '', type: 'sales', schedule: 'manual' });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.request(`/reports/${id}`, { method: 'DELETE' });
      if (!res.success) throw new Error(res.error || 'Failed to delete report');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reports'] });
      toast({
        title: '✅ Rapport supprimé',
        description: 'Le rapport a été supprimé avec succès',
      });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      const res = await shopOptiApi.request(`/reports/${id}`, {
        method: 'PATCH',
        body: { is_favorite: !is_favorite },
      });
      if (!res.success) throw new Error(res.error || 'Failed to toggle favorite');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reports'] });
    },
  });

  const reportTypes = [
    { value: 'sales', label: 'Ventes', icon: TrendingUp },
    { value: 'products', label: 'Produits', icon: ShoppingCart },
    { value: 'customers', label: 'Clients', icon: Users },
    { value: 'marketing', label: 'Marketing', icon: BarChart },
    { value: 'custom', label: 'Personnalisé', icon: Plus },
  ];

  const scheduleLabels: Record<string, string> = {
    manual: 'Manuel',
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
  };

  const handleSave = () => {
    if (!report.name) {
      toast({
        title: '❌ Erreur',
        description: 'Le nom du rapport est requis',
        variant: 'destructive',
      });
      return;
    }
    createReport.mutate(report);
  };

  return (
    <div className="space-y-6">
      {/* Create Report Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Créer un Rapport Personnalisé
          </CardTitle>
          <CardDescription>
            Configurez un rapport adapté à vos besoins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du rapport</Label>
              <Input
                id="name"
                placeholder="Mon rapport mensuel"
                value={report.name}
                onChange={(e) => setReport({ ...report, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez l'objectif de ce rapport..."
                value={report.description}
                onChange={(e) => setReport({ ...report, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de rapport</Label>
                <Select
                  value={report.type}
                  onValueChange={(value: any) => setReport({ ...report, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Planification</Label>
                <Select
                  value={report.schedule}
                  onValueChange={(value: any) => setReport({ ...report, schedule: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuel</SelectItem>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setReport({ name: '', description: '', type: 'sales', schedule: 'manual' })}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={createReport.isPending}>
              {createReport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {createReport.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Rapports</CardTitle>
          <CardDescription>
            {reports.length} rapport{reports.length > 1 ? 's' : ''} enregistré{reports.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun rapport créé</p>
              <p className="text-sm mt-1">Créez votre premier rapport personnalisé</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {reports.map((r) => {
                  const typeInfo = reportTypes.find(t => t.value === r.report_type);
                  const Icon = typeInfo?.icon || BarChart;
                  
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{r.report_name}</h4>
                          {r.is_favorite && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {typeInfo?.label || r.report_type}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {scheduleLabels[r.schedule || 'manual']}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite.mutate({ id: r.id, is_favorite: r.is_favorite || false })}
                        >
                          <Star className={`h-4 w-4 ${r.is_favorite ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Play className="h-3 w-3 mr-1" />
                          Générer
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteReport.mutate(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
