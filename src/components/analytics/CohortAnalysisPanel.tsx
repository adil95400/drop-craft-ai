import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  HelpCircle
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  AreaChart,
  Area,
  Legend
} from 'recharts'
import { toast } from 'sonner'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CohortRow {
  cohort: string
  users: number
  week1: number
  week2: number
  week3: number
  week4: number
  week5: number
  week6: number
  week7: number
  week8: number
}

const cohortData: CohortRow[] = [
  { cohort: 'Oct 2024', users: 1250, week1: 100, week2: 65, week3: 48, week4: 35, week5: 28, week6: 22, week7: 18, week8: 15 },
  { cohort: 'Nov 2024', users: 1420, week1: 100, week2: 68, week3: 52, week4: 40, week5: 32, week6: 25, week7: 20, week8: 0 },
  { cohort: 'Déc 2024', users: 1580, week1: 100, week2: 72, week3: 55, week4: 42, week5: 34, week6: 28, week7: 0, week8: 0 },
  { cohort: 'Jan 2025', users: 1890, week1: 100, week2: 75, week3: 58, week4: 45, week5: 36, week6: 0, week7: 0, week8: 0 },
  { cohort: 'Fév 2025', users: 2150, week1: 100, week2: 78, week3: 60, week4: 48, week5: 0, week6: 0, week7: 0, week8: 0 },
  { cohort: 'Mar 2025', users: 2340, week1: 100, week2: 80, week3: 62, week4: 0, week5: 0, week6: 0, week7: 0, week8: 0 },
]

const retentionTrendData = [
  { week: 'S1', avg: 100, best: 100, current: 100 },
  { week: 'S2', avg: 72, best: 80, current: 78 },
  { week: 'S3', avg: 55, best: 62, current: 60 },
  { week: 'S4', avg: 42, best: 48, current: 45 },
  { week: 'S5', avg: 33, best: 38, current: 36 },
  { week: 'S6', avg: 26, best: 30, current: 28 },
  { week: 'S7', avg: 20, best: 24, current: 22 },
  { week: 'S8', avg: 16, best: 20, current: 18 },
]

const behaviorData = [
  { action: 'Première visite', week1: 100, week2: 45, week3: 28, week4: 18 },
  { action: 'Vue produit', week1: 85, week2: 52, week3: 35, week4: 25 },
  { action: 'Ajout panier', week1: 35, week2: 22, week3: 15, week4: 12 },
  { action: 'Achat', week1: 12, week2: 8, week3: 6, week4: 5 },
  { action: 'Achat répété', week1: 0, week2: 3, week3: 4, week4: 5 },
]

const getRetentionColor = (value: number) => {
  if (value === 0) return 'bg-muted text-muted-foreground'
  if (value >= 70) return 'bg-green-500/20 text-green-600'
  if (value >= 50) return 'bg-green-400/20 text-green-500'
  if (value >= 35) return 'bg-yellow-500/20 text-yellow-600'
  if (value >= 20) return 'bg-orange-500/20 text-orange-600'
  return 'bg-red-500/20 text-red-600'
}

