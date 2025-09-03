import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  RefreshCw,
  TrendingUp,
  Database,
  Zap
} from 'lucide-react'
import { useImport } from '@/domains/commerce/hooks/useImport'
import { useAutoSync } from '@/hooks/useAutoSync'
import { SyncStatusIndicator } from '../sync/SyncStatusIndicator'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export const RealTimeImportMonitor = () => {
  const { jobs, products, isLoading, refetch } = useImport()
  const { manualSync, isSyncing, lastSyncTime } = useAutoSync()
  const [stats, setStats] = useState({
    totalImports: 0,
    successfulImports: 0,
    failedImports: 0,
    processingImports: 0,
    totalProducts: 0,
    approvedProducts: 0
  })

  // Calcul des statistiques en temps réel
  useEffect(() => {
    const totalImports = jobs.length
    const successfulImports = jobs.filter(job => job.status === 'completed').length
    const failedImports = jobs.filter(job => job.status === 'failed').length
    const processingImports = jobs.filter(job => job.status === 'processing').length
    const totalProducts = products.length
    const approvedProducts = products.filter(p => p.status === 'approved').length

    setStats({
      totalImports,
      successfulImports,
      failedImports,
      processingImports,
      totalProducts,
      approvedProducts
    })
  }, [jobs, products])

  const getSuccessRate = () => {
    if (stats.totalImports === 0) return 0
    return Math.round((stats.successfulImports / stats.totalImports) * 100)
  }

  const getApprovalRate = () => {
    if (stats.totalProducts === 0) return 0
    return Math.round((stats.approvedProducts / stats.totalProducts) * 100)
  }

  const handleQuickSync = () => {
    manualSync(['imports', 'products'])
  }

  return (
    <div className="space-y-6">
      {/* Header avec synchronisation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoring Temps Réel</h2>
          <p className="text-gray-600">
            Surveillez vos imports et synchronisations en direct
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleQuickSync}
            disabled={isSyncing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Rapide
          </Button>
        </div>
      </div>

      {/* Indicateur de synchronisation */}
      <SyncStatusIndicator />

      {/* Métriques en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Imports Totaux</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalImports}</p>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Taux de Succès</p>
                <p className="text-2xl font-bold text-green-900">{getSuccessRate()}%</p>
              </div>
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <Progress value={getSuccessRate()} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Produits</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalProducts}</p>
              </div>
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Taux Approbation</p>
                <p className="text-2xl font-bold text-orange-900">{getApprovalRate()}%</p>
              </div>
              <div className="p-2 bg-orange-500 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <Progress value={getApprovalRate()} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Imports Récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun import récent
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job, index) => (
                  <div key={job.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded-full ${
                        job.status === 'completed' ? 'bg-green-500' :
                        job.status === 'failed' ? 'bg-red-500' :
                        job.status === 'processing' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}>
                        {job.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-white" />}
                        {job.status === 'failed' && <AlertCircle className="w-4 h-4 text-white" />}
                        {job.status === 'processing' && <RefreshCw className="w-4 h-4 text-white animate-spin" />}
                        {job.status === 'pending' && <Clock className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{job.source_url || job.source_type || 'Import'}</p>
                        <p className="text-xs text-gray-500">
                          {job.created_at ? formatDistanceToNow(new Date(job.created_at), { 
                            locale: fr, 
                            addSuffix: true 
                          }) : 'Il y a un moment'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'failed' ? 'destructive' :
                      job.status === 'processing' ? 'secondary' :
                      'outline'
                    }>
                      {job.status === 'completed' && 'Terminé'}
                      {job.status === 'failed' && 'Échec'}
                      {job.status === 'processing' && 'En cours'}
                      {job.status === 'pending' && 'En attente'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Statistiques de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Imports Réussis</span>
                  <span className="text-sm text-green-600">{stats.successfulImports}</span>
                </div>
                <Progress value={getSuccessRate()} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Imports en Cours</span>
                  <span className="text-sm text-blue-600">{stats.processingImports}</span>
                </div>
                <Progress 
                  value={stats.totalImports > 0 ? (stats.processingImports / stats.totalImports) * 100 : 0} 
                  className="h-2" 
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Produits Approuvés</span>
                  <span className="text-sm text-purple-600">{stats.approvedProducts}</span>
                </div>
                <Progress value={getApprovalRate()} className="h-2" />
              </div>

              <div className="pt-4 border-t">
                <div className="text-xs text-gray-500">
                  Dernière synchronisation: {' '}
                  {lastSyncTime ? 
                    formatDistanceToNow(lastSyncTime, { locale: fr, addSuffix: true }) : 
                    'Jamais'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}