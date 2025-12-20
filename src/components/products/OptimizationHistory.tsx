import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { History, RotateCcw, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useState } from 'react'

interface OptimizationHistoryProps {
  productId: string
  sourceTable: 'products' | 'imported_products' | 'supplier_products'
}

interface HistoryEntry {
  id: string
  product_id: string
  optimization_type: string
  before_data: any
  after_data: any
  applied: boolean
  reverted: boolean
  created_at: string
}

export function OptimizationHistory({ productId, sourceTable }: OptimizationHistoryProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // Use mock data since product_optimization_history table doesn't exist
  const { isLoading } = useQuery({
    queryKey: ['optimization-history', productId],
    queryFn: async () => {
      // Mock history data
      const mockHistory: HistoryEntry[] = [
        {
          id: '1',
          product_id: productId,
          optimization_type: 'title',
          before_data: { title: 'Old Product Title' },
          after_data: { title: 'Optimized Product Title with Keywords' },
          applied: true,
          reverted: false,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          product_id: productId,
          optimization_type: 'description',
          before_data: { description: 'Basic description' },
          after_data: { description: 'Enhanced SEO-optimized description with benefits and features' },
          applied: false,
          reverted: false,
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]
      setHistory(mockHistory)
      return mockHistory
    }
  })

  const revertOptimization = useMutation({
    mutationFn: async (historyId: string) => {
      // Simulate revert
      await new Promise(resolve => setTimeout(resolve, 500))
      setHistory(prev => prev.map(h => 
        h.id === historyId ? { ...h, reverted: true } : h
      ))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization-history', productId] })
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
      // Simulate apply
      await new Promise(resolve => setTimeout(resolve, 500))
      setHistory(prev => prev.map(h => 
        h.id === historyId ? { ...h, applied: true } : h
      ))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization-history', productId] })
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
