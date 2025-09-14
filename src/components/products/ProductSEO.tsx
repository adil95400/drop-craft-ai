import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AsyncButton } from '@/components/ui/async-button'
import { useRealProducts } from '@/hooks/useRealProducts'
import { useToast } from '@/hooks/use-toast'
import { 
  Search, TrendingUp, Eye, Target, CheckCircle, 
  AlertCircle, Lightbulb, Globe, BarChart3, Zap
} from 'lucide-react'

export function ProductSEO() {
  const { products, isLoading, updateProduct } = useRealProducts()
  const { toast } = useToast()
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [seoData, setSeoData] = useState({
    title: '',
    description: '',
    keywords: '',
    alt_text: ''
  })

  // Données simulées pour l'analyse SEO
  const seoAnalysis = {
    score: 78,
    issues: [
      {
        type: 'warning',
        title: 'Meta description trop courte',
        description: 'Votre meta description fait moins de 120 caractères',
        fix: 'Ajoutez plus de détails sur le produit'
      },
      {
        type: 'error',
        title: 'Mots-clés manquants',
        description: 'Aucun mot-clé n\'est défini pour ce produit',
        fix: 'Ajoutez des mots-clés pertinents'
      },
      {
        type: 'success',
        title: 'Titre optimisé',
        description: 'Votre titre contient le mot-clé principal',
        fix: null
      }
    ],
    keywords: [
      { keyword: 'smartphone premium', volume: 8100, difficulty: 65, ranking: 12 },
      { keyword: 'téléphone haut de gamme', volume: 2900, difficulty: 58, ranking: 8 },
      { keyword: 'mobile Apple', volume: 12000, difficulty: 78, ranking: 15 },
      { keyword: 'iPhone 15', volume: 45000, difficulty: 85, ranking: 22 }
    ],
    competitors: [
      { name: 'Concurrent A', ranking: 3, domain: 'concurrent-a.fr' },
      { name: 'Concurrent B', ranking: 7, domain: 'concurrent-b.com' },
      { name: 'Concurrent C', ranking: 11, domain: 'concurrent-c.fr' }
    ]
  }

  const selectedProductData = products.find(p => p.id === selectedProduct)

  const getSeoScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6" />
            Optimisation SEO
          </h2>
          <p className="text-muted-foreground">
            Optimisez vos produits pour les moteurs de recherche
          </p>
        </div>
        <AsyncButton onClick={async () => {
          // Simuler la génération d'un rapport SEO
          await new Promise(resolve => setTimeout(resolve, 2000))
          toast({
            title: "Rapport SEO généré",
            description: "Le rapport SEO complet a été généré avec succès",
          })
        }}
        loadingText="Génération du rapport..."
        successMessage="Rapport généré !"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Rapport SEO
        </AsyncButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner un produit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {products.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedProduct === product.id
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedProduct(product.id)}
                >
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {product.category} • {product.sku}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* SEO Analysis */}
        <div className="lg:col-span-2">
          {selectedProduct ? (
            <Tabs defaultValue="analysis" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="analysis">Analyse</TabsTrigger>
                <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
                <TabsTrigger value="competition">Concurrence</TabsTrigger>
                <TabsTrigger value="optimization">Optimisation</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-4">
                {/* SEO Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Score SEO
                      <Badge variant="outline" className={getSeoScoreColor(seoAnalysis.score)}>
                        {seoAnalysis.score}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={seoAnalysis.score} className="mb-4" />
                    <div className="space-y-3">
                      {seoAnalysis.issues.map((issue, index) => (
                        <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{issue.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {issue.description}
                            </div>
                            {issue.fix && (
                              <div className="text-xs text-primary mt-1">
                                💡 {issue.fix}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Eye className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold">2.4K</div>
                      <div className="text-sm text-muted-foreground">Vues/mois</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-sm text-muted-foreground">Position moy.</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold">+15%</div>
                      <div className="text-sm text-muted-foreground">Ce mois</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="keywords" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recherche par mots-clés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {seoAnalysis.keywords.map((keyword, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{keyword.keyword}</div>
                            <div className="text-sm text-muted-foreground">
                              {keyword.volume.toLocaleString()} recherches/mois
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={keyword.ranking <= 10 ? "default" : "secondary"}
                              className="mb-1"
                            >
                              #{keyword.ranking}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              Difficulté: {keyword.difficulty}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="competition" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Analyse concurrentielle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {seoAnalysis.competitors.map((competitor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{competitor.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {competitor.domain}
                            </div>
                          </div>
                          <Badge variant="outline">
                            Position #{competitor.ranking}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="optimization" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimisation du produit</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="seo-title">Titre SEO</Label>
                      <Input
                        id="seo-title"
                        value={seoData.title}
                        onChange={(e) => setSeoData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Titre optimisé pour le SEO"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {seoData.title.length}/60 caractères
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="seo-description">Meta description</Label>
                      <Textarea
                        id="seo-description"
                        value={seoData.description}
                        onChange={(e) => setSeoData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description pour les moteurs de recherche"
                        rows={3}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {seoData.description.length}/160 caractères
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="seo-keywords">Mots-clés</Label>
                      <Input
                        id="seo-keywords"
                        value={seoData.keywords}
                        onChange={(e) => setSeoData(prev => ({ ...prev, keywords: e.target.value }))}
                        placeholder="mot-clé1, mot-clé2, mot-clé3"
                      />
                    </div>

                    <div>
                      <Label htmlFor="alt-text">Texte alternatif des images</Label>
                      <Input
                        id="alt-text"
                        value={seoData.alt_text}
                        onChange={(e) => setSeoData(prev => ({ ...prev, alt_text: e.target.value }))}
                        placeholder="Description de l'image pour l'accessibilité"
                      />
                    </div>

                    <AsyncButton 
                      className="w-full"
                      onClick={async () => {
                        // Simuler la sauvegarde des optimisations SEO
                        await new Promise(resolve => setTimeout(resolve, 1500))
                        if (selectedProductData) {
                          await updateProduct({
                            id: selectedProductData.id,
                            updates: {
                              name: seoData.title || selectedProductData.name,
                              description: seoData.description || selectedProductData.description
                            }
                          })
                        }
                        toast({
                          title: "Optimisations sauvegardées",
                          description: "Les paramètres SEO ont été mis à jour avec succès",
                        })
                      }}
                      loadingText="Sauvegarde..."
                      successMessage="Sauvegardé !"
                      showSuccessState
                      icon={<Zap className="h-4 w-4" />}
                    >
                      Sauvegarder les optimisations
                    </AsyncButton>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez un produit</h3>
                <p className="text-muted-foreground">
                  Choisissez un produit dans la liste pour commencer l'analyse SEO.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}