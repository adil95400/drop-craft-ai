import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { 
  Zap,
  Bot,
  DollarSign,
  Edit,
  Tag,
  Package,
  Download,
  Trash2,
  Copy,
  RefreshCw,
  Upload,
  CheckCircle,
  XCircle,
  ChevronDown,
  Sparkles,
  TrendingUp
} from 'lucide-react'

interface BulkActionsToolbarProps {
  selectedCount: number
  onAction: (action: string) => void
  onClearSelection: () => void
}

interface ActionGroup {
  label: string
  actions: {
    id: string
    label: string
    icon: React.ElementType
    description: string
    variant?: 'default' | 'destructive'
  }[]
}

const ACTION_GROUPS: ActionGroup[] = [
  {
    label: 'Optimisation IA',
    actions: [
      {
        id: 'ai-optimize-all',
        label: 'Optimisation complète IA',
        icon: Bot,
        description: 'SEO, descriptions, prix, catégories'
      },
      {
        id: 'ai-descriptions',
        label: 'Générer descriptions',
        icon: Edit,
        description: 'Descriptions optimisées par IA'
      },
      {
        id: 'ai-seo',
        label: 'Optimisation SEO',
        icon: Sparkles,
        description: 'Titres, meta, mots-clés'
      },
      {
        id: 'ai-categorize',
        label: 'Catégorisation auto',
        icon: Tag,
        description: 'Classification intelligente'
      }
    ]
  },
  {
    label: 'Prix & Marges',
    actions: [
      {
        id: 'price-optimize',
        label: 'Prix intelligents',
        icon: DollarSign,
        description: 'Analyse concurrentielle'
      },
      {
        id: 'price-increase',
        label: 'Augmenter les prix',
        icon: TrendingUp,
        description: 'Ajustement en %'
      },
      {
        id: 'margin-optimize',
        label: 'Optimiser marges',
        icon: DollarSign,
        description: 'Maximiser la rentabilité'
      }
    ]
  },
  {
    label: 'Gestion du stock',
    actions: [
      {
        id: 'inventory-sync',
        label: 'Sync stock fournisseurs',
        icon: RefreshCw,
        description: 'Mise à jour automatique'
      },
      {
        id: 'stock-alert',
        label: 'Alertes stock',
        icon: Package,
        description: 'Configurer seuils'
      }
    ]
  },
  {
    label: 'Export & Publication',
    actions: [
      {
        id: 'export-store',
        label: 'Exporter vers une boutique',
        icon: Upload,
        description: 'Shopify, WooCommerce, PrestaShop...'
      },
      {
        id: 'export-csv',
        label: 'Exporter en CSV',
        icon: Download,
        description: 'Télécharger les données'
      }
    ]
  },
  {
    label: 'Actions rapides',
    actions: [
      {
        id: 'activate',
        label: 'Activer',
        icon: CheckCircle,
        description: 'Mettre en ligne'
      },
      {
        id: 'deactivate',
        label: 'Désactiver',
        icon: XCircle,
        description: 'Retirer de la vente'
      },
      {
        id: 'duplicate',
        label: 'Dupliquer',
        icon: Copy,
        description: 'Créer des copies'
      },
      {
        id: 'delete',
        label: 'Supprimer',
        icon: Trash2,
        description: 'Supprimer définitivement',
        variant: 'destructive'
      }
    ]
  }
]

export function BulkActionsToolbar({ 
  selectedCount, 
  onAction, 
  onClearSelection 
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="h-7 px-3 text-sm font-semibold">
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClearSelection}
                className="h-7"
              >
                Désélectionner
              </Button>
            </div>
            
            <div className="h-8 w-px bg-border" />
            
            <div className="flex items-center gap-2">
              {/* Quick actions */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAction('ai-optimize-all')}
                className="h-9"
              >
                <Bot className="h-4 w-4 mr-2" />
                Optimiser IA
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAction('price-optimize')}
                className="h-9"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Prix intelligents
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAction('export-store')}
                className="h-9"
              >
                <Upload className="h-4 w-4 mr-2" />
                Exporter vers boutique
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* All actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Zap className="h-4 w-4 mr-2" />
                  Toutes les actions
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                {ACTION_GROUPS.map((group, index) => (
                  <div key={group.label}>
                    {index > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                      {group.label}
                    </DropdownMenuLabel>
                    {group.actions.map((action) => {
                      const Icon = action.icon
                      return (
                        <DropdownMenuItem
                          key={action.id}
                          onClick={() => onAction(action.id)}
                          className={
                            action.variant === 'destructive'
                              ? 'text-destructive focus:text-destructive cursor-pointer'
                              : 'cursor-pointer'
                          }
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{action.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {action.description}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      )
                    })}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
