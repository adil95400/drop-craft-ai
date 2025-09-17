import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Database, 
  Globe, 
  Zap, 
  Calendar, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Users,
  Package,
  BarChart3,
  History,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ImportStats {
  total_imports: number;
  successful_imports: number;
  failed_imports: number;
  products_imported: number;
  active_users: number;
  popular_sources: Array<{
    source: string;
    count: number;
  }>;
}

interface RecentImport {
  id: string;
  user_name: string;
  source_type: string;
  products_count: number;
  status: 'success' | 'failed' | 'in_progress';
  created_at: string;
}

export const AdminImport: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ImportStats>({
    total_imports: 0,
    successful_imports: 0,
    failed_imports: 0,
    products_imported: 0,
    active_users: 0,
    popular_sources: []
  });
  const [recentImports, setRecentImports] = useState<RecentImport[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadImportData();
  }, []);

  const loadImportData = async () => {
    setLoading(true);
    try {
      // Simuler des données d'import en attendant la vraie implémentation
      const mockStats: ImportStats = {
        total_imports: 1247,
        successful_imports: 1189,
        failed_imports: 58,
        products_imported: 48392,
        active_users: 156,
        popular_sources: [
          { source: 'CSV', count: 542 },
          { source: 'BigBuy', count: 289 },
          { source: 'WooCommerce', count: 187 },
          { source: 'Shopify', count: 143 },
          { source: 'API', count: 86 }
        ]
      };

      const mockRecentImports: RecentImport[] = [
        {
          id: '1',
          user_name: 'Jean Dupont',
          source_type: 'CSV',
          products_count: 150,
          status: 'success',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          user_name: 'Marie Martin',
          source_type: 'BigBuy',
          products_count: 75,
          status: 'in_progress',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          user_name: 'Pierre Durant',
          source_type: 'WooCommerce',
          products_count: 200,
          status: 'failed',
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          user_name: 'Sophie Leblanc',
          source_type: 'Shopify',
          products_count: 89,
          status: 'success',
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ];

      setStats(mockStats);
      setRecentImports(mockRecentImports);
    } catch (error) {
      console.error('Error loading import data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'import.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: RecentImport['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: RecentImport['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Réussi</Badge>;
      case 'failed': return <Badge variant="destructive">Échoué</Badge>;
      case 'in_progress': return <Badge variant="secondary">En cours</Badge>;
    }
  };

  const handleExportReport = () => {
    toast({
      title: "Export en cours",
      description: "Le rapport d'import est en cours de génération..."
    });
  };

  const handleManageImports = () => {
    navigate('/import');
  };

  const successRate = stats.total_imports > 0 ? (stats.successful_imports / stats.total_imports) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Upload className="h-8 w-8 text-primary" />
            Administration des Imports
          </h1>
          <p className="text-muted-foreground mt-2">
            Supervisez et gérez les imports de produits de tous les utilisateurs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter rapport
          </Button>
          <Button onClick={handleManageImports}>
            <Settings className="h-4 w-4 mr-2" />
            Gérer les imports
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="recent">Imports récents</TabsTrigger>
          <TabsTrigger value="statistics">Statistiques</TabsTrigger>
          <TabsTrigger value="management">Gestion</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Métriques principales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_imports.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Tous les imports effectués
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {successRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.successful_imports} réussis / {stats.failed_imports} échecs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produits Importés</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.products_imported.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total des produits
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active_users}</div>
                <p className="text-xs text-muted-foreground">
                  Ont importé ce mois
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moyenne/Import</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.total_imports > 0 ? Math.round(stats.products_imported / stats.total_imports) : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Produits par import
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sources populaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sources d'Import Populaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.popular_sources.map((source, index) => {
                  const percentage = stats.total_imports > 0 ? (source.count / stats.total_imports) * 100 : 0;
                  return (
                    <div key={source.source} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="font-medium">{source.source}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{source.count}</div>
                          <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Imports Récents
              </CardTitle>
              <CardDescription>
                Dernières activités d'import des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : recentImports.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucun import récent à afficher.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {recentImports.map((importItem) => (
                    <div key={importItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(importItem.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{importItem.user_name}</span>
                            <Badge variant="outline">{importItem.source_type}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {importItem.products_count} produits • {new Date(importItem.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(importItem.status)}
                        <Button variant="ghost" size="sm">
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance par Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-muted-foreground">
                  Graphiques de performance à venir
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Évolution dans le Temps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-muted-foreground">
                  Graphiques d'évolution à venir
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Import CSV/Excel
                </CardTitle>
                <CardDescription>Gestion des imports de fichiers</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate('/import/csv')}>
                  Gérer les imports CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Import Web/API
                </CardTitle>
                <CardDescription>Gestion des imports en ligne</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate('/import/api')}>
                  Gérer les imports API
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Imports Programmés
                </CardTitle>
                <CardDescription>Automatisation des imports</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate('/import/scheduled')}>
                  Gérer la programmation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  IA Generation
                </CardTitle>
                <CardDescription>Imports assistés par IA</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate('/import/ai-generation')}>
                  Gérer l'IA Import
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Connecteurs
                </CardTitle>
                <CardDescription>Intégrations e-commerce</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate('/sync-manager')}>
                  Gérer les connecteurs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Base de Données
                </CardTitle>
                <CardDescription>Import depuis BDD</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate('/import/database')}>
                  Gérer imports BDD
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminImport;