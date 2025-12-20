import React, { useState, useEffect } from 'react'
import { Edit3, Save, Eye, Wand2, Globe, ImageIcon, DollarSign, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface ProductDraft {
  id: string
  name: string
  description: string
  price: number
  cost_price?: number
  currency: string
  sku: string
  category: string
  brand?: string
  tags: string[]
  image_urls: string[]
  variants: ProductVariant[]
  seo_data: {
    title?: string
    description?: string
    keywords?: string[]
  }
  translations: {
    [lang: string]: {
      name: string
      description: string
      seo_title?: string
      seo_description?: string
    }
  }
  status: 'draft' | 'review' | 'published'
}

interface ProductVariant {
  id: string
  name: string
  sku: string
  price: number
  cost_price?: number
  stock_quantity: number
  attributes: {
    [key: string]: string
  }
}

interface ProductDraftEditorProps {
  productId?: string
  onSave?: (product: ProductDraft) => void
  onPublish?: (product: ProductDraft) => void
}

const supportedLanguages = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' }
]

export const ProductDraftEditor: React.FC<ProductDraftEditorProps> = ({
  productId,
  onSave,
  onPublish
}) => {
  const { toast } = useToast()
  const [product, setProduct] = useState<ProductDraft>({
    id: productId || '',
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    currency: 'EUR',
    sku: '',
    category: '',
    brand: '',
    tags: [],
    image_urls: [],
    variants: [],
    seo_data: {},
    translations: {},
    status: 'draft'
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiOptimizing, setAiOptimizing] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [showPreview, setShowPreview] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')

  useEffect(() => {
    if (productId) {
      loadProduct()
    }
  }, [productId])

  const loadProduct = async () => {
    setLoading(true)
    try {
      // Load from products table instead of imported_products
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error

      setProduct({
        id: data.id,
        name: data.name || data.title || '',
        description: data.description || '',
        price: data.price || 0,
        cost_price: data.cost_price || 0,
        currency: 'EUR',
        sku: data.sku || '',
        category: data.category || '',
        brand: data.brand || '',
        tags: data.tags || [],
        image_urls: data.images ? (Array.isArray(data.images) ? (data.images as string[]) : []) : (data.image_url ? [data.image_url] : []),
        variants: [],
        seo_data: {
          title: data.seo_title || '',
          description: data.seo_description || '',
          keywords: []
        },
        translations: {},
        status: (data.status === 'published' || data.status === 'draft' || data.status === 'review') 
          ? data.status 
          : 'draft'
      })
    } catch (error) {
      console.error('Error loading product:', error)
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger le produit",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveProduct = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const productData = {
        user_id: user.id,
        title: product.name,
        name: product.name,
        description: product.description,
        price: product.price,
        cost_price: product.cost_price,
        sku: product.sku,
        category: product.category,
        brand: product.brand,
        tags: product.tags,
        images: product.image_urls,
        image_url: product.image_urls[0] || null,
        seo_title: product.seo_data.title,
        seo_description: product.seo_data.description,
        status: product.status
      }

      if (productId) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
        
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single()
        
        if (error) throw error
        setProduct(prev => ({ ...prev, id: data.id }))
      }

      toast({
        title: "Produit sauvegardé",
        description: "Les modifications ont été enregistrées"
      })

      onSave?.(product)
    } catch (error) {
      console.error('Error saving product:', error)
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder le produit",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const optimizeWithAI = async () => {
    setAiOptimizing(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-optimizer', {
        body: {
          product: {
            name: product.name,
            description: product.description,
            category: product.category,
            brand: product.brand
          }
        }
      })

      if (error) throw error

      setProduct(prev => ({
        ...prev,
        name: data.optimized_name || prev.name,
        description: data.optimized_description || prev.description,
        seo_data: {
          ...prev.seo_data,
          title: data.seo_title,
          description: data.seo_description,
          keywords: data.seo_keywords
        },
        tags: [...prev.tags, ...(data.suggested_tags || [])]
      }))

      toast({
        title: "Optimisation IA terminée",
        description: "Le produit a été optimisé avec l'IA"
      })
    } catch (error) {
      console.error('Error optimizing with AI:', error)
      toast({
        title: "Erreur d'optimisation",
        description: "Impossible d'optimiser avec l'IA",
        variant: "destructive"
      })
    } finally {
      setAiOptimizing(false)
    }
  }

  const translateProduct = async (targetLanguage: string) => {
    setTranslating(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-translator', {
        body: {
          text: {
            name: product.name,
            description: product.description,
            seo_title: product.seo_data.title,
            seo_description: product.seo_data.description
          },
          targetLanguage
        }
      })

      if (error) throw error

      setProduct(prev => ({
        ...prev,
        translations: {
          ...prev.translations,
          [targetLanguage]: {
            name: data.translated_name,
            description: data.translated_description,
            seo_title: data.translated_seo_title,
            seo_description: data.translated_seo_description
          }
        }
      }))

      toast({
        title: "Traduction terminée",
        description: `Produit traduit en ${supportedLanguages.find(l => l.code === targetLanguage)?.name}`
      })
    } catch (error) {
      console.error('Error translating product:', error)
      toast({
        title: "Erreur de traduction",
        description: "Impossible de traduire le produit",
        variant: "destructive"
      })
    } finally {
      setTranslating(false)
    }
  }

  const addTag = () => {
    if (newTag && !product.tags.includes(newTag)) {
      setProduct(prev => ({ ...prev, tags: [...prev.tags, newTag] }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setProduct(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  const addImage = () => {
    if (newImageUrl && !product.image_urls.includes(newImageUrl)) {
      setProduct(prev => ({ ...prev, image_urls: [...prev.image_urls, newImageUrl] }))
      setNewImageUrl('')
    }
  }

  const removeImage = (urlToRemove: string) => {
    setProduct(prev => ({ ...prev, image_urls: prev.image_urls.filter(url => url !== urlToRemove) }))
  }

  const publishProduct = async () => {
    await saveProduct()
    setProduct(prev => ({ ...prev, status: 'published' }))
    onPublish?.(product)
    
    toast({
      title: "Produit publié",
      description: "Le produit est maintenant disponible en ligne"
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Chargement du produit...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Éditeur de produit
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={optimizeWithAI}
                disabled={aiOptimizing}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {aiOptimizing ? 'Optimisation...' : 'Optimiser avec IA'}
              </Button>
              <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Prévisualiser
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Prévisualisation du produit</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">{product.name}</h2>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                    {product.image_urls[0] && (
                      <img src={product.image_urls[0]} alt={product.name} className="w-full h-48 object-cover rounded" />
                    )}
                    <p className="text-lg font-semibold">{product.price} {product.currency}</p>
                    <p className="text-muted-foreground">{product.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {product.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={saveProduct} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
              <Button onClick={publishProduct} disabled={saving || product.status === 'published'}>
                {product.status === 'published' ? 'Publié' : 'Publier'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Informations</TabsTrigger>
              <TabsTrigger value="pricing">Prix</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="translations">Traductions</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du produit</Label>
                  <Input
                    id="name"
                    value={product.name}
                    onChange={(e) => setProduct(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={product.sku}
                    onChange={(e) => setProduct(prev => ({ ...prev, sku: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={product.description}
                  onChange={(e) => setProduct(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Input
                    id="category"
                    value={product.category}
                    onChange={(e) => setProduct(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marque</Label>
                  <Input
                    id="brand"
                    value={product.brand}
                    onChange={(e) => setProduct(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {product.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nouveau tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} variant="outline">
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix de vente</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => setProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Prix d'achat</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      value={product.cost_price || ''}
                      onChange={(e) => setProduct(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select
                    value={product.currency}
                    onValueChange={(value) => setProduct(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {product.price > 0 && product.cost_price && product.cost_price > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Marge bénéficiaire</span>
                      <span className="text-lg font-bold text-green-600">
                        {(((product.price - product.cost_price) / product.price) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium">Bénéfice par unité</span>
                      <span className="text-lg font-bold">
                        {(product.price - product.cost_price).toFixed(2)} {product.currency}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="images" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Images du produit</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {product.image_urls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt={`Image ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(url)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="URL de l'image"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addImage()}
                  />
                  <Button onClick={addImage} variant="outline">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="seo_title">Titre SEO</Label>
                <Input
                  id="seo_title"
                  value={product.seo_data.title || ''}
                  onChange={(e) => setProduct(prev => ({
                    ...prev,
                    seo_data: { ...prev.seo_data, title: e.target.value }
                  }))}
                  placeholder="Titre optimisé pour les moteurs de recherche"
                />
                <p className="text-xs text-muted-foreground">
                  {(product.seo_data.title || '').length}/60 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description">Meta description</Label>
                <Textarea
                  id="seo_description"
                  rows={3}
                  value={product.seo_data.description || ''}
                  onChange={(e) => setProduct(prev => ({
                    ...prev,
                    seo_data: { ...prev.seo_data, description: e.target.value }
                  }))}
                  placeholder="Description courte pour les résultats de recherche"
                />
                <p className="text-xs text-muted-foreground">
                  {(product.seo_data.description || '').length}/160 caractères
                </p>
              </div>
            </TabsContent>

            <TabsContent value="translations" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Traduire automatiquement</Label>
                  <div className="flex gap-2">
                    {supportedLanguages.filter(l => l.code !== 'fr').map(lang => (
                      <Button
                        key={lang.code}
                        variant="outline"
                        size="sm"
                        onClick={() => translateProduct(lang.code)}
                        disabled={translating}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        {lang.code.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                {Object.entries(product.translations).map(([langCode, translation]) => (
                  <Card key={langCode}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {supportedLanguages.find(l => l.code === langCode)?.name || langCode}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Nom</Label>
                        <p className="text-sm">{translation.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Description</Label>
                        <p className="text-sm text-muted-foreground">{translation.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
