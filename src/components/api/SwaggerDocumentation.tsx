import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check, 
  Play, 
  Server,
  Lock,
  Tag,
  ExternalLink,
  FileJson,
  Code2
} from 'lucide-react';
import { toast } from 'sonner';

interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'body';
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

interface Response {
  code: number;
  description: string;
  example?: object;
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: Parameter[];
  requestBody?: {
    type: string;
    properties: Record<string, { type: string; description: string; example?: string }>;
    required?: string[];
  };
  responses: Response[];
}

const API_BASE_URL = 'https://dtozyrmmekdnvekissuh.supabase.co/functions/v1';

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ShopOpti API',
    version: '1.0.0',
    description: 'API REST complète pour la gestion e-commerce multi-canal',
    contact: {
      email: 'api@shopopti.com',
      url: 'https://docs.shopopti.com'
    },
    license: {
      name: 'Proprietary',
      url: 'https://shopopti.com/terms'
    }
  },
  servers: [
    {
      url: API_BASE_URL,
      description: 'Production Server'
    }
  ],
  tags: [
    { name: 'Products', description: 'Gestion des produits' },
    { name: 'Orders', description: 'Gestion des commandes' },
    { name: 'Customers', description: 'Gestion des clients' },
    { name: 'Inventory', description: 'Gestion des stocks' },
    { name: 'Suppliers', description: 'Gestion des fournisseurs' },
    { name: 'Webhooks', description: 'Gestion des webhooks' }
  ]
};

