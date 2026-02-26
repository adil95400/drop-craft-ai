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
  AlertCircle,
  Target,
  TrendingUp,
  Brain
} from 'lucide-react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { AttributesAIPanel } from '@/components/attributes'
import { motion } from 'framer-motion'

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  color = 'primary'
}: { 
  title: string
  value: string | number
  subtitle: string
  icon: any
  color?: 'primary' | 'green' | 'blue' | 'yellow'
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-600',
    blue: 'bg-blue-500/10 text-blue-600',
    yellow: 'bg-yellow-500/10 text-yellow-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

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
  const avgConfidence = attributes && attributes.length > 0
    ? Math.round((attributes.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / attributes.length) * 100)
    : 0

  return (
    <ChannablePageWrapper
      title="Gestionnaire d'Attributs IA"
      subtitle="Catégorisation et optimisation pour Google AI / ChatGPT Shopping"
      heroImage="schema"
      actions={
        <Button variant="outline" onClick={() => navigate('/audit')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      }
    >
      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="h-4 w-4" />
            Intelligence IA
          </TabsTrigger>
          <TabsTrigger value="attributes" className="gap-2">
            <Tag className="h-4 w-4" />
            Attributs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
          <AttributesAIPanel />
        </TabsContent>

        <TabsContent value="attributes" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Attributs Générés"
              value={totalAttributes}
              subtitle="Produits avec attributs IA"
              icon={Tag}
            />
            <StatCard
              title="Approuvés"
              value={approvedCount}
              subtitle="Prêts pour indexation"
              icon={CheckCircle2}
              color="green"
            />
            <StatCard
              title="En Attente"
              value={totalAttributes - approvedCount}
              subtitle="À valider"
              icon={AlertCircle}
              color="yellow"
            />
            <StatCard
              title="Confiance Moy."
              value={`${avgConfidence}%`}
              subtitle="Catégorisation IA"
              icon={Target}
              color="blue"
            />
          </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  Attributs par Produit
                </CardTitle>
                <CardDescription>Catégories IA et statut d'indexation shopping</CardDescription>
              </div>
              <Button onClick={() => navigate('/audit/products')} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Générer des Attributs
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3 py-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : !attributes || attributes.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                  <Tag className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucun attribut généré</h3>
                <p className="text-muted-foreground mb-4">
                  Commencez par générer des attributs pour vos produits
                </p>
                <Button onClick={() => navigate('/audit/products')} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Générer des Attributs
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {attributes.map((attr, index) => (
                  <motion.div
                    key={attr.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">
                          Produit {attr.product_id?.slice(0, 8)}
                        </div>
                        {attr.confidence_score && (
                          <Badge variant="outline" className="text-xs">
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
                        className="gap-2"
                      >
                        <TrendingUp className="h-4 w-4" />
                        Analyser
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
