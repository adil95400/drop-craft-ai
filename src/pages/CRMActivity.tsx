import { useState } from 'react'
import { Activity, Mail, Phone, Calendar, FileText, Search, Filter, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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

const mockActivities: ActivityRecord[] = [
  {
    id: '1',
    type: 'email',
    customerName: 'Marie Dubois',
    customerEmail: 'marie.dubois@email.com',
    title: 'Email de suivi commercial',
    description: 'Envoi de la proposition commerciale pour la collection printemps',
    date: '2024-01-15T14:30:00',
    status: 'completed',
    priority: 'high',
    outcome: 'Proposition envoyée, client intéressé',
    nextAction: 'Rappel prévu dans 3 jours'
  },
  {
    id: '2',
    type: 'call',
    customerName: 'Pierre Martin',
    customerEmail: 'p.martin@commerce.fr',
    title: 'Appel de prospection',
    description: 'Premier contact pour présenter nos services',
    date: '2024-01-15T11:15:00',
    status: 'completed',
    priority: 'medium',
    outcome: 'Intéressé, demande plus d\'informations',
    nextAction: 'Envoyer catalogue détaillé'
  },
  {
    id: '3',
    type: 'meeting',
    customerName: 'Sophie Bernard',
    customerEmail: 'sophie@startupmode.com',
    title: 'Rendez-vous commercial',
    description: 'Présentation de nos solutions e-commerce',
    date: '2024-01-16T10:00:00',
    status: 'scheduled',
    priority: 'high'
  },
  {
    id: '4',
    type: 'note',
    customerName: 'Lucas Petit',
    customerEmail: 'lucas.petit@retail.com',
    title: 'Note de suivi',
    description: 'Client demande des modifications sur la proposition',
    date: '2024-01-14T16:00:00',
    status: 'completed',
    priority: 'medium',
    outcome: 'Modifications acceptées',
    nextAction: 'Nouvelle proposition à envoyer'
  },
  {
    id: '5',
    type: 'order',
    customerName: 'Emma Durand',
    customerEmail: 'emma.durand@boutique.fr',
    title: 'Nouvelle commande',
    description: 'Commande n°ORD-2024-156 - 50 articles',
    date: '2024-01-15T09:45:00',
    status: 'completed',
    priority: 'high',
    outcome: 'Commande confirmée et traitée'
  }
]

export default function CRMActivity() {
  const [activities, setActivities] = useState(mockActivities)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Activité Client</h1>
          <p className="text-muted-foreground">Suivi de toutes les interactions clients</p>
        </div>
        <Button className="gap-2">
          <Activity className="h-4 w-4" />
          Nouvelle Activité
        </Button>
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
      <div className="flex gap-4 items-center">
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
          <SelectTrigger className="w-48">
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
          <SelectTrigger className="w-48">
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
          <SelectTrigger className="w-48">
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
                    <div className="flex items-center gap-3 mb-2">
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
                      <strong>{activity.customerName}</strong> • {activity.customerEmail}
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
            <p className="text-muted-foreground mb-4">Commencez à enregistrer vos interactions clients</p>
            <Button>Nouvelle activité</Button>
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
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Mail className="h-6 w-6" />
              <span className="text-sm">Envoyer Email</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Phone className="h-6 w-6" />
              <span className="text-sm">Passer Appel</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Programmer RDV</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-sm">Ajouter Note</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}