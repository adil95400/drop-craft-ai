import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { ProductRule, ProductRuleCondition, RuleExecutionResult } from '@/lib/rules/ruleTypes'
import { Play, CheckCircle2, XCircle, AlertCircle, ChevronRight, ArrowRight, Loader2 } from 'lucide-react'

interface RuleTesterDialogProps {
  rule: ProductRule
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TestProduct {
  id: string
  name: string
  description: string
  price: number
  compare_at_price: number
  stock_quantity: number
  category: string
  brand: string
  sku: string
  tags: string[]
  audit_score_global: number
}

const SAMPLE_PRODUCTS: TestProduct[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max Case Ultra Protection avec Support Béquille Antichoc et Porte-Cartes Intégré pour Apple',
    description: 'Coque premium',
    price: 29.99,
    compare_at_price: 39.99,
    stock_quantity: 45,
    category: 'Accessoires Téléphone',
    brand: 'TechCase',
    sku: 'IP15-CASE-001',
    tags: ['iphone', 'case', 'protection'],
    audit_score_global: 72
  },
  {
    id: '2',
    name: 'Câble USB-C',
    description: '',
    price: 12.99,
    compare_at_price: 0,
    stock_quantity: 5,
    category: 'Câbles',
    brand: 'NoCable',
    sku: 'USB-C-002',
    tags: ['cable', 'usb'],
    audit_score_global: 35
  },
  {
    id: '3',
    name: 'Casque Bluetooth Pro',
    description: 'Casque sans fil avec réduction de bruit active, autonomie 30h, qualité audio Hi-Fi',
    price: 89.99,
    compare_at_price: 129.99,
    stock_quantity: 120,
    category: 'Audio',
    brand: 'SoundMax',
    sku: 'BT-HEAD-003',
    tags: ['audio', 'bluetooth', 'premium'],
    audit_score_global: 88
  }
]

function evaluateCondition(condition: ProductRuleCondition, product: TestProduct): boolean {
  const fieldValue = product[condition.field as keyof TestProduct]
  const condValue = condition.value

  switch (condition.operator) {
    case 'eq':
      return fieldValue == condValue
    case 'ne':
      return fieldValue != condValue
    case 'gt':
      return Number(fieldValue) > Number(condValue)
    case 'ge':
      return Number(fieldValue) >= Number(condValue)
    case 'lt':
      return Number(fieldValue) < Number(condValue)
    case 'le':
      return Number(fieldValue) <= Number(condValue)
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(condValue).toLowerCase())
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(condValue).toLowerCase())
    case 'starts_with':
      return String(fieldValue).toLowerCase().startsWith(String(condValue).toLowerCase())
    case 'ends_with':
      return String(fieldValue).toLowerCase().endsWith(String(condValue).toLowerCase())
    case 'empty':
      return !fieldValue || (Array.isArray(fieldValue) ? fieldValue.length === 0 : String(fieldValue).trim() === '')
    case 'not_empty':
      return !!fieldValue && (Array.isArray(fieldValue) ? fieldValue.length > 0 : String(fieldValue).trim() !== '')
    case 'length_gt':
      return String(fieldValue).length > Number(condValue)
    case 'length_lt':
      return String(fieldValue).length < Number(condValue)
    default:
      return false
  }
}

function evaluateRule(rule: ProductRule, product: TestProduct): { matches: boolean; conditionResults: { condition: ProductRuleCondition; result: boolean }[] } {
  const conditionResults = rule.conditionGroup.conditions.map(condition => ({
    condition,
    result: evaluateCondition(condition, product)
  }))

  const matches = rule.conditionGroup.logic === 'AND'
    ? conditionResults.every(r => r.result)
    : conditionResults.some(r => r.result)

  return { matches, conditionResults }
}

