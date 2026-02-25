import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BarChart3, TrendingUp, Clock, CheckCircle, AlertTriangle, Activity, Zap, Target, Database
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export const ImportPerformanceMonitor = () => {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['import-performance', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [jobsRes, importedRes] = await Promise.all([
        supabase.from('jobs').select('id, status, job_type, created_at, started_at, completed_at, total_items, processed_items, failed_items').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(500),
        supabase.from('imported_products').select('id, status, category, created_at').eq('user_id', user!.id).limit(1000),
      ])

      const jobs = jobsRes.data || []
      const imported = importedRes.data || []

      const totalImports = imported.length
      const successCount = imported.filter(i => i.status === 'validated' || i.status === 'promoted').length
      const failedCount = imported.filter(i => i.status === 'rejected' || i.status === 'error').length
      const successRate = totalImports > 0 ? (successCount / totalImports) * 100 : 0
      const errorRate = totalImports > 0 ? (failedCount / totalImports) * 100 : 0

      // Avg processing time from jobs
      const completedJobs = jobs.filter(j => j.started_at && j.completed_at)
      const avgTime = completedJobs.length > 0
        ? completedJobs.reduce((s, j) => s + (new Date(j.completed_at!).getTime() - new Date(j.started_at!).getTime()), 0) / completedJobs.length / 1000
        : 0

      // Category distribution
      const catMap: Record<string, number> = {}
      imported.forEach(i => {
        const cat = (i as any).category || 'Non classé'
        catMap[cat] = (catMap[cat] || 0) + 1
      })
      const categoryData = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value], i) => ({
          name, value: Math.round((value / (totalImports || 1)) * 100),
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
        }))

      // Error analysis from failed items
      const errorMap: Record<string, number> = {}
      imported.filter(i => i.status === 'rejected' || i.status === 'error').forEach(() => {
        errorMap['Validation échouée'] = (errorMap['Validation échouée'] || 0) + 1
      })
      const totalErrors = Object.values(errorMap).reduce((a, b) => a + b, 0) || 1
      const errorTypes = Object.entries(errorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type, count, percentage: Math.round((count / totalErrors) * 100) }))

      // Trend data by date (last 6 periods)
      const trendMap: Record<string, { imports: number; errors: number }> = {}
      imported.forEach(i => {
        const date = new Date(i.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        if (!trendMap[date]) trendMap[date] = { imports: 0, errors: 0 }
        trendMap[date].imports++
        if (i.status === 'rejected' || i.status === 'error') trendMap[date].errors++
      })
      const trendData = Object.entries(trendMap).slice(-6).map(([time, v]) => ({ time, ...v }))

      return {
        totalImports, successRate, errorRate, avgProcessingTime: avgTime,
        throughput: completedJobs.length > 0 ? Math.round(totalImports / Math.max(completedJobs.length, 1)) : 0,
        dataQuality: successRate,
        categoryData, errorTypes, trendData
      }
    }
  })

  const getMetricColor = (value: number) => value >= 90 ? 'text-green-600' : value >= 70 ? 'text-orange-600' : 'text-red-600'

  if (isLoading) {
    return <div className="space-y-6">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6" />Monitoring Performance</h2>
        <p className="text-muted-foreground">Métriques de vos imports et traitement des données</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Imports Totaux</p>
              <p className="text-2xl font-bold">{(data?.totalImports || 0).toLocaleString()}</p>
            </div>
            <Database className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taux de Succès</p>
              <p className={`text-2xl font-bold ${getMetricColor(data?.successRate || 0)}`}>{(data?.successRate || 0).toFixed(1)}%</p>
              <Progress value={data?.successRate || 0} className="h-2 mt-1" />
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Temps Moyen</p>
              <p className="text-2xl font-bold">{(data?.avgProcessingTime || 0).toFixed(1)}s</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Items/Job</p>
              <p className="text-2xl font-bold">{data?.throughput || 0}</p>
            </div>
            <Zap className="w-8 h-8 text-purple-500" />
          </div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />Tendances Import</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.trendData?.length || 0) > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data!.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="imports" stroke="#3b82f6" strokeWidth={2} name="Imports" />
                  <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} name="Erreurs" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Aucune donnée d'import</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" />Répartition par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.categoryData?.length || 0) > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data!.categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                    {data!.categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Aucune catégorie</p>
            )}
          </CardContent>
        </Card>
      </div>

      {(data?.errorTypes?.length || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" />Analyse des Erreurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data!.errorTypes.map((error, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="font-medium">{error.type}</p>
                      <p className="text-sm text-muted-foreground">{error.count} occurrences</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={error.percentage} className="w-20 h-2" />
                    <span className="text-sm font-medium">{error.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
