import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Key, 
  Users, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Building,
  Globe,
  Lock,
  Zap,
  UserCheck,
  Server
} from 'lucide-react'

interface SSOProvider {
  id: string
  name: string
  type: 'saml' | 'oauth' | 'oidc' | 'ldap'
  status: 'active' | 'inactive' | 'pending'
  users: number
  lastSync: string
}

export const EnterpriseSSO = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [providers, setProviders] = useState<SSOProvider[]>([
    {
      id: '1',
      name: 'Microsoft Azure AD',
      type: 'saml',
      status: 'active',
      users: 1247,
      lastSync: '2 minutes ago'
    },
    {
      id: '2',
      name: 'Google Workspace',
      type: 'oauth',
      status: 'active',
      users: 543,
      lastSync: '5 minutes ago'
    },
    {
      id: '3',
      name: 'Okta',
      type: 'oidc',
      status: 'pending',
      users: 0,
      lastSync: 'Never'
    }
  ])

  const [newProvider, setNewProvider] = useState({
    name: '',
    type: 'saml' as const,
    entityId: '',
    ssoUrl: '',
    certificate: '',
    enabled: true
  })

  const ssoFeatures = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Sécurité Renforcée',
      description: 'Authentification centralisée avec MFA',
      status: 'active'
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Gestion des Utilisateurs',
      description: 'Synchronisation automatique des équipes',
      status: 'active'
    },
    {
      icon: <Key className="h-5 w-5" />,
      title: 'Single Sign-On',
      description: 'Une seule connexion pour tous les services',
      status: 'active'
    },
    {
      icon: <Building className="h-5 w-5" />,
      title: 'Intégration Entreprise',
      description: 'Compatible avec Active Directory',
      status: 'active'
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: 'Multi-Domaines',
      description: 'Support de plusieurs domaines d\'entreprise',
      status: 'active'
    },
    {
      icon: <UserCheck className="h-5 w-5" />,
      title: 'Provisioning Automatique',
      description: 'Création/suppression automatique des comptes',
      status: 'coming-soon'
    }
  ]

  const securityLogs = [
    {
      time: '14:32',
      event: 'Connexion SSO réussie',
      user: 'jean.dupont@entreprise.com',
      provider: 'Azure AD',
      status: 'success'
    },
    {
      time: '14:28',
      event: 'Tentative de connexion échouée',
      user: 'marie.martin@entreprise.com',
      provider: 'Google Workspace',
      status: 'failed'
    },
    {
      time: '14:25',
      event: 'Nouveau utilisateur provisionné',
      user: 'alex.bernard@entreprise.com',
      provider: 'Azure AD',
      status: 'info'
    },
    {
      time: '14:20',
      event: 'Synchronisation utilisateurs',
      user: 'Système',
      provider: 'Azure AD',
      status: 'success'
    }
  ]

  const handleAddProvider = () => {
    const provider: SSOProvider = {
      id: Date.now().toString(),
      name: newProvider.name,
      type: newProvider.type,
      status: 'pending',
      users: 0,
      lastSync: 'Never'
    }
    setProviders(prev => [...prev, provider])
    setNewProvider({
      name: '',
      type: 'saml',
      entityId: '',
      ssoUrl: '',
      certificate: '',
      enabled: true
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Enterprise SSO</h2>
          <p className="text-muted-foreground">
            Authentification centralisée pour votre organisation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Sécurisé
          </Badge>
          <Button>Configurer SSO</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="providers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Utilisateurs SSO</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,790</div>
                <p className="text-xs text-muted-foreground">+12% ce mois</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Connexions/jour</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4,321</div>
                <p className="text-xs text-muted-foreground">+8% vs hier</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.2%</div>
                <p className="text-xs text-muted-foreground">Excellent</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fonctionnalités SSO</CardTitle>
                <CardDescription>
                  Capacités d'authentification enterprise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ssoFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{feature.title}</h4>
                          <Badge 
                            variant={feature.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {feature.status === 'active' ? 'Actif' : 'Bientôt'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>
                  Dernières connexions et événements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityLogs.slice(0, 4).map((log, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="text-muted-foreground min-w-12">
                        {log.time}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        log.status === 'success' ? 'bg-green-500' :
                        log.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="font-medium">{log.event}</div>
                        <div className="text-muted-foreground text-xs">
                          {log.user} via {log.provider}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Providers */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fournisseurs Configurés</CardTitle>
                <CardDescription>
                  Gérez vos fournisseurs d'identité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Server className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {provider.type.toUpperCase()}
                            </Badge>
                            <span>{provider.users} utilisateurs</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={provider.status === 'active' ? 'default' : 
                                   provider.status === 'pending' ? 'secondary' : 'destructive'}
                        >
                          {provider.status === 'active' ? 'Actif' :
                           provider.status === 'pending' ? 'En attente' : 'Inactif'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Configurer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nouveau Fournisseur</CardTitle>
                <CardDescription>
                  Ajouter un nouveau fournisseur d'identité
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider-name">Nom du Fournisseur</Label>
                  <Input 
                    id="provider-name"
                    placeholder="Ex: Azure AD Production"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider-type">Type</Label>
                  <select 
                    id="provider-type"
                    className="w-full p-2 border rounded"
                    value={newProvider.type}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <option value="saml">SAML 2.0</option>
                    <option value="oauth">OAuth 2.0</option>
                    <option value="oidc">OpenID Connect</option>
                    <option value="ldap">LDAP</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity-id">Entity ID</Label>
                  <Input 
                    id="entity-id"
                    placeholder="https://sts.windows.net/..."
                    value={newProvider.entityId}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, entityId: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sso-url">SSO URL</Label>
                  <Input 
                    id="sso-url"
                    placeholder="https://login.microsoftonline.com/..."
                    value={newProvider.ssoUrl}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, ssoUrl: e.target.value }))}
                  />
                </div>

                <Button onClick={handleAddProvider} className="w-full">
                  Ajouter Fournisseur
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>
                Utilisateurs authentifiés via SSO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Input placeholder="Rechercher un utilisateur..." className="max-w-sm" />
                  <Button>Synchroniser</Button>
                </div>

                <div className="border rounded-lg">
                  <div className="grid grid-cols-4 gap-4 p-3 border-b bg-muted/50 font-medium">
                    <div>Utilisateur</div>
                    <div>Fournisseur</div>
                    <div>Dernière connexion</div>
                    <div>Statut</div>
                  </div>
                  
                  {[
                    { name: 'Jean Dupont', email: 'jean.dupont@entreprise.com', provider: 'Azure AD', lastLogin: '2h', status: 'active' },
                    { name: 'Marie Martin', email: 'marie.martin@entreprise.com', provider: 'Google', lastLogin: '1j', status: 'active' },
                    { name: 'Alex Bernard', email: 'alex.bernard@entreprise.com', provider: 'Azure AD', lastLogin: '3j', status: 'inactive' },
                    { name: 'Sophie Durand', email: 'sophie.durand@entreprise.com', provider: 'Okta', lastLogin: '1sem', status: 'pending' }
                  ].map((user, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-3 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div>{user.provider}</div>
                      <div className="text-sm">{user.lastLogin}</div>
                      <div>
                        <Badge variant={
                          user.status === 'active' ? 'default' :
                          user.status === 'inactive' ? 'secondary' : 'outline'
                        }>
                          {user.status === 'active' ? 'Actif' :
                           user.status === 'inactive' ? 'Inactif' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Paramètres de Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">MFA Obligatoire</h4>
                    <p className="text-sm text-muted-foreground">
                      Exiger l'authentification à deux facteurs
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Session Timeout</h4>
                    <p className="text-sm text-muted-foreground">
                      Déconnexion automatique après inactivité
                    </p>
                  </div>
                  <Input defaultValue="8 heures" className="w-24" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">IP Restrictions</h4>
                    <p className="text-sm text-muted-foreground">
                      Limiter l'accès par adresse IP
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Audit Logging</h4>
                    <p className="text-sm text-muted-foreground">
                      Enregistrer toutes les connexions
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Journal de Sécurité</CardTitle>
                <CardDescription>
                  Événements de sécurité récents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        log.status === 'success' ? 'bg-green-500' :
                        log.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{log.event}</div>
                          <div className="text-muted-foreground">{log.time}</div>
                        </div>
                        <div className="text-muted-foreground">
                          {log.user} via {log.provider}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Globale</CardTitle>
              <CardDescription>
                Paramètres généraux du SSO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Les modifications de configuration peuvent affecter l'accès de tous les utilisateurs.
                  Testez d'abord en mode développement.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Domaine par Défaut</Label>
                  <Input defaultValue="entreprise.com" />
                </div>
                
                <div className="space-y-2">
                  <Label>Redirect URI</Label>
                  <Input defaultValue="https://app.votre-domaine.com/auth/callback" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Certificat de Signature (optionnel)</Label>
                <Textarea 
                  placeholder="-----BEGIN CERTIFICATE-----
Collez votre certificat PEM ici...
-----END CERTIFICATE-----"
                  className="min-h-32 font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Tester Configuration</Button>
                <Button>Sauvegarder</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}