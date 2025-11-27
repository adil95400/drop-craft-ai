import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { History, RotateCcw, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface OptimizationHistoryProps {
  productId: string
  sourceTable: 'products' | 'imported_products' | 'supplier_products'
}

export function OptimizationHistory({ productId, sourceTable }: OptimizationHistoryProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: history, isLoading } = useQuery({
    queryKey: ['optimization-history', productId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('product_optimization_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('source_table', sourceTable)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    }
  })

  const revertOptimization = useMutation({
    mutationFn: async (historyId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const historyEntry = history?.find(h => h.id === historyId)
      if (!historyEntry) throw new Error('Historique introuvable')

      // Restaurer les anciennes valeurs
      const { error } = await supabase
        .from(sourceTable)
        .update(historyEntry.before_data as any)
        .eq('id', productId)
        .eq('user_id', user.id)

      if (error) throw error

      // Marquer comme reverté
      await supabase
        .from('product_optimization_history')
        .update({ 
          reverted: true, 
          reverted_at: new Date().toISOString() 
        })
        .eq('id', historyId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization-history', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      toast({
        title: "Restauration réussie",
        description: "Le produit a été restauré à sa version précédente"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer le produit",
        variant: "destructive"
      })
    }
  })

  const applyOptimization = useMutation({
    mutationFn: async (historyId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const historyEntry = history?.find(h => h.id === historyId)
      if (!historyEntry) throw new Error('Historique introuvable')

      // Appliquer les nouvelles valeurs
      const { error } = await supabase
        .from(sourceTable)
        .update(historyEntry.after_data as any)
        .eq('id', productId)
        .eq('user_id', user.id)

      if (error) throw error

      // Marquer comme appliqué
      await supabase
        .from('product_optimization_history')
        .update({ 
          applied: true, 
          applied_at: new Date().toISOString() 
        })
        .eq('id', historyId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization-history', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      toast({
        title: "Optimisation appliquée",
        description: "Les modifications ont été appliquées avec succès"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer l'optimisation",
        variant: "destructive"
      })
    }
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Chargement de l'historique...</div>
        </CardContent>
      </Card>
    )
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucune optimisation enregistrée</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const typeLabels: Record<string, string> = {
    title: 'Titre',
    description: 'Description',
    seo: 'SEO',
    attributes: 'Attributs',
    pricing: 'Prix',
    images: 'Images',
    full: 'Complète'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des Optimisations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">
                      {typeLabels[entry.optimization_type] || entry.optimization_type}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(entry.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.applied && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Appliqué
                    </Badge>
                  )}
                  {entry.reverted && (
                    <Badge variant="secondary" className="gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Annulé
                    </Badge>
                  )}
                  {!entry.applied && !entry.reverted && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      En attente
                    </Badge>
                  )}
                </div>
              </div>

              <Tabs defaultValue="after">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="before">Avant</TabsTrigger>
                  <TabsTrigger value="after">Après</TabsTrigger>
                </TabsList>
                <TabsContent value="before" className="space-y-2">
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(entry.before_data, null, 2)}
                  </pre>
                </TabsContent>
                <TabsContent value="after" className="space-y-2">
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(entry.after_data, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                {entry.applied && !entry.reverted && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => revertOptimization.mutate(entry.id)}
                    disabled={revertOptimization.isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurer version précédente
                  </Button>
                )}
                {!entry.applied && !entry.reverted && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => applyOptimization.mutate(entry.id)}
                    disabled={applyOptimization.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Appliquer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