export function CohortAnalysisPanel() {
  const [period, setPeriod] = useState('monthly')
  const [metric, setMetric] = useState('retention')
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setRefreshing(false)
    toast.success('Données actualisées')
  }

  const handleExport = () => {
    toast.success('Export des cohortes démarré')
  }

  const avgRetention = cohortData.reduce((sum, c) => sum + c.week4, 0) / cohortData.length
  const latestCohortRetention = cohortData[cohortData.length - 2].week4
  const retentionChange = latestCohortRetention - avgRetention

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Analyse de Cohortes
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Suivez la rétention des utilisateurs au fil du temps, regroupés par période d'acquisition.</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </h2>
          <p className="text-muted-foreground">
            Suivez la rétention et le comportement des utilisateurs par cohorte
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
              <SelectItem value="quarterly">Trimestriel</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retention">Rétention</SelectItem>
              <SelectItem value="revenue">Revenu</SelectItem>
              <SelectItem value="orders">Commandes</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs Totaux</p>
                <p className="text-2xl font-bold text-primary">
                  {cohortData.reduce((sum, c) => sum + c.users, 0).toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rétention Moyenne (S4)</p>
                <p className="text-2xl font-bold text-green-500">{avgRetention.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dernière Cohorte (S4)</p>
                <p className="text-2xl font-bold text-blue-500">{latestCohortRetention}%</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Évolution</p>
                <p className={`text-2xl font-bold flex items-center gap-1 ${retentionChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {retentionChange >= 0 ? (
                    <ArrowUpRight className="h-5 w-5" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5" />
                  )}
                  {Math.abs(retentionChange).toFixed(1)}%
                </p>
              </div>
              {retentionChange >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500 opacity-50" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix">Matrice de Rétention</TabsTrigger>
          <TabsTrigger value="trends">Courbes de Rétention</TabsTrigger>
          <TabsTrigger value="behavior">Comportement Utilisateur</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Matrice de Rétention</CardTitle>
              <CardDescription>Pourcentage d'utilisateurs actifs par semaine après acquisition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Cohorte</th>
                      <th className="text-center p-2 font-medium">Utilisateurs</th>
                      <th className="text-center p-2 font-medium">S1</th>
                      <th className="text-center p-2 font-medium">S2</th>
                      <th className="text-center p-2 font-medium">S3</th>
                      <th className="text-center p-2 font-medium">S4</th>
                      <th className="text-center p-2 font-medium">S5</th>
                      <th className="text-center p-2 font-medium">S6</th>
                      <th className="text-center p-2 font-medium">S7</th>
                      <th className="text-center p-2 font-medium">S8</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map((row, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 font-medium">{row.cohort}</td>
                        <td className="p-2 text-center text-muted-foreground">{row.users.toLocaleString()}</td>
                        <td className={`p-2 text-center rounded ${getRetentionColor(row.week1)}`}>{row.week1}%</td>
                        <td className={`p-2 text-center rounded ${getRetentionColor(row.week2)}`}>{row.week2}%</td>
                        <td className={`p-2 text-center rounded ${getRetentionColor(row.week3)}`}>{row.week3}%</td>
                        <td className={`p-2 text-center rounded ${getRetentionColor(row.week4)}`}>{row.week4 || '-'}%</td>
                        <td className={`p-2 text-center rounded ${getRetentionColor(row.week5)}`}>{row.week5 || '-'}%</td>
                        <td className={`p-2 text-center rounded ${getRetentionColor(row.week6)}`}>{row.week6 || '-'}%</td>
                        <td className={`p-2 text-center rounded ${getRetentionColor(row.week7)}`}>{row.week7 || '-'}%</td>
                        <td className={`p-2 text-center rounded ${getRetentionColor(row.week8)}`}>{row.week8 || '-'}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="text-muted-foreground">Légende:</span>
                <Badge className="bg-green-500/20 text-green-600">≥70%</Badge>
                <Badge className="bg-green-400/20 text-green-500">50-69%</Badge>
                <Badge className="bg-yellow-500/20 text-yellow-600">35-49%</Badge>
                <Badge className="bg-orange-500/20 text-orange-600">20-34%</Badge>
                <Badge className="bg-red-500/20 text-red-600">&lt;20%</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Courbes de Rétention</CardTitle>
              <CardDescription>Comparaison de la rétention moyenne vs meilleure cohorte vs cohorte actuelle</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={retentionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => `${value}%`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="avg" name="Moyenne" stroke="#6b7280" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="best" name="Meilleure" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="current" name="Actuelle" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comportement par Action</CardTitle>
              <CardDescription>Évolution des actions utilisateur au fil des semaines</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={behaviorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="action" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => `${value}%`}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="week1" name="Semaine 1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="week2" name="Semaine 2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="week3" name="Semaine 3" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="week4" name="Semaine 4" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
