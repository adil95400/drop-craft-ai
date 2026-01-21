/**
 * Extension Developer Portal - Outils et documentation pour développeurs
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Book, Rocket, Terminal, GitBranch, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function ExtensionDeveloperPage() {
  const navigate = useNavigate();

  return (
    <ChannablePageWrapper
      title="Developer Portal"
      subtitle="Extensions SDK"
      description="Outils, documentation et ressources pour développer vos extensions ShopOpti."
      heroImage="extensions"
      badge={{
        label: "Développeurs",
        icon: Code
      }}
    >
      <Tabs defaultValue="quickstart" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
          <TabsTrigger value="sdk">SDK & Tools</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="quickstart" className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Créez votre première extension en quelques minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">1. Installation du CLI</h3>
                  <pre className="bg-background p-3 rounded text-sm overflow-x-auto">
                    npm install -g @shopopti/cli
                  </pre>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">2. Créer une nouvelle extension</h3>
                  <pre className="bg-background p-3 rounded text-sm overflow-x-auto">
                    shopopti init my-extension
                  </pre>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">3. Développer et tester</h3>
                  <pre className="bg-background p-3 rounded text-sm overflow-x-auto">
                    cd my-extension{'\n'}npm run dev
                  </pre>
                </div>

                <Button onClick={() => navigate('/extensions/cli')} className="w-full">
                  <Terminal className="h-4 w-4 mr-2" />
                  Installer le CLI
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>REST API</CardTitle>
                <CardDescription>API RESTful complète</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Badge>Products API</Badge>
                  <p className="text-sm text-muted-foreground">
                    Gestion complète du catalogue produits
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge>Orders API</Badge>
                  <p className="text-sm text-muted-foreground">
                    Traitement et suivi des commandes
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge>Suppliers API</Badge>
                  <p className="text-sm text-muted-foreground">
                    Intégration fournisseurs
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate('/integrations/api/documentation')}>
                  <Book className="h-4 w-4 mr-2" />
                  Voir la documentation
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>GraphQL API</CardTitle>
                <CardDescription>API GraphQL flexible</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Badge>Query</Badge>
                  <p className="text-sm text-muted-foreground">
                    Récupération de données optimisée
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge>Mutations</Badge>
                  <p className="text-sm text-muted-foreground">
                    Modifications de données sécurisées
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge>Subscriptions</Badge>
                  <p className="text-sm text-muted-foreground">
                    Mises à jour temps réel
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate('/integrations/api/documentation')}>
                  <Zap className="h-4 w-4 mr-2" />
                  GraphQL Playground
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sdk" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>JavaScript SDK</CardTitle>
                <CardDescription>SDK JavaScript/TypeScript</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto mb-4">
                  npm install @shopopti/sdk
                </pre>
                <Button variant="outline" className="w-full" onClick={() => toast.info('Repository GitHub bientôt disponible')}>
                  <GitBranch className="h-4 w-4 mr-2" />
                  GitHub Repository
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>React Hooks</CardTitle>
                <CardDescription>Hooks React prêts à l'emploi</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto mb-4">
                  npm install @shopopti/react
                </pre>
                <Button variant="outline" className="w-full" onClick={() => toast.info('Repository GitHub bientôt disponible')}>
                  <GitBranch className="h-4 w-4 mr-2" />
                  GitHub Repository
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>CLI Tools</CardTitle>
                <CardDescription>Outils en ligne de commande</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto mb-4">
                  npm install -g @shopopti/cli
                </pre>
                <Button variant="outline" className="w-full" onClick={() => navigate('/extensions/cli')}>
                  <Terminal className="h-4 w-4 mr-2" />
                  Documentation CLI
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Product Importer</CardTitle>
                <CardDescription>Extension d'import de produits</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Extension complète pour importer des produits depuis différentes sources
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/extensions/documentation#examples')}>
                  <Code className="h-4 w-4 mr-2" />
                  Voir le code
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Price Monitor</CardTitle>
                <CardDescription>Surveillance de prix concurrentiels</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Extension pour surveiller et ajuster les prix automatiquement
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/extensions/documentation#examples')}>
                  <Code className="h-4 w-4 mr-2" />
                  Voir le code
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Custom Analytics</CardTitle>
                <CardDescription>Dashboard analytics personnalisé</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Créez vos propres dashboards analytics avec visualisations custom
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/extensions/documentation#examples')}>
                  <Code className="h-4 w-4 mr-2" />
                  Voir le code
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Email Automation</CardTitle>
                <CardDescription>Automatisation email marketing</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Automatisez vos campagnes email avec des workflows personnalisés
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/extensions/documentation#examples')}>
                  <Code className="h-4 w-4 mr-2" />
                  Voir le code
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
