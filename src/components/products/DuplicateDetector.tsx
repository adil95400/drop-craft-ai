import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Merge, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'

interface DuplicateDetectorProps {
  products: UnifiedProduct[]
}

export function DuplicateDetector({ products }: DuplicateDetectorProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: duplicates, isLoading } = useQuery({
    queryKey: ['duplicate-detection', products.length],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Détection locale des doublons
      const titleMap = new Map<string, UnifiedProduct[]>()
      
      products.forEach(product => {
        const normalizedTitle = product.name.toLowerCase().trim()
        if (!titleMap.has(normalizedTitle)) {
          titleMap.set(normalizedTitle, [])
        }
        titleMap.get(normalizedTitle)!.push(product)
      })

      const duplicateGroups = Array.from(titleMap.entries())
        .filter(([_, prods]) => prods.length > 1)
        .map(([title, prods]) => ({
          title,
          products: prods,
          count: prods.length
        }))

      return duplicateGroups
    }
  })

  const mergeProducts = useMutation({
    mutationFn: async ({ keepId, removeIds }: { keepId: string; removeIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Supprimer les doublons
      for (const id of removeIds) {
        const product = products.find(p => p.id === id)
        if (!product) continue

        await supabase
          .from(product.source === 'products' ? 'products' : 'imported_products')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-products'] })
      queryClient.invalidateQueries({ queryKey: ['duplicate-detection'] })
      toast({
        title: "Fusion réussie",
        description: "Les doublons ont été fusionnés"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de fusionner les doublons",
        variant: "destructive"
      })
    }
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Analyse en cours...</div>
        </CardContent>
      </Card>
    )
  }

  if (!duplicates || duplicates.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50 text-green-600" />
            <p>Aucun doublon détecté ✨</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Doublons Détectés
          </span>
          <Badge variant="destructive">{duplicates.length} groupe{duplicates.length > 1 ? 's' : ''}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {duplicates.map((group, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{group.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {group.count} produit{group.count > 1 ? 's' : ''} identique{group.count > 1 ? 's' : ''}
                  </div>
                </div>
                <Badge variant="secondary">{group.count}x</Badge>
              </div>

              <div className="space-y-2">
                {group.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 rounded bg-muted">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.price}€ • Stock: {product.stock_quantity || 0} • {product.source}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const keepId = group.products[0].id
                    const removeIds = group.products.slice(1).map(p => p.id)
                    mergeProducts.mutate({ keepId, removeIds })
                  }}
                  disabled={mergeProducts.isPending}
                >
                  <Merge className="h-4 w-4 mr-2" />
                  Garder le 1er, supprimer les autres
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const removeIds = group.products.slice(1).map(p => p.id)
                    mergeProducts.mutate({ keepId: group.products[0].id, removeIds })
                  }}
                  disabled={mergeProducts.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer tous les doublons
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
