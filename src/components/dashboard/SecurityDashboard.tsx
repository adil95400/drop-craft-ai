import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Eye, 
  UserCheck,
  Activity,
  Globe,
  Terminal,
  FileText,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface SecurityEvent {
  id: string
  type: 'login' | 'access_attempt' | 'data_breach' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  ip?: string
  userAgent?: string
  resolved: boolean
}

interface SecurityMetric {
  name: string
  value: number
  status: 'safe' | 'warning' | 'danger'
  description: string
}

export function SecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [securityScore, setSecurityScore] = useState(85)
  const [metrics, setMetrics] = useState<SecurityMetric[]>([])
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    // Simuler des événements de sécurité
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        type: 'login',
        severity: 'low',
        message: 'Connexion réussie depuis Paris, France',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        ip: '192.168.1.1',
        resolved: true
      },
      {
        id: '2',
        type: 'suspicious_activity',
        severity: 'medium',
        message: 'Tentatives de connexion multiples détectées',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        ip: '45.123.45.67',
        resolved: false
      },
      {
        id: '3',
        type: 'access_attempt',
        severity: 'high',
        message: 'Tentative d\'accès à des ressources protégées',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ip: '123.456.78.90',
        resolved: false
      }
    ]

    const mockMetrics: SecurityMetric[] = [
      {
        name: 'Authentification 2FA',
        value: 78,
        status: 'warning',
        description: '78% des utilisateurs ont activé la 2FA'
      },
      {
        name: 'Chiffrement des données',
        value: 100,
        status: 'safe',
        description: 'Toutes les données sensibles sont chiffrées'
      },
      {
        name: 'Mises à jour sécurité',
        value: 92,
        status: 'safe',
        description: '92% des composants sont à jour'
      },
      {
        name: 'Tentatives de piratage',
        value: 15,
        status: 'warning',
        description: '15 tentatives bloquées cette semaine'
      }
    ]

    setSecurityEvents(mockEvents)
    setMetrics(mockMetrics)
  }, [])

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'low':
        return 'bg-green-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'high':
        return 'bg-orange-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getSeverityIcon = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'low':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'medium':
        return <Eye className="h-4 w-4 text-yellow-500" />
      case 'high':
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: SecurityMetric['status']) => {
    switch (status) {
      case 'safe':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'danger':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const runSecurityScan = async () => {
    setScanning(true)
    toast.loading('Analyse de sécurité en cours...', { id: 'security-scan' })

    try {
      // Simuler une analyse de sécurité
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Mise à jour du score de sécurité
      const newScore = Math.floor(Math.random() * 10) + 80 // 80-90
      setSecurityScore(newScore)

      toast.success(
        `Analyse terminée ! Score de sécurité: ${newScore}/100`,
        { id: 'security-scan', duration: 4000 }
      )
    } catch (error) {
      toast.error('Erreur lors de l\'analyse de sécurité', { id: 'security-scan' })
    } finally {
      setScanning(false)
    }
  }

  const resolveEvent = (eventId: string) => {
    setSecurityEvents(events =>
      events.map(event =>
        event.id === eventId ? { ...event, resolved: true } : event
      )
    )
    toast.success('Événement résolu avec succès')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Score de Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Score de Sécurité
            <Badge 
              className={`ml-auto ${
                securityScore >= 90 ? 'bg-green-500' :
                securityScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            >
              {securityScore}/100
            </Badge>
          </CardTitle>
          <CardDescription>
            Évaluation globale de la sécurité du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="54" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    className="text-gray-200"
                  />
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="54" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={`${securityScore * 3.39} 339`}
                    className={
                      securityScore >= 90 ? 'text-green-500' :
                      securityScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{securityScore}</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {metrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <span className={`text-sm font-bold ${getStatusColor(metric.status)}`}>
                      {metric.value}{metric.name.includes('%') ? '' : '%'}
                    </span>
                  </div>
                  <Progress value={Math.min(metric.value, 100)} className="h-2" />
                  <p className="text-xs text-gray-500">{metric.description}</p>
                </div>
              ))}
            </div>

            <Button 
              onClick={runSecurityScan} 
              disabled={scanning}
              className="w-full"
            >
              {scanning ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Lancer une Analyse
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Événements de Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Événements de Sécurité
            <Badge variant="secondary" className="ml-auto">
              {securityEvents.filter(e => !e.resolved).length} Non résolus
            </Badge>
          </CardTitle>
          <CardDescription>
            Activité de sécurité récente et alertes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityEvents.map((event) => (
              <div 
                key={event.id} 
                className={`p-4 rounded-lg border ${
                  event.resolved ? 'bg-gray-50 opacity-60' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{event.message}</span>
                        <Badge 
                          className={`text-xs ${getSeverityColor(event.severity)} text-white`}
                        >
                          {event.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.timestamp).toLocaleString('fr-FR')}
                        </div>
                        {event.ip && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {event.ip}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!event.resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveEvent(event.id)}
                      className="ml-2"
                    >
                      Résoudre
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">24h</div>
              <div className="text-xs text-gray-500">Dernière Attaque</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">127</div>
              <div className="text-xs text-gray-500">Tentatives Bloquées</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">99.9%</div>
              <div className="text-xs text-gray-500">Taux de Protection</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}