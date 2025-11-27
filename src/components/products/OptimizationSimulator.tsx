import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Play, TrendingUp, DollarSign, Target, Sparkles } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface OptimizationSimulatorProps {
  productIds: string[]
  onExecute?: () => void
}

export function OptimizationSimulator({ productIds, onExecute }: OptimizationSimulatorProps) {
  const { toast } = useToast()
  const [simulationName, setSimulationName] = useState('')
  const [selectedOptimizations, setSelectedOptimizations] = useState<string[]>([])
  const [simulationResult, setSimulationResult] = useState<any>(null)

  const optimizationTypes = [
    { id: 'title', label: 'Optimiser les titres', impact: 'SEO +20%' },
    { id: 'description', label: 'Optimiser les descriptions', impact: 'Conversions +15%' },
    { id: 'seo', label: 'Générer metas SEO', impact: 'Visibilité +25%' },
    { id: 'pricing', label: 'Optimiser les prix', impact: 'Marges +10%' },
    { id: 'images', label: 'Optimiser les images', impact: 'Engagement +18%' },
    { id: 'attributes', label: 'Compléter attributs', impact: 'Multi-canal +30%' }
  ]

  const simulateOptimization = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase.functions.invoke('simulate-optimization', {
        body: {
          userId: user.id,
          productIds,
          optimizationTypes: selectedOptimizations,
          simulationName: simulationName || `Simulation ${new Date().toLocaleDateString()}`
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      setSimulationResult(data)
      toast({
        title: "Simulation terminée",
        description: "Les impacts potentiels ont été calculés"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de simuler l'optimisation",
        variant: "destructive"
      })
    }
  })

  const executeOptimization = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Marquer la simulation comme exécutée
      if (simulationResult?.simulationId) {
        await supabase
          .from('optimization_simulations')
          .update({ 
            executed: true, 
            executed_at: new Date().toISOString() 
          })
          .eq('id', simulationResult.simulationId)
      }

      // Exécuter les optimisations via bulk-ai-optimizer
      const { error } = await supabase.functions.invoke('bulk-ai-optimizer', {
        body: {
          userId: user.id,
          productIds,
          action: 'full_optimization'
        }
      })

      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Optimisations appliquées !",
        description: `${productIds.length} produit(s) ont été optimisés`
      })
      setSimulationResult(null)
      onExecute?.()
    }
  })

  const toggleOptimization = (id: string) => {
    setSelectedOptimizations(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Simulateur d'Optimisation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="simulation-name">Nom de la simulation</Label>
          <Input
            id="simulation-name"
            placeholder="Ex: Optimisation SEO Automne 2024"
            value={simulationName}
            onChange={(e) => setSimulationName(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label>Optimisations à simuler</Label>
          {optimizationTypes.map((opt) => (
            <div key={opt.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Checkbox
                  id={opt.id}
                  checked={selectedOptimizations.includes(opt.id)}
                  onCheckedChange={() => toggleOptimization(opt.id)}
                />
                <label htmlFor={opt.id} className="cursor-pointer">
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">Impact estimé: {opt.impact}</div>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => simulateOptimization.mutate()}
            disabled={selectedOptimizations.length === 0 || simulateOptimization.isPending}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            Lancer la simulation
          </Button>
        </div>

        {simulationResult && (
          <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="font-semibold text-lg">Résultats de la Simulation</div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium">Amélioration SEO</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  +{simulationResult.predicted_impact?.seo_improvement || 0}%
                </div>
              </div>

              <div className="p-3 rounded-lg bg-green-50">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium">Conversions</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  +{simulationResult.predicted_impact?.conversion_increase || 0}%
                </div>
              </div>

              <div className="p-3 rounded-lg bg-purple-50">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-medium">Revenu estimé</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  +{simulationResult.predicted_impact?.revenue_increase || 0}€
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Confiance: {((simulationResult.confidence_level || 0) * 100).toFixed(0)}%
              </Badge>
              <span className="text-xs text-muted-foreground">
                Basé sur {productIds.length} produit(s)
              </span>
            </div>

            <Button
              onClick={() => executeOptimization.mutate()}
              disabled={executeOptimization.isPending}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Appliquer les optimisations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
