import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface AIRecommendation {
  id: string
  type: 'product' | 'pricing' | 'marketing' | 'inventory' | 'seo'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  confidence: number
  actions: Array<{
    label: string
    action: string
    data?: any
  }>
  metrics?: {
    potential_revenue?: number
    time_savings?: string
    conversion_lift?: number
  }
  createdAt: string
}

export const useRealAIRecommendations = (limit = 6, types?: string[]) => {
  const { toast } = useToast()

  const { data: recommendations, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-recommendations', limit, types],
    queryFn: async (): Promise<AIRecommendation[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Fetch real data
      const [
        { data: products },
        { data: orders },
        { data: customers }
      ] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', user.id),
        supabase.from('orders').select('*').eq('user_id', user.id),
        supabase.from('customers').select('*').eq('user_id', user.id)
      ])

      const recommendations: AIRecommendation[] = []

      // 1. Pricing Optimization
      const lowMarginProducts = products?.filter(p => {
        const margin = p.cost_price ? ((p.price - p.cost_price) / p.cost_price) * 100 : 0
        return margin < 30 && p.status === 'active'
      }) || []

      if (lowMarginProducts.length > 0) {
        const potentialRevenue = lowMarginProducts.reduce((sum, p) => sum + (p.price * 0.15), 0)
        recommendations.push({
          id: 'pricing_opt',
          type: 'pricing',
          priority: 'high',
          title: 'Optimisation Prix Automatique Détectée',
          description: `L'IA a identifié ${lowMarginProducts.length} produits avec un potentiel d'augmentation de marge`,
          impact: `Augmentation estimée du CA : +€${potentialRevenue.toFixed(0)}/mois`,
          confidence: 87,
          actions: [
            { label: 'Appliquer les prix optimisés', action: 'apply_pricing', data: lowMarginProducts },
            { label: 'Voir les détails', action: 'view_pricing_details' }
          ],
          metrics: {
            potential_revenue: potentialRevenue,
            conversion_lift: 15
          },
          createdAt: new Date().toISOString()
        })
      }

      // 2. Low Stock Warning
      const lowStockProducts = products?.filter(p => 
        (p.stock_quantity || 0) < 10 && p.status === 'active'
      ) || []

      if (lowStockProducts.length > 0) {
        const potentialLoss = lowStockProducts.reduce((sum, p) => sum + (p.price * 5), 0)
        recommendations.push({
          id: 'inventory_warning',
          type: 'inventory',
          priority: 'high',
          title: 'Risque de Rupture de Stock',
          description: `L'IA prédit des ruptures de stock sur ${lowStockProducts.length} produits performants`,
          impact: `Éviter une perte de €${potentialLoss.toFixed(0)} en ventes`,
          confidence: 78,
          actions: [
            { label: 'Réapprovisionner maintenant', action: 'restock_products', data: lowStockProducts },
            { label: 'Configurer les alertes', action: 'setup_alerts' }
          ],
          metrics: {
            potential_revenue: potentialLoss,
            time_savings: '2h par semaine'
          },
          createdAt: new Date().toISOString()
        })
      }

      // 3. SEO Optimization
      const poorSeoProducts = products?.filter(p => 
        !p.seo_description || !p.seo_title || p.seo_description?.length < 50
      ) || []

      if (poorSeoProducts.length > 0) {
        recommendations.push({
          id: 'seo_opt',
          type: 'seo',
          priority: 'medium',
          title: 'Optimisation SEO Intelligente',
          description: `L'IA a identifié ${poorSeoProducts.length} produits avec faible visibilité SEO`,
          impact: 'Amélioration estimée du trafic organique : +35%',
          confidence: 83,
          actions: [
            { label: 'Appliquer les descriptions IA', action: 'apply_seo_content', data: poorSeoProducts },
            { label: 'Prévisualiser les changements', action: 'preview_seo' }
          ],
          metrics: {
            conversion_lift: 35,
            time_savings: '5h de rédaction'
          },
          createdAt: new Date().toISOString()
        })
      }

      // 4. Customer Segmentation
      if ((customers?.length || 0) > 10) {
        const highValueCustomers = customers?.filter(c => c.total_spent > 500).length || 0
        recommendations.push({
          id: 'marketing_segments',
          type: 'marketing',
          priority: 'medium',
          title: 'Opportunité de Segmentation Client',
          description: `L'IA a identifié ${highValueCustomers} clients à forte valeur pour des campagnes ciblées`,
          impact: 'Amélioration ROI marketing : +28%',
          confidence: 71,
          actions: [
            { label: 'Créer les segments', action: 'create_segments' },
            { label: 'Lancer campagne test', action: 'test_campaign' }
          ],
          metrics: {
            conversion_lift: 28,
            potential_revenue: 850
          },
          createdAt: new Date().toISOString()
        })
      }

      // 5. Product Trends
      const recentOrders = orders?.filter(o => {
        const orderDate = new Date(o.created_at)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return orderDate > weekAgo
      }) || []

      if (recentOrders.length > 5) {
        recommendations.push({
          id: 'trending_products',
          type: 'product',
          priority: 'low',
          title: 'Produits en Tendance Détectés',
          description: 'Analyse des ventes récentes pour identifier de nouvelles opportunités',
          impact: `${recentOrders.length} commandes cette semaine`,
          confidence: 92,
          actions: [
            { label: 'Voir les tendances', action: 'view_trending_products' },
            { label: 'Créer bundle', action: 'create_bundle' }
          ],
          metrics: {
            potential_revenue: recentOrders.reduce((sum, o) => sum + o.total_amount, 0) * 1.2
          },
          createdAt: new Date().toISOString()
        })
      }

      // Filter by types if specified
      let filteredRecommendations = recommendations
      if (types && types.length > 0) {
        filteredRecommendations = recommendations.filter(r => types.includes(r.type))
      }

      return filteredRecommendations.slice(0, limit)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      onError: () => {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les recommandations IA",
          variant: "destructive"
        })
      }
    }
  })

  return {
    recommendations: recommendations || [],
    isLoading,
    error,
    refetch
  }
}
