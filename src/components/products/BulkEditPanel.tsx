/**
 * Panneau d'édition en masse amélioré
 * Interface riche avec prévisualisation des changements
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { 
  Edit3, DollarSign, Tag, Package, Image, FileText,
  Trash2, Archive, CheckCircle, XCircle, RefreshCw,
  Sparkles, Zap, Target, Search, Save, Eye, EyeOff,
  ArrowRight, Percent, Plus, Minus, Calculator
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { UnifiedProduct } from '@/hooks/unified/useProductsUnified'

interface BulkEditPanelProps {
  selectedProducts: UnifiedProduct[]
  onClose?: () => void
  onComplete: () => void
  onCancel?: () => void
}

type EditOperation = 
  | 'price_fixed' 
  | 'price_percent' 
  | 'price_margin'
  | 'category'
  | 'status'
  | 'stock'
  | 'tags_add'
  | 'tags_remove'
  | 'title_prefix'
  | 'title_suffix'
  | 'description_append'
  | 'ai_optimize'
  | 'delete'
  | 'archive'

interface EditAction {
  operation: EditOperation
  value: string | number | boolean
  preview?: string
}

export function BulkEditPanel({ selectedProducts, onClose, onComplete, onCancel }: BulkEditPanelProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'quick' | 'advanced' | 'ai'>('quick')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<EditAction | null>(null)

  // États des champs d'édition
  const [priceOperation, setPriceOperation] = useState<'fixed' | 'percent' | 'margin'>('percent')
  const [priceValue, setPriceValue] = useState<string>('')
  const [newCategory, setNewCategory] = useState<string>('')
  const [newStatus, setNewStatus] = useState<string>('')
  const [stockAdjustment, setStockAdjustment] = useState<string>('')
  const [stockOperation, setStockOperation] = useState<'set' | 'add' | 'subtract'>('set')
  const [tagsToAdd, setTagsToAdd] = useState<string>('')
  const [tagsToRemove, setTagsToRemove] = useState<string>('')
  const [titlePrefix, setTitlePrefix] = useState<string>('')
  const [titleSuffix, setTitleSuffix] = useState<string>('')
  const [descriptionAppend, setDescriptionAppend] = useState<string>('')

  // Calcul de l'aperçu des prix
  const pricePreview = useMemo(() => {
    if (!priceValue || isNaN(Number(priceValue))) return null
    
    const value = Number(priceValue)
    const sample = selectedProducts.slice(0, 3)
    
    return sample.map(p => {
      let newPrice = p.price
      switch (priceOperation) {
        case 'fixed':
          newPrice = value
          break
        case 'percent':
          newPrice = p.price * (1 + value / 100)
          break
        case 'margin':
          const cost = p.cost_price || p.price * 0.6
          newPrice = cost * (1 + value / 100)
          break
      }
      return {
        name: p.name,
        oldPrice: p.price,
        newPrice: Math.round(newPrice * 100) / 100
      }
    })
  }, [selectedProducts, priceValue, priceOperation])

  const executeAction = async (action: EditAction) => {
    setIsProcessing(true)
    setProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const totalProducts = selectedProducts.length
      let processed = 0

      for (const product of selectedProducts) {
        // Always use products table
        const tableName = 'products'
        
        let updateData: any = {}

        switch (action.operation) {
          case 'price_fixed':
            updateData.price = Number(action.value)
            break
          case 'price_percent':
            updateData.price = product.price * (1 + Number(action.value) / 100)
            break
          case 'price_margin':
            const cost = product.cost_price || product.price * 0.6
            updateData.price = cost * (1 + Number(action.value) / 100)
            break
          case 'category':
            updateData.category = action.value
            break
          case 'status':
            updateData.status = action.value
            break
          case 'stock':
            if (stockOperation === 'set') {
              updateData.stock_quantity = Number(action.value)
            } else if (stockOperation === 'add') {
              updateData.stock_quantity = (product.stock_quantity || 0) + Number(action.value)
            } else {
              updateData.stock_quantity = Math.max(0, (product.stock_quantity || 0) - Number(action.value))
            }
            break
          case 'title_prefix':
            updateData.name = `${action.value} ${product.name}`
            break
          case 'title_suffix':
            updateData.name = `${product.name} ${action.value}`
            break
          case 'description_append':
            updateData.description = `${product.description || ''}\n\n${action.value}`
            break
          case 'archive':
            updateData.status = 'archived'
            break
        }

        if (action.operation === 'delete') {
          await supabase
            .from(tableName)
            .delete()
            .eq('id', product.id)
            .eq('user_id', user.id)
        } else if (Object.keys(updateData).length > 0) {
          await supabase
            .from(tableName)
            .update(updateData)
            .eq('id', product.id)
            .eq('user_id', user.id)
        }

        processed++
        setProgress(Math.round((processed / totalProducts) * 100))
      }

      toast({
        title: 'Modification effectuée',
        description: `${processed} produit${processed > 1 ? 's' : ''} modifié${processed > 1 ? 's' : ''}`
      })

      onComplete()
    } catch (error) {
      console.error('Bulk edit error:', error)
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleAction = (action: EditAction) => {
    if (action.operation === 'delete' || selectedProducts.length > 50) {
      setPendingAction(action)
      setShowConfirmDialog(true)
    } else {
      executeAction(action)
    }
  }

  const handleAIOptimize = async (type: string) => {
    setIsProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase.functions.invoke('bulk-ai-optimizer', {
        body: {
          userId: user.id,
          productIds: selectedProducts.map(p => p.id),
          action: type,
          batchSize: 10
        }
      })

      if (error) throw error

      toast({
        title: 'Optimisation IA terminée',
        description: `${data?.processed || selectedProducts.length} produits optimisés`
      })

      onComplete()
    } catch (error) {
      console.error('AI optimization error:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'effectuer l\'optimisation IA',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" />
                Édition en masse
              </CardTitle>
              <CardDescription>
                {selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''} sélectionné{selectedProducts.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
          
          {isProcessing && (
            <div className="space-y-2 pt-3">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Traitement en cours... {progress}%
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick" className="gap-2">
                <Zap className="h-4 w-4" />
                Rapide
              </TabsTrigger>
              <TabsTrigger value="advanced" className="gap-2">
                <Edit3 className="h-4 w-4" />
                Avancé
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="h-4 w-4" />
                IA
              </TabsTrigger>
            </TabsList>

            {/* Actions rapides */}
            <TabsContent value="quick" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleAction({ operation: 'status', value: 'active' })}
                  disabled={isProcessing}
                >
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-xs">Activer</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleAction({ operation: 'status', value: 'paused' })}
                  disabled={isProcessing}
                >
                  <EyeOff className="h-5 w-5 text-orange-600" />
                  <span className="text-xs">Désactiver</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleAction({ operation: 'archive', value: true })}
                  disabled={isProcessing}
                >
                  <Archive className="h-5 w-5 text-gray-600" />
                  <span className="text-xs">Archiver</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 text-destructive hover:text-destructive"
                  onClick={() => handleAction({ operation: 'delete', value: true })}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="text-xs">Supprimer</span>
                </Button>
              </div>
            </TabsContent>

            {/* Édition avancée */}
            <TabsContent value="advanced" className="space-y-6 pt-4">
              {/* Prix */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Modification des prix
                </Label>
                <div className="flex gap-2">
                  <Select value={priceOperation} onValueChange={(v: any) => setPriceOperation(v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Prix fixe</SelectItem>
                      <SelectItem value="percent">% de variation</SelectItem>
                      <SelectItem value="margin">% de marge</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder={priceOperation === 'fixed' ? '29.99' : '+10 ou -5'}
                      value={priceValue}
                      onChange={(e) => setPriceValue(e.target.value)}
                    />
                    {priceOperation !== 'fixed' && (
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <Button 
                    onClick={() => handleAction({ 
                      operation: `price_${priceOperation}` as EditOperation, 
                      value: Number(priceValue) 
                    })}
                    disabled={!priceValue || isProcessing}
                  >
                    Appliquer
                  </Button>
                </div>
                {pricePreview && pricePreview.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Aperçu :</p>
                    {pricePreview.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="truncate flex-1">{p.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through">{p.oldPrice}€</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className={cn(
                            "font-medium",
                            p.newPrice > p.oldPrice ? "text-green-600" : "text-red-600"
                          )}>
                            {p.newPrice}€
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Stock */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Ajustement du stock
                </Label>
                <div className="flex gap-2">
                  <Select value={stockOperation} onValueChange={(v: any) => setStockOperation(v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set">Définir à</SelectItem>
                      <SelectItem value="add">Ajouter</SelectItem>
                      <SelectItem value="subtract">Retirer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Quantité"
                    value={stockAdjustment}
                    onChange={(e) => setStockAdjustment(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleAction({ operation: 'stock', value: Number(stockAdjustment) })}
                    disabled={!stockAdjustment || isProcessing}
                  >
                    Appliquer
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Catégorie */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Catégorie
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nouvelle catégorie"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleAction({ operation: 'category', value: newCategory })}
                    disabled={!newCategory || isProcessing}
                  >
                    Appliquer
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Titre */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Modification des titres
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Input
                      placeholder="Préfixe (ex: [PROMO])"
                      value={titlePrefix}
                      onChange={(e) => setTitlePrefix(e.target.value)}
                    />
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => handleAction({ operation: 'title_prefix', value: titlePrefix })}
                      disabled={!titlePrefix || isProcessing}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter préfixe
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Suffixe (ex: - Livraison gratuite)"
                      value={titleSuffix}
                      onChange={(e) => setTitleSuffix(e.target.value)}
                    />
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => handleAction({ operation: 'title_suffix', value: titleSuffix })}
                      disabled={!titleSuffix || isProcessing}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter suffixe
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Actions IA */}
            <TabsContent value="ai" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleAIOptimize('rewrite_titles')}
                  disabled={isProcessing}
                >
                  <FileText className="h-6 w-6 text-blue-600" />
                  <span className="text-xs text-center">Réécrire les titres</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleAIOptimize('rewrite_descriptions')}
                  disabled={isProcessing}
                >
                  <FileText className="h-6 w-6 text-purple-600" />
                  <span className="text-xs text-center">Réécrire les descriptions</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleAIOptimize('generate_seo')}
                  disabled={isProcessing}
                >
                  <Target className="h-6 w-6 text-green-600" />
                  <span className="text-xs text-center">Générer metas SEO</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleAIOptimize('complete_attributes')}
                  disabled={isProcessing}
                >
                  <Tag className="h-6 w-6 text-orange-600" />
                  <span className="text-xs text-center">Compléter attributs</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleAIOptimize('optimize_images')}
                  disabled={isProcessing}
                >
                  <Image className="h-6 w-6 text-pink-600" />
                  <span className="text-xs text-center">Optimiser images</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleAIOptimize('fix_spelling')}
                  disabled={isProcessing}
                >
                  <Zap className="h-6 w-6 text-yellow-600" />
                  <span className="text-xs text-center">Corriger orthographe</span>
                </Button>
              </div>

              <Button
                className="w-full h-16 gap-3"
                onClick={() => handleAIOptimize('full_optimization')}
                disabled={isProcessing}
              >
                <Sparkles className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Optimisation complète IA</p>
                  <p className="text-xs opacity-80">Titres, descriptions, SEO, attributs</p>
                </div>
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'action</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.operation === 'delete' 
                ? `Êtes-vous sûr de vouloir supprimer ${selectedProducts.length} produit${selectedProducts.length > 1 ? 's' : ''} ? Cette action est irréversible.`
                : `Vous êtes sur le point de modifier ${selectedProducts.length} produits. Voulez-vous continuer ?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingAction) executeAction(pendingAction)
                setShowConfirmDialog(false)
              }}
              className={pendingAction?.operation === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
