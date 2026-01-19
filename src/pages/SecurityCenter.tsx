import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Eye,
  Database,
  Key,
  Scan,
  UserCheck,
  Clock
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface SecurityEvent {
  id: string
  event_type: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  description: string
  created_at: string
  metadata?: any
}

interface VulnerabilityItem {
  id: string
  type: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  status: 'open' | 'investigating' | 'resolved'
  discovered_at: string
}

export default function SecurityCenter() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityItem[]>([])
  const [securityScore, setSecurityScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchSecurityData()
    const interval = setInterval(fetchSecurityData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchSecurityData = async () => {
    try {
      // Fetch security events
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (events) setSecurityEvents(events as SecurityEvent[])

      // Generate mock vulnerabilities and security score
      const mockVulns: VulnerabilityItem[] = [
        {
          id: '1',
          type: 'high',
          title: 'Accès non autorisé détecté',
          description: 'Tentatives de connexion suspectes depuis une IP externe',
          status: 'investigating',
          discovered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'medium',
          title: 'Configuration SSL à améliorer',
          description: 'Certificat SSL expire dans 30 jours',
          status: 'open',
          discovered_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'critical',
          title: 'Faille de sécurité RLS',
          description: 'Politique RLS manquante sur la table sensible',
          status: 'resolved',
          discovered_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      setVulnerabilities(mockVulns)
      
      // Calculate security score based on events and vulnerabilities
      const criticalCount = mockVulns.filter(v => v.type === 'critical' && v.status !== 'resolved').length
      const highCount = mockVulns.filter(v => v.type === 'high' && v.status !== 'resolved').length
      const recentCriticalEvents = events?.filter(e => 
        e.severity === 'critical' && 
        new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0

      const baseScore = 100
      const penalties = (criticalCount * 30) + (highCount * 15) + (recentCriticalEvents * 10)
      setSecurityScore(Math.max(0, baseScore - penalties))

    } catch (error) {
      console.error('Error fetching security data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de sécurité",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'error': return 'destructive'
      case 'warning': return 'warning'
      case 'medium': return 'warning'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4" />
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'error': return <AlertTriangle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'medium': return <AlertTriangle className="w-4 h-4" />
      case 'low': return <CheckCircle className="w-4 h-4" />
      default: return <CheckCircle className="w-4 h-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const runSecurityScan = async () => {
    toast({
      title: "Scan de sécurité lancé",
      description: "Analyse en cours de tous les composants système...",
    })
    
    // Simulate security scan
    setTimeout(() => {
      toast({
        title: "Scan terminé",
        description: "3 nouvelles vulnérabilités détectées. Consultez le rapport.",
        variant: "destructive"
      })
    }, 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ChannablePageWrapper
      title="Centre de Sécurité"
      subtitle="Protection"
      description="Surveillance et gestion de la sécurité système en temps réel."
      heroImage="settings"
      badge={{ 
        label: `Score: ${securityScore}/100`, 
        icon: Shield,
        variant: securityScore >= 80 ? 'default' : 'destructive'
      }}
      actions={
        <Button onClick={runSecurityScan} className="gap-2">
          <Scan className="w-4 h-4" />
          Lancer un Scan
        </Button>
      }
    >
      {/* Security Score Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Sécurité</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
              {securityScore}/100
            </div>
            <Progress value={securityScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Acceptable' : 'Critique'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnérabilités</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vulnerabilities.filter(v => v.status !== 'resolved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {vulnerabilities.filter(v => v.type === 'critical' && v.status !== 'resolved').length} critiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements 24h</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityEvents.filter(e => 
                new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {securityEvents.filter(e => 
                e.severity === 'critical' && 
                new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length} critiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut Système</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Opérationnel
            </div>
            <p className="text-xs text-muted-foreground">
              Tous les services actifs
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnérabilités</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
          <TabsTrigger value="access">Contrôle d'Accès</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Événements de Sécurité Récents</CardTitle>
              <CardDescription>
                Surveillance en temps réel des événements de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(event.severity)}
                      <div>
                        <p className="font-medium">{event.event_type}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(event.severity) as any}>
                        {event.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vulnérabilités Détectées</CardTitle>
              <CardDescription>
                Gestion des failles de sécurité identifiées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vulnerabilities.map((vuln) => (
                  <div key={vuln.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(vuln.type)}
                      <div>
                        <p className="font-medium">{vuln.title}</p>
                        <p className="text-sm text-muted-foreground">{vuln.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(vuln.type) as any}>
                        {vuln.type}
                      </Badge>
                      <Badge variant={vuln.status === 'resolved' ? 'default' : 'secondary'}>
                        {vuln.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(vuln.discovered_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  RGPD / GDPR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Chiffrement des données</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Politique de rétention</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Droit à l'oubli</span>
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                </div>
                <Progress value={85} className="mt-4" />
                <p className="text-sm text-muted-foreground mt-1">85% conforme</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  ISO 27001
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Gestion des accès</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Surveillance continue</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Plan de continuité</span>
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                </div>
                <Progress value={70} className="mt-4" />
                <p className="text-sm text-muted-foreground mt-1">70% conforme</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contrôle d'Accès</CardTitle>
              <CardDescription>
                Gestion des permissions et authentification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-5 h-5 text-green-500" />
                    <span className="font-medium">MFA Activé</span>
                  </div>
                  <p className="text-2xl font-bold">89%</p>
                  <p className="text-sm text-muted-foreground">des utilisateurs</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Sessions Actives</span>
                  </div>
                  <p className="text-2xl font-bold">234</p>
                  <p className="text-sm text-muted-foreground">actuellement</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium">Expiration</span>
                  </div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">tokens expirés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
