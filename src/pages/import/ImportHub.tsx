import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package, Upload, Settings, FileText, TrendingUp, Zap,
  FileSpreadsheet, Link as LinkIcon, Database, BarChart3,
  Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { useRealImportMethods } from '@/hooks/useRealImportMethods'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ImportHub() {
  const { importMethods, stats, isLoading } = useRealImportMethods()

  // Derniers imports récents
  const recentImports = importMethods.slice(0, 5)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing': return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <AlertCircle className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé'
      case 'processing': return 'En cours'
      case 'failed': return 'Échoué'
      default: return 'En attente'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Hub d'Import</h1>
        <p className="text-muted-foreground">
          Centre de contrôle pour tous vos imports de produits
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Imports</p>
                <p className="text-2xl font-bold">{stats.totalMethods}</p>
              </div>
              <Database className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Imports Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeMethods}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Attente</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pendingJobs}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Succès</p>
                <p className="text-2xl font-bold text-green-600">{stats.successfulJobs}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3 grandes cartes de navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Carte Import par URL - NOUVEAU */}
        <Link to="/import/config" data-testid="supplier-card">
          <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <LinkIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Import par URL
                    <Badge variant="secondary" className="text-xs">NOUVEAU</Badge>
                  </CardTitle>
                </div>
              </div>
              <CardDescription>
                Importez des produits depuis AliExpress, Amazon, Temu en 1 clic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Extraction automatique</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Pré-visualisation avant import</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Support multi-plateformes</span>
                </div>
              </div>
              <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                <LinkIcon className="w-4 h-4 mr-2" />
                Essayer maintenant
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Carte Import Shopify Store - NOUVEAU */}
        <Link to="/import/shopify">
          <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Import Shopify
                    <Badge variant="secondary" className="text-xs">NOUVEAU</Badge>
                  </CardTitle>
                </div>
              </div>
              <CardDescription>
                Importez produits et variantes depuis n'importe quelle boutique Shopify
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Produits & variantes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Catégories & tags</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Images & descriptions</span>
                </div>
              </div>
              <Button className="w-full mt-4 bg-green-600 hover:bg-green-600/90">
                <Package className="w-4 h-4 mr-2" />
                Importer maintenant
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Carte Import Rapide */}
        <Link to="/import/quick">
          <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Import Rapide</CardTitle>
              </div>
              <CardDescription>
                Import simple et rapide en quelques clics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                  <span>CSV & Excel</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span>JSON & XML</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span>Drag & Drop</span>
                </div>
              </div>
              <Button className="w-full mt-4">
                Démarrer un import
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Carte Import Avancé */}
        <Link to="/import/advanced">
          <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Import Avancé</CardTitle>
              </div>
              <CardDescription>
                Mapping intelligent et optimisation IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span>Mapping de champs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span>Import en masse</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span>Optimisation IA</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Configuration avancée
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Carte Gestion */}
        <Link to="/import/publishing">
          <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Gestion & Publication</CardTitle>
              </div>
              <CardDescription>
                Gérez et publiez vos produits importés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span>Produits importés</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  <span>Publication</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span>Historique détaillé</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Voir les produits
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Derniers imports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Derniers Imports</CardTitle>
            <Link to="/import/history">
              <Button variant="ghost" size="sm">
                Voir tout
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : recentImports.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-muted-foreground">Aucun import récent</p>
              <p className="text-sm text-muted-foreground mt-1">
                Commencez par créer votre premier import
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentImports.map((imp) => (
                <div
                  key={imp.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(imp.status)}
                    <div>
                      <p className="font-medium">
                        {imp.source_type || 'Import sans nom'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(imp.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{imp.success_rows || 0} produits</p>
                      <p className="text-xs text-muted-foreground">{getStatusText(imp.status)}</p>
                    </div>
                    <Badge variant={imp.status === 'completed' ? 'default' : 'secondary'}>
                      {imp.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
