import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, Copy, Check, Key, Book, Zap, Play, Terminal, Shield, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SUPABASE_URL } from '@/lib/supabase-env';

const API_BASE = `${SUPABASE_URL}/functions/v1/api-v1`;

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  category: string;
  scopes: string[];
  params?: { name: string; type: string; required: boolean; desc: string }[];
  bodyExample?: Record<string, any>;
  responseExample?: Record<string, any>;
}

const ENDPOINTS: Endpoint[] = [
  // Products
  { method: 'GET', path: '/products', description: 'Liste paginée des produits', category: 'Produits', scopes: ['products:read'], params: [{ name: 'limit', type: 'number', required: false, desc: 'Nombre max (défaut: 50)' }, { name: 'offset', type: 'number', required: false, desc: 'Décalage pagination' }, { name: 'category', type: 'string', required: false, desc: 'Filtrer par catégorie' }, { name: 'status', type: 'string', required: false, desc: 'active, draft, archived' }], responseExample: { data: [{ id: 'uuid', title: 'Produit A', price: 29.99, stock_quantity: 150, status: 'active' }], total: 1, limit: 50, offset: 0 } },
  { method: 'GET', path: '/products/:id', description: 'Détail d\'un produit', category: 'Produits', scopes: ['products:read'], responseExample: { id: 'uuid', title: 'Produit A', description: '...', price: 29.99, compare_at_price: 39.99, stock_quantity: 150, sku: 'SKU-001', status: 'active', images: [], tags: [], created_at: '2025-01-01T00:00:00Z' } },
  { method: 'POST', path: '/products', description: 'Créer un produit', category: 'Produits', scopes: ['products:write'], bodyExample: { title: 'Nouveau Produit', description: 'Description détaillée', price: 49.99, stock_quantity: 100, category: 'Électronique', sku: 'SKU-NEW' } },
  { method: 'PATCH', path: '/products/:id', description: 'Mettre à jour un produit', category: 'Produits', scopes: ['products:write'], bodyExample: { price: 39.99, stock_quantity: 200 } },
  { method: 'DELETE', path: '/products/:id', description: 'Supprimer un produit', category: 'Produits', scopes: ['products:delete'] },
  // Orders
  { method: 'GET', path: '/orders', description: 'Liste des commandes', category: 'Commandes', scopes: ['orders:read'], params: [{ name: 'status', type: 'string', required: false, desc: 'pending, processing, shipped, delivered, cancelled' }, { name: 'limit', type: 'number', required: false, desc: 'Nombre max' }] },
  { method: 'GET', path: '/orders/:id', description: 'Détail d\'une commande', category: 'Commandes', scopes: ['orders:read'] },
  { method: 'PATCH', path: '/orders/:id', description: 'Mettre à jour le statut', category: 'Commandes', scopes: ['orders:write'], bodyExample: { status: 'shipped', tracking_number: 'TR123456' } },
  // Customers
  { method: 'GET', path: '/customers', description: 'Liste des clients', category: 'Clients', scopes: ['customers:read'], params: [{ name: 'limit', type: 'number', required: false, desc: 'Nombre max' }, { name: 'search', type: 'string', required: false, desc: 'Recherche par nom/email' }] },
  { method: 'GET', path: '/customers/:id', description: 'Détail d\'un client', category: 'Clients', scopes: ['customers:read'] },
  // Analytics
  { method: 'GET', path: '/analytics/kpis', description: 'KPIs en temps réel', category: 'Analytics', scopes: ['analytics:read'], responseExample: { revenue_today: 1250.00, orders_today: 15, conversion_rate: 3.2, avg_order_value: 83.33 } },
  { method: 'GET', path: '/analytics/activity', description: 'Flux d\'activité récent', category: 'Analytics', scopes: ['analytics:read'] },
];