export function RuleTesterDialog({ rule, open, onOpenChange }: RuleTesterDialogProps) {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<Map<string, { matches: boolean; conditionResults: { condition: ProductRuleCondition; result: boolean }[] }>>(new Map())
  const [customProduct, setCustomProduct] = useState<Partial<TestProduct>>({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0
  })

  const runTest = async () => {
    setIsRunning(true)
    setResults(new Map())
    
    // Simulate async processing
    await new Promise(resolve => setTimeout(resolve, 500))

    const newResults = new Map<string, { matches: boolean; conditionResults: { condition: ProductRuleCondition; result: boolean }[] }>()
    
    for (const product of SAMPLE_PRODUCTS) {
      const result = evaluateRule(rule, product)
      newResults.set(product.id, result)
    }

    setResults(newResults)
    setIsRunning(false)

    const matchCount = Array.from(newResults.values()).filter(r => r.matches).length
    toast({
      title: "Test terminé",
      description: `${matchCount}/${SAMPLE_PRODUCTS.length} produits correspondent aux conditions`
    })
  }

  const getOperatorLabel = (op: string) => {
    const labels: Record<string, string> = {
      eq: '=', ne: '≠', gt: '>', ge: '≥', lt: '<', le: '≤',
      contains: 'contient', not_contains: 'ne contient pas',
      starts_with: 'commence par', ends_with: 'finit par',
      empty: 'est vide', not_empty: 'n\'est pas vide',
      length_gt: 'longueur >', length_lt: 'longueur <'
    }
    return labels[op] || op
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Tester la règle: {rule.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rule Summary */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Résumé de la règle</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">SI</Badge>
                  {rule.conditionGroup.conditions.map((cond, idx) => (
                    <div key={cond.id} className="flex items-center gap-1">
                      {idx > 0 && <Badge variant="secondary" className="text-xs">{rule.conditionGroup.logic}</Badge>}
                      <span className="bg-muted px-2 py-0.5 rounded text-xs">
                        {cond.field} {getOperatorLabel(cond.operator)} {cond.value || ''}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">ALORS</Badge>
                  {rule.actions.map((action, idx) => (
                    <span key={action.id} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                      {action.type} → {action.field}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Run Test Button */}
          <Button onClick={runTest} disabled={isRunning} className="w-full">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Lancer le test sur {SAMPLE_PRODUCTS.length} produits
              </>
            )}
          </Button>

          {/* Results */}
          {results.size > 0 && (
            <ScrollArea className="h-[350px] border rounded-lg">
              <div className="p-4 space-y-3">
                {SAMPLE_PRODUCTS.map((product) => {
                  const result = results.get(product.id)
                  if (!result) return null

                  return (
                    <Card key={product.id} className={result.matches ? 'border-green-500' : 'border-muted'}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {result.matches ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                              <span className="font-medium truncate max-w-md">{product.name}</span>
                            </div>
                            
                            <div className="mt-2 text-xs text-muted-foreground space-y-1">
                              <div className="flex flex-wrap gap-2">
                                <span>Prix: {product.price}€</span>
                                <span>•</span>
                                <span>Stock: {product.stock_quantity}</span>
                                <span>•</span>
                                <span>Score: {product.audit_score_global}</span>
                              </div>
                              
                              {/* Condition results */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {result.conditionResults.map((cr, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant={cr.result ? 'default' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {cr.condition.field} {getOperatorLabel(cr.condition.operator)} {cr.condition.value || '∅'}
                                    {cr.result ? ' ✓' : ' ✗'}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {result.matches && (
                            <div className="text-right">
                              <Badge className="bg-green-500">Match</Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {rule.actions.length} action(s) applicables
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Show what would be applied */}
                        {result.matches && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium mb-2">Actions qui seraient appliquées:</p>
                            <div className="space-y-1">
                              {rule.actions.map((action) => (
                                <div key={action.id} className="flex items-center gap-2 text-xs bg-muted rounded p-2">
                                  <ArrowRight className="h-3 w-3 text-primary" />
                                  <span className="font-medium">{action.type}</span>
                                  <span>sur</span>
                                  <code className="bg-background px-1 rounded">{action.field}</code>
                                  {action.value && (
                                    <>
                                      <span>=</span>
                                      <code className="bg-background px-1 rounded text-primary">{action.value}</code>
                                    </>
                                  )}
                                  {action.aiPrompt && (
                                    <span className="text-purple-500">(IA: {action.aiPrompt.slice(0, 30)}...)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {/* Stats */}
          {results.size > 0 && (
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{Array.from(results.values()).filter(r => r.matches).length} matchs</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span>{Array.from(results.values()).filter(r => !r.matches).length} non-matchs</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
