// ============= Full file contents =============

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Package,
  Activity,
  BarChart3,
  Shield,
  Play,
  Pause,
  Settings,
  Trash2,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'

export const RealExtensionManager: React.FC = () => {
  const { toast } = useToast()
  const { user } = useUnifiedAuth()
  const queryClient = useQueryClient()

  // Fetch installed extensions (using extension_auth_tokens as proxy for "installed" extensions for now,
  // or a proper installed_extensions table if it existed. For now, we simulate based on auth tokens or similar)
  const { data: installedExtensions = [], isLoading } = useQuery({
    queryKey: ['installed-extensions', user?.id],
    queryFn: async () => {
      if (!user) return []
      // Mocking fetch from a hypothetical table, or using auth tokens to deduce active integrations
      const { data } = await (supabase.from('extension_auth_tokens') as any)
        .select('*')
        .eq('user_id', user.id)
      
      // Transform tokens into "extensions" for UI display
      return (data || []).map((token: any, index: number) => ({
        id: token.id,
        name: `Extension ${index + 1}`,
        short_description: 'Intégration personnalisée',
        category: 'Integration',
        version: '1.0.0',
        status: token.is_active ? 'active' : 'inactive',
        usage_count: token.usage_count || 0,
        installed_at: token.created_at,
        permissions: (token.permissions as any)?.length || 0,
        size_mb: 1.2
      }))
    },
    enabled: !!user
  })

  const { data: runningJobs = [] } = useQuery({
    queryKey: ['extension-jobs', user?.id],
    queryFn: async () => {
      if (!user) return []
      // Fetch active jobs related to extensions
      const { data } = await (supabase.from('jobs') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'processing')
        .limit(5)
      
      return data || []
    },
    refetchInterval: 5000
  })

  const toggleExtension = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await (supabase.from('extension_auth_tokens') as any)
        .update({ is_active: status === 'active' })
        .eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installed-extensions'] })
      toast({ title: "Extension mise à jour", description: "Le statut a été modifié avec succès" })
    }
  })

  const handleToggleExtension = (extensionId: string, currentStatus: string) => {
    toggleExtension.mutate({ id: extensionId, status: currentStatus === 'active' ? 'inactive' : 'active' })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'inactive': return <Pause className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center space-x-2"><Package className="w-5 h-5 text-blue-500" /><div><p className="text-sm text-muted-foreground">Installées</p><p className="text-2xl font-bold">{installedExtensions.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center space-x-2"><Activity className="w-5 h-5 text-green-500" /><div><p className="text-sm text-muted-foreground">Actives</p><p className="text-2xl font-bold">{installedExtensions.filter((e: any) => e.status === 'active').length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center space-x-2"><BarChart3 className="w-5 h-5 text-purple-500" /><div><p className="text-sm text-muted-foreground">Tâches en cours</p><p className="text-2xl font-bold">{runningJobs.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center space-x-2"><Shield className="w-5 h-5 text-orange-500" /><div><p className="text-sm text-muted-foreground">Santé</p><p className="text-2xl font-bold text-green-600">100%</p></div></CardContent></Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Extensions installées</h2>
        {isLoading ? <p>Chargement...</p> : installedExtensions.length === 0 ? <p className="text-muted-foreground">Aucune extension installée.</p> : installedExtensions.map((extension: any) => (
          <Card key={extension.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(extension.status)}
                  <div>
                    <CardTitle className="text-lg">{extension.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{extension.short_description}</p>
                  </div>
                </div>
                <Badge variant="outline">v{extension.version}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground">Catégorie:</span><p className="font-medium">{extension.category}</p></div>
                <div><span className="text-muted-foreground">Utilisations:</span><p className="font-medium">{extension.usage_count}</p></div>
                <div><span className="text-muted-foreground">Installée le:</span><p className="font-medium">{new Date(extension.installed_at).toLocaleDateString()}</p></div>
              </div>
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Button size="sm" variant={extension.status === 'active' ? "default" : "secondary"} onClick={() => handleToggleExtension(extension.id, extension.status)}>
                  {extension.status === 'active' ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {extension.status === 'active' ? 'Désactiver' : 'Activer'}
                </Button>
                <Button size="sm" variant="outline"><Settings className="w-4 h-4 mr-2" />Configurer</Button>
                <Button size="sm" variant="destructive"><Trash2 className="w-4 h-4 mr-2" />Désinstaller</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {runningJobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tâches en cours</h2>
          {runningJobs.map((job: any) => (
            <Card key={job.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3"><span className="font-medium">{job.job_type}</span><Badge>{job.status}</Badge></div>
                <Progress value={((job.processed_items || 0) / (job.total_items || 1)) * 100} className="mb-2" />
                <div className="text-xs text-muted-foreground">Démarré: {new Date(job.started_at).toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default RealExtensionManager