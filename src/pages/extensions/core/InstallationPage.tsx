import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, CheckCircle, Download, FileText, HelpCircle, Monitor, Settings } from 'lucide-react'

export default function InstallationPage() {
  const [installProgress, setInstallProgress] = useState(0)
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'completed' | 'error'>('idle')

  const handleBulkInstall = () => {
    setInstallStatus('installing')
    setInstallProgress(0)
    
    const interval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setInstallStatus('completed')
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const requirements = [
    { name: 'Chrome Browser', version: '90+', status: 'satisfied' },
    { name: 'Node.js', version: '18+', status: 'satisfied' },
    { name: 'Memory', version: '4GB RAM', status: 'satisfied' },
    { name: 'Disk Space', version: '500MB', status: 'warning' }
  ]

  const installationSteps = [
    {
      title: 'Télécharger l\'extension',
      description: 'Téléchargez le fichier .zip depuis notre serveur',
      icon: Download,
      completed: true
    },
    {
      title: 'Extraire les fichiers',
      description: 'Dézippez le contenu dans un dossier dédié',
      icon: FileText,
      completed: true
    },
    {
      title: 'Ouvrir Chrome Extensions',
      description: 'Allez dans chrome://extensions/',
      icon: Monitor,
      completed: false
    },
    {
      title: 'Mode Développeur',
      description: 'Activez le mode développeur',
      icon: Settings,
      completed: false
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Installation d'Extensions
        </h1>
        <p className="text-muted-foreground mt-2">
          Guide complet pour installer et configurer vos extensions
        </p>
      </div>

      <Tabs defaultValue="requirements" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requirements">Prérequis</TabsTrigger>
          <TabsTrigger value="manual">Manuel</TabsTrigger>
          <TabsTrigger value="bulk">Installation Bulk</TabsTrigger>
          <TabsTrigger value="troubleshooting">Dépannage</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vérification des Prérequis Système</CardTitle>
              <CardDescription>
                Assurez-vous que votre système répond aux exigences minimales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {requirements.map((req, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{req.name}</div>
                    <div className="text-sm text-muted-foreground">{req.version}</div>
                  </div>
                  <Badge variant={req.status === 'satisfied' ? 'default' : 'secondary'}>
                    {req.status === 'satisfied' ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Satisfait</>
                    ) : (
                      <><AlertTriangle className="w-3 h-3 mr-1" /> Attention</>
                    )}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Installation Manuelle Étape par Étape</CardTitle>
              <CardDescription>
                Suivez ces étapes pour installer une extension manuellement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {installationSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full ${step.completed ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{index + 1}. {step.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{step.description}</p>
                      {step.completed && (
                        <Badge className="mt-2" variant="outline">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Terminé
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Installation en Lot</CardTitle>
              <CardDescription>
                Installez plusieurs extensions simultanément
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Pack Productivity</h3>
                    <p className="text-sm text-muted-foreground mb-4">5 extensions essentielles</p>
                    <Button className="w-full" variant="outline">Sélectionner</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Pack E-commerce</h3>
                    <p className="text-sm text-muted-foreground mb-4">8 extensions commerce</p>
                    <Button className="w-full" variant="outline">Sélectionner</Button>
                  </CardContent>
                </Card>
              </div>
              
              {installStatus !== 'idle' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Installation en cours...</span>
                    <span>{installProgress}%</span>
                  </div>
                  <Progress value={installProgress} />
                  {installStatus === 'completed' && (
                    <p className="text-green-600 text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Installation terminée avec succès !
                    </p>
                  )}
                </div>
              )}
              
              <Button onClick={handleBulkInstall} disabled={installStatus === 'installing'} className="w-full">
                {installStatus === 'installing' ? 'Installation...' : 'Démarrer l\'Installation'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="w-5 h-5 mr-2" />
                Résolution de Problèmes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold">Extension ne se charge pas</h4>
                  <p className="text-sm mt-1">Vérifiez que le mode développeur est activé et rechargez l'extension.</p>
                </div>
                <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold">Erreur de permissions</h4>
                  <p className="text-sm mt-1">Accordez les permissions nécessaires dans le manifest.json.</p>
                </div>
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold">Problème de compatibilité</h4>
                  <p className="text-sm mt-1">Vérifiez la version de Chrome et les dépendances requises.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}