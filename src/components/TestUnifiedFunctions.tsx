import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, CheckCircle, XCircle, Zap, ShoppingCart, Brain, Settings, Package } from 'lucide-react'
import { logAction, logError } from '@/utils/consoleCleanup'

export function TestUnifiedFunctions() {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, any>>({})
  const { toast } = useToast()

  const testFunction = async (functionName: string, endpoint: string, testData: any) => {
    setLoading(functionName)
    try {
      logAction(`Testing ${functionName}/${endpoint}`, testData)
      
      const response = await fetch(
        `/.netlify/functions/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData),
        }
      )
      
      const result = await response.json()
      setResults(prev => ({ ...prev, [functionName]: result }))
    } catch (error) {
      logError(error as Error, `Test failed for ${functionName}`)
      
      setResults(prev => ({
        ...prev,
        [`${functionName}-${endpoint}`]: { success: false, error: error.message }
      }))

      toast({
        title: "Test échoué",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(null)
    }
  }

  const tests = [
    {
      category: "Intégrations",
      icon: <Package className="w-5 h-5" />,
      color: "bg-blue-500",
      tests: [
        {
          name: "unified-integrations",
          endpoint: "shopify",
          label: "Test Shopify",
          data: { action: "sync", shop: "test-shop" }
        },
        {
          name: "unified-integrations",
          endpoint: "aliexpress",
          label: "Test AliExpress", 
          data: { action: "import", products: ["test"] }
        }
      ]
    },
    {
      category: "Paiements",
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "bg-green-500",
      tests: [
        {
          name: "unified-payments",
          endpoint: "create-checkout",
          label: "Créer Checkout",
          data: { amount: 100, currency: "EUR" }
        },
        {
          name: "unified-payments",
          endpoint: "stripe-checkout", 
          label: "Test Stripe",
          data: { items: [{ price: "price_test", quantity: 1 }] }
        }
      ]
    },
    {
      category: "Intelligence Artificielle",
      icon: <Brain className="w-5 h-5" />,
      color: "bg-purple-500", 
      tests: [
        {
          name: "unified-ai",
          endpoint: "optimizer",
          label: "AI Optimizer",
          data: { type: "product_optimization", products: ["test"] }
        },
        {
          name: "unified-ai",
          endpoint: "automation",
          label: "AI Automation",
          data: { type: "workflow", trigger: "test" }
        }
      ]
    },
    {
      category: "Gestion",
      icon: <Settings className="w-5 h-5" />,
      color: "bg-orange-500",
      tests: [
        {
          name: "unified-management",
          endpoint: "cli-manager",
          label: "CLI Manager", 
          data: { command: "status" }
        },
        {
          name: "unified-management",
          endpoint: "secure-credentials",
          label: "Sécurité",
          data: { type: "api_key", action: "encrypt" }
        }
      ]
    },
    {
      category: "Import",
      icon: <Zap className="w-5 h-5" />,
      color: "bg-red-500",
      tests: [
        {
          name: "unified-import",
          endpoint: "xml-json",
          label: "Import XML/JSON",
          data: { format: "json", url: "https://example.com/data.json" }
        },
        {
          name: "unified-import", 
          endpoint: "ftp",
          label: "Import FTP",
          data: { server: "ftp.example.com", path: "/data" }
        }
      ]
    }
  ]

  const getResultStatus = (functionName: string, endpoint: string) => {
    const key = `${functionName}-${endpoint}`
    const result = results[key]
    if (!result) return null
    return result.success ? 'success' : 'error'
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Test des Fonctions Unifiées</h1>
        <p className="text-muted-foreground">
          Testez les nouvelles fonctions Edge consolidées pour vérifier leur bon fonctionnement
        </p>
      </div>

      <div className="space-y-6">
        {tests.map((category) => (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${category.color} text-white`}>
                  {category.icon}
                </div>
                {category.category}
              </CardTitle>
              <CardDescription>
                Tests pour les fonctions de {category.category.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.tests.map((test) => {
                  const isLoading = loading === test.name
                  const status = getResultStatus(test.name, test.endpoint)
                  
                  return (
                    <div key={`${test.name}-${test.endpoint}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                          {!status && <div className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{test.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {test.name}/{test.endpoint}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => testFunction(test.name, test.endpoint, test.data)}
                        disabled={isLoading}
                      >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        {isLoading ? 'Test...' : 'Tester'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(results).length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Résultats des Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(results).map(([key, result]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">{key}</span>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "Succès" : "Échec"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}