import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Download, 
  FileText, 
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importAdvancedService } from '@/domains/commerce/services/importAdvancedService';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface ImportJob {
  id: string;
  source_type: string;
  source_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  success_rows: number;
  error_rows: number;
  processed_rows: number;
  errors?: string[];
  created_at: string;
  completed_at?: string;
  result_data?: any;
}

export const ImportHistoryInterface: React.FC = () => {
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const { toast } = useToast();

  // Mock data for demonstration
  const mockImportJobs: ImportJob[] = [
    {
      id: '1',
      source_type: 'url_scraper',
      source_url: 'https://example-shop.com/products',
      status: 'completed',
      total_rows: 150,
      success_rows: 145,
      error_rows: 5,
      processed_rows: 150,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      errors: ['Produit invalide ligne 23', 'Prix manquant ligne 87'],
      result_data: { products_scraped: 145, source_url: 'https://example-shop.com/products' }
    },
    {
      id: '2',
      source_type: 'bulk_zip',
      status: 'processing',
      total_rows: 2500,
      success_rows: 1800,
      error_rows: 50,
      processed_rows: 1850,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      source_type: 'xml',
      source_url: 'https://api.supplier.com/products.xml',
      status: 'completed',
      total_rows: 800,
      success_rows: 800,
      error_rows: 0,
      processed_rows: 800,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString(),
      result_data: { products_imported: 800, xml_source: 'Google Shopping' }
    },
    {
      id: '4',
      source_type: 'ftp',
      source_url: 'ftp://supplier.com/products.csv',
      status: 'failed',
      total_rows: 0,
      success_rows: 0,
      error_rows: 0,
      processed_rows: 0,
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      errors: ['Connexion FTP impossible', 'Fichier non trouvé']
    },
    {
      id: '5',
      source_type: 'csv',
      status: 'completed',
      total_rows: 500,
      success_rows: 495,
      error_rows: 5,
      processed_rows: 500,
      created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 71.5 * 60 * 60 * 1000).toISOString(),
    }
  ];

  useEffect(() => {
    loadImportHistory();
  }, []);

  const loadImportHistory = async () => {
    setLoading(true);
    try {
      // In production, use real API call
      // const history = await importAdvancedService.getImportHistory();
      
      // For demo, use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setImportJobs(mockImportJobs);
    } catch (error) {
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger l'historique des imports",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status === 'completed' && 'Terminé'}
        {status === 'processing' && 'En cours'}
        {status === 'failed' && 'Échec'}
        {status === 'pending' && 'En attente'}
      </Badge>
    );
  };

  const getSourceTypeLabel = (sourceType: string) => {
    const labels = {
      url_scraper: 'Scraper URL',
      bulk_zip: 'Import ZIP',
      xml: 'Flux XML',
      ftp: 'FTP',
      csv: 'CSV',
      json: 'JSON'
    } as const;

    return labels[sourceType as keyof typeof labels] || sourceType;
  };

  const filteredJobs = importJobs.filter(job => {
    const statusMatch = statusFilter === 'all' || job.status === statusFilter;
    const sourceMatch = sourceFilter === 'all' || job.source_type === sourceFilter;
    return statusMatch && sourceMatch;
  });

  const calculateProgress = (job: ImportJob) => {
    if (job.total_rows === 0) return 0;
    return (job.processed_rows / job.total_rows) * 100;
  };

  const viewJobDetails = (job: ImportJob) => {
    // Mock job details view
    toast({
      title: `Détails de l'import ${job.id}`,
      description: `Source: ${getSourceTypeLabel(job.source_type)} • ${job.success_rows} réussites • ${job.error_rows} erreurs`,
    });
  };

  const downloadErrorReport = (job: ImportJob) => {
    if (!job.errors || job.errors.length === 0) return;
    
    const errorReport = job.errors.join('\n');
    const blob = new Blob([errorReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${job.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Historique des Imports
          </CardTitle>
          <CardDescription>
            Consultez l'historique complet de vos imports avec détails et statistiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Terminés</SelectItem>
                  <SelectItem value="processing">En cours</SelectItem>
                  <SelectItem value="failed">Échecs</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sources</SelectItem>
                  <SelectItem value="url_scraper">Scraper URL</SelectItem>
                  <SelectItem value="bulk_zip">Import ZIP</SelectItem>
                  <SelectItem value="xml">Flux XML</SelectItem>
                  <SelectItem value="ftp">FTP</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={loadImportHistory} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Tableau des imports */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statut</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Chargement de l'historique...
                    </TableCell>
                  </TableRow>
                ) : filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun import trouvé avec ces filtres
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          {getStatusBadge(job.status)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{getSourceTypeLabel(job.source_type)}</div>
                          {job.source_url && (
                            <div className="text-sm text-muted-foreground truncate max-w-48">
                              {new URL(job.source_url).hostname}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{job.processed_rows}/{job.total_rows}</span>
                            <span>{calculateProgress(job).toFixed(0)}%</span>
                          </div>
                          <Progress value={calculateProgress(job)} className="h-2" />
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span className="text-green-600">✓ {job.success_rows}</span>
                            {job.error_rows > 0 && (
                              <span className="text-red-600">✗ {job.error_rows}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(job.created_at), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })}</div>
                          {job.completed_at && (
                            <div className="text-muted-foreground">
                              Terminé le {format(new Date(job.completed_at), 'dd/MM HH:mm', { locale: getDateFnsLocale() })}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewJobDetails(job)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {job.errors && job.errors.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadErrorReport(job)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};