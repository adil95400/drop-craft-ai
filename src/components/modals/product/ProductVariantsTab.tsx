/**
 * ProductVariantsTab - Onglet Variantes pour le modal produit
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Layers,
  Package,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  DollarSign,
  Box,
  Palette,
  Ruler,
  Tag,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface Variant {
  id?: string
  name: string
  sku?: string
  price?: number
  stock_quantity?: number
  image?: string
  attributes?: Record<string, string>
}

interface ProductVariantsTabProps {
  variants: Variant[]
  productName: string
  basePrice?: number
  onAddVariant?: (variant: Variant) => Promise<void>
  onUpdateVariant?: (index: number, variant: Variant) => Promise<void>
  onDeleteVariant?: (index: number) => Promise<void>
  isEditing?: boolean
}

export function ProductVariantsTab({
  variants = [],
  productName,
  basePrice = 0,
  onAddVariant,
  onUpdateVariant,
  onDeleteVariant,
  isEditing = false
}: ProductVariantsTabProps) {
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null)
  const [editingVariant, setEditingVariant] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Variant | null>(null)

  // Extract unique attribute types
  const attributeTypes = useMemo(() => {
    const types = new Set<string>()
    variants.forEach(v => {
      if (v.attributes) {
        Object.keys(v.attributes).forEach(key => types.add(key))
      }
    })
    return Array.from(types)
  }, [variants])

  // Group variants by attribute
  const groupedByAttribute = useMemo(() => {
    const groups: Record<string, Set<string>> = {}
    variants.forEach(v => {
      if (v.attributes) {
        Object.entries(v.attributes).forEach(([key, value]) => {
          if (!groups[key]) groups[key] = new Set()
          groups[key].add(value)
        })
      }
    })
    return Object.entries(groups).map(([key, values]) => ({
      name: key,
      values: Array.from(values)
    }))
  }, [variants])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0)
  }

  const getAttributeIcon = (key: string) => {
    const lower = key.toLowerCase()
    if (lower.includes('color') || lower.includes('couleur')) return Palette
    if (lower.includes('size') || lower.includes('taille')) return Ruler
    return Tag
  }

  const startEditing = (index: number, variant: Variant) => {
    setEditingVariant(index)
    setEditForm({ ...variant })
  }

  const cancelEditing = () => {
    setEditingVariant(null)
    setEditForm(null)
  }

  const saveVariant = async () => {
    if (editingVariant !== null && editForm && onUpdateVariant) {
      await onUpdateVariant(editingVariant, editForm)
      cancelEditing()
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <Layers className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{variants.length} variante{variants.length !== 1 ? 's' : ''}</h3>
                <p className="text-sm text-muted-foreground">
                  Options pour {productName}
                </p>
              </div>
            </div>
            {isEditing && onAddVariant && (
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            )}
          </div>

          {/* Attribute Pills */}
          {groupedByAttribute.length > 0 && (
            <div className="mt-4 space-y-3">
              {groupedByAttribute.map((group) => {
                const Icon = getAttributeIcon(group.name)
                return (
                  <div key={group.name} className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground w-24">
                      <Icon className="h-4 w-4" />
                      {group.name}:
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {group.values.map((value) => (
                        <Badge 
                          key={value} 
                          variant="secondary"
                          className="text-xs"
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variants Table/List */}
      {variants.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Liste des variantes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Variante</TableHead>
                    <TableHead>SKU</TableHead>
                    {attributeTypes.map(attr => (
                      <TableHead key={attr} className="capitalize">{attr}</TableHead>
                    ))}
                    <TableHead className="text-right">Prix</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    {isEditing && <TableHead className="w-24">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {variants.map((variant, idx) => {
                      const isEditing_ = editingVariant === idx
                      
                      return (
                        <motion.tr
                          key={variant.id || idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={cn(
                            "group",
                            isEditing_ && "bg-primary/5"
                          )}
                        >
                          <TableCell>
                            {variant.image ? (
                              <img
                                src={variant.image}
                                alt={variant.name}
                                className="h-10 w-10 rounded-lg object-cover border"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{variant.name || `Variante ${idx + 1}`}</span>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {variant.sku || '-'}
                            </code>
                          </TableCell>
                          {attributeTypes.map(attr => (
                            <TableCell key={attr}>
                              {variant.attributes?.[attr] ? (
                                <Badge variant="outline" className="text-xs">
                                  {variant.attributes[attr]}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-medium">
                            {variant.price !== undefined && variant.price > 0 
                              ? formatCurrency(variant.price)
                              : formatCurrency(basePrice)
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={
                                (variant.stock_quantity || 0) <= 0 ? 'destructive' :
                                (variant.stock_quantity || 0) < 10 ? 'secondary' : 'default'
                              }
                            >
                              {variant.stock_quantity ?? 0}
                            </Badge>
                          </TableCell>
                          {isEditing && (
                            <TableCell>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => startEditing(idx, variant)}
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                {onDeleteVariant && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => onDeleteVariant(idx)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Layers className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-medium mb-2">Aucune variante</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ce produit n'a pas de variantes (tailles, couleurs, etc.)
              </p>
              {isEditing && onAddVariant && (
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Créer une variante
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Overview */}
      {variants.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Box className="h-4 w-4" />
              Résumé des stocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 text-center">
                <p className="text-2xl font-bold">
                  {variants.reduce((acc, v) => acc + (v.stock_quantity || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Stock total</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {variants.filter(v => (v.stock_quantity || 0) > 10).length}
                </p>
                <p className="text-xs text-muted-foreground">En stock</p>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {variants.filter(v => (v.stock_quantity || 0) <= 0).length}
                </p>
                <p className="text-xs text-muted-foreground">Rupture</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
