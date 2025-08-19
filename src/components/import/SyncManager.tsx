import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { RefreshCw, Clock, AlertCircle, CheckCircle, Play, Pause, Settings } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface SyncJob {
  id: string
  name: string
  supplier: string
  status: 'active' | 'paused' | 'error' | 'syncing'
  lastSync: string
  nextSync: string
  frequency: string
  productsCount: number
  updatedCount: number
  errorCount: number
  progress?: number
}

interface SyncManagerProps {
  onSyncCompleted: (jobId: string, results: any) => void
}

export function SyncManager({ onSyncCompleted }: SyncManagerProps) {
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)

  useEffect(() => {
    loadSyncJobs()
  }, [])

  const loadSyncJobs = async () => {
    // Demo data for development
    const demoJobs: SyncJob[] = [
      {
        id: 'job_1',
        name: 'Sync BigBuy Products',
        supplier: 'BigBuy',
        status: 'active',
        lastSync: new Date(Date.now() - 3600000).toISOString(),
        nextSync: new Date(Date.now() + 3600000).toISOString(),
        frequency: 'hourly',
        productsCount: 2547,
        updatedCount: 45,
        errorCount: 2
      },
      {
        id: 'job_2',
        name: 'Sync AliExpress Trending',
        supplier: 'AliExpress',
        status: 'paused',
        lastSync: new Date(Date.now() - 86400000).toISOString(),
        nextSync: new Date(Date.now() + 86400000).toISOString(),
        frequency: 'daily',
        productsCount: 1256,
        updatedCount: 123,
        errorCount: 0
      }
    ]
    setSyncJobs(demoJobs)
    setIsLoading(false)
  }

  const toggleRealTimeSync = async (enabled: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('toggle-realtime-sync', {
        body: { enabled }
      })

      if (error) throw error

      setRealTimeEnabled(enabled)
      
      toast({
        title: enabled ? "Sync temps réel activée" : "Sync temps réel désactivée",
        description: enabled 
          ? "Les prix et stocks seront mis à jour automatiquement" 
          : "Synchronisation manuelle uniquement"
      })

    } catch (error) {
      toast({
        title: "Erreur de configuration",
        description: "Impossible de modifier la synchronisation temps réel",
        variant: "destructive"
      })
    }
  }

  const startManualSync = async (jobId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('start-manual-sync', {
        body: { jobId }
      })

      if (error) throw error

      // Update job status
      setSyncJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'syncing', progress: 0 }
          : job
      ))

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncJobs(prev => prev.map(job => {
          if (job.id === jobId && job.status === 'syncing') {
            const newProgress = Math.min((job.progress || 0) + 10, 100)
            if (newProgress >= 100) {
              clearInterval(progressInterval)
              onSyncCompleted(jobId, data.results)
              return { ...job, status: 'active', progress: undefined, lastSync: new Date().toISOString() }
            }
            return { ...job, progress: newProgress }
          }
          return job
        }))
      }, 500)

      toast({
        title: "Synchronisation démarrée",
        description: "La mise à jour des produits est en cours"
      })

    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de démarrer la synchronisation",
        variant: "destructive"
      })
    }
  }

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    
    setSyncJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: newStatus as any } : job
    ))

    toast({
      title: newStatus === 'active' ? "Job activé" : "Job suspendu",
      description: `La synchronisation a été ${newStatus === 'active' ? 'reprise' : 'mise en pause'}`
    })
  }

  const updateFrequency = async (jobId: string, frequency: string) => {
    setSyncJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, frequency } : job
    ))

    toast({
      title: "Fréquence mise à jour",
      description: "La nouvelle fréquence de synchronisation a été sauvegardée"
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'syncing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'paused': return 'secondary'
      case 'error': return 'destructive'
      case 'syncing': return 'default'
      default: return 'outline'
    }
  }

  if (isLoading) {
    return <div>Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* Real-time Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Synchronisation temps réel
          </CardTitle>
          <CardDescription>
            Activez la mise à jour automatique des prix et stocks en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="realtime-sync"
              checked={realTimeEnabled}
              onCheckedChange={toggleRealTimeSync}
            />
            <Label htmlFor="realtime-sync">
              Synchronisation automatique des prix et stocks
            </Label>
          </div>
          {realTimeEnabled && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ Sync temps réel activée - Les produits seront mis à jour automatiquement
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Tâches de synchronisation ({syncJobs.length})</CardTitle>
          <CardDescription>
            Gérez vos synchronisations automatiques avec les fournisseurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncJobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <h4 className="font-medium">{job.name}</h4>
                      <p className="text-sm text-muted-foreground">{job.supplier}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleJobStatus(job.id, job.status)}
                      disabled={job.status === 'syncing'}
                    >
                      {job.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => startManualSync(job.id)}
                      disabled={job.status === 'syncing'}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {job.status === 'syncing' && job.progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Synchronisation en cours...</span>
                      <span>{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Produits</p>
                    <p className="font-medium">{job.productsCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mis à jour</p>
                    <p className="font-medium text-green-600">{job.updatedCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Erreurs</p>
                    <p className="font-medium text-red-600">{job.errorCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dernière sync</p>
                    <p className="font-medium">{new Date(job.lastSync).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <Label htmlFor={`freq-${job.id}`} className="text-sm">Fréquence:</Label>
                  </div>
                  <Select 
                    value={job.frequency} 
                    onValueChange={(value) => updateFrequency(job.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="manual">Manuelle uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            {syncJobs.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucune tâche de synchronisation</h3>
                <p className="text-muted-foreground">
                  Configurez des intégrations pour synchroniser automatiquement vos produits
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}