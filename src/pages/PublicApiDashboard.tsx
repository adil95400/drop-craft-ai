import { ChannablePageWrapper } from "@/components/channable/ChannablePageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Copy, ExternalLink, Key, Layers, Shield, Zap } from "lucide-react";
import { useApiUsageV2, useRateLimitsV2, useOpenApiSpec } from "@/hooks/usePublicApiV2";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const SDK_SNIPPETS = {
  javascript: `import { ShopOptiClient } from '@shopopti/sdk';

const client = new ShopOptiClient({
  apiKey: 'sk_your_api_key_here',
});

// List products
const products = await client.products.list({ limit: 20 });

// Get single order
const order = await client.orders.get('order-id');`,
  python: `from shopopti import ShopOptiClient

client = ShopOptiClient(api_key="sk_your_api_key_here")

# List products
products = client.products.list(limit=20)

# Get single order
order = client.orders.get("order-id")`,
  curl: `# List products
curl -X POST \\
  https://api.shopopti.io/functions/v1/public-api-gateway \\
  -H "x-api-key: sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "list_products", "limit": 20}'

# Get order
curl -X POST \\
  https://api.shopopti.io/functions/v1/public-api-gateway \\
  -H "x-api-key: sk_your_api_key_here" \\
  -d '{"action": "get_order", "order_id": "..."}'`,
};

const ENDPOINTS = [
  { action: "list_products", method: "POST", description: "Liste paginée des produits", params: "limit, offset, status" },
  { action: "get_product", method: "POST", description: "Détail d'un produit", params: "product_id (requis)" },
  { action: "list_orders", method: "POST", description: "Liste paginée des commandes", params: "limit, offset, status" },
  { action: "get_order", method: "POST", description: "Détail d'une commande", params: "order_id (requis)" },
  { action: "list_customers", method: "POST", description: "Liste paginée des clients", params: "limit, offset" },
  { action: "api_usage", method: "POST", description: "Statistiques d'utilisation", params: "—" },
  { action: "rate_limits", method: "POST", description: "Limites du plan actuel", params: "—" },
  { action: "openapi_spec", method: "POST", description: "Spécification OpenAPI 3.0", params: "—" },
];

export default function PublicApiDashboard() {
  const { data: usage, isLoading: usageLoading } = useApiUsageV2();
  const { data: limits } = useRateLimitsV2();
  const { toast } = useToast();

  const copySnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copié !", description: "Code copié dans le presse-papiers" });
  };

  return (
    <ChannablePageWrapper title="API Publique">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Code2 className="h-6 w-6 text-primary" />
              API Publique
            </h1>
            <p className="text-muted-foreground mt-1">Documentation, SDK et monitoring de l'API REST</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1.5">
              <Layers className="h-3 w-3 mr-1" /> v1.0
            </Badge>
            <Badge className="px-3 py-1.5 bg-success/15 text-emerald-700 border-emerald-500/30">
              <Shield className="h-3 w-3 mr-1" /> Stable
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              {usageLoading ? <Skeleton className="h-14 w-full" /> : (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-info/10"><Zap className="h-5 w-5 text-info" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Requêtes aujourd'hui</p>
                    <p className="text-2xl font-bold">{usage?.today?.total_requests ?? 0}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-warning/10"><Key className="h-5 w-5 text-warning" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Clés API actives</p>
                  <p className="text-2xl font-bold">{usage?.api_keys?.filter((k: any) => k.is_active).length ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10"><Shield className="h-5 w-5 text-purple-500" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Rate limit</p>
                  <p className="text-2xl font-bold">{limits?.limits?.rpm ?? 60} RPM</p>
                  <p className="text-xs text-muted-foreground">Plan : {limits?.plan ?? "free"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="endpoints">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="sdk">SDK & Exemples</TabsTrigger>
            <TabsTrigger value="keys">Clés API</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Endpoints disponibles</CardTitle>
                <CardDescription>Tous les endpoints sont accessibles via POST avec un body JSON contenant "action"</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ENDPOINTS.map((ep) => (
                    <div key={ep.action} className="flex items-center gap-4 py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Badge variant="outline" className="font-mono text-xs shrink-0 bg-info/10 text-blue-700">{ep.method}</Badge>
                      <code className="font-mono text-sm font-medium flex-1">{ep.action}</code>
                      <span className="text-sm text-muted-foreground hidden md:block">{ep.description}</span>
                      <span className="text-xs text-muted-foreground hidden lg:block font-mono">{ep.params}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sdk" className="mt-4 space-y-4">
            {Object.entries(SDK_SNIPPETS).map(([lang, code]) => (
              <Card key={lang}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base capitalize">{lang}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => copySnippet(code)}>
                      <Copy className="h-4 w-4 mr-1" /> Copier
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm font-mono">
                    <code>{code}</code>
                  </pre>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="keys" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Clés API</CardTitle>
                <CardDescription>Gérez vos clés d'accès. Les clés sont hachées SHA-256 côté serveur.</CardDescription>
              </CardHeader>
              <CardContent>
                {usageLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (usage?.api_keys || []).length > 0 ? (
                  <div className="space-y-2">
                    {usage.api_keys.map((key: any) => (
                      <div key={key.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{key.name}</p>
                            <p className="text-xs font-mono text-muted-foreground">{key.key_prefix}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {key.last_used_at && (
                            <span className="text-xs text-muted-foreground">
                              Dernière utilisation : {new Date(key.last_used_at).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                          <Badge variant={key.is_active ? "default" : "secondary"}>
                            {key.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Key className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Aucune clé API</p>
                    <p className="text-sm text-muted-foreground">Créez une clé dans Paramètres → Extensions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ChannablePageWrapper>
  );
}
