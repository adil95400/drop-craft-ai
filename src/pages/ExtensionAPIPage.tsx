import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Book, 
  Key, 
  Database, 
  Webhook,
  Globe,
  Package,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Download,
  ExternalLink,
  GitBranch,
  FileText,
  PlayCircle
} from 'lucide-react';

const ExtensionAPIPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('api');

  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/v1/products',
      description: 'Récupérer la liste des produits',
      auth: 'API Key',
      rateLimit: '1000/hour'
    },
    {
      method: 'POST',
      path: '/api/v1/products',
      description: 'Créer un nouveau produit',
      auth: 'API Key + Write',
      rateLimit: '100/hour'
    },
    {
      method: 'GET',
      path: '/api/v1/orders',
      description: 'Récupérer les commandes',
      auth: 'API Key',
      rateLimit: '500/hour'
    },
    {
      method: 'POST',
      path: '/api/v1/webhooks',
      description: 'Configurer un webhook',
      auth: 'API Key + Admin',
      rateLimit: '50/hour'
    },
    {
      method: 'GET',
      path: '/graphql',
      description: 'Endpoint GraphQL principal',
      auth: 'API Key',
      rateLimit: '2000/hour'
    }
  ];

  const extensionTypes = [
    {
      type: 'Connector',
      description: 'Intégrations avec plateformes externes',
      examples: ['Shopify', 'WooCommerce', 'Amazon'],
      icon: Globe
    },
    {
      type: 'Analytics',
      description: 'Outils d\'analyse et reporting',
      examples: ['Google Analytics', 'Facebook Pixel', 'Custom Dashboards'],
      icon: TrendingUp
    },
    {
      type: 'Automation',
      description: 'Automatisation des processus',
      examples: ['Email Marketing', 'Stock Alerts', 'Order Processing'],
      icon: Zap
    },
    {
      type: 'Security',
      description: 'Sécurité et conformité',
      examples: ['2FA', 'GDPR Tools', 'Security Audit'],
      icon: Shield
    }
  ];

  const marketplaceStats = [
    { label: 'Extensions Disponibles', value: '247', trend: '+12%' },
    { label: 'Développeurs Actifs', value: '89', trend: '+8%' },
    { label: 'Téléchargements Total', value: '12.4K', trend: '+23%' },
    { label: 'Note Moyenne', value: '4.7/5', trend: '+0.2' }
  ];

  const popularExtensions = [
    {
      name: 'Shopify Sync Pro',
      developer: 'Drop Craft Team',
      downloads: '2.1K',
      rating: 4.9,
      price: 'Gratuit',
      category: 'Connector'
    },
    {
      name: 'AI Product Optimizer',
      developer: 'AI Labs',
      downloads: '1.8K',
      rating: 4.8,
      price: '29€/mois',
      category: 'Analytics'
    },
    {
      name: 'Auto Email Campaign',
      developer: 'Marketing Tools',
      downloads: '1.5K',
      rating: 4.7,
      price: '19€/mois',
      category: 'Automation'
    },
    {
      name: 'GDPR Compliance Suite',
      developer: 'Legal Tech',
      downloads: '892',
      rating: 4.6,
      price: '39€/mois',
      category: 'Security'
    }
  ];

  const devResources = [
    {
      title: 'API Documentation',
      description: 'Documentation complète REST et GraphQL',
      link: '/docs/api',
      icon: Book
    },
    {
      title: 'SDK JavaScript',
      description: 'Bibliothèque officielle pour développeurs',
      link: '/sdk/javascript',
      icon: Code
    },
    {
      title: 'Extension Templates',
      description: 'Templates pour démarrer rapidement',
      link: '/templates',
      icon: Package
    },
    {
      title: 'Playground API',
      description: 'Tester l\'API en temps réel',
      link: '/playground',
      icon: PlayCircle
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      <div className="container mx-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Extensions & API Publique
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Étendez Drop Craft AI avec notre marketplace d'extensions et notre API publique robuste
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            {marketplaceStats.map((stat, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{stat.value}</span>
                      <Badge variant="secondary" className="text-xs">
                        {stat.trend}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="api">API Publique</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="develop">Développer</TabsTrigger>
              <TabsTrigger value="docs">Documentation</TabsTrigger>
            </TabsList>

            {/* API Tab */}
            <TabsContent value="api" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      REST API
                    </CardTitle>
                    <CardDescription>
                      API RESTful complète pour intégrer Drop Craft AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {apiEndpoints.slice(0, 4).map((endpoint, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm font-mono">{endpoint.path}</code>
                          </div>
                          <p className="text-xs text-muted-foreground">{endpoint.description}</p>
                          <div className="flex justify-between text-xs">
                            <span>Auth: {endpoint.auth}</span>
                            <span>Rate: {endpoint.rateLimit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir tous les endpoints
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      GraphQL API
                    </CardTitle>
                    <CardDescription>
                      Interface GraphQL flexible et puissante
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="bg-muted rounded-lg p-4">
                        <pre className="text-xs font-mono text-muted-foreground">
{`query GetProducts($limit: Int) {
  products(limit: $limit) {
    id
    name
    price
    category
    inStock
    images {
      url
      alt
    }
  }
}`}
                        </pre>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Fonctionnalités</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Requêtes flexibles et optimisées</li>
                          <li>• Subscriptions temps réel</li>
                          <li>• Schema introspection</li>
                          <li>• Batching automatique</li>
                        </ul>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Tester dans GraphiQL
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Authentification API
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">API Keys</h4>
                      <p className="text-sm text-muted-foreground">
                        Clés d'API pour l'authentification basique
                      </p>
                      <Button size="sm" variant="outline">
                        Générer une clé
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">OAuth 2.0</h4>
                      <p className="text-sm text-muted-foreground">
                        Authentification sécurisée pour applications
                      </p>
                      <Button size="sm" variant="outline">
                        Configurer OAuth
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">JWT Tokens</h4>
                      <p className="text-sm text-muted-foreground">
                        Tokens JWT pour sessions utilisateur
                      </p>
                      <Button size="sm" variant="outline">
                        Documentation JWT
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-6 mb-6">
                {extensionTypes.map((type, index) => (
                  <Card key={index} className="border-border/50 hover:border-primary/20 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <type.icon className="w-5 h-5 text-primary" />
                        {type.type}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <CardDescription>{type.description}</CardDescription>
                      <div className="space-y-1">
                        {type.examples.map((example, exampleIndex) => (
                          <div key={exampleIndex} className="text-xs bg-muted px-2 py-1 rounded">
                            {example}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Extensions Populaires</CardTitle>
                  <CardDescription>
                    Les extensions les plus téléchargées de la marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {popularExtensions.map((extension, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{extension.name}</h4>
                            <Badge variant="outline">{extension.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Par {extension.developer} • {extension.downloads} téléchargements
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">⭐ {extension.rating}</span>
                            <span className="text-sm font-semibold text-primary">{extension.price}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Détails
                          </Button>
                          <Button size="sm">
                            Installer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Button variant="outline">
                      <Package className="w-4 h-4 mr-2" />
                      Voir toutes les extensions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Develop Tab */}
            <TabsContent value="develop" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {devResources.map((resource, index) => (
                  <Card key={index} className="hover:border-primary/20 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <resource.icon className="w-5 h-5 text-primary" />
                        {resource.title}
                      </CardTitle>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <a href={resource.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Accéder
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Commencer le Développement</CardTitle>
                  <CardDescription>
                    Étapes pour créer votre première extension
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                        1
                      </div>
                      <h4 className="font-semibold">Créer un Compte Développeur</h4>
                      <p className="text-sm text-muted-foreground">
                        Inscrivez-vous comme développeur et obtenez vos clés d'API
                      </p>
                      <Button size="sm">
                        S'inscrire
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                        2
                      </div>
                      <h4 className="font-semibold">Installer les Outils</h4>
                      <p className="text-sm text-muted-foreground">
                        Téléchargez le SDK et les templates d'extension
                      </p>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger SDK
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                        3
                      </div>
                      <h4 className="font-semibold">Publier votre Extension</h4>
                      <p className="text-sm text-muted-foreground">
                        Testez, documentez et publiez sur la marketplace
                      </p>
                      <Button size="sm" variant="outline">
                        Guide de Publication
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Docs Tab */}
            <TabsContent value="docs" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documentation Complète
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">API Reference</h4>
                        <ul className="space-y-2 text-sm">
                          <li><a href="/docs/api/products" className="text-primary hover:underline">Products API</a></li>
                          <li><a href="/docs/api/orders" className="text-primary hover:underline">Orders API</a></li>
                          <li><a href="/docs/api/customers" className="text-primary hover:underline">Customers API</a></li>
                          <li><a href="/docs/api/analytics" className="text-primary hover:underline">Analytics API</a></li>
                          <li><a href="/docs/api/webhooks" className="text-primary hover:underline">Webhooks</a></li>
                        </ul>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-semibold">Guides Développeur</h4>
                        <ul className="space-y-2 text-sm">
                          <li><a href="/docs/guides/quickstart" className="text-primary hover:underline">Quick Start Guide</a></li>
                          <li><a href="/docs/guides/authentication" className="text-primary hover:underline">Authentication</a></li>
                          <li><a href="/docs/guides/rate-limiting" className="text-primary hover:underline">Rate Limiting</a></li>
                          <li><a href="/docs/guides/webhooks" className="text-primary hover:underline">Webhooks Setup</a></li>
                          <li><a href="/docs/guides/best-practices" className="text-primary hover:underline">Best Practices</a></li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Swagger/OpenAPI</CardTitle>
                      <CardDescription>
                        Spécification OpenAPI interactive
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <a href="/swagger" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ouvrir Swagger UI
                        </a>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Collection Postman</CardTitle>
                      <CardDescription>
                        Collection complète pour Postman
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full" variant="outline">
                        <a href="/postman-collection.json" download>
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger Collection
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ExtensionAPIPage;