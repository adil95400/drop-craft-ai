import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, Code, Key, Shield, Globe, Zap } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function EnterpriseAPIPage() {
  return (
    <ChannablePageWrapper
      title="Enterprise API"
      description="API robuste et sécurisée pour les intégrations d'entreprise"
      heroImage="import"
      badge={{ label: "Enterprise" }}
    >
      <Helmet>
        <title>Enterprise API - API Avancée pour Entreprises</title>
        <meta name="description" content="API Enterprise avec authentification avancée, rate limiting, monitoring et intégrations personnalisées pour les grandes entreprises." />
      </Helmet>

      <div className="space-y-6">

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="authentication">Authentification</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-primary" />
                    API RESTful
                  </CardTitle>
                  <CardDescription>
                    Interface standard avec documentation complète
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Endpoints</span>
                      <Badge variant="secondary">150+</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rate Limit</span>
                      <Badge variant="outline">10,000/h</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-secondary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-secondary" />
                    Sécurité Avancée
                  </CardTitle>
                  <CardDescription>
                    OAuth 2.0, JWT, RBAC et audit complet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">SSL/TLS</span>
                      <Badge variant="default">Activé</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Encryption</span>
                      <Badge variant="default">AES-256</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-accent" />
                    Performance
                  </CardTitle>
                  <CardDescription>
                    Haute disponibilité et monitoring temps réel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Uptime</span>
                      <Badge variant="default">99.99%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Latence</span>
                      <Badge variant="outline">&lt;50ms</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Endpoints Disponibles</CardTitle>
                <CardDescription>
                  Liste complète des endpoints API avec méthodes et descriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { method: 'GET', path: '/api/v1/products', desc: 'Récupérer la liste des produits' },
                    { method: 'POST', path: '/api/v1/products', desc: 'Créer un nouveau produit' },
                    { method: 'PUT', path: '/api/v1/products/{id}', desc: 'Mettre à jour un produit' },
                    { method: 'DELETE', path: '/api/v1/products/{id}', desc: 'Supprimer un produit' },
                    { method: 'GET', path: '/api/v1/orders', desc: 'Récupérer les commandes' },
                    { method: 'POST', path: '/api/v1/orders', desc: 'Créer une nouvelle commande' },
                  ].map((endpoint, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <Badge variant={endpoint.method === 'GET' ? 'secondary' : endpoint.method === 'POST' ? 'default' : 'destructive'}>
                        {endpoint.method}
                      </Badge>
                      <code className="flex-1 text-sm font-mono">{endpoint.path}</code>
                      <span className="text-sm text-muted-foreground">{endpoint.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authentication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Méthodes d'Authentification
                </CardTitle>
                <CardDescription>
                  Configuration et gestion des accès API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">API Keys</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Clés API pour l'accès rapide et simple
                    </p>
                    <Button variant="outline" size="sm">Générer Clé</Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">OAuth 2.0</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Authentification sécurisée pour applications
                    </p>
                    <Button variant="outline" size="sm">Configurer OAuth</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monitoring & Analytics</CardTitle>
                <CardDescription>
                  Surveillez l'utilisation et les performances de votre API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">1,234</div>
                    <div className="text-sm text-muted-foreground">Requêtes/jour</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-secondary">45ms</div>
                    <div className="text-sm text-muted-foreground">Latence moy.</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">99.9%</div>
                    <div className="text-sm text-muted-foreground">Disponibilité</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">12</div>
                    <div className="text-sm text-muted-foreground">Erreurs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ChannablePageWrapper>
  );
}