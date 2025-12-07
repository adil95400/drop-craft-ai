/**
 * Validateur de pré-publication
 * Vérifie les produits avant publication avec scoring et suggestions
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  PlayCircle,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  FileText,
  DollarSign,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ValidationIssue {
  field: string
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestion?: string
  autoFix?: boolean
}

interface ProductValidation {
  productId: string
  productName: string
  imageUrl?: string
  score: number
  issues: ValidationIssue[]
  status: 'pending' | 'valid' | 'warning' | 'error'
}

interface PrePublicationValidatorProps {
  products?: Array<{
    id: string
    title: string
    description?: string
    price?: number
    image_url?: string
    sku?: string
    category?: string
  }>
  onValidate?: (results: ProductValidation[]) => void
  onPublish?: (productIds: string[]) => void
}

export function PrePublicationValidator({ 
  products = [], 
  onValidate,
  onPublish 
}: PrePublicationValidatorProps) {
  const [validations, setValidations] = useState<ProductValidation[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [progress, setProgress] = useState(0)

  // Demo products if none provided
  const productList = products.length > 0 ? products : [
    { id: '1', title: 'Produit Demo 1', description: 'Description courte', price: 29.99, image_url: '', sku: 'DEMO-001', category: 'Electronics' },
    { id: '2', title: 'Produit avec titre correct et optimisé SEO', description: 'Cette description est assez longue pour passer la validation et contient des informations utiles pour les clients.', price: 49.99, image_url: 'https://example.com/img.jpg', sku: 'DEMO-002', category: 'Fashion' },
    { id: '3', title: 'Test', description: '', price: 0, image_url: '', sku: '', category: '' },
  ]

  const validateProduct = (product: typeof productList[0]): ProductValidation => {
    const issues: ValidationIssue[] = []
    let score = 100

    // Title validation
    if (!product.title || product.title.length < 10) {
      issues.push({
        field: 'title',
        severity: 'error',
        message: 'Titre trop court (min. 10 caractères)',
        suggestion: 'Ajoutez un titre descriptif avec les mots-clés principaux',
        autoFix: false
      })
      score -= 25
    } else if (product.title.length < 30) {
      issues.push({
        field: 'title',
        severity: 'warning',
        message: 'Titre pourrait être plus détaillé',
        suggestion: 'Un titre de 50-80 caractères optimise le SEO',
        autoFix: true
      })
      score -= 10
    }

    // Description validation
    if (!product.description || product.description.length < 50) {
      issues.push({
        field: 'description',
        severity: 'error',
        message: 'Description manquante ou trop courte',
        suggestion: 'Ajoutez une description détaillée de 150+ mots',
        autoFix: true
      })
      score -= 20
    }

    // Price validation
    if (!product.price || product.price <= 0) {
      issues.push({
        field: 'price',
        severity: 'error',
        message: 'Prix invalide ou manquant',
        suggestion: 'Définissez un prix de vente valide',
        autoFix: false
      })
      score -= 30
    }

    // Image validation
    if (!product.image_url) {
      issues.push({
        field: 'image',
        severity: 'error',
        message: 'Image principale manquante',
        suggestion: 'Ajoutez au moins une image de produit de haute qualité',
        autoFix: false
      })
      score -= 25
    }

    // SKU validation
    if (!product.sku) {
      issues.push({
        field: 'sku',
        severity: 'warning',
        message: 'SKU non défini',
        suggestion: 'Un SKU unique facilite la gestion des stocks',
        autoFix: true
      })
      score -= 5
    }

    // Category validation
    if (!product.category) {
      issues.push({
        field: 'category',
        severity: 'warning',
        message: 'Catégorie non définie',
        suggestion: 'Catégorisez le produit pour améliorer la navigation',
        autoFix: true
      })
      score -= 5
    }

    const status = score >= 80 ? 'valid' : score >= 60 ? 'warning' : 'error'

    return {
      productId: product.id,
      productName: product.title || 'Sans titre',
      imageUrl: product.image_url,
      score: Math.max(0, score),
      issues,
      status
    }
  }

  const runValidation = async () => {
    setIsValidating(true)
    setProgress(0)
    const results: ProductValidation[] = []

    for (let i = 0; i < productList.length; i++) {
      await new Promise(r => setTimeout(r, 50)) // Simulate processing
      const validation = validateProduct(productList[i])
      results.push(validation)
      setProgress(Math.round(((i + 1) / productList.length) * 100))
    }

    setValidations(results)
    setIsValidating(false)
    onValidate?.(results)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(validations.filter(v => v.status !== 'error').map(v => v.productId))
    } else {
      setSelectedIds([])
    }
  }

  const handlePublish = () => {
    if (selectedIds.length > 0) {
      onPublish?.(selectedIds)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (status: ProductValidation['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const validCount = validations.filter(v => v.status === 'valid').length
  const warningCount = validations.filter(v => v.status === 'warning').length
  const errorCount = validations.filter(v => v.status === 'error').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Validation Pré-Publication
            </CardTitle>
            <CardDescription>
              Vérifiez vos {products.length} produits avant publication
            </CardDescription>
          </div>
          <Button 
            onClick={runValidation}
            disabled={isValidating || products.length === 0}
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            {isValidating ? 'Validation...' : 'Lancer la validation'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        {isValidating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Validation en cours... {progress}%
            </p>
          </div>
        )}

        {/* Summary */}
        {validations.length > 0 && !isValidating && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{validCount}</p>
                <p className="text-xs text-muted-foreground">Prêts</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
                <p className="text-xs text-muted-foreground">Avertissements</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                <p className="text-xs text-muted-foreground">Erreurs</p>
              </div>
            </div>

            {/* Product List */}
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedIds.length === validations.filter(v => v.status !== 'error').length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedIds.length} sélectionné(s)
                </span>
              </div>
              <Button 
                onClick={handlePublish}
                disabled={selectedIds.length === 0}
                size="sm"
              >
                Publier la sélection
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {validations.map((validation) => (
                  <div 
                    key={validation.productId}
                    className={cn(
                      "p-3 rounded-lg border",
                      validation.status === 'error' && "border-red-200 bg-red-50/50 dark:bg-red-950/10",
                      validation.status === 'warning' && "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10",
                      validation.status === 'valid' && "border-green-200 bg-green-50/50 dark:bg-green-950/10"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={selectedIds.includes(validation.productId)}
                        disabled={validation.status === 'error'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds([...selectedIds, validation.productId])
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== validation.productId))
                          }
                        }}
                      />
                      
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                        {validation.imageUrl ? (
                          <img 
                            src={validation.imageUrl} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(validation.status)}
                          <span className="font-medium text-sm truncate">
                            {validation.productName}
                          </span>
                          <span className={cn("text-sm font-bold ml-auto", getScoreColor(validation.score))}>
                            {validation.score}%
                          </span>
                        </div>

                        {validation.issues.length > 0 && (
                          <div className="space-y-1 mt-2">
                            {validation.issues.slice(0, 3).map((issue, i) => (
                              <div 
                                key={i}
                                className="flex items-start gap-2 text-xs"
                              >
                                <Badge 
                                  variant={issue.severity === 'error' ? 'destructive' : 'outline'}
                                  className="text-[10px] px-1"
                                >
                                  {issue.field}
                                </Badge>
                                <span className="text-muted-foreground">{issue.message}</span>
                                {issue.autoFix && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-5 text-xs text-primary"
                                  >
                                    Auto-fix
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  )
}
