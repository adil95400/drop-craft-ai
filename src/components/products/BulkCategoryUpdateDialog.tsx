import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { FolderTree, Plus, Loader2, ArrowLeft } from 'lucide-react'

interface BulkCategoryUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  existingCategories: string[]
  onConfirm: (category: string) => Promise<void> | void
}

export function BulkCategoryUpdateDialog({ 
  open, 
  onOpenChange, 
  count, 
  existingCategories,
  onConfirm 
}: BulkCategoryUpdateDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customCategory, setCustomCategory] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    const category = showCustomInput ? customCategory.trim() : selectedCategory
    if (!category) return
    
    setIsLoading(true)
    try {
      await onConfirm(category)
      onOpenChange(false)
      setSelectedCategory('')
      setCustomCategory('')
      setShowCustomInput(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Changer la catégorie
          </DialogTitle>
          <DialogDescription>
            Modifier la catégorie de {count} produit{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showCustomInput ? (
            <>
              <div className="space-y-2">
                <Label>Catégorie existante</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingCategories.length > 0 ? (
                      existingCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="Autre" disabled>
                        Aucune catégorie disponible
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCustomInput(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une nouvelle catégorie
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="custom-category">Nouvelle catégorie</Label>
              <Input
                id="custom-category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Nom de la catégorie"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCustomInput(false)
                  setCustomCategory('')
                }}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux catégories existantes
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="sm:w-auto w-full"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={(showCustomInput ? !customCategory.trim() : !selectedCategory) || isLoading}
            className="sm:w-auto w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour...
              </>
            ) : (
              `Mettre à jour ${count} produit${count > 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
