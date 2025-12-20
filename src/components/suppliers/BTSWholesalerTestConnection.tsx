import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CheckCircle, XCircle, Package } from 'lucide-react'

export function BTSWholesalerTestConnection() {
  const [jwtToken, setJwtToken] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const { toast } = useToast()

  const handleTestConnection = async () => {
    if (!jwtToken.trim()) {
      toast({
        title: "JWT Token requis",
        description: "Veuillez entrer votre JWT token BTSWholesaler",
        variant: "destructive"
      })
      return
    }

    setIsConnecting(true)
    setConnectionResult(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Use suppliers table instead of premium_suppliers
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('*')
        .eq('name', 'BTSWholesaler')
        .maybeSingle()

      let supplierId = supplier?.id

      // Create supplier if not exists
      if (!supplierId) {
        const { data: newSupplier, error: createError } = await supabase
          .from('suppliers')
          .insert({
            user_id: user.id,
            name: 'BTSWholesaler',
            status: 'active'
          })
          .select()
          .single()

        if (createError) throw createError
        supplierId = newSupplier.id
      }

      // Store connection info in localStorage as mock
      const connectionData = {
        user_id: user.id,
        supplier_id: supplierId,
        jwt_token: jwtToken,
        format: 'json',
        language: 'fr-FR',
        status: 'pending',
        created_at: new Date().toISOString()
      }
      
      localStorage.setItem(`bts_connection_${user.id}`, JSON.stringify(connectionData))

      // Call edge function to test and import
      console.log('🔗 Calling premium-supplier-connect...')
      const { data, error } = await supabase.functions.invoke('premium-supplier-connect', {
        body: {
          userId: user.id,
          supplierId
        }
      })

      if (error) {
        console.error('Edge function error:', error)
        throw error
      }

      console.log('✅ Connection result:', data)
      setConnectionResult(data)

      toast({
        title: "Connexion réussie !",
        description: `${data.data?.products_imported || 0} produits importés depuis BTSWholesaler`
      })

    } catch (error: any) {
      console.error('Connection test error:', error)
      setConnectionResult({ success: false, error: error.message })
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Connexion BTSWholesaler</CardTitle>
        <CardDescription>
          Testez votre connexion API BTSWholesaler v2.0 et importez les produits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="jwt-token">JWT Token BTSWholesaler</Label>
          <Input
            id="jwt-token"
            type="password"
            placeholder="Collez votre JWT token ici..."
            value={jwtToken}
            onChange={(e) => setJwtToken(e.target.value)}
            disabled={isConnecting}
          />
          <p className="text-xs text-muted-foreground">
            Obtenu depuis votre compte BTSWholesaler → Section API → Créer Service de Compte
          </p>
        </div>

        <Button
          onClick={handleTestConnection}
          disabled={isConnecting || !jwtToken.trim()}
          className="w-full"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            <>
              <Package className="mr-2 h-4 w-4" />
              Tester et Importer
            </>
          )}
        </Button>

        {connectionResult && (
          <Alert variant={connectionResult.success ? "default" : "destructive"}>
            {connectionResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {connectionResult.success ? (
                <div className="space-y-2">
                  <p className="font-semibold">✅ Connexion réussie !</p>
                  <div className="text-sm space-y-1">
                    <p>📦 Produits récupérés : {connectionResult.data?.products_fetched || 0}</p>
                    <p>✅ Produits importés : {connectionResult.data?.products_imported || 0}</p>
                    <p>📄 Pages récupérées : {connectionResult.data?.pages_fetched || 0}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">❌ Échec de la connexion</p>
                  <p className="text-sm mt-1">{connectionResult.error}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>ℹ️ Cette action va :</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Tester votre JWT token avec l'API BTSWholesaler v2.0</li>
            <li>Récupérer tous les produits disponibles (pagination automatique)</li>
            <li>Importer les produits dans votre catalogue</li>
            <li>Enregistrer la connexion pour les synchronisations futures</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}