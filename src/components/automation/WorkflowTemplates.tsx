/**
 * Templates de workflows prédéfinis
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ShoppingCart, Package, DollarSign, AlertTriangle, Users, Mail,
  Sparkles, TrendingUp, Clock, Bell, RefreshCw, Zap, Globe
} from 'lucide-react'
import { toast } from 'sonner'

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
    tags: ['email', 'marketing', 'conversion']
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
    tags: ['stock', 'alerte', 'notification']
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
    tags: ['prix', 'concurrence', 'automatisation']
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
    tags: ['import', 'IA', 'publication']
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
    tags: ['client', 'onboarding', 'CRM']
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
    tags: ['commande', 'fulfillment', 'automatisation']
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
    tags: ['rapport', 'analytics', 'planification']
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
    tags: ['sync', 'marketplace', 'multi-canal']
  },
  {
    id: 'zapier_integration',
    name: 'Intégration Zapier avancée',
    description: 'Déclenchement Zaps selon événements produits avec données enrichies',
    category: 'Intégrations',
    icon: Zap,
    color: 'orange',
    steps: 3,
    popularity: 65,
    tags: ['zapier', 'intégration', 'webhook']
  },
  {
    id: 'competitor_monitoring',
    name: 'Veille concurrentielle',
    description: 'Surveillance prix concurrents + alertes + ajustement automatique optionnel',
    category: 'Veille',
    icon: Globe,
    color: 'slate',
    steps: 5,
    popularity: 75,
    tags: ['concurrence', 'veille', 'prix']
  }
]

interface WorkflowTemplatesProps {
  onSelectTemplate: (templateId: string) => void
}

export function WorkflowTemplates({ onSelectTemplate }: WorkflowTemplatesProps) {
  const categories = [...new Set(WORKFLOW_TEMPLATES.map(t => t.category))]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Templates prêts à l'emploi</h3>
        <p className="text-muted-foreground text-sm">
          Démarrez rapidement avec nos workflows optimisés et personnalisables
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
                  
                  return (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:border-primary/50 transition-all group"
                      onClick={() => {
                        onSelectTemplate(template.id)
                        toast.success(`Template "${template.name}" sélectionné`)
                      }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className={`p-2 rounded-lg bg-${template.color}-500/10 mb-2`}>
                            <Icon className={`h-5 w-5 text-${template.color}-500`} />
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
