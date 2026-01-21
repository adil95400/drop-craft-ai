import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Activity, Mail, Phone, Calendar, FileText, Search, Filter, Clock, User, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ActivityRecord {
  id: string
  type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'order'
  customerName: string
  customerEmail: string
  title: string
  description: string
  date: string
  status: 'completed' | 'pending' | 'scheduled'
  priority: 'low' | 'medium' | 'high'
  outcome?: string
  nextAction?: string
}

export default function CRMActivity() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Fetch activities from activity_logs table
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['crm-activities'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      return (data || []).map((log): ActivityRecord => {
        const details = log.details as any || {}
        return {
          id: log.id,
          type: mapActionToType(log.action),
          customerName: details.customer_name || 'Client',
          customerEmail: details.customer_email || '',
          title: log.description || log.action,
          description: details.description || log.description || '',
          date: log.created_at || new Date().toISOString(),
          status: details.status || 'completed',
          priority: details.priority || 'medium',
          outcome: details.outcome,
          nextAction: details.next_action
        }
      })
    }
  })

  function mapActionToType(action: string): ActivityRecord['type'] {
    if (action.includes('email') || action.includes('Email')) return 'email'
    if (action.includes('call') || action.includes('Appel')) return 'call'
    if (action.includes('meeting') || action.includes('RDV')) return 'meeting'
    if (action.includes('order') || action.includes('Commande')) return 'order'
    if (action.includes('task') || action.includes('Tâche')) return 'task'
    return 'note'
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || activity.type === typeFilter
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter
    
    let matchesDate = true
    if (dateFilter !== 'all') {
      const activityDate = new Date(activity.date)
      const now = new Date()
      
      switch (dateFilter) {
        case 'today':
          matchesDate = activityDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = activityDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = activityDate >= monthAgo
          break
      }
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4 text-blue-500" />
      case 'call': return <Phone className="h-4 w-4 text-green-500" />
      case 'meeting': return <Calendar className="h-4 w-4 text-purple-500" />
      case 'note': return <FileText className="h-4 w-4 text-orange-500" />
      case 'task': return <Activity className="h-4 w-4 text-red-500" />
      case 'order': return <FileText className="h-4 w-4 text-emerald-500" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'email': return 'Email'
      case 'call': return 'Appel'
      case 'meeting': return 'RDV'
      case 'note': return 'Note'
      case 'task': return 'Tâche'
      case 'order': return 'Commande'
      default: return 'Activité'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé'
      case 'pending': return 'En attente'
      case 'scheduled': return 'Programmé'
      default: return 'Inconnu'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    totalActivities: activities.length,
    todayActivities: activities.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length,
    completedToday: activities.filter(a => a.status === 'completed' && new Date(a.date).toDateString() === new Date().toDateString()).length,
    scheduledActivities: activities.filter(a => a.status === 'scheduled').length
  }

  const handleQuickAction = async (actionType: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté', variant: 'destructive' })
      return
    }

    const actionMap: Record<string, string> = {
      email: 'Email envoyé',
      call: 'Appel effectué',
      meeting: 'RDV programmé',
      note: 'Note ajoutée'
    }

    const { error } = await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: actionMap[actionType] || 'Action effectuée',
      description: `${actionMap[actionType] || 'Action'} - ${new Date().toLocaleString('fr-FR')}`,
      entity_type: 'crm',
      severity: 'info',
      details: { type: actionType, status: 'completed', priority: 'medium' }
    })

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible d\'enregistrer l\'activité', variant: 'destructive' })
    } else {
      toast({ title: 'Succès', description: actionMap[actionType] || 'Action enregistrée' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement des activités...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Activité Client</h1>
          <p className="text-muted-foreground">Suivi de toutes les interactions clients</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Activité
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une activité</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select defaultValue="note">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Appel</SelectItem>
                    <SelectItem value="meeting">Rendez-vous</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="task">Tâche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Décrivez l'activité..." />
              </div>
              <Button className="w-full" onClick={() => setIsAddDialogOpen(false)}>
                Ajouter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Total Activités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayActivities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Terminées Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              Programmées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledActivities}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une activité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="email">Emails</SelectItem>
            <SelectItem value="call">Appels</SelectItem>
            <SelectItem value="meeting">Rendez-vous</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
            <SelectItem value="order">Commandes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="scheduled">Programmé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toute la période</SelectItem>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activities Timeline */}
      <div className="space-y-4">
        {filteredActivities.map((activity) => (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {getTypeIcon(activity.type)}
                      <h3 className="font-semibold">{activity.title}</h3>
                      <Badge className={getStatusColor(activity.status)}>
                        {getStatusText(activity.status)}
                      </Badge>
                      <Badge className={getPriorityColor(activity.priority)} variant="outline">
                        {activity.priority === 'high' && 'Haute'}
                        {activity.priority === 'medium' && 'Moyenne'}
                        {activity.priority === 'low' && 'Faible'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>{activity.customerName}</strong> 
                      {activity.customerEmail && ` • ${activity.customerEmail}`}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {activity.description}
                    </p>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.date).toLocaleDateString('fr-FR')} à {new Date(activity.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      <span>•</span>
                      <span>{getTypeText(activity.type)}</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">Détails</Button>
              </div>

              {activity.outcome && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-md mb-3">
                  <div className="text-sm">
                    <strong>Résultat:</strong> {activity.outcome}
                  </div>
                </div>
              )}

              {activity.nextAction && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                  <div className="text-sm">
                    <strong>Action suivante:</strong> {activity.nextAction}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune activité trouvée</h3>
            <p className="text-muted-foreground mb-4">
              {activities.length === 0 
                ? 'Commencez à enregistrer vos interactions clients' 
                : 'Aucune activité ne correspond aux filtres'}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>Nouvelle activité</Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleQuickAction('email')}>
              <Mail className="h-6 w-6" />
              <span className="text-sm">Envoyer Email</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleQuickAction('call')}>
              <Phone className="h-6 w-6" />
              <span className="text-sm">Passer Appel</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleQuickAction('meeting')}>
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Programmer RDV</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleQuickAction('note')}>
              <FileText className="h-6 w-6" />
              <span className="text-sm">Ajouter Note</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
