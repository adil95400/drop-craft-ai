import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { productionLogger } from '@/utils/productionLogger'

interface SupplierConnectionTestProps {
  supplierId: string
  supplierName: string
  credentials?: Record<string, any>
  onTestComplete?: (success: boolean) => void
}

export function SupplierConnectionTest({
  supplierId,
  supplierName,
  credentials,
  onTestComplete
}: SupplierConnectionTestProps) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      // Appeler edge function de test selon le fournisseur
      const { data, error } = await supabase.functions.invoke('supplier-test-connection', {
        body: {
          supplierId,
          credentials
        }
      })

      if (error) throw error

      const success = data?.success || false
      
      setTestResult({
        success,
        message: success 
          ? `✅ Connexion réussie à ${supplierName}` 
          : `❌ Échec de connexion à ${supplierName}`,
        details: data
      })

      toast[success ? 'success' : 'error'](
        success 
          ? `Connexion établie avec ${supplierName}` 
          : `Impossible de se connecter à ${supplierName}`
      )

      onTestComplete?.(success)

    } catch (error: any) {
      productionLogger.error('Connection test failed', error as Error, 'SupplierConnectionTest');
      
      setTestResult({
        success: false,
        message: `❌ Erreur de test pour ${supplierName}`,
        details: { error: error.message }
      })

      toast.error(`Erreur lors du test de connexion: ${error.message}`)
      onTestComplete?.(false)

    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Test Button */}
        <Button 
          onClick={testConnection} 
          disabled={testing}
          className="w-full"
          variant="outline"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Test en cours...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Tester la connexion
            </>
          )}
        </Button>

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{testResult.message}</p>
                  
                  {testResult.details && (
                    <div className="text-xs space-y-1">
                      {testResult.details.apiVersion && (
                        <p>Version API: {testResult.details.apiVersion}</p>
                      )}
                      {testResult.details.productsCount !== undefined && (
                        <p>Produits disponibles: {testResult.details.productsCount}</p>
                      )}
                      {testResult.details.error && (
                        <p className="text-red-600">Erreur: {testResult.details.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Status Badge */}
        <div className="flex justify-center">
          {testResult && (
            <Badge variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? 'Connexion active ✓' : 'Connexion échouée ✗'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
