import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Tag, 
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export default function AttributesManager() {
  const navigate = useNavigate()
  const { user } = useUnifiedAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'products' | 'imported_products' | 'supplier_products'>('products')

  // Récupérer les attributs IA
  const { data: attributes, isLoading } = useQuery({
    queryKey: ['product-ai-attributes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_ai_attributes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  // Catégorisation en batch
  const categorizeProducts = useMutation({
    mutationFn: async (productIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('categorize-products-ai', {
        body: { productIds, productSource: activeTab, userId: user?.id }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`${data.processed} produits catégorisés avec succès`)
      queryClient.invalidateQueries({ queryKey: ['product-ai-attributes'] })
    },
    onError: (error) => {
      console.error('Error categorizing:', error)
      toast.error('Erreur lors de la catégorisation')
    }
  })

  // Analyse shopping readiness
  const analyzeReadiness = useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-shopping-readiness', {
        body: { productId, productSource: activeTab, userId: user?.id }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      const ready = data.analysis.google_ready && data.analysis.chatgpt_ready
      if (ready) {
        toast.success('✅ Produit prêt pour Google AI & ChatGPT Shopping')
      } else {
        toast.warning('⚠️ Améliorations nécessaires pour l\'indexation')
      }
      queryClient.invalidateQueries({ queryKey: ['product-ai-attributes'] })
    },
    onError: (error) => {
      console.error('Error analyzing readiness:', error)
      toast.error('Erreur lors de l\'analyse')
    }
  })

  const googleReadyCount = attributes?.filter(a => a.google_shopping_ready).length || 0
  const chatgptReadyCount = attributes?.filter(a => a.chatgpt_shopping_ready).length || 0
  const totalAttributes = attributes?.length || 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/audit')} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tag className="h-8 w-8 text-primary" />
            Gestionnaire d'Attributs IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Catégorisation et optimisation pour Google AI / ChatGPT Shopping
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attributs Générés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttributes}</div>
            <p className="text-xs text-muted-foreground">Produits avec attributs IA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Google Shopping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{googleReadyCount}</div>
            <p className="text-xs text-muted-foreground">Prêts pour indexation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ChatGPT Shopping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{chatgptReadyCount}</div>
            <p className="text-xs text-muted-foreground">Prêts pour indexation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confiance Moy.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attributes && attributes.length > 0
                ? Math.round((attributes.reduce((sum, a) => sum + (a.category_confidence || 0), 0) / attributes.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Catégorisation IA</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des attributs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attributs par Produit</CardTitle>
              <CardDescription>Catégories IA et statut d'indexation shopping</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Chargement...</div>
          ) : !attributes || attributes.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun attribut généré</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par générer des attributs pour vos produits
              </p>
              <Button onClick={() => navigate('/audit/products')}>
                <Sparkles className="mr-2 h-4 w-4" />
                Générer des Attributs
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {attributes.map((attr) => (
                <div
                  key={attr.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">
                        Produit {attr.product_id.slice(0, 8)}
                      </div>
                      {attr.category_confidence && (
                        <Badge variant="outline">
                          {Math.round(attr.category_confidence * 100)}% confiance
                        </Badge>
                      )}
                    </div>

                    {attr.ai_category && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge>{attr.ai_category}</Badge>
                        {attr.ai_subcategory && (
                          <Badge variant="secondary">{attr.ai_subcategory}</Badge>
                        )}
                      </div>
                    )}

                    {attr.color && attr.color.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Couleurs:</span>
                        {attr.color.map((c, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {attr.style && attr.style.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Styles:</span>
                        {attr.style.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Statut Google Shopping */}
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Google</div>
                      {attr.google_shopping_ready ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </div>

                    {/* Statut ChatGPT Shopping */}
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">ChatGPT</div>
                      {attr.chatgpt_shopping_ready ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => analyzeReadiness.mutate(attr.product_id)}
                      disabled={analyzeReadiness.isPending}
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Analyser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}