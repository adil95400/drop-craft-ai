/**
 * Import Rollback Manager - Gestion annulation des imports avec historique
 * Permet de revenir sur les imports en cas d'erreur
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RotateCcw, Clock, Package, CheckCircle, AlertTriangle, Trash2,
  History, ArrowLeft, Shield, RefreshCw, Eye, Download, XCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ImportJob {
  id: string;
  source: string;
  productsCount: number;
  successCount: number;
  failedCount: number;
  status: 'completed' | 'partial' | 'failed' | 'rolled_back';
  createdAt: string;
  canRollback: boolean;
  rollbackDeadline: string;
  productIds: string[];
}

export function ImportRollbackManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch import jobs
  const { data: importJobs = [], isLoading, refetch } = useQuery({
    queryKey: ['import-jobs-rollback', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const now = new Date();
      const rollbackWindow = 24 * 60 * 60 * 1000; // 24 hours

      return (data || []).map(job => {
        const createdAt = new Date(job.created_at);
        const deadline = new Date(createdAt.getTime() + rollbackWindow);
        const canRollback = job.status !== 'rolled_back' && now < deadline;

        return {
          id: job.id,
          source: job.source_platform || job.job_type || 'unknown',
          productsCount: job.total_products || 0,
          successCount: job.successful_imports || 0,
          failedCount: job.failed_imports || 0,
          status: job.status as ImportJob['status'],
          createdAt: job.created_at,
          canRollback,
          rollbackDeadline: deadline.toISOString(),
          productIds: []
        };
      }) as ImportJob[];
    },
    enabled: !!user,
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: async (job: ImportJob) => {
      if (!user || !job.canRollback) {
        throw new Error('Rollback non autorisé');
      }

      // Delete products from this import
      if (job.productIds.length > 0) {
        const { error: deleteError } = await (supabase
          .from('products') as any)
          .delete()
          .in('id', job.productIds);

        if (deleteError) throw deleteError;
      }

      // Update job status
      const { error: updateError } = await supabase
        .from('import_jobs')
        .update({ 
          status: 'rolled_back',
          metadata: { 
            rolled_back_at: new Date().toISOString(),
            rolled_back_by: user.id
          }
        })
        .eq('id', job.id);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs-rollback'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
      setShowConfirmDialog(false);
      setSelectedJob(null);
      toast.success('Import annulé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const getStatusBadge = (status: ImportJob['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Terminé</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/10 text-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" />Partiel</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600"><XCircle className="h-3 w-3 mr-1" />Échoué</Badge>;
      case 'rolled_back':
        return <Badge variant="secondary"><RotateCcw className="h-3 w-3 mr-1" />Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'csv':
        return '📊';
      case 'url':
        return '🔗';
      case 'extension':
        return '🧩';
      case 'api':
        return '🔌';
      default:
        return '📦';
    }
  };

  const handleRollbackClick = (job: ImportJob) => {
    setSelectedJob(job);
    setShowConfirmDialog(true);
  };

  const confirmRollback = () => {
    if (selectedJob) {
      rollbackMutation.mutate(selectedJob);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <RotateCcw className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Gestion des Rollbacks</CardTitle>
                <CardDescription>Annulez vos imports récents en cas d'erreur</CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Les imports peuvent être annulés dans les <strong>24 heures</strong> suivant leur exécution.
              Après ce délai, les produits doivent être supprimés manuellement.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Import Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des imports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                    <div className="h-10 w-10 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-muted rounded" />
                      <div className="h-3 w-1/4 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : importJobs.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Aucun import récent</p>
              </div>
            ) : (
              <div className="space-y-3">
                {importJobs.map(job => (
                  <div
                    key={job.id}
                    className={cn(
                      "flex items-center gap-4 p-4 border rounded-lg transition-all",
                      job.status === 'rolled_back' && "opacity-60 bg-muted/30"
                    )}
                  >
                    {/* Icon */}
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                      {getSourceIcon(job.source)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium capitalize">{job.source}</span>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {job.productsCount} produits
                        </span>
                        <span>•</span>
                        <span className="text-green-600">{job.successCount} réussis</span>
                        {job.failedCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-600">{job.failedCount} échoués</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: getDateFnsLocale() })}
                      </div>
                    </div>

                    {/* Rollback Status */}
                    <div className="text-right shrink-0">
                      {job.canRollback ? (
                        <div className="space-y-2">
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                            <Clock className="h-3 w-3 mr-1" />
                            Expire {formatDistanceToNow(new Date(job.rollbackDeadline), { addSuffix: true, locale: getDateFnsLocale() })}
                          </Badge>
                          <div>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRollbackClick(job)}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : job.status === 'rolled_back' ? (
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Annulé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rollback expiré
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmer l'annulation
            </DialogTitle>
            <DialogDescription>
              Cette action va supprimer définitivement les <strong>{selectedJob?.successCount}</strong> produits 
              importés via cet import. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-medium capitalize">{selectedJob.source}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {format(new Date(selectedJob.createdAt), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produits à supprimer</span>
                  <span className="font-medium text-red-600">{selectedJob.successCount}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRollback}
              disabled={rollbackMutation.isPending}
            >
              {rollbackMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Confirmer la suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
