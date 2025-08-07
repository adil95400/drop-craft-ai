import { useState } from 'react'
import { Calendar as CalendarIcon, Clock, User, MapPin, Video, Phone, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface CalendarEvent {
  id: string
  title: string
  customerName: string
  customerEmail: string
  type: 'meeting' | 'call' | 'demo' | 'follow_up'
  date: string
  duration: number // in minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'
  location?: string
  isVirtual: boolean
  notes?: string
  priority: 'low' | 'medium' | 'high'
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Présentation commerciale',
    customerName: 'Marie Dubois',
    customerEmail: 'marie.dubois@email.com',
    type: 'meeting',
    date: '2024-01-16T10:00:00',
    duration: 60,
    status: 'confirmed',
    location: 'Bureau Paris',
    isVirtual: false,
    notes: 'Présentation de la nouvelle collection',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Appel de suivi',
    customerName: 'Pierre Martin',
    customerEmail: 'p.martin@commerce.fr',
    type: 'call',
    date: '2024-01-16T14:30:00',
    duration: 30,
    status: 'scheduled',
    isVirtual: true,
    notes: 'Suivi de la proposition envoyée',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Démonstration produit',
    customerName: 'Sophie Bernard',
    customerEmail: 'sophie@startupmode.com',
    type: 'demo',
    date: '2024-01-17T11:00:00',
    duration: 45,
    status: 'confirmed',
    isVirtual: true,
    notes: 'Démonstration des fonctionnalités e-commerce',
    priority: 'high'
  },
  {
    id: '4',
    title: 'RDV négociation',
    customerName: 'Lucas Petit',
    customerEmail: 'lucas.petit@retail.com',
    type: 'meeting',
    date: '2024-01-17T15:00:00',
    duration: 90,
    status: 'scheduled',
    location: 'Restaurant Le Commerce',
    isVirtual: false,
    notes: 'Négociation finale du contrat',
    priority: 'high'
  },
  {
    id: '5',
    title: 'Point de suivi client',
    customerName: 'Emma Durand',
    customerEmail: 'emma.durand@boutique.fr',
    type: 'follow_up',
    date: '2024-01-18T09:30:00',
    duration: 30,
    status: 'scheduled',
    isVirtual: true,
    notes: 'Suivi satisfaction post-achat',
    priority: 'low'
  }
]

export default function CRMCalendar() {
  const [events, setEvents] = useState(mockEvents)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [newEvent, setNewEvent] = useState({
    title: '',
    customerName: '',
    customerEmail: '',
    type: 'meeting' as const,
    date: '',
    time: '',
    duration: '60',
    isVirtual: false,
    location: '',
    notes: '',
    priority: 'medium' as const
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <User className="h-4 w-4 text-blue-500" />
      case 'call': return <Phone className="h-4 w-4 text-green-500" />
      case 'demo': return <Video className="h-4 w-4 text-purple-500" />
      case 'follow_up': return <Clock className="h-4 w-4 text-orange-500" />
      default: return <CalendarIcon className="h-4 w-4" />
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'meeting': return 'Rendez-vous'
      case 'call': return 'Appel'
      case 'demo': return 'Démonstration'
      case 'follow_up': return 'Suivi'
      default: return 'Événement'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programmé'
      case 'confirmed': return 'Confirmé'
      case 'completed': return 'Terminé'
      case 'cancelled': return 'Annulé'
      case 'rescheduled': return 'Reporté'
      default: return 'Inconnu'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-500'
    }
  }

  // Filter events for the current week (simplified for demo)
  const getWeekEvents = () => {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))
    
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= startOfWeek && eventDate <= endOfWeek
    })
  }

  const getTodayEvents = () => {
    const today = new Date().toDateString()
    return events.filter(event => new Date(event.date).toDateString() === today)
  }

  const stats = {
    todayEvents: getTodayEvents().length,
    weekEvents: getWeekEvents().length,
    confirmedEvents: events.filter(e => e.status === 'confirmed').length,
    upcomingEvents: events.filter(e => new Date(e.date) > new Date() && e.status !== 'cancelled').length
  }

  const formatEventTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Calendrier CRM</h1>
          <p className="text-muted-foreground">Gérez vos rendez-vous et appels clients</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau RDV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Programmer un nouveau rendez-vous</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Titre</label>
                    <Input 
                      placeholder="Objet du rendez-vous"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <Select value={newEvent.type} onValueChange={(value) => setNewEvent({...newEvent, type: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Rendez-vous</SelectItem>
                        <SelectItem value="call">Appel</SelectItem>
                        <SelectItem value="demo">Démonstration</SelectItem>
                        <SelectItem value="follow_up">Suivi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Client</label>
                    <Input 
                      placeholder="Nom du client"
                      value={newEvent.customerName}
                      onChange={(e) => setNewEvent({...newEvent, customerName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input 
                      type="email"
                      placeholder="email@client.com"
                      value={newEvent.customerEmail}
                      onChange={(e) => setNewEvent({...newEvent, customerEmail: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <Input 
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Heure</label>
                    <Input 
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Durée (min)</label>
                    <Select value={newEvent.duration} onValueChange={(value) => setNewEvent({...newEvent, duration: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">1 heure</SelectItem>
                        <SelectItem value="90">1h30</SelectItem>
                        <SelectItem value="120">2 heures</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Lieu / Lien</label>
                    <Input 
                      placeholder="Adresse ou lien visio"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Priorité</label>
                    <Select value={newEvent.priority} onValueChange={(value) => setNewEvent({...newEvent, priority: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Textarea 
                    placeholder="Informations complémentaires..."
                    rows={3}
                    value={newEvent.notes}
                    onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">Programmer</Button>
                  <Button variant="outline" className="flex-1">Programmer & Envoyer Invitation</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayEvents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Cette Semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-500" />
              Confirmés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmedEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-purple-500" />
              À Venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {getTodayEvents().map((event) => (
              <div
                key={event.id}
                className={`border-l-4 ${getPriorityColor(event.priority)} bg-muted/50 p-4 rounded-r-md`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(event.type)}
                    <h4 className="font-medium">{event.title}</h4>
                  </div>
                  <Badge className={getStatusColor(event.status)} variant="outline">
                    {getStatusText(event.status)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {formatEventTime(event.date)} ({event.duration} min)
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {event.customerName}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      {event.isVirtual ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {getTodayEvents().length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Aucun rendez-vous aujourd'hui
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Prochains Rendez-vous
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events
              .filter(event => new Date(event.date) > new Date() && event.status !== 'cancelled')
              .slice(0, 5)
              .map((event) => (
                <div
                  key={event.id}
                  className={`border-l-4 ${getPriorityColor(event.priority)} bg-muted/50 p-4 rounded-r-md`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(event.type)}
                      <h4 className="font-medium">{event.title}</h4>
                    </div>
                    <Badge className={getStatusColor(event.status)} variant="outline">
                      {getStatusText(event.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3" />
                      {formatEventDate(event.date)} à {formatEventTime(event.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {event.customerName}
                    </div>
                    {event.notes && (
                      <div className="text-xs bg-white p-2 rounded border">
                        {event.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}