import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { BookmarkPlus, Star, Users, Eye, Heart, Plus, Search, Filter, Shuffle } from 'lucide-react'

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')

  const collections = [
    {
      id: '1',
      name: 'Productivité E-commerce',
      description: 'Extensions essentielles pour optimiser votre boutique en ligne',
      creator: {
        name: 'Marie Dubois',
        avatar: '/api/placeholder/32/32',
        verified: true
      },
      extensions: [
        { name: 'Data Scraper Pro', icon: '🔍' },
        { name: 'Price Monitor', icon: '💰' },
        { name: 'Review Importer', icon: '⭐' },
        { name: 'SEO Optimizer', icon: '📈' }
      ],
      stats: {
        followers: 1247,
        likes: 892,
        views: 15420
      },
      tags: ['e-commerce', 'productivité', 'automatisation'],
      isFollowing: false,
      isLiked: true,
      isPublic: true,
      created: '2024-01-10'
    },
    {
      id: '2',
      name: 'Starter Pack Développeur',
      description: 'Les outils indispensables pour débuter avec nos extensions',
      creator: {
        name: 'Jean Martin',
        avatar: '/api/placeholder/32/32',
        verified: false
      },
      extensions: [
        { name: 'Extension CLI', icon: '⌨️' },
        { name: 'Debug Tools', icon: '🐛' },
        { name: 'API Tester', icon: '🔧' }
      ],
      stats: {
        followers: 856,
        likes: 634,
        views: 9840
      },
      tags: ['développement', 'débutant', 'outils'],
      isFollowing: true,
      isLiked: false,
      isPublic: true,
      created: '2024-01-08'
    },
    {
      id: '3',
      name: 'Analytics Avancées',
      description: 'Ensemble d\'extensions pour analyser vos données en profondeur',
      creator: {
        name: 'Sophie Laurent',
        avatar: '/api/placeholder/32/32',
        verified: true
      },
      extensions: [
        { name: 'Analytics Pro', icon: '📊' },
        { name: 'Report Generator', icon: '📋' },
        { name: 'Data Visualizer', icon: '🎯' },
        { name: 'KPI Tracker', icon: '📈' },
        { name: 'Custom Metrics', icon: '🔢' }
      ],
      stats: {
        followers: 2134,
        likes: 1567,
        views: 28930
      },
      tags: ['analytics', 'données', 'business intelligence'],
      isFollowing: false,
      isLiked: false,
      isPublic: true,
      created: '2024-01-05'
    }
  ]

  const myCollections = [
    {
      id: 'my-1',
      name: 'Mes Extensions Favorites',
      description: 'Collection personnelle de mes outils préférés',
      extensionsCount: 8,
      isPrivate: true,
      created: '2024-01-12'
    },
    {
      id: 'my-2',
      name: 'Tests & Expérimentations',
      description: 'Extensions en cours de test',
      extensionsCount: 3,
      isPrivate: true,
      created: '2024-01-09'
    }
  ]

  const categories = [
    { id: 'all', name: 'Toutes', count: 156 },
    { id: 'productivity', name: 'Productivité', count: 45 },
    { id: 'ecommerce', name: 'E-commerce', count: 38 },
    { id: 'development', name: 'Développement', count: 29 },
    { id: 'analytics', name: 'Analytics', count: 22 },
    { id: 'marketing', name: 'Marketing', count: 22 }
  ]

  const featuredCreators = [
    {
      name: 'Marie Dubois',
      avatar: '/api/placeholder/40/40',
      collections: 12,
      followers: 3456,
      verified: true
    },
    {
      name: 'Jean Martin',
      avatar: '/api/placeholder/40/40',
      collections: 8,
      followers: 2134,
      verified: false
    },
    {
      name: 'Sophie Laurent',
      avatar: '/api/placeholder/40/40',
      collections: 15,
      followers: 4892,
      verified: true
    }
  ]

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collection.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collection.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || collection.tags.includes(selectedCategory)
    return matchesSearch && matchesCategory
  })

  const handleCreateCollection = () => {
    // Simulate collection creation
    console.log('Creating collection:', { newCollectionName, newCollectionDescription })
    setNewCollectionName('')
    setNewCollectionDescription('')
  }

  const handleFollowCollection = (collectionId: string) => {
    console.log('Following collection:', collectionId)
  }

  const handleLikeCollection = (collectionId: string) => {
    console.log('Liking collection:', collectionId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Collections d'Extensions
          </h1>
          <p className="text-muted-foreground mt-2">
            Découvrez des collections d'extensions organisées par thème et créez les vôtres
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Créer une Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une Nouvelle Collection</DialogTitle>
              <DialogDescription>
                Organisez vos extensions favorites dans une collection personnalisée
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="collection-name">Nom de la collection</Label>
                <Input
                  id="collection-name"
                  placeholder="Ma collection d'extensions..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="collection-description">Description</Label>
                <Textarea
                  id="collection-description"
                  placeholder="Décrivez le thème ou l'objectif de votre collection..."
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateCollection} className="w-full">
                Créer la Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="explore" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="explore">Explorer</TabsTrigger>
          <TabsTrigger value="my-collections">Mes Collections</TabsTrigger>
          <TabsTrigger value="creators">Créateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher une collection..."
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
                  size="sm"
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm">
              <Shuffle className="w-4 h-4 mr-2" />
              Aléatoire
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => (
              <Card key={collection.id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={collection.creator.avatar} />
                        <AvatarFallback>{collection.creator.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{collection.creator.name}</p>
                        {collection.creator.verified && (
                          <Badge variant="outline" className="text-xs">Vérifié</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeCollection(collection.id)}
                      className={collection.isLiked ? 'text-red-500' : ''}
                    >
                      <Heart className={`w-4 h-4 ${collection.isLiked ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                  
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {collection.name}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {collection.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {collection.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Extensions incluses :</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {collection.extensions.slice(0, 4).map((ext, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs p-1 rounded bg-muted/50">
                          <span>{ext.icon}</span>
                          <span className="truncate">{ext.name}</span>
                        </div>
                      ))}
                      {collection.extensions.length > 4 && (
                        <div className="col-span-2 text-xs text-muted-foreground text-center py-1">
                          +{collection.extensions.length - 4} autres extensions
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                    <div className="flex space-x-3">
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {collection.stats.followers}
                      </span>
                      <span className="flex items-center">
                        <Heart className="w-3 h-3 mr-1" />
                        {collection.stats.likes}
                      </span>
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {collection.stats.views}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      variant={collection.isFollowing ? 'secondary' : 'outline'} 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleFollowCollection(collection.id)}
                    >
                      {collection.isFollowing ? 'Suivi' : 'Suivre'}
                    </Button>
                    <Button size="sm" className="flex-1">
                      Voir Détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-collections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes Collections Privées</CardTitle>
              <CardDescription>
                Gérez vos collections personnelles d'extensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myCollections.length === 0 ? (
                <div className="text-center py-8">
                  <BookmarkPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Vous n'avez pas encore créé de collections</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Créer ma première collection</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Créer une Collection</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input 
                          placeholder="Nom de la collection"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                        />
                        <Textarea 
                          placeholder="Description de la collection"
                          value={newCollectionDescription}
                          onChange={(e) => setNewCollectionDescription(e.target.value)}
                        />
                        <Button onClick={handleCreateCollection} className="w-full">
                          Créer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myCollections.map((collection) => (
                    <Card key={collection.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{collection.name}</h3>
                          <Badge variant={collection.isPrivate ? 'secondary' : 'default'}>
                            {collection.isPrivate ? 'Privée' : 'Publique'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {collection.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {collection.extensionsCount} extensions
                          </span>
                          <span className="text-muted-foreground">
                            Créée le {collection.created}
                          </span>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Button variant="outline" size="sm" className="flex-1">
                            Modifier
                          </Button>
                          <Button size="sm" className="flex-1">
                            Gérer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Créateurs Populaires</CardTitle>
              <CardDescription>
                Découvrez les créateurs les plus actifs de la communauté
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredCreators.map((creator, index) => (
                  <Card key={index}>
                    <CardContent className="p-6 text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-4">
                        <AvatarImage src={creator.avatar} />
                        <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2">
                          <h3 className="font-semibold">{creator.name}</h3>
                          {creator.verified && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Vérifié
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
                          <span>{creator.collections} collections</span>
                          <span>{creator.followers} abonnés</span>
                        </div>
                        
                        <Button variant="outline" className="w-full mt-4">
                          Voir le Profil
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}