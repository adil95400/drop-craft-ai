/**
 * Barre d'actions rapides pour la page Produits
 * Phase 2: Intégration ViewModeSelector avec mode Business
 * Sprint 1 V3: Tri IA intégré comme décision par défaut
 */
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Upload, Download, Wand2, RefreshCw, 
  Filter, Brain, Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ViewModeSelector, ViewMode } from '@/components/products/command-center'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

interface ProductsQuickActionsBarProps {
  onRefresh: () => void
  onEnrich: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  expertMode: boolean
  onExpertModeChange: (enabled: boolean) => void
  hasActiveFilters: boolean
  onShowFilters: () => void
  onResetFilters?: () => void
  isLoading?: boolean
  isAISorted?: boolean
}

export function ProductsQuickActionsBar({
  onRefresh,
  onEnrich,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onShowFilters,
  onResetFilters,
  isLoading = false,
  isAISorted = true
}: ProductsQuickActionsBarProps) {
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) throw new Error('Non authentifié')
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', session.user.id)
      if (error) throw error
      // Generate CSV client-side
      if (data && data.length > 0) {
        const headers = Object.keys(data[0]).join(',')
        const rows = data.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        const csv = [headers, ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `produits-export-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        toast({ title: '✅ Export terminé', description: `${data.length} produits exportés` })
      } else {
        toast({ title: 'Info', description: 'Aucun produit à exporter' })
      }
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
        
        {/* Indicateur tri IA actif */}
        {isAISorted && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/5 border border-primary/20">
            <Brain className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-medium text-primary">Tri IA actif</span>
          </div>
        )}
      </div>
      
      {/* Actions secondaires (droite) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Phase 2: ViewModeSelector avec mode Business */}
        <ViewModeSelector
          value={viewMode}
          onChange={onViewModeChange}
          disabled={isLoading}
        />
        
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
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
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
