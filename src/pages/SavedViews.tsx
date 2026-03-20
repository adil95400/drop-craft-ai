import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSavedViews, useCreateSavedView, useDeleteSavedView, PRESET_VIEWS } from '@/hooks/useSavedProductViews'
import { Eye, Plus, Trash2, TrendingDown, AlertTriangle, PackageX, ImageOff, FileEdit, Trophy, Clock, Search, Bookmark, Star, Filter, ArrowRight, ExternalLink, Pencil, Copy, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'

const ICON_MAP: Record<string, any> = {
  TrendingDown, AlertTriangle, PackageX, ImageOff, FileEdit, Trophy, Clock, Search, Bookmark, Filter, LayoutGrid,
}

const ICON_OPTIONS = [
  { value: 'Bookmark', label: 'Signet' },
  { value: 'Filter', label: 'Filtre' },
  { value: 'Star', label: 'Étoile' },
  { value: 'Search', label: 'Recherche' },
  { value: 'LayoutGrid', label: 'Grille' },
  { value: 'TrendingDown', label: 'Tendance' },
  { value: 'AlertTriangle', label: 'Alerte' },
  { value: 'Trophy', label: 'Trophée' },
]

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Bleu', dot: 'bg-info' },
  { value: 'green', label: 'Vert', dot: 'bg-success' },
  { value: 'red', label: 'Rouge', dot: 'bg-destructive' },
  { value: 'orange', label: 'Orange', dot: 'bg-warning' },
  { value: 'purple', label: 'Violet', dot: 'bg-purple-500' },
  { value: 'yellow', label: 'Jaune', dot: 'bg-warning' },
  { value: 'gray', label: 'Gris', dot: 'bg-gray-500' },
]

const COLOR_MAP: Record<string, string> = {
  red: 'border-destructive/20 bg-destructive/5 dark:border-red-800 dark:bg-red-950/20',
  orange: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20',
  gray: 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20',
  blue: 'border-info/20 bg-info/5 dark:border-blue-800 dark:bg-blue-950/20',
  yellow: 'border-warning/20 bg-warning/5 dark:border-yellow-800 dark:bg-yellow-950/20',
  green: 'border-success/20 bg-success/5 dark:border-green-800 dark:bg-green-950/20',
  purple: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20',
}

const BADGE_COLOR_MAP: Record<string, string> = {
  red: 'bg-destructive/10 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
  blue: 'bg-info/10 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  yellow: 'bg-warning/10 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  green: 'bg-success/10 text-success dark:bg-green-900/40 dark:text-green-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

function filtersToQueryString(filters: Record<string, any>, sortConfig?: Record<string, any>): string {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      params.set(k, String(v))
    }
  })
  if (sortConfig?.field) {
    params.set('sort', sortConfig.field)
    params.set('direction', sortConfig.direction || 'asc')
  }
  return params.toString()
}

function formatFilterLabel(key: string): string {
  const labels: Record<string, string> = {
    status: 'Statut',
    profit_margin_lt: 'Marge <',
    stock_quantity_lte: 'Stock ≤',
    stock_quantity_gt: 'Stock >',
    stock_quantity: 'Stock',
    main_image_url_is_null: 'Sans image',
    seo_incomplete: 'SEO incomplet',
  }
  return labels[key] || key
}

