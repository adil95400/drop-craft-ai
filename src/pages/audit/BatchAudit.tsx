import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { motion } from 'framer-motion'

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon 
}: { 
  title: string
  value: string | number
  subtitle: string
  icon: any
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  </motion.div>
)

export default function BatchAudit() {
  const navigate = useNavigate()
  const { user } = useUnifiedAuth()
  const [productSource, setProductSource] = useState<'products' | 'imported_products' | 'supplier_products'>('products')
  const [auditType, setAuditType] = useState<'full' | 'quick' | 'seo_only'>('quick')
  const [limit, setLimit] = useState(50)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

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
    const seconds = Math.ceil(productCount * 0.5)
    if (seconds < 60) return `${seconds}s`
    return `${Math.ceil(seconds / 60)}min`
  }

  return (
    <ChannablePageWrapper
      title="Audit en Masse"
      subtitle="Analysez l'ensemble de votre catalogue en quelques minutes"
      heroImage="automation"
      actions={
        <Button variant="outline" onClick={() => navigate('/audit')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour au Dashboard
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Produits Disponibles"
          value={productCount || 0}
          subtitle="Dans la source sélectionnée"
          icon={Package}
        />
        <StatCard
          title="Temps Estimé"
          value={estimatedTime()}
          subtitle="Pour l'audit complet"
          icon={Clock}
        />
        <StatCard
          title="Crédits Requis"
          value={`~${Math.min(limit, productCount || 0)}`}
          subtitle="Crédits IA"
          icon={Sparkles}
        />
        <StatCard
          title="Type d'Audit"
          value={auditType === 'full' ? 'Complet' : auditType === 'quick' ? 'Rapide' : 'SEO'}
          subtitle="Sélectionné"
          icon={Target}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                Configuration
              </CardTitle>
              <CardDescription>Paramètres de l'audit en masse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Source */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Source des produits</Label>
                <RadioGroup value={productSource} onValueChange={(v) => setProductSource(v as any)}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="products" id="src-products" />
                    <Label htmlFor="src-products" className="cursor-pointer flex-1">Mes Produits</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="imported_products" id="src-imported" />
                    <Label htmlFor="src-imported" className="cursor-pointer flex-1">Produits Importés</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="supplier_products" id="src-supplier" />
                    <Label htmlFor="src-supplier" className="cursor-pointer flex-1">Produits Fournisseurs</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Type d'audit */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Type d'audit</Label>
                <RadioGroup value={auditType} onValueChange={(v) => setAuditType(v as any)}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="quick" id="quick" />
                    <Label htmlFor="quick" className="cursor-pointer flex-1">
                      <span className="font-medium">Rapide</span>
                      <span className="text-xs text-muted-foreground block">Titre, description, images (~0.3s/produit)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full" className="cursor-pointer flex-1">
                      <span className="font-medium">Complet</span>
                      <span className="text-xs text-muted-foreground block">Tout + suggestions IA (~0.8s/produit)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="seo_only" id="seo" />
                    <Label htmlFor="seo" className="cursor-pointer flex-1">
                      <span className="font-medium">SEO uniquement</span>
                      <span className="text-xs text-muted-foreground block">Optimisation référencement (~0.2s/produit)</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Limite */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nombre de produits à auditer</Label>
                <select
                  className="w-full p-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 transition-all"
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

              <Button 
                onClick={startBatchAudit} 
                disabled={isRunning || !productCount || productCount === 0}
                className="w-full gap-2"
                size="lg"
              >
                <Zap className="h-4 w-4" />
                {isRunning ? 'Audit en cours...' : 'Lancer l\'Audit en Masse'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progression */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                Progression
              </CardTitle>
              <CardDescription>Suivi de l'audit en temps réel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isRunning && progress === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Configurez les paramètres et lancez l'audit
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>

                  <div className="space-y-3">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">En cours d'analyse</div>
                        <div className="text-xs text-muted-foreground">
                          Audit des produits en cours...
                        </div>
                      </div>
                    </motion.div>

                    {progress === 100 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">Audit terminé</div>
                          <div className="text-xs text-muted-foreground">
                            Tous les produits ont été analysés
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {progress === 100 && (
                    <Button 
                      onClick={() => navigate('/audit')} 
                      className="w-full gap-2"
                      variant="outline"
                    >
                      Voir les Résultats
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ChannablePageWrapper>
  )
}
