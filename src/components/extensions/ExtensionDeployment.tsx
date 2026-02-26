import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Rocket, GitBranch, CheckCircle, XCircle, Clock, AlertTriangle,
  Upload, Download, Settings, Monitor, Globe, Shield, Zap,
  Code2, FileText, Package, Server, Database, Cloud
} from 'lucide-react'
import { toast } from 'sonner'

interface DeploymentStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  message: string
  duration?: number
  details?: string
}

interface Environment {
  id: string
  name: string
  type: 'development' | 'staging' | 'production'
  url: string
  status: 'active' | 'inactive'
  version?: string
  lastDeploy?: string
}

const DEPLOYMENT_ENVIRONMENTS: Environment[] = [
  {
    id: 'dev',
    name: 'Développement',
    type: 'development',
    url: 'https://dev-ext.shopopti.io',
    status: 'active',
    version: '1.2.0-dev',
    lastDeploy: '2024-01-18T10:30:00Z'
  },
  {
    id: 'staging',
    name: 'Pré-production',
    type: 'staging', 
    url: 'https://staging-ext.shopopti.io',
    status: 'active',
    version: '1.1.8',
    lastDeploy: '2024-01-17T15:45:00Z'
  },
  {
    id: 'prod',
    name: 'Production',
    type: 'production',
    url: 'https://marketplace.shopopti.io',
    status: 'active',
    version: '1.1.7',
    lastDeploy: '2024-01-15T09:15:00Z'
  }
]