const endpoints: Endpoint[] = [
  // Products
  {
    method: 'GET',
    path: '/public-api/products',
    summary: 'Lister les produits',
    description: 'Récupère la liste paginée de tous les produits avec filtres optionnels.',
    tags: ['Products'],
    parameters: [
      { name: 'limit', in: 'query', type: 'integer', required: false, description: 'Nombre de résultats (max: 100)', example: '20' },
      { name: 'offset', in: 'query', type: 'integer', required: false, description: 'Position de départ', example: '0' },
      { name: 'category', in: 'query', type: 'string', required: false, description: 'Filtrer par catégorie', example: 'electronics' },
      { name: 'status', in: 'query', type: 'string', required: false, description: 'Statut du produit', example: 'active' },
      { name: 'search', in: 'query', type: 'string', required: false, description: 'Recherche textuelle', example: 'iphone' }
    ],
    responses: [
      { code: 200, description: 'Liste des produits', example: { data: [{ id: 'uuid', name: 'Product', price: 99.99 }], total: 100, limit: 20, offset: 0 } },
      { code: 401, description: 'Clé API invalide' },
      { code: 500, description: 'Erreur serveur' }
    ]
  },
  {
    method: 'GET',
    path: '/public-api/products/{id}',
    summary: 'Obtenir un produit',
    description: 'Récupère les détails complets d\'un produit par son ID.',
    tags: ['Products'],
    parameters: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'ID unique du produit (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' }
    ],
    responses: [
      { code: 200, description: 'Détails du produit', example: { id: 'uuid', name: 'Product', description: 'Description', price: 99.99, stock: 50, category: 'Electronics' } },
      { code: 404, description: 'Produit non trouvé' },
      { code: 401, description: 'Clé API invalide' }
    ]
  },
  {
    method: 'POST',
    path: '/public-api/products',
    summary: 'Créer un produit',
    description: 'Crée un nouveau produit dans le catalogue.',
    tags: ['Products'],
    requestBody: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nom du produit', example: 'iPhone 15 Pro' },
        description: { type: 'string', description: 'Description complète', example: 'Le dernier iPhone avec puce A17 Pro' },
        price: { type: 'number', description: 'Prix de vente', example: '1199.99' },
        cost_price: { type: 'number', description: 'Prix d\'achat', example: '800.00' },
        sku: { type: 'string', description: 'SKU unique', example: 'IPHONE-15-PRO-256' },
        stock: { type: 'integer', description: 'Quantité en stock', example: '100' },
        category: { type: 'string', description: 'Catégorie', example: 'Smartphones' },
        images: { type: 'array', description: 'URLs des images', example: '["https://..."]' }
      },
      required: ['name', 'price']
    },
    responses: [
      { code: 201, description: 'Produit créé', example: { id: 'uuid', name: 'iPhone 15 Pro', created_at: '2024-01-01T00:00:00Z' } },
      { code: 400, description: 'Données invalides' },
      { code: 401, description: 'Clé API invalide' }
    ]
  },
  {
    method: 'PUT',
    path: '/public-api/products/{id}',
    summary: 'Mettre à jour un produit',
    description: 'Met à jour les informations d\'un produit existant.',
    tags: ['Products'],
    parameters: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'ID unique du produit', example: 'uuid' }
    ],
    requestBody: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nom du produit', example: 'iPhone 15 Pro Max' },
        price: { type: 'number', description: 'Prix de vente', example: '1399.99' },
        stock: { type: 'integer', description: 'Quantité en stock', example: '50' }
      }
    },
    responses: [
      { code: 200, description: 'Produit mis à jour', example: { id: 'uuid', updated_at: '2024-01-01T00:00:00Z' } },
      { code: 404, description: 'Produit non trouvé' },
      { code: 401, description: 'Clé API invalide' }
    ]
  },
  {
    method: 'DELETE',
    path: '/public-api/products/{id}',
    summary: 'Supprimer un produit',
    description: 'Supprime définitivement un produit du catalogue.',
    tags: ['Products'],
    parameters: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'ID unique du produit', example: 'uuid' }
    ],
    responses: [
      { code: 204, description: 'Produit supprimé' },
      { code: 404, description: 'Produit non trouvé' },
      { code: 401, description: 'Clé API invalide' }
    ]
  },
  // Orders
  {
    method: 'GET',
    path: '/public-api/orders',
    summary: 'Lister les commandes',
    description: 'Récupère la liste paginée des commandes.',
    tags: ['Orders'],
    parameters: [
      { name: 'limit', in: 'query', type: 'integer', required: false, description: 'Nombre de résultats', example: '20' },
      { name: 'status', in: 'query', type: 'string', required: false, description: 'Statut de la commande', example: 'pending' },
      { name: 'from', in: 'query', type: 'string', required: false, description: 'Date de début (ISO 8601)', example: '2024-01-01' },
      { name: 'to', in: 'query', type: 'string', required: false, description: 'Date de fin (ISO 8601)', example: '2024-12-31' }
    ],
    responses: [
      { code: 200, description: 'Liste des commandes', example: { data: [{ id: 'uuid', total: 299.99, status: 'pending' }], total: 50 } },
      { code: 401, description: 'Clé API invalide' }
    ]
  },
  {
    method: 'POST',
    path: '/public-api/orders',
    summary: 'Créer une commande',
    description: 'Crée une nouvelle commande.',
    tags: ['Orders'],
    requestBody: {
      type: 'object',
      properties: {
        customer_id: { type: 'string', description: 'ID du client', example: 'uuid' },
        items: { type: 'array', description: 'Articles de la commande', example: '[{"product_id": "uuid", "quantity": 2}]' },
        shipping_address: { type: 'object', description: 'Adresse de livraison', example: '{"street": "123 Rue", "city": "Paris"}' }
      },
      required: ['customer_id', 'items']
    },
    responses: [
      { code: 201, description: 'Commande créée', example: { id: 'uuid', order_number: 'ORD-001', total: 199.99 } },
      { code: 400, description: 'Données invalides' },
      { code: 401, description: 'Clé API invalide' }
    ]
  },
  // Customers
  {
    method: 'GET',
    path: '/public-api/customers',
    summary: 'Lister les clients',
    description: 'Récupère la liste des clients.',
    tags: ['Customers'],
    parameters: [
      { name: 'limit', in: 'query', type: 'integer', required: false, description: 'Nombre de résultats', example: '20' },
      { name: 'search', in: 'query', type: 'string', required: false, description: 'Recherche par nom/email', example: 'john' }
    ],
    responses: [
      { code: 200, description: 'Liste des clients', example: { data: [{ id: 'uuid', name: 'John Doe', email: 'john@example.com' }] } },
      { code: 401, description: 'Clé API invalide' }
    ]
  },
  {
    method: 'POST',
    path: '/public-api/customers',
    summary: 'Créer un client',
    description: 'Crée un nouveau client.',
    tags: ['Customers'],
    requestBody: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nom complet', example: 'John Doe' },
        email: { type: 'string', description: 'Email', example: 'john@example.com' },
        phone: { type: 'string', description: 'Téléphone', example: '+33612345678' },
        address: { type: 'object', description: 'Adresse', example: '{"city": "Paris", "country": "FR"}' }
      },
      required: ['name', 'email']
    },
    responses: [
      { code: 201, description: 'Client créé', example: { id: 'uuid', name: 'John Doe', created_at: '2024-01-01T00:00:00Z' } },
      { code: 400, description: 'Données invalides' },
      { code: 401, description: 'Clé API invalide' }
    ]
  },
  // Inventory
  {
    method: 'GET',
    path: '/public-api/inventory',
    summary: 'État des stocks',
    description: 'Récupère l\'état actuel des stocks.',
    tags: ['Inventory'],
    parameters: [
      { name: 'low_stock', in: 'query', type: 'boolean', required: false, description: 'Filtrer stocks bas', example: 'true' },
      { name: 'product_id', in: 'query', type: 'string', required: false, description: 'ID du produit', example: 'uuid' }
    ],
    responses: [
      { code: 200, description: 'État des stocks', example: { data: [{ product_id: 'uuid', quantity: 50, reserved: 5 }] } },
      { code: 401, description: 'Clé API invalide' }
    ]
  },
  {
    method: 'PATCH',
    path: '/public-api/inventory/{product_id}',
    summary: 'Mettre à jour le stock',
    description: 'Met à jour la quantité en stock d\'un produit.',
    tags: ['Inventory'],
    parameters: [
      { name: 'product_id', in: 'path', type: 'string', required: true, description: 'ID du produit', example: 'uuid' }
    ],
    requestBody: {
      type: 'object',
      properties: {
        quantity: { type: 'integer', description: 'Nouvelle quantité', example: '100' },
        adjustment: { type: 'integer', description: 'Ajustement (+/-)', example: '-5' },
        reason: { type: 'string', description: 'Raison de l\'ajustement', example: 'Vente' }
      }
    },
    responses: [
      { code: 200, description: 'Stock mis à jour', example: { product_id: 'uuid', new_quantity: 95 } },
      { code: 404, description: 'Produit non trouvé' },
      { code: 401, description: 'Clé API invalide' }
    ]
  },
  // Suppliers
  {
    method: 'GET',
    path: '/public-api/suppliers',
    summary: 'Lister les fournisseurs',
    description: 'Récupère la liste des fournisseurs connectés.',
    tags: ['Suppliers'],
    responses: [
      { code: 200, description: 'Liste des fournisseurs', example: { data: [{ id: 'uuid', name: 'BigBuy', status: 'connected' }] } },
      { code: 401, description: 'Clé API invalide' }
    ]
  },
  // Webhooks
  {
    method: 'GET',
    path: '/public-api/webhooks',
    summary: 'Lister les webhooks',
    description: 'Récupère la liste des webhooks configurés.',
    tags: ['Webhooks'],
    responses: [
      { code: 200, description: 'Liste des webhooks', example: { data: [{ id: 'uuid', url: 'https://...', events: ['order.created'] }] } },
      { code: 401, description: 'Clé API invalide' }
    ]
  },
  {
    method: 'POST',
    path: '/public-api/webhooks',
    summary: 'Créer un webhook',
    description: 'Crée un nouveau webhook pour recevoir des notifications.',
    tags: ['Webhooks'],
    requestBody: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL du webhook', example: 'https://myapp.com/webhook' },
        events: { type: 'array', description: 'Événements à écouter', example: '["order.created", "product.updated"]' },
        secret: { type: 'string', description: 'Secret de signature', example: 'whsec_...' }
      },
      required: ['url', 'events']
    },
    responses: [
      { code: 201, description: 'Webhook créé', example: { id: 'uuid', url: 'https://...', events: ['order.created'] } },
      { code: 400, description: 'Données invalides' },
      { code: 401, description: 'Clé API invalide' }
    ]
  }
];

