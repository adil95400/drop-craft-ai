import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Globe,
  Lock,
  Eye,
  FileText,
  Database,
  Settings,
  Award,
  Download
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ComplianceFramework {
  id: string
  name: string
  description: string
  compliance_percentage: number
  status: 'compliant' | 'non_compliant' | 'in_progress' | 'pending'
  last_audit: string
  next_audit: string
  requirements_met: number
  requirements_total: number
}

interface ComplianceCheck {
  id: string
  framework: string
  requirement: string
  status: 'passed' | 'failed' | 'pending' | 'not_applicable'
  priority: 'critical' | 'high' | 'medium' | 'low'
  description: string
  evidence?: string
  last_checked: string
}

export default function ComplianceCenter() {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([])
  const [checks, setChecks] = useState<ComplianceCheck[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchComplianceData()
  }, [])

  const fetchComplianceData = async () => {
    try {
      setLoading(true)
      
      // Mock compliance frameworks data
      const mockFrameworks: ComplianceFramework[] = [
        {
          id: '1',
          name: 'RGPD/GDPR',
          description: 'Règlement Général sur la Protection des Données',
          compliance_percentage: 92,
          status: 'compliant',
          last_audit: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          next_audit: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000).toISOString(),
          requirements_met: 23,
          requirements_total: 25
        },
        {
          id: '2',
          name: 'ISO 27001',
          description: 'Système de Management de la Sécurité de l\'Information',
          compliance_percentage: 78,
          status: 'in_progress',
          last_audit: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          next_audit: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000).toISOString(),
          requirements_met: 78,
          requirements_total: 100
        },
        {
          id: '3',
          name: 'SOC 2 Type II',
          description: 'Security, Availability, and Confidentiality',
          compliance_percentage: 85,
          status: 'compliant',
          last_audit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          next_audit: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
          requirements_met: 34,
          requirements_total: 40
        },
        {
          id: '4',
          name: 'PCI DSS',
          description: 'Payment Card Industry Data Security Standard',
          compliance_percentage: 65,
          status: 'non_compliant',
          last_audit: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          next_audit: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          requirements_met: 8,
          requirements_total: 12
        },
        {
          id: '5',
          name: 'HIPAA',
          description: 'Health Insurance Portability and Accountability Act',
          compliance_percentage: 0,
          status: 'pending',
          last_audit: '',
          next_audit: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          requirements_met: 0,
          requirements_total: 18
        }
      ]
      setFrameworks(mockFrameworks)

      // Mock compliance checks
      const mockChecks: ComplianceCheck[] = [
        {
          id: '1',
          framework: 'RGPD/GDPR',
          requirement: 'Consentement utilisateur',
          status: 'passed',
          priority: 'critical',
          description: 'Mécanisme de consentement implémenté et fonctionnel',
          evidence: 'Cookie banner et formulaires de consentement',
          last_checked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          framework: 'RGPD/GDPR',
          requirement: 'Droit à l\'oubli',
          status: 'failed',
          priority: 'high',
          description: 'Processus de suppression des données utilisateur',
          evidence: '',
          last_checked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          framework: 'ISO 27001',
          requirement: 'Contrôle d\'accès',
          status: 'passed',
          priority: 'critical',
          description: 'Système d\'authentification multi-facteur',
          evidence: 'MFA configuré pour 89% des utilisateurs',
          last_checked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          framework: 'ISO 27001',
          requirement: 'Chiffrement des données',
          status: 'passed',
          priority: 'critical',
          description: 'Données chiffrées en transit et au repos',
          evidence: 'TLS 1.3 et AES-256 implémentés',
          last_checked: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          framework: 'SOC 2 Type II',
          requirement: 'Surveillance des accès',
          status: 'pending',
          priority: 'medium',
          description: 'Monitoring des tentatives d\'accès non autorisées',
          evidence: '',
          last_checked: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '6',
          framework: 'PCI DSS',
          requirement: 'Tokenisation des cartes',
          status: 'failed',
          priority: 'critical',
          description: 'Tokenisation des données de cartes de crédit',
          evidence: '',
          last_checked: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      setChecks(mockChecks)

    } catch (error) {
      console.error('Error fetching compliance data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de conformité",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'passed': return 'default'
      case 'non_compliant':
      case 'failed': return 'destructive'
      case 'in_progress':
      case 'pending': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'passed': return <CheckCircle className="w-4 h-4" />
      case 'non_compliant':
      case 'failed': return <AlertTriangle className="w-4 h-4" />
      case 'in_progress':
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <FileCheck className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'default'
    }
  }

  const runComplianceAudit = async (frameworkId: string) => {
    toast({
      title: "Audit lancé",
      description: "Vérification de conformité en cours...",
    })
    
    setTimeout(() => {
      toast({
        title: "Audit terminé",
        description: "Rapport de conformité généré avec succès",
      })
    }, 3000)
  }

  const overallCompliance = frameworks.length > 0 
    ? Math.round(frameworks.reduce((sum, f) => sum + f.compliance_percentage, 0) / frameworks.length)
    : 0

  const criticalIssues = checks.filter(c => c.status === 'failed' && c.priority === 'critical').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Centre de Conformité</h1>
          <p className="text-muted-foreground">
            Gestion et surveillance de la conformité réglementaire
          </p>
        </div>
        <Button onClick={() => runComplianceAudit('all')} className="gap-2">
          <FileCheck className="w-4 h-4" />
          Audit Complet
        </Button>
      </div>

      {/* Compliance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformité Globale</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallCompliance}%</div>
            <Progress value={overallCompliance} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {frameworks.filter(f => f.status === 'compliant').length}/{frameworks.length} frameworks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problèmes Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {criticalIssues}
            </div>
            <p className="text-xs text-muted-foreground">
              À résoudre immédiatement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audits en Cours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {frameworks.filter(f => f.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Processus actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certifications</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {frameworks.filter(f => f.status === 'compliant').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Actives
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="frameworks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="frameworks">Référentiels</TabsTrigger>
          <TabsTrigger value="checks">Vérifications</TabsTrigger>
          <TabsTrigger value="evidence">Preuves</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="frameworks" className="space-y-4">
          <div className="grid gap-4">
            {frameworks.map((framework) => (
              <Card key={framework.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(framework.status)}
                        {framework.name}
                      </CardTitle>
                      <CardDescription>{framework.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(framework.status) as any}>
                        {framework.status}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => runComplianceAudit(framework.id)}
                      >
                        Auditer
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progression</span>
                        <span className="text-sm text-muted-foreground">
                          {framework.requirements_met}/{framework.requirements_total} exigences
                        </span>
                      </div>
                      <Progress value={framework.compliance_percentage} />
                      <p className="text-sm text-muted-foreground mt-1">
                        {framework.compliance_percentage}% conforme
                      </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Dernier audit:</span>
                        <span className="font-medium">
                          {framework.last_audit ? 
                            new Date(framework.last_audit).toLocaleDateString() : 
                            'Aucun'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-muted-foreground" />
                        <span>Prochain audit:</span>
                        <span className="font-medium">
                          {new Date(framework.next_audit).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vérifications de Conformité</CardTitle>
              <CardDescription>
                État détaillé des contrôles par référentiel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checks.map((check) => (
                  <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <p className="font-medium">{check.requirement}</p>
                        <p className="text-sm text-muted-foreground">{check.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {check.framework} • Vérifié le {new Date(check.last_checked).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(check.priority) as any}>
                        {check.priority}
                      </Badge>
                      <Badge variant={getStatusColor(check.status) as any}>
                        {check.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Politique de confidentialité</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex justify-between items-center">
                  <span>Procédures de sécurité</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex justify-between items-center">
                  <span>Plan de réponse aux incidents</span>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex justify-between items-center">
                  <span>Formation du personnel</span>
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Contrôles Techniques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Chiffrement des données</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex justify-between items-center">
                  <span>Sauvegarde automatisée</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex justify-between items-center">
                  <span>Tests de pénétration</span>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex justify-between items-center">
                  <span>Monitoring 24/7</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">RGPD Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">92%</p>
                  <p className="text-sm text-muted-foreground">Conformité RGPD</p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ISO 27001 Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-yellow-600">78%</p>
                  <p className="text-sm text-muted-foreground">En cours</p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">SOC 2 Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">85%</p>
                  <p className="text-sm text-muted-foreground">Certifié</p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}