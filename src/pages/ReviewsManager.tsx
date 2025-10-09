import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  Download, 
  Filter,
  Image,
  Globe,
  Sparkles,
  Import
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ReviewsManager() {
  const { toast } = useToast()
  const [importUrl, setImportUrl] = useState('')

  const [reviews] = useState([
    {
      id: '1',
      productName: 'Wireless Earbuds Pro',
      author: 'John D.',
      rating: 5,
      comment: 'Excellent product! Sound quality is amazing and battery life is great.',
      date: '2024-02-10',
      verified: true,
      hasPhotos: true,
      photoCount: 3,
      helpful: 24,
      source: 'aliexpress'
    },
    {
      id: '2',
      productName: 'Smart Watch Series X',
      author: 'Sarah M.',
      rating: 4,
      comment: 'Good watch but the battery could be better. Overall happy with purchase.',
      date: '2024-02-09',
      verified: true,
      hasPhotos: false,
      photoCount: 0,
      helpful: 12,
      source: 'amazon'
    }
  ])

  const handleImportReviews = async () => {
    if (!importUrl) {
      toast({
        title: 'URL manquante',
        description: 'Veuillez entrer une URL de produit',
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Import en cours',
      description: 'Récupération des avis en cours...'
    })

    // TODO: Implement real review import
    setTimeout(() => {
      toast({
        title: 'Import réussi',
        description: '47 avis ont été importés avec succès'
      })
    }, 2000)
  }

  return (
    <>
      <Helmet>
        <title>Gestion des Avis - Drop Craft AI</title>
        <meta name="description" content="Importez et gérez les avis clients pour augmenter vos conversions" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Gestion des Avis Clients
            </h1>
            <p className="text-muted-foreground mt-1">
              Importez et optimisez vos avis pour booster la conversion
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">4.7/5</div>
              <div className="text-sm text-muted-foreground">Note moyenne</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">1,247</div>
              <div className="text-sm text-muted-foreground">Total avis</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Image className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">342</div>
              <div className="text-sm text-muted-foreground">Avec photos</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <ThumbsUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">96%</div>
              <div className="text-sm text-muted-foreground">Positifs</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList>
            <TabsTrigger value="import">Importer</TabsTrigger>
            <TabsTrigger value="manage">Gérer</TabsTrigger>
            <TabsTrigger value="translate">Traduire</TabsTrigger>
            <TabsTrigger value="display">Affichage</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Import className="h-5 w-5" />
                  Importer des Avis
                </CardTitle>
                <CardDescription>
                  Importez des avis depuis AliExpress, Amazon ou d'autres plateformes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL du Produit</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url"
                      placeholder="https://aliexpress.com/item/..."
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                    />
                    <Button onClick={handleImportReviews}>
                      <Download className="h-4 w-4 mr-2" />
                      Importer
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {['AliExpress', 'Amazon', 'eBay'].map((platform) => (
                    <Button key={platform} variant="outline" className="h-20 flex-col">
                      <Globe className="h-6 w-6 mb-2" />
                      {platform}
                    </Button>
                  ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="flex gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-medium mb-1">Import Intelligent AI</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Filtrage automatique des avis pertinents</li>
                        <li>Traduction instantanée</li>
                        <li>Détection des faux avis</li>
                        <li>Import des photos et vidéos</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Avis Importés</CardTitle>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">{review.author}</span>
                          {review.verified && (
                            <Badge variant="outline" className="text-xs">
                              Vérifié
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          {review.productName}
                        </p>
                        <p className="text-sm">{review.comment}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{review.date}</span>
                        {review.hasPhotos && (
                          <Badge variant="secondary">
                            <Image className="h-3 w-3 mr-1" />
                            {review.photoCount} photos
                          </Badge>
                        )}
                        <span className="text-muted-foreground">
                          <ThumbsUp className="h-3 w-3 inline mr-1" />
                          {review.helpful}
                        </span>
                      </div>
                      <Badge variant="outline">{review.source}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="translate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Traduction Automatique</CardTitle>
                <CardDescription>
                  Traduisez vos avis dans plus de 50 langues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Traduction IA</h3>
                  <p className="text-muted-foreground mb-4">
                    Sélectionnez les avis à traduire et la langue cible
                  </p>
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Traduire Tous les Avis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration d'Affichage</CardTitle>
                <CardDescription>
                  Personnalisez l'affichage des avis sur votre boutique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Widgets d'Avis</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez des widgets personnalisés pour afficher vos avis
                  </p>
                  <Button>
                    Créer un Widget
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
