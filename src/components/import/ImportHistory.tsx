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

interface ImportHistoryProps {
  onViewDetails?: (importId: string) => void;
  onRetryImport?: (importId: string) => void;
}

export const ImportHistory = ({ onViewDetails, onRetryImport }: ImportHistoryProps) => {
  const { importedProducts } = useImportUltraPro();
  const [filter, setFilter] = useState('all');
  const [retryingImport, setRetryingImport] = useState<string | null>(null);

  // Mock import history data
  const importHistory = [
    {
      id: '1',
      name: 'Import produits Shopify',
      type: 'shopify',
      status: 'completed',
      totalItems: 156,
      successItems: 143,
      failedItems: 13,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      duration: '30 minutes',
      source: 'boutique.myshopify.com',
      progress: 100
    },
    {
      id: '2',
      name: 'Import CSV - Catalogue Été',
      type: 'csv',
      status: 'completed',
      totalItems: 89,
      successItems: 89,
      failedItems: 0,
      startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
      duration: '15 minutes',
      source: 'catalogue_ete_2024.csv',
      progress: 100
    },
    {
      id: '3',
      name: 'Import WooCommerce',
      type: 'woocommerce',
      status: 'failed',
      totalItems: 0,
      successItems: 0,
      failedItems: 0,
      startedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      completedAt: null,
      duration: '-',
      source: 'monsite.com',
      progress: 0,
      error: 'Erreur d\'authentification API'
    },
    {
      id: '4',
      name: 'Import en cours - Aliexpress',
      type: 'aliexpress',
      status: 'running',
      totalItems: 200,
      successItems: 127,
      failedItems: 3,
      startedAt: new Date(Date.now() - 20 * 60 * 1000),
      completedAt: null,
      duration: '-',
      source: 'fr.aliexpress.com',
      progress: 65
    },
    {
      id: '5',
      name: 'Import XML - Fournisseur Principal',
      type: 'xml',
      status: 'completed',
      totalItems: 342,
      successItems: 298,
      failedItems: 44,
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      duration: '45 minutes',
      source: 'fournisseur.com/feed.xml',
      progress: 100
    }
  ];

  const filteredHistory = importHistory.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échec</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">En pause</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'paused':
        return <Pause className="w-5 h-5 text-yellow-600" />;
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
      case 'shopify':
        return '🟢';
      case 'woocommerce':
        return '🟣';
      case 'aliexpress':
        return '🟠';
      default:
        return '📄';
    }
  };

  const handleRetry = async (importId: string) => {
    setRetryingImport(importId);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      onRetryImport?.(importId);
    } finally {
      setRetryingImport(null);
    }
  };

  const stats = {
    total: importHistory.length,
    completed: importHistory.filter(h => h.status === 'completed').length,
    running: importHistory.filter(h => h.status === 'running').length,
    failed: importHistory.filter(h => h.status === 'failed').length
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
                <SelectItem value="running">En cours</SelectItem>
                <SelectItem value="failed">Échecs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <Card key={item.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getTypeIcon(item.type)}</div>
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          {item.name}
                          {getStatusBadge(item.status)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Source: {item.source}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                    </div>
                  </div>

                  {/* Progress bar for running imports */}
                  {item.status === 'running' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progression</span>
                        <span>{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{item.totalItems}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{item.successItems}</div>
                      <div className="text-xs text-muted-foreground">Réussis</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">{item.failedItems}</div>
                      <div className="text-xs text-muted-foreground">Échecs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{item.duration}</div>
                      <div className="text-xs text-muted-foreground">Durée</div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Démarré: {item.startedAt.toLocaleString('fr-FR')}
                    </span>
                    {item.completedAt && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Terminé: {item.completedAt.toLocaleString('fr-FR')}
                      </span>
                    )}
                  </div>

                  {/* Error message */}
                  {item.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Erreur:</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">{item.error}</p>
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
                        disabled={retryingImport === item.id}
                      >
                        {retryingImport === item.id ? (
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

                    {item.status === 'running' && (
                      <Button variant="outline" size="sm">
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

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