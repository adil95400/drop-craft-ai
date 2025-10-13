import { Code, Key, Book, Terminal, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APIDocumentation } from '@/components/api/APIDocumentation';
import { APIKeyManager } from '@/components/api/APIKeyManager';

export default function APIDeveloperPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Code className="h-8 w-8 text-primary" />
            API Developer Console
          </h1>
          <p className="text-muted-foreground mt-2">
            Documentation API, gestion des clés et outils pour développeurs
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
          <TabsTrigger value="playground">
            <Terminal className="mr-2 h-4 w-4" />
            Playground
          </TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="space-y-4">
          <APIDocumentation />
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <APIKeyManager />
        </TabsContent>

        <TabsContent value="playground" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                API Playground
              </CardTitle>
              <CardDescription>
                Testez vos endpoints API directement depuis le navigateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-sm">
                    <code>{`// Example API Request
fetch('https://api.example.com/products', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data));`}</code>
                  </pre>
                </div>

                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
                        Playground Interactif Bientôt Disponible
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Un playground interactif avec éditeur de code et réponses en temps réel 
                      sera disponible dans une prochaine version.
                    </p>
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
