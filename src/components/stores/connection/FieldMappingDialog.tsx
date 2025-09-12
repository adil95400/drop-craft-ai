import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowRight, MapPin, Info, Check, X, Plus, Trash2, 
  Download, Upload, RotateCcw 
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FieldMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: string
  onSave: (mapping: FieldMapping[]) => void
}

interface FieldMapping {
  sourceField: string
  targetField: string
  transform?: string
  required: boolean
  dataType: 'text' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  defaultValue?: string
}

interface PlatformField {
  key: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  required: boolean
  description?: string
}

const commonTargetFields: PlatformField[] = [
  { key: 'title', label: 'Titre du produit', type: 'text', required: true, description: 'Nom principal du produit' },
  { key: 'description', label: 'Description', type: 'text', required: false, description: 'Description détaillée' },
  { key: 'sku', label: 'SKU', type: 'text', required: true, description: 'Référence unique' },
  { key: 'price', label: 'Prix', type: 'number', required: true, description: 'Prix de vente' },
  { key: 'compareAtPrice', label: 'Prix barré', type: 'number', required: false, description: 'Prix de comparaison' },
  { key: 'costPrice', label: 'Prix coûtant', type: 'number', required: false, description: 'Prix d\'achat' },
  { key: 'inventory', label: 'Stock', type: 'number', required: false, description: 'Quantité en stock' },
  { key: 'weight', label: 'Poids', type: 'number', required: false, description: 'Poids du produit' },
  { key: 'category', label: 'Catégorie', type: 'text', required: false, description: 'Catégorie principale' },
  { key: 'tags', label: 'Étiquettes', type: 'array', required: false, description: 'Tags/mots-clés' },
  { key: 'brand', label: 'Marque', type: 'text', required: false, description: 'Nom de la marque' },
  { key: 'vendor', label: 'Fournisseur', type: 'text', required: false, description: 'Nom du fournisseur' },
  { key: 'barcode', label: 'Code-barres', type: 'text', required: false, description: 'EAN/UPC' },
  { key: 'images', label: 'Images', type: 'array', required: false, description: 'URLs des images' },
  { key: 'status', label: 'Statut', type: 'text', required: false, description: 'Actif/Inactif' },
  { key: 'variants', label: 'Variantes', type: 'array', required: false, description: 'Taille, couleur, etc.' }
]

const platformSourceFields: Record<string, PlatformField[]> = {
  shopify: [
    { key: 'title', label: 'title', type: 'text', required: true },
    { key: 'body_html', label: 'body_html', type: 'text', required: false },
    { key: 'vendor', label: 'vendor', type: 'text', required: false },
    { key: 'product_type', label: 'product_type', type: 'text', required: false },
    { key: 'handle', label: 'handle', type: 'text', required: false },
    { key: 'tags', label: 'tags', type: 'text', required: false },
    { key: 'variants', label: 'variants', type: 'array', required: false },
    { key: 'images', label: 'images', type: 'array', required: false },
    { key: 'status', label: 'status', type: 'text', required: false }
  ],
  woocommerce: [
    { key: 'name', label: 'name', type: 'text', required: true },
    { key: 'description', label: 'description', type: 'text', required: false },
    { key: 'short_description', label: 'short_description', type: 'text', required: false },
    { key: 'sku', label: 'sku', type: 'text', required: false },
    { key: 'regular_price', label: 'regular_price', type: 'text', required: false },
    { key: 'sale_price', label: 'sale_price', type: 'text', required: false },
    { key: 'manage_stock', label: 'manage_stock', type: 'boolean', required: false },
    { key: 'stock_quantity', label: 'stock_quantity', type: 'number', required: false },
    { key: 'weight', label: 'weight', type: 'text', required: false },
    { key: 'categories', label: 'categories', type: 'array', required: false },
    { key: 'tags', label: 'tags', type: 'array', required: false },
    { key: 'images', label: 'images', type: 'array', required: false }
  ],
  prestashop: [
    { key: 'name', label: 'name', type: 'text', required: true },
    { key: 'description', label: 'description', type: 'text', required: false },
    { key: 'description_short', label: 'description_short', type: 'text', required: false },
    { key: 'reference', label: 'reference', type: 'text', required: false },
    { key: 'price', label: 'price', type: 'number', required: false },
    { key: 'wholesale_price', label: 'wholesale_price', type: 'number', required: false },
    { key: 'quantity', label: 'quantity', type: 'number', required: false },
    { key: 'weight', label: 'weight', type: 'number', required: false },
    { key: 'manufacturer_name', label: 'manufacturer_name', type: 'text', required: false },
    { key: 'category_default', label: 'category_default', type: 'text', required: false },
    { key: 'associations', label: 'associations', type: 'object', required: false }
  ],
  magento: [
    { key: 'name', label: 'name', type: 'text', required: true },
    { key: 'description', label: 'description', type: 'text', required: false },
    { key: 'short_description', label: 'short_description', type: 'text', required: false },
    { key: 'sku', label: 'sku', type: 'text', required: true },
    { key: 'price', label: 'price', type: 'number', required: false },
    { key: 'special_price', label: 'special_price', type: 'number', required: false },
    { key: 'weight', label: 'weight', type: 'number', required: false },
    { key: 'status', label: 'status', type: 'number', required: false },
    { key: 'visibility', label: 'visibility', type: 'number', required: false },
    { key: 'type_id', label: 'type_id', type: 'text', required: false },
    { key: 'attribute_set_id', label: 'attribute_set_id', type: 'number', required: false }
  ]
}

