import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Book, 
  Globe, 
  Key, 
  Shield, 
  Play, 
  Copy,
  ExternalLink,
  ChevronRight,
  Terminal,
  Database,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '@/components/navigation/BackButton';

const ApiDocs = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copié dans le presse-papier');
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/products',
      description: 'Récupérer tous les produits',
      params: ['limit', 'offset', 'category', 'status']
    },
    {
      method: 'POST',
      path: '/api/products',
      description: 'Créer un nouveau produit',
      params: ['name', 'description', 'price', 'category']
    },
    {
      method: 'GET',
      path: '/api/orders',
      description: 'Récupérer toutes les commandes',
      params: ['limit', 'offset', 'status', 'date_from', 'date_to']
    },
    {
      method: 'POST',
      path: '/api/tracking',
      description: 'Créer un suivi de colis',
      params: ['order_id', 'tracking_number', 'carrier']
    }
  ];

  const codeExamples = {
    javascript: `// Récupérer des produits
const response = await fetch('https://api.shopopti.com/v1/products', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const products = await response.json();
console.log(products);`,

    python: `import requests

# Configuration
api_key = "YOUR_API_KEY"
base_url = "https://api.shopopti.com/v1"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# Récupérer des produits
response = requests.get(f"{base_url}/products", headers=headers)
products = response.json()
print(products)`,

    curl: `# Récupérer des produits
curl -X GET "https://api.shopopti.com/v1/products" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Créer un produit
curl -X POST "https://api.shopopti.com/v1/products" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Nouveau Produit",
    "description": "Description du produit",
    "price": 29.99,
    "category": "electronics"
  }'`
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
      {/* Back Button */}
      <BackButton />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Documentation API
          </h1>
          <p className="text-muted-foreground mt-1">
            Guide complet pour intégrer l'API ShopOpti dans vos applications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Globe className="mr-2 h-4 w-4" />
            API Status
          </Button>
          <Button variant="hero">
            <Play className="mr-2 h-4 w-4" />
            Tester l'API
          </Button>
        </div>
      </div>

      {/* Quick Start */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Démarrage Rapide
          </CardTitle>
          <CardDescription>
            Commencez à utiliser l'API ShopOpti en quelques minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Obtenez votre clé API</h4>
                <p className="text-sm text-muted-foreground">Générez une clé API dans vos paramètres</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Faites votre premier appel</h4>
                <p className="text-sm text-muted-foreground">Testez avec l'endpoint /products</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Intégrez dans votre app</h4>
                <p className="text-sm text-muted-foreground">Utilisez nos exemples de code</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="endpoints" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="authentication">Authentification</TabsTrigger>
          <TabsTrigger value="examples">Exemples</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Endpoints Disponibles</CardTitle>
              <CardDescription>
                Liste complète des endpoints API avec leurs paramètres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {endpoints.map((endpoint, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                          className="font-mono"
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {endpoint.path}
                        </code>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {endpoint.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium">Paramètres:</span>
                      {endpoint.params.map((param, paramIndex) => (
                        <Badge key={paramIndex} variant="outline" className="text-xs">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Authentication Tab */}
        <TabsContent value="authentication">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentification
              </CardTitle>
              <CardDescription>
                Apprenez à authentifier vos requêtes API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Clé API</h4>
                <p className="text-sm text-muted-foreground">
                  Toutes les requêtes API doivent inclure votre clé API dans l'en-tête Authorization.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono">Authorization Header</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="text-sm">Authorization: Bearer YOUR_API_KEY</code>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Limites de débit</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="font-medium">Plan Starter</div>
                    <div className="text-sm text-muted-foreground">1,000 requêtes/heure</div>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="font-medium">Plan Professional</div>
                    <div className="text-sm text-muted-foreground">10,000 requêtes/heure</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Codes de statut</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <code className="text-sm">200</code>
                    <span className="text-sm">Succès</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <code className="text-sm">401</code>
                    <span className="text-sm">Non autorisé</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <code className="text-sm">429</code>
                    <span className="text-sm">Limite de débit dépassée</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <code className="text-sm">500</code>
                    <span className="text-sm">Erreur serveur</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Exemples de Code
              </CardTitle>
              <CardDescription>
                Exemples d'intégration dans différents langages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript" className="space-y-4">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>

                {Object.entries(codeExamples).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => copyToClipboard(code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code className="text-sm">{code}</code>
                      </pre>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks">
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Recevez des notifications en temps réel pour les événements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Événements disponibles</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="font-medium">order.created</div>
                    <div className="text-sm text-muted-foreground">Nouvelle commande créée</div>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="font-medium">order.updated</div>
                    <div className="text-sm text-muted-foreground">Statut de commande mis à jour</div>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="font-medium">product.created</div>
                    <div className="text-sm text-muted-foreground">Nouveau produit ajouté</div>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="font-medium">tracking.updated</div>
                    <div className="text-sm text-muted-foreground">Mise à jour du suivi</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Configuration</h4>
                <p className="text-sm text-muted-foreground">
                  Configurez vos webhooks dans les paramètres de votre compte. 
                  Nous enverrons une requête POST à votre URL avec les données de l'événement.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm font-mono">
                    POST https://votre-site.com/webhook
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Content-Type: application/json
                  </div>
                </div>
              </div>

              <Button variant="hero">
                <ExternalLink className="mr-2 h-4 w-4" />
                Configurer Webhooks
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Support Section */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Besoin d'aide ?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Terminal className="h-6 w-6 mb-2" />
              <div className="font-medium">API Explorer</div>
              <div className="text-sm text-muted-foreground">Testez les endpoints interactivement</div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Book className="h-6 w-6 mb-2" />
              <div className="font-medium">Guides Complets</div>
              <div className="text-sm text-muted-foreground">Tutoriels détaillés et cas d'usage</div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Shield className="h-6 w-6 mb-2" />
              <div className="font-medium">Support Technique</div>
              <div className="text-sm text-muted-foreground">Contactez notre équipe</div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiDocs;