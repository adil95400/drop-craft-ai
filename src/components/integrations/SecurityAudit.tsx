import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  Key,
  Lock,
  Eye,
  EyeOff,
  Clock,
  Activity,
  Users,
  Globe,
  Server,
  Database,
  FileText,
  Download,
  RefreshCw,
  Zap,
  Settings,
  Search
} from "lucide-react"

export const SecurityAudit = () => {
  const [securityScore, setSecurityScore] = useState(85)
  const [auditResults, setAuditResults] = useState<any[]>([])
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [accessLogs, setAccessLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true)
      
      await Promise.all([
        fetchAuditResults(),
        fetchSecurityEvents(),
        fetchAccessLogs()
      ])
      
    } catch (error) {
      console.error('Error fetching security data:', error)
      toast({
        title: "Erreur de sécurité",
        description: "Impossible de récupérer les données de sécurité",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAuditResults = async () => {
    // Simulation des résultats d'audit sécurité
    const mockResults = [
      {
        id: 'encryption',
        category: 'Chiffrement',
        title: 'Chiffrement des données en transit',
        status: 'passed',
        severity: 'high',
        description: 'Toutes les connexions utilisent HTTPS/TLS',
        recommendation: null,
        lastCheck: new Date().toISOString()
      },
      {
        id: 'auth_tokens',
        category: 'Authentification',
        title: 'Gestion des tokens d\'accès',
        status: 'warning',
        severity: 'medium',
        description: 'Certains tokens n\'ont pas d\'expiration configurée',
        recommendation: 'Configurer une expiration automatique pour tous les tokens',
        lastCheck: new Date().toISOString()
      },
      {
        id: 'api_keys',
        category: 'API',
        title: 'Rotation des clés API',
        status: 'failed',
        severity: 'high',
        description: 'Des clés API n\'ont pas été renouvelées depuis plus de 90 jours',
        recommendation: 'Mettre en place une rotation automatique des clés API',
        lastCheck: new Date().toISOString()
      },
      {
        id: 'webhooks',
        category: 'Webhooks',
        title: 'Signature des webhooks',
        status: 'passed',
        severity: 'medium',
        description: 'Tous les webhooks utilisent une signature sécurisée',
        recommendation: null,
        lastCheck: new Date().toISOString()
      },
      {
        id: 'permissions',
        category: 'Permissions',
        title: 'Principe du moindre privilège',
        status: 'warning',
        severity: 'medium',
        description: 'Certaines intégrations ont des permissions trop étendues',
        recommendation: 'Réduire les permissions aux besoins minimaux',
        lastCheck: new Date().toISOString()
      },
      {
        id: 'data_retention',
        category: 'Données',
        title: 'Politique de rétention',
        status: 'passed',
        severity: 'medium',
        description: 'Politique de rétention des données conforme RGPD',
        recommendation: null,
        lastCheck: new Date().toISOString()
      },
      {
        id: 'rate_limiting',
        category: 'API',
        title: 'Limitation de taux',
        status: 'warning',
        severity: 'medium',
        description: 'Rate limiting non configuré pour certains endpoints',
        recommendation: 'Configurer un rate limiting approprié',
        lastCheck: new Date().toISOString()
      },
      {
        id: 'monitoring',
        category: 'Surveillance',
        title: 'Logs de sécurité',
        status: 'passed',
        severity: 'high',
        description: 'Tous les événements de sécurité sont loggés',
        recommendation: null,
        lastCheck: new Date().toISOString()
      }
    ]

    setAuditResults(mockResults)
    
    // Calculer le score de sécurité
    const passed = mockResults.filter(r => r.status === 'passed').length
    const total = mockResults.length
    const score = Math.round((passed / total) * 100)
    setSecurityScore(score)
  }

  const fetchSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setSecurityEvents(data || [])
    } catch (error) {
      // Simulation en cas d'erreur
      const mockEvents = [
        {
          id: '1',
          event_type: 'failed_login_attempt',
          severity: 'warning',
          description: 'Tentative de connexion échouée depuis une IP suspecte',
          user_id: null,
          ip_address: '192.168.1.100',
          created_at: new Date().toISOString(),
          metadata: { attempts: 3, user_agent: 'suspicious' }
        },
        {
          id: '2',
          event_type: 'api_key_accessed',
          severity: 'info',
          description: 'Clé API utilisée pour accéder aux données Shopify',
          user_id: 'user_123',
          ip_address: '192.168.1.50',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          metadata: { platform: 'shopify', action: 'product_sync' }
        },
        {
          id: '3',
          event_type: 'webhook_signature_invalid',
          severity: 'error',
          description: 'Signature webhook invalide détectée',
          user_id: null,
          ip_address: '203.0.113.1',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          metadata: { platform: 'stripe', webhook_id: 'wh_123' }
        }
      ]
      
      setSecurityEvents(mockEvents)
    }
  }

  const fetchAccessLogs = async () => {
    // Simulation des logs d'accès
    const mockAccessLogs = Array.from({ length: 20 }, (_, i) => ({
      id: `access_${i}`,
      user_id: `user_${Math.floor(Math.random() * 100)}`,
      action: ['login', 'api_access', 'data_export', 'integration_config'][Math.floor(Math.random() * 4)],
      resource: ['shopify_products', 'amazon_orders', 'stripe_payments', 'user_settings'][Math.floor(Math.random() * 4)],
      ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      user_agent: 'Mozilla/5.0 (compatible browser)',
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      success: Math.random() > 0.1
    }))

    setAccessLogs(mockAccessLogs)
  }

  const runSecurityScan = async () => {
    setIsScanning(true)
    
    try {
      // Simulation d'un scan de sécurité
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      await fetchAuditResults()
      
      toast({
        title: "Scan de sécurité terminé",
        description: "Le scan de sécurité a été effectué avec succès"
      })
    } catch (error) {
      toast({
        title: "Erreur du scan",
        description: "Le scan de sécurité a échoué",
        variant: "destructive"
      })
    } finally {
      setIsScanning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    }
    
    return (
      <Badge className={variants[severity as keyof typeof variants]}>
        {severity}
      </Badge>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Audit de Sécurité
          </h2>
          <p className="text-muted-foreground">
            Surveillance et audit de la sécurité des intégrations
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSecurityData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={runSecurityScan} disabled={isScanning}>
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Scan en cours...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Scanner
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Security Score */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Score de Sécurité Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(securityScore)}`}>
                {securityScore}/100
              </div>
              <Progress value={securityScore} className="mt-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {auditResults.filter(r => r.status === 'passed').length}
                </div>
                <div className="text-sm text-muted-foreground">Tests réussis</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {auditResults.filter(r => r.status === 'warning').length}
                </div>
                <div className="text-sm text-muted-foreground">Avertissements</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {auditResults.filter(r => r.status === 'failed').length}
                </div>
                <div className="text-sm text-muted-foreground">Échecs critiques</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="audit" className="space-y-6">
        <TabsList>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Résultats d'Audit
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Événements Sécurité
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Logs d'Accès
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Conformité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <div className="space-y-4">
            {auditResults.map(result => (
              <Card key={result.id} className={`border-l-4 ${
                result.status === 'passed' ? 'border-l-green-500' :
                result.status === 'warning' ? 'border-l-yellow-500' : 'border-l-red-500'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <CardTitle className="text-base">{result.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{result.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(result.severity)}
                      <Badge variant={
                        result.status === 'passed' ? 'default' :
                        result.status === 'warning' ? 'secondary' : 'destructive'
                      }>
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-3">{result.description}</p>
                  
                  {result.recommendation && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm">
                        <strong>Recommandation :</strong> {result.recommendation}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Dernière vérification : {formatTimestamp(result.lastCheck)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Événements de Sécurité Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.map(event => (
                  <Dialog key={event.id}>
                    <DialogTrigger asChild>
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className={`w-2 h-2 rounded-full ${
                          event.severity === 'error' ? 'bg-red-500' :
                          event.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{event.event_type}</span>
                            <Badge variant={
                              event.severity === 'error' ? 'destructive' :
                              event.severity === 'warning' ? 'secondary' : 'default'
                            }>
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {event.description}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatTimestamp(event.created_at)}
                          </div>
                          {event.ip_address && (
                            <div className="text-xs text-muted-foreground">
                              {event.ip_address}
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Détails de l'Événement de Sécurité</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Type d'événement</label>
                            <p>{event.event_type}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Sévérité</label>
                            <Badge variant={
                              event.severity === 'error' ? 'destructive' :
                              event.severity === 'warning' ? 'secondary' : 'default'
                            }>
                              {event.severity}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Adresse IP</label>
                            <p>{event.ip_address || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Utilisateur</label>
                            <p>{event.user_id || 'Anonyme'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <p className="mt-1 p-3 bg-muted/30 rounded-lg">{event.description}</p>
                        </div>
                        
                        {event.metadata && (
                          <div>
                            <label className="text-sm font-medium">Métadonnées</label>
                            <pre className="mt-1 p-3 bg-muted/30 rounded-lg text-xs overflow-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Logs d'Accès</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {accessLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    {log.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.action}</span>
                        <Badge variant="outline">{log.resource}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.user_id} • {log.ip_address}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm">
                        {formatTimestamp(log.timestamp)}
                      </div>
                      <Badge variant={log.success ? 'default' : 'destructive'} className="text-xs">
                        {log.success ? 'Succès' : 'Échec'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  RGPD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Consentement des données</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Droit à l'oubli</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Portabilité des données</span>
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Chiffrement des données</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  PCI DSS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Réseau sécurisé</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Protection des données</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gestion des vulnérabilités</span>
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Contrôle d'accès</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  ISO 27001
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Politique de sécurité</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gestion des risques</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Formation du personnel</span>
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Continuité d'activité</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  SOC 2
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Sécurité</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Disponibilité</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Intégrité des données</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Confidentialité</span>
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}