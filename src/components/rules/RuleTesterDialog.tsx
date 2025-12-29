import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ProductRule } from '@/lib/rules/ruleTypes'
import { TestTube, Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface RuleTesterDialogProps {
  rule: ProductRule
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TestResult {
  productId: string
  productName: string
  matched: boolean
  changes: { field: string; before: any; after: any }[]
}

export function RuleTesterDialog({ rule, open, onOpenChange }: RuleTesterDialogProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [hasRun, setHasRun] = useState(false)

  const runTest = async () => {
    setIsRunning(true)
    setResults([])
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Récupérer quelques produits pour tester
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, description, price, category, brand, stock_quantity, sku')
        .eq('user_id', user.id)
        .limit(10)

      if (error) throw error

      // Simuler le test de la règle
      const testResults: TestResult[] = (products || []).map(product => {
        const condition = rule.conditionGroup?.conditions?.[0]
        const action = rule.actions?.[0]
        
        let matched = false
        const changes: { field: string; before: any; after: any }[] = []

        if (condition) {
          const fieldValue = (product as any)[condition.field] || ''
          
          switch (condition.operator) {
            case 'contains':
              matched = String(fieldValue).toLowerCase().includes(String(condition.value || '').toLowerCase())
              break
            case 'not_contains':
              matched = !String(fieldValue).toLowerCase().includes(String(condition.value || '').toLowerCase())
              break
            case 'empty':
              matched = !fieldValue || fieldValue === ''
              break
            case 'not_empty':
              matched = !!fieldValue && fieldValue !== ''
              break
            case 'eq':
              matched = fieldValue === condition.value
              break
            case 'ne':
              matched = fieldValue !== condition.value
              break
            case 'gt':
              matched = Number(fieldValue) > Number(condition.value)
              break
            case 'lt':
              matched = Number(fieldValue) < Number(condition.value)
              break
            default:
              matched = false
          }
        }

        if (matched && action) {
          const beforeValue = (product as any)[action.field] || ''
          let afterValue = beforeValue

          switch (action.type) {
            case 'set_field':
              afterValue = action.value
              break
            case 'append_text':
              afterValue = `${beforeValue} ${action.value}`
              break
            case 'prepend_text':
              afterValue = `${action.value} ${beforeValue}`
              break
            case 'uppercase':
              afterValue = String(beforeValue).toUpperCase()
              break
            case 'lowercase':
              afterValue = String(beforeValue).toLowerCase()
              break
            case 'add_tag':
              afterValue = `${beforeValue},${action.value}`.replace(/^,/, '')
              break
            default:
              afterValue = action.value || beforeValue
          }

          if (beforeValue !== afterValue) {
            changes.push({
              field: action.field,
              before: beforeValue,
              after: afterValue
            })
          }
        }

        return {
          productId: product.id,
          productName: product.name,
          matched,
          changes
        }
      })

      setResults(testResults)
      setHasRun(true)

      const matchedCount = testResults.filter(r => r.matched).length
      toast.success(`Test terminé: ${matchedCount}/${testResults.length} produits correspondent`)
    } catch (error) {
      console.error('Error running test:', error)
      toast.error('Erreur lors du test')
    } finally {
      setIsRunning(false)
    }
  }

  const matchedResults = results.filter(r => r.matched)
  const unmatchedResults = results.filter(r => !r.matched)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-info" />
            Tester la règle: {rule.name}
          </DialogTitle>
          <DialogDescription>
            Testez cette règle sur vos produits pour voir quels changements seraient appliqués
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Résumé de la règle */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">SI</Badge>
              <span className="text-sm">
                {rule.conditionGroup?.conditions?.[0]?.field}{' '}
                <strong>{rule.conditionGroup?.conditions?.[0]?.operator}</strong>{' '}
                "{rule.conditionGroup?.conditions?.[0]?.value || ''}"
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">ALORS</Badge>
              <span className="text-sm">
                {rule.actions?.[0]?.type} sur{' '}
                <strong>{rule.actions?.[0]?.field}</strong>
                {rule.actions?.[0]?.value && ` → "${rule.actions[0].value}"`}
              </span>
            </div>
          </div>

          {/* Bouton de test */}
          <Button 
            onClick={runTest} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Lancer le test (10 premiers produits)
              </>
            )}
          </Button>

          {/* Résultats */}
          {hasRun && (
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {/* Produits qui correspondent */}
                {matchedResults.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Produits correspondants ({matchedResults.length})
                    </h4>
                    <div className="space-y-2">
                      {matchedResults.map(result => (
                        <Alert key={result.productId} className="py-2">
                          <AlertDescription>
                            <div className="font-medium">{result.productName}</div>
                            {result.changes.length > 0 && (
                              <div className="text-xs mt-1 space-y-1">
                                {result.changes.map((change, i) => (
                                  <div key={i} className="text-muted-foreground">
                                    {change.field}: "{String(change.before).substring(0, 30)}..." → "{String(change.after).substring(0, 30)}..."
                                  </div>
                                ))}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Produits qui ne correspondent pas */}
                {unmatchedResults.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2 text-muted-foreground">
                      <XCircle className="h-4 w-4" />
                      Ne correspondent pas ({unmatchedResults.length})
                    </h4>
                    <div className="space-y-1">
                      {unmatchedResults.slice(0, 5).map(result => (
                        <div key={result.productId} className="text-sm text-muted-foreground">
                          • {result.productName}
                        </div>
                      ))}
                      {unmatchedResults.length > 5 && (
                        <div className="text-sm text-muted-foreground">
                          ...et {unmatchedResults.length - 5} autres
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {results.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Aucun produit trouvé à tester
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
