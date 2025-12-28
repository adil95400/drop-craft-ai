import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, Send, Eye, MousePointer, AlertTriangle, Ban, Loader2,
  TrendingUp, TrendingDown, Search, Plus, Trash2, RefreshCw
} from 'lucide-react'
import { useEmailDeliverability } from '@/hooks/useEmailDeliverability'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export function DeliverabilityStats() {
  const { 
    unsubscribes, sendingLogs, deliverabilityStats, overallStats, logsByStatus,
    isLoading, addUnsubscribe, removeUnsubscribe 
  } = useEmailDeliverability()
  
  const [showAddUnsubscribeDialog, setShowAddUnsubscribeDialog] = useState(false)
  const [newUnsubscribe, setNewUnsubscribe] = useState({ email: '', reason: '' })
  const [searchLogs, setSearchLogs] = useState('')

  const handleAddUnsubscribe = () => {
    if (!newUnsubscribe.email) return
    addUnsubscribe(newUnsubscribe)
    setShowAddUnsubscribeDialog(false)
    setNewUnsubscribe({ email: '', reason: '' })
  }

  const filteredLogs = sendingLogs.filter(log => 
    log.recipient_email.toLowerCase().includes(searchLogs.toLowerCase())
  )

  const chartData = deliverabilityStats.slice(0, 14).reverse().map(stat => ({
    date: format(new Date(stat.date), 'dd/MM', { locale: fr }),
    delivered: stat.delivered_count,
    opened: stat.opened_count,
    clicked: stat.clicked_count,
    bounced: stat.bounced_count
  }))

  const pieData = [
    { name: 'Délivrés', value: logsByStatus.delivered || 0, color: '#22c55e' },
    { name: 'Ouverts', value: logsByStatus.opened || 0, color: '#3b82f6' },
    { name: 'Cliqués', value: logsByStatus.clicked || 0, color: '#8b5cf6' },
    { name: 'Rebonds', value: logsByStatus.bounced || 0, color: '#ef4444' },
    { name: 'Échoués', value: logsByStatus.failed || 0, color: '#f59e0b' }
  ].filter(d => d.value > 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Send className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Délivrabilité</p>
                <p className="text-2xl font-bold">{overallStats.deliveryRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux d'ouverture</p>
                <p className="text-2xl font-bold">{overallStats.openRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MousePointer className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de clic</p>
                <p className="text-2xl font-bold">{overallStats.clickRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de rebond</p>
                <p className="text-2xl font-bold">{overallStats.bounceRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${overallStats.avgReputationScore >= 80 ? 'bg-green-500/10' : overallStats.avgReputationScore >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                <Shield className={`h-5 w-5 ${overallStats.avgReputationScore >= 80 ? 'text-green-500' : overallStats.avgReputationScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score réputation</p>
                <p className="text-2xl font-bold">{overallStats.avgReputationScore.toFixed(0)}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="logs">Logs d'envoi ({sendingLogs.length})</TabsTrigger>
          <TabsTrigger value="unsubscribes">Désabonnements ({unsubscribes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution sur 14 jours</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="delivered" stroke="#22c55e" name="Délivrés" />
                      <Line type="monotone" dataKey="opened" stroke="#3b82f6" name="Ouverts" />
                      <Line type="monotone" dataKey="clicked" stroke="#8b5cf6" name="Cliqués" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des statuts</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recommandations pour améliorer la délivrabilité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {overallStats.bounceRate < 2 ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      <h4 className="font-medium">Taux de rebond</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overallStats.bounceRate < 2 
                        ? 'Excellent ! Votre taux de rebond est sous contrôle.'
                        : 'Nettoyez régulièrement votre liste d\'emails pour réduire les rebonds.'}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {overallStats.openRate > 20 ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-yellow-500" />
                      )}
                      <h4 className="font-medium">Taux d'ouverture</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overallStats.openRate > 20 
                        ? 'Bon taux d\'ouverture ! Vos objets sont pertinents.'
                        : 'Testez différents objets avec des tests A/B pour améliorer ce taux.'}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className={`h-5 w-5 ${overallStats.avgReputationScore >= 80 ? 'text-green-500' : 'text-yellow-500'}`} />
                      <h4 className="font-medium">Réputation</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overallStats.avgReputationScore >= 80 
                        ? 'Excellente réputation d\'expéditeur !'
                        : 'Améliorez votre réputation en réduisant les plaintes et rebonds.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Logs d'envoi</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher par email..." 
                    value={searchLogs}
                    onChange={(e) => setSearchLogs(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun log d'envoi</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-auto">
                  {filteredLogs.slice(0, 100).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={log.status} />
                        <div>
                          <p className="font-medium">{log.recipient_email}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.provider}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unsubscribes" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des désabonnements</CardTitle>
                <Button onClick={() => setShowAddUnsubscribeDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter manuellement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {unsubscribes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun désabonnement</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-auto">
                  {unsubscribes.map((unsub) => (
                    <div key={unsub.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                          <Ban className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium">{unsub.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {unsub.reason || 'Aucune raison spécifiée'} • {format(new Date(unsub.unsubscribed_at), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => removeUnsubscribe(unsub.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Unsubscribe Dialog */}
      <Dialog open={showAddUnsubscribeDialog} onOpenChange={setShowAddUnsubscribeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un désabonnement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                placeholder="email@exemple.com"
                value={newUnsubscribe.email}
                onChange={(e) => setNewUnsubscribe({ ...newUnsubscribe, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Raison (optionnel)</Label>
              <Input 
                placeholder="Raison du désabonnement"
                value={newUnsubscribe.reason}
                onChange={(e) => setNewUnsubscribe({ ...newUnsubscribe, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUnsubscribeDialog(false)}>Annuler</Button>
            <Button onClick={handleAddUnsubscribe} disabled={!newUnsubscribe.email}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    sent: { label: 'Envoyé', variant: 'secondary' },
    delivered: { label: 'Délivré', variant: 'default' },
    opened: { label: 'Ouvert', variant: 'default' },
    clicked: { label: 'Cliqué', variant: 'default' },
    bounced: { label: 'Rebond', variant: 'destructive' },
    complained: { label: 'Plainte', variant: 'destructive' },
    failed: { label: 'Échoué', variant: 'destructive' }
  }
  const { label, variant } = config[status] || { label: status, variant: 'secondary' }
  return <Badge variant={variant}>{label}</Badge>
}
