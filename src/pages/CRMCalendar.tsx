/**
 * Calendrier CRM - 100% connecté aux données réelles
 */
import React, { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Trash2,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Target,
  TrendingUp
} from 'lucide-react'
import { useCRMCalendar, CalendarEvent } from '@/hooks/useCRMCalendar'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function CRMCalendar() {
  const { events, stats, isLoading, createEvent, updateEvent, deleteEvent, markAsCompleted, refetch } = useCRMCalendar()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    content_type: 'meeting' as CalendarEvent['content_type'],
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '09:00',
    notes: '',
    color: '#3b82f6'
  })

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="h-4 w-4" />
      case 'call': return <Phone className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'demo': return <Video className="h-4 w-4" />
      case 'follow_up': return <Target className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'call': return 'bg-green-100 text-green-800 border-green-200'
      case 'email': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'demo': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'follow_up': return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'task': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500 text-white">Terminé</Badge>
      case 'cancelled': return <Badge variant="destructive">Annulé</Badge>
      case 'in_progress': return <Badge className="bg-blue-500 text-white animate-pulse">En cours</Badge>
      default: return <Badge variant="outline">Planifié</Badge>
    }
  }

  const getTodaysEvents = () => {
    if (!selectedDate) return []
    const selectedDateStr = selectedDate.toISOString().split('T')[0]
    return events
      .filter(event => event.scheduled_date === selectedDateStr)
      .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
  }

  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split('T')[0]
    return events
      .filter(event => event.scheduled_date >= today && event.status !== 'completed')
      .sort((a, b) => `${a.scheduled_date}${a.scheduled_time}`.localeCompare(`${b.scheduled_date}${b.scheduled_time}`))
      .slice(0, 5)
  }

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) return
    
    setIsSubmitting(true)
    try {
      await createEvent({
        title: newEvent.title,
        content_type: newEvent.content_type,
        scheduled_date: newEvent.scheduled_date,
        scheduled_time: newEvent.scheduled_time,
        notes: newEvent.notes,
        color: newEvent.color,
        status: 'scheduled'
      })
      setIsAddDialogOpen(false)
      setNewEvent({
        title: '',
        content_type: 'meeting',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '09:00',
        notes: '',
        color: '#3b82f6'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (confirm('Supprimer cet événement ?')) {
      await deleteEvent(id)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-4 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 col-span-3" />
        </div>
      </div>
    )
  }

  return (
    <ChannablePageWrapper
      title="Calendrier CRM"
      subtitle="Planification & Suivi"
      description="Gérez vos rendez-vous et activités commerciales"
      heroImage="marketing"
      badge={{ label: 'Live', icon: CalendarDays }}
      actions={
        <>
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
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary">
                <Plus className="h-4 w-4" />
                Nouveau RDV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un événement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input
                    placeholder="Réunion avec client..."
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={newEvent.content_type} 
                      onValueChange={(v) => setNewEvent({ ...newEvent, content_type: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Réunion</SelectItem>
                        <SelectItem value="call">Appel</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="demo">Démo</SelectItem>
                        <SelectItem value="follow_up">Suivi</SelectItem>
                        <SelectItem value="task">Tâche</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newEvent.scheduled_date}
                      onChange={(e) => setNewEvent({ ...newEvent, scheduled_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Heure</Label>
                  <Input
                    type="time"
                    value={newEvent.scheduled_time}
                    onChange={(e) => setNewEvent({ ...newEvent, scheduled_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Détails de l'événement..."
                    rows={3}
                    value={newEvent.notes}
                    onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddEvent} disabled={isSubmitting || !newEvent.title.trim()}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.todayEvents}</div>
                <div className="text-sm text-muted-foreground">Aujourd'hui</div>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.weekEvents}</div>
                <div className="text-sm text-muted-foreground">Cette semaine</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.upcomingMeetings}</div>
                <div className="text-sm text-muted-foreground">Réunions à venir</div>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.completedThisMonth}</div>
                <div className="text-sm text-muted-foreground">Terminés ce mois</div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Widget */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
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
              <h4 className="font-medium text-sm">Prochains événements</h4>
              {getUpcomingEvents().length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun événement à venir</p>
              ) : (
                getUpcomingEvents().map((event) => (
                  <motion.div 
                    key={event.id} 
                    className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    whileHover={{ x: 2 }}
                  >
                    <div className={cn("p-1.5 rounded", getEventTypeColor(event.content_type))}>
                      {getEventTypeIcon(event.content_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(event.scheduled_date).toLocaleDateString('fr-FR')} • {event.scheduled_time}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
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
                  <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter un événement
                  </Button>
                </div>
              ) : (
                getTodaysEvents().map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-l-4" style={{ borderLeftColor: event.color || '#3b82f6' }}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={cn("p-2 rounded-lg", getEventTypeColor(event.content_type))}>
                              {getEventTypeIcon(event.content_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-semibold">{event.title}</h4>
                                {getStatusBadge(event.status)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.scheduled_time}
                                </span>
                                <Badge variant="outline" className={getEventTypeColor(event.content_type)}>
                                  {event.content_type}
                                </Badge>
                              </div>
                              {event.notes && (
                                <p className="text-sm text-muted-foreground">
                                  {event.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {event.status !== 'completed' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => markAsCompleted(event.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  )
}
