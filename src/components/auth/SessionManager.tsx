import { useState, useEffect } from 'react'
import { productionLogger } from '@/utils/productionLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  MapPin, 
  Clock, 
  LogOut,
  Shield,
  AlertTriangle
} from 'lucide-react'

interface UserSession {
  id: string
  device_info: {
    userAgent?: string
    platform?: string
    language?: string
    viewport?: string
    timezone?: string
  }
  ip_address: string
  location: any
  last_activity_at: string
  created_at: string
  is_active: boolean
}

export const SessionManager = () => {
  const { getUserSessions, revokeUserSessions, user } = useAuth()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const { data, error } = await getUserSessions()
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les sessions",
          variant: "destructive"
        })
      } else {
        setSessions(data || [])
      }
    } catch (error) {
      productionLogger.error('Failed to load sessions', error as Error, 'SessionManager');
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId)
    try {
      const { error } = await revokeUserSessions()
      if (!error) {
        setSessions(sessions.filter(s => s.id !== sessionId))
      }
    } catch (error) {
      productionLogger.error('Failed to revoke session', error as Error, 'SessionManager');
    } finally {
      setRevoking(null)
    }
  }

  const handleRevokeAllSessions = async () => {
    setRevoking('all')
    try {
      const { error } = await revokeUserSessions()
      if (!error) {
        setSessions([])
        toast({
          title: "Sessions révoquées",
          description: "Toutes vos sessions ont été révoquées. Vous allez être déconnecté.",
        })
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      productionLogger.error('Failed to revoke all sessions', error as Error, 'SessionManager');
    } finally {
      setRevoking(null)
    }
  }

  const getDeviceIcon = (userAgent: string = '') => {
    if (userAgent.includes('Mobile')) return <Smartphone className="h-4 w-4" />
    if (userAgent.includes('Tablet')) return <Tablet className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  const getDeviceName = (userAgent: string = '') => {
    if (userAgent.includes('iPhone')) return 'iPhone'
    if (userAgent.includes('iPad')) return 'iPad'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('Windows')) return 'Windows PC'
    if (userAgent.includes('Mac')) return 'Mac'
    if (userAgent.includes('Linux')) return 'Linux'
    return 'Appareil inconnu'
  }

  const getBrowserName = (userAgent: string = '') => {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Navigateur inconnu'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sessions Actives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sessions Actives
              </CardTitle>
              <CardDescription>
                Gérez vos connexions sur tous vos appareils
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeAllSessions}
              disabled={revoking === 'all' || sessions.length === 0}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnecter tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Aucune session active</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-full">
                      {getDeviceIcon(session.device_info?.userAgent)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {getDeviceName(session.device_info?.userAgent)}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {getBrowserName(session.device_info?.userAgent)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.ip_address}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(session.last_activity_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={revoking === session.id}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnecter
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}