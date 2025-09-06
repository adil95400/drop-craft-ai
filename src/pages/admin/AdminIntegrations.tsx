import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Settings, Trash2, Eye, Palette, Cpu, Zap, Globe, Shield, Key } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

// Mock data pour les intégrations Canva
const mockCanvaIntegrations = [
  {
    id: '1',
    userId: 'user-1',
    userEmail: 'john.doe@example.com',
    canvaUserId: 'canva_123456',
    brandId: 'brand_789',
    teamId: 'team_456',
    status: 'active',
    tokensRemaining: 945,
    tokensLimit: 1000,
    lastSync: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    designs: 23,
    exports: 156
  },
  {
    id: '2',
    userId: 'user-2', 
    userEmail: 'marie.martin@example.com',
    canvaUserId: 'canva_654321',
    brandId: 'brand_987',
    teamId: null,
    status: 'active',
    tokensRemaining: 782,
    tokensLimit: 1000,
    lastSync: '2024-01-14T15:45:00Z',
    createdAt: '2023-12-15T00:00:00Z',
    designs: 45,
    exports: 289
  }
];

// Mock data pour les intégrations OpenAI
const mockOpenAIIntegrations = [
  {
    id: '1',
    userId: 'user-1',
    userEmail: 'john.doe@example.com',
    model: 'gpt-4',
    tokensUsed: 125000,
    tokensLimit: 1000000,
    requestsToday: 45,
    requestsLimit: 100,
    status: 'active',
    lastRequest: '2024-01-15T14:22:00Z',
    totalCost: 12.45,
    features: ['text-generation', 'image-analysis', 'content-optimization']
  },
  {
    id: '2',
    userId: 'user-2',
    userEmail: 'marie.martin@example.com', 
    model: 'gpt-3.5-turbo',
    tokensUsed: 89000,
    tokensLimit: 500000,
    requestsToday: 23,
    requestsLimit: 50,
    status: 'active',
    lastRequest: '2024-01-15T13:15:00Z',
    totalCost: 5.67,
    features: ['text-generation', 'content-optimization']
  }
];

const AdminIntegrations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canvaStats = {
    totalIntegrations: mockCanvaIntegrations.length,
    activeUsers: mockCanvaIntegrations.filter(i => i.status === 'active').length,
    totalDesigns: mockCanvaIntegrations.reduce((acc, i) => acc + i.designs, 0),
    totalExports: mockCanvaIntegrations.reduce((acc, i) => acc + i.exports, 0)
  };

  const openaiStats = {
    totalIntegrations: mockOpenAIIntegrations.length,
    activeUsers: mockOpenAIIntegrations.filter(i => i.status === 'active').length,
    totalTokens: mockOpenAIIntegrations.reduce((acc, i) => acc + i.tokensUsed, 0),
    totalCost: mockOpenAIIntegrations.reduce((acc, i) => acc + i.totalCost, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Intégrations</h1>
          <p className="text-muted-foreground">Gérez les intégrations Canva, OpenAI et autres services</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Intégration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurer une Intégration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="canva">Canva</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="apiKey">Clé API</Label>
                  <Input id="apiKey" type="password" placeholder="Entrez la clé API" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="autoActivate" />
                  <Label htmlFor="autoActivate">Activer automatiquement</Label>
                </div>
                <Button className="w-full">Configurer l'Intégration</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Intégrations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{canvaStats.totalIntegrations + openaiStats.totalIntegrations}</div>
            <p className="text-xs text-muted-foreground">+3 ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{canvaStats.activeUsers + openaiStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">+12% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût Total IA</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openaiStats.totalCost.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">+8% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Designs Créés</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{canvaStats.totalDesigns}</div>
            <p className="text-xs text-muted-foreground">+15% ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="canva" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="canva">
            <Palette className="w-4 h-4 mr-2" />
            Canva ({canvaStats.totalIntegrations})
          </TabsTrigger>
          <TabsTrigger value="openai">
            <Cpu className="w-4 h-4 mr-2" />
            OpenAI ({openaiStats.totalIntegrations})
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="canva" className="space-y-4">
          {/* Canva Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Intégrations Actives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{canvaStats.activeUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Designs Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{canvaStats.totalDesigns}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Exports Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{canvaStats.totalExports}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tokens Moyens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(mockCanvaIntegrations.reduce((acc, i) => acc + i.tokensRemaining, 0) / mockCanvaIntegrations.length)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Canva Integrations List */}
          <div className="space-y-4">
            {mockCanvaIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Palette className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{integration.userEmail}</h3>
                        <p className="text-sm text-muted-foreground">ID Canva: {integration.canvaUserId}</p>
                        {integration.teamId && (
                          <p className="text-xs text-muted-foreground">Team: {integration.teamId}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{integration.designs}</p>
                        <p className="text-xs text-muted-foreground">Designs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{integration.exports}</p>
                        <p className="text-xs text-muted-foreground">Exports</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{integration.tokensRemaining}</p>
                        <p className="text-xs text-muted-foreground">Tokens restants</p>
                      </div>
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="openai" className="space-y-4">
          {/* OpenAI Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Intégrations Actives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openaiStats.activeUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tokens Utilisés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openaiStats.totalTokens.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Coût Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openaiStats.totalCost.toFixed(2)}€</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Requêtes Aujourd'hui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockOpenAIIntegrations.reduce((acc, i) => acc + i.requestsToday, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* OpenAI Integrations List */}
          <div className="space-y-4">
            {mockOpenAIIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{integration.userEmail}</h3>
                        <p className="text-sm text-muted-foreground">Modèle: {integration.model}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {integration.features.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{integration.tokensUsed.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Tokens utilisés</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{integration.requestsToday}</p>
                        <p className="text-xs text-muted-foreground">Req. aujourd'hui</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600">{integration.totalCost.toFixed(2)}€</p>
                        <p className="text-xs text-muted-foreground">Coût total</p>
                      </div>
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {/* Security Settings */}
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  Gestion des Clés API
                </CardTitle>
                <CardDescription>
                  Configurez et gérez les clés API pour tous les services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">OpenAI API Key</h4>
                      <p className="text-sm text-muted-foreground">sk-...****</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Régénérer</Button>
                      <Button variant="outline" size="sm">Tester</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Canva API Key</h4>
                      <p className="text-sm text-muted-foreground">cnv_...****</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Régénérer</Button>
                      <Button variant="outline" size="sm">Tester</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limites et Quotas</CardTitle>
                <CardDescription>
                  Configurez les limites d'utilisation par utilisateur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="openaiTokenLimit">Limite tokens OpenAI (par mois)</Label>
                    <Input id="openaiTokenLimit" type="number" defaultValue="1000000" />
                  </div>
                  <div>
                    <Label htmlFor="canvaRequestLimit">Limite requêtes Canva (par jour)</Label>
                    <Input id="canvaRequestLimit" type="number" defaultValue="100" />
                  </div>
                </div>
                <Button>Sauvegarder les Limites</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminIntegrations;