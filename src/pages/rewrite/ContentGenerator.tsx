import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { 
  Sparkles, 
  FileText, 
  Copy, 
  Check,
  ArrowLeft,
  Wand2
} from 'lucide-react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useContentRewriter } from '@/hooks/useContentRewriter'

export default function ContentGenerator() {
  const navigate = useNavigate()
  const { user } = useUnifiedAuth()
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedSource, setSelectedSource] = useState<'products' | 'imported_products' | 'supplier_products'>('products')
  const [rewriteType, setRewriteType] = useState<'title' | 'description' | 'both'>('both')
  const [tone, setTone] = useState<'professional' | 'casual' | 'luxury' | 'technical' | 'creative'>('professional')
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { rewriteContent, applyRewrite, isRewriting, isApplying } = useContentRewriter()

  // Récupérer les produits
  const { data: products } = useQuery({
    queryKey: ['products-for-rewrite', selectedSource, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, category')
        .eq('user_id', user?.id)
        .limit(100)

      if (error) throw error
      return data as any[]
    },
    enabled: !!user?.id,
  })

  const handleGenerate = async () => {
    if (!selectedProduct || !user?.id) return

    const result = await rewriteContent.mutateAsync({
      productId: selectedProduct,
      productSource: selectedSource,
      userId: user.id,
      rewriteType,
      tone
    })

    if (result.success) {
      setGeneratedContent(result.rewrite)
    }
  }

  const handleApply = async () => {
    if (!generatedContent || !selectedProduct) return

    await applyRewrite.mutateAsync({
      rewriteId: generatedContent.id,
      productId: selectedProduct,
      productSource: selectedSource
    })

    setGeneratedContent(null)
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const selectedProductData = products?.find(p => p.id === selectedProduct)

  const toneDescriptions = {
    professional: 'Formel et premium, adapté au B2B',
    casual: 'Décontracté et amical',
    luxury: 'Luxueux et exclusif',
    technical: 'Technique et précis',
    creative: 'Créatif et storytelling'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/audit')} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Générateur de Contenu IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez des titres et descriptions optimisés pour la conversion
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Sélectionnez le produit et le style de contenu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sélection source */}
            <div className="space-y-2">
              <Label>Source des produits</Label>
              <Tabs value={selectedSource} onValueChange={(v) => setSelectedSource(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="products">Mes Produits</TabsTrigger>
                  <TabsTrigger value="imported_products">Importés</TabsTrigger>
                  <TabsTrigger value="supplier_products">Fournisseurs</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Sélection produit */}
            <div className="space-y-2">
              <Label>Produit</Label>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Sélectionnez un produit</option>
                {products?.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name || 'Sans nom'} - {product.price}€
                  </option>
                ))}
              </select>
            </div>

            {/* Type de réécriture */}
            <div className="space-y-2">
              <Label>Que voulez-vous générer ?</Label>
              <RadioGroup value={rewriteType} onValueChange={(v) => setRewriteType(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="title" id="title" />
                  <Label htmlFor="title">Titre uniquement</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="description" id="description" />
                  <Label htmlFor="description">Description uniquement</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both">Titre + Description</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Ton */}
            <div className="space-y-2">
              <Label>Ton du contenu</Label>
              <RadioGroup value={tone} onValueChange={(v) => setTone(v as any)}>
                {Object.entries(toneDescriptions).map(([key, desc]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <RadioGroupItem value={key} id={key} />
                    <Label htmlFor={key} className="flex flex-col">
                      <span className="font-medium capitalize">{key}</span>
                      <span className="text-xs text-muted-foreground">{desc}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={!selectedProduct || isRewriting}
              className="w-full"
              size="lg"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              {isRewriting ? 'Génération en cours...' : 'Générer le Contenu'}
            </Button>
          </CardContent>
        </Card>

        {/* Résultat */}
        <Card>
          <CardHeader>
            <CardTitle>Contenu Généré</CardTitle>
            <CardDescription>
              {generatedContent ? 'Prévisualisez et appliquez les modifications' : 'Le contenu apparaîtra ici'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!generatedContent ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Configurez et générez du contenu pour le voir ici
                </p>
              </div>
            ) : (
              <>
                {/* Contenu original */}
                {selectedProductData && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <Badge variant="outline">Contenu Original</Badge>
                    {selectedProductData.name && (
                      <div>
                        <div className="text-xs text-muted-foreground">Titre</div>
                        <div className="font-medium">{selectedProductData.name}</div>
                      </div>
                    )}
                    {selectedProductData.description && (
                      <div>
                        <div className="text-xs text-muted-foreground">Description</div>
                        <div className="text-sm">{selectedProductData.description}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Nouveau contenu */}
                <div className="space-y-4">
                  <Badge className="bg-green-100 text-green-800">Nouveau Contenu ✨</Badge>
                  
                  {generatedContent.rewritten_title && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-muted-foreground">TITRE</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.rewritten_title, 'title')}
                        >
                          {copiedField === 'title' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="font-semibold">{generatedContent.rewritten_title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {generatedContent.rewritten_title.length} caractères
                      </div>
                    </div>
                  )}

                  {generatedContent.rewritten_description && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-muted-foreground">DESCRIPTION</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.rewritten_description, 'description')}
                        >
                          {copiedField === 'description' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{generatedContent.rewritten_description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {generatedContent.rewritten_description.split(' ').length} mots
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleApply} 
                    disabled={isApplying}
                    className="flex-1"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {isApplying ? 'Application...' : 'Appliquer au Produit'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleGenerate}
                    disabled={isRewriting}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Regénérer
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}