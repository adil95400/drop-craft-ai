import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImportJob, ImportedProductData } from '@/domains/commerce/services/importService'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Package, Clock, AlertCircle } from 'lucide-react'
import { format, subDays, isAfter } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface ImportAnalyticsDashboardProps {
  jobs: ImportJob[]
  products: ImportedProductData[]
}

export const ImportAnalyticsDashboard = ({ jobs, products }: ImportAnalyticsDashboardProps) => {
  // Statistiques globales
  const totalImports = jobs.length
  const successfulImports = jobs.filter(j => j.status === 'completed').length
  const failedImports = jobs.filter(j => j.status === 'failed').length
  const successRate = totalImports > 0 ? Math.round((successfulImports / totalImports) * 100) : 0
  
  const totalProducts = jobs.reduce((sum, j) => sum + (j.total_rows || 0), 0)
  const successProducts = jobs.reduce((sum, j) => sum + (j.success_rows || 0), 0)
  const failedProducts = jobs.reduce((sum, j) => sum + (j.error_rows || 0), 0)

  // Trend des 7 derniers jours
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayJobs = jobs.filter(j => {
      const jobDate = format(new Date(j.created_at), 'yyyy-MM-dd')
      return jobDate === dateStr
    })
    return {
      date: format(date, 'dd MMM', { locale: getDateFnsLocale() }),
      imports: dayJobs.length,
      success: dayJobs.filter(j => j.status === 'completed').length,
      failed: dayJobs.filter(j => j.status === 'failed').length,
      products: dayJobs.reduce((sum, j) => sum + (j.success_rows || 0), 0)
    }
  })

  // Répartition par type de source
  const sourceTypes = jobs.reduce((acc, job) => {
    const type = job.source_type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sourceTypeData = Object.entries(sourceTypes).map(([name, value]) => ({
    name: name === 'file_upload' ? 'Fichier' :
          name === 'url_import' ? 'URL' :
          name === 'xml_import' ? 'XML/RSS' :
          name === 'api_sync' ? 'API' :
          name === 'ftp_import' ? 'FTP' : name,
    value
  }))

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))']

  // Performance moyenne
  const completedJobsWithTiming = jobs.filter(j => j.started_at && j.completed_at)
  const avgImportTime = completedJobsWithTiming.length > 0
    ? completedJobsWithTiming.reduce((sum, j) => {
        const start = new Date(j.started_at!).getTime()
        const end = new Date(j.completed_at!).getTime()
        return sum + (end - start)
      }, 0) / completedJobsWithTiming.length
    : 0

  const avgTimeMinutes = Math.round(avgImportTime / 1000 / 60)

  // Trend comparé à la semaine précédente
  const lastWeekJobs = jobs.filter(j => isAfter(new Date(j.created_at), subDays(new Date(), 7)))
  const previousWeekJobs = jobs.filter(j => {
    const date = new Date(j.created_at)
    return isAfter(date, subDays(new Date(), 14)) && !isAfter(date, subDays(new Date(), 7))
  })
  const weekTrend = lastWeekJobs.length - previousWeekJobs.length
  const weekTrendPercent = previousWeekJobs.length > 0 
    ? Math.round((weekTrend / previousWeekJobs.length) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImports}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {weekTrend >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{weekTrendPercent}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">{weekTrendPercent}%</span>
                </>
              )}
              vs semaine dernière
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {successfulImports} réussis / {failedImports} échoués
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits importés</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {failedProducts} échecs sur {totalProducts} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTimeMinutes}min</div>
            <p className="text-xs text-muted-foreground mt-1">
              Par import
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendance des imports */}
        <Card>
          <CardHeader>
            <CardTitle>Tendance des imports (7 jours)</CardTitle>
            <CardDescription>Nombre d'imports par jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="imports" 
                  stroke="hsl(var(--primary))" 
                  name="Total"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="success" 
                  stroke="hsl(var(--success))" 
                  name="Réussis"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="hsl(var(--destructive))" 
                  name="Échoués"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par source */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type de source</CardTitle>
            <CardDescription>Distribution des méthodes d'import</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {sourceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume de produits par jour */}
        <Card>
          <CardHeader>
            <CardTitle>Volume de produits importés</CardTitle>
            <CardDescription>Produits importés par jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Bar dataKey="products" fill="hsl(var(--primary))" name="Produits" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alertes et recommandations */}
        <Card>
          <CardHeader>
            <CardTitle>Insights & Recommandations</CardTitle>
            <CardDescription>Analyse automatique</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {failedImports > successfulImports && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Taux d'échec élevé</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Plus d'imports échouent que réussissent. Vérifiez la configuration de vos sources.
                  </p>
                </div>
              </div>
            )}
            
            {weekTrend > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Activité en hausse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +{weekTrendPercent}% d'imports cette semaine. Excellente progression!
                  </p>
                </div>
              </div>
            )}

            {!isNaN(avgTimeMinutes) && avgTimeMinutes > 10 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Temps d'import élevé</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Les imports prennent en moyenne {avgTimeMinutes}min. Considérez l'optimisation par lots.
                  </p>
                </div>
              </div>
            )}

            {successRate >= 90 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Excellente performance</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {successRate}% de taux de réussite. Votre configuration est optimale!
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
