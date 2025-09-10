import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Key, Webhook, Code, Save, RefreshCw } from 'lucide-react'

export default function ConfigurationPage() {
  const [configs, setConfigs] = useState({
    apiEndpoint: 'https://api.exemple.com/v1',
    apiKey: '',
    refreshRate: '30',
    enableNotifications: true,
    enableAutoSync: false,
    webhookUrl: '',
    customCSS: '',
    environment: 'production'
  })

  const installedExtensions = [
    {
      id: '1',
      name: 'Data Scraper Pro',
      status: 'active',
      version: '2.1.0',
      settings: ['API Configuration', 'Sync Settings', 'Webhooks']
    },
    {
      id: '2',
      name: 'Review Importer',
      status: 'inactive',
      version: '1.5.2',
      settings: ['Platform Config', 'Import Rules', 'Notifications']
    },
    {
      id: '3',
      name: 'Price Monitor',
      status: 'active',
      version: '3.0.1',
      settings: ['Alert Settings', 'Comparison Rules', 'Export Config']
    }
  ]

  const handleSaveConfig = () => {
    // Simulate save
    console.log('Configuration saved:', configs)
  }

  const handleResetConfig = () => {
    setConfigs({
      apiEndpoint: 'https://api.exemple.com/v1',
      apiKey: '',
      refreshRate: '30',
      enableNotifications: true,
      enableAutoSync: false,
      webhookUrl: '',
      customCSS: '',
      environment: 'production'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Configuration des Extensions
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez et configurez vos extensions installées
        </p>
      </div>

      <Tabs defaultValue="extensions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="global">Configuration Globale</TabsTrigger>
          <TabsTrigger value="api">API & Webhooks</TabsTrigger>
          <TabsTrigger value="advanced">Avancé</TabsTrigger>
        </TabsList>

        <TabsContent value="extensions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Extensions Installées
              </CardTitle>
              <CardDescription>
                Configurez individuellement chaque extension
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {installedExtensions.map((extension) => (
                <Card key={extension.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold">{extension.name}</h3>
                          <p className="text-sm text-muted-foreground">Version {extension.version}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={extension.status === 'active' ? 'default' : 'secondary'}>
                          {extension.status}
                        </Badge>
                        <Button variant="outline" size="sm">Configurer</Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {extension.settings.map((setting, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {setting}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Globaux</CardTitle>
              <CardDescription>
                Configuration générale applicable à toutes les extensions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="refresh-rate">Taux de Rafraîchissement (secondes)</Label>
                  <Input
                    id="refresh-rate"
                    type="number"
                    value={configs.refreshRate}
                    onChange={(e) => setConfigs({...configs, refreshRate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environment">Environnement</Label>
                  <Select value={configs.environment} onValueChange={(value) => setConfigs({...configs, environment: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Développement</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-sm text-muted-foreground">Recevoir des notifications push</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={configs.enableNotifications}
                    onCheckedChange={(checked) => setConfigs({...configs, enableNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-sync">Synchronisation Automatique</Label>
                    <p className="text-sm text-muted-foreground">Sync automatique des données</p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={configs.enableAutoSync}
                    onCheckedChange={(checked) => setConfigs({...configs, enableAutoSync: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Configuration API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-endpoint">Point de Terminaison API</Label>
                <Input
                  id="api-endpoint"
                  value={configs.apiEndpoint}
                  onChange={(e) => setConfigs({...configs, apiEndpoint: e.target.value})}
                  placeholder="https://api.exemple.com/v1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">Clé API</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={configs.apiKey}
                  onChange={(e) => setConfigs({...configs, apiKey: e.target.value})}
                  placeholder="Votre clé API sécurisée"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Webhook className="w-5 h-5 mr-2" />
                Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL de Webhook</Label>
                <Input
                  id="webhook-url"
                  value={configs.webhookUrl}
                  onChange={(e) => setConfigs({...configs, webhookUrl: e.target.value})}
                  placeholder="https://votre-serveur.com/webhook"
                />
              </div>
              <Button variant="outline">Tester le Webhook</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Configuration Avancée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="custom-css">CSS Personnalisé</Label>
                <Textarea
                  id="custom-css"
                  value={configs.customCSS}
                  onChange={(e) => setConfigs({...configs, customCSS: e.target.value})}
                  placeholder="/* Votre CSS personnalisé */"
                  className="h-32"
                />
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Variables d'Environnement</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div>NODE_ENV: {configs.environment}</div>
                  <div>API_ENDPOINT: {configs.apiEndpoint}</div>
                  <div>REFRESH_RATE: {configs.refreshRate}s</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleResetConfig}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Réinitialiser
        </Button>
        <Button onClick={handleSaveConfig}>
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder
        </Button>
      </div>
    </div>
  )
}