import { useState } from 'react'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannablePageHero } from '@/components/channable/ChannablePageHero'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useSavedViews, useCreateSavedView, useDeleteSavedView, PRESET_VIEWS, SavedProductView } from '@/hooks/useSavedProductViews'
import { Eye, Plus, Trash2, TrendingDown, AlertTriangle, PackageX, ImageOff, FileEdit, Trophy, Clock, Search, Bookmark, Star, Filter } from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  TrendingDown, AlertTriangle, PackageX, ImageOff, FileEdit, Trophy, Clock, Search,
}

const COLOR_MAP: Record<string, string> = {
  red: 'border-red-200 bg-red-50 dark:bg-red-950/20',
  orange: 'border-orange-200 bg-orange-50 dark:bg-orange-950/20',
  gray: 'border-gray-200 bg-gray-50 dark:bg-gray-950/20',
  blue: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20',
  yellow: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20',
  green: 'border-green-200 bg-green-50 dark:bg-green-950/20',
  purple: 'border-purple-200 bg-purple-50 dark:bg-purple-950/20',
}

export default function SavedViews() {
  const { data: savedViews } = useSavedViews()
  const createView = useCreateSavedView()
  const deleteView = useDeleteSavedView()
  const [newViewName, setNewViewName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleCreateView = () => {
    if (!newViewName.trim()) return
    createView.mutate({ name: newViewName, filters: {}, icon: 'Bookmark', color: 'blue' })
    setNewViewName('')
    setDialogOpen(false)
  }

  return (
    <ChannablePageLayout>
      <ChannablePageHero
        title="Vues Produits"
        description="Filtres prédéfinis métier et vues personnalisées pour votre catalogue"
        category="products"
      />

      <div className="px-6 py-6 space-y-6">
        {/* Preset Views */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Filtres rapides
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESET_VIEWS.map((view, idx) => {
              const Icon = ICON_MAP[view.icon || ''] || Filter
              return (
                <Card key={idx} className={`cursor-pointer transition-all hover:shadow-md border ${COLOR_MAP[view.color || ''] || ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background/80">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{view.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{view.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Custom Saved Views */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-primary" />
              Vues personnalisées
            </h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nouvelle vue</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Créer une vue</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nom de la vue..."
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateView()}
                  />
                  <Button onClick={handleCreateView} disabled={!newViewName.trim() || createView.isPending} className="w-full">
                    Créer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {(!savedViews || savedViews.length === 0) ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Eye className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Aucune vue personnalisée</p>
                <p className="text-xs text-muted-foreground mt-1">Créez des vues pour retrouver rapidement vos produits filtrés</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedViews.map(view => (
                <Card key={view.id} className="group cursor-pointer hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{view.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); deleteView.mutate(view.id) }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    {view.description && <p className="text-xs text-muted-foreground mt-1">{view.description}</p>}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {Object.entries(view.filters || {}).map(([k, v]) => (
                        <Badge key={k} variant="secondary" className="text-xs">{k}: {String(v)}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ChannablePageLayout>
  )
}
