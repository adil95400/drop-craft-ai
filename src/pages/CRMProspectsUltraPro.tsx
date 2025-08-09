import { useState } from 'react'
import { Eye, Users, TrendingUp, TrendingDown, Phone, Mail, Calendar, MessageSquare, Target, Star, Plus, Edit, Trash2, MoreHorizontal, Search, Filter, Download, RefreshCw, Bot, Zap, BarChart3, Award, CheckCircle2, AlertTriangle, Clock, Building, MapPin, Euro } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AppLayout } from '@/layouts/AppLayout'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

// Données des prospects
const prospectsData = [
  {
    id: '1',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@techcorp.fr',
    phone: '+33 1 42 34 56 78',
    company: 'TechCorp Solutions',
    position: 'Directeur Commercial',
    country: 'France',
    city: 'Paris',
    source: 'LinkedIn',
    score: 85,
    status: 'hot',
    stage: 'qualified',
    assignedTo: 'Marie Martin',
    createdDate: '2024-01-08',
    lastContact: '2024-01-10',
    nextAction: '2024-01-12',
    estimatedValue: 25000,
    probability: 75,
    industry: 'Technologie',
    companySize: '50-200',
    budget: 'Confirmé',
    timeline: 'Q1 2024',
    painPoints: ['Automatisation', 'Efficacité'],
    interests: ['CRM', 'Analytics'],
    notes: 'Très intéressé par notre solution CRM. Demande une démo personnalisée.',
    interactions: 8,
    lastInteraction: 'Appel téléphonique'
  },
  {
    id: '2',
    firstName: 'Sophie',
    lastName: 'Leroy',
    email: 'sophie.leroy@innovtech.fr',
    phone: '+33 6 12 34 56 78',
    company: 'InnovTech',
    position: 'CEO',
    country: 'France',
    city: 'Lyon',
    source: 'Référencement',
    score: 92,
    status: 'hot',
    stage: 'proposal',
    assignedTo: 'Pierre Dubois',
    createdDate: '2024-01-05',
    lastContact: '2024-01-11',
    nextAction: '2024-01-13',
    estimatedValue: 45000,
    probability: 90,
    industry: 'Startup',
    companySize: '10-50',
    budget: 'Confirmé',
    timeline: 'Immédiat',
    painPoints: ['Croissance', 'Organisation'],
    interests: ['Automation', 'Intégrations'],
    notes: 'Startup en forte croissance. Besoin urgent d\'outils performants.',
    interactions: 12,
    lastInteraction: 'Email'
  },
  {
    id: '3',
    firstName: 'Marc',
    lastName: 'Bernard',
    email: 'marc.bernard@globalcorp.com',
    phone: '+33 4 56 78 90 12',
    company: 'GlobalCorp',
    position: 'Responsable IT',
    country: 'France',
    city: 'Marseille',
    source: 'Site web',
    score: 45,
    status: 'warm',
    stage: 'discovery',
    assignedTo: 'Julie Moreau',
    createdDate: '2024-01-09',
    lastContact: '2024-01-09',
    nextAction: '2024-01-14',
    estimatedValue: 15000,
    probability: 40,
    industry: 'Services',
    companySize: '200-500',
    budget: 'À confirmer',
    timeline: 'Q2 2024',
    painPoints: ['Intégration', 'Formation'],
    interests: ['Support', 'Formation'],
    notes: 'En phase d\'évaluation. Comparaison avec concurrents.',
    interactions: 3,
    lastInteraction: 'Formulaire web'
  },
  {
    id: '4',
    firstName: 'Amélie',
    lastName: 'Rousseau',
    email: 'amelie.rousseau@consulting.fr',
    phone: '+33 2 34 56 78 90',
    company: 'Consulting Excellence',
    position: 'Partner',
    country: 'France',
    city: 'Nantes',
    source: 'Événement',
    score: 68,
    status: 'warm',
    stage: 'interested',
    assignedTo: 'Luc Petit',
    createdDate: '2024-01-07',
    lastContact: '2024-01-10',
    nextAction: '2024-01-15',
    estimatedValue: 35000,
    probability: 60,
    industry: 'Conseil',
    companySize: '50-200',
    budget: 'Confirmé',
    timeline: 'Q1 2024',
    painPoints: ['Reporting', 'Collaboration'],
    interests: ['Analytics', 'Dashboards'],
    notes: 'Rencontrée lors du salon TechExpo. Très engagée.',
    interactions: 6,
    lastInteraction: 'Réunion'
  },
  {
    id: '5',
    firstName: 'Thomas',
    lastName: 'Garcia',
    email: 'thomas.garcia@retailplus.fr',
    phone: '+33 5 67 89 01 23',
    company: 'RetailPlus',
    position: 'Directeur Général',
    country: 'France',
    city: 'Toulouse',
    source: 'Publicité',
    score: 25,
    status: 'cold',
    stage: 'awareness',
    assignedTo: 'Emma Laurent',
    createdDate: '2024-01-11',
    lastContact: '2024-01-11',
    nextAction: '2024-01-16',
    estimatedValue: 8000,
    probability: 20,
    industry: 'Retail',
    companySize: '10-50',
    budget: 'À qualifier',
    timeline: 'À définir',
    painPoints: ['Ventes', 'Inventory'],
    interests: ['E-commerce', 'Stock'],
    notes: 'Premier contact. À qualifier rapidement.',
    interactions: 1,
    lastInteraction: 'Clic publicitaire'
  }
]

// Données d'évolution des prospects
const prospectsEvolution = [
  { date: '01/01', newProspects: 15, qualified: 8, converted: 3, revenue: 45000 },
  { date: '02/01', newProspects: 22, qualified: 12, converted: 4, revenue: 68000 },
  { date: '03/01', newProspects: 18, qualified: 10, converted: 2, revenue: 32000 },
  { date: '04/01', newProspects: 28, qualified: 16, converted: 6, revenue: 95000 },
  { date: '05/01', newProspects: 25, qualified: 14, converted: 5, revenue: 78000 },
  { date: '06/01', newProspects: 31, qualified: 18, converted: 7, revenue: 125000 },
  { date: '07/01', newProspects: 35, qualified: 22, converted: 8, revenue: 142000 },
]

// Pipeline des ventes
const salesPipeline = [
  { stage: 'Awareness', prospects: 45, value: 180000, conversion: 65 },
  { stage: 'Interest', prospects: 32, value: 145000, conversion: 75 },
  { stage: 'Consideration', prospects: 24, value: 125000, conversion: 80 },
  { stage: 'Intent', prospects: 18, value: 95000, conversion: 85 },
  { stage: 'Proposal', prospects: 12, value: 78000, conversion: 90 },
  { stage: 'Negotiation', prospects: 8, value: 65000, conversion: 95 },
]

// Sources de prospects
const sourceData = [
  { name: 'LinkedIn', value: 35, prospects: 142, cost: 45, quality: 4.2 },
  { name: 'Site web', value: 25, prospects: 98, cost: 25, quality: 3.8 },
  { name: 'Référencement', value: 20, prospects: 78, cost: 15, quality: 4.6 },
  { name: 'Événements', value: 12, prospects: 45, cost: 120, quality: 4.4 },
  { name: 'Publicité', value: 8, prospects: 32, cost: 85, quality: 3.2 },
]

// Performance par commercial
const salesRepsData = [
  { name: 'Marie Martin', prospects: 45, qualified: 28, converted: 12, revenue: 285000, target: 300000 },
  { name: 'Pierre Dubois', prospects: 38, qualified: 24, converted: 10, revenue: 245000, target: 250000 },
  { name: 'Julie Moreau', prospects: 32, qualified: 18, converted: 8, revenue: 185000, target: 200000 },
  { name: 'Luc Petit', prospects: 28, qualified: 16, converted: 7, revenue: 165000, target: 180000 },
  { name: 'Emma Laurent', prospects: 25, qualified: 12, converted: 5, revenue: 125000, target: 150000 },
]

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))']

export default function CRMProspectsUltraPro() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [selectedProspect, setSelectedProspect] = useState(null)

  // Calcul des métriques
  const totalProspects = prospectsData.length
  const totalValue = prospectsData.reduce((sum, prospect) => sum + prospect.estimatedValue, 0)
  const avgScore = prospectsData.reduce((sum, prospect) => sum + prospect.score, 0) / totalProspects
  const hotProspects = prospectsData.filter(prospect => prospect.status === 'hot').length

  // Filtrage des données
  const filteredProspects = prospectsData.filter(prospect => {
    const matchesSearch = prospect.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         prospect.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || prospect.status === statusFilter
    const matchesStage = stageFilter === 'all' || prospect.stage === stageFilter
    const matchesSource = sourceFilter === 'all' || prospect.source === sourceFilter
    
    return matchesSearch && matchesStatus && matchesStage && matchesSource
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hot':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">🔥 Chaud</Badge>
      case 'warm':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">🌡️ Tiède</Badge>
      case 'cold':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">❄️ Froid</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'awareness':
        return <Badge variant="outline">Sensibilisation</Badge>
      case 'interested':
        return <Badge variant="secondary">Intéressé</Badge>
      case 'discovery':
        return <Badge variant="secondary">Découverte</Badge>
      case 'qualified':
        return <Badge variant="default">Qualifié</Badge>
      case 'proposal':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Proposition</Badge>
      case 'negotiation':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Négociation</Badge>
      default:
        return <Badge variant="outline">{stage}</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'bg-emerald-500'
    if (probability >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header avec contrôles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Prospects Ultra Pro</h1>
            <p className="text-muted-foreground">Gestion avancée des prospects avec scoring IA et pipeline intelligent</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync leads
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export prospects
            </Button>
            
            <Button size="sm">
              <Bot className="h-4 w-4 mr-2" />
              Scoring IA
            </Button>

            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau prospect
            </Button>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">+{Math.round((totalProspects / 30) * 100) / 100}/jour</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{totalProspects}</p>
                <p className="text-xs text-muted-foreground">Prospects actifs</p>
                <p className="text-xs text-muted-foreground">{hotProspects} prospects chauds</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Target className="h-5 w-5 text-muted-foreground" />
                <Badge variant="default">Score: {Math.round(avgScore)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-muted-foreground">Pipeline total</p>
                <p className="text-xs text-muted-foreground">Score moyen: {Math.round(avgScore)}/100</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <Badge variant="default" className="bg-emerald-100 text-emerald-800">+15.3%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">68%</p>
                <p className="text-xs text-muted-foreground">Taux de conversion</p>
                <p className="text-xs text-muted-foreground">vs mois dernier</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-blue-500" />
                <Badge variant="secondary">12 jours</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">12j</p>
                <p className="text-xs text-muted-foreground">Cycle de vente moyen</p>
                <p className="text-xs text-muted-foreground">-2 jours vs dernier mois</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline de vente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Pipeline de vente intelligent
            </CardTitle>
            <CardDescription>Suivi des prospects par étape avec prédictions IA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesPipeline.map((stage, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {stage.prospects}
                    </div>
                    <div>
                      <p className="font-medium">{stage.stage}</p>
                      <p className="text-sm text-muted-foreground">
                        Conversion: {stage.conversion}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(stage.value)}</p>
                    <Progress value={stage.conversion} className="w-24 h-2 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Graphiques et analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution des prospects */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des prospects</CardTitle>
              <CardDescription>Nouveaux prospects et conversions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={prospectsEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="newProspects" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                    name="Nouveaux prospects"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="converted" 
                    stroke="hsl(var(--secondary))" 
                    fill="hsl(var(--secondary))" 
                    fillOpacity={0.3}
                    name="Convertis"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sources de prospects */}
          <Card>
            <CardHeader>
              <CardTitle>Sources d'acquisition</CardTitle>
              <CardDescription>Performance par canal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {sourceData.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{source.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{source.prospects}</p>
                        <p className="text-xs text-muted-foreground">Qualité: {source.quality}/5</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des prospects */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle>Base de prospects</CardTitle>
                <CardDescription>Gestion intelligente avec scoring automatique</CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher un prospect..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="hot">Chaud</SelectItem>
                    <SelectItem value="warm">Tiède</SelectItem>
                    <SelectItem value="cold">Froid</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Étape" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="awareness">Sensibilisation</SelectItem>
                    <SelectItem value="interested">Intéressé</SelectItem>
                    <SelectItem value="qualified">Qualifié</SelectItem>
                    <SelectItem value="proposal">Proposition</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Site web">Site web</SelectItem>
                    <SelectItem value="Référencement">Référencement</SelectItem>
                    <SelectItem value="Événement">Événement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prospect</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Score IA</TableHead>
                  <TableHead>Valeur estimée</TableHead>
                  <TableHead>Probabilité</TableHead>
                  <TableHead>Prochaine action</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProspects.map((prospect) => (
                  <TableRow key={prospect.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{prospect.firstName} {prospect.lastName}</p>
                        <p className="text-sm text-muted-foreground">{prospect.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {prospect.position} • {prospect.company}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(prospect.status)}
                        {getStageBadge(prospect.stage)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-bold ${getScoreColor(prospect.score)}`}>
                          {prospect.score}
                        </div>
                        <div className="w-12">
                          <Progress value={prospect.score} className="h-2" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold">{formatCurrency(prospect.estimatedValue)}</p>
                        <p className="text-sm text-muted-foreground">
                          {prospect.timeline}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{prospect.probability}%</span>
                        <div className="w-16">
                          <Progress 
                            value={prospect.probability} 
                            className={`h-2 ${getProbabilityColor(prospect.probability)}`}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{formatDate(prospect.nextAction)}</p>
                        <p className="text-xs text-muted-foreground">
                          Assigné à {prospect.assignedTo}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Performance de l'équipe */}
        <Card>
          <CardHeader>
            <CardTitle>Performance de l'équipe commerciale</CardTitle>
            <CardDescription>Suivi des objectifs et résultats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesRepsData.map((rep, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {rep.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium">{rep.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {rep.prospects} prospects • {rep.qualified} qualifiés • {rep.converted} convertis
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(rep.revenue)}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={(rep.revenue / rep.target) * 100} className="w-24 h-2" />
                      <span className="text-sm text-muted-foreground">
                        {Math.round((rep.revenue / rep.target) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}