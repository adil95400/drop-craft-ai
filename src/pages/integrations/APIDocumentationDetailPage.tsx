import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Code, Zap, Shield, ArrowRight, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

const APIDocumentationDetailPage = () => {
  const navigate = useNavigate();

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié dans le presse-papiers');
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/products',
      description: 'Récupérer la liste des produits',
      params: ['limit', 'offset', 'category']
    },
    {
      method: 'POST',
      path: '/api/v1/products',
      description: 'Créer un nouveau produit',
      params: ['title', 'description', 'price', 'images']
    },
    {
      method: 'PUT',
      path: '/api/v1/products/:id',
      description: 'Mettre à jour un produit',
      params: ['title', 'description', 'price']
    },
    {
      method: 'DELETE',
      path: '/api/v1/products/:id',
      description: 'Supprimer un produit',
      params: []
    }
  ];

  const exampleCode = {
    javascript: `// Initialiser le client API
const ShopOpti = require('@shopopti/sdk');

const client = new ShopOpti({
  apiKey: 'your_api_key_here'
});

// Récupérer les produits
const products = await client.products.list({
  limit: 10,
  offset: 0
});

console.log(products);`,
    
    python: `# Initialiser le client API
from shopopti import ShopOpti

client = ShopOpti(api_key='your_api_key_here')

# Récupérer les produits
products = client.products.list(
    limit=10,
    offset=0
)

print(products)`,
    
    curl: `# Récupérer les produits
curl -X GET "https://api.shopopti.io/v1/products?limit=10&offset=0" \\
  -H "Authorization: Bearer your_api_key_here" \\
  -H "Content-Type: application/json"`
  };

  return (
    <>
      <Helmet>
        <title>Documentation API - Référence REST</title>
        <meta name="description" content="Documentation complète de l'API REST ShopOpti pour intégrer notre plateforme dans vos applications." />
      </Helmet>

      <ChannablePageWrapper
        title="Documentation API"
        subtitle="Référence REST"
        description="Référence complète de l'API REST ShopOpti pour intégrer notre plateforme"
        heroImage="schema"
        badge={{ label: 'v1.0', icon: Code }}
      >
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Book className="h-4 w-4 mr-2" />
                  Introduction
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Authentification
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Code className="h-4 w-4 mr-2" />
                  Endpoints
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Exemples
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle>Introduction</CardTitle>
                <CardDescription>
                  L'API ShopOpti vous permet d'intégrer toutes les fonctionnalités de notre plateforme dans vos applications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">URL de base</h3>
                  <code className="block bg-muted p-3 rounded-lg text-sm">
                    https://api.shopopti.io/v1
                  </code>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Format de réponse</h3>
                  <p className="text-muted-foreground">
                    Toutes les réponses sont au format JSON avec encodage UTF-8.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Authentication */}
            <Card>
              <CardHeader>
                <CardTitle>Authentification</CardTitle>
                <CardDescription>
                  Utilisez votre clé API pour authentifier vos requêtes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Incluez votre clé API dans le header Authorization de chaque requête :
                </p>
                <div className="relative">
                  <code className="block bg-muted p-4 rounded-lg text-sm">
                    Authorization: Bearer your_api_key_here
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard('Authorization: Bearer your_api_key_here')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={() => navigate('/settings/api')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Générer une clé API
                </Button>
              </CardContent>
            </Card>

            {/* Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle>Endpoints disponibles</CardTitle>
                <CardDescription>
                  Liste complète des endpoints de l'API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {endpoints.map((endpoint, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            endpoint.method === 'GET' ? 'default' :
                            endpoint.method === 'POST' ? 'secondary' :
                            endpoint.method === 'PUT' ? 'outline' : 'destructive'
                          }>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm">{endpoint.path}</code>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {endpoint.description}
                      </p>
                      {endpoint.params.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium">Paramètres :</span>
                          <div className="flex flex-wrap gap-2">
                            {endpoint.params.map((param, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {param}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Code Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Exemples de code</CardTitle>
                <CardDescription>
                  Démarrez rapidement avec ces exemples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="javascript">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="javascript" className="space-y-4">
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{exampleCode.javascript}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(exampleCode.javascript)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="python" className="space-y-4">
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{exampleCode.python}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(exampleCode.python)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="curl" className="space-y-4">
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{exampleCode.curl}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(exampleCode.curl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Help CTA */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-semibold">Besoin d'aide ?</h3>
                  <p className="text-muted-foreground">
                    Notre équipe de support est disponible 24/7 pour vous accompagner
                  </p>
                  <Button onClick={() => navigate('/contact')}>
                    Contacter le support
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ChannablePageWrapper>
    </>
  );
};

export default APIDocumentationDetailPage;
