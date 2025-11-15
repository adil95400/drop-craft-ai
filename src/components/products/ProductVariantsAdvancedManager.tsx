import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Plus, Trash2, Download, Upload, Sparkles, Save, X } from 'lucide-react'
import { VariantImageUpload } from './VariantImageUpload'
import { useToast } from '@/hooks/use-toast'
import Papa from 'papaparse'

interface ProductVariantsAdvancedManagerProps {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ProductVariantsAdvancedManager = ({ productId, open, onOpenChange }: ProductVariantsAdvancedManagerProps) => {
  const { toast } = useToast()
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

  // Options management
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
    await saveOptions(validOptions.map((opt, i) => ({
      product_id: productId,
      name: opt.name,
      values: opt.values,
      position: i
    })))
  }

  const handleGenerateVariants = async () => {
    if (!options || options.length === 0) {
      toast({
        title: "Options manquantes",
        description: "Veuillez d'abord configurer les options du produit",
        variant: "destructive"
      })
      return
    }
    await generateVariants(options)
  }

  // CSV Import
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const variantsToCreate = results.data.map((row: any) => ({
            product_id: productId,
            sku: row.sku || row.SKU || '',
            option1: row.option1 || row.Option1 || null,
            option2: row.option2 || row.Option2 || null,
            option3: row.option3 || row.Option3 || null,
            price: parseFloat(row.price || row.Prix || 0),
            compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
            inventory_quantity: parseInt(row.inventory_quantity || row.stock || 0),
            weight: row.weight ? parseFloat(row.weight) : null,
            barcode: row.barcode || null,
          }))

          for (const variant of variantsToCreate) {
            await createVariant.mutateAsync(variant)
          }

