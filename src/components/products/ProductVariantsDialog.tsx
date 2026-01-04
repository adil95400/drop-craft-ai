import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useProductVariants } from '@/hooks/useProductVariants'
import { Plus, Trash2, Edit, Settings, Sparkles } from 'lucide-react'
import { VariantImageUpload } from './VariantImageUpload'

interface ProductVariantsDialogProps {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ProductVariantsDialog = ({ productId, open, onOpenChange }: ProductVariantsDialogProps) => {
  const { 
    variants, 
    options, 
    createVariant, 
    updateVariant, 
    deleteVariant,
    saveOptions,
    generateVariants,
    variantsLoading,
    isCreating
  } = useProductVariants(productId)

  const [optionsConfig, setOptionsConfig] = useState<Array<{ name: string; values: string[] }>>([
    { name: '', values: [] }
  ])
  const [editingVariant, setEditingVariant] = useState<any>(null)
  const [showOptionsDialog, setShowOptionsDialog] = useState(false)

  const handleAddOption = () => {
    setOptionsConfig([...optionsConfig, { name: '', values: [] }])
  }

  const handleRemoveOption = (index: number) => {
    setOptionsConfig(optionsConfig.filter((_, i) => i !== index))
  }

  const handleOptionNameChange = (index: number, name: string) => {
    const newOptions = [...optionsConfig]
    newOptions[index].name = name
    setOptionsConfig(newOptions)
  }

  const handleOptionValuesChange = (index: number, values: string) => {
    const newOptions = [...optionsConfig]
    newOptions[index].values = values.split(',').map(v => v.trim()).filter(Boolean)
    setOptionsConfig(newOptions)
  }

  const handleSaveOptions = async () => {
    const validOptions = optionsConfig.filter(opt => opt.name && opt.values.length > 0)
    // Store options locally for variant generation
    setShowOptionsDialog(false)
  }

  const handleGenerateVariants = async () => {
    const validOptions = optionsConfig.filter(opt => opt.name && opt.values.length > 0)
    if (validOptions.length === 0) return
    await generateVariants(validOptions.map((opt, i) => ({
      name: opt.name,
      values: opt.values,
      position: i
    })))
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestion des variantes</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Options du produit</h3>
                  <p className="text-sm text-muted-foreground">
                    Définissez les options (taille, couleur, etc.)
                  </p>
                </div>
                
                <Button variant="outline" onClick={() => setShowOptionsDialog(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </div>

              {optionsConfig.filter(o => o.name && o.values.length > 0).length > 0 && (
                <div className="space-y-2">
                  {optionsConfig.filter(o => o.name && o.values.length > 0).map((option, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Badge variant="secondary">{option.name}</Badge>
                      <div className="flex gap-1 flex-wrap">
                        {option.values.map((value, i) => (
                          <Badge key={i} variant="outline">{value}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    onClick={handleGenerateVariants}
                    disabled={isCreating}
                    className="mt-4"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer les variantes
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Variantes ({variants?.length || 0})</h3>

              {variantsLoading ? (
                <p className="text-muted-foreground">Chargement...</p>
              ) : !variants || variants.length === 0 ? (
                <p className="text-muted-foreground">Aucune variante</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Options</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((variant) => (
                      <TableRow key={variant.id}>
                        <TableCell>
                          {variant.image_url ? (
                            <img 
                              src={variant.image_url} 
                              alt={variant.name}
                              className="h-12 w-12 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg'
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                              N/A
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{variant.sku || 'N/A'}</TableCell>
                        <TableCell>{variant.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {variant.option1_value && (
                              <Badge variant="outline" className="text-xs">
                                {variant.option1_name}: {variant.option1_value}
                              </Badge>
                            )}
                            {variant.option2_value && (
                              <Badge variant="outline" className="text-xs">
                                {variant.option2_name}: {variant.option2_value}
                              </Badge>
                            )}
                            {variant.option3_value && (
                              <Badge variant="outline" className="text-xs">
                                {variant.option3_name}: {variant.option3_value}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{variant.price} €</TableCell>
                        <TableCell>
                          <Badge variant={variant.stock_quantity && variant.stock_quantity > 0 ? 'default' : 'destructive'}>
                            {variant.stock_quantity || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingVariant(variant)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteVariant(variant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Options Config Dialog */}
      <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuration des options</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {optionsConfig.map((option, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Option {index + 1}</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    placeholder="Ex: Taille, Couleur"
                    value={option.name}
                    onChange={(e) => handleOptionNameChange(index, e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Valeurs (séparées par virgules)</Label>
                  <Input
                    placeholder="Ex: S, M, L, XL"
                    value={option.values.join(', ')}
                    onChange={(e) => handleOptionValuesChange(index, e.target.value)}
                  />
                </div>
              </div>
            ))}
            
            <Button variant="outline" onClick={handleAddOption} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une option
            </Button>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowOptionsDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveOptions}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Variant Dialog */}
      {editingVariant && (
        <Dialog open={!!editingVariant} onOpenChange={() => setEditingVariant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la variante</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Prix (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingVariant.price || ''}
                  onChange={(e) => setEditingVariant({ ...editingVariant, price: parseFloat(e.target.value) || null })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Prix de coût (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingVariant.cost_price || ''}
                  onChange={(e) => setEditingVariant({ ...editingVariant, cost_price: parseFloat(e.target.value) || null })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={editingVariant.stock_quantity || 0}
                  onChange={(e) => setEditingVariant({ ...editingVariant, stock_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <VariantImageUpload
                imageUrl={editingVariant.image_url}
                onImageChange={(url) => setEditingVariant({ ...editingVariant, image_url: url })}
              />
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingVariant(null)}>
                  Annuler
                </Button>
                <Button onClick={() => {
                  updateVariant({ id: editingVariant.id, updates: editingVariant })
                  setEditingVariant(null)
                }}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
