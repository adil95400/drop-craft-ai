import React, { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  Users, 
  MapPin,
  Phone,
  Video,
  Mail,
  Edit,
  Trash2
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  type: 'meeting' | 'call' | 'email' | 'task' | 'demo'
  date: Date
  time: string
  duration: number
  attendees: string[]
  location?: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress'
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Démonstration produit - Entreprise XYZ',
    type: 'demo',
    date: new Date(),
    time: '10:00',
    duration: 60,
    attendees: ['Marie Dubois', 'Pierre Martin'],
    location: 'Salle de conférence A',
    description: 'Présentation des nouvelles fonctionnalités IA',
    priority: 'high',
    status: 'scheduled'
  },
  {
    id: '2',
    title: 'Appel de suivi - Client ABC',
    type: 'call',
    date: new Date(),
    time: '14:30',
    duration: 30,
    attendees: ['Sophie Lemaire'],
    description: 'Suivi satisfaction après implémentation',
    priority: 'medium',
    status: 'scheduled'
  },
  {
    id: '3',
    title: 'Réunion équipe commerciale',
    type: 'meeting',
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    time: '09:00',
    duration: 90,
    attendees: ['Équipe commerciale'],
    location: 'Bureau principal',
    description: 'Revue des objectifs mensuels',
    priority: 'medium',
    status: 'scheduled'
  }
]

export default function CRMCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [events] = useState<CalendarEvent[]>(mockEvents)
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="h-4 w-4" />
      case 'call': return <Phone className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'demo': return <Video className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800'
      case 'call': return 'bg-green-100 text-green-800'
      case 'email': return 'bg-purple-100 text-purple-800'
      case 'demo': return 'bg-orange-100 text-orange-800'
      case 'task': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-300'
    }
  }

  const getTodaysEvents = () => {
    if (!selectedDate) return []
    return events.filter(event => 
      event.date.toDateString() === selectedDate.toDateString()
    ).sort((a, b) => a.time.localeCompare(b.time))
  }

  const getUpcomingEvents = () => {
    const today = new Date()
    return events
      .filter(event => event.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Calendrier CRM</h1>
          <p className="text-muted-foreground">
            Gérez vos rendez-vous et activités commerciales
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'day' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Jour
          </Button>
          <Button 
            variant={viewMode === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Semaine
          </Button>
          <Button 
            variant={viewMode === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Mois
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau RDV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendrier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
            
            <div className="mt-4 space-y-3">
              <h4 className="font-medium">Prochains événements</h4>
              {getUpcomingEvents().map((event) => (
                <div key={event.id} className="flex items-center gap-2 text-sm">
                  {getEventTypeIcon(event.type)}
                  <div className="flex-1 truncate">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-muted-foreground">
                      {event.date.toLocaleDateString('fr-FR')} • {event.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Events for selected date */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              Événements du {selectedDate?.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getTodaysEvents().length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun événement</h3>
                  <p className="text-muted-foreground mb-4">
                    Aucun événement prévu pour cette date
                  </p>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter un événement
                  </Button>
                </div>
              ) : (
                getTodaysEvents().map((event) => (
                  <Card key={event.id} className={`border-l-4 ${getPriorityColor(event.priority)}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getEventTypeIcon(event.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{event.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.time} ({event.duration}min)
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getEventTypeColor(event.type)}>
                                {event.type}
                              </Badge>
                              <Badge variant="outline">
                                {event.attendees.length} participant{event.attendees.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {event.attendees.join(', ')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Rejoindre
                          </Button>
                          <Button size="sm">
                            Modifier
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}