import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Shield, AlertTriangle, CheckCircle, Lock, Eye, Key, Scan } from 'lucide-react'

export default function SecurityPage() {
  const [securitySettings, setSecuritySettings] = useState({
    enableSandbox: true,
    restrictPermissions: true,
    enableAuditLog: true,
    blockDangerousSites: true,
    requireMFA: false
  })

  const [scanProgress, setScanProgress] = useState(0)
  const [isScanning, setIsScanning] = useState(false)

  const securityStatus = {
    overall: 85,
    level: 'good',
    vulnerabilities: 2,
    lastScan: '2024-01-15 14:30'
  }

  const permissions = [
    {
      extension: 'Data Scraper Pro',
      permissions: ['tabs', 'activeTab', 'storage'],
      risk: 'low',
      status: 'approved'
    },
    {
      extension: 'Review Importer',
      permissions: ['tabs', 'activeTab', 'storage', 'background'],
      risk: 'medium',
      status: 'approved'
    },
    {
      extension: 'Price Monitor',
      permissions: ['tabs', 'activeTab', 'storage', 'webRequest', 'webRequestBlocking'],
      risk: 'high',
      status: 'pending'
    }
  ]

  const securityEvents = [
    {
      id: '1',
      type: 'permission_granted',
      extension: 'Data Scraper Pro',
      description: 'Nouvelle permission accordée: webRequest',
      severity: 'medium',
      timestamp: '2024-01-15 10:30:00'
    },
    {
      id: '2',
      type: 'suspicious_activity',
      extension: 'Unknown Extension',
      description: 'Tentative d\'accès non autorisé détectée',
      severity: 'high',
      timestamp: '2024-01-14 22:15:00'
    },
    {
      id: '3',
      type: 'update_installed',
      extension: 'Review Importer',
      description: 'Mise à jour de sécurité installée',
      severity: 'info',
      timestamp: '2024-01-14 16:45:00'
    }
  ]

  const handleSecurityScan = () => {
    setIsScanning(true)
    setScanProgress(0)
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsScanning(false)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Sécurité des Extensions
        </h1>
        <p className="text-muted-foreground mt-2">
          Surveillez et sécurisez vos extensions installées
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Score de Sécurité</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-2">{securityStatus.overall}%</div>
            <Progress value={securityStatus.overall} className="mb-2" />
            <p className="text-sm text-muted-foreground">Niveau: {securityStatus.level}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">Vulnérabilités</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-2">{securityStatus.vulnerabilities}</div>
            <p className="text-sm text-muted-foreground">Détectées</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Scan className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">Dernier Scan</span>
            </div>
            <div className="text-sm font-medium mb-2">{securityStatus.lastScan}</div>
            <Button onClick={handleSecurityScan} disabled={isScanning} size="sm" className="w-full">
              {isScanning ? 'Scan en cours...' : 'Scanner Maintenant'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {isScanning && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analyse de sécurité en cours...</span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="permissions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Gestion des Permissions
              </CardTitle>
              <CardDescription>
                Révisez et gérez les permissions accordées à vos extensions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {permissions.map((item, index) => (
                <Card key={index} className="border-l-4 border-l-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{item.extension}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.permissions.length} permissions
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getSeverityColor(item.risk)}>
                          Risque {item.risk}
                        </Badge>
                        <Badge variant={item.status === 'approved' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.permissions.map((permission, pIndex) => (
                        <Badge key={pIndex} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        Réviser
                      </Button>
                      {item.status === 'pending' && (
                        <Button size="sm">Approuver</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Paramètres de Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mode Sandbox</Label>
                    <p className="text-sm text-muted-foreground">Isoler les extensions dans un environnement sécurisé</p>
                  </div>
                  <Switch
                    checked={securitySettings.enableSandbox}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({...prev, enableSandbox: checked}))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Restriction des Permissions</Label>
                    <p className="text-sm text-muted-foreground">Limiter automatiquement les permissions dangereuses</p>
                  </div>
                  <Switch
                    checked={securitySettings.restrictPermissions}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({...prev, restrictPermissions: checked}))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Journal d'Audit</Label>
                    <p className="text-sm text-muted-foreground">Enregistrer toutes les activités des extensions</p>
                  </div>
                  <Switch
                    checked={securitySettings.enableAuditLog}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({...prev, enableAuditLog: checked}))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Blocage Sites Dangereux</Label>
                    <p className="text-sm text-muted-foreground">Empêcher l'accès aux sites malveillants connus</p>
                  </div>
                  <Switch
                    checked={securitySettings.blockDangerousSites}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({...prev, blockDangerousSites: checked}))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Authentification Multi-Facteurs</Label>
                    <p className="text-sm text-muted-foreground">Exiger MFA pour les extensions sensibles</p>
                  </div>
                  <Switch
                    checked={securitySettings.requireMFA}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({...prev, requireMFA: checked}))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Événements de Sécurité Récents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className={`p-1 rounded-full ${
                    event.severity === 'high' ? 'bg-red-100 text-red-600' :
                    event.severity === 'medium' ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {event.severity === 'high' ? <AlertTriangle className="w-4 h-4" /> :
                     event.severity === 'medium' ? <Shield className="w-4 h-4" /> :
                     <CheckCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{event.extension}</h4>
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{event.timestamp}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal d'Audit Complet</CardTitle>
              <CardDescription>
                Historique détaillé de toutes les activités de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Journal d'audit disponible dans la version Pro</p>
                <Button className="mt-4">Mettre à niveau</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}