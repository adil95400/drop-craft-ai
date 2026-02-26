import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  FileText, Eye, Heart, MessageCircle, Share2,
  Plus, Search, Filter, BarChart3, TrendingUp,
  Edit, Trash2, Calendar, Clock, Target,
  Users, BookOpen, Zap, Award
} from 'lucide-react'
import { BlogStats } from './BlogStats'
import { useBlog } from '@/hooks/useBlog'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface BlogDashboardProps {
  onCreatePost?: () => void
  onEditPost?: (postId: string) => void
}

export function BlogDashboard({ onCreatePost, onEditPost }: BlogDashboardProps) {
  const navigate = useNavigate()
  const { posts, stats, loading, publishPost, deletePost } = useBlog()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Publié</Badge>
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Programmé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const quickStats = [
    {
      title: 'Articles publiés',
      value: stats.published,
      icon: BookOpen,
      color: 'text-green-600',
      bg: 'bg-green-100',
      href: '/marketing/blog'
    },
    {
      title: 'Brouillons',
      value: stats.drafts,
      icon: FileText,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      href: '/marketing/blog'
    },
    {
      title: 'Vues totales',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      href: '/analytics'
    },
    {
      title: 'Articles IA',
      value: stats.aiGenerated,
      icon: Zap,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      href: '/automation/ai-hub'
    }
  ]

  const recentActivity = [
    { action: 'Article publié', target: 'Guide Dropshipping 2024', time: '2h' },
    { action: 'Brouillon créé', target: 'Stratégies Marketing', time: '4h' },
    { action: 'Article modifié', target: 'Analyse Concurrence', time: '1j' },
    { action: 'Publication programmée', target: 'Tendances E-commerce', time: '2j' },
  ]

  const topCategories = [
    { name: 'Dropshipping', count: 12, percentage: 35 },
    { name: 'Marketing', count: 8, percentage: 24 },
    { name: 'E-commerce', count: 6, percentage: 18 },
    { name: 'Stratégie', count: 5, percentage: 15 },
    { name: 'Outils', count: 3, percentage: 8 },
  ]

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord Blog</h1>
          <p className="text-muted-foreground">
            Gérez et analysez vos articles de blog
          </p>
        </div>
        <Button onClick={onCreatePost} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvel article
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="posts">Articles</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="editor">Éditeur</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduler">Planificateur</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => (
              <Card 
                key={index}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={() => stat.href && navigate(stat.href)}
              >
                <CardContent className="flex items-center p-6">
                  <div className={`p-3 rounded-full ${stat.bg} mr-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activité récente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.target}</p>
                      </div>
                      <Badge variant="outline">{activity.time}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top catégories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Catégories populaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {category.count} articles
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          {/* Filtres */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher des articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="scheduled">Programmé</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="Dropshipping">Dropshipping</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Stratégie">Stratégie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des articles */}
          <Card>
            <CardHeader>
              <CardTitle>Articles ({filteredPosts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Vues</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{post.title}</p>
                          {post.ai_generated && (
                            <Badge variant="outline" className="text-xs mt-1">
                              <Zap className="h-3 w-3 mr-1" />
                              IA
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{post.category}</Badge>
                      </TableCell>
                      <TableCell>{post.views.toLocaleString()}</TableCell>
                      <TableCell>
                        {format(new Date(post.created_at), 'dd MMM yyyy', { locale: getDateFnsLocale() })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEditPost?.(post.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {post.status === 'draft' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => publishPost(post.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <BlogStats 
            totalViews={stats.totalViews}
            totalLikes={0}
            totalShares={0}
            totalComments={0}
            totalSubscribers={0}
            articlesCount={stats.published + stats.drafts}
            monthlyGrowth={15}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des catégories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.count} articles • {category.percentage}% du contenu
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}