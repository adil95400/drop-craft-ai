import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProductImports } from '@/hooks/useProductImports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Download, 
  FileSpreadsheet, 
  Globe, 
  Database, 
  Cloud, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  XCircle,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

export const ImportDashboard = () => {
  const { imports, importedProducts, loading } = useProductImports();
  const navigate = useNavigate();

  // Statistiques calculées
  const stats = {
    totalImports: imports.length,
    completedImports: imports.filter(i => i.status === 'completed').length,
    processingImports: imports.filter(i => i.status === 'processing').length,
    failedImports: imports.filter(i => i.status === 'failed').length,
    totalProducts: importedProducts.length,
    publishedProducts: importedProducts.filter(p => p.status === 'published').length,
    draftProducts: importedProducts.filter(p => p.status === 'draft').length,
    optimizedProducts: importedProducts.filter(p => p.ai_optimized).length
  };

  // Données pour les graphiques
  const importsByType = [
    { name: 'CSV', value: imports.filter(i => i.import_type === 'csv').length, color: '#8884d8' },
    { name: 'URL', value: imports.filter(i => i.import_type === 'url').length, color: '#82ca9d' },
    { name: 'API', value: imports.filter(i => i.import_type === 'api').length, color: '#ffc658' },
    { name: 'XML', value: imports.filter(i => i.import_type === 'xml').length, color: '#ff7300' },
  ];

  // Calculate success rate from real import_jobs data
  const calculateSuccessRateData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayImports = imports.filter(imp => {
        const importDate = new Date(imp.created_at);
        return importDate.toDateString() === date.toDateString();
      });

      const totalProducts = dayImports.reduce((sum, imp) => sum + (imp.products_imported || 0), 0);
      const failedProducts = dayImports.reduce((sum, imp) => sum + (imp.products_failed || 0), 0);
      const successProducts = totalProducts - failedProducts;

      return {
        name: dayName,
        success: totalProducts > 0 ? Math.round((successProducts / totalProducts) * 100) : 0,
        failed: totalProducts > 0 ? Math.round((failedProducts / totalProducts) * 100) : 0,
      };
    });
  };

  const successRateData = calculateSuccessRateData();

  return (
    <div className="space-y-6">
      {/* En-tête avec actions rapides */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Tableau de Bord Imports</h2>
          <p className="text-muted-foreground">Vue d'ensemble de tous vos imports et produits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/products/import/manage/history')}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Historique
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/products/import/manage/products')}>
            <Database className="w-4 h-4 mr-2" />
            Produits
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Imports</p>
                <p className="text-2xl font-bold">{stats.totalImports}</p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits Importés</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Database className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Publiés</p>
                <p className="text-2xl font-bold">{stats.publishedProducts}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">IA Optimisés</p>
                <p className="text-2xl font-bold">{stats.optimizedProducts}</p>
              </div>
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Imports en cours */}
      {stats.processingImports > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Imports en Cours ({stats.processingImports})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {imports.filter(i => i.status === 'processing').map((importJob, index) => (
                <div key={importJob.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <div>
                      <p className="font-medium">{importJob.source_name || 'Import sans nom'}</p>
                      <p className="text-sm text-muted-foreground">
                        {importJob.products_imported}/{importJob.total_products} produits traités
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Progress 
                      value={importJob.total_products > 0 ? 
                        (importJob.products_imported / importJob.total_products) * 100 : 0} 
                      className="w-32 mb-1"
                    />
                    <p className="text-xs text-muted-foreground">
                      {importJob.total_products > 0 ? 
                        Math.round((importJob.products_imported / importJob.total_products) * 100) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Imports par Type</CardTitle>
            <CardDescription>Répartition des méthodes d'import utilisées</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={importsByType}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}`}
                >
                  {importsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taux de Succès (7 derniers jours)</CardTitle>
            <CardDescription>Performance des imports quotidiens</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="success" stackId="a" fill="#22c55e" />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Imports récents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Imports Récents</CardTitle>
            <CardDescription>Dernières activités d'import</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/products/import/manage/history')}
          >
            Voir tout
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {imports.slice(0, 5).map((importJob) => {
              const getStatusIcon = (status: string) => {
                switch (status) {
                  case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
                  case 'processing': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
                  case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
                  case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
                  default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
                }
              };

              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'completed': return 'bg-green-500/10 text-green-700 border-green-500/20';
                  case 'processing': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
                  case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
                  case 'failed': return 'bg-red-500/10 text-red-700 border-red-500/20';
                  default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
                }
              };

              return (
                <div key={importJob.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(importJob.status)}
                    <div>
                      <p className="font-medium">{importJob.source_name || importJob.source_url || 'Import'}</p>
                      <p className="text-sm text-muted-foreground">
                        {importJob.import_type?.toUpperCase() || 'IMPORT'} • {importJob.products_imported} produits importés
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(importJob.status)}>
                      {importJob.status}
                    </Badge>
                    <div className="text-right text-sm">
                      <p className="font-medium">{importJob.products_imported}/{importJob.total_products}</p>
                      <p className="text-muted-foreground">
                        {importJob.products_failed > 0 && `${importJob.products_failed} échecs`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>Commencez un nouvel import ou gérez vos données</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => navigate('/products/import/advanced')}
              className="h-20 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <Globe className="w-6 h-6" />
              Import URL
            </Button>

            <Button
              onClick={() => navigate('/products/import/quick')}
              className="h-20 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <FileSpreadsheet className="w-6 h-6" />
              Import CSV
            </Button>

            <Button
              onClick={() => navigate('/products/import/advanced')}
              className="h-20 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <Database className="w-6 h-6" />
              Flux XML
            </Button>

            <Button
              onClick={() => navigate('/products/import/advanced')}
              className="h-20 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <Cloud className="w-6 h-6" />
              Import FTP
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};