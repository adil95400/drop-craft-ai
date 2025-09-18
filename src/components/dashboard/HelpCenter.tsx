import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  HelpCircle, 
  Search, 
  Book, 
  Video, 
  MessageSquare,
  ExternalLink,
  ChevronRight,
  Lightbulb,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Settings,
  Star,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

interface HelpArticle {
  id: string
  title: string
  category: string
  description: string
  readTime: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  popular: boolean
  videoAvailable: boolean
}

interface HelpCategory {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  articles: number
  description: string
}

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories: HelpCategory[] = [
    {
      id: 'getting-started',
      name: 'Premiers pas',
      icon: Lightbulb,
      articles: 12,
      description: 'Configuration initiale et bases de ShopOpti+'
    },
    {
      id: 'automation',
      name: 'Automatisation',
      icon: Zap,
      articles: 8,
      description: 'Automatisez vos processus business'
    },
    {
      id: 'analytics',
      name: 'Analytics & KPI',
      icon: TrendingUp,
      articles: 15,
      description: 'Analysez vos performances et KPI'
    },
    {
      id: 'customers',
      name: 'Gestion Clients',
      icon: Users,
      articles: 10,
      description: 'CRM et relation client'
    },
    {
      id: 'security',
      name: 'Sécurité',
      icon: Shield,
      articles: 6,
      description: 'Protégez vos données et accès'
    },
    {
      id: 'settings',
      name: 'Configuration',
      icon: Settings,
      articles: 9,
      description: 'Paramètres et personnalisation'
    }
  ]

  const articles: HelpArticle[] = [
    {
      id: '1',
      title: 'Configuration de votre premier dashboard',
      category: 'getting-started',
      description: 'Apprenez à configurer et personnaliser votre dashboard principal pour suivre vos KPI essentiels.',
      readTime: 5,
      difficulty: 'beginner',
      tags: ['dashboard', 'kpi', 'configuration'],
      popular: true,
      videoAvailable: true
    },
    {
      id: '2',
      title: 'Automatiser la gestion des stocks',
      category: 'automation',
      description: 'Créez des règles intelligentes pour le réapprovisionnement automatique de vos produits.',
      readTime: 8,
      difficulty: 'intermediate',
      tags: ['stock', 'automatisation', 'réapprovisionnement'],
      popular: true,
      videoAvailable: false
    },
    {
      id: '3',
      title: 'Analyser vos performances de vente',
      category: 'analytics',
      description: 'Utilisez les outils d\'analyse avancés pour comprendre et optimiser vos performances.',
      readTime: 12,
      difficulty: 'intermediate',
      tags: ['analytics', 'ventes', 'performance'],
      popular: false,
      videoAvailable: true
    },
    {
      id: '4',
      title: 'Configurer les alertes de sécurité',
      category: 'security',
      description: 'Mettez en place un système de surveillance et d\'alertes pour protéger votre boutique.',
      readTime: 7,
      difficulty: 'advanced',
      tags: ['sécurité', 'alertes', 'surveillance'],
      popular: false,
      videoAvailable: false
    },
    {
      id: '5',
      title: 'Segmentation avancée des clients',
      category: 'customers',
      description: 'Créez des segments clients intelligents pour des campagnes marketing ciblées.',
      readTime: 10,
      difficulty: 'advanced',
      tags: ['clients', 'segmentation', 'marketing'],
      popular: true,
      videoAvailable: true
    },
    {
      id: '6',
      title: 'Personnaliser votre interface',
      category: 'settings',
      description: 'Adaptez ShopOpti+ à vos besoins avec les options de personnalisation avancées.',
      readTime: 6,
      difficulty: 'beginner',
      tags: ['interface', 'personnalisation', 'thème'],
      popular: false,
      videoAvailable: false
    }
  ]

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = !selectedCategory || article.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const popularArticles = articles.filter(article => article.popular)

  const getDifficultyColor = (difficulty: HelpArticle['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500'
      case 'intermediate': return 'bg-yellow-500'
      case 'advanced': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDifficultyLabel = (difficulty: HelpArticle['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'Débutant'
      case 'intermediate': return 'Intermédiaire'
      case 'advanced': return 'Avancé'
      default: return difficulty
    }
  }

  const openArticle = (articleId: string) => {
    toast.success(`Ouverture de l'article: ${articles.find(a => a.id === articleId)?.title}`)
  }

  const startTour = () => {
    toast.success('🎯 Visite guidée démarrée ! Suivez les instructions à l\'écran.')
  }

  const contactSupport = () => {
    toast.success('💬 Demande de support envoyée. Notre équipe vous répondra sous 24h.')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-blue-500" />
                Centre d'Aide ShopOpti+
              </CardTitle>
              <CardDescription className="text-lg">
                Trouvez rapidement les réponses à vos questions et apprenez à optimiser votre utilisation
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={startTour}>
                <Lightbulb className="h-4 w-4 mr-2" />
                Visite Guidée
              </Button>
              <Button onClick={contactSupport}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacter le Support
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher dans la documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catégories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(null)}
                >
                  Tous les articles ({articles.length})
                </Button>
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {category.name} ({category.articles})
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Liens Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Video className="h-4 w-4 mr-2" />
                  Tutoriels Vidéo
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Book className="h-4 w-4 mr-2" />
                  Guide Utilisateur
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Communauté
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Popular Articles */}
          {!searchQuery && !selectedCategory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Articles Populaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {popularArticles.map((article) => (
                    <div
                      key={article.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => openArticle(article.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{article.title}</h4>
                            {article.videoAvailable && (
                              <Badge variant="secondary" className="text-xs">
                                <Video className="h-3 w-3 mr-1" />
                                Vidéo
                              </Badge>
                            )}
                            <Badge className={`${getDifficultyColor(article.difficulty)} text-white text-xs`}>
                              {getDifficultyLabel(article.difficulty)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{article.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.readTime} min
                            </div>
                            <div className="flex gap-1">
                              {article.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results or Category Articles */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCategory 
                  ? `${categories.find(c => c.id === selectedCategory)?.name} (${filteredArticles.length})`
                  : searchQuery 
                    ? `Résultats de recherche (${filteredArticles.length})`
                    : 'Tous les articles'
                }
              </CardTitle>
              {selectedCategory && (
                <CardDescription>
                  {categories.find(c => c.id === selectedCategory)?.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredArticles.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun article trouvé pour votre recherche</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedCategory(null)
                        }}
                      >
                        Voir tous les articles
                      </Button>
                    </div>
                  ) : (
                    filteredArticles.map((article, index) => (
                      <div key={article.id}>
                        <div
                          className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all"
                          onClick={() => openArticle(article.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-lg">{article.title}</h4>
                                {article.popular && (
                                  <Star className="h-4 w-4 text-yellow-500" />
                                )}
                                {article.videoAvailable && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Video className="h-3 w-3 mr-1" />
                                    Vidéo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 mb-3">{article.description}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {article.readTime} min de lecture
                                </div>
                                <Badge className={`${getDifficultyColor(article.difficulty)} text-white text-xs`}>
                                  {getDifficultyLabel(article.difficulty)}
                                </Badge>
                                <div className="flex gap-1">
                                  {article.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                          </div>
                        </div>
                        {index < filteredArticles.length - 1 && <Separator className="my-4" />}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Book className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-blue-600">{articles.length}</div>
            <div className="text-sm text-gray-500">Articles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Video className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-green-600">
              {articles.filter(a => a.videoAvailable).length}
            </div>
            <div className="text-sm text-gray-500">Tutoriels Vidéo</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold text-yellow-600">{popularArticles.length}</div>
            <div className="text-sm text-gray-500">Articles Populaires</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold text-purple-600">24/7</div>
            <div className="text-sm text-gray-500">Support</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}