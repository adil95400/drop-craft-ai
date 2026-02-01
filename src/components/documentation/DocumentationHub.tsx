/**
 * Hub de Documentation Professionnelle ShopOpti+
 * Interface enterprise-grade pour le Help Center
 */

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, Book, Clock, ChevronRight, Star, Users, Zap, 
  LayoutDashboard, Package, Truck, ShoppingCart, Megaphone, 
  BarChart3, Building2, Filter, BookOpen, Target, HelpCircle, ArrowRight
} from 'lucide-react'
import { 
  ALL_DOCUMENTATION, 
  DOCUMENTATION_CATEGORIES, 
  searchDocumentation,
  getDocumentationStats,
  type ModuleDocumentation,
  type ModuleCategory,
  type UserLevel 
} from '@/data/documentation'

const CATEGORY_ICONS: Record<ModuleCategory, React.ElementType> = {
  core: LayoutDashboard,
  catalog: Package,
  sourcing: Truck,
  sales: ShoppingCart,
  marketing: Megaphone,
  analytics: BarChart3,
  automation: Zap,
  enterprise: Building2
}

const LEVEL_CONFIG: Record<UserLevel, { label: string; color: string; icon: React.ElementType }> = {
  beginner: { label: 'Débutant', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: BookOpen },
  intermediate: { label: 'Intermédiaire', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Target },
  advanced: { label: 'Avancé', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: Star },
  expert: { label: 'Expert', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: Zap }
}

interface DocumentationHubProps {
  onSelectModule?: (moduleId: string) => void
}

export function DocumentationHub({ onSelectModule }: DocumentationHubProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | 'all'>('all')
  const [selectedLevel, setSelectedLevel] = useState<UserLevel | 'all'>('all')
  
  const stats = useMemo(() => getDocumentationStats(), [])
  
  // Filter modules based on search and filters
  const filteredModules = useMemo(() => {
    let modules = ALL_DOCUMENTATION
    
    if (selectedCategory !== 'all') {
      modules = modules.filter(m => m.category === selectedCategory)
    }
    
    if (selectedLevel !== 'all') {
      modules = modules.filter(m => m.targetLevels.includes(selectedLevel))
    }
    
    if (searchQuery.trim()) {
      const results = searchDocumentation(searchQuery)
      const moduleIds = new Set(results.map(r => r.moduleId))
      modules = modules.filter(m => moduleIds.has(m.id))
    }
    
    return modules
  }, [searchQuery, selectedCategory, selectedLevel])
  
  // Search results for quick display
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchDocumentation(searchQuery).slice(0, 8)
  }, [searchQuery])
  
  const handleModuleClick = (module: ModuleDocumentation) => {
    if (onSelectModule) {
      onSelectModule(module.id)
    } else {
      navigate(`/help-center/documentation/${module.slug}`)
    }
  }
  
  const getCategoryIcon = (category: ModuleCategory) => {
    const Icon = CATEGORY_ICONS[category]
    return Icon ? <Icon className="h-5 w-5" /> : <Book className="h-5 w-5" />
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Book className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalModules}</p>
                <p className="text-xs text-muted-foreground">Modules documentés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUseCases}</p>
                <p className="text-xs text-muted-foreground">Cas d'usage</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <HelpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalFAQs}</p>
                <p className="text-xs text-muted-foreground">Questions/Réponses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.estimatedReadTime}min</p>
                <p className="text-xs text-muted-foreground">Temps de lecture total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans la documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Quick search results */}
          {searchResults.length > 0 && (
            <Card className="border-dashed">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Résultats rapides ({searchResults.length})
                </p>
                <div className="space-y-1">
                  {searchResults.slice(0, 5).map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const module = ALL_DOCUMENTATION.find(m => m.id === result.moduleId)
                        if (module) handleModuleClick(module)
                      }}
                      className="w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {result.sectionType === 'overview' ? 'Vue d\'ensemble' : 
                           result.sectionType === 'useCase' ? 'Cas d\'usage' :
                           result.sectionType === 'troubleshooting' ? 'Dépannage' : 'FAQ'}
                        </Badge>
                        <span className="text-sm font-medium truncate">{result.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {result.excerpt}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtrer par:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                Tous
              </Button>
              {DOCUMENTATION_CATEGORIES.slice(0, 4).map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="gap-1"
                >
                  {getCategoryIcon(cat.id)}
                  <span className="hidden sm:inline">{cat.name}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Level filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Niveau:
            </span>
            <Button
              variant={selectedLevel === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedLevel('all')}
            >
              Tous
            </Button>
            {(Object.keys(LEVEL_CONFIG) as UserLevel[]).map(level => {
              const config = LEVEL_CONFIG[level]
              return (
                <Button
                  key={level}
                  variant={selectedLevel === level ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedLevel(level)}
                  className="gap-1"
                >
                  <config.icon className="h-3 w-3" />
                  {config.label}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Categories Tabs */}
      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="modules">Modules ({filteredModules.length})</TabsTrigger>
          <TabsTrigger value="categories">Par catégorie</TabsTrigger>
        </TabsList>
        
        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map(module => (
              <Card 
                key={module.id} 
                className="hover:shadow-lg transition-all cursor-pointer group hover:border-primary/50"
                onClick={() => handleModuleClick(module)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(module.category)}
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {module.title}
                      </CardTitle>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardDescription className="line-clamp-2">
                    {module.subtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {module.targetLevels.slice(0, 2).map(level => (
                      <Badge key={level} variant="secondary" className={`text-xs ${LEVEL_CONFIG[level].color}`}>
                        {LEVEL_CONFIG[level].label}
                      </Badge>
                    ))}
                    {module.targetLevels.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{module.targetLevels.length - 2}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {module.estimatedReadTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {module.stepByStep.length} étapes
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredModules.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Aucun résultat trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  Essayez de modifier vos filtres ou votre recherche
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setSelectedLevel('all')
                }}>
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-6">
          {DOCUMENTATION_CATEGORIES.map(category => {
            const categoryModules = ALL_DOCUMENTATION.filter(m => m.category === category.id)
            if (categoryModules.length === 0) return null
            
            return (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {getCategoryIcon(category.id)}
                    </div>
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {categoryModules.map(module => (
                      <button
                        key={module.id}
                        onClick={() => handleModuleClick(module)}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all group text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium group-hover:text-primary transition-colors truncate">
                            {module.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {module.useCases.length} cas d'usage • {module.estimatedReadTime} min
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