const methodColors: Record<string, string> = {
  GET: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  POST: 'bg-green-500/20 text-green-400 border-green-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PATCH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const methodBgColors: Record<string, string> = {
  GET: 'border-l-blue-500',
  POST: 'border-l-green-500',
  PUT: 'border-l-amber-500',
  PATCH: 'border-l-orange-500',
  DELETE: 'border-l-red-500'
};

export function SwaggerDocumentation() {
  const [apiKey, setApiKey] = useState('');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [tryItOutEndpoint, setTryItOutEndpoint] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTag, setActiveTag] = useState<string>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const toggleEndpoint = (key: string) => {
    const newSet = new Set(expandedEndpoints);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedEndpoints(newSet);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateCurl = (endpoint: Endpoint): string => {
    let path = endpoint.path;
    endpoint.parameters?.filter(p => p.in === 'path').forEach(p => {
      path = path.replace(`{${p.name}}`, p.example || `{${p.name}}`);
    });
    
    const queryParams = endpoint.parameters?.filter(p => p.in === 'query' && p.example);
    if (queryParams?.length) {
      path += '?' + queryParams.map(p => `${p.name}=${p.example}`).join('&');
    }

    let curl = `curl -X ${endpoint.method} "${API_BASE_URL}${path}"`;
    curl += ` \\\n  -H "x-api-key: YOUR_API_KEY"`;
    curl += ` \\\n  -H "Content-Type: application/json"`;
    
    if (endpoint.requestBody) {
      const exampleBody: Record<string, unknown> = {};
      Object.entries(endpoint.requestBody.properties).forEach(([key, val]) => {
        if (val.example) {
          try {
            exampleBody[key] = JSON.parse(val.example);
          } catch {
            exampleBody[key] = val.example;
          }
        }
      });
      curl += ` \\\n  -d '${JSON.stringify(exampleBody, null, 2)}'`;
    }
    
    return curl;
  };

  const executeRequest = async (endpoint: Endpoint) => {
    if (!apiKey) {
      toast.error('Veuillez entrer votre clé API');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      let path = endpoint.path;
      endpoint.parameters?.filter(p => p.in === 'path').forEach(p => {
        path = path.replace(`{${p.name}}`, paramValues[p.name] || '');
      });

      const queryParams = endpoint.parameters?.filter(p => p.in === 'query' && paramValues[p.name]);
      if (queryParams?.length) {
        path += '?' + queryParams.map(p => `${p.name}=${encodeURIComponent(paramValues[p.name])}`).join('&');
      }

      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      };

      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(`${API_BASE_URL}${path}`, options);
      const data = await res.text();
      
      setResponse({
        status: res.status,
        body: data
      });
    } catch (error) {
      setResponse({
        status: 0,
        body: JSON.stringify({ error: 'Erreur réseau', details: String(error) })
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEndpoints = activeTag === 'all' 
    ? endpoints 
    : endpoints.filter(e => e.tags.includes(activeTag));

  const groupedEndpoints = filteredEndpoints.reduce((acc, endpoint) => {
    const tag = endpoint.tags[0];
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(endpoint);
    return acc;
  }, {} as Record<string, Endpoint[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileJson className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{openApiSpec.info.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">v{openApiSpec.info.version}</Badge>
                  <span>OpenAPI 3.0</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const spec = JSON.stringify({ ...openApiSpec, paths: {} }, null, 2);
                const blob = new Blob([spec], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'shopopti-openapi.json';
                a.click();
              }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Export OpenAPI
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* API Key Input */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Authentification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-xs">Clé API</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Entrez votre clé API..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Server Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Serveur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                    {openApiSpec.servers[0].url}
                  </code>
                </CardContent>
              </Card>

              {/* Tags Navigation */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[300px]">
                    <div className="p-3 space-y-1">
                      <Button
                        variant={activeTag === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => setActiveTag('all')}
                      >
                        Tous ({endpoints.length})
                      </Button>
                      {openApiSpec.tags.map(tag => {
                        const count = endpoints.filter(e => e.tags.includes(tag.name)).length;
                        return (
                          <Button
                            key={tag.name}
                            variant={activeTag === tag.name ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-between text-xs"
                            onClick={() => setActiveTag(tag.name)}
                          >
                            <span>{tag.name}</span>
                            <Badge variant="outline" className="text-[10px]">{count}</Badge>
                          </Button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Description */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">{openApiSpec.info.description}</p>
              </CardContent>
            </Card>

            {/* Endpoints */}
            {Object.entries(groupedEndpoints).map(([tag, tagEndpoints]) => (
              <div key={tag} className="space-y-2">
                <h2 className="text-lg font-semibold flex items-center gap-2 px-1">
                  {tag}
                  <Badge variant="secondary" className="text-xs">{tagEndpoints.length}</Badge>
                </h2>
                
                {tagEndpoints.map((endpoint, idx) => {
                  const key = `${endpoint.method}-${endpoint.path}`;
                  const isExpanded = expandedEndpoints.has(key);
                  const isTryItOut = tryItOutEndpoint === key;
                  
                  return (
                    <Card key={idx} className={`border-l-4 ${methodBgColors[endpoint.method]} overflow-hidden`}>
                      <Collapsible open={isExpanded} onOpenChange={() => toggleEndpoint(key)}>
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Badge className={`${methodColors[endpoint.method]} border font-mono text-xs`}>
                                {endpoint.method}
                              </Badge>
                              <code className="text-sm font-medium">{endpoint.path}</code>
                              <span className="text-sm text-muted-foreground hidden md:inline">{endpoint.summary}</span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
                            <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                            
                            {/* Parameters */}
                            {endpoint.parameters && endpoint.parameters.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Paramètres</h4>
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                      <tr>
                                        <th className="text-left p-2 font-medium">Nom</th>
                                        <th className="text-left p-2 font-medium">Type</th>
                                        <th className="text-left p-2 font-medium hidden md:table-cell">Description</th>
                                        {isTryItOut && <th className="text-left p-2 font-medium">Valeur</th>}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {endpoint.parameters.map((param, pIdx) => (
                                        <tr key={pIdx} className="border-t">
                                          <td className="p-2">
                                            <code className="text-xs">{param.name}</code>
                                            {param.required && <span className="text-red-500 ml-1">*</span>}
                                            <Badge variant="outline" className="ml-2 text-[10px]">{param.in}</Badge>
                                          </td>
                                          <td className="p-2 text-muted-foreground">{param.type}</td>
                                          <td className="p-2 text-muted-foreground hidden md:table-cell">{param.description}</td>
                                          {isTryItOut && (
                                            <td className="p-2">
                                              <Input
                                                className="h-8 text-xs"
                                                placeholder={param.example || param.name}
                                                value={paramValues[param.name] || ''}
                                                onChange={(e) => setParamValues({ ...paramValues, [param.name]: e.target.value })}
                                              />
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Request Body */}
                            {endpoint.requestBody && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Corps de la requête</h4>
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                      <tr>
                                        <th className="text-left p-2 font-medium">Propriété</th>
                                        <th className="text-left p-2 font-medium">Type</th>
                                        <th className="text-left p-2 font-medium hidden md:table-cell">Description</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.entries(endpoint.requestBody.properties).map(([propName, prop], pIdx) => (
                                        <tr key={pIdx} className="border-t">
                                          <td className="p-2">
                                            <code className="text-xs">{propName}</code>
                                            {endpoint.requestBody?.required?.includes(propName) && (
                                              <span className="text-red-500 ml-1">*</span>
                                            )}
                                          </td>
                                          <td className="p-2 text-muted-foreground">{prop.type}</td>
                                          <td className="p-2 text-muted-foreground hidden md:table-cell">{prop.description}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                
                                {isTryItOut && (
                                  <div className="mt-2">
                                    <Label className="text-xs">Body JSON</Label>
                                    <Textarea
                                      className="font-mono text-xs mt-1"
                                      rows={5}
                                      placeholder={JSON.stringify(
                                        Object.fromEntries(
                                          Object.entries(endpoint.requestBody.properties).map(([k, v]) => [k, v.example || ''])
                                        ),
                                        null,
                                        2
                                      )}
                                      value={requestBody}
                                      onChange={(e) => setRequestBody(e.target.value)}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Responses */}
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Réponses</h4>
                              <div className="space-y-2">
                                {endpoint.responses.map((res, rIdx) => (
                                  <div key={rIdx} className="flex items-start gap-3 p-2 border rounded-lg">
                                    <Badge variant={res.code >= 400 ? 'destructive' : res.code >= 300 ? 'secondary' : 'default'}>
                                      {res.code}
                                    </Badge>
                                    <div className="flex-1">
                                      <p className="text-sm">{res.description}</p>
                                      {res.example && (
                                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                                          {JSON.stringify(res.example, null, 2)}
                                        </pre>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Code Examples & Try It Out */}
                            <Tabs defaultValue="curl" className="w-full">
                              <TabsList className="w-full justify-start">
                                <TabsTrigger value="curl" className="text-xs">
                                  <Code2 className="h-3 w-3 mr-1" />
                                  cURL
                                </TabsTrigger>
                                <TabsTrigger value="javascript" className="text-xs">JavaScript</TabsTrigger>
                                <TabsTrigger value="python" className="text-xs">Python</TabsTrigger>
                                <TabsTrigger value="try" className="text-xs">
                                  <Play className="h-3 w-3 mr-1" />
                                  Try it out
                                </TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="curl" className="mt-2">
                                <div className="relative">
                                  <pre className="text-xs bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto">
                                    {generateCurl(endpoint)}
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => copyToClipboard(generateCurl(endpoint), key)}
                                  >
                                    {copied === key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                  </Button>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="javascript" className="mt-2">
                                <pre className="text-xs bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto">
{`const response = await fetch('${API_BASE_URL}${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }${endpoint.requestBody ? `,
  body: JSON.stringify({
    // Your data here
  })` : ''}
});

const data = await response.json();`}
                                </pre>
                              </TabsContent>
                              
                              <TabsContent value="python" className="mt-2">
                                <pre className="text-xs bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto">
{`import requests

response = requests.${endpoint.method.toLowerCase()}(
    '${API_BASE_URL}${endpoint.path}',
    headers={'x-api-key': 'YOUR_API_KEY'}${endpoint.requestBody ? `,
    json={
        # Your data here
    }` : ''}
)

data = response.json()`}
                                </pre>
                              </TabsContent>
                              
                              <TabsContent value="try" className="mt-2">
                                <div className="space-y-3">
                                  {!isTryItOut ? (
                                    <Button onClick={() => setTryItOutEndpoint(key)}>
                                      <Play className="h-4 w-4 mr-2" />
                                      Activer Try It Out
                                    </Button>
                                  ) : (
                                    <>
                                      <div className="flex gap-2">
                                        <Button onClick={() => executeRequest(endpoint)} disabled={loading}>
                                          {loading ? 'Exécution...' : 'Exécuter'}
                                        </Button>
                                        <Button variant="outline" onClick={() => {
                                          setTryItOutEndpoint(null);
                                          setResponse(null);
                                          setParamValues({});
                                          setRequestBody('');
                                        }}>
                                          Annuler
                                        </Button>
                                      </div>
                                      
                                      {response && (
                                        <div className="border rounded-lg overflow-hidden">
                                          <div className="bg-muted px-3 py-2 flex items-center gap-2">
                                            <Badge variant={response.status >= 400 ? 'destructive' : 'default'}>
                                              {response.status}
                                            </Badge>
                                            <span className="text-sm">Réponse</span>
                                          </div>
                                          <pre className="text-xs p-4 overflow-x-auto max-h-[300px] overflow-y-auto">
                                            {(() => {
                                              try {
                                                return JSON.stringify(JSON.parse(response.body), null, 2);
                                              } catch {
                                                return response.body;
                                              }
                                            })()}
                                          </pre>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
