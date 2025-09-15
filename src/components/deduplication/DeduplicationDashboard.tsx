import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Target, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Zap,
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { deduplicationService } from '@/services/DeduplicationService'
import { logError } from '@/utils/consoleCleanup'

interface DeduplicationResult {
  id: string
  total_products: number
  duplicates_found: number
  unique_products: number
  merged_products: number
  deduplication_rate: number
  execution_time_ms: number
  algorithm_used: string
  created_at: string
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))']

export function DeduplicationDashboard() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentJob, setCurrentJob] = useState<any>(null)

  // Fetch deduplication results from AI optimization jobs
  const { data: results = [], isLoading, refetch } = useQuery({
    queryKey: ['deduplication-results'],
    queryFn: async (): Promise<DeduplicationResult[]> => {
      // For now, return empty array - deduplication results will be stored in ai_optimization_jobs
      // when the real deduplication service is implemented
      return []
    }
  })

  // Mock data for demo when no real results exist
  const mockResults: DeduplicationResult[] = results.length === 0 ? [
    {
      id: '1',
      total_products: 1250,
      duplicates_found: 89,
      unique_products: 1161,
      merged_products: 89,
      deduplication_rate: 7.12,
      execution_time_ms: 3450,
      algorithm_used: 'fuzzy_matching',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    },
    {
      id: '2',
      total_products: 980,
      duplicates_found: 45,
      unique_products: 935,
      merged_products: 45,
      deduplication_rate: 4.59,
      execution_time_ms: 2100,
      algorithm_used: 'sku_matching',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: '3',
      total_products: 1520,
      duplicates_found: 156,
      unique_products: 1364,
      merged_products: 156,
      deduplication_rate: 10.26,
      execution_time_ms: 4200,
      algorithm_used: 'title_similarity',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    }
  ] : results

  // Performance chart data
  const chartData = mockResults.slice(0, 6).reverse().map((result, index) => ({
    name: `Job ${index + 1}`,
    duplicates: result.duplicates_found,
    rate: result.deduplication_rate,
    time: result.execution_time_ms / 1000 // Convert to seconds
  }))

  // Algorithm distribution
  const algorithmData = mockResults.reduce((acc, result) => {
    const existing = acc.find(item => item.name === result.algorithm_used)
    if (existing) {
      existing.value += 1
    } else {
      acc.push({
        name: result.algorithm_used,
        value: 1,
        color: COLORS[acc.length % COLORS.length]
      })
    }
    return acc
  }, [] as { name: string; value: number; color: string }[])

  // Calculate stats
  const totalProcessed = mockResults.reduce((sum, r) => sum + r.total_products, 0)
  const totalDuplicates = mockResults.reduce((sum, r) => sum + r.duplicates_found, 0)
  const avgDeduplicationRate = mockResults.length > 0 
    ? mockResults.reduce((sum, r) => sum + r.deduplication_rate, 0) / mockResults.length 
    : 0
  const avgExecutionTime = mockResults.length > 0
    ? mockResults.reduce((sum, r) => sum + r.execution_time_ms, 0) / mockResults.length / 1000
    : 0

  const runDeduplication = async () => {
    setIsRunning(true)
    try {
      // Simulate deduplication process
      setCurrentJob({ status: 'running', progress: 0 })
      
      // Simulate progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setCurrentJob({ status: 'running', progress: i })
      }

      // Mock result - in real implementation, this would call the deduplication service
      const mockResult = {
        total_products: Math.floor(Math.random() * 1000) + 500,
        duplicates_found: Math.floor(Math.random() * 100) + 20,
        unique_products: 0,
        merged_products: 0,
        deduplication_rate: 0,
        execution_time_ms: Math.floor(Math.random() * 5000) + 1000,
        algorithm_used: 'fuzzy_matching'
      }
      
      mockResult.merged_products = mockResult.duplicates_found
      mockResult.unique_products = mockResult.total_products - mockResult.duplicates_found
      mockResult.deduplication_rate = (mockResult.duplicates_found / mockResult.total_products) * 100

      // Insert mock result into AI optimization jobs
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      await supabase.from('ai_optimization_jobs').insert([{
        job_type: 'deduplication',
        input_data: { total_products: mockResult.total_products },
        output_data: mockResult,
        status: 'completed',
        progress: 100,
        user_id: user.id
      }])
      
      setCurrentJob({ status: 'completed', progress: 100 })
      refetch()
      
      setTimeout(() => {
        setCurrentJob(null)
        setIsRunning(false)
      }, 2000)
    } catch (error) {
      logError(error as Error, 'Deduplication process')
      setCurrentJob({ status: 'failed', progress: 0 })
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Déduplication Avancée</h2>
          <p className="text-muted-foreground">
            Détection et fusion intelligente des produits en double
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button 
            onClick={runDeduplication} 
            disabled={isRunning}
            size="sm" 
            className="gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isRunning ? 'En cours...' : 'Lancer Déduplication'}
          </Button>
        </div>
      </div>

      {/* Current Job Status */}
      {currentJob && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {currentJob.status === 'running' && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
                {currentJob.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {currentJob.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                <span className="font-medium">
                  {currentJob.status === 'running' && 'Déduplication en cours...'}
                  {currentJob.status === 'completed' && 'Déduplication terminée !'}
                  {currentJob.status === 'failed' && 'Échec de la déduplication'}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{currentJob.progress}%</span>
            </div>
            <Progress value={currentJob.progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Produits Traités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProcessed.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">
              {mockResults.length} jobs exécutés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              Doublons Détectés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalDuplicates}</div>
            <p className="text-sm text-muted-foreground">
              {avgDeduplicationRate.toFixed(1)}% taux moyen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Efficacité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{avgDeduplicationRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">
              Taux de déduplication
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{avgExecutionTime.toFixed(1)}s</div>
            <p className="text-sm text-muted-foreground">
              Temps moyen d'exécution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance de Déduplication
            </CardTitle>
            <CardDescription>
              Évolution du taux de doublons détectés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="duplicates" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Doublons détectés"
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Taux (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Algorithm Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Répartition des Algorithmes
            </CardTitle>
            <CardDescription>
              Utilisation des différents algorithmes de détection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={algorithmData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {algorithmData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {algorithmData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="capitalize">{item.name.replace('_', ' ')}</span>
                  </div>
                  <span className="font-medium">{item.value} jobs</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle>Résultats Récents</CardTitle>
          <CardDescription>
            Historique des dernières exécutions de déduplication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockResults.map((result) => (
              <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">
                        {result.duplicates_found} doublons détectés
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {result.total_products} produits analysés • 
                        Algorithme: {result.algorithm_used.replace('_', ' ')} • 
                        Temps: {(result.execution_time_ms / 1000).toFixed(1)}s
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-primary border-primary">
                    {result.deduplication_rate.toFixed(1)}%
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(result.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {mockResults.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun résultat de déduplication</p>
              <p className="text-sm">Lancez votre première déduplication pour voir les résultats</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}