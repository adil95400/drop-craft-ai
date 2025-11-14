import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { SupplierRating } from '@/types/database'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Star, Clock, Package, DollarSign, MessageSquare } from 'lucide-react'

export const SupplierRatingDashboard = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)

  // Fetch supplier ratings
  const { data: ratings, isLoading } = useQuery<SupplierRating[]>({
    queryKey: ['supplier-ratings'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('supplier_ratings')
        .select('*')
        .order('overall_score', { ascending: false })

      if (error) throw error
      return data as SupplierRating[]
    }
  })

  // Recalculate score mutation
  const recalculateScore = useMutation({
    mutationFn: async (supplierId: string) => {
      const { data, error } = await supabase.functions.invoke('supplier-scorer', {
        body: { supplier_id: supplierId }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-ratings'] })
      toast({
        title: "Score recalculé",
        description: "Le score du fournisseur a été mis à jour"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de recalculer le score",
        variant: "destructive"
      })
    }
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', variant: 'default' as const }
    if (score >= 80) return { label: 'Très bon', variant: 'default' as const }
    if (score >= 70) return { label: 'Bon', variant: 'secondary' as const }
    if (score >= 60) return { label: 'Moyen', variant: 'secondary' as const }
    return { label: 'Faible', variant: 'destructive' as const }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notation des Fournisseurs</h2>
          <p className="text-muted-foreground">Scores calculés automatiquement basés sur les performances</p>
        </div>
      </div>

      {ratings && ratings.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ratings.map((rating) => {
            const badge = getScoreBadge(rating.overall_score)
            
            return (
              <Card key={rating.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Fournisseur #{rating.supplier_id.slice(-6)}</h3>
                    <Badge variant={badge.variant} className="mt-1">
                      {badge.label}
                    </Badge>
                  </div>
                  <div className={`text-3xl font-bold ${getScoreColor(rating.overall_score)}`}>
                    {rating.overall_score}
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Reliability */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4" />
                        <span>Fiabilité</span>
                      </div>
                      <span className="text-sm font-medium">{rating.reliability_score}%</span>
                    </div>
                    <Progress value={rating.reliability_score} />
                  </div>

                  {/* Quality */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4" />
                        <span>Qualité</span>
                      </div>
                      <span className="text-sm font-medium">{rating.quality_score}%</span>
                    </div>
                    <Progress value={rating.quality_score} />
                  </div>

                  {/* Shipping */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Livraison</span>
                      </div>
                      <span className="text-sm font-medium">{rating.shipping_score}%</span>
                    </div>
                    <Progress value={rating.shipping_score} />
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4" />
                        <span>Prix</span>
                      </div>
                      <span className="text-sm font-medium">{rating.price_score}%</span>
                    </div>
                    <Progress value={rating.price_score} />
                  </div>

                  {/* Communication */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4" />
                        <span>Communication</span>
                      </div>
                      <span className="text-sm font-medium">{rating.communication_score}%</span>
                    </div>
                    <Progress value={rating.communication_score} />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => recalculateScore.mutate(rating.supplier_id)}
                    disabled={recalculateScore.isPending}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${recalculateScore.isPending ? 'animate-spin' : ''}`} />
                    Recalculer
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Mis à jour: {new Date(rating.updated_at).toLocaleDateString('fr-FR')}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">Aucune notation disponible</h3>
          <p className="text-muted-foreground mb-6">
            Les scores des fournisseurs seront calculés automatiquement<br />
            basés sur leurs performances de livraison et qualité
          </p>
        </Card>
      )}
    </div>
  )
}