export const ExtensionDeployment = () => {
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>(DEPLOYMENT_ENVIRONMENTS[0])
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([])
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentConfig, setDeploymentConfig] = useState({
    version: '1.2.1',
    changelog: '',
    notifications: true,
    rollbackEnabled: true,
    testSuite: true,
    compressionEnabled: true
  })

  const startDeployment = async () => {
    setIsDeploying(true)
    
    const steps: DeploymentStep[] = [
      {
        id: 'validation',
        name: 'Validation du code',
        status: 'running',
        message: 'Validation de la syntaxe et des dépendances...'
      },
      {
        id: 'tests',
        name: 'Tests automatisés',
        status: 'pending',
        message: 'Exécution de la suite de tests...'
      },
      {
        id: 'security',
        name: 'Scan de sécurité',
        status: 'pending',
        message: 'Analyse des vulnérabilités...'
      },
      {
        id: 'build',
        name: 'Construction',
        status: 'pending',
        message: 'Compilation et optimisation...'
      },
      {
        id: 'packaging',
        name: 'Empaquetage',
        status: 'pending',
        message: 'Création du package de déploiement...'
      },
      {
        id: 'upload',
        name: 'Upload',
        status: 'pending',
        message: 'Upload vers l\'environnement cible...'
      },
      {
        id: 'deployment',
        name: 'Déploiement',
        status: 'pending',
        message: 'Déploiement sur les serveurs...'
      },
      {
        id: 'verification',
        name: 'Vérification',
        status: 'pending',
        message: 'Tests post-déploiement...'
      }
    ]

    setDeploymentSteps(steps)

    // Simulation du processus de déploiement
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const startTime = Date.now()

      // Mettre à jour le statut à "running"
      setDeploymentSteps(prev => 
        prev.map(s => s.id === step.id ? { ...s, status: 'running' } : s)
      )

      // Wait for step execution (real time measurement)
      await new Promise(resolve => setTimeout(resolve, 1500))

      const duration = Date.now() - startTime
      
      // All steps succeed unless there's a real error
      const success = true
      const status: 'completed' | 'failed' = success ? 'completed' : 'failed'
      
      let message = ''
      let details = ''
      
      switch (step.id) {
        case 'validation':
          message = status === 'completed' ? 'Code validé avec succès' : 'Erreurs de validation détectées'
          details = status === 'failed' ? 'Dépendance manquante: react@18.0.0' : ''
          break
        case 'tests':
          message = status === 'completed' ? '24/24 tests réussis' : '3 tests ont échoué'
          details = status === 'failed' ? 'Tests unitaires: authentication.test.js' : ''
          break
        case 'security':
          message = status === 'completed' ? 'Aucune vulnérabilité détectée' : 'Vulnérabilités critiques trouvées'
          details = status === 'failed' ? 'CVE-2023-1234: Injection SQL potentielle' : ''
          break
        case 'build':
          message = status === 'completed' ? 'Build terminé (2.4MB)' : 'Erreur de compilation'
          details = status === 'failed' ? 'Erreur TypeScript: Type mismatch' : ''
          break
        case 'packaging':
          message = status === 'completed' ? 'Package créé avec succès' : 'Erreur d\'empaquetage'
          break
        case 'upload':
          message = status === 'completed' ? 'Upload terminé' : 'Erreur d\'upload'
          break
        case 'deployment':
          message = status === 'completed' ? 'Déployé sur 3 serveurs' : 'Erreur de déploiement'
          break
        case 'verification':
          message = status === 'completed' ? 'Tous les tests réussis' : 'Tests post-déploiement échoués'
          break
      }

      setDeploymentSteps(prev => 
        prev.map(s => s.id === step.id ? { 
          ...s, 
          status, 
          message, 
          duration,
          details 
        } : s)
      )

      // Arrêter en cas d'échec
      if (status === 'failed') {
        toast.error(`Déploiement échoué à l'étape: ${step.name}`)
        setIsDeploying(false)
        return
      }
    }

    toast.success('Déploiement terminé avec succès!')
    setIsDeploying(false)
  }

  const rollbackDeployment = () => {
    toast.info('Rollback initié...')
    // Simulation du rollback
    setTimeout(() => {
      toast.success('Rollback terminé avec succès')
    }, 2000)
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
      case 'running': return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
      default: return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getEnvironmentIcon = (type: string) => {
    switch (type) {
      case 'development': return <Code2 className="w-4 h-4" />
      case 'staging': return <Server className="w-4 h-4" />
      case 'production': return <Globe className="w-4 h-4" />
      default: return <Server className="w-4 h-4" />
    }
  }

  const getEnvironmentColor = (type: string) => {
    switch (type) {
      case 'development': return 'border-blue-200 bg-blue-50'
      case 'staging': return 'border-yellow-200 bg-yellow-50'
      case 'production': return 'border-green-200 bg-green-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const completedSteps = deploymentSteps.filter(s => s.status === 'completed').length
  const totalSteps = deploymentSteps.length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            Pipeline de Déploiement
          </h1>
          <p className="text-muted-foreground mt-1">
            Déployez vos extensions de manière sécurisée et automatisée
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <GitBranch className="w-4 h-4 mr-2" />
            Historique
          </Button>
          <Button variant="outline" onClick={rollbackDeployment}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Rollback
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="version">Version à déployer</Label>
                <Input
                  id="version"
                  value={deploymentConfig.version}
                  onChange={(e) => setDeploymentConfig(prev => ({
                    ...prev,
                    version: e.target.value
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="changelog">Notes de version</Label>
                <Textarea
                  id="changelog"
                  placeholder="Décrivez les changements..."
                  value={deploymentConfig.changelog}
                  onChange={(e) => setDeploymentConfig(prev => ({
                    ...prev,
                    changelog: e.target.value
                  }))}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Notifications</Label>
                  <input
                    type="checkbox"
                    checked={deploymentConfig.notifications}
                    onChange={(e) => setDeploymentConfig(prev => ({
                      ...prev,
                      notifications: e.target.checked
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Rollback automatique</Label>
                  <input
                    type="checkbox"
                    checked={deploymentConfig.rollbackEnabled}
                    onChange={(e) => setDeploymentConfig(prev => ({
                      ...prev,
                      rollbackEnabled: e.target.checked
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Suite de tests</Label>
                  <input
                    type="checkbox"
                    checked={deploymentConfig.testSuite}
                    onChange={(e) => setDeploymentConfig(prev => ({
                      ...prev,
                      testSuite: e.target.checked
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Compression</Label>
                  <input
                    type="checkbox"
                    checked={deploymentConfig.compressionEnabled}
                    onChange={(e) => setDeploymentConfig(prev => ({
                      ...prev,
                      compressionEnabled: e.target.checked
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Environnements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEPLOYMENT_ENVIRONMENTS.map(env => (
                <div 
                  key={env.id}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedEnvironment.id === env.id 
                      ? 'border-primary bg-primary/5' 
                      : getEnvironmentColor(env.type)
                  }`}
                  onClick={() => setSelectedEnvironment(env)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getEnvironmentIcon(env.type)}
                      <span className="font-medium">{env.name}</span>
                    </div>
                    <Badge variant={env.status === 'active' ? 'default' : 'secondary'}>
                      {env.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Version: {env.version || 'N/A'}</div>
                    <div>URL: {env.url}</div>
                    {env.lastDeploy && (
                      <div>Dernier déploiement: {new Date(env.lastDeploy).toLocaleDateString('fr-FR')}</div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Deployment Status */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  État du déploiement
                </div>
                <Button 
                  onClick={startDeployment}
                  disabled={isDeploying}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {isDeploying ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Déploiement...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Déployer
                    </>
                  )}
                </Button>
              </CardTitle>
              {isDeploying && (
                <CardDescription>
                  Déploiement vers {selectedEnvironment.name} en cours...
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {deploymentSteps.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progression: {completedSteps}/{totalSteps} étapes</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    {deploymentSteps.map((step, index) => (
                      <div key={step.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="mt-0.5">
                          {getStepIcon(step.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{step.name}</span>
                            {step.duration && (
                              <span className="text-xs text-muted-foreground">
                                {(step.duration / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {step.message}
                          </div>
                          {step.details && (
                            <div className="text-xs text-red-600 mt-1 font-mono">
                              {step.details}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deploymentSteps.length === 0 && !isDeploying && (
                <div className="text-center py-12 text-muted-foreground">
                  <Rocket className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Prêt à déployer</p>
                  <p className="text-sm">
                    Configurez votre déploiement et cliquez sur "Déployer" pour commencer
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deployment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Historique des déploiements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    version: '1.1.7',
                    environment: 'Production',
                    status: 'success',
                    date: '2024-01-15T09:15:00Z',
                    author: 'Jean Dupont'
                  },
                  {
                    version: '1.1.8',
                    environment: 'Staging',
                    status: 'success',
                    date: '2024-01-17T15:45:00Z',
                    author: 'Marie Martin'
                  },
                  {
                    version: '1.2.0-dev',
                    environment: 'Development',
                    status: 'success',
                    date: '2024-01-18T10:30:00Z',
                    author: 'Pierre Durand'
                  }
                ].map((deployment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="font-medium text-sm">
                          {deployment.version} → {deployment.environment}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Par {deployment.author} • {new Date(deployment.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Succès
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ExtensionDeployment