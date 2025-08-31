import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEnterpriseIntegrationService } from "@/hooks/useEnterpriseIntegrationService"
import { useState } from "react"
import { Settings, Plug, RefreshCw, Shield, Globe, Database } from "lucide-react"

export function EnterpriseIntegrationDashboard() {
  const {
    integrations,
    settings,
    isLoading,
    createIntegration,
    updateSetting,
    syncIntegration,
    isCreatingIntegration,
    isUpdatingSetting,
    isSyncingIntegration
  } = useEnterpriseIntegrationService()

  const [newIntegration, setNewIntegration] = useState({
    providerName: '',
    integrationType: '',
    configuration: {}
  })

  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    category: 'general'
  })

  const handleCreateIntegration = () => {
    if (newIntegration.providerName && newIntegration.integrationType) {
      createIntegration({
        providerName: newIntegration.providerName,
        integrationType: newIntegration.integrationType,
        configuration: newIntegration.configuration
      })
      setNewIntegration({ providerName: '', integrationType: '', configuration: {} })
    }
  }

  const handleUpdateSetting = () => {
    if (newSetting.key && newSetting.value) {
      updateSetting(newSetting)
      setNewSetting({ key: '', value: '', category: 'general' })
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Intégrations Enterprise</h2>
          <p className="text-muted-foreground">
            Gestion des intégrations et paramètres enterprise
          </p>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Intégrations</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="w-5 h-5" />
                Nouvelle Intégration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Fournisseur</Label>
                  <Input
                    id="provider"
                    value={newIntegration.providerName}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, providerName: e.target.value }))}
                    placeholder="Nom du fournisseur"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={newIntegration.integrationType}
                    onValueChange={(value) => setNewIntegration(prev => ({ ...prev, integrationType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type d'intégration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="database">Base de données</SelectItem>
                      <SelectItem value="file_sync">Synchronisation fichiers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleCreateIntegration}
                    disabled={isCreatingIntegration}
                    className="w-full"
                  >
                    {isCreatingIntegration ? "Création..." : "Créer"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations?.map((integration, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {integration.integration_type === 'api' && <Globe className="w-4 h-4" />}
                      {integration.integration_type === 'database' && <Database className="w-4 h-4" />}
                      {integration.integration_type === 'webhook' && <Plug className="w-4 h-4" />}
                      {integration.provider_name}
                    </div>
                    <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                      {integration.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Type: {integration.integration_type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={integration.sync_status === 'connected' ? 'default' : 'destructive'}>
                        {integration.sync_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Dernière sync:</span>
                      <span>
                        {integration.last_sync_at 
                          ? new Date(integration.last_sync_at).toLocaleDateString()
                          : 'Jamais'
                        }
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => syncIntegration(integration.id)}
                      disabled={isSyncingIntegration}
                      className="w-full mt-2"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {isSyncingIntegration ? "Sync..." : "Synchroniser"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Nouveau Paramètre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="setting-key">Clé</Label>
                  <Input
                    id="setting-key"
                    value={newSetting.key}
                    onChange={(e) => setNewSetting(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="Nom du paramètre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setting-value">Valeur</Label>
                  <Input
                    id="setting-value"
                    value={newSetting.value}
                    onChange={(e) => setNewSetting(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Valeur"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setting-category">Catégorie</Label>
                  <Select 
                    value={newSetting.category}
                    onValueChange={(value) => setNewSetting(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Général</SelectItem>
                      <SelectItem value="security">Sécurité</SelectItem>
                      <SelectItem value="integration">Intégration</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleUpdateSetting}
                    disabled={isUpdatingSetting}
                    className="w-full"
                  >
                    {isUpdatingSetting ? "MAJ..." : "Mettre à jour"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings?.map((setting, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm">{setting.setting_key}</CardTitle>
                  <CardDescription>
                    Catégorie: {setting.setting_category}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Valeur:</strong> {JSON.stringify(setting.setting_value)}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Niveau: {setting.access_level}</span>
                      <span>{setting.is_encrypted && <Shield className="w-3 h-3 inline" />}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Paramètres de Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Chiffrement activé</span>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Authentification 2FA</span>
                    <Badge variant="default">Requis</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Audit logs</span>
                    <Badge variant="default">Activé</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accès Récents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Dernière connexion</span>
                    <span>Il y a 2 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dernière modification</span>
                    <span>Il y a 1h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tentatives échouées</span>
                    <span>0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}