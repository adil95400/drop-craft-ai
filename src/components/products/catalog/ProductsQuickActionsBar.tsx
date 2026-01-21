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

  // Actions principales à gauche (sans Nouveau produit ni Audit Images)
  const leftActions: ChannableQuickAction[] = [
    {
      id: 'enrich',
      label: 'Enrichir IA',
      icon: Wand2,
      onClick: onEnrich,
      variant: 'primary',
      description: 'Optimisation'
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
      {/* Actions gauche */}
      <ChannableQuickActions actions={leftActions} variant="compact" />
      
      {/* Actions droite */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Boutons Standard / Audit */}
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
        
        {/* Séparateur visuel */}
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* Toggle Expert (sans Simple) */}
        <Button
          variant={expertMode ? 'default' : 'outline'}
          onClick={() => onExpertModeChange(!expertMode)}
          size="sm"
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Audit expert
        </Button>
        
        {/* Séparateur visuel */}
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* Importer / Exporter / Filtres ensemble */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => navigate('/import/quick')}
        >
          <Upload className="h-4 w-4" />
          Importer
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          Exporter
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
