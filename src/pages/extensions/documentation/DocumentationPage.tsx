import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Book, Search, FileText, Code, ExternalLink, Star, Clock } from 'lucide-react'

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const docSections = [
    {
      id: 'getting-started',
      title: 'Prise en main',
      description: 'Guide d\'introduction pour débuter',
      articles: [
        { title: 'Installation rapide', readTime: '5 min', popularity: 95 },
        { title: 'Premiers pas', readTime: '10 min', popularity: 88 },
        { title: 'Configuration de base', readTime: '8 min', popularity: 82 }
      ]
    },
    {
      id: 'api',
      title: 'Référence API',
      description: 'Documentation complète des APIs',
      articles: [
        { title: 'Authentification', readTime: '15 min', popularity: 76 },
        { title: 'Endpoints disponibles', readTime: '20 min', popularity: 84 },
        { title: 'Gestion des erreurs', readTime: '12 min', popularity: 71 }
      ]
    },
    {
      id: 'development',
      title: 'Développement',
      description: 'Guides pour les développeurs',
      articles: [
        { title: 'Créer une extension', readTime: '30 min', popularity: 89 },
        { title: 'Hooks et événements', readTime: '25 min', popularity: 67 },
        { title: 'Tests et debugging', readTime: '18 min', popularity: 73 }
      ]
    },
    {
      id: 'integrations',
      title: 'Intégrations',
      description: 'Connecter avec d\'autres services',
      articles: [
        { title: 'Webhooks', readTime: '15 min', popularity: 78 },
        { title: 'API tierces', readTime: '22 min', popularity: 69 },
        { title: 'SSO Configuration', readTime: '20 min', popularity: 65 }
      ]
    }
  ]

  const popularArticles = [
    {
      title: 'Guide complet d\'installation',
      category: 'Prise en main',
      views: 12540,
      rating: 4.8,
      lastUpdated: '2024-01-10'
    },
    {
      title: 'Créer votre première extension',
      category: 'Développement',
      views: 8932,
      rating: 4.9,
      lastUpdated: '2024-01-08'
    },
    {
      title: 'Configuration des webhooks',
      category: 'Intégrations',
      views: 6721,
      rating: 4.7,
      lastUpdated: '2024-01-12'
    }
  ]

  const quickLinks = [
    { name: 'API Reference', icon: Code, url: '/extensions/api-docs' },
    { name: 'Tutoriels', icon: FileText, url: '/extensions/tutorials' },
    { name: 'Support', icon: ExternalLink, url: '/extensions/support' },
    { name: 'Changelog', icon: Clock, url: '/extensions/changelog' }
  ]

  const filteredSections = docSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.articles.some(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Documentation Extensions
        </h1>
        <p className="text-muted-foreground mt-2">
          Tout ce que vous devez savoir sur nos extensions
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher dans la documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex space-x-2">
          {quickLinks.map((link, index) => {
            const Icon = link.icon
            return (
              <Button key={index} variant="outline" size="sm">
                <Icon className="w-4 h-4 mr-2" />
                {link.name}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="sections" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="popular">Populaires</TabsTrigger>
              <TabsTrigger value="recent">Récents</TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="space-y-4">
              {filteredSections.map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Book className="w-5 h-5 mr-2" />
                      {section.title}
                    </CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {section.articles.map((article, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                          <div>
                            <h4 className="font-medium">{article.title}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {article.readTime}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                {article.popularity}%
                              </Badge>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="popular" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Articles les plus consultés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {popularArticles.map((article, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex-1">
                          <h4 className="font-semibold">{article.title}</h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span>{article.category}</span>
                            <span>{article.views.toLocaleString()} vues</span>
                            <div className="flex items-center">
                              <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" />
                              {article.rating}
                            </div>
                            <span>Mis à jour le {article.lastUpdated}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mises à jour récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Nouvelle API v2.0</h4>
                        <Badge>Nouveau</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Documentation mise à jour pour la nouvelle version de l'API avec support WebSocket.
                      </p>
                      <p className="text-xs text-muted-foreground">Publié le 15 janvier 2024</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Guide SSO amélioré</h4>
                        <Badge variant="outline">Mis à jour</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Nouveaux exemples d'intégration avec Azure AD et Google Workspace.
                      </p>
                      <p className="text-xs text-muted-foreground">Mis à jour le 12 janvier 2024</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Navigation rapide</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {docSections.map((section) => (
                    <div key={section.id}>
                      <Button variant="ghost" className="w-full justify-start font-semibold">
                        {section.title}
                      </Button>
                      <div className="ml-4 space-y-1">
                        {section.articles.map((article, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            className="w-full justify-start text-sm text-muted-foreground"
                            size="sm"
                          >
                            {article.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Besoin d'aide ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Contacter le support
              </Button>
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Tutoriels vidéo
              </Button>
              <Button variant="outline" className="w-full">
                <Code className="w-4 h-4 mr-2" />
                Exemples de code
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}