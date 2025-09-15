import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserForceDisconnect } from './UserForceDisconnect'
import { useAuth } from '@/contexts/AuthContext'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, UserX, TestTube } from 'lucide-react'
import { toast } from 'sonner'

export const ForceDisconnectDemo = () => {
  const { user } = useAuth()
  const { isAdmin } = useEnhancedAuth()
  const [demoUserId, setDemoUserId] = useState('')

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Cette fonctionnalité est réservée aux administrateurs.
        </AlertDescription>
      </Alert>
    )
  }

  const testWithCurrentUser = () => {
    setDemoUserId(user?.id || '')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test de Déconnexion Forcée
        </CardTitle>
        <CardDescription>
          Testez la fonctionnalité de déconnexion forcée d'un utilisateur
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <UserX className="h-4 w-4" />
          <AlertDescription>
            <strong>Attention :</strong> Cette action déconnectera immédiatement l'utilisateur 
            de toutes ses sessions actives. Utilisez avec précaution.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Test rapide</h4>
            <Button 
              variant="outline" 
              onClick={testWithCurrentUser}
              className="mr-2"
            >
              Utiliser mon ID utilisateur
            </Button>
            <span className="text-sm text-muted-foreground">
              ID actuel: {user?.id?.slice(0, 8)}...
            </span>
          </div>

          <div>
            <h4 className="font-medium mb-2">Déconnexion forcée</h4>
            <UserForceDisconnect 
              userId={demoUserId}
              userEmail={user?.email}
              userName={user?.user_metadata?.full_name}
              onSuccess={() => {
                toast.success('Déconnexion forcée réussie')
                setDemoUserId('')
              }}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Informations de session</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">User ID:</span>
              <br />
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                {user?.id}
              </code>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <br />
              <span>{user?.email}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}