          toast({
            title: "Import réussi",
            description: `${variantsToCreate.length} variantes importées`
          })
        } catch (error) {
          toast({
            title: "Erreur d'import",
            description: "Vérifiez le format du fichier CSV",
            variant: "destructive"
          })
        }
      }
    })
  }

  // CSV Export
  const handleExportCSV = () => {
    if (!variants || variants.length === 0) {
      toast({
        title: "Aucune variante",
        description: "Il n'y a pas de variantes à exporter",
        variant: "destructive"
      })
      return
    }

    const csv = Papa.unparse(variants.map(v => ({
      sku: v.sku,
      option1: v.option1,
      option2: v.option2,
      option3: v.option3,
      price: v.price,
      compare_at_price: v.compare_at_price,
      inventory_quantity: v.inventory_quantity,
      weight: v.weight,
      barcode: v.barcode,
      image_url: v.image_url
    })))

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `variants-${productId}.csv`
    a.click()
  }

  // Inline editing
  const handleStartEdit = (variant: any) => {
    setEditingVariant({ ...variant })
  }

  const handleSaveEdit = async () => {
    if (!editingVariant) return
    await updateVariant.mutateAsync({
      id: editingVariant.id,
      updates: {
        sku: editingVariant.sku,
        price: editingVariant.price,
        compare_at_price: editingVariant.compare_at_price,
        inventory_quantity: editingVariant.inventory_quantity,
        weight: editingVariant.weight,
        barcode: editingVariant.barcode,
      }
    })
    setEditingVariant(null)
  }

  const handleCancelEdit = () => {
    setEditingVariant(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gestion Avancée des Variantes
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="variants" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="variants">Variantes</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="bulk">Actions en masse</TabsTrigger>
          </TabsList>

          {/* Tab 1: Variants List */}
          <TabsContent value="variants" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Liste des variantes</h3>
                  <p className="text-sm text-muted-foreground">
                    {variants?.length || 0} variante(s) configurée(s)
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                  </Button>
                  <Button onClick={handleGenerateVariants} disabled={isCreating}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer les variantes
                  </Button>
                </div>
              </div>

              {variantsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : variants && variants.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Options</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Prix comparé</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Poids</TableHead>
                        <TableHead>Code-barre</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant) => {
                        const isEditing = editingVariant?.id === variant.id
                        
                        return (
                          <TableRow key={variant.id}>
                            <TableCell>
                              <VariantImageUpload
                                variantId={variant.id}
                                currentImageUrl={variant.image_url}
                                onImageUploaded={(url) => 
                                  updateVariant.mutate({ 
                                    id: variant.id, 
                                    updates: { image_url: url } 
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {variant.option1 && <Badge variant="secondary">{variant.option1}</Badge>}
                                {variant.option2 && <Badge variant="secondary">{variant.option2}</Badge>}
                                {variant.option3 && <Badge variant="secondary">{variant.option3}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  value={editingVariant.sku || ''}
                                  onChange={(e) => setEditingVariant({ ...editingVariant, sku: e.target.value })}
                                  className="w-32"
                                />
                              ) : (
                                variant.sku || '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingVariant.price || 0}
                                  onChange={(e) => setEditingVariant({ ...editingVariant, price: parseFloat(e.target.value) })}
                                  className="w-24"
                                />
                              ) : (
                                `${variant.price}€`
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingVariant.compare_at_price || ''}
                                  onChange={(e) => setEditingVariant({ ...editingVariant, compare_at_price: e.target.value ? parseFloat(e.target.value) : null })}
                                  className="w-24"
                                />
                              ) : (
                                variant.compare_at_price ? `${variant.compare_at_price}€` : '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={editingVariant.inventory_quantity || 0}
                                  onChange={(e) => setEditingVariant({ ...editingVariant, inventory_quantity: parseInt(e.target.value) })}
                                  className="w-20"
                                />
                              ) : (
                                <Badge variant={variant.inventory_quantity && variant.inventory_quantity > 10 ? "default" : "destructive"}>
                                  {variant.inventory_quantity || 0}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingVariant.weight || ''}
                                  onChange={(e) => setEditingVariant({ ...editingVariant, weight: e.target.value ? parseFloat(e.target.value) : null })}
                                  className="w-20"
                                />
                              ) : (
                                variant.weight ? `${variant.weight}kg` : '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  value={editingVariant.barcode || ''}
                                  onChange={(e) => setEditingVariant({ ...editingVariant, barcode: e.target.value })}
                                  className="w-32"
                                />
                              ) : (
                                variant.barcode || '-'
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditing ? (
                                <div className="flex gap-1 justify-end">
                                  <Button size="sm" variant="default" onClick={handleSaveEdit}>
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-1 justify-end">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleStartEdit(variant)}
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => deleteVariant.mutate(variant.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">Aucune variante configurée</p>
                  <p className="text-sm">Configurez d'abord les options, puis générez les variantes</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab 2: Options Configuration */}
          <TabsContent value="options" className="space-y-4">
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Configuration des options</h3>
                <p className="text-sm text-muted-foreground">
                  Définissez jusqu'à 3 options (ex: Taille, Couleur, Matière)
                </p>
              </div>

              <div className="space-y-4">
                {optionsConfig.map((option, index) => (
                  <Card key={index} className="p-4 bg-muted/50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Option {index + 1}</Label>
                        {index > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid gap-3">
                        <div>
                          <Label htmlFor={`option-name-${index}`}>Nom de l'option</Label>
                          <Input
                            id={`option-name-${index}`}
                            placeholder="Ex: Taille, Couleur, Matière"
                            value={option.name}
                            onChange={(e) => handleOptionNameChange(index, e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`option-values-${index}`}>
                            Valeurs (séparées par des virgules)
                          </Label>
                          <Input
                            id={`option-values-${index}`}
                            placeholder="Ex: S, M, L, XL"
                            value={option.values.join(', ')}
                            onChange={(e) => handleOptionValuesChange(index, e.target.value)}
                          />
                          {option.values.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-2">
                              {option.values.map((value, i) => (
                                <Badge key={i} variant="outline">{value}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {optionsConfig.length < 3 && (
                  <Button
                    variant="outline"
                    onClick={handleAddOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une option
                  </Button>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <Button onClick={handleSaveOptions} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les options
                </Button>
              </div>

              {options && options.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Options actuelles :</h4>
                  <div className="space-y-2">
                    {options.map((option) => (
                      <div key={option.id} className="flex gap-2 items-center">
                        <Badge variant="secondary">{option.name}</Badge>
                        <div className="flex gap-1 flex-wrap">
                          {option.values.map((value, i) => (
                            <Badge key={i} variant="outline">{value}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab 3: Bulk Actions */}
          <TabsContent value="bulk" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Actions en masse</h3>
              
              <div className="grid gap-4">
                <Card className="p-4 bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Importer depuis CSV
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Importez plusieurs variantes d'un coup depuis un fichier CSV
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="csv-upload">Fichier CSV</Label>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format attendu: sku, option1, option2, option3, price, inventory_quantity, weight, barcode
                    </p>
                  </div>
                </Card>

                <Card className="p-4 bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Télécharger un modèle
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Téléchargez un modèle CSV vide pour l'import
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const csv = Papa.unparse([
                        {
                          sku: 'PROD-001',
                          option1: 'S',
                          option2: 'Rouge',
                          option3: '',
                          price: 29.99,
                          compare_at_price: 39.99,
                          inventory_quantity: 100,
                          weight: 0.5,
                          barcode: '1234567890'
                        }
                      ])
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'modele-variantes.csv'
                      a.click()
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le modèle
                  </Button>
                </Card>

                <Card className="p-4 bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Génération automatique
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Générez automatiquement toutes les combinaisons possibles à partir de vos options
                  </p>
                  <Button onClick={handleGenerateVariants} disabled={!options || options.length === 0}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer toutes les variantes
                  </Button>
                </Card>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
