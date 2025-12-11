import { useState } from 'react'
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
  TrendingUp,
  Loader2,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface BulkActionsToolbarProps {
  selectedCount: number
  onAction: (action: string) => void | Promise<void>
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
        id: 'export-shopify',
        label: 'Exporter vers Shopify',
        icon: Upload,
        description: 'Publication en masse'
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
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  if (selectedCount === 0) return null

  const handleAction = async (actionId: string) => {
    setLoadingAction(actionId)
    const toastId = toast.loading(`Exécution de l'action...`)
    
    try {
      await onAction(actionId)
      toast.success('Action terminée avec succès', { id: toastId })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue",
        { id: toastId }
      )
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-lg sticky top-0 z-20">
      <CardContent className="p-2 sm:p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Selection info */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <Badge variant="default" className="h-6 sm:h-7 px-2 sm:px-3 text-xs sm:text-sm font-semibold">
                {selectedCount}
              </Badge>
              <span className="text-xs sm:text-sm text-muted-foreground hidden xs:inline">
                sélectionné{selectedCount > 1 ? 's' : ''}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClearSelection}
                className="h-6 w-6 sm:h-7 sm:w-7"
                aria-label="Désélectionner"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
          
          {/* Quick actions - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAction('ai-optimize-all')}
              disabled={loadingAction !== null}
              className="h-8 sm:h-9"
            >
              {loadingAction === 'ai-optimize-all' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bot className="h-4 w-4 mr-2" />
              )}
              <span className="hidden lg:inline">Optimiser IA</span>
              <span className="lg:hidden">IA</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAction('price-optimize')}
              disabled={loadingAction !== null}
              className="h-8 sm:h-9"
            >
              {loadingAction === 'price-optimize' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" />
              )}
              <span className="hidden lg:inline">Prix intelligents</span>
              <span className="lg:hidden">Prix</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAction('export-shopify')}
              disabled={loadingAction !== null}
              className="h-8 sm:h-9"
            >
              {loadingAction === 'export-shopify' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              <span className="hidden lg:inline">Exporter</span>
            </Button>
          </div>
          
          {/* All actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="default" 
                size="sm" 
                className="h-8 sm:h-9"
                disabled={loadingAction !== null}
              >
                {loadingAction ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">Actions</span>
                <ChevronDown className="h-4 w-4 ml-1 sm:ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 sm:w-80 max-h-[70vh] overflow-y-auto">
              {ACTION_GROUPS.map((group, index) => (
                <div key={group.label}>
                  {index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                    {group.label}
                  </DropdownMenuLabel>
                  {group.actions.map((action) => {
                    const Icon = action.icon
                    const isLoading = loadingAction === action.id
                    return (
                      <DropdownMenuItem
                        key={action.id}
                        onClick={() => handleAction(action.id)}
                        disabled={loadingAction !== null}
                        className={
                          action.variant === 'destructive'
                            ? 'text-destructive focus:text-destructive cursor-pointer'
                            : 'cursor-pointer'
                        }
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{action.label}</span>
                          <span className="text-xs text-muted-foreground truncate">
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
      </CardContent>
    </Card>
  )
}
