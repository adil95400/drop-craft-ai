import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Search, Sparkles, FileText, Tag, Globe, TrendingUp,
  Copy, Check, RefreshCw, Brain, Target, Zap,
  ArrowRight, AlertCircle, CheckCircle, Languages
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SEOContent {
  title: string
  metaDescription: string
  h1: string
  keywords: string[]
  bulletPoints: string[]
  richDescription: string
  ogTitle: string
  ogDescription: string
  structuredData: object
}

interface ProductForSEO {
  id: string
  name: string
  category: string
  price: number
  currentSEO?: Partial<SEOContent>
}

export function AdvancedSEOGenerator() {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductForSEO | null>(null)
  const [generatedContent, setGeneratedContent] = useState<SEOContent | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [targetLanguage, setTargetLanguage] = useState('fr')
  const [targetPlatform, setTargetPlatform] = useState('shopify')
  const [seoStyle, setSeoStyle] = useState('persuasive')

  const [products] = useState<ProductForSEO[]>([
    {
      id: '1',
      name: 'Coque iPhone 15 Pro Max Premium',
      category: 'Accessoires Téléphone',
      price: 29.99,
      currentSEO: {
        title: 'Coque iPhone 15',
        metaDescription: 'Coque pour iPhone'
      }
    },
    {
      id: '2',
      name: 'Écouteurs Bluetooth Sans Fil Pro',
      category: 'Audio',
      price: 89.99
    },
    {
      id: '3',
      name: 'Chargeur USB-C 65W Rapide',
      category: 'Chargeurs',
      price: 34.99
    }
  ])

  const [bulkProducts, setBulkProducts] = useState<string[]>([])
  const [bulkProgress, setBulkProgress] = useState(0)
  const [isBulkGenerating, setIsBulkGenerating] = useState(false)

  const generateSEO = async (product: ProductForSEO) => {
    setIsGenerating(true)
    setSelectedProduct(product)

    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000))

    const generated: SEOContent = {
      title: `${product.name} - Livraison Gratuite | ShopOpti`,
      metaDescription: `Découvrez notre ${product.name} de qualité premium. ✓ Livraison rapide ✓ Satisfait ou remboursé ✓ Service client 24/7. Commandez maintenant !`,
      h1: `${product.name} - La Référence Qualité`,
      keywords: [
        product.name.toLowerCase(),
        product.category.toLowerCase(),
        'pas cher',
        'livraison gratuite',
        'meilleur prix',
        'qualité premium',
        'garantie',
        'avis clients'
      ],
      bulletPoints: [
        '✅ Qualité premium garantie',
        '✅ Livraison offerte dès 25€',
        '✅ Retour gratuit sous 30 jours',
        '✅ Service client réactif 24/7',
        '✅ Paiement sécurisé'
      ],
      richDescription: `<h2>Pourquoi choisir notre ${product.name} ?</h2>
<p>Notre ${product.name} allie qualité, design et performance pour une expérience utilisateur exceptionnelle.</p>
<h3>Caractéristiques principales</h3>
<ul>
  <li>Matériaux de haute qualité</li>
  <li>Design moderne et élégant</li>
  <li>Compatibilité universelle</li>
</ul>
<h3>Ce que nos clients en disent</h3>
<p>Plus de 5000 clients satisfaits ont choisi ce produit. Note moyenne : 4.8/5</p>`,
      ogTitle: `${product.name} | Offre Spéciale -20%`,
      ogDescription: `Ne manquez pas cette offre exceptionnelle sur notre ${product.name}. Qualité garantie, livraison express.`,
      structuredData: {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "category": product.category,
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock"
        }
      }
    }

    setGeneratedContent(generated)
    setIsGenerating(false)

    toast({
      title: "Contenu SEO généré",
      description: "Tous les éléments SEO ont été optimisés par l'IA"
    })
  }

  const handleBulkGenerate = async () => {
    if (bulkProducts.length === 0) {
      toast({
        title: "Aucun produit sélectionné",
        description: "Sélectionnez au moins un produit pour la génération en masse",
        variant: "destructive"
      })
      return
    }

    setIsBulkGenerating(true)
    setBulkProgress(0)

    for (let i = 0; i < bulkProducts.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setBulkProgress(((i + 1) / bulkProducts.length) * 100)
    }

    setIsBulkGenerating(false)
    setBulkProducts([])

    toast({
      title: "Génération terminée",
      description: `${bulkProducts.length} produits ont été optimisés pour le SEO`
    })
  }

  const copyToClipboard = (field: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
    toast({
      title: "Copié",
      description: "Le contenu a été copié dans le presse-papiers"
    })
  }

  const toggleBulkProduct = (productId: string) => {
    setBulkProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Générateur SEO Avancé
          </h2>
          <p className="text-muted-foreground">
            Optimisez vos titres, descriptions et mots-clés avec l'IA
          </p>
        </div>
      </div>

      {/* Settings Row */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Langue cible</Label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                  <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Plateforme</Label>
              <Select value={targetPlatform} onValueChange={setTargetPlatform}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="woocommerce">WooCommerce</SelectItem>
                  <SelectItem value="prestashop">PrestaShop</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                  <SelectItem value="ebay">eBay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Style SEO</Label>
              <Select value={seoStyle} onValueChange={setSeoStyle}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="persuasive">Persuasif</SelectItem>
                  <SelectItem value="informative">Informatif</SelectItem>
                  <SelectItem value="minimal">Minimaliste</SelectItem>
                  <SelectItem value="premium">Premium/Luxe</SelectItem>
                  <SelectItem value="fun">Fun/Décontracté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="single" className="space-y-4">
        <TabsList>
          <TabsTrigger value="single">Génération Unitaire</TabsTrigger>
          <TabsTrigger value="bulk">Génération en Masse</TabsTrigger>
          <TabsTrigger value="audit">Audit SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Sélectionner un Produit</CardTitle>
                <CardDescription>Choisissez le produit à optimiser</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedProduct?.id === product.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product.price)}
                        </div>
                        {product.currentSEO ? (
                          <Badge variant="outline" className="text-xs">SEO existant</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Non optimisé</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  className="w-full mt-4"
                  onClick={() => selectedProduct && generateSEO(selectedProduct)}
                  disabled={!selectedProduct || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Générer le contenu SEO
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Content */}
            <Card>
              <CardHeader>
                <CardTitle>Contenu SEO Généré</CardTitle>
                <CardDescription>
                  {generatedContent
                    ? 'Contenu optimisé prêt à être utilisé'
                    : 'Sélectionnez un produit et cliquez sur Générer'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedContent ? (
                  <div className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Titre SEO
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard('title', generatedContent.title)}
                        >
                          {copiedField === 'title' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Input value={generatedContent.title} readOnly />
                      <div className="flex items-center gap-2 text-xs">
                        <span className={generatedContent.title.length <= 60 ? 'text-green-600' : 'text-red-600'}>
                          {generatedContent.title.length}/60 caractères
                        </span>
                        {generatedContent.title.length <= 60 ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Meta Description
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard('meta', generatedContent.metaDescription)}
                        >
                          {copiedField === 'meta' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Textarea value={generatedContent.metaDescription} readOnly rows={3} />
                      <div className="flex items-center gap-2 text-xs">
                        <span className={generatedContent.metaDescription.length <= 160 ? 'text-green-600' : 'text-red-600'}>
                          {generatedContent.metaDescription.length}/160 caractères
                        </span>
                        {generatedContent.metaDescription.length <= 160 ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Mots-clés suggérés
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.keywords.map((keyword, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => copyToClipboard(`keyword-${idx}`, keyword)}
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Points clés produit</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard('bullets', generatedContent.bulletPoints.join('\n'))}
                        >
                          {copiedField === 'bullets' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                        {generatedContent.bulletPoints.map((point, idx) => (
                          <div key={idx}>{point}</div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 flex gap-2">
                      <Button className="flex-1">
                        <Check className="h-4 w-4 mr-2" />
                        Appliquer au produit
                      </Button>
                      <Button variant="outline" onClick={() => selectedProduct && generateSEO(selectedProduct)}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sélectionnez un produit et générez son contenu SEO optimisé</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Génération SEO en Masse</CardTitle>
              <CardDescription>
                Optimisez plusieurs produits simultanément
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Product Selection */}
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 flex items-center gap-3 hover:bg-muted/30"
                    >
                      <Checkbox
                        checked={bulkProducts.includes(product.id)}
                        onCheckedChange={() => toggleBulkProduct(product.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.category}</div>
                      </div>
                      {product.currentSEO ? (
                        <Badge variant="outline" className="text-xs">Existant</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">À créer</Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Selection Summary */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm">
                    {bulkProducts.length} produit(s) sélectionné(s)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkProducts(products.map(p => p.id))}
                    >
                      Tout sélectionner
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkProducts([])}
                    >
                      Désélectionner
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                {isBulkGenerating && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progression</span>
                      <span>{Math.round(bulkProgress)}%</span>
                    </div>
                    <Progress value={bulkProgress} className="h-2" />
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleBulkGenerate}
                  disabled={bulkProducts.length === 0 || isBulkGenerating}
                >
                  {isBulkGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Générer pour {bulkProducts.length} produit(s)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit SEO du Catalogue</CardTitle>
              <CardDescription>
                Analysez la qualité SEO de vos produits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">45</div>
                    <div className="text-sm text-muted-foreground">Optimisés</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">23</div>
                    <div className="text-sm text-muted-foreground">À améliorer</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">12</div>
                    <div className="text-sm text-muted-foreground">Critiques</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">78%</div>
                    <div className="text-sm text-muted-foreground">Score global</div>
                  </div>
                </div>

                {/* Issues List */}
                <div className="space-y-3">
                  <h3 className="font-medium">Problèmes détectés</h3>
                  
                  <div className="p-3 border border-red-200 bg-red-50 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">12 produits sans meta description</div>
                      <div className="text-xs text-muted-foreground">Impact SEO élevé</div>
                    </div>
                    <Button size="sm" variant="outline">
                      Corriger
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>

                  <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">23 titres trop longs (&gt;60 caractères)</div>
                      <div className="text-xs text-muted-foreground">Impact SEO moyen</div>
                    </div>
                    <Button size="sm" variant="outline">
                      Corriger
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>

                  <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">8 produits sans mots-clés</div>
                      <div className="text-xs text-muted-foreground">Impact SEO moyen</div>
                    </div>
                    <Button size="sm" variant="outline">
                      Corriger
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>

                <Button className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Corriger tous les problèmes avec l'IA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
