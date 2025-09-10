import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, Upload, Download, Play, Pause, GitBranch, Globe, Package, Settings } from 'lucide-react'

export default function DeploymentPage() {
  const [deploymentProgress, setDeploymentProgress] = useState(0)
  const [isDeploying, setIsDeploying] = useState(false)
  const [selectedEnvironment, setSelectedEnvironment] = useState('staging')

  const environments = [
    {
      name: 'Development',
      id: 'development',
      status: 'active',
      version: '2.1.0-dev.15',
      url: 'https://dev-ext.example.com',
      lastDeploy: '2024-01-15 16:45:12',
      branch: 'develop'
    },
    {
      name: 'Staging',
      id: 'staging',
      status: 'active',
      version: '2.0.8',
      url: 'https://staging-ext.example.com',
      lastDeploy: '2024-01-15 14:32:15',
      branch: 'main'
    },
    {
      name: 'Production',
      id: 'production',
      status: 'active',
      version: '2.0.7',
      url: 'https://marketplace.chrome.google.com/detail/...',
      lastDeploy: '2024-01-14 09:20:45',
      branch: 'main'
    }
  ]

  const deploymentHistory = [
    {
      id: '1',
      version: '2.1.0-dev.15',
      environment: 'development',
      status: 'success',
      deployedBy: 'Jean Dupont',
      duration: '2m 34s',
      timestamp: '2024-01-15 16:45:12',
      commit: 'a1b2c3d',
      message: 'Fix: Résolution problème scraping Amazon'
    },
    {
      id: '2',
      version: '2.0.8',
      environment: 'staging',
      status: 'success',
      deployedBy: 'Marie Martin',
      duration: '3m 12s',
      timestamp: '2024-01-15 14:32:15',
      commit: 'e4f5g6h',
      message: 'Feature: Nouvelle interface de configuration'
    },
    {
      id: '3',
      version: '2.0.7',
      environment: 'production',
      status: 'success',
      deployedBy: 'Pierre Durant',
      duration: '15m 45s',
      timestamp: '2024-01-14 09:20:45',
      commit: 'i7j8k9l',
      message: 'Release: Version stable avec correctifs de sécurité'
    },
    {
      id: '4',
      version: '2.0.6',
      environment: 'production',
      status: 'failed',
      deployedBy: 'Sophie Laurent',
      duration: '8m 23s',
      timestamp: '2024-01-13 15:18:32',
      commit: 'm1n2o3p',
      message: 'Rollback: Problème de compatibilité détecté'
    }
  ]

  const buildSteps = [
    { name: 'Préparation', status: 'completed', duration: '15s' },
    { name: 'Tests automatisés', status: 'completed', duration: '45s' },
    { name: 'Build & Packaging', status: 'running', duration: '1m 20s' },
    { name: 'Validation', status: 'pending', duration: '-' },
    { name: 'Déploiement', status: 'pending', duration: '-' }
  ]

  const chromeStoreConfig = {
    appId: 'abcdefghijklmnop',
    status: 'published',
    version: '2.0.7',
    users: 12540,
    rating: 4.8,
    reviews: 342,
    lastUpdate: '2024-01-14',
    privacyCompliance: true,
    permissions: [
      'activeTab',
      'storage',
      'webRequest',
      'webRequestBlocking'
    ]
  }

  const rollbackOptions = [
    { version: '2.0.7', timestamp: '2024-01-14 09:20:45', stable: true },
    { version: '2.0.6', timestamp: '2024-01-12 14:15:30', stable: true },
    { version: '2.0.5', timestamp: '2024-01-10 11:42:18', stable: false }
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default' as const,
      failed: 'destructive' as const,
      running: 'secondary' as const,
      pending: 'outline' as const,
      active: 'default' as const,
      completed: 'default' as const
    }
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted" />
    }
  }

  const handleDeploy = () => {
    setIsDeploying(true)
    setDeploymentProgress(0)
    
    const interval = setInterval(() => {
      setDeploymentProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsDeploying(false)
          return 100
        }
        return prev + 8
      })
    }, 300)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Déploiement d'Extensions
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez le déploiement et la distribution de vos extensions
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {environments.map((env) => (
                <SelectItem key={env.id} value={env.id}>{env.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleDeploy} disabled={isDeploying}>
            {isDeploying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isDeploying ? 'Déploiement...' : 'Déployer'}
          </Button>
        </div>
      </div>

      {isDeploying && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="font-semibold">Déploiement en cours sur {selectedEnvironment}</span>
              </div>
              
              <div className="space-y-3">
                {buildSteps.map((step, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(step.status)}
                      <span className={step.status === 'running' ? 'font-semibold' : ''}>{step.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{step.duration}</span>
                  </div>
                ))}
              </div>
              
              <Progress value={deploymentProgress} />
              <p className="text-sm text-muted-foreground">{deploymentProgress}% terminé</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {environments.map((env) => (
          <Card key={env.id} className={selectedEnvironment === env.id ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>{env.name}</span>
                </CardTitle>
                {getStatusBadge(env.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Version actuelle</p>
                <p className="font-semibold">{env.version}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Branche</p>
                <div className="flex items-center space-x-1">
                  <GitBranch className="w-3 h-3" />
                  <span className="text-sm font-mono">{env.branch}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Dernier déploiement</p>
                <p className="text-sm">{env.lastDeploy}</p>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-1" />
                  Logs
                </Button>
                {env.id !== 'production' && (
                  <Button size="sm" className="flex-1">
                    <Upload className="w-4 h-4 mr-1" />
                    Deploy
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="chrome-store">Chrome Store</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="rollback">Rollback</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Déploiements</CardTitle>
              <CardDescription>
                Consultez l'historique complet de vos déploiements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deploymentHistory.map((deployment) => (
                  <Card key={deployment.id} className="border-l-4 border-l-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getStatusIcon(deployment.status)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{deployment.version}</h3>
                              <Badge variant="outline">{deployment.environment}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{deployment.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>Par {deployment.deployedBy}</span>
                              <span>Durée: {deployment.duration}</span>
                              <span>Commit: {deployment.commit}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{deployment.timestamp}</p>
                          <div className="flex space-x-1 mt-2">
                            <Button variant="outline" size="sm">Détails</Button>
                            {deployment.status === 'success' && deployment.environment === 'production' && (
                              <Button variant="outline" size="sm">Rollback</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chrome-store" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Chrome Web Store</CardTitle>
              <CardDescription>
                Gérez la publication sur le Chrome Web Store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Informations de l'Extension</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="app-id">ID de l'application</Label>
                      <Input id="app-id" value={chromeStoreConfig.appId} disabled />
                    </div>
                    <div>
                      <Label htmlFor="version">Version publiée</Label>
                      <Input id="version" value={chromeStoreConfig.version} disabled />
                    </div>
                    <div>
                      <Label htmlFor="status">Statut</Label>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">{chromeStoreConfig.status}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Dernière mise à jour: {chromeStoreConfig.lastUpdate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Statistiques</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{chromeStoreConfig.users.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">Utilisateurs</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{chromeStoreConfig.rating}/5</div>
                        <p className="text-sm text-muted-foreground">{chromeStoreConfig.reviews} avis</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Permissions requises</h4>
                <div className="flex flex-wrap gap-2">
                  {chromeStoreConfig.permissions.map((permission, index) => (
                    <Badge key={index} variant="outline">{permission}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch checked={chromeStoreConfig.privacyCompliance} />
                <Label>Conformité à la politique de confidentialité</Label>
              </div>

              <Button>
                <Package className="w-4 h-4 mr-2" />
                Publier une nouvelle version
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration de Déploiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="build-command">Commande de build</Label>
                    <Input id="build-command" placeholder="npm run build" />
                  </div>
                  <div>
                    <Label htmlFor="test-command">Commande de test</Label>
                    <Input id="test-command" placeholder="npm test" />
                  </div>
                  <div>
                    <Label htmlFor="output-dir">Dossier de sortie</Label>
                    <Input id="output-dir" placeholder="dist/" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Tests automatiques avant déploiement</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Minification des assets</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Déploiement automatique (CI/CD)</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="env-vars">Variables d'environnement</Label>
                <Textarea 
                  id="env-vars" 
                  placeholder="API_ENDPOINT=https://api.example.com&#10;DEBUG=false"
                  rows={4}
                />
              </div>

              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Sauvegarder la configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rollback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rollback vers une Version Antérieure</CardTitle>
              <CardDescription>
                Revenez rapidement à une version stable en cas de problème
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rollbackOptions.map((version, index) => (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">Version {version.version}</h3>
                            {version.stable && (
                              <Badge variant="default">Stable</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Déployée le {version.timestamp}
                          </p>
                        </div>
                        <Button variant="outline" disabled={!version.stable}>
                          Rollback
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}