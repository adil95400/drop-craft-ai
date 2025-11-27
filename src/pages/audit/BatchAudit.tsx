import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Package
} from 'lucide-react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export default function BatchAudit() {
  const navigate = useNavigate()
  const { user } = useUnifiedAuth()
  const [productSource, setProductSource] = useState<'products' | 'imported_products' | 'supplier_products'>('products')
  const [auditType, setAuditType] = useState<'full' | 'quick' | 'seo_only'>('quick')
  const [limit, setLimit] = useState(50)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  // Compter les produits disponibles
  const { data: productCount } = useQuery({
    queryKey: ['product-count', productSource, user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from(productSource)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      if (error) throw error
      return count || 0
    },
    enabled: !!user?.id,
  })

  const batchAudit = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('batch-audit-catalog', {
        body: { 
          productSource, 
          userId: user?.id, 
          auditType, 
          limit 
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      setIsRunning(false)
      setProgress(100)
      toast.success(`✅ Audit terminé: ${data.processed} produits analysés`)
    },
    onError: (error) => {
      setIsRunning(false)
      console.error('Batch audit error:', error)
      toast.error('Erreur lors de l\'audit en masse')
    }
  })

  const startBatchAudit = async () => {
    if (!user?.id || !productCount || productCount === 0) return

    setIsRunning(true)
    setProgress(0)

    // Simuler la progression (puisque l'edge function ne retourne pas de progression en temps réel)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return prev + 5
      })
    }, 1000)

    await batchAudit.mutateAsync()
    clearInterval(progressInterval)
  }

  const estimatedTime = () => {
    if (!productCount) return '0s'
    const seconds = Math.ceil(productCount * 0.5) // ~0.5s par produit
    if (seconds < 60) return `${seconds}s`
    return `${Math.ceil(seconds / 60)}min`
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
            <Zap className="h-8 w-8 text-primary" />
            Audit en Masse
          </h1>
          <p className="text-muted-foreground mt-1">
            Analysez l'ensemble de votre catalogue en quelques minutes
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Paramètres de l'audit en masse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Source */}
            <div className="space-y-2">
              <Label>Source des produits</Label>
              <RadioGroup value={productSource} onValueChange={(v) => setProductSource(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="products" id="src-products" />
                  <Label htmlFor="src-products">Mes Produits</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="imported_products" id="src-imported" />
                  <Label htmlFor="src-imported">Produits Importés</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="supplier_products" id="src-supplier" />
                  <Label htmlFor="src-supplier">Produits Fournisseurs</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Type d'audit */}
            <div className="space-y-2">
              <Label>Type d'audit</Label>
              <RadioGroup value={auditType} onValueChange={(v) => setAuditType(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quick" id="quick" />
                  <Label htmlFor="quick" className="flex flex-col">
                    <span className="font-medium">Rapide</span>
                    <span className="text-xs text-muted-foreground">Titre, description, images (~0.3s/produit)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="flex flex-col">
                    <span className="font-medium">Complet</span>
                    <span className="text-xs text-muted-foreground">Tout + suggestions IA (~0.8s/produit)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="seo_only" id="seo" />
                  <Label htmlFor="seo" className="flex flex-col">
                    <span className="font-medium">SEO uniquement</span>
                    <span className="text-xs text-muted-foreground">Optimisation référencement (~0.2s/produit)</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Limite */}
            <div className="space-y-2">
              <Label>Nombre de produits à auditer</Label>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={10}>10 produits</option>
                <option value={25}>25 produits</option>
                <option value={50}>50 produits</option>
                <option value={100}>100 produits</option>
                <option value={250}>250 produits</option>
                <option value={500}>500 produits</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {productCount ? `${productCount} produits disponibles` : 'Chargement...'}
              </p>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Temps estimé:</span>
                <span className="font-medium">{estimatedTime()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Crédits IA requis:</span>
                <span className="font-medium">~{Math.min(limit, productCount || 0)} crédits</span>
              </div>
            </div>

            <Button 
              onClick={startBatchAudit} 
              disabled={isRunning || !productCount || productCount === 0}
              className="w-full"
              size="lg"
            >
              <Zap className="mr-2 h-4 w-4" />
              {isRunning ? 'Audit en cours...' : 'Lancer l\'Audit en Masse'}
            </Button>
          </CardContent>
        </Card>

        {/* Progression */}
        <Card>
          <CardHeader>
            <CardTitle>Progression</CardTitle>
            <CardDescription>Suivi de l'audit en temps réel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isRunning && progress === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Configurez les paramètres et lancez l'audit
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">En cours d'analyse</div>
                      <div className="text-xs text-muted-foreground">
                        Audit des produits en cours...
                      </div>
                    </div>
                  </div>

                  {progress === 100 && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">Audit terminé</div>
                        <div className="text-xs text-muted-foreground">
                          Tous les produits ont été analysés
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {progress === 100 && (
                  <Button 
                    onClick={() => navigate('/audit')} 
                    className="w-full"
                    variant="outline"
                  >
                    Voir les Résultats
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}