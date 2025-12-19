/**
 * Templates de workflows prédéfinis avec création réelle
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ShoppingCart, Package, DollarSign, AlertTriangle, Users, Mail,
  Sparkles, TrendingUp, Clock, Bell, RefreshCw, Zap, Globe, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: any
  color: string
  steps: number
  popularity: number
  tags: string[]
  triggerType: string
  triggerConditions: Record<string, any>
  actions: Array<{ type: string; config: Record<string, any> }>
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'abandoned_cart',
    name: 'Récupération panier abandonné',
    description: 'Email de relance automatique 1h après abandon avec code promo 10%',
    category: 'Marketing',
    icon: ShoppingCart,
    color: 'emerald',
    steps: 4,
    popularity: 95,
    tags: ['email', 'marketing', 'conversion'],
    triggerType: 'customer_behavior',
    triggerConditions: { event: 'cart_abandoned', delay_hours: 1 },
    actions: [{ type: 'send_email', config: { template: 'cart_recovery', discount: '10%' } }]
  },
  {
    id: 'low_stock_alert',
    name: 'Alerte stock critique',
    description: 'Notification Slack et email quand le stock passe sous le seuil',
    category: 'Inventaire',
    icon: AlertTriangle,
    color: 'red',
    steps: 3,
    popularity: 88,
    tags: ['stock', 'alerte', 'notification'],
    triggerType: 'inventory_level',
    triggerConditions: { threshold: 10, comparison: 'below' },
    actions: [{ type: 'notification', config: { urgency: 'high', channels: ['email', 'slack'] } }]
  },
  {
    id: 'auto_repricing',
    name: 'Auto-repricing concurrentiel',
    description: 'Ajustement automatique des prix selon la concurrence avec marge minimum',
    category: 'Prix',
    icon: DollarSign,
    color: 'orange',
    steps: 5,
    popularity: 82,
    tags: ['prix', 'concurrence', 'automatisation'],
    triggerType: 'price_change',
    triggerConditions: { margin_min: 15, competitor_check: true },
    actions: [{ type: 'price_adjustment', config: { strategy: 'competitive', min_margin: 15 } }]
  },
  {
    id: 'product_import_enrichment',
    name: 'Import + Enrichissement IA',
    description: 'Workflow complet: import produit → enrichissement IA → publication multi-canal',
    category: 'Produits',
    icon: Sparkles,
    color: 'violet',
    steps: 6,
    popularity: 90,
    tags: ['import', 'IA', 'publication'],
    triggerType: 'scheduled',
    triggerConditions: { schedule: 'daily', time: '09:00' },
    actions: [
      { type: 'update_inventory', config: { action: 'import_new' } },
      { type: 'notification', config: { type: 'import_complete' } }
    ]
  },
  {
    id: 'new_customer_welcome',
    name: 'Bienvenue nouveau client',
    description: 'Séquence d\'onboarding: email bienvenue + notification équipe + tag CRM',
    category: 'CRM',
    icon: Users,
    color: 'purple',
    steps: 4,
    popularity: 78,
    tags: ['client', 'onboarding', 'CRM'],
    triggerType: 'customer_behavior',
    triggerConditions: { event: 'new_customer' },
    actions: [
      { type: 'send_email', config: { template: 'welcome' } },
      { type: 'notification', config: { type: 'new_customer_alert' } }
    ]
  },
  {
    id: 'order_fulfillment',
    name: 'Traitement commande automatique',
    description: 'Validation → commande fournisseur → notification client → tracking',
    category: 'Commandes',
    icon: Package,
    color: 'blue',
    steps: 5,
    popularity: 85,
    tags: ['commande', 'fulfillment', 'automatisation'],
    triggerType: 'order_status',
    triggerConditions: { status: 'paid' },
    actions: [
      { type: 'create_order', config: { auto_fulfill: true } },
      { type: 'send_email', config: { template: 'order_confirmation' } }
    ]
  },
  {
    id: 'daily_report',
    name: 'Rapport quotidien',
    description: 'Génération et envoi automatique du rapport de performance chaque jour à 9h',
    category: 'Rapports',
    icon: TrendingUp,
    color: 'cyan',
    steps: 3,
    popularity: 72,
    tags: ['rapport', 'analytics', 'planification'],
    triggerType: 'scheduled',
    triggerConditions: { schedule: 'daily', time: '09:00' },
    actions: [{ type: 'send_email', config: { template: 'daily_report' } }]
  },
  {
    id: 'sync_marketplace',
    name: 'Synchronisation marketplaces',
    description: 'Sync bidirectionnel stock/prix avec Amazon, eBay et tous canaux',
    category: 'Multi-canal',
    icon: RefreshCw,
    color: 'indigo',
    steps: 4,
    popularity: 88,
    tags: ['sync', 'marketplace', 'multi-canal'],
    triggerType: 'scheduled',
    triggerConditions: { schedule: 'hourly' },
    actions: [{ type: 'update_inventory', config: { sync_all_channels: true } }]
  }
]

interface WorkflowTemplatesProps {
  onSelectTemplate: (templateId: string) => void
}

export function WorkflowTemplates({ onSelectTemplate }: WorkflowTemplatesProps) {
  const categories = [...new Set(WORKFLOW_TEMPLATES.map(t => t.category))]
  const [creatingId, setCreatingId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const applyTemplate = async (template: WorkflowTemplate) => {
    setCreatingId(template.id)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        toast.error('Veuillez vous connecter')
        return
      }

      // Create trigger
      const { data: triggerData, error: triggerError } = await supabase
        .from('automation_triggers')
        .insert({
          user_id: userData.user.id,
          name: template.name,
          description: template.description,
          trigger_type: template.triggerType,
          conditions: template.triggerConditions,
          is_active: true
        })
        .select()
        .single()

      if (triggerError) throw triggerError

      // Create actions
      const actionsToInsert = template.actions.map((action, index) => ({
        user_id: userData.user.id,
        trigger_id: triggerData.id,
        action_type: action.type,
        action_config: action.config,
        execution_order: index + 1,
        is_active: true
      }))

      const { error: actionsError } = await supabase
        .from('automation_actions')
        .insert(actionsToInsert)

      if (actionsError) throw actionsError

      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] })
      queryClient.invalidateQueries({ queryKey: ['automation-actions'] })

      toast.success(`Workflow "${template.name}" créé avec succès!`)
      onSelectTemplate(template.id)
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`)
    } finally {
      setCreatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Templates prêts à l'emploi</h3>
        <p className="text-muted-foreground text-sm">
          Créez instantanément des workflows optimisés - cliquez pour les ajouter
        </p>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">{category}</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {WORKFLOW_TEMPLATES.filter(t => t.category === category).map(template => {
                  const Icon = template.icon
                  const isCreating = creatingId === template.id
                  
                  return (
                    <Card
                      key={template.id}
                      className={`cursor-pointer hover:border-primary/50 transition-all group ${isCreating ? 'opacity-70' : ''}`}
                      onClick={() => !isCreating && applyTemplate(template)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className={`p-2 rounded-lg bg-${template.color}-500/10 mb-2`}>
                            {isCreating ? (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                              <Icon className={`h-5 w-5 text-${template.color}-500`} />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {template.steps} étapes
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.popularity}% utilisé
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
