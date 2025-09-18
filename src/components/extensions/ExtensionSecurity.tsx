import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Info, Zap,
  Lock, Eye, Bug, Key, Globe, Code2, Database, Server,
  Scan, FileSearch, Activity, AlertCircle, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface SecurityIssue {
  id: string
  type: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: 'vulnerability' | 'permission' | 'code-quality' | 'compliance' | 'privacy'
  title: string
  description: string
  details: string
  fix?: string
  cve?: string
  location?: string
  line?: number
}

interface SecurityScan {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  duration?: number
  issues_found: number
}

const SECURITY_ISSUES: SecurityIssue[] = [
  {
    id: '1',
    type: 'critical',
    category: 'vulnerability',
    title: 'Injection SQL potentielle',
    description: 'Requête SQL non échappée détectée',
    details: 'Une requête SQL dynamique a été trouvée sans échappement approprié des paramètres utilisateur.',
    fix: 'Utilisez des requêtes préparées ou échappez les paramètres utilisateur',
    location: 'src/database.js',
    line: 45,
    cve: 'CWE-89'
  },
  {
    id: '2',
    type: 'high',
    category: 'permission',
    title: 'Permissions excessives',
    description: 'L\'extension demande plus de permissions que nécessaire',
    details: 'L\'extension demande l\'accès à toutes les données clients mais ne semble utiliser que les emails.',
    fix: 'Réduisez les permissions au minimum nécessaire',
    location: 'manifest.json',
    line: 12
  },
  {
    id: '3',
    type: 'medium',
    category: 'privacy',
    title: 'Données sensibles dans les logs',
    description: 'Informations personnelles trouvées dans les logs',
    details: 'Des adresses email et numéros de téléphone sont écrits dans les fichiers de log.',
    fix: 'Masquez ou supprimez les données sensibles des logs',
    location: 'src/logger.js',
    line: 23
  },
  {
    id: '4',
    type: 'low',
    category: 'code-quality',
    title: 'Dépendance obsolète',
    description: 'Une dépendance utilisée a une version obsolète',
    details: 'La bibliothèque "request" v2.88.0 est obsolète et a des vulnérabilités connues.',
    fix: 'Mettez à jour vers une version récente ou utilisez une alternative',
    location: 'package.json',
    line: 15
  },
  {
    id: '5',
    type: 'info',
    category: 'compliance',
    title: 'Conformité RGPD',
    description: 'Informations sur la conformité RGPD manquantes',
    details: 'Aucune politique de confidentialité ou mention RGPD trouvée.',
    fix: 'Ajoutez une politique de confidentialité et des mentions RGPD',
    location: 'README.md'
  }
]

export const ExtensionSecurity = () => {
  const [securityScans, setSecurityScans] = useState<SecurityScan[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [issues, setIssues] = useState<SecurityIssue[]>(SECURITY_ISSUES)
  const [selectedIssue, setSelectedIssue] = useState<SecurityIssue | null>(null)
  
  const startSecurityScan = async () => {
    setIsScanning(true)
    setIssues([])
    
    const scans: SecurityScan[] = [
      {
        id: 'vulnerability',
        name: 'Scan de vulnérabilités',
        status: 'running',
        progress: 0,
        issues_found: 0
      },
      {
        id: 'permissions',
        name: 'Analyse des permissions',
        status: 'pending',
        progress: 0,
        issues_found: 0
      },
      {
        id: 'code-quality',
        name: 'Qualité du code',
        status: 'pending',
        progress: 0,
        issues_found: 0  
      },
      {
        id: 'dependencies',
        name: 'Dépendances',
        status: 'pending',
        progress: 0,
        issues_found: 0
      },
      {
        id: 'privacy',
        name: 'Conformité & Confidentialité',
        status: 'pending',
        progress: 0,
        issues_found: 0
      }
    ]

    setSecurityScans(scans)
    toast.info('Scan de sécurité démarré')

    // Simulation des scans
    for (let i = 0; i < scans.length; i++) {
      const scan = scans[i]
      const startTime = Date.now()

      // Mettre à jour le statut à "running"
      setSecurityScans(prev => 
        prev.map(s => s.id === scan.id ? { ...s, status: 'running' } : s)
      )

      // Simulation de progression
      for (let progress = 0; progress <= 100; progress += 10) {
        setSecurityScans(prev => 
          prev.map(s => s.id === scan.id ? { ...s, progress } : s)
        )
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const duration = Date.now() - startTime
      const issuesCount = Math.floor(Math.random() * 3) + 1
      
      setSecurityScans(prev => 
        prev.map(s => s.id === scan.id ? { 
          ...s, 
          status: 'completed',
          duration,
          issues_found: issuesCount
        } : s)
      )

      // Marquer les scans suivants comme en attente
      if (i < scans.length - 1) {
        setSecurityScans(prev => 
          prev.map((s, index) => index === i + 1 ? { ...s, status: 'running' } : s)
        )
      }
    }

    // Ajouter les problèmes trouvés
    setTimeout(() => {
      setIssues(SECURITY_ISSUES)
      toast.success('Scan de sécurité terminé')
      setIsScanning(false)
    }, 500)
  }

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'info': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="w-4 h-4" />
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'medium': return <AlertCircle className="w-4 h-4" />
      case 'low': return <Info className="w-4 h-4" />
      case 'info': return <Info className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vulnerability': return <Bug className="w-4 h-4" />
      case 'permission': return <Key className="w-4 h-4" />
      case 'code-quality': return <Code2 className="w-4 h-4" />
      case 'compliance': return <FileSearch className="w-4 h-4" />
      case 'privacy': return <Eye className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  const getScanIcon = (id: string) => {
    switch (id) {
      case 'vulnerability': return <Bug className="w-4 h-4" />
      case 'permissions': return <Key className="w-4 h-4" />
      case 'code-quality': return <Code2 className="w-4 h-4" />
      case 'dependencies': return <Database className="w-4 h-4" />
      case 'privacy': return <Eye className="w-4 h-4" />
      default: return <Scan className="w-4 h-4" />
    }
  }

  const criticalIssues = issues.filter(i => i.type === 'critical').length
  const highIssues = issues.filter(i => i.type === 'high').length
  const totalIssues = issues.length
  const securityScore = Math.max(0, 100 - (criticalIssues * 30 + highIssues * 15 + (totalIssues - criticalIssues - highIssues) * 5))

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600">
              <Shield className="w-8 h-8 text-white" />
            </div>
            Scanner de Sécurité
          </h1>
          <p className="text-muted-foreground mt-1">
            Analysez la sécurité de vos extensions et corrigez les vulnérabilités
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Historique
          </Button>
          <Button 
            onClick={startSecurityScan}
            disabled={isScanning}
            className="bg-gradient-to-r from-red-600 to-orange-600"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Scan className="w-4 h-4 mr-2" />
            )}
            {isScanning ? 'Scan en cours...' : 'Lancer le scan'}
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-3xl font-bold ${securityScore >= 80 ? 'text-green-600' : securityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {securityScore}
            </div>
            <div className="text-sm text-muted-foreground">Score de sécurité</div>
            <div className="text-xs mt-1">
              {securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Bon' : 'À améliorer'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{criticalIssues}</div>
            <div className="text-sm text-muted-foreground">Critiques</div>
            <div className="text-xs text-red-600 mt-1">Action requise</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{highIssues}</div>
            <div className="text-sm text-muted-foreground">Hautes</div>
            <div className="text-xs text-orange-600 mt-1">À corriger rapidement</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{totalIssues}</div>
            <div className="text-sm text-muted-foreground">Total problèmes</div>
            <div className="text-xs text-blue-600 mt-1">Trouvés</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Security Scans */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5" />
                Scans de sécurité
              </CardTitle>
              <CardDescription>
                État des différents scans de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityScans.map(scan => (
                <div key={scan.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getScanIcon(scan.id)}
                      <span className="text-sm font-medium">{scan.name}</span>
                    </div>
                    <Badge variant={
                      scan.status === 'completed' ? 'default' :
                      scan.status === 'running' ? 'secondary' :
                      scan.status === 'failed' ? 'destructive' : 'outline'
                    }>
                      {scan.status === 'completed' && `${scan.issues_found} trouvé${scan.issues_found > 1 ? 's' : ''}`}
                      {scan.status === 'running' && 'En cours'}
                      {scan.status === 'pending' && 'En attente'}
                      {scan.status === 'failed' && 'Échec'}
                    </Badge>
                  </div>
                  {scan.status === 'running' && (
                    <Progress value={scan.progress} className="h-2" />
                  )}
                  {scan.duration && (
                    <div className="text-xs text-muted-foreground">
                      Terminé en {(scan.duration / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              ))}

              {securityScans.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Scan className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Aucun scan exécuté</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileSearch className="w-4 h-4 mr-2" />
                Audit de conformité RGPD
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                Vérifier les dépendances
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Key className="w-4 h-4 mr-2" />
                Analyser les permissions
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Code2 className="w-4 h-4 mr-2" />
                Scan du code statique
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Issues List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Problèmes de sécurité détectés
              </CardTitle>
              <CardDescription>
                {issues.length} problème{issues.length > 1 ? 's' : ''} nécessitant votre attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {issues.length > 0 ? (
                <div className="space-y-3">
                  {issues.map(issue => (
                    <div 
                      key={issue.id} 
                      className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedIssue(issue)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {getSeverityIcon(issue.type)}
                            {getCategoryIcon(issue.category)}
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">{issue.title}</h3>
                            <p className="text-xs text-muted-foreground">{issue.description}</p>
                          </div>
                        </div>
                        <Badge className={getSeverityColor(issue.type)}>
                          {issue.type.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {issue.location && (
                        <div className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded">
                          {issue.location}{issue.line && `:${issue.line}`}
                        </div>
                      )}
                      
                      {issue.cve && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {issue.cve}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                  <p className="text-lg font-medium mb-2">Aucun problème détecté</p>
                  <p className="text-sm">Votre extension semble sécurisée !</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issue Details */}
          {selectedIssue && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getSeverityIcon(selectedIssue.type)}
                  Détails du problème
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">{selectedIssue.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedIssue.details}
                  </p>
                </div>

                {selectedIssue.fix && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">💡 Solution recommandée</h4>
                    <p className="text-sm text-green-800">{selectedIssue.fix}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marquer comme corrigé
                  </Button>
                  <Button variant="outline" size="sm">
                    <Info className="w-4 h-4 mr-2" />
                    Plus d'infos
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedIssue(null)}
                  >
                    Fermer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExtensionSecurity