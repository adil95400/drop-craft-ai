/**
 * Developer Portal — API publique, documentation, clés API, webhooks, sandbox
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Code, Key, Webhook, Terminal, Book, Rocket, GitBranch } from 'lucide-react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { APIDocsBrowser, APIKeysManager, WebhooksConfig, APISandbox } from '@/components/developer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'

export default function ExtensionDeveloperPage() {
  const navigate = useNavigate()

  return (
    <ChannablePageWrapper
      title="Developer Portal"
      description="API publique, documentation interactive, webhooks et sandbox de test"
      heroImage="extensions"
      badge={{ label: 'Développeurs', icon: Code }}
    >
      <Tabs defaultValue="api-docs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="api-docs" className="text-xs gap-1"><Book className="h-3.5 w-3.5" /> API Docs</TabsTrigger>
          <TabsTrigger value="sandbox" className="text-xs gap-1"><Terminal className="h-3.5 w-3.5" /> Sandbox</TabsTrigger>
          <TabsTrigger value="keys" className="text-xs gap-1"><Key className="h-3.5 w-3.5" /> Clés API</TabsTrigger>
          <TabsTrigger value="webhooks" className="text-xs gap-1"><Webhook className="h-3.5 w-3.5" /> Webhooks</TabsTrigger>
          <TabsTrigger value="quickstart" className="text-xs gap-1"><Rocket className="h-3.5 w-3.5" /> Quick Start</TabsTrigger>
          <TabsTrigger value="sdk" className="text-xs gap-1"><GitBranch className="h-3.5 w-3.5" /> SDK</TabsTrigger>
        </TabsList>

        <TabsContent value="api-docs">
          <APIDocsBrowser />
        </TabsContent>

        <TabsContent value="sandbox">
          <APISandbox />
        </TabsContent>

        <TabsContent value="keys">
          <APIKeysManager />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhooksConfig />
        </TabsContent>

        <TabsContent value="quickstart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Getting Started
              </CardTitle>
              <CardDescription>Intégrez l'API ShopOpti en quelques minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">1. Obtenez votre clé API</h3>
                <p className="text-sm text-muted-foreground mb-2">Créez une clé dans l'onglet "Clés API" ci-dessus.</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">2. Faites votre premier appel</h3>
                <pre className="bg-background p-3 rounded text-sm overflow-x-auto font-mono">
{`curl -X GET \\
  https://api.shopopti.com/v1/products \\
  -H "Authorization: Bearer sk_test_..." \\
  -H "Content-Type: application/json"`}
                </pre>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">3. Configurez les webhooks</h3>
                <p className="text-sm text-muted-foreground">Recevez des notifications en temps réel pour chaque événement.</p>
              </div>
              <Button onClick={() => navigate('/extensions/cli')} className="w-full gap-2">
                <Terminal className="h-4 w-4" />
                Installer le CLI
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdk" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'JavaScript SDK', desc: 'SDK TypeScript/JavaScript', cmd: 'npm install @shopopti/sdk' },
              { title: 'React Hooks', desc: 'Hooks React prêts à l\'emploi', cmd: 'npm install @shopopti/react' },
              { title: 'CLI Tools', desc: 'Outils en ligne de commande', cmd: 'npm install -g @shopopti/cli' },
            ].map(sdk => (
              <Card key={sdk.title}>
                <CardHeader>
                  <CardTitle className="text-base">{sdk.title}</CardTitle>
                  <CardDescription>{sdk.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto mb-3 font-mono">{sdk.cmd}</pre>
                  <Badge variant="outline" className="text-xs">Bientôt disponible</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
