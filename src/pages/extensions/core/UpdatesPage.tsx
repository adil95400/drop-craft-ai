import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, RefreshCw, Clock, CheckCircle, AlertCircle, Settings, Bell } from 'lucide-react'

export default function UpdatesPage() {
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [updateProgress, setUpdateProgress] = useState<{[key: string]: number}>({})

  const availableUpdates = [
    {
      id: '1',
      name: 'Data Scraper Pro',
      currentVersion: '2.1.0',
      newVersion: '2.2.0',
      size: '1.2 MB',
      priority: 'high',
      releaseNotes: 'Amélioration des performances et correction de bugs critiques',
      changelog: ['Performance boost 40%', 'Fix memory leaks', 'New data sources support']
    },
    {
      id: '2',
      name: 'Review Importer',
      currentVersion: '1.5.2',
      newVersion: '1.6.0',
      size: '850 KB',
      priority: 'medium',
      releaseNotes: 'Nouvelles plateformes supportées et interface améliorée',
      changelog: ['TikTok reviews support', 'Improved UI/UX', 'Better error handling']
    }
  ]

  const updateHistory = [
    {
      name: 'Price Monitor',
      version: '3.0.1',
      date: '2024-01-15',
      status: 'success',
      notes: 'Mise à jour automatique réussie'
    },
    {
      name: 'SEO Optimizer',
      version: '2.5.3',
      date: '2024-01-10',
      status: 'success',
      notes: 'Nouvelle fonctionnalité d\'analyse de mots-clés'
    },
    {
      name: 'Data Scraper Pro',
      version: '2.1.0',
      date: '2024-01-05',
      status: 'failed',
      notes: 'Échec dû à un conflit de dépendances'
    }
  ]

  const handleUpdate = (extensionId: string) => {
    setUpdateProgress(prev => ({ ...prev, [extensionId]: 0 }))
    
    const interval = setInterval(() => {
      setUpdateProgress(prev => {
        const current = prev[extensionId] || 0
        if (current >= 100) {
          clearInterval(interval)
          return { ...prev, [extensionId]: 100 }
        }
        return { ...prev, [extensionId]: current + 20 }
      })
    }, 500)
  }

  const handleUpdateAll = () => {
    availableUpdates.forEach(update => {
      handleUpdate(update.id)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Gestion des Mises à Jour
        </h1>
        <p className="text-muted-foreground mt-2">
          Maintenez vos extensions à jour avec les dernières fonctionnalités
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Paramètres de Mise à Jour
            </span>
            <Badge variant="outline">{availableUpdates.length} mises à jour disponibles</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-update">Mises à jour automatiques</Label>
              <p className="text-sm text-muted-foreground">Installer automatiquement les mises à jour de sécurité</p>
            </div>
            <Switch
              id="auto-update"
              checked={autoUpdate}
              onCheckedChange={setAutoUpdate}
            />
          </div>
          
          {availableUpdates.length > 0 && (
            <Button onClick={handleUpdateAll} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Tout Mettre à Jour ({availableUpdates.length})
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Disponibles</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableUpdates.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tout est à jour !</h3>
                <p className="text-muted-foreground">Toutes vos extensions sont à la dernière version.</p>
              </CardContent>
            </Card>
          ) : (
            availableUpdates.map((update) => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        {update.name}
                        <Badge 
                          variant={update.priority === 'high' ? 'destructive' : 'secondary'}
                          className="ml-2"
                        >
                          {update.priority === 'high' ? 'Priorité haute' : 'Priorité normale'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {update.currentVersion} → {update.newVersion} ({update.size})
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => handleUpdate(update.id)}
                      disabled={!!updateProgress[update.id]}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {updateProgress[update.id] ? 'Mise à jour...' : 'Mettre à jour'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{update.releaseNotes}</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Nouveautés :</h4>
                    <ul className="text-sm space-y-1">
                      {update.changelog.map((change, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {updateProgress[update.id] !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Installation en cours...</span>
                        <span>{updateProgress[update.id]}%</span>
                      </div>
                      <Progress value={updateProgress[update.id]} />
                      {updateProgress[update.id] === 100 && (
                        <p className="text-green-600 text-sm flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mise à jour terminée avec succès !
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Historique des Mises à Jour
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {updateHistory.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {item.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{item.name} v{item.version}</div>
                      <div className="text-sm text-muted-foreground">{item.notes}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.date}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Préférences de Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications push</Label>
                    <p className="text-sm text-muted-foreground">Recevoir des notifications pour les nouvelles mises à jour</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mises à jour de sécurité automatiques</Label>
                    <p className="text-sm text-muted-foreground">Installer automatiquement les correctifs de sécurité critiques</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Vérification quotidienne</Label>
                    <p className="text-sm text-muted-foreground">Rechercher les mises à jour chaque jour</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}