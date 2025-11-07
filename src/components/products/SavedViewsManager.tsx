import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BookmarkPlus, ChevronDown, Edit2, Trash2, Check } from 'lucide-react'
import { useProductViewsStore } from '@/stores/productViewsStore'
import { ProductFiltersState } from './ProductFilters'
import { toast } from 'sonner'

interface SavedViewsManagerProps {
  currentFilters: ProductFiltersState
  onLoadView: (filters: ProductFiltersState) => void
}

export function SavedViewsManager({ currentFilters, onLoadView }: SavedViewsManagerProps) {
  const { savedViews, activeViewId, saveView, updateView, renameView, deleteView, loadView, clearActiveView } = useProductViewsStore()
  
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewName, setViewName] = useState('')
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null)

  const handleSaveNewView = () => {
    if (!viewName.trim()) {
      toast.error('Veuillez entrer un nom pour la vue')
      return
    }

    if (savedViews.some(v => v.name === viewName.trim())) {
      toast.error('Une vue avec ce nom existe déjà')
      return
    }

    saveView(viewName.trim(), currentFilters)
    toast.success(`Vue "${viewName}" sauvegardée`)
    setViewName('')
    setSaveDialogOpen(false)
  }

  const handleUpdateCurrentView = () => {
    if (activeViewId) {
      updateView(activeViewId, currentFilters)
      toast.success('Vue mise à jour')
    }
  }

  const handleLoadView = (id: string) => {
    const view = loadView(id)
    if (view) {
      onLoadView(view.filters)
      toast.success(`Vue "${view.name}" chargée`)
    }
  }

  const handleRenameView = () => {
    if (!viewName.trim() || !selectedViewId) return

    if (savedViews.some(v => v.name === viewName.trim() && v.id !== selectedViewId)) {
      toast.error('Une vue avec ce nom existe déjà')
      return
    }

    renameView(selectedViewId, viewName.trim())
    toast.success('Vue renommée')
    setViewName('')
    setSelectedViewId(null)
    setRenameDialogOpen(false)
  }

  const handleDeleteView = () => {
    if (!selectedViewId) return
    
    const viewToDelete = savedViews.find(v => v.id === selectedViewId)
    deleteView(selectedViewId)
    toast.success(`Vue "${viewToDelete?.name}" supprimée`)
    setSelectedViewId(null)
    setDeleteDialogOpen(false)
  }

  const openRenameDialog = (id: string) => {
    const view = savedViews.find(v => v.id === id)
    if (view) {
      setSelectedViewId(id)
      setViewName(view.name)
      setRenameDialogOpen(true)
    }
  }

  const openDeleteDialog = (id: string) => {
    setSelectedViewId(id)
    setDeleteDialogOpen(true)
  }

  const activeView = savedViews.find(v => v.id === activeViewId)

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Bouton sauvegarder */}
        <Button
          variant="outline"
          size="default"
          onClick={() => setSaveDialogOpen(true)}
        >
          <BookmarkPlus className="h-4 w-4 mr-2" />
          Sauvegarder la vue
        </Button>

        {/* Menu déroulant des vues */}
        {savedViews.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default">
                {activeView ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {activeView.name}
                  </>
                ) : (
                  'Vues sauvegardées'
                )}
                <ChevronDown className="h-4 w-4 ml-2" />
                {savedViews.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {savedViews.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
              {savedViews.map((view) => (
                <div key={view.id} className="relative group">
                  <DropdownMenuItem
                    onClick={() => handleLoadView(view.id)}
                    className="pr-20"
                  >
                    {view.id === activeViewId && (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    <span className="flex-1">{view.name}</span>
                  </DropdownMenuItem>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        openRenameDialog(view.id)
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteDialog(view.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {activeViewId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleUpdateCurrentView}>
                    Mettre à jour la vue active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearActiveView}>
                    Désactiver la vue
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Dialog: Sauvegarder nouvelle vue */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder la vue actuelle</DialogTitle>
            <DialogDescription>
              Donnez un nom à cette configuration de filtres pour la retrouver facilement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="view-name">Nom de la vue</Label>
              <Input
                id="view-name"
                placeholder="Ex: Produits en rupture de stock"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveNewView()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveNewView}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Renommer vue */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer la vue</DialogTitle>
            <DialogDescription>
              Modifier le nom de cette vue sauvegardée.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-view">Nouveau nom</Label>
              <Input
                id="rename-view"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameView()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleRenameView}>
              Renommer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmer suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette vue ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La vue "{savedViews.find(v => v.id === selectedViewId)?.name}" sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteView} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
