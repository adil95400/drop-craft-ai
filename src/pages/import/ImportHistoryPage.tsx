import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { useNavigate } from 'react-router-dom';
import { 
  History, Search, Filter, Download, RefreshCw, Eye, 
  CheckCircle, XCircle, Clock, AlertTriangle, FileText,
  Database, Globe, Code, Package, Calendar, TrendingUp,
  BarChart3, Activity
} from 'lucide-react';
import { toast } from 'sonner';

const ImportHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [imports, setImports] = useState([]);

  // Données de simulation
  const sampleImports = [
    {
      id: 'imp_001',
      name: 'Import Amazon Bestsellers',
      type: 'API',
      status: 'completed',
      source: 'Amazon API',
      startTime: '2024-01-15T10:30:00Z',
      endTime: '2024-01-15T10:45:00Z',
      totalRows: 1500,
      successRows: 1485,
      errorRows: 15,
      duration: '15m 23s',
      fileSize: '2.3 MB',
      user: 'admin@example.com'
    },
    {
      id: 'imp_002',
      name: 'CSV Fournisseur Textile',
      type: 'CSV',
      status: 'failed',
      source: 'upload_textile.csv',
      startTime: '2024-01-15T09:15:00Z',
      endTime: '2024-01-15T09:20:00Z',
      totalRows: 850,
      successRows: 0,
      errorRows: 850,
      duration: '5m 12s',
      fileSize: '1.8 MB',
      user: 'manager@example.com',
      errorMessage: 'Format de prix invalide dans la colonne C'
    },
    {
      id: 'imp_003',
      name: 'Sync MySQL Produits',
      type: 'Database',
      status: 'processing',
      source: 'mysql://prod-db',
      startTime: '2024-01-15T11:00:00Z',
      endTime: null,
      totalRows: 2300,
      successRows: 1200,
      errorRows: 50,
      duration: 'En cours...',
      fileSize: '4.1 MB',
      user: 'sync@example.com'
    },
    {
      id: 'imp_004',
      name: 'Scraping Site Concurrent',
      type: 'Web Scraping',
      status: 'completed',
      source: 'https://competitor.com',
      startTime: '2024-01-14T16:20:00Z',
      endTime: '2024-01-14T17:45:00Z',
      totalRows: 3200,
      successRows: 3150,
      errorRows: 50,
      duration: '1h 25m',
      fileSize: '6.8 MB',
      user: 'research@example.com'
    },
    {
      id: 'imp_005',
      name: 'Import FTP Dropshipping',
      type: 'FTP',
      status: 'completed',
      source: 'ftp://supplier.com/products.xml',
      startTime: '2024-01-14T08:00:00Z',
      endTime: '2024-01-14T08:30:00Z',
      totalRows: 5000,
      successRows: 4950,
      errorRows: 50,
      duration: '30m 45s',
      fileSize: '12.5 MB',
      user: 'import@example.com'
    }
  ];

  useEffect(() => {
    setImports(sampleImports);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      processing: 'secondary',
      pending: 'outline'
    };
    return variants[status] || 'outline';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'API':
        return <Code className="h-4 w-4" />;
      case 'CSV':
        return <FileText className="h-4 w-4" />;
      case 'Database':
        return <Database className="h-4 w-4" />;
      case 'Web Scraping':
        return <Globe className="h-4 w-4" />;
      case 'FTP':
        return <Package className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredImports = imports.filter(imp => {
    const matchesSearch = imp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         imp.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || imp.status === statusFilter;
    const matchesType = typeFilter === 'all' || imp.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleRefresh = () => {
    toast.success('Historique mis à jour');
  };

  const handleExport = () => {
    toast.success('Export de l\'historique lancé');
  };

  const handleViewDetails = (importId: string) => {
    toast.info(`Affichage des détails pour ${importId}`);
  };

  // Statistiques rapides
  const stats = {
    total: imports.length,
    completed: imports.filter(i => i.status === 'completed').length,
    failed: imports.filter(i => i.status === 'failed').length,
    processing: imports.filter(i => i.status === 'processing').length,
    totalRows: imports.reduce((sum, i) => sum + i.totalRows, 0),
    successRate: imports.length > 0 ? 
      Math.round((imports.filter(i => i.status === 'completed').length / imports.length) * 100) : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <PageHeader
        title="Historique des Imports"
        description="Consultez l'historique complet de vos opérations d'import"
      />

      <div className="container mx-auto p-6 space-y-6">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Imports</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taux de Réussite</p>
                  <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lignes Traitées</p>
                  <p className="text-2xl font-bold">{stats.totalRows.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Cours</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rechercher et filtrer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Rechercher par nom ou source..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                  <SelectItem value="processing">En cours</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="Database">Database</SelectItem>
                  <SelectItem value="Web Scraping">Web Scraping</SelectItem>
                  <SelectItem value="FTP">FTP</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des imports */}
        <div className="space-y-4">
          {filteredImports.map((imp) => (
            <Card key={imp.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      {getTypeIcon(imp.type)}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{imp.name}</h3>
                        <Badge variant={getStatusBadge(imp.status)}>
                          {getStatusIcon(imp.status)}
                          <span className="ml-1 capitalize">{imp.status}</span>
                        </Badge>
                        <Badge variant="outline">{imp.type}</Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Source: {imp.source}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(imp.startTime).toLocaleDateString('fr-FR')} à {new Date(imp.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>Durée: {imp.duration}</span>
                        <span>Taille: {imp.fileSize}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        {imp.successRows.toLocaleString()} / {imp.totalRows.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">
                        {imp.errorRows > 0 && (
                          <span className="text-red-600">{imp.errorRows} erreurs</span>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(imp.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {imp.errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Erreur:</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">{imp.errorMessage}</p>
                  </div>
                )}

                {imp.status === 'processing' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progression</span>
                      <span>{Math.round((imp.successRows / imp.totalRows) * 100)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(imp.successRows / imp.totalRows) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredImports.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun import trouvé</h3>
              <p className="text-muted-foreground">
                Essayez de modifier vos critères de recherche ou lancez votre premier import.
              </p>
              <Button className="mt-4" onClick={() => navigate('/import-management')}>
                Lancer un import
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImportHistoryPage;