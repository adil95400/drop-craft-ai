import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Award,
  Plus,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface ComplianceFramework {
  id: string
  user_id: string
  name: string
  description: string | null
  compliance_percentage: number
  status: 'compliant' | 'non_compliant' | 'in_progress' | 'pending'
  last_audit: string | null
  next_audit: string | null
  requirements_met: number
  requirements_total: number
  created_at: string
  updated_at: string
}

interface ComplianceCheck {
  id: string
  user_id: string
  framework_id: string | null
  framework_name: string | null
  requirement: string
  status: 'passed' | 'failed' | 'pending' | 'not_applicable'
  priority: 'critical' | 'high' | 'medium' | 'low'
  description: string | null
  evidence: string | null
  last_checked: string | null
  created_at: string
  updated_at: string
}

export default function ComplianceCenter() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAddFramework, setShowAddFramework] = useState(false)
  const [showAddCheck, setShowAddCheck] = useState(false)
  const [newFramework, setNewFramework] = useState({
    name: '',
    description: '',
    requirements_total: 0
  })
  const [newCheck, setNewCheck] = useState({
    framework_name: '',
    requirement: '',
    description: '',
    priority: 'medium' as const
  })

  // Fetch frameworks from Supabase
  const { data: frameworks = [], isLoading: loadingFrameworks } = useQuery({
    queryKey: ['compliance-frameworks', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('compliance_frameworks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as ComplianceFramework[]
    },
    enabled: !!user?.id
  })

  // Fetch checks from Supabase
  const { data: checks = [], isLoading: loadingChecks } = useQuery({
    queryKey: ['compliance-checks', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('compliance_checks')
        .select('*')
        .eq('user_id', user.id)
        .order('last_checked', { ascending: false })
      
      if (error) throw error
      return data as ComplianceCheck[]
    },
    enabled: !!user?.id
  })

  // Add framework mutation
  const addFrameworkMutation = useMutation({
    mutationFn: async (framework: typeof newFramework) => {
      if (!user?.id) throw new Error('Non authentifié')
      const { data, error } = await supabase
        .from('compliance_frameworks')
        .insert({
          user_id: user.id,
          name: framework.name,
          description: framework.description || null,
          requirements_total: framework.requirements_total,
          next_audit: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-frameworks'] })
      setShowAddFramework(false)
      setNewFramework({ name: '', description: '', requirements_total: 0 })
      toast({ title: "Référentiel ajouté", description: "Le référentiel a été créé avec succès" })
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible d'ajouter le référentiel", variant: "destructive" })
    }
  })

  // Add check mutation
  const addCheckMutation = useMutation({
    mutationFn: async (check: typeof newCheck) => {
      if (!user?.id) throw new Error('Non authentifié')
      const { data, error } = await supabase
        .from('compliance_checks')
        .insert({
          user_id: user.id,
          framework_name: check.framework_name,
          requirement: check.requirement,
          description: check.description || null,
          priority: check.priority,
          last_checked: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-checks'] })
      setShowAddCheck(false)
      setNewCheck({ framework_name: '', requirement: '', description: '', priority: 'medium' })
      toast({ title: "Vérification ajoutée", description: "La vérification a été créée avec succès" })
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible d'ajouter la vérification", variant: "destructive" })
    }
  })

  // Run audit mutation
  const runAuditMutation = useMutation({
    mutationFn: async (frameworkId: string) => {
      if (!user?.id) throw new Error('Non authentifié')
      const { error } = await supabase
        .from('compliance_frameworks')
        .update({
          last_audit: new Date().toISOString(),
          next_audit: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', frameworkId)
        .eq('user_id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-frameworks'] })
      toast({ title: "Audit terminé", description: "Rapport de conformité mis à jour" })
    }
  })

  // Update check status mutation
  const updateCheckStatusMutation = useMutation({
    mutationFn: async ({ checkId, status }: { checkId: string; status: string }) => {
      if (!user?.id) throw new Error('Non authentifié')
      const { error } = await supabase
        .from('compliance_checks')
        .update({ 
          status,
          last_checked: new Date().toISOString()
        })
        .eq('id', checkId)
        .eq('user_id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-checks'] })
      toast({ title: "Statut mis à jour" })
    }
  })

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

  const overallCompliance = frameworks.length > 0 
    ? Math.round(frameworks.reduce((sum, f) => sum + (f.compliance_percentage || 0), 0) / frameworks.length)
    : 0

  const criticalIssues = checks.filter(c => c.status === 'failed' && c.priority === 'critical').length

  const loading = loadingFrameworks || loadingChecks

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
        <div className="flex gap-2">
          <Dialog open={showAddFramework} onOpenChange={setShowAddFramework}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Référentiel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un référentiel</DialogTitle>
                <DialogDescription>Créer un nouveau référentiel de conformité</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nom</Label>
                  <Input 
                    value={newFramework.name}
                    onChange={(e) => setNewFramework(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: RGPD, ISO 27001..."
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={newFramework.description}
                    onChange={(e) => setNewFramework(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du référentiel..."
                  />
                </div>
                <div>
                  <Label>Nombre d'exigences</Label>
                  <Input 
                    type="number"
                    value={newFramework.requirements_total}
                    onChange={(e) => setNewFramework(prev => ({ ...prev, requirements_total: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <Button 
                  onClick={() => addFrameworkMutation.mutate(newFramework)}
                  disabled={!newFramework.name || addFrameworkMutation.isPending}
                  className="w-full"
                >
                  {addFrameworkMutation.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
            <p className="text-xs text-muted-foreground">À résoudre immédiatement</p>
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
            <p className="text-xs text-muted-foreground">Processus actifs</p>
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
            <p className="text-xs text-muted-foreground">Actives</p>
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
          {frameworks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun référentiel</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Commencez par ajouter un référentiel de conformité
                </p>
                <Button onClick={() => setShowAddFramework(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un référentiel
                </Button>
              </CardContent>
            </Card>
          ) : (
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
                          onClick={() => runAuditMutation.mutate(framework.id)}
                          disabled={runAuditMutation.isPending}
                        >
                          <RefreshCw className={`w-4 h-4 mr-1 ${runAuditMutation.isPending ? 'animate-spin' : ''}`} />
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
                        <Progress value={framework.compliance_percentage || 0} />
                        <p className="text-sm text-muted-foreground mt-1">
                          {framework.compliance_percentage || 0}% conforme
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
                            {framework.next_audit ? 
                              new Date(framework.next_audit).toLocaleDateString() :
                              'Non planifié'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vérifications de Conformité</CardTitle>
                <CardDescription>État détaillé des contrôles par référentiel</CardDescription>
              </div>
              <Dialog open={showAddCheck} onOpenChange={setShowAddCheck}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une vérification</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Référentiel</Label>
                      <Input 
                        value={newCheck.framework_name}
                        onChange={(e) => setNewCheck(prev => ({ ...prev, framework_name: e.target.value }))}
                        placeholder="Ex: RGPD, ISO 27001..."
                      />
                    </div>
                    <div>
                      <Label>Exigence</Label>
                      <Input 
                        value={newCheck.requirement}
                        onChange={(e) => setNewCheck(prev => ({ ...prev, requirement: e.target.value }))}
                        placeholder="Nom de l'exigence"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea 
                        value={newCheck.description}
                        onChange={(e) => setNewCheck(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Priorité</Label>
                      <Select 
                        value={newCheck.priority} 
                        onValueChange={(v: any) => setNewCheck(prev => ({ ...prev, priority: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critique</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="low">Basse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => addCheckMutation.mutate(newCheck)}
                      disabled={!newCheck.requirement || addCheckMutation.isPending}
                      className="w-full"
                    >
                      Ajouter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {checks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune vérification enregistrée
                </div>
              ) : (
                <div className="space-y-3">
                  {checks.map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <p className="font-medium">{check.requirement}</p>
                          <p className="text-sm text-muted-foreground">{check.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {check.framework_name} • Vérifié le {check.last_checked ? new Date(check.last_checked).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(check.priority) as any}>
                          {check.priority}
                        </Badge>
                        <Select 
                          value={check.status} 
                          onValueChange={(v) => updateCheckStatusMutation.mutate({ checkId: check.id, status: v })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="passed">Passé</SelectItem>
                            <SelectItem value="failed">Échoué</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="not_applicable">N/A</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Les preuves de conformité seront listées ici
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports de Conformité</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Les rapports d'audit seront générés ici
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
