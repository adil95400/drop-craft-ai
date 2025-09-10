import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Key, 
  Users,
  Settings,
  Globe,
  CheckCircle,
  AlertCircle,
  Copy,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  Zap,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { toast } from 'sonner'

const ssoProviders = [
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    type: 'oauth',
    logo: '/logos/google.svg',
    status: 'active',
    users: 1250,
    lastSync: '2024-01-16T10:30:00Z',
    description: 'Authentification avec Google Workspace pour votre organisation'
  },
  {
    id: 'microsoft-azure',
    name: 'Microsoft Azure AD',
    type: 'saml',
    logo: '/logos/microsoft.svg',
    status: 'active',
    users: 890,
    lastSync: '2024-01-16T09:15:00Z',
    description: 'Intégration SAML avec Azure Active Directory'
  },
  {
    id: 'okta-enterprise',
    name: 'Okta',
    type: 'saml',
    logo: '/logos/okta.svg',
    status: 'inactive',
    users: 0,
    lastSync: null,
    description: 'Solution SSO Okta pour entreprises'
  },
  {
    id: 'auth0-custom',
    name: 'Auth0',
    type: 'oidc',
    logo: '/logos/auth0.svg',
    status: 'pending',
    users: 0,
    lastSync: null,
    description: 'Plateforme d\'authentification Auth0'
  }
]

const securityPolicies = [
  {
    id: 'password-policy',
    name: 'Politique de Mots de Passe',
    description: 'Règles de complexité et expiration des mots de passe',
    enabled: true,
    settings: {
      minLength: 12,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: true,
      expireDays: 90
    }
  },
  {
    id: 'mfa-policy',
    name: 'Authentification Multi-Facteurs',
    description: 'Obligation de 2FA pour tous les utilisateurs',
    enabled: true,
    settings: {
      required: true,
      methods: ['totp', 'sms', 'hardware']
    }
  },
  {
    id: 'session-policy',
    name: 'Gestion des Sessions',
    description: 'Contrôle de la durée et sécurité des sessions',
    enabled: true,
    settings: {
      maxDuration: 8,
      idleTimeout: 2,
      concurrentSessions: 3
    }
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'inactive': return 'bg-gray-100 text-gray-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'error': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return <CheckCircle className="w-4 h-4" />
    case 'inactive': return <AlertCircle className="w-4 h-4" />
    case 'pending': return <RefreshCw className="w-4 h-4" />
    case 'error': return <AlertCircle className="w-4 h-4" />
    default: return <AlertCircle className="w-4 h-4" />
  }
}

