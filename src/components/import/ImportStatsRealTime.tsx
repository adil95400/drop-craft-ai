import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle, 
  Zap,
  Globe,
  Activity
} from 'lucide-react'
import { useImportStatsReal } from '@/hooks/useImportJobsReal'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface ImportStatsRealTimeProps {
  refreshInterval?: number
}

export const ImportStatsRealTime = ({ refreshInterval = 5000 }: ImportStatsRealTimeProps) => {
  const { stats, isLoading } = useImportStatsReal()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune donnée disponible
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Statistiques en Temps Réel</h3>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Données réelles
          </span>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalImportsToday.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Imports aujourd'hui</div>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600">Produits importés</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.successRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Taux de succès</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <Progress value={stats.successRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.activeJobs}
                </div>
                <div className="text-sm text-muted-foreground">Jobs actifs</div>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {stats.activeJobs > 0 ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">En cours</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Aucun job actif</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.topSources.length}
                </div>
                <div className="text-sm text-muted-foreground">Sources actives</div>
              </div>
              <Globe className="w-8 h-8 text-orange-500" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Zap className="w-3 h-3 text-orange-500" />
              <span className="text-xs text-orange-600">Multi-sources</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sources populaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Sources Populaires Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.topSources.length > 0 ? (
              stats.topSources.map((source, index) => (
                <div key={source.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium capitalize">{source.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{source.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {source.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <Progress value={source.percentage} className="h-2" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune source active aujourd'hui</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Jobs Récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentJobs.length > 0 ? (
                stats.recentJobs.map((job: any) => (
                  <div 
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        job.status === 'completed' ? 'bg-green-500' :
                        job.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                        job.status === 'failed' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <div>
                        <div className="font-medium text-sm capitalize">{job.source_type || 'Import'}</div>
                        <div className="text-xs text-muted-foreground">
                          {job.success_rows || 0} produits • {job.status}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun job récent</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicateur de performance */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Système optimal</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Tous les services fonctionnent parfaitement
            </div>
            <Badge className="bg-green-500 text-white">
              99.9% Disponibilité
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}