const transformFunctions = [
  { key: 'none', label: 'Aucune transformation', description: 'Utiliser la valeur telle quelle' },
  { key: 'lowercase', label: 'Minuscules', description: 'Convertir en minuscules' },
  { key: 'uppercase', label: 'Majuscules', description: 'Convertir en majuscules' },
  { key: 'trim', label: 'Supprimer espaces', description: 'Supprimer les espaces en début/fin' },
  { key: 'stripHtml', label: 'Supprimer HTML', description: 'Retirer les balises HTML' },
  { key: 'parseFloat', label: 'Nombre décimal', description: 'Convertir en nombre décimal' },
  { key: 'parseInt', label: 'Nombre entier', description: 'Convertir en nombre entier' },
  { key: 'splitComma', label: 'Séparer par virgules', description: 'Créer un tableau séparé par virgules' },
  { key: 'joinComma', label: 'Joindre par virgules', description: 'Joindre un tableau avec des virgules' },
  { key: 'urlToArray', label: 'URLs vers tableau', description: 'Convertir URLs séparées par virgules en tableau' }
]

export function FieldMappingDialog({ open, onOpenChange, platform, onSave }: FieldMappingDialogProps) {
  const { toast } = useToast()
  const [mappings, setMappings] = useState<FieldMapping[]>(() => {
    // Mapping par défaut basé sur la plateforme
    const defaultMappings: FieldMapping[] = []
    
    if (platform === 'shopify') {
      defaultMappings.push(
        { sourceField: 'title', targetField: 'title', required: true, dataType: 'text' },
        { sourceField: 'body_html', targetField: 'description', required: false, dataType: 'text', transform: 'stripHtml' },
        { sourceField: 'vendor', targetField: 'brand', required: false, dataType: 'text' },
        { sourceField: 'product_type', targetField: 'category', required: false, dataType: 'text' },
        { sourceField: 'tags', targetField: 'tags', required: false, dataType: 'array', transform: 'splitComma' },
        { sourceField: 'images', targetField: 'images', required: false, dataType: 'array' }
      )
    } else if (platform === 'woocommerce') {
      defaultMappings.push(
        { sourceField: 'name', targetField: 'title', required: true, dataType: 'text' },
        { sourceField: 'description', targetField: 'description', required: false, dataType: 'text', transform: 'stripHtml' },
        { sourceField: 'sku', targetField: 'sku', required: true, dataType: 'text' },
        { sourceField: 'regular_price', targetField: 'price', required: true, dataType: 'number', transform: 'parseFloat' },
        { sourceField: 'sale_price', targetField: 'compareAtPrice', required: false, dataType: 'number', transform: 'parseFloat' },
        { sourceField: 'stock_quantity', targetField: 'inventory', required: false, dataType: 'number', transform: 'parseInt' },
        { sourceField: 'weight', targetField: 'weight', required: false, dataType: 'number', transform: 'parseFloat' }
      )
    }
    // Ajouter d'autres plateformes...
    
    return defaultMappings
  })

  const sourceFields = platformSourceFields[platform] || []

  const addMapping = () => {
    setMappings(prev => [...prev, {
      sourceField: '',
      targetField: '',
      required: false,
      dataType: 'text'
    }])
  }

  const removeMapping = (index: number) => {
    setMappings(prev => prev.filter((_, i) => i !== index))
  }

  const updateMapping = (index: number, updates: Partial<FieldMapping>) => {
    setMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, ...updates } : mapping
    ))
  }

  const resetToDefaults = () => {
    setMappings([])
    // Recharger les mappings par défaut
    setTimeout(() => {
      onOpenChange(false)
      onOpenChange(true)
    }, 100)
  }

  const handleSave = () => {
    const validMappings = mappings.filter(m => m.sourceField && m.targetField)
    
    if (validMappings.length === 0) {
      toast({
        title: "Aucun mapping défini",
        description: "Vous devez définir au moins un mapping de champ",
        variant: "destructive"
      })
      return
    }

    onSave(validMappings)
    onOpenChange(false)
    
    toast({
      title: "Mapping sauvegardé",
      description: `${validMappings.length} mappings de champs configurés`
    })
  }

  const getTargetFieldInfo = (key: string) => 
    commonTargetFields.find(field => field.key === key)

  const getSourceFieldInfo = (key: string) => 
    sourceFields.find(field => field.key === key)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapping des champs - {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Configurez la correspondance entre les champs de votre plateforme et notre système
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 h-[calc(90vh-8rem)]">
          {/* Panneau de gauche - Configuration */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Configuration des mappings</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetToDefaults}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Par défaut
                </Button>
                <Button variant="outline" size="sm" onClick={addMapping}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {mappings.map((mapping, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-start">
                      {/* Champ source */}
                      <div className="col-span-4">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Champ source ({platform})
                        </Label>
                        <Select
                          value={mapping.sourceField}
                          onValueChange={(value) => updateMapping(index, { 
                            sourceField: value,
                            dataType: getSourceFieldInfo(value)?.type || 'text'
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {sourceFields.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                <div className="flex items-center gap-2">
                                  <span>{field.label}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {field.type}
                                  </Badge>
                                  {field.required && (
                                    <Badge variant="destructive" className="text-xs">
                                      Requis
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Flèche */}
                      <div className="col-span-1 flex justify-center pt-6">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* Champ cible */}
                      <div className="col-span-4">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Champ cible (système)
                        </Label>
                        <Select
                          value={mapping.targetField}
                          onValueChange={(value) => updateMapping(index, { 
                            targetField: value,
                            required: getTargetFieldInfo(value)?.required || false
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {commonTargetFields.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                <div className="flex items-center gap-2">
                                  <span>{field.label}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {field.type}
                                  </Badge>
                                  {field.required && (
                                    <Badge variant="destructive" className="text-xs">
                                      Requis
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Transformation */}
                      <div className="col-span-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Transformation
                        </Label>
                        <Select
                          value={mapping.transform || 'none'}
                          onValueChange={(value) => updateMapping(index, { 
                            transform: value === 'none' ? undefined : value 
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {transformFunctions.map((func) => (
                              <SelectItem key={func.key} value={func.key}>
                                {func.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex justify-end pt-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMapping(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Informations supplémentaires */}
                    {(mapping.sourceField || mapping.targetField) && (
                      <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        {mapping.sourceField && getSourceFieldInfo(mapping.sourceField) && (
                          <div>
                            <strong>Source:</strong> {getSourceFieldInfo(mapping.sourceField)?.description || 'Champ source'}
                          </div>
                        )}
                        {mapping.targetField && getTargetFieldInfo(mapping.targetField) && (
                          <div>
                            <strong>Cible:</strong> {getTargetFieldInfo(mapping.targetField)?.description || 'Champ cible'}
                          </div>
                        )}
                      </div>
                    )}

                    {mapping.defaultValue && (
                      <div className="mt-2">
                        <Label className="text-xs">Valeur par défaut</Label>
                        <Input
                          placeholder="Valeur si le champ source est vide"
                          value={mapping.defaultValue}
                          onChange={(e) => updateMapping(index, { defaultValue: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </Card>
                ))}

                {mappings.length === 0 && (
                  <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <MapPin className="w-12 h-12 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Aucun mapping configuré</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Cliquez sur "Ajouter" pour commencer la configuration
                        </p>
                      </div>
                      <Button onClick={addMapping}>
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un mapping
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Panneau de droite - Aperçu et aide */}
          <div className="w-80 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Champs requis</CardTitle>
                <CardDescription className="text-xs">
                  Ces champs doivent être mappés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-4">
                {commonTargetFields
                  .filter(field => field.required)
                  .map((field) => {
                    const isMapped = mappings.some(m => m.targetField === field.key)
                    return (
                      <div key={field.key} className="flex items-center gap-2 text-sm">
                        {isMapped ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <X className="w-4 h-4 text-destructive" />
                        )}
                        <span className={isMapped ? 'text-success' : 'text-destructive'}>
                          {field.label}
                        </span>
                      </div>
                    )
                  })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Fonctions de transformation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {transformFunctions.slice(0, 6).map((func) => (
                  <div key={func.key} className="text-xs">
                    <div className="font-medium">{func.label}</div>
                    <div className="text-muted-foreground">{func.description}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Conseil :</strong> Testez votre mapping avec quelques produits avant l'import complet.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">
              {mappings.filter(m => m.sourceField && m.targetField).length} mappings configurés
            </Badge>
            <Badge variant="outline">
              {mappings.filter(m => m.required).length} champs obligatoires
            </Badge>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              <Download className="w-4 h-4 mr-2" />
              Sauvegarder le mapping
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}