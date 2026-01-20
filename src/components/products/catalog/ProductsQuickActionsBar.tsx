/**
 * Barre d'actions rapides pour la page Produits
 */
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChannableQuickActions } from '@/components/channable'
import { ChannableQuickAction } from '@/components/channable/types'
import { 
  Plus, Upload, Download, Wand2, Image, RefreshCw, 
  Grid, Target, Sparkles, Filter 
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface ProductsQuickActionsBarProps {
  onRefresh: () => void
  onEnrich: () => void
  viewMode: 'standard' | 'audit'
  onViewModeChange: (mode: 'standard' | 'audit') => void
  expertMode: boolean
  onExpertModeChange: (enabled: boolean) => void
  hasActiveFilters: boolean
  onShowFilters: () => void
  onResetFilters?: () => void
  isLoading?: boolean
}

export function ProductsQuickActionsBar({
  onRefresh,
  onEnrich,
  viewMode,
  onViewModeChange,
  expertMode,
  onExpertModeChange,
  hasActiveFilters,
  onShowFilters,
  onResetFilters,
  isLoading = false
}: ProductsQuickActionsBarProps) {
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      const { importExportService } = await import('@/services/importExportService')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      await importExportService.exportAllProducts(user.id)
      toast({ title: '✅ Export réussi', description: 'Le fichier CSV a été téléchargé' })
    } catch (error) {
      toast({ title: 'Erreur', description: 'Échec de l\'export', variant: 'destructive' })
    }
  }

  const quickActions: ChannableQuickAction[] = [
    {
      id: 'add-product',
      label: 'Nouveau produit',
      icon: Plus,
      onClick: () => navigate('/products/create'),
      variant: 'primary'
    },
    {
      id: 'import',
      label: 'Importer',
      icon: Upload,
      onClick: () => navigate('/import/quick'),
      description: 'CSV/Excel'
    },
    {
      id: 'export',
      label: 'Exporter',
      icon: Download,
      onClick: handleExport,
      description: 'Télécharger CSV'
    },
    {
      id: 'enrich',
      label: 'Enrichir IA',
      icon: Wand2,
      onClick: onEnrich,
      description: 'Optimisation'
    },
    {
      id: 'image-audit',
      label: 'Audit Images',
      icon: Image,
      onClick: () => navigate('/products/image-audit'),
      description: 'Enrichir galeries'
    },
    {
      id: 'refresh',
      label: 'Actualiser',
      icon: RefreshCw,
      onClick: onRefresh,
      description: 'Recharger'
    }
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <ChannableQuickActions actions={quickActions} variant="compact" />
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant={viewMode === 'standard' ? 'default' : 'outline'}
          onClick={() => onViewModeChange('standard')}
          size="sm"
          className="gap-2"
        >
          <Grid className="h-4 w-4" />
          Standard
        </Button>
        <Button
          variant={viewMode === 'audit' ? 'default' : 'outline'}
          onClick={() => onViewModeChange('audit')}
          size="sm"
          className="gap-2"
        >
          <Target className="h-4 w-4" />
          Audit
        </Button>
        <Button
          variant={expertMode ? 'default' : 'outline'}
          onClick={() => onExpertModeChange(!expertMode)}
          size="sm"
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {expertMode ? 'Expert' : 'Simple'}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={onShowFilters}
        >
          <Filter className="h-4 w-4" />
          Filtres
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              !
            </Badge>
          )}
        </Button>
        
        {hasActiveFilters && onResetFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-destructive"
            onClick={onResetFilters}
          >
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  )
}
