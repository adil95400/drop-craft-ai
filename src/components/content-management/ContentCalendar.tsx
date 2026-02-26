import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  FileText, Video, Image, Mail, Share2, Edit, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface CalendarEvent {
  id: string;
  title: string;
  content_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  platform: string | null;
  notes: string | null;
  color: string;
}

const CONTENT_TYPES = [
  { value: 'blog', label: 'Article Blog', icon: FileText },
  { value: 'social', label: 'Post Social', icon: Share2 },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'video', label: 'Vidéo', icon: Video },
  { value: 'image', label: 'Image', icon: Image },
];

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const PLATFORMS = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube', 'Blog', 'Newsletter'];

export function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content_type: 'blog',
    scheduled_time: '',
    platform: '',
    notes: '',
    color: '#3B82F6'
  });
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: events = [] } = useQuery({
    queryKey: ['content-calendar', format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_calendar')
        .select('*')
        .gte('scheduled_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      return data as CalendarEvent[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { scheduled_date: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');
      
      const { error } = await supabase
        .from('content_calendar')
        .insert({
          user_id: userData.user.id,
          title: data.title,
          content_type: data.content_type,
          scheduled_date: data.scheduled_date,
          scheduled_time: data.scheduled_time || null,
          platform: data.platform || null,
          notes: data.notes || null,
          color: data.color,
          status: 'draft'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-calendar'] });
      toast.success('Événement créé');
      resetForm();
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CalendarEvent> & { id: string }) => {
      const { error } = await supabase
        .from('content_calendar')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-calendar'] });
      toast.success('Événement mis à jour');
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('content_calendar')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-calendar'] });
      toast.success('Événement supprimé');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content_type: 'blog',
      scheduled_time: '',
      platform: '',
      notes: '',
      color: '#3B82F6'
    });
    setEditingEvent(null);
    setIsDialogOpen(false);
    setSelectedDate(null);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsDialogOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      content_type: event.content_type,
      scheduled_time: event.scheduled_time || '',
      platform: event.platform || '',
      notes: event.notes || '',
      color: event.color
    });
    setSelectedDate(new Date(event.scheduled_date));
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    if (!selectedDate) return;

    if (editingEvent) {
      updateMutation.mutate({
        id: editingEvent.id,
        title: formData.title,
        content_type: formData.content_type,
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        scheduled_time: formData.scheduled_time || null,
        platform: formData.platform || null,
        notes: formData.notes || null,
        color: formData.color
      });
    } else {
      createMutation.mutate({
        ...formData,
        scheduled_date: format(selectedDate, 'yyyy-MM-dd')
      });
    }
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.scheduled_date), day)
    );
  };

  const getContentIcon = (type: string) => {
    const contentType = CONTENT_TYPES.find(t => t.value === type);
    return contentType ? contentType.icon : FileText;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale: getDateFnsLocale() })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setCurrentDate(new Date())} variant="outline">
          Aujourd'hui
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                  <div key={day} className="bg-muted/50 p-2 text-center text-sm font-medium">
                    {day}
                  </div>
                ))}
                {/* Empty cells for days before month start */}
                {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-background p-2 min-h-[100px]" />
                ))}
                {days.map(day => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`bg-background p-2 min-h-[100px] cursor-pointer hover:bg-muted/50 transition-colors ${
                        isToday(day) ? 'ring-2 ring-primary ring-inset' : ''
                      } ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}`}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday(day) ? 'text-primary' : ''
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => {
                          const Icon = getContentIcon(event.content_type);
                          return (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded truncate flex items-center gap-1"
                              style={{ backgroundColor: event.color + '20', color: event.color }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                            >
                              <Icon className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{event.title}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} autres
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Légende</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {CONTENT_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <div key={type.value} className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{type.label}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Événements ce mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {events.slice(0, 5).map(event => (
                  <div 
                    key={event.id} 
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded-lg"
                    onClick={() => handleEditEvent(event)}
                  >
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: event.color }} 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.scheduled_date), 'dd MMM', { locale: getDateFnsLocale() })}
                      </p>
                    </div>
                    <Badge variant="secondary" className={STATUS_COLORS[event.status as keyof typeof STATUS_COLORS]}>
                      {event.status}
                    </Badge>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun événement ce mois
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
              {selectedDate && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  - {format(selectedDate, 'dd MMMM yyyy', { locale: getDateFnsLocale() })}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de l'événement"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de contenu</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(v) => setFormData({ ...formData, content_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plateforme</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(v) => setFormData({ ...formData, platform: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editingEvent && (
              <Button
                variant="destructive"
                onClick={() => {
                  deleteMutation.mutate(editingEvent.id);
                  resetForm();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button onClick={handleSubmit}>
                {editingEvent ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
