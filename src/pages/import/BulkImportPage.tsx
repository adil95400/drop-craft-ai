/**
 * Page dédiée Import en Masse
 * Style Channable complet avec BulkImportUltraPro amélioré
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Database, Layers, Sparkles, TrendingUp, 
  CheckCircle, AlertCircle, Clock, RefreshCw,
  Package, Zap
} from 'lucide-react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { BulkZipImport } from '@/components/import/BulkZipImport'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { cn } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { importJobsApi } from '@/services/api/client'

// Hook pour préférences réduites
const useReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface ImportJob {
  id: string
  job_type: string
  status: string
  total_products: number
  successful_imports: number
  failed_imports: number
  created_at: string
  source_platform: string
}

export default function BulkImportPage() {
  const navigate = useNavigate()
  const { user } = useUnifiedAuth()
  const prefersReducedMotion = useReducedMotion()
  const queryClient = useQueryClient()

  const { data: jobs = [], isLoading, refetch: loadJobs } = useQuery({
    queryKey: ['bulk-import-jobs', user?.id],
    queryFn: async (): Promise<ImportJob[]> => {
      if (!user?.id) return []
      try {
        const resp = await importJobsApi.list({ per_page: 10 })
        return (resp.items || []).map((job: any) => ({
          id: job.job_id || job.id,
          job_type: job.job_type || 'bulk',
          status: job.status,
          total_products: job.progress?.total ?? 0,
          successful_imports: job.progress?.success ?? 0,
          failed_imports: job.progress?.failed ?? 0,
          created_at: job.created_at,
          source_platform: job.name || job.job_type || 'Import en masse',
        }))
      } catch {
        // API V1 unavailable — no fallback needed, just return empty
        return []
      }
    },
    enabled: !!user?.id,
    refetchInterval: (query) => {
      const data = query.state.data || []
      return data.some(j => j.status === 'processing' || j.status === 'pending') ? 3000 : false
    },
  })

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
      completed: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Terminé' },
      processing: { icon: RefreshCw, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'En cours' },
      failed: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Échoué' },
      pending: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'En attente' },
      partial: { icon: AlertCircle, color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'Partiel' },
    }
    return configs[status] || configs.pending
  }

  const stats = {
    total: jobs.length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    totalProducts: jobs.reduce((sum, j) => sum + (j.successful_imports || 0), 0),
  }

  const heroStats = [
    { label: 'Imports', value: stats.total.toString(), icon: Database },
    { label: 'En cours', value: stats.processing.toString(), icon: RefreshCw },
    { label: 'Produits importés', value: stats.totalProducts.toString(), icon: Package },
  ]

  return (
    <ChannablePageWrapper
      title="Import en Masse"
      description="Collez jusqu'à 500 URLs de produits et importez-les tous en une seule opération. Notre IA optimise automatiquement chaque fiche."
      heroImage="import"
      badge={{ label: 'Ultra Pro', icon: Sparkles }}
      actions={
        <Button variant="outline" onClick={() => navigate('/import/history')}>
          <Clock className="w-4 h-4 mr-2" />
          Historique
        </Button>
      }
    >

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Imports totaux', value: stats.total, icon: Database, color: 'text-primary' },
          { label: 'En cours', value: stats.processing, icon: RefreshCw, color: 'text-blue-500' },
          { label: 'Terminés', value: stats.completed, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Produits', value: stats.totalProducts, icon: Package, color: 'text-purple-500' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={cn("w-8 h-8 opacity-50", stat.color)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Import Component */}
      <BulkZipImport />

      {/* Recent Jobs */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Imports récents
            </CardTitle>
            <CardDescription>Vos 10 derniers imports en masse</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadJobs()} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">Aucun import en masse pour le moment</p>
              <p className="text-sm text-muted-foreground">
                Collez vos URLs ci-dessus pour commencer
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job, idx) => {
                const config = getStatusConfig(job.status)
                const progress = job.total_products > 0 
                  ? Math.round(((job.successful_imports + job.failed_imports) / job.total_products) * 100) 
                  : 0

                return (
                  <motion.div 
                    key={job.id}
                    initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md",
                      "border-border/50 bg-card/30"
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn("p-2 rounded-lg", config.bgColor)}>
                        <config.icon className={cn(
                          "w-5 h-5",
                          config.color,
                          job.status === 'processing' && 'animate-spin'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {job.source_platform || 'Import en masse'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {job.successful_imports} réussis
                          </span>
                          {job.failed_imports > 0 && (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-red-500" />
                              {job.failed_imports} erreurs
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn("text-xs", config.bgColor, config.color)}>
                        {job.status === 'processing' ? `${progress}%` : config.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  )
}
