import { useState } from 'react'
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  FileText, 
  PlusCircle, 
  Edit, 
  Eye, 
  Calendar, 
  User, 
  Tag, 
  TrendingUp,
  Heart,
  MessageSquare,
  Share2,
  BarChart3,
  Search,
  Filter,
  Clock,
  Globe,
  Image as ImageIcon,
  Video,
  Bookmark
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const BlogUltraPro = () => {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  // Mock data for blog articles
  const articles = [
    {
      id: '1',
      title: 'Les tendances e-commerce 2024',
      excerpt: 'Découvrez les dernières tendances qui vont révolutionner le commerce en ligne cette année.',
      author: 'Marie Dubois',
      date: '2024-01-15',
      status: 'published',
      category: 'E-commerce',
      views: 2450,
      likes: 156,
      comments: 23,
      readTime: '5 min',
      featured: true,
      image: '/api/placeholder/400/200'
    },
    {
      id: '2',
      title: 'Optimiser son SEO en 2024',
      excerpt: 'Guide complet pour améliorer votre référencement naturel et attirer plus de visiteurs.',
      author: 'Pierre Martin',
      date: '2024-01-12',
      status: 'published',
      category: 'SEO',
      views: 1890,
      likes: 98,
      comments: 15,
      readTime: '8 min',
      featured: false,
      image: '/api/placeholder/400/200'
    },
    {
      id: '3',
      title: 'L\'intelligence artificielle dans le marketing',
      excerpt: 'Comment l\'IA transforme les stratégies marketing et améliore l\'expérience client.',
      author: 'Sophie Leroy',
      date: '2024-01-10',
      status: 'draft',
      category: 'Marketing',
      views: 0,
      likes: 0,
      comments: 0,
      readTime: '6 min',
      featured: false,
      image: '/api/placeholder/400/200'
    },
    {
      id: '4',
      title: 'Automatisation des processus de vente',
      excerpt: 'Techniques et outils pour automatiser vos ventes et augmenter votre productivité.',
      author: 'Jean Dupont',
      date: '2024-01-08',
      status: 'published',
      category: 'Ventes',
      views: 1567,
      likes: 89,
      comments: 12,
      readTime: '7 min',
      featured: true,
      image: '/api/placeholder/400/200'
    }
  ]

  // Mock data for blog analytics
  const analyticsData = [
    { date: '01/01', views: 1200, visitors: 890, engagement: 65 },
    { date: '02/01', views: 1450, visitors: 1020, engagement: 72 },
    { date: '03/01', views: 1789, visitors: 1234, engagement: 68 },
    { date: '04/01', views: 2100, visitors: 1456, engagement: 75 },
    { date: '05/01', views: 1923, visitors: 1345, engagement: 71 },
    { date: '06/01', views: 2340, visitors: 1678, engagement: 78 },
    { date: '07/01', views: 2789, visitors: 1890, engagement: 82 }
  ]

  const categoriesData = [
    { name: 'E-commerce', value: 35, color: '#8b5cf6' },
    { name: 'SEO', value: 25, color: '#06b6d4' },
    { name: 'Marketing', value: 20, color: '#10b981' },
    { name: 'Ventes', value: 15, color: '#f59e0b' },
    { name: 'Autre', value: 5, color: '#ef4444' }
  ]

  const blogStats = [
    {
      title: "Articles publiés",
      value: "127",
      change: "+8",
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Vues totales",
      value: "45.2K",
      change: "+23%",
      icon: Eye,
      color: "text-green-600"
    },
    {
      title: "Engagement moyen",
      value: "74%",
      change: "+5.2%",
      icon: Heart,
      color: "text-red-600"
    },
    {
      title: "Abonnés",
      value: "3.8K",
      change: "+156",
      icon: User,
      color: "text-blue-600"
    }
  ]

  const topAuthors = [
    { name: 'Marie Dubois', articles: 23, views: 15600 },
    { name: 'Pierre Martin', articles: 18, views: 12300 },
    { name: 'Sophie Leroy', articles: 15, views: 9800 },
    { name: 'Jean Dupont', articles: 12, views: 8900 }
  ]

  const filteredArticles = articles.filter(article => {
    if (filter === 'all') return true
    if (filter === 'published') return article.status === 'published'
    if (filter === 'draft') return article.status === 'draft'
    if (filter === 'featured') return article.featured
    return true
  })

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-background/80">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Blog Ultra Pro
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gérez votre contenu et analysez l'engagement
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Médias
                </Button>
                <Button size="sm">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Nouvel article
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {blogStats.map((stat, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <Badge variant="secondary" className="text-xs">
                            {stat.change}
                          </Badge>
                        </div>
                      </div>
                      <div className={`p-3 rounded-full bg-primary/10`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="articles" className="space-y-6">
              <TabsList className="grid w-full lg:w-[500px] grid-cols-5">
                <TabsTrigger value="articles">Articles</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="editor">Éditeur</TabsTrigger>
                <TabsTrigger value="categories">Catégories</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              {/* Articles Tab */}
              <TabsContent value="articles" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input placeholder="Rechercher des articles..." className="pl-10 w-80" />
                    </div>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-40">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="published">Publiés</SelectItem>
                        <SelectItem value="draft">Brouillons</SelectItem>
                        <SelectItem value="featured">À la une</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Articles List */}
                  <div className="lg:col-span-2 space-y-4">
                    {filteredArticles.map((article) => (
                      <Card 
                        key={article.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          selectedArticle === article.id ? 'border-primary' : ''
                        }`}
                        onClick={() => setSelectedArticle(article.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            <div className="w-24 h-20 bg-muted rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-lg">{article.title}</h3>
                                    {article.featured && (
                                      <Badge variant="default" className="text-xs">À la une</Badge>
                                    )}
                                    <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                                      {article.status === 'published' ? 'Publié' : 'Brouillon'}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground text-sm mb-3">{article.excerpt}</p>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      {article.author}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {new Date(article.date).toLocaleDateString('fr-FR')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {article.readTime}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Tag className="w-4 h-4" />
                                      {article.category}
                                    </div>
                                  </div>
                                  {article.status === 'published' && (
                                    <div className="flex items-center gap-6 mt-3 text-sm">
                                      <div className="flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        {article.views.toLocaleString()}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Heart className="w-4 h-4" />
                                        {article.likes}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MessageSquare className="w-4 h-4" />
                                        {article.comments}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Share2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Top Authors Sidebar */}
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Top auteurs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {topAuthors.map((author, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{author.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {author.articles} articles
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{author.views.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">vues</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trafic du blog</CardTitle>
                      <CardDescription>Évolution des vues et visiteurs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} />
                          <Line type="monotone" dataKey="visitors" stroke="#06b6d4" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition par catégories</CardTitle>
                      <CardDescription>Articles publiés par thématique</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoriesData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {categoriesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {categoriesData.map((category, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm">{category.name}</span>
                            <span className="text-sm text-muted-foreground">({category.value}%)</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Engagement par article</CardTitle>
                    <CardDescription>Taux d'engagement des derniers articles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="engagement" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Editor Tab */}
              <TabsContent value="editor" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Nouvel article</CardTitle>
                    <CardDescription>Créez et publiez du contenu engageant</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="article-title">Titre de l'article</Label>
                          <Input id="article-title" placeholder="Un titre accrocheur..." />
                        </div>

                        <div>
                          <Label htmlFor="article-excerpt">Extrait</Label>
                          <Textarea 
                            id="article-excerpt" 
                            placeholder="Résumé court de l'article..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="article-category">Catégorie</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ecommerce">E-commerce</SelectItem>
                              <SelectItem value="seo">SEO</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="sales">Ventes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="article-tags">Tags</Label>
                          <Input id="article-tags" placeholder="tag1, tag2, tag3..." />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="article-author">Auteur</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un auteur" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="marie">Marie Dubois</SelectItem>
                              <SelectItem value="pierre">Pierre Martin</SelectItem>
                              <SelectItem value="sophie">Sophie Leroy</SelectItem>
                              <SelectItem value="jean">Jean Dupont</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="publish-date">Date de publication</Label>
                          <Input type="datetime-local" id="publish-date" />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="featured-article" />
                            <Label htmlFor="featured-article">Mettre à la une</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="allow-comments" defaultChecked />
                            <Label htmlFor="allow-comments">Autoriser les commentaires</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="newsletter" defaultChecked />
                            <Label htmlFor="newsletter">Inclure dans la newsletter</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="article-content">Contenu de l'article</Label>
                      <Textarea 
                        id="article-content" 
                        placeholder="Rédigez votre article ici..."
                        rows={12}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button>
                        <Globe className="w-4 h-4 mr-2" />
                        Publier
                      </Button>
                      <Button variant="outline">
                        <Bookmark className="w-4 h-4 mr-2" />
                        Sauvegarder brouillon
                      </Button>
                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Prévisualiser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent value="categories" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Gestion des catégories</CardTitle>
                      <CardDescription>Organisez vos articles par thématiques</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {categoriesData.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-muted-foreground">{category.value}% des articles</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ajouter une catégorie</CardTitle>
                      <CardDescription>Créez une nouvelle thématique</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="category-name">Nom de la catégorie</Label>
                        <Input id="category-name" placeholder="Ex: Nouveautés" />
                      </div>
                      <div>
                        <Label htmlFor="category-desc">Description</Label>
                        <Textarea 
                          id="category-desc" 
                          placeholder="Description de la catégorie..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category-color">Couleur</Label>
                        <Input type="color" id="category-color" className="w-20 h-10" />
                      </div>
                      <Button className="w-full">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Créer la catégorie
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimisation SEO</CardTitle>
                    <CardDescription>Améliorez le référencement de votre blog</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="meta-title">Meta titre</Label>
                          <Input id="meta-title" placeholder="Titre pour les moteurs de recherche" />
                          <p className="text-xs text-muted-foreground mt-1">Recommandé: 50-60 caractères</p>
                        </div>

                        <div>
                          <Label htmlFor="meta-description">Meta description</Label>
                          <Textarea 
                            id="meta-description" 
                            placeholder="Description pour les moteurs de recherche"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Recommandé: 150-160 caractères</p>
                        </div>

                        <div>
                          <Label htmlFor="focus-keyword">Mot-clé principal</Label>
                          <Input id="focus-keyword" placeholder="Ex: e-commerce 2024" />
                        </div>

                        <div>
                          <Label htmlFor="related-keywords">Mots-clés secondaires</Label>
                          <Input id="related-keywords" placeholder="mot1, mot2, mot3..." />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Score SEO</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full w-4/5"></div>
                            </div>
                            <span className="text-sm font-medium">82/100</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Titre optimisé</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Meta description présente</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm">Images sans alt text</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm">Manque liens internes</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Suggestions d'amélioration</Label>
                          <div className="text-sm space-y-1">
                            <p>• Ajouter du texte alternatif aux images</p>
                            <p>• Inclure 2-3 liens vers d'autres articles</p>
                            <p>• Optimiser la densité du mot-clé principal</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default BlogUltraPro