export default function SavedViews() {
  const navigate = useNavigate()
  const { data: savedViews, isLoading } = useSavedViews()
  const createView = useCreateSavedView()
  const deleteView = useDeleteSavedView()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [newViewDescription, setNewViewDescription] = useState('')
  const [newViewIcon, setNewViewIcon] = useState('Bookmark')
  const [newViewColor, setNewViewColor] = useState('blue')

  const handleCreateView = () => {
    if (!newViewName.trim()) return
    createView.mutate({
      name: newViewName.trim(),
      description: newViewDescription.trim() || undefined,
      filters: {},
      icon: newViewIcon,
      color: newViewColor,
    })
    setNewViewName('')
    setNewViewDescription('')
    setNewViewIcon('Bookmark')
    setNewViewColor('blue')
    setDialogOpen(false)
  }

  const handleApplyPresetView = (view: typeof PRESET_VIEWS[0]) => {
    const qs = filtersToQueryString(view.filters, view.sort_config)
    navigate(`/products${qs ? `?${qs}` : ''}`)
    toast.success(`Vue "${view.name}" appliquée`)
  }

  const handleApplyCustomView = (view: { name: string; filters: Record<string, any>; sort_config?: Record<string, any> }) => {
    const qs = filtersToQueryString(view.filters, view.sort_config)
    navigate(`/products${qs ? `?${qs}` : ''}`)
    toast.success(`Vue "${view.name}" appliquée`)
  }

  const handleDuplicateView = (view: { name: string; description?: string; filters: Record<string, any>; icon?: string; color?: string }) => {
    createView.mutate({
      name: `${view.name} (copie)`,
      description: view.description,
      filters: view.filters,
      icon: view.icon,
      color: view.color,
    })
  }

  const presetCount = PRESET_VIEWS.length
  const customCount = savedViews?.length || 0

  return (
    <ChannablePageWrapper
      title="Vues Produits"
      description={`${presetCount} filtres rapides · ${customCount} vue${customCount > 1 ? 's' : ''} personnalisée${customCount > 1 ? 's' : ''}`}
      heroImage="products"
      badge={{ label: 'Vues', icon: Eye }}
    >
      <TooltipProvider>
        <div className="px-4 sm:px-6 py-6 space-y-8">
          {/* ── Preset Views ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                Filtres rapides métier
              </h2>
              <Badge variant="secondary">{presetCount} filtres</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESET_VIEWS.map((view, idx) => {
                const Icon = ICON_MAP[view.icon || ''] || Filter
                const filterCount = Object.keys(view.filters).length
                return (
                  <Card
                    key={idx}
                    className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border ${COLOR_MAP[view.color || ''] || ''}`}
                    onClick={() => handleApplyPresetView(view)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-background/80 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{view.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{view.description}</p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {filterCount > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {filterCount} filtre{filterCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {view.sort_config && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Tri: {view.sort_config.field}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* ── Custom Views ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                Vues personnalisées
              </h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Nouvelle vue
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Créer une vue personnalisée</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="view-name">Nom *</Label>
                      <Input
                        id="view-name"
                        placeholder="Ex: Produits premium actifs"
                        value={newViewName}
                        onChange={(e) => setNewViewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateView()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="view-desc">Description</Label>
                      <Textarea
                        id="view-desc"
                        placeholder="Décrivez cette vue..."
                        value={newViewDescription}
                        onChange={(e) => setNewViewDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Icône</Label>
                        <Select value={newViewIcon} onValueChange={setNewViewIcon}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map(opt => {
                              const I = ICON_MAP[opt.value] || Filter
                              return (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div className="flex items-center gap-2">
                                    <I className="h-3.5 w-3.5" />
                                    {opt.label}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Couleur</Label>
                        <Select value={newViewColor} onValueChange={setNewViewColor}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLOR_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-2">
                                  <span className={`h-3 w-3 rounded-full ${opt.dot}`} />
                                  {opt.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleCreateView} disabled={!newViewName.trim() || createView.isPending}>
                      Créer la vue
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 h-24" />
                  </Card>
                ))}
              </div>
            ) : (!savedViews || savedViews.length === 0) ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Eye className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">Aucune vue personnalisée</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Créez des vues pour retrouver rapidement vos produits filtrés. Vous pouvez aussi appliquer un filtre rapide ci-dessus.
                  </p>
                  <Button size="sm" className="mt-4 gap-1.5" onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Créer ma première vue
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedViews.map(view => {
                  const Icon = ICON_MAP[view.icon || ''] || Bookmark
                  const filterEntries = Object.entries(view.filters || {})
                  const colorClass = COLOR_MAP[view.color || ''] || ''
                  const badgeColorClass = BADGE_COLOR_MAP[view.color || ''] || ''

                  return (
                    <Card
                      key={view.id}
                      className={`group cursor-pointer hover:shadow-md transition-all border ${colorClass}`}
                      onClick={() => handleApplyCustomView(view)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 rounded-md bg-background/80 shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{view.name}</p>
                              {view.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{view.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={(e) => { e.stopPropagation(); handleDuplicateView(view) }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Dupliquer</TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer la vue ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    La vue « {view.name} » sera supprimée définitivement.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteView.mutate(view.id)}>
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {filterEntries.length > 0 && (
                          <div className="flex gap-1 mt-3 flex-wrap">
                            {filterEntries.slice(0, 3).map(([k, v]) => (
                              <Badge key={k} variant="secondary" className={`text-[10px] px-1.5 py-0 ${badgeColorClass}`}>
                                {formatFilterLabel(k)}: {String(v)}
                              </Badge>
                            ))}
                            {filterEntries.length > 3 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                +{filterEntries.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(view.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-[10px] text-primary flex items-center gap-1">
                            Appliquer <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </TooltipProvider>
    </ChannablePageWrapper>
  )
}
