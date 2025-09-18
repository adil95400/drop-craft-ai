import React, { useState } from 'react'
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

// Mock data for demonstration
const mockInstalledExtensions = [
  {
    id: '1',
    name: 'Smart Inventory Manager',
    short_description: 'Predictive inventory management',
    category: 'Analytics',
    developer_name: 'DataFlow Solutions',
    version: '1.8.2',
    status: 'active',
    usage_count: 45,
    installed_at: '2024-01-15',
    permissions: ['Inventory access', 'Order data'],
    size_mb: 3.5
  }
]

const mockJobs = [
  {
    id: '1',
    type: 'sync',
    status: 'running',
    progress: 65,
    started_at: new Date().toISOString()
  }
]

export const RealExtensionManager: React.FC = () => {
  const { toast } = useToast()

  const handleToggleExtension = (extensionId: string, currentStatus: string) => {
    toast({
      title: "Extension mise à jour",
      description: "Le statut de l'extension a été modifié"
    })
  }

  const handleRunExtension = (extension: any) => {
    toast({
      title: "Tâche démarrée",
      description: "La tâche d'extension a été démarrée"
    })
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
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Extensions installées</p>
                <p className="text-2xl font-bold">{mockInstalledExtensions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Extensions actives</p>
                <p className="text-2xl font-bold">
                  {mockInstalledExtensions.filter(ext => ext.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tâches en cours</p>
                <p className="text-2xl font-bold">{mockJobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Santé système</p>
                <p className="text-2xl font-bold text-green-600">100%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Extensions installées */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Extensions installées</h2>
        
        {mockInstalledExtensions.map((extension) => (
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
                <div>
                  <span className="text-muted-foreground">Catégorie:</span>
                  <p className="font-medium">{extension.category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Développeur:</span>
                  <p className="font-medium">{extension.developer_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Utilisations:</span>
                  <p className="font-medium">{extension.usage_count}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Taille:</span>
                  <p className="font-medium">{extension.size_mb} MB</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant={extension.status === 'active' ? "default" : "secondary"}
                  onClick={() => handleToggleExtension(extension.id, extension.status)}
                >
                  {extension.status === 'active' ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {extension.status === 'active' ? 'Désactiver' : 'Activer'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRunExtension(extension)}
                  disabled={extension.status !== 'active'}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Exécuter
                </Button>

                <Button size="sm" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurer
                </Button>

                <Button size="sm" variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Désinstaller
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tâches en cours */}
      {mockJobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tâches en cours</h2>
          {mockJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{job.type}</span>
                  <Badge>{job.status}</Badge>
                </div>
                <Progress value={job.progress} className="mb-2" />
                <div className="text-xs text-muted-foreground">
                  Démarré: {new Date(job.started_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default RealExtensionManager