import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Play, Clock, Star, Search, Filter, BookOpen, Video, Code, CheckCircle } from 'lucide-react'

export default function TutorialsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'Tous', count: 24 },
    { id: 'getting-started', name: 'Débutant', count: 8 },
    { id: 'development', name: 'Développement', count: 6 },
    { id: 'integration', name: 'Intégration', count: 5 },
    { id: 'advanced', name: 'Avancé', count: 5 }
  ]

  const tutorials = [
    {
      id: '1',
      title: 'Créer votre première extension',
      description: 'Apprenez les bases pour développer une extension Chrome fonctionnelle',
      category: 'getting-started',
      type: 'video',
      duration: '15 min',
      difficulty: 'Débutant',
      rating: 4.9,
      views: 12540,
      thumbnail: '/api/placeholder/300/200',
      completed: false,
      chapters: [
        'Introduction aux extensions Chrome',
        'Structure du projet',
        'Manifest.json expliqué',
        'Premier script de contenu',
        'Test et debug'
      ]
    },
    {
      id: '2',
      title: 'Configuration API avancée',
      description: 'Intégrez des APIs externes et gérez l\'authentification',
      category: 'development',
      type: 'text',
      duration: '25 min',
      difficulty: 'Intermédiaire',
      rating: 4.7,
      views: 8432,
      thumbnail: '/api/placeholder/300/200',
      completed: true,
      chapters: [
        'Types d\'APIs supportées',
        'Gestion des tokens',
        'Middleware de sécurité',
        'Gestion d\'erreurs',
        'Tests d\'intégration'
      ]
    },
    {
      id: '3',
      title: 'Scraping éthique et performant',
      description: 'Techniques avancées pour extraire des données respectueusement',
      category: 'advanced',
      type: 'interactive',
      duration: '40 min',
      difficulty: 'Avancé',
      rating: 4.8,
      views: 6721,
      thumbnail: '/api/placeholder/300/200',
      completed: false,
      chapters: [
        'Respect des robots.txt',
        'Rate limiting intelligent',
        'Rotation de proxies',
        'Anti-détection',
        'Optimisation des performances'
      ]
    },
    {
      id: '4',
      title: 'Déploiement et distribution',
      description: 'Publiez votre extension sur le Chrome Web Store',
      category: 'integration',
      type: 'video',
      duration: '20 min',
      difficulty: 'Intermédiaire',
      rating: 4.6,
      views: 5893,
      thumbnail: '/api/placeholder/300/200',
      completed: false,
      chapters: [
        'Préparer le package',
        'Chrome Web Store setup',
        'Screenshots et description',
        'Processus de review',
        'Gestion des mises à jour'
      ]
    }
  ]

  const learningPaths = [
    {
      name: 'Parcours Développeur Extension',
      description: 'De zéro à expert en développement d\'extensions',
      progress: 60,
      totalLessons: 12,
      completedLessons: 7,
      estimatedTime: '4-6 heures'
    },
    {
      name: 'Parcours Data Scraping',
      description: 'Maîtrisez l\'extraction de données web',
      progress: 30,
      totalLessons: 8,
      completedLessons: 2,
      estimatedTime: '3-4 heures'
    },
    {
      name: 'Parcours Intégration API',
      description: 'Connectez vos extensions aux services tiers',
      progress: 0,
      totalLessons: 6,
      completedLessons: 0,
      estimatedTime: '2-3 heures'
    }
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video
      case 'text': return BookOpen
      case 'interactive': return Code
      default: return BookOpen
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Débutant': return 'bg-green-500'
      case 'Intermédiaire': return 'bg-orange-500'
      case 'Avancé': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Tutoriels & Guides
        </h1>
        <p className="text-muted-foreground mt-2">
          Apprenez à maîtriser nos extensions avec des tutoriels pas à pas
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un tutoriel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.name} ({category.count})
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="tutorials" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tutorials">Tutoriels</TabsTrigger>
          <TabsTrigger value="paths">Parcours d'Apprentissage</TabsTrigger>
          <TabsTrigger value="interactive">Mode Interactif</TabsTrigger>
        </TabsList>

        <TabsContent value="tutorials" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTutorials.map((tutorial) => {
              const TypeIcon = getTypeIcon(tutorial.type)
              return (
                <Card key={tutorial.id} className="group hover:shadow-lg transition-all duration-300">
                  <div className="relative">
                    <img
                      src={tutorial.thumbnail}
                      alt={tutorial.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-background/80">
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {tutorial.type}
                      </Badge>
                    </div>
                    {tutorial.completed && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Terminé
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg leading-tight">{tutorial.title}</h3>
                      <div className="flex items-center ml-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm ml-1">{tutorial.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {tutorial.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {tutorial.duration}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${getDifficultyColor(tutorial.difficulty)}`} />
                      <span className="text-sm text-muted-foreground">{tutorial.difficulty}</span>
                      <span className="text-sm text-muted-foreground">• {tutorial.views} vues</span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-semibold">Contenu :</h4>
                      <div className="space-y-1">
                        {tutorial.chapters.slice(0, 3).map((chapter, index) => (
                          <div key={index} className="text-xs text-muted-foreground flex items-center">
                            <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-xs font-mono mr-2">
                              {index + 1}
                            </span>
                            {chapter}
                          </div>
                        ))}
                        {tutorial.chapters.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{tutorial.chapters.length - 3} autres chapitres
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button className="w-full" variant={tutorial.completed ? 'outline' : 'default'}>
                      <Play className="w-4 h-4 mr-2" />
                      {tutorial.completed ? 'Revoir' : 'Commencer'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="paths" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parcours d'Apprentissage Guidés</CardTitle>
              <CardDescription>
                Suivez des parcours structurés pour acquérir des compétences spécifiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {learningPaths.map((path, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{path.name}</h3>
                        <p className="text-sm text-muted-foreground">{path.description}</p>
                      </div>
                      <Badge variant="outline">
                        {path.completedLessons}/{path.totalLessons} leçons
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>{path.progress}%</span>
                      </div>
                      <Progress value={path.progress} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Temps estimé : {path.estimatedTime}
                      </span>
                      <Button variant={path.progress > 0 ? 'default' : 'outline'}>
                        {path.progress > 0 ? 'Continuer' : 'Commencer'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mode Interactif</CardTitle>
              <CardDescription>
                Apprenez en pratiquant directement avec des exercices interactifs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Code className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bientôt Disponible</h3>
                <p className="text-muted-foreground mb-6">
                  Le mode interactif arrive prochainement avec des exercices pratiques en temps réel
                </p>
                <Button variant="outline">
                  M'informer de la sortie
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}