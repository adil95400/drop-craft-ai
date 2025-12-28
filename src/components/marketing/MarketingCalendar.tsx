import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar as CalendarIcon, Plus, Download,
  Mail, MessageSquare, Share2, Target, Clock, Users, Trash2
} from 'lucide-react'
import { useMarketingEvents, type MarketingEvent } from '@/hooks/useMarketingEvents'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function MarketingCalendar() {
  const { events, isLoading, createEvent, deleteEvent } = useMarketingEvents()
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'campaign' as const,
    date: new Date(),
    priority: 'medium' as const,
    tags: ''
  })

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'campaign': return <Target className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'social': return <Share2 className="h-4 w-4" />
      case 'event': return <Users className="h-4 w-4" />
      case 'deadline': return <Clock className="h-4 w-4" />
      default: return <CalendarIcon className="h-4 w-4" />
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'campaign': return 'bg-primary/10 text-primary border-primary/20'
      case 'email': return 'bg-secondary/10 text-secondary border-secondary/20'
      case 'social': return 'bg-accent/10 text-accent border-accent/20'
      case 'event': return 'bg-warning/10 text-warning border-warning/20'
      case 'deadline': return 'bg-destructive/10 text-destructive border-destructive/20'
      default: return 'bg-muted text-muted-foreground border-muted'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive border-destructive'
      case 'medium': return 'text-warning border-warning'
      case 'low': return 'text-secondary border-secondary'
      default: return 'text-muted-foreground border-muted'
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const getDatesWithEvents = () => {
    return events.map(event => new Date(event.date))
  }

  const filteredEvents = events.filter(event => 
    filterType === 'all' || event.type === filterType
  )

  const handleCreateEvent = async () => {
    await createEvent.mutateAsync({
      title: newEvent.title,
      description: newEvent.description,
      type: newEvent.type,
      status: 'scheduled',
      date: newEvent.date,
      priority: newEvent.priority,
      tags: newEvent.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    })
    
    setIsCreateEventOpen(false)
    setNewEvent({
      title: '',
      description: '',
      type: 'campaign',
      date: new Date(),
      priority: 'medium',
      tags: ''
    })
    
    toast({
      title: "Événement créé",
      description: "L'événement a été ajouté au calendrier"
    })
  }

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent.mutateAsync(eventId)
    toast({
      title: "Événement supprimé",
      description: "L'événement a été retiré du calendrier"
    })
  }

  const handleExport = () => {
    const data = events.map(e => ({
      titre: e.title,
      description: e.description,
      type: e.type,
      date: new Date(e.date).toLocaleDateString('fr-FR'),
      priorité: e.priority,
      tags: e.tags.join(', ')
    }))
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'calendrier-marketing.json'
    a.click()
    
    toast({
      title: "Export réussi",
      description: "Le calendrier a été exporté"
    })
  }

  const renderEventList = () => {
    const eventsToShow = selectedDate ? getEventsForDate(selectedDate) : filteredEvents

    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-64" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (eventsToShow.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {selectedDate 
            ? `Aucun événement prévu le ${selectedDate.toLocaleDateString('fr-FR')}`
            : 'Aucun événement trouvé'
          }
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {eventsToShow.map((event) => (
          <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getEventTypeIcon(event.type)}
                    <h4 className="font-medium">{event.title}</h4>
                    <Badge className={getEventTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={getPriorityColor(event.priority)}
                    >
                      {event.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                    {event.endDate && (
                      <span>→ {new Date(event.endDate).toLocaleDateString('fr-FR')}</span>
                    )}
                    <span>{new Date(event.date).toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</span>
                  </div>
                  
                  {event.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {event.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteEvent(event.id)
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Calendrier Marketing</h2>
          <p className="text-muted-foreground">
            Planifiez et organisez vos campagnes marketing
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="campaign">Campagnes</SelectItem>
              <SelectItem value="email">Emails</SelectItem>
              <SelectItem value="social">Réseaux sociaux</SelectItem>
              <SelectItem value="event">Événements</SelectItem>
              <SelectItem value="deadline">Deadlines</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
          
          <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvel Événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un Événement Marketing</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="event-title">Titre</Label>
                  <Input
                    id="event-title"
                    placeholder="Nom de l'événement"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="event-description">Description</Label>
                  <Textarea
                    id="event-description"
                    placeholder="Description de l'événement..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="event-type">Type</Label>
                  <Select 
                    value={newEvent.type} 
                    onValueChange={(value: any) => setNewEvent({ ...newEvent, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campaign">Campagne</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="social">Réseaux sociaux</SelectItem>
                      <SelectItem value="event">Événement</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="event-priority">Priorité</Label>
                  <Select 
                    value={newEvent.priority} 
                    onValueChange={(value: any) => setNewEvent({ ...newEvent, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="event-tags">Tags (séparés par des virgules)</Label>
                  <Input
                    id="event-tags"
                    placeholder="tag1, tag2, tag3"
                    value={newEvent.tags}
                    onChange={(e) => setNewEvent({ ...newEvent, tags: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateEventOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateEvent} 
                  disabled={!newEvent.title.trim() || createEvent.isPending} 
                  className="flex-1"
                >
                  {createEvent.isPending ? 'Création...' : 'Créer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendrier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className={cn("w-full pointer-events-auto")}
              modifiers={{
                hasEvents: getDatesWithEvents()
              }}
              modifiersStyles={{
                hasEvents: { 
                  backgroundColor: 'hsl(var(--primary))', 
                  color: 'white',
                  fontWeight: 'bold'
                }
              }}
            />
            
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Jours avec événements</span>
              </div>
              
              <div className="text-muted-foreground">
                {selectedDate 
                  ? `Événements du ${selectedDate.toLocaleDateString('fr-FR')}`
                  : 'Sélectionnez une date'
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedDate 
                  ? `Événements du ${selectedDate.toLocaleDateString('fr-FR')}`
                  : 'Tous les événements'
                }
              </CardTitle>
              <Badge variant="secondary">
                {selectedDate ? getEventsForDate(selectedDate).length : filteredEvents.length} événement(s)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {renderEventList()}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: 'Campagnes', count: events.filter(e => e.type === 'campaign').length, color: 'primary' },
          { label: 'Emails', count: events.filter(e => e.type === 'email').length, color: 'secondary' },
          { label: 'Social Media', count: events.filter(e => e.type === 'social').length, color: 'accent' },
          { label: 'Événements', count: events.filter(e => e.type === 'event').length, color: 'warning' },
          { label: 'Deadlines', count: events.filter(e => e.type === 'deadline').length, color: 'destructive' }
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stat.count}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
