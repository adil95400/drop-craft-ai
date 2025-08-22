import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Book,
  Code,
  Zap,
  Shield,
  Settings,
  Users,
  BarChart3,
  Package,
  CreditCard,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';

const Documentation = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const documentationSections = [
    {
      title: "Démarrage rapide",
      icon: Zap,
      description: "Configurez votre compte en quelques minutes",
      items: [
        { title: "Configuration initiale", href: "#setup", time: "5 min" },
        { title: "Premier import", href: "#first-import", time: "10 min" },
        { title: "Intégration e-commerce", href: "#integration", time: "15 min" }
      ]
    },
    {
      title: "API et Intégrations",
      icon: Code,
      description: "Connectez vos outils préférés",
      items: [
        { title: "API REST", href: "#api-rest", time: "Guide complet" },
        { title: "Webhooks", href: "#webhooks", time: "Guide avancé" },
        { title: "SDK JavaScript", href: "#sdk", time: "Documentation" }
      ]
    },
    {
      title: "Gestion des produits",
      icon: Package,
      description: "Optimisez votre catalogue",
      items: [
        { title: "Import en masse", href: "#bulk-import", time: "Guide" },
        { title: "Optimisation IA", href: "#ai-optimization", time: "Tutoriel" },
        { title: "Gestion du stock", href: "#inventory", time: "Manuel" }
      ]
    },
    {
      title: "Analytics et Rapports",
      icon: BarChart3,
      description: "Analysez vos performances",
      items: [
        { title: "Tableaux de bord", href: "#dashboards", time: "Guide" },
        { title: "Métriques avancées", href: "#metrics", time: "Documentation" },
        { title: "Export de données", href: "#export", time: "Tutoriel" }
      ]
    },
    {
      title: "Sécurité",
      icon: Shield,
      description: "Protégez vos données",
      items: [
        { title: "Authentification 2FA", href: "#2fa", time: "Configuration" },
        { title: "Gestion des permissions", href: "#permissions", time: "Guide" },
        { title: "Audit de sécurité", href: "#audit", time: "Documentation" }
      ]
    },
    {
      title: "Facturation",
      icon: CreditCard,
      description: "Gérez vos abonnements",
      items: [
        { title: "Plans et tarifs", href: "#pricing", time: "Information" },
        { title: "Gestion des factures", href: "#billing", time: "Guide" },
        { title: "Limites d'utilisation", href: "#limits", time: "Référence" }
      ]
    }
  ];

  const popularArticles = [
    {
      title: "Comment configurer votre première intégration ?",
      category: "Démarrage",
      readTime: "8 min",
      views: "15.2k"
    },
    {
      title: "Optimisation IA : maximiser vos conversions",
      category: "Advanced",
      readTime: "12 min",
      views: "8.7k"
    },
    {
      title: "Résolution des erreurs d'import courantes",
      category: "Dépannage",
      readTime: "6 min",
      views: "12.4k"
    },
    {
      title: "API REST : Guide complet avec exemples",
      category: "Développement",
      readTime: "20 min",
      views: "6.3k"
    }
  ];

  const filteredSections = documentationSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Book className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Tout ce que vous devez savoir pour tirer le meilleur parti de notre plateforme
        </p>
        
        {/* Search */}
        <div className="max-w-md mx-auto mt-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans la documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="guides" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-8">
          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Démarrage rapide
              </CardTitle>
              <CardDescription>
                Configurez votre compte en moins de 10 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-semibold">1. Configuration</div>
                    <div className="text-sm text-muted-foreground">Paramétrez votre compte</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-semibold">2. Intégration</div>
                    <div className="text-sm text-muted-foreground">Connectez vos outils</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-semibold">3. Premier import</div>
                    <div className="text-sm text-muted-foreground">Importez vos produits</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                      {section.title}
                    </CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer">
                          <span className="text-sm font-medium">{item.title}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{item.time}</Badge>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Popular Articles */}
          <Card>
            <CardHeader>
              <CardTitle>Articles populaires</CardTitle>
              <CardDescription>
                Les guides les plus consultés par notre communauté
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularArticles.map((article, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{article.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="outline">{article.category}</Badge>
                        <span>{article.readTime}</span>
                        <span>{article.views} vues</span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                API Reference
              </CardTitle>
              <CardDescription>
                Documentation technique complète pour les développeurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Endpoints principaux</h3>
                  <div className="space-y-2">
                    <div className="p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge>GET</Badge>
                        <code className="text-sm">/api/products</code>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Récupérer la liste des produits</p>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">POST</Badge>
                        <code className="text-sm">/api/products</code>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Créer un nouveau produit</p>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">PUT</Badge>
                        <code className="text-sm">/api/products/:id</code>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Mettre à jour un produit</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Authentification</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <code className="text-sm">
                      Authorization: Bearer YOUR_API_KEY
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Incluez votre clé API dans l'en-tête Authorization de chaque requête.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Questions fréquentes
              </CardTitle>
              <CardDescription>
                Réponses aux questions les plus courantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Comment puis-je importer mes produits en masse ?</h4>
                  <p className="text-sm text-muted-foreground">
                    Utilisez notre outil d'import en masse dans la section "Import". Vous pouvez importer via CSV, 
                    URL de flux ou API directement depuis vos fournisseurs.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">L'IA peut-elle optimiser automatiquement mes descriptions ?</h4>
                  <p className="text-sm text-muted-foreground">
                    Oui, notre IA analyse vos produits et génère des descriptions optimisées pour le SEO, 
                    traduit dans plusieurs langues et adaptées à votre audience.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Combien de produits puis-je importer ?</h4>
                  <p className="text-sm text-muted-foreground">
                    Les limites dépendent de votre plan : Standard (1000), Pro (10000), Ultra Pro (illimité).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact Support */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Besoin d'aide supplémentaire ?</h3>
            <p className="text-muted-foreground">
              Notre équipe support est là pour vous accompagner
            </p>
            <div className="flex justify-center gap-4">
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacter le support
              </Button>
              <Button variant="outline">
                Rejoindre la communauté
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documentation;