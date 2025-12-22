import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    onError: () => toast.error('Erreur lors de la catégorisation')
  })

  const analyzeReadiness = useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-shopping-readiness', {
        body: { productId, productSource: activeTab, userId: user?.id }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Analyse terminée')
      queryClient.invalidateQueries({ queryKey: ['product-ai-attributes'] })
    },
    onError: () => toast.error('Erreur lors de l\'analyse')
  })

  const approvedCount = attributes?.filter((a: any) => a.is_approved).length || 0
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
            <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Prêts pour indexation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalAttributes - approvedCount}</div>
            <p className="text-xs text-muted-foreground">À valider</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confiance Moy.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attributes && attributes.length > 0
                ? Math.round((attributes.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / attributes.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Catégorisation IA</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attributs par Produit</CardTitle>
          <CardDescription>Catégories IA et statut d'indexation shopping</CardDescription>
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
                        Produit {attr.product_id?.slice(0, 8)}
                      </div>
                      {attr.confidence_score && (
                        <Badge variant="outline">
                          {Math.round(attr.confidence_score * 100)}% confiance
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge>{attr.attribute_type}</Badge>
                      <Badge variant="secondary">{attr.attribute_key}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Status</div>
                      {attr.is_approved ? (
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
