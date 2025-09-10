import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Heart, Star, Download, Eye, Clock, Share2, Filter, Search, Plus, Trash2, ShoppingCart } from 'lucide-react'

export default function WishlistPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('added_date')

  const wishlistItems = [
    {
      id: '1',
      name: 'AI Content Generator',
      description: 'Extension pour générer du contenu automatiquement avec IA',
      category: 'productivity',
      price: '€24/mois',
      rating: 4.8,
      reviews: 342,
      downloads: 8920,
      addedDate: '2024-01-12',
      status: 'available',
      image: '/api/placeholder/80/80',
      tags: ['AI', 'Content', 'Automation'],
      priceHistory: [
        { date: '2024-01-01', price: 29 },
        { date: '2024-01-10', price: 24 }
      ],
      isOnSale: true,
      saleDiscount: 20
    },
    {
      id: '2',
      name: 'Advanced Analytics Pro',
      description: 'Analytics avancées avec tableaux de bord personnalisables',
      category: 'analytics',
      price: '€39/mois',
      rating: 4.9,
      reviews: 567,
      downloads: 12450,
      addedDate: '2024-01-08',
      status: 'coming_soon',
      image: '/api/placeholder/80/80',
      tags: ['Analytics', 'Dashboard', 'Reports'],
      estimatedRelease: '2024-02-15',
      isOnSale: false
    },
    {
      id: '3',
      name: 'Social Media Automation',
      description: 'Automatisez vos publications sur les réseaux sociaux',
      category: 'marketing',
      price: '€18/mois',
      rating: 4.6,
      reviews: 234,
      downloads: 6780,
      addedDate: '2024-01-05',
      status: 'available',
      image: '/api/placeholder/80/80',
      tags: ['Social Media', 'Automation', 'Marketing'],
      isOnSale: false
    },
    {
      id: '4',
      name: 'E-commerce Optimizer',
      description: 'Optimisez vos boutiques en ligne pour plus de conversions',
      category: 'ecommerce',
      price: 'Gratuit',
      rating: 4.4,
      reviews: 189,
      downloads: 15600,
      addedDate: '2024-01-03',
      status: 'available',
      image: '/api/placeholder/80/80',
      tags: ['E-commerce', 'Optimization', 'Conversion'],
      isOnSale: false
    }
  ]

  const categories = [
    { id: 'all', name: 'Toutes', count: wishlistItems.length },
    { id: 'productivity', name: 'Productivité', count: 1 },
    { id: 'analytics', name: 'Analytics', count: 1 },
    { id: 'marketing', name: 'Marketing', count: 1 },
    { id: 'ecommerce', name: 'E-commerce', count: 1 }
  ]

  const priceAlerts = [
    {
      extension: 'AI Content Generator',
      targetPrice: 20,
      currentPrice: 24,
      triggered: true,
      created: '2024-01-10'
    },
    {
      extension: 'Advanced Analytics Pro',
      targetPrice: 35,
      currentPrice: 39,
      triggered: false,
      created: '2024-01-08'
    }
  ]

  const sharedWishlists = [
    {
      id: '1',
      name: 'Extensions Productivité 2024',
      owner: 'Marie Dupont',
      items: 12,
      followers: 89,
      isPublic: true,
      created: '2024-01-01'
    },
    {
      id: '2',
      name: 'Outils Marketing Digital',
      owner: 'Jean Martin',
      items: 8,
      followers: 156,
      isPublic: true,
      created: '2024-01-05'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default">Disponible</Badge>
      case 'coming_soon':
        return <Badge variant="secondary">Bientôt disponible</Badge>
      case 'discontinued':
        return <Badge variant="outline">Discontinué</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredItems = wishlistItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleRemoveFromWishlist = (itemId: string) => {
    console.log('Removing from wishlist:', itemId)
  }

  const handleInstallExtension = (itemId: string) => {
    console.log('Installing extension:', itemId)
  }

  const handleShareWishlist = () => {
    console.log('Sharing wishlist')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Liste de Souhaits
          </h1>
          <p className="text-muted-foreground mt-2">
            Gardez un œil sur les extensions qui vous intéressent
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleShareWishlist}>
            <Share2 className="w-4 h-4 mr-2" />
            Partager
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Extension
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter à la Liste de Souhaits</DialogTitle>
                <DialogDescription>
                  Recherchez et ajoutez des extensions à votre liste de souhaits
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Rechercher une extension..." />
                <Button className="w-full">Rechercher</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="my-wishlist" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-wishlist">Ma Liste ({wishlistItems.length})</TabsTrigger>
          <TabsTrigger value="price-alerts">Alertes Prix ({priceAlerts.length})</TabsTrigger>
          <TabsTrigger value="shared">Listes Partagées</TabsTrigger>
        </TabsList>

        <TabsContent value="my-wishlist" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Extensions Souhaitées</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({category.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="added_date">Date d'ajout</SelectItem>
                      <SelectItem value="name">Nom</SelectItem>
                      <SelectItem value="price">Prix</SelectItem>
                      <SelectItem value="rating">Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Votre liste de souhaits est vide</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="border-l-4 border-l-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {item.isOnSale && (
                                  <Badge variant="destructive">-{item.saleDiscount}%</Badge>
                                )}
                                {getStatusBadge(item.status)}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-sm">{item.rating}</span>
                                <span className="text-sm text-muted-foreground">({item.reviews})</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Download className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{item.downloads.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Ajouté le {item.addedDate}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold">{item.price}</span>
                                {item.status === 'coming_soon' && (
                                  <span className="text-sm text-muted-foreground">
                                    Disponible le {item.estimatedRelease}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleRemoveFromWishlist(item.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Retirer
                                </Button>
                                <Button 
                                  size="sm"
                                  disabled={item.status !== 'available'}
                                  onClick={() => handleInstallExtension(item.id)}
                                >
                                  <ShoppingCart className="w-4 h-4 mr-1" />
                                  {item.price === 'Gratuit' ? 'Installer' : 'Acheter'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="price-alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Prix</CardTitle>
              <CardDescription>
                Recevez des notifications quand le prix d'une extension baisse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priceAlerts.map((alert, index) => (
                  <Card key={index} className={`border-l-4 ${alert.triggered ? 'border-l-green-500' : 'border-l-orange-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{alert.extension}</h3>
                          <p className="text-sm text-muted-foreground">
                            Prix cible: €{alert.targetPrice} • Prix actuel: €{alert.currentPrice}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Créée le {alert.created}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {alert.triggered ? (
                            <Badge variant="default">Prix atteint !</Badge>
                          ) : (
                            <Badge variant="secondary">En attente</Badge>
                          )}
                          <Button variant="outline" size="sm">
                            Modifier
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une nouvelle alerte
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvelle Alerte de Prix</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une extension" />
                        </SelectTrigger>
                        <SelectContent>
                          {wishlistItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Prix cible (€)" type="number" />
                      <Button className="w-full">Créer l'alerte</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Listes Partagées de la Communauté</CardTitle>
              <CardDescription>
                Découvrez les listes de souhaits populaires créées par d'autres utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sharedWishlists.map((list) => (
                  <Card key={list.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{list.name}</h3>
                          <p className="text-sm text-muted-foreground">Par {list.owner}</p>
                        </div>
                        <Badge variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          {list.followers}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span>{list.items} extensions</span>
                        <span>Créée le {list.created}</span>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full">
                        Voir la liste
                      </Button>
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