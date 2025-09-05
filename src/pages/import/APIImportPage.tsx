import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Helmet } from 'react-helmet-async';
import { 
  Zap, ArrowLeft, Play, Key, 
  TestTube, CheckCircle, AlertCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const APIImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [apiConfig, setApiConfig] = useState({
    url: '',
    method: 'GET',
    headers: '{}',
    body: '',
    apiKey: '',
    authType: 'none'
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    
    // Simulation de test API
    setTimeout(() => {
      setTestResult({
        success: true,
        status: 200,
        productCount: 1247,
        sampleData: {
          name: 'Example Product',
          price: 29.99,
          category: 'Electronics'
        }
      });
      setTesting(false);
      toast.success('Connexion API testée avec succès!');
    }, 2000);
  };

  const handleStartImport = async () => {
    setImporting(true);
    
    // Simulation d'import API
    setTimeout(() => {
      setImporting(false);
      toast.success('Import API terminé avec succès!');
    }, 5000);
  };

  const apiProviders = [
    { name: 'Shopify', icon: '🏪', status: 'Connecté' },
    { name: 'WooCommerce', icon: '🛒', status: 'Disponible' },
    { name: 'Amazon SP-API', icon: '📦', status: 'Disponible' },
    { name: 'eBay API', icon: '🏷️', status: 'Disponible' },
    { name: 'Magento', icon: '🔧', status: 'Disponible' },
    { name: 'PrestaShop', icon: '🛍️', status: 'Disponible' }
  ];

  const authTypes = [
    { value: 'none', label: 'Aucune' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'api-key', label: 'API Key' },
    { value: 'oauth', label: 'OAuth 2.0' }
  ];

  return (
    <>
      <Helmet>
        <title>Import API - Drop Craft AI</title>
        <meta name="description" content="Importez vos produits via API REST, GraphQL ou webhooks en temps réel." />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/import')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Import API</h1>
            <p className="text-muted-foreground">
              Connectez-vous directement aux APIs de vos fournisseurs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configuration API
              </CardTitle>
              <CardDescription>
                Configurez votre connexion API personnalisée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">URL de l'API</Label>
                <Input
                  id="api-url"
                  placeholder="https://api.example.com/products"
                  value={apiConfig.url}
                  onChange={(e) => setApiConfig({...apiConfig, url: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Méthode HTTP</Label>
                  <Select value={apiConfig.method} onValueChange={(value) => setApiConfig({...apiConfig, method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type d'authentification</Label>
                  <Select value={apiConfig.authType} onValueChange={(value) => setApiConfig({...apiConfig, authType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {authTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {apiConfig.authType !== 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="api-key">Clé API / Token</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Votre clé API ou token"
                    value={apiConfig.apiKey}
                    onChange={(e) => setApiConfig({...apiConfig, apiKey: e.target.value})}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="headers">Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  placeholder='{"Content-Type": "application/json"}'
                  value={apiConfig.headers}
                  onChange={(e) => setApiConfig({...apiConfig, headers: e.target.value})}
                  rows={3}
                />
              </div>

              {apiConfig.method !== 'GET' && (
                <div className="space-y-2">
                  <Label htmlFor="body">Body (JSON)</Label>
                  <Textarea
                    id="body"
                    placeholder='{"limit": 100, "category": "electronics"}'
                    value={apiConfig.body}
                    onChange={(e) => setApiConfig({...apiConfig, body: e.target.value})}
                    rows={4}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={testing || !apiConfig.url}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testing ? 'Test en cours...' : 'Tester la connexion'}
                </Button>
                <Button 
                  onClick={handleStartImport}
                  disabled={importing || !testResult?.success}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {importing ? 'Import en cours...' : 'Démarrer l\'import'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results & Providers */}
          <div className="space-y-6">
            {/* Test Results */}
            {testResult && (
              <Card>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    Résultat du test
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="font-medium">{testResult.status}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Produits détectés</div>
                      <div className="font-medium">{testResult.productCount}</div>
                    </div>
                  </div>

                  {testResult.sampleData && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Échantillon de données</div>
                      <div className="bg-muted p-3 rounded text-xs">
                        <pre>{JSON.stringify(testResult.sampleData, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* API Providers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Connexions rapides
                </CardTitle>
                <CardDescription>
                  Connectez-vous rapidement à vos plateformes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {apiProviders.map((provider) => (
                    <div key={provider.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{provider.icon}</span>
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={provider.status === 'Connecté' ? 'default' : 'outline'}>
                          {provider.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          {provider.status === 'Connecté' ? 'Configurer' : 'Connecter'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default APIImportPage;