export default function ExtensionSSO() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copié dans le presse-papiers')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-background">
      <Helmet>
        <title>SSO & Sécurité - Drop Craft AI</title>
        <meta name="description" content="Configurez l'authentification unique (SSO) et les politiques de sécurité pour votre marketplace d'extensions." />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                <Shield className="w-8 h-8 text-white" />
              </div>
              SSO & Sécurité
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez l'authentification unique et les politiques de sécurité
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Fournisseur SSO
            </Button>
          </div>
        </div>

        {/* Security Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">2,140</div>
              <div className="text-sm text-muted-foreground">Utilisateurs SSO</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">98.5%</div>
              <div className="text-sm text-muted-foreground">Taux de sécurité</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Key className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">4</div>
              <div className="text-sm text-muted-foreground">Fournisseurs SSO</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">24h</div>
              <div className="text-sm text-muted-foreground">Dernière sync</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="providers">Fournisseurs SSO</TabsTrigger>
            <TabsTrigger value="policies">Politiques</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="audit">Audit & Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Fournisseurs d'Authentification</h2>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un Fournisseur
              </Button>
            </div>

            <div className="grid gap-4">
              {ssoProviders.map(provider => (
                <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-muted flex items-center justify-center">
                          <Globe className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{provider.name}</h3>
                            <Badge className={getStatusColor(provider.status)}>
                              {getStatusIcon(provider.status)}
                              <span className="ml-1 capitalize">{provider.status}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{provider.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Type: {provider.type.toUpperCase()}</span>
                            <span>•</span>
                            <span>{provider.users.toLocaleString()} utilisateurs</span>
                            {provider.lastSync && (
                              <>
                                <span>•</span>
                                <span>Sync: {new Date(provider.lastSync).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={provider.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {provider.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* SSO Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Configuration SSO Globale
                </CardTitle>
                <CardDescription>
                  Paramètres généraux pour l'authentification unique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium">URL de Callback</label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input 
                        value="https://your-marketplace.com/auth/callback" 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard('https://your-marketplace.com/auth/callback')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Clé API SSO</label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input 
                        type={showApiKey ? 'text' : 'password'}
                        value="sk_live_51234567890abcdef..." 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <h4 className="font-medium">Authentification Forcée</h4>
                    <p className="text-sm text-muted-foreground">
                      Obliger les utilisateurs à utiliser SSO uniquement
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Provisioning Automatique</h4>
                    <p className="text-sm text-muted-foreground">
                      Créer automatiquement les comptes utilisateurs
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Politiques de Sécurité</h2>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exporter Politiques
              </Button>
            </div>

            <div className="grid gap-6">
              {securityPolicies.map(policy => (
                <Card key={policy.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${policy.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Shield className={`w-5 h-5 ${policy.enabled ? 'text-green-600' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{policy.name}</h3>
                          <p className="text-sm text-muted-foreground">{policy.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch checked={policy.enabled} />
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {policy.enabled && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2">Configuration Actuelle:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {Object.entries(policy.settings).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                              </span>
                              <span className="ml-1 font-medium">
                                {typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Compliance */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Conformité et Certifications</h3>
                    <p className="text-blue-700 mb-4">
                      Votre configuration respecte les standards de sécurité internationaux
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-100 text-blue-800">SOC 2 Type II</Badge>
                      <Badge className="bg-blue-100 text-blue-800">ISO 27001</Badge>
                      <Badge className="bg-blue-100 text-blue-800">RGPD</Badge>
                      <Badge className="bg-blue-100 text-blue-800">CCPA</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestion des Utilisateurs SSO</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Importer
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Input placeholder="Rechercher des utilisateurs..." className="max-w-sm" />
                    <Button variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Synchroniser
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg">
                    <div className="p-4 border-b bg-muted/50">
                      <div className="grid grid-cols-5 gap-4 font-medium text-sm">
                        <span>Utilisateur</span>
                        <span>Fournisseur</span>
                        <span>Rôle</span>
                        <span>Dernière Connexion</span>
                        <span>Actions</span>
                      </div>
                    </div>
                    
                    {/* User rows would go here - simplified for demo */}
                    <div className="p-8 text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Gestion des utilisateurs SSO</p>
                      <p className="text-sm">Liste et contrôle des accès utilisateurs</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Audit et Journalisation</h2>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exporter Logs
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Événements de Sécurité</CardTitle>
                  <CardDescription>Activité récente liée à la sécurité</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Connexion SSO réussie</p>
                        <p className="text-xs text-muted-foreground">user@company.com via Google Workspace</p>
                        <p className="text-xs text-muted-foreground">Il y a 2 minutes</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Tentative de connexion échouée</p>
                        <p className="text-xs text-muted-foreground">Mot de passe incorrect - admin@company.com</p>
                        <p className="text-xs text-muted-foreground">Il y a 15 minutes</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Synchronisation SSO</p>
                        <p className="text-xs text-muted-foreground">125 utilisateurs mis à jour depuis Azure AD</p>
                        <p className="text-xs text-muted-foreground">Il y a 1 heure</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistiques d'Accès</CardTitle>
                  <CardDescription>Métriques des connexions SSO</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Connexions réussies (24h)</span>
                      <span className="font-bold text-green-600">1,247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Échecs de connexion (24h)</span>
                      <span className="font-bold text-red-600">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Taux de réussite</span>
                      <span className="font-bold text-blue-600">98.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Temps moyen de connexion</span>
                      <span className="font-bold">1.2s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}