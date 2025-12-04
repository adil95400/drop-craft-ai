/**
 * SupplierSettingsPage - Configuration des fournisseurs et API
 */
import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { 
  Settings, Key, RefreshCw, CheckCircle, AlertTriangle, 
  Plus, Trash2, Eye, EyeOff, Clock, Loader2
} from 'lucide-react'

export default function SupplierSettingsPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  const { data: credentials, isLoading } = useQuery({
    queryKey: ['supplier-credentials'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data } = await supabase
        .from('supplier_credentials_vault')
        .select('*')
        .eq('user_id', user.id)

      return data || []
    }
  })

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <>
      <Helmet>
        <title>Paramètres Fournisseurs - ShopOpti</title>
      </Helmet>

      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Paramètres Fournisseurs
            </h1>
            <p className="text-muted-foreground">
              Gérez vos clés API et configurations
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une clé API
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Clés API Fournisseurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : credentials?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune clé API configurée
              </p>
            ) : (
              <div className="space-y-4">
                {credentials?.map((cred: any) => (
                  <div key={cred.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant={cred.connection_status === 'connected' ? 'default' : 'secondary'}>
                        {cred.connection_status === 'connected' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {cred.connection_status}
                      </Badge>
                      <div>
                        <p className="font-medium">{cred.supplier_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {showKeys[cred.id] ? cred.api_key : '••••••••••••'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleShowKey(cred.id)}
                      >
                        {showKeys[cred.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
