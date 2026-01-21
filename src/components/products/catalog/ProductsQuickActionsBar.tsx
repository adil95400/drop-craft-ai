/**
 * Barre d'actions rapides pour la page Produits
 */
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Upload, Download, Wand2, RefreshCw, 
  Grid, Target, Filter 
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

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      {/* Actions principales (gauche) */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => navigate('/products/create')}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouveau produit
        </Button>
        <Button
          variant="outline"
          onClick={onEnrich}
          size="sm"
          className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
        >
          <Wand2 className="h-4 w-4" />
          Enrichir IA
        </Button>
      </div>
      
      {/* Actions secondaires (droite) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Toggles de vue */}
        <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
          <Button
            variant={viewMode === 'standard' ? 'default' : 'ghost'}
            onClick={() => onViewModeChange('standard')}
            size="sm"
            className="gap-1.5 h-7 px-2.5"
          >
            <Grid className="h-3.5 w-3.5" />
            Standard
          </Button>
          <Button
            variant={viewMode === 'audit' ? 'default' : 'ghost'}
            onClick={() => onViewModeChange('audit')}
            size="sm"
            className="gap-1.5 h-7 px-2.5"
          >
            <Target className="h-3.5 w-3.5" />
            Audit
          </Button>
        </div>
        
        {/* Séparateur */}
        <div className="hidden sm:block h-6 w-px bg-border" />
        
        {/* Actions données */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Actualiser</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8"
          onClick={() => navigate('/import/quick')}
        >
          <Upload className="h-4 w-4" />
          <span className="hidden md:inline">Importer</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          <span className="hidden md:inline">Exporter</span>
        </Button>
        
        {/* Séparateur */}
        <div className="hidden sm:block h-6 w-px bg-border" />
        
        {/* Filtres */}
        <Button 
          variant={hasActiveFilters ? 'secondary' : 'outline'}
          size="sm" 
          className="gap-1.5 h-8"
          onClick={onShowFilters}
        >
          <Filter className="h-4 w-4" />
          Filtres
          {hasActiveFilters && (
            <Badge variant="destructive" className="ml-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px]">
              !
            </Badge>
          )}
        </Button>
        
        {hasActiveFilters && onResetFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs text-muted-foreground hover:text-destructive"
            onClick={onResetFilters}
          >
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  )
}
