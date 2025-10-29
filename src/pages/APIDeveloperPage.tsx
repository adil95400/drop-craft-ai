import { Code, Key, Book, Terminal, Zap, Activity, Webhook } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APIDocumentation } from '@/components/api/APIDocumentation';
import { AdvancedAPIKeyManager } from '@/components/api/AdvancedAPIKeyManager';
import { APIAnalyticsDashboard } from '@/components/api/APIAnalyticsDashboard';
import { WebhookManager } from '@/components/api/WebhookManager';
import { Badge } from '@/components/ui/badge';

export default function APIDeveloperPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Code className="h-8 w-8 text-primary" />
            API Developer Console
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Entreprise
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Plateforme API complète : Documentation, clés, webhooks, analytics et monitoring
          </p>
        </div>
      </div>

      <Tabs defaultValue="docs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="docs">
            <Book className="mr-2 h-4 w-4" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="keys">
            <Key className="mr-2 h-4 w-4" />
            Clés API
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="mr-2 h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Activity className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="playground">
            <Terminal className="mr-2 h-4 w-4" />
            Playground
          </TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="space-y-4">
          <APIDocumentation />
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <AdvancedAPIKeyManager />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <WebhookManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <APIAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="playground" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                API Playground Interactif
              </CardTitle>
              <CardDescription>
                Testez vos endpoints API directement depuis le navigateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-sm">
                    <code>{`// Example API Request with Authentication
const response = await fetch('https://api.dropcraft.ai/v1/products', {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}</code>
                  </pre>
                </div>

                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
                        Playground Interactif avec éditeur de code
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                      Testez vos requêtes API en temps réel avec notre éditeur interactif. 
                      Fonctionnalités disponibles :
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4">
                      <li>• Coloration syntaxique</li>
                      <li>• Autocomplétion des endpoints</li>
                      <li>• Historique des requêtes</li>
                      <li>• Génération automatique de code (cURL, Python, JS)</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
