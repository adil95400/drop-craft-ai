import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code, Copy, Check, Key, Book, Zap } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function APIDocumentation() {
  const [copied, setCopied] = useState(false);
  
  const apiUrl = 'https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/public-api';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/products',
      description: 'Liste tous les produits',
      params: ['limit', 'offset', 'category'],
      example: `curl -X GET "${apiUrl}/products?limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`
    },
    {
      method: 'POST',
      path: '/products',
      description: 'Créer un nouveau produit',
      body: {
        name: 'Produit exemple',
        description: 'Description du produit',
        price: 99.99,
        stock: 100,
        category: 'Électronique'
      },
      example: `curl -X POST "${apiUrl}/products" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Produit","price":99.99}'`
    },
    {
      method: 'GET',
      path: '/products/{id}',
      description: 'Obtenir un produit par ID',
      example: `curl -X GET "${apiUrl}/products/{product-id}" \\
  -H "x-api-key: YOUR_API_KEY"`
    },
    {
      method: 'PUT',
      path: '/products/{id}',
      description: 'Mettre à jour un produit',
      example: `curl -X PUT "${apiUrl}/products/{product-id}" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"price":89.99}'`
    },
    {
      method: 'DELETE',
      path: '/products/{id}',
      description: 'Supprimer un produit',
      example: `curl -X DELETE "${apiUrl}/products/{product-id}" \\
  -H "x-api-key: YOUR_API_KEY"`
    },
    {
      method: 'GET',
      path: '/orders',
      description: 'Liste toutes les commandes',
      params: ['limit', 'status'],
      example: `curl -X GET "${apiUrl}/orders?status=pending" \\
  -H "x-api-key: YOUR_API_KEY"`
    },
    {
      method: 'GET',
      path: '/customers',
      description: 'Liste tous les clients',
      example: `curl -X GET "${apiUrl}/customers" \\
  -H "x-api-key: YOUR_API_KEY"`
    },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-500';
      case 'POST': return 'bg-green-500';
      case 'PUT': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
          <Book className="h-10 w-10 text-primary" />
          Documentation API
        </h1>
        <p className="text-muted-foreground text-lg">
          API REST complète pour gérer vos produits, commandes et clients
        </p>
      </div>

      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          <strong>Base URL:</strong> <code className="bg-muted px-2 py-1 rounded">{apiUrl}</code>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="quickstart" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quickstart">
            <Zap className="h-4 w-4 mr-2" />
            Démarrage rapide
          </TabsTrigger>
          <TabsTrigger value="authentication">Authentification</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Exemples</TabsTrigger>
        </TabsList>

        <TabsContent value="quickstart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guide de démarrage rapide</CardTitle>
              <CardDescription>
                Commencez à utiliser l'API en 3 étapes simples
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Générer une clé API</h3>
                    <p className="text-sm text-muted-foreground">
                      Allez dans Paramètres → Clés API et créez une nouvelle clé
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Faire votre premier appel</h3>
                    <div className="bg-muted p-3 rounded-lg mt-2">
                      <code className="text-xs">
                        curl -X GET "{apiUrl}/products" \<br/>
                        &nbsp;&nbsp;-H "x-api-key: YOUR_API_KEY"
                      </code>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Explorer la documentation</h3>
                    <p className="text-sm text-muted-foreground">
                      Parcourez tous les endpoints disponibles dans l'onglet "Endpoints"
                    </p>
                  </div>
                </div>
              </div>

              <Button className="w-full" asChild>
                <a href={`${apiUrl}/docs`} target="_blank" rel="noopener noreferrer">
                  <Book className="mr-2 h-4 w-4" />
                  Voir la spécification OpenAPI
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentification par clé API</CardTitle>
              <CardDescription>
                Toutes les requêtes nécessitent une clé API valide
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Header requis:</h3>
                <div className="bg-muted p-3 rounded-lg">
                  <code>x-api-key: your_api_key_here</code>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Sécurité:</strong> Ne partagez jamais votre clé API publiquement. 
                  Gardez-la confidentielle et stockez-la de manière sécurisée.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="font-semibold">Codes de réponse:</h3>
                <ul className="space-y-1 text-sm">
                  <li>• <Badge variant="outline">200</Badge> Succès</li>
                  <li>• <Badge variant="outline">201</Badge> Créé</li>
                  <li>• <Badge variant="outline">204</Badge> Supprimé</li>
                  <li>• <Badge variant="destructive">401</Badge> Non autorisé (clé API invalide)</li>
                  <li>• <Badge variant="destructive">404</Badge> Ressource non trouvée</li>
                  <li>• <Badge variant="destructive">500</Badge> Erreur serveur</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          {endpoints.map((endpoint, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getMethodColor(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm">{endpoint.path}</code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(endpoint.example)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <CardDescription>{endpoint.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {endpoint.params && (
                  <div>
                    <div className="text-sm font-semibold mb-2">Paramètres de requête:</div>
                    <div className="flex flex-wrap gap-2">
                      {endpoint.params.map((param, i) => (
                        <Badge key={i} variant="secondary">{param}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {endpoint.body && (
                  <div>
                    <div className="text-sm font-semibold mb-2">Corps de la requête:</div>
                    <div className="bg-muted p-3 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(endpoint.body, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Exemple cURL:
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {endpoint.example}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exemples d'intégration</CardTitle>
              <CardDescription>
                Code d'exemple dans différents langages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">JavaScript / Node.js</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-xs overflow-x-auto">{`const response = await fetch('${apiUrl}/products', {
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}</pre>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Python</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-xs overflow-x-auto">{`import requests

response = requests.get(
    '${apiUrl}/products',
    headers={'x-api-key': 'YOUR_API_KEY'}
)

data = response.json()
print(data)`}</pre>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">PHP</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-xs overflow-x-auto">{`$ch = curl_init('${apiUrl}/products');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: YOUR_API_KEY'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$data = json_decode($response, true);`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