const RATE_LIMITS = [
  { plan: 'Free', rpm: 60, daily: 1000 },
  { plan: 'Pro', rpm: 300, daily: 10000 },
  { plan: 'Ultra Pro', rpm: 1000, daily: 50000 },
  { plan: 'Enterprise', rpm: 5000, daily: -1 },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  POST: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30',
  PUT: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  PATCH: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
  DELETE: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);
  const curlExample = buildCurl(endpoint);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
          <Badge variant="outline" className={`${METHOD_COLORS[endpoint.method]} font-mono text-xs min-w-[60px] justify-center`}>
            {endpoint.method}
          </Badge>
          <code className="text-sm font-mono flex-1">{endpoint.path}</code>
          <span className="text-sm text-muted-foreground hidden md:block">{endpoint.description}</span>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-4 mt-2 mb-4 space-y-3">
        <p className="text-sm text-muted-foreground">{endpoint.description}</p>

        <div className="flex flex-wrap gap-1">
          {endpoint.scopes.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
        </div>

        {endpoint.params && (
          <div>
            <p className="text-xs font-semibold mb-1">Paramètres de requête</p>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/50"><th className="px-3 py-1.5 text-left">Nom</th><th className="px-3 py-1.5 text-left">Type</th><th className="px-3 py-1.5 text-left">Requis</th><th className="px-3 py-1.5 text-left">Description</th></tr></thead>
                <tbody>
                  {endpoint.params.map(p => (
                    <tr key={p.name} className="border-t"><td className="px-3 py-1.5 font-mono">{p.name}</td><td className="px-3 py-1.5">{p.type}</td><td className="px-3 py-1.5">{p.required ? '✓' : '—'}</td><td className="px-3 py-1.5 text-muted-foreground">{p.desc}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {endpoint.bodyExample && (
          <div>
            <p className="text-xs font-semibold mb-1">Corps de la requête</p>
            <div className="bg-muted rounded-lg p-3 relative">
              <CopyButton text={JSON.stringify(endpoint.bodyExample, null, 2)} />
              <pre className="text-xs overflow-x-auto">{JSON.stringify(endpoint.bodyExample, null, 2)}</pre>
            </div>
          </div>
        )}

        {endpoint.responseExample && (
          <div>
            <p className="text-xs font-semibold mb-1">Réponse exemple</p>
            <div className="bg-muted rounded-lg p-3 relative">
              <CopyButton text={JSON.stringify(endpoint.responseExample, null, 2)} />
              <pre className="text-xs overflow-x-auto">{JSON.stringify(endpoint.responseExample, null, 2)}</pre>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold mb-1">cURL</p>
          <div className="bg-muted rounded-lg p-3 relative">
            <CopyButton text={curlExample} />
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{curlExample}</pre>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function buildCurl(ep: Endpoint): string {
  let cmd = `curl -X ${ep.method} "${API_BASE}${ep.path}" \\\n  -H "x-api-key: YOUR_API_KEY"`;
  if (ep.bodyExample) {
    cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(ep.bodyExample)}'`;
  }
  return cmd;
}

function ApiPlayground() {
  const [method, setMethod] = useState<string>('GET');
  const [path, setPath] = useState('/products');
  const [apiKey, setApiKey] = useState('');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const execute = async () => {
    if (!apiKey) { setResponse('⚠️ Entrez votre clé API'); return; }
    setLoading(true);
    try {
      const opts: RequestInit = {
        method,
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      };
      if (['POST', 'PUT', 'PATCH'].includes(method) && body) opts.body = body;
      const res = await fetch(`${API_BASE}${path}`, opts);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponse(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Play className="h-5 w-5 text-primary" /> API Playground</CardTitle>
        <CardDescription>Testez les endpoints en temps réel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium">Clé API</label>
          <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk_xxxxxxxx_xxxxxxxx..." className="font-mono text-sm" />
        </div>
        <div className="flex gap-2">
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={path} onChange={e => setPath(e.target.value)} placeholder="/products" className="font-mono text-sm flex-1" />
          <Button onClick={execute} disabled={loading}>
            {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Exécuter
          </Button>
        </div>
        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder='{"title": "Mon Produit", "price": 29.99}' className="font-mono text-xs min-h-[80px]" />
        )}
        {response && (
          <div className="bg-muted rounded-lg p-4 relative max-h-[400px] overflow-auto">
            <CopyButton text={response} />
            <pre className="text-xs whitespace-pre-wrap">{response}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function APIDocumentation() {
  const categories = [...new Set(ENDPOINTS.map(e => e.category))];

  return (
    <div className="space-y-6">
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          <strong>Base URL :</strong> <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{API_BASE}</code>
          <CopyButton text={API_BASE} />
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="endpoints"><Book className="h-4 w-4 mr-1" /> Endpoints</TabsTrigger>
          <TabsTrigger value="auth"><Shield className="h-4 w-4 mr-1" /> Auth</TabsTrigger>
          <TabsTrigger value="playground"><Play className="h-4 w-4 mr-1" /> Playground</TabsTrigger>
          <TabsTrigger value="sdks"><Code className="h-4 w-4 mr-1" /> SDKs</TabsTrigger>
          <TabsTrigger value="limits"><Clock className="h-4 w-4 mr-1" /> Limites</TabsTrigger>
        </TabsList>

        {/* ENDPOINTS */}
        <TabsContent value="endpoints" className="space-y-6">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="text-lg font-semibold mb-3">{cat}</h3>
              <div className="space-y-1">
                {ENDPOINTS.filter(e => e.category === cat).map((ep, i) => (
                  <EndpointCard key={i} endpoint={ep} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* AUTH */}
        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentification par clé API</CardTitle>
              <CardDescription>Toutes les requêtes nécessitent le header <code>x-api-key</code></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-xs">{`// Header requis pour chaque requête
x-api-key: sk_xxxxxxxx_xxxxxxxxxxxxxxxxxxxx

// Exemple complet
curl -X GET "${API_BASE}/products" \\
  -H "x-api-key: sk_xxxxxxxx_xxxxxxxxxxxxxxxxxxxx"`}</pre>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Scopes disponibles</h4>
                <div className="flex flex-wrap gap-2">
                  {['products:read', 'products:write', 'products:delete', 'orders:read', 'orders:write', 'customers:read', 'customers:write', 'analytics:read'].map(s => (
                    <Badge key={s} variant="outline" className="font-mono text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Codes de réponse</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2"><Badge className="bg-green-500/10 text-green-700 border-green-500/30" variant="outline">200</Badge> Succès</div>
                  <div className="flex items-center gap-2"><Badge className="bg-green-500/10 text-green-700 border-green-500/30" variant="outline">201</Badge> Créé</div>
                  <div className="flex items-center gap-2"><Badge className="bg-red-500/10 text-red-700 border-red-500/30" variant="outline">401</Badge> Non autorisé</div>
                  <div className="flex items-center gap-2"><Badge className="bg-red-500/10 text-red-700 border-red-500/30" variant="outline">403</Badge> Interdit (scope manquant)</div>
                  <div className="flex items-center gap-2"><Badge className="bg-red-500/10 text-red-700 border-red-500/30" variant="outline">404</Badge> Non trouvé</div>
                  <div className="flex items-center gap-2"><Badge className="bg-red-500/10 text-red-700 border-red-500/30" variant="outline">429</Badge> Rate limit atteint</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLAYGROUND */}
        <TabsContent value="playground">
          <ApiPlayground />
        </TabsContent>

        {/* SDKs */}
        <TabsContent value="sdks" className="space-y-4">
          {[
            { lang: 'JavaScript / Node.js', code: `const API_KEY = 'sk_xxxxxxxx_xxxx';
const BASE = '${API_BASE}';

// GET products
const res = await fetch(\`\${BASE}/products?limit=20\`, {
  headers: { 'x-api-key': API_KEY }
});
const { data } = await res.json();

// POST product
await fetch(\`\${BASE}/products\`, {
  method: 'POST',
  headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Nouveau', price: 29.99, stock_quantity: 50 })
});` },
            { lang: 'Python', code: `import requests

API_KEY = 'sk_xxxxxxxx_xxxx'
BASE = '${API_BASE}'
headers = {'x-api-key': API_KEY}

# GET products
products = requests.get(f'{BASE}/products', headers=headers).json()

# POST product
requests.post(f'{BASE}/products', headers=headers, json={
    'title': 'Nouveau', 'price': 29.99, 'stock_quantity': 50
})` },
            { lang: 'PHP', code: `<?php
$apiKey = 'sk_xxxxxxxx_xxxx';
$base = '${API_BASE}';

$ch = curl_init("$base/products");
curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER => ["x-api-key: $apiKey"],
    CURLOPT_RETURNTRANSFER => true,
]);
$data = json_decode(curl_exec($ch), true);
curl_close($ch);` },
          ].map(({ lang, code }) => (
            <Card key={lang}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Terminal className="h-4 w-4" /> {lang}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg relative">
                  <CopyButton text={code} />
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{code}</pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* RATE LIMITS */}
        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Limites de débit</CardTitle>
              <CardDescription>Les limites varient selon votre plan d'abonnement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/50"><th className="px-4 py-2 text-left">Plan</th><th className="px-4 py-2 text-left">Requêtes/min</th><th className="px-4 py-2 text-left">Requêtes/jour</th></tr></thead>
                  <tbody>
                    {RATE_LIMITS.map(r => (
                      <tr key={r.plan} className="border-t">
                        <td className="px-4 py-2 font-medium">{r.plan}</td>
                        <td className="px-4 py-2">{r.rpm}</td>
                        <td className="px-4 py-2">{r.daily === -1 ? 'Illimité' : r.daily.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-muted-foreground space-y-1">
                <p>• L'en-tête <code className="bg-muted px-1 rounded">X-RateLimit-Remaining</code> indique les requêtes restantes</p>
                <p>• En cas de dépassement, un code <code className="bg-muted px-1 rounded">429</code> est retourné avec un <code className="bg-muted px-1 rounded">Retry-After</code></p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
