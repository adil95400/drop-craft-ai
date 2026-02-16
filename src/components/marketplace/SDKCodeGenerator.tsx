/**
 * SDKCodeGenerator — Multi-language SDK snippets with copy
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Code, Download, Terminal } from 'lucide-react';
import { toast } from 'sonner';

const SDK_SNIPPETS: Record<string, Record<string, string>> = {
  'Produits': {
    javascript: `import ShopOpti from 'shopopti-sdk';

const client = new ShopOpti({ apiKey: 'YOUR_API_KEY' });

// List products
const products = await client.products.list({ limit: 50 });
console.log(products.items);

// Get single product
const product = await client.products.get('prod_123');

// Create product
const newProduct = await client.products.create({
  title: 'Mon Produit',
  price: 29.99,
  sku: 'SKU-001'
});`,
    python: `from shopopti import ShopOpti

client = ShopOpti(api_key="YOUR_API_KEY")

# List products
products = client.products.list(limit=50)
print(products.items)

# Get single product
product = client.products.get("prod_123")

# Create product
new_product = client.products.create(
    title="Mon Produit",
    price=29.99,
    sku="SKU-001"
)`,
    curl: `# List products
curl -X GET "https://api.shopopti.com/v1/products?limit=50" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Get product
curl -X GET "https://api.shopopti.com/v1/products/prod_123" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Create product
curl -X POST "https://api.shopopti.com/v1/products" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Mon Produit","price":29.99,"sku":"SKU-001"}'`,
  },
  'Commandes': {
    javascript: `// List orders
const orders = await client.orders.list({ status: 'pending' });

// Update order status
await client.orders.update('ord_456', { status: 'shipped' });

// Webhooks
client.webhooks.create({
  url: 'https://your-app.com/webhook',
  events: ['order.created', 'order.updated']
});`,
    python: `# List orders
orders = client.orders.list(status="pending")

# Update order status
client.orders.update("ord_456", status="shipped")

# Webhooks
client.webhooks.create(
    url="https://your-app.com/webhook",
    events=["order.created", "order.updated"]
)`,
    curl: `# List orders
curl -X GET "https://api.shopopti.com/v1/orders?status=pending" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Update order
curl -X PATCH "https://api.shopopti.com/v1/orders/ord_456" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"shipped"}'`,
  },
  'Inventaire': {
    javascript: `// Check stock
const stock = await client.inventory.get('SKU-001');

// Update stock
await client.inventory.update('SKU-001', { quantity: 150 });

// Bulk update
await client.inventory.bulkUpdate([
  { sku: 'SKU-001', quantity: 150 },
  { sku: 'SKU-002', quantity: 75 }
]);`,
    python: `# Check stock
stock = client.inventory.get("SKU-001")

# Update stock
client.inventory.update("SKU-001", quantity=150)

# Bulk update
client.inventory.bulk_update([
    {"sku": "SKU-001", "quantity": 150},
    {"sku": "SKU-002", "quantity": 75}
])`,
    curl: `# Check stock
curl -X GET "https://api.shopopti.com/v1/stock/SKU-001" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Update stock
curl -X PATCH "https://api.shopopti.com/v1/stock/SKU-001" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"quantity":150}'`,
  },
};

const LANGUAGES = [
  { key: 'javascript', label: 'JavaScript', icon: '🟨' },
  { key: 'python', label: 'Python', icon: '🐍' },
  { key: 'curl', label: 'cURL', icon: '🔗' },
];

export function SDKCodeGenerator() {
  const [copied, setCopied] = useState<string | null>(null);
  const [lang, setLang] = useState('javascript');

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopied(key);
    toast.success('Code copié !');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Code className="h-5 w-5 text-primary" /> SDK Développeur</h3>
          <p className="text-sm text-muted-foreground">Snippets prêts à l'emploi pour intégrer l'API ShopOpti</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> SDK Package</Button>
          <Button variant="outline" size="sm" className="gap-2"><Terminal className="h-4 w-4" /> npm install shopopti-sdk</Button>
        </div>
      </div>

      {/* Language selector */}
      <div className="flex gap-2">
        {LANGUAGES.map(l => (
          <Button key={l.key} variant={lang === l.key ? 'default' : 'outline'} size="sm" onClick={() => setLang(l.key)} className="gap-2">
            <span>{l.icon}</span> {l.label}
          </Button>
        ))}
      </div>

      {/* Code snippets by domain */}
      <Tabs defaultValue="Produits">
        <TabsList>
          {Object.keys(SDK_SNIPPETS).map(domain => (
            <TabsTrigger key={domain} value={domain}>{domain}</TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(SDK_SNIPPETS).map(([domain, snippets]) => (
          <TabsContent key={domain} value={domain}>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{domain} — {LANGUAGES.find(l => l.key === lang)?.label}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => copyCode(snippets[lang], `${domain}-${lang}`)} className="gap-2">
                  {copied === `${domain}-${lang}` ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  {copied === `${domain}-${lang}` ? 'Copié' : 'Copier'}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed">
                  <code>{snippets[lang]}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick reference */}
      <Card>
        <CardContent className="p-4">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div><Badge variant="outline">Base URL</Badge><p className="mt-1 font-mono text-xs">https://api.shopopti.com/v1</p></div>
            <div><Badge variant="outline">Auth</Badge><p className="mt-1 font-mono text-xs">Bearer Token (Header)</p></div>
            <div><Badge variant="outline">Rate Limit</Badge><p className="mt-1 font-mono text-xs">1000 req/min (Pro)</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
