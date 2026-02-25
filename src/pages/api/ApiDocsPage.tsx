import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, FileJson, Key, Zap, Shield, Globe, BookOpen } from 'lucide-react';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  category: string;
  params?: string[];
}

const API_ENDPOINTS: ApiEndpoint[] = [
  // Products
  { method: 'GET', path: '/v1/products', description: 'List all products with pagination', auth: true, category: 'Products', params: ['page', 'per_page', 'status', 'category'] },
  { method: 'GET', path: '/v1/products/:id', description: 'Get a single product by ID', auth: true, category: 'Products' },
  { method: 'POST', path: '/v1/products', description: 'Create a new product', auth: true, category: 'Products' },
  { method: 'PATCH', path: '/v1/products/:id', description: 'Update an existing product', auth: true, category: 'Products' },
  { method: 'DELETE', path: '/v1/products/:id', description: 'Delete a product', auth: true, category: 'Products' },
  { method: 'POST', path: '/v1/products/bulk-update', description: 'Bulk update products', auth: true, category: 'Products', params: ['product_ids', 'fields'] },
  
  // Orders
  { method: 'GET', path: '/v1/orders', description: 'List all orders', auth: true, category: 'Orders', params: ['page', 'per_page', 'status', 'date_from', 'date_to'] },
  { method: 'GET', path: '/v1/orders/:id', description: 'Get a single order', auth: true, category: 'Orders' },
  { method: 'POST', path: '/v1/orders', description: 'Create an order', auth: true, category: 'Orders' },
  { method: 'PATCH', path: '/v1/orders/:id', description: 'Update order status', auth: true, category: 'Orders' },
  
  // Customers
  { method: 'GET', path: '/v1/customers', description: 'List all customers', auth: true, category: 'Customers', params: ['page', 'per_page', 'search'] },
  { method: 'GET', path: '/v1/customers/:id', description: 'Get customer details', auth: true, category: 'Customers' },
  
  // Analytics
  { method: 'GET', path: '/v1/analytics/kpis', description: 'Get real-time KPIs', auth: true, category: 'Analytics', params: ['period'] },
  { method: 'GET', path: '/v1/analytics/revenue', description: 'Revenue analytics', auth: true, category: 'Analytics', params: ['from', 'to', 'granularity'] },
  { method: 'GET', path: '/v1/analytics/predictions', description: 'AI sales predictions', auth: true, category: 'Analytics' },
  
  // Marketing
  { method: 'GET', path: '/v1/marketing/campaigns', description: 'List campaigns', auth: true, category: 'Marketing' },
  { method: 'POST', path: '/v1/marketing/campaigns', description: 'Create campaign', auth: true, category: 'Marketing' },
  
  // CRM
  { method: 'GET', path: '/v1/crm/leads', description: 'List leads', auth: true, category: 'CRM' },
  { method: 'GET', path: '/v1/crm/deals', description: 'List deals', auth: true, category: 'CRM' },
  
  // Pricing
  { method: 'GET', path: '/v1/pricing/rules', description: 'List pricing rules', auth: true, category: 'Pricing' },
  { method: 'POST', path: '/v1/pricing/simulate', description: 'Simulate pricing changes', auth: true, category: 'Pricing' },
  
  // Import
  { method: 'POST', path: '/v1/import/csv', description: 'Import products from CSV', auth: true, category: 'Import' },
  { method: 'POST', path: '/v1/import/url', description: 'Import product from URL', auth: true, category: 'Import' },
  { method: 'GET', path: '/v1/import/jobs', description: 'List import jobs', auth: true, category: 'Import' },
  { method: 'GET', path: '/v1/import/jobs/:id', description: 'Get import job status', auth: true, category: 'Import' },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const CODE_EXAMPLES = {
  javascript: `import { api } from '@/services/api/client';

// List products
const { items, meta } = await api.get('/products', {
  page: 1,
  per_page: 20,
  status: 'active'
});

// Create a product
const product = await api.post('/products', {
  name: 'New Product',
  price: 29.99,
  sku: 'SKU-001'
});`,
  python: `import requests

BASE_URL = "https://your-project.supabase.co/functions/v1/api-v1"
HEADERS = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

# List products
response = requests.get(
    f"{BASE_URL}/v1/products",
    headers=HEADERS,
    params={"page": 1, "per_page": 20}
)
products = response.json()`,
  curl: `# List products
curl -X GET \\
  "https://your-project.supabase.co/functions/v1/api-v1/v1/products?page=1&per_page=20" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Create a product
curl -X POST \\
  "https://your-project.supabase.co/functions/v1/api-v1/v1/products" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "New Product", "price": 29.99}'`,
};

export default function ApiDocsPage() {
  const { t } = useTranslation('extensions');
  const categories = [...new Set(API_ENDPOINTS.map(e => e.category))];

  return (
    <>
      <Helmet>
        <title>API Documentation - Drop-Craft AI</title>
        <meta name="description" content="Complete API reference for Drop-Craft AI. Endpoints for products, orders, customers, analytics and more." />
      </Helmet>
      
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            API Documentation
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete reference for the Drop-Craft AI REST API v1
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Base URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                /functions/v1/api-v1/v1
              </code>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                Bearer JWT Token
              </code>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Rate Limit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">60 req/min (Free) → 5000 req/min (Enterprise)</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="endpoints" className="space-y-4">
          <TabsList>
            <TabsTrigger value="endpoints">
              <FileJson className="h-4 w-4 mr-2" />
              Endpoints
            </TabsTrigger>
            <TabsTrigger value="examples">
              <Code className="h-4 w-4 mr-2" />
              Code Examples
            </TabsTrigger>
            <TabsTrigger value="auth">
              <Key className="h-4 w-4 mr-2" />
              Authentication
            </TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints">
            <div className="space-y-6">
              {categories.map(category => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle>{category}</CardTitle>
                    <CardDescription>
                      {API_ENDPOINTS.filter(e => e.category === category).length} endpoints
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {API_ENDPOINTS.filter(e => e.category === category).map((endpoint, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <Badge className={`${METHOD_COLORS[endpoint.method]} font-mono text-xs min-w-[60px] justify-center`}>
                            {endpoint.method}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                            <p className="text-sm text-muted-foreground mt-1">{endpoint.description}</p>
                            {endpoint.params && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {endpoint.params.map(p => (
                                  <Badge key={p} variant="outline" className="text-xs font-mono">
                                    {p}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {endpoint.auth && (
                            <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="examples">
            <Tabs defaultValue="javascript">
              <TabsList>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>
              {Object.entries(CODE_EXAMPLES).map(([lang, code]) => (
                <TabsContent key={lang} value={lang}>
                  <Card>
                    <CardContent className="pt-6">
                      <ScrollArea className="h-[400px]">
                        <pre className="text-sm font-mono bg-muted p-4 rounded-lg overflow-x-auto">
                          <code>{code}</code>
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="auth">
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                  All API requests require a valid JWT token or API key
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">JWT Token (recommended)</h3>
                  <pre className="text-sm font-mono bg-muted p-4 rounded-lg">
{`Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`}
                  </pre>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">API Key</h3>
                  <pre className="text-sm font-mono bg-muted p-4 rounded-lg">
{`apikey: sk_xxxxxxxx_xxxxxxxxxxxxxxxxxxxx`}
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    Generate API keys in Settings → API Keys. Keys are hashed and the full key is shown only once.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Rate Limiting</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { plan: 'Free', limit: '60/min' },
                      { plan: 'Pro', limit: '300/min' },
                      { plan: 'Ultra Pro', limit: '1000/min' },
                      { plan: 'Enterprise', limit: '5000/min' },
                    ].map(({ plan, limit }) => (
                      <div key={plan} className="p-3 rounded-lg border border-border text-center">
                        <p className="text-sm font-medium">{plan}</p>
                        <p className="text-lg font-bold text-primary">{limit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
