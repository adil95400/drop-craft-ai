import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
  duration?: number
}

const SUPPLIERS_TO_TEST = [
  { id: 'cj_dropshipping', name: 'CJ Dropshipping', function: 'supplier-sync-products' },
  { id: 'bigbuy', name: 'BigBuy', function: 'supplier-sync-products' },
  { id: 'matterhorn', name: 'Matterhorn', function: 'supplier-sync-products' },
  { id: 'bts_wholesaler', name: 'BTS Wholesaler', function: 'supplier-sync-products' }
]

export function SupplierIntegrationTest() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()

  async function runAllTests() {
    setIsRunning(true)
    setResults(SUPPLIERS_TO_TEST.map(s => ({ name: s.name, status: 'pending' })))

    for (let i = 0; i < SUPPLIERS_TO_TEST.length; i++) {
      const supplier = SUPPLIERS_TO_TEST[i]
      
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'running' } : r
      ))

      const startTime = Date.now()
      
      try {
        // Check credentials exist
        const { data: creds } = await supabase
          .from('supplier_credentials_vault')
          .select('id')
          .eq('supplier_id', supplier.id)
          .eq('connection_status', 'active')
          .single()

        if (!creds) {
          setResults(prev => prev.map((r, idx) => 
            idx === i ? { 
              ...r, 
              status: 'error', 
              message: 'Pas de credentials actifs',
              duration: Date.now() - startTime 
            } : r
          ))
          continue
        }

        // Test sync function
        const { data, error } = await supabase.functions.invoke(supplier.function, {
          body: { 
            supplier_id: supplier.id, 
            test_mode: true,
            limit: 1 
          }
        })

        if (error) throw error

        setResults(prev => prev.map((r, idx) => 
          idx === i ? { 
            ...r, 
            status: 'success', 
            message: `${data?.products_synced || 0} produits`,
            duration: Date.now() - startTime 
          } : r
        ))
      } catch (error: any) {
        setResults(prev => prev.map((r, idx) => 
          idx === i ? { 
            ...r, 
            status: 'error', 
            message: error.message?.slice(0, 50),
            duration: Date.now() - startTime 
          } : r
        ))
      }
    }

    setIsRunning(false)
    
    const successCount = results.filter(r => r.status === 'success').length
    toast({
      title: 'Tests terminés',
      description: `${successCount}/${SUPPLIERS_TO_TEST.length} fournisseurs OK`
    })
  }

  async function testSingleSupplier(supplierId: string) {
    const supplier = SUPPLIERS_TO_TEST.find(s => s.id === supplierId)
    if (!supplier) return

    const idx = SUPPLIERS_TO_TEST.findIndex(s => s.id === supplierId)
    
    setResults(prev => {
      const newResults = [...prev]
      if (newResults[idx]) {
        newResults[idx] = { ...newResults[idx], status: 'running' }
      } else {
        newResults[idx] = { name: supplier.name, status: 'running' }
      }
      return newResults
    })

    const startTime = Date.now()

    try {
      const { data, error } = await supabase.functions.invoke(supplier.function, {
        body: { supplier_id: supplierId, test_mode: true, limit: 5 }
      })

      if (error) throw error

      setResults(prev => prev.map((r, i) => 
        i === idx ? { 
          ...r, 
          status: 'success', 
          message: `${data?.products_synced || 0} produits synchronisés`,
          duration: Date.now() - startTime 
        } : r
      ))

      toast({ title: 'Test réussi', description: `${supplier.name} fonctionne correctement` })
    } catch (error: any) {
      setResults(prev => prev.map((r, i) => 
        i === idx ? { 
          ...r, 
          status: 'error', 
          message: error.message,
          duration: Date.now() - startTime 
        } : r
      ))

      toast({ 
        title: 'Test échoué', 
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Tests d'intégration fournisseurs</CardTitle>
        <Button onClick={runAllTests} disabled={isRunning}>
          {isRunning ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Lancer tous les tests
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {SUPPLIERS_TO_TEST.map((supplier, idx) => {
            const result = results[idx]
            
            return (
              <div 
                key={supplier.id} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {!result || result.status === 'pending' ? (
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                  ) : result.status === 'running' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : result.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  
                  <div>
                    <p className="font-medium">{supplier.name}</p>
                    {result?.message && (
                      <p className="text-xs text-muted-foreground">{result.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {result?.duration && (
                    <Badge variant="outline" className="text-xs">
                      {result.duration}ms
                    </Badge>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => testSingleSupplier(supplier.id)}
                    disabled={isRunning}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
