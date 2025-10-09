import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw,
  Download,
  Eye,
  Calendar,
  Database,
  FileText,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { useImportUltraPro } from '@/hooks/useImportUltraPro';
import { useImportJobs } from '@/hooks/useImportJobs';

interface ImportHistoryProps {
  onViewDetails?: (importId: string) => void;
  onRetryImport?: (importId: string) => void;
}

export const ImportHistory = ({ onViewDetails, onRetryImport }: ImportHistoryProps) => {
  const { importedProducts } = useImportUltraPro();
  const { jobs, stats: jobStats, retryJob, isRetrying } = useImportJobs();
  const [filter, setFilter] = useState('all');

  const filteredHistory = jobs.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Terminé</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">En cours</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échec</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">En attente</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'csv':
        return '📊';
      case 'xml':
        return '🗂️';
      case 'url':
        return '🌐';
      case 'api':
        return '🔌';
      case 'shopify':
        return '🟢';
      case 'woocommerce':
        return '🟣';
      default:
        return '📄';
    }
  };

  const handleRetry = (importId: string) => {
    retryJob(importId);
    onRetryImport?.(importId);
  };

  const stats = {
    total: jobStats.total,
    completed: jobStats.completed,
    running: jobStats.processing + jobStats.pending,
    failed: jobStats.failed
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total imports</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-sm text-muted-foreground">Terminés</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <p className="text-sm text-muted-foreground">Échecs</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Historique des imports
            </CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les imports</SelectItem>
                <SelectItem value="completed">Terminés</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échecs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredHistory.map((item) => {
              const progress = item.total_rows && item.processed_rows 
                ? Math.round((item.processed_rows / item.total_rows) * 100)
                : 0;
              const duration = item.started_at && item.completed_at
                ? Math.round((new Date(item.completed_at).getTime() - new Date(item.started_at).getTime()) / 60000) + ' min'
                : '-';

              return (
                <Card key={item.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getTypeIcon(item.source_type)}</div>
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            {item.file_name || `Import ${item.source_type}`}
                            {getStatusBadge(item.status)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Source: {item.source_url || item.file_name || item.source_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                      </div>
                    </div>

                    {/* Progress bar for processing imports */}
                    {item.status === 'processing' && item.total_rows && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progression</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{item.total_rows || 0}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{item.processed_rows || 0}</div>
                        <div className="text-xs text-muted-foreground">Traités</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">{item.failed_rows || 0}</div>
                        <div className="text-xs text-muted-foreground">Échecs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{duration}</div>
                        <div className="text-xs text-muted-foreground">Durée</div>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Créé: {new Date(item.created_at).toLocaleString('fr-FR')}
                      </span>
                      {item.completed_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Terminé: {new Date(item.completed_at).toLocaleString('fr-FR')}
                        </span>
                      )}
                    </div>

                    {/* Error message */}
                    {item.errors && item.errors.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                        <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">Erreur:</span>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          {Array.isArray(item.errors) ? item.errors[0] : item.errors}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails?.(item.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Détails
                      </Button>

                      {item.status === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry(item.id)}
                          disabled={isRetrying}
                        >
                          {isRetrying ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4 mr-2" />
                          )}
                          Relancer
                        </Button>
                      )}

                      {item.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Rapport
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredHistory.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Aucun import trouvé</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'all' 
                    ? 'Aucun import n\'a encore été effectué'
                    : 'Aucun import ne correspond au filtre sélectionné'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};