import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Code, Copy, ExternalLink, Search, Globe, Key, Zap, BookOpen } from 'lucide-react'

export default function APIDocsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEndpoint, setSelectedEndpoint] = useState('auth')

  const apiVersions = [
    { version: 'v2.0', status: 'current', description: 'Version actuelle avec support WebSocket' },
    { version: 'v1.5', status: 'deprecated', description: 'Version obsolète, migration recommandée' },
    { version: 'v1.0', status: 'legacy', description: 'Support jusqu\'au 31/12/2024' }
  ]

  const endpoints = [
    {
      id: 'auth',
      category: 'Authentication',
      name: 'POST /auth/login',
      description: 'Authentifier un utilisateur et obtenir un token',
      method: 'POST',
      path: '/auth/login',
      parameters: [
        { name: 'email', type: 'string', required: true, description: 'Email utilisateur' },
        { name: 'password', type: 'string', required: true, description: 'Mot de passe' }
      ],
      response: {
        success: {
          token: 'string',
          expires_in: 'number',
          user: {
            id: 'string',
            email: 'string',
            plan: 'string'
          }
        }
      },
      example: `curl -X POST https://api.extensions.com/v2/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'`
    },
    {
      id: 'extensions',
      category: 'Extensions',
      name: 'GET /extensions',
      description: 'Récupérer la liste des extensions disponibles',
      method: 'GET',
      path: '/extensions',
      parameters: [
        { name: 'category', type: 'string', required: false, description: 'Filtrer par catégorie' },
        { name: 'limit', type: 'number', required: false, description: 'Nombre d\'éléments max' },
        { name: 'offset', type: 'number', required: false, description: 'Décalage pour pagination' }
      ],
      response: {
        success: {
          extensions: [
            {
              id: 'string',
              name: 'string',
              description: 'string',
              version: 'string',
              category: 'string',
              price: 'number'
            }
          ],
          total: 'number',
          page: 'number'
        }
      },
      example: `curl -X GET "https://api.extensions.com/v2/extensions?category=productivity&limit=10" \\
  -H "Authorization: Bearer YOUR_TOKEN"`
    },
    {
      id: 'install',
      category: 'Extensions',
      name: 'POST /extensions/{id}/install',
      description: 'Installer une extension pour l\'utilisateur connecté',
      method: 'POST',
      path: '/extensions/{id}/install',
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'ID de l\'extension' },
        { name: 'configuration', type: 'object', required: false, description: 'Configuration initiale' }
      ],
      response: {
        success: {
          installation_id: 'string',
          status: 'string',
          configuration: 'object'
        }
      },
      example: `curl -X POST https://api.extensions.com/v2/extensions/ext_123/install \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "configuration": {
      "api_key": "your_api_key",
      "sync_interval": 300
    }
  }'`
    },
    {
      id: 'webhooks',
      category: 'Webhooks',
      name: 'POST /webhooks',
      description: 'Créer un nouveau webhook pour recevoir des événements',
      method: 'POST',
      path: '/webhooks',
      parameters: [
        { name: 'url', type: 'string', required: true, description: 'URL de destination' },
        { name: 'events', type: 'array', required: true, description: 'Types d\'événements à écouter' },
        { name: 'secret', type: 'string', required: false, description: 'Secret pour validation' }
      ],
      response: {
        success: {
          webhook_id: 'string',
          url: 'string',
          events: 'array',
          created_at: 'string'
        }
      },
      example: `curl -X POST https://api.extensions.com/v2/webhooks \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["extension.installed", "data.scraped"],
    "secret": "webhook_secret_key"
  }'`
    }
  ]

  const errorCodes = [
    { code: 400, name: 'Bad Request', description: 'Requête malformée ou paramètres invalides' },
    { code: 401, name: 'Unauthorized', description: 'Token d\'authentification manquant ou invalide' },
    { code: 403, name: 'Forbidden', description: 'Permissions insuffisantes pour cette action' },
    { code: 404, name: 'Not Found', description: 'Ressource introuvable' },
    { code: 429, name: 'Rate Limited', description: 'Trop de requêtes, veuillez patienter' },
    { code: 500, name: 'Internal Error', description: 'Erreur serveur, veuillez réessayer' }
  ]

  const sdks = [
    {
      language: 'JavaScript',
      name: '@extensions/js-sdk',
      version: '2.1.0',
      description: 'SDK officiel pour Node.js et navigateurs',
      install: 'npm install @extensions/js-sdk'
    },
    {
      language: 'Python',
      name: 'extensions-python',
      version: '1.8.2',
      description: 'SDK Python avec support asyncio',
      install: 'pip install extensions-python'
    },
    {
      language: 'PHP',
      name: 'extensions/php-sdk',
      version: '1.5.0',
      description: 'SDK PHP compatible Composer',
      install: 'composer require extensions/php-sdk'
    }
  ]

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Documentation API
        </h1>
        <p className="text-muted-foreground mt-2">
          Référence complète de notre API REST et WebSocket
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="font-semibold">Base URL</span>
            </div>
            <code className="text-sm bg-muted p-2 rounded block">
              https://api.extensions.com/v2
            </code>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Key className="w-4 h-4 text-green-500" />
              <span className="font-semibold">Authentification</span>
            </div>
            <code className="text-sm bg-muted p-2 rounded block">
              Bearer Token
            </code>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="font-semibold">Rate Limit</span>
            </div>
            <code className="text-sm bg-muted p-2 rounded block">
              1000 req/hour
            </code>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="w-4 h-4 text-purple-500" />
              <span className="font-semibold">Version</span>
            </div>
            <Badge className="text-sm">v2.0 (Current)</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="authentication">Auth</TabsTrigger>
          <TabsTrigger value="sdks">SDKs</TabsTrigger>
          <TabsTrigger value="errors">Erreurs</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher un endpoint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Navigation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {endpoints.map((endpoint) => (
                        <Button
                          key={endpoint.id}
                          variant={selectedEndpoint === endpoint.id ? 'default' : 'ghost'}
                          className="w-full justify-start text-left h-auto p-3"
                          onClick={() => setSelectedEndpoint(endpoint.id)}
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  endpoint.method === 'GET' ? 'border-green-500 text-green-600' :
                                  endpoint.method === 'POST' ? 'border-blue-500 text-blue-600' :
                                  endpoint.method === 'PUT' ? 'border-orange-500 text-orange-600' :
                                  'border-red-500 text-red-600'
                                }`}
                              >
                                {endpoint.method}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{endpoint.category}</span>
                            </div>
                            <div className="text-sm font-mono mt-1">{endpoint.path}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {endpoints
                .filter(endpoint => endpoint.id === selectedEndpoint)
                .map((endpoint) => (
                <Card key={endpoint.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline"
                        className={`${
                          endpoint.method === 'GET' ? 'border-green-500 text-green-600' :
                          endpoint.method === 'POST' ? 'border-blue-500 text-blue-600' :
                          endpoint.method === 'PUT' ? 'border-orange-500 text-orange-600' :
                          'border-red-500 text-red-600'
                        }`}
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="text-lg font-mono">{endpoint.path}</code>
                    </div>
                    <CardDescription>{endpoint.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Paramètres</h4>
                      <div className="space-y-2">
                        {endpoint.parameters.map((param, index) => (
                          <div key={index} className="border rounded p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <code className="text-sm font-semibold">{param.name}</code>
                              <Badge variant="outline" className="text-xs">{param.type}</Badge>
                              {param.required && (
                                <Badge variant="destructive" className="text-xs">Requis</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{param.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3">Réponse</h4>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm overflow-x-auto">
                          <code>{JSON.stringify(endpoint.response.success, null, 2)}</code>
                        </pre>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Exemple cURL</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(endpoint.example)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copier
                        </Button>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm overflow-x-auto">
                          <code>{endpoint.example}</code>
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentification API</CardTitle>
              <CardDescription>
                Guide complet pour sécuriser vos appels API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">1. Obtenir un Token</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Utilisez vos identifiants pour obtenir un token JWT d'accès.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    <code>{`curl -X POST https://api.extensions.com/v2/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "your@email.com",
    "password": "your_password"
  }'`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">2. Utiliser le Token</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Incluez le token dans l'en-tête Authorization de vos requêtes.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    <code>{`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">3. Rafraîchir le Token</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Les tokens expirent après 24h. Utilisez le refresh token pour en obtenir un nouveau.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    <code>{`curl -X POST https://api.extensions.com/v2/auth/refresh \\
  -H "Authorization: Bearer REFRESH_TOKEN"`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SDKs Officiels</CardTitle>
              <CardDescription>
                Intégrez facilement notre API avec nos SDKs officiels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sdks.map((sdk, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold">{sdk.language}</h3>
                          <p className="text-sm text-muted-foreground">{sdk.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline">v{sdk.version}</Badge>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-lg mb-3">
                      <code className="text-sm">{sdk.install}</code>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Documentation
                      </Button>
                      <Button variant="outline" size="sm">
                        <Code className="w-4 h-4 mr-2" />
                        Exemples
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Codes d'Erreur</CardTitle>
              <CardDescription>
                Référence des codes d'erreur HTTP et leur signification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorCodes.map((error, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge 
                        variant={error.code >= 500 ? 'destructive' : 
                               error.code >= 400 ? 'secondary' : 'default'}
                        className="font-mono"
                      >
                        {error.code}
                      </Badge>
                      <h3 className="font-semibold">{error.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{error.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}