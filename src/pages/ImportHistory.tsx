import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useProductImports } from '@/hooks/useProductImports';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ImportHistory() {
  const { imports, loading, fetchImports } = useProductImports();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'failed': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'processing': return 'En cours';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      default: return status;
    }
  };

  const getImportTypeText = (type: string) => {
    switch (type) {
      case 'url': return 'URL';
      case 'csv': return 'CSV';
      case 'xml': return 'XML';
      case 'api': return 'API';
      case 'ftp': return 'FTP';
      case 'image': return 'Image';
      default: return type;
    }
  };

  const filteredImports = imports.filter(imp => {
    const matchesSearch = imp.source_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         imp.source_url?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || imp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: imports.length,
    completed: imports.filter(i => i.status === 'completed').length,
    processing: imports.filter(i => i.status === 'processing').length,
    failed: imports.filter(i => i.status === 'failed').length,
    totalProducts: imports.reduce((sum, i) => sum + i.products_imported, 0)
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Historique des Imports</h1>
          <p className="text-muted-foreground">
            Suivez l'état de tous vos imports de produits
          </p>
        </div>
        <Button onClick={() => fetchImports()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Imports</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terminés</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Échoués</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits Importés</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des imports */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement de l'historique...</p>
        </div>
      ) : filteredImports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun import trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucun import ne correspond à vos critères de recherche.'
                : 'Vous n\'avez pas encore effectué d\'import de produits.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredImports.map((imp) => (
            <Card key={imp.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getStatusColor(imp.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(imp.status)}
                          {getStatusText(imp.status)}
                        </div>
                      </Badge>
                      <Badge variant="outline">
                        {getImportTypeText(imp.import_type)}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-lg mb-1">
                      {imp.source_name || 'Import sans nom'}
                    </h3>
                    
                    {imp.source_url && (
                      <p className="text-sm text-muted-foreground mb-2 truncate">
                        {imp.source_url}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        Créé le {format(new Date(imp.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </span>
                      {imp.completed_at && (
                        <span>
                          Terminé le {format(new Date(imp.completed_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </span>
                      )}
                    </div>

                    {imp.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <strong>Erreur:</strong> {imp.error_message}
                      </div>
                    )}
                  </div>

                  <div className="lg:text-right">
                    <div className="grid grid-cols-3 lg:block gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold">{imp.total_products}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Succès</p>
                        <p className="font-semibold text-green-600">{imp.products_imported}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Échecs</p>
                        <p className="font-semibold text-red-600">{imp.products_failed}</p>
                      </div>
                    </div>

                    {imp.status === 'completed' && imp.total_products > 0 && (
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Rapport
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Barre de progression */}
                {imp.status === 'processing' && imp.total_products > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progression</span>
                      <span>{Math.round(((imp.products_imported + imp.products_failed) / imp.total_products) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${((imp.products_imported + imp.products_failed) / imp.total_products) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}