import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  StickyNote, 
  CheckSquare, 
  Clock, 
  Plus,
  Send,
  Phone,
  Mail,
  Video,
  Calendar,
  User,
  FileText,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  isPinned: boolean;
  type: 'note' | 'call' | 'email' | 'meeting';
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  assignee: string;
}

interface Activity {
  id: string;
  type: 'order' | 'support' | 'visit' | 'email_open' | 'click' | 'purchase';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface CustomerInteractionsProps {
  customerId: string;
  customerName: string;
}

export const CustomerInteractions: React.FC<CustomerInteractionsProps> = ({
  customerId,
  customerName
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('notes');
  const [newNote, setNewNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Mock data - in production, fetch from database
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      content: 'Client très intéressé par les nouveaux produits. Préfère être contacté par email.',
      author: 'Marie D.',
      createdAt: '2024-01-15T10:30:00Z',
      isPinned: true,
      type: 'note'
    },
    {
      id: '2',
      content: 'Appel de suivi effectué. Client satisfait de sa dernière commande.',
      author: 'Jean P.',
      createdAt: '2024-01-14T14:00:00Z',
      isPinned: false,
      type: 'call'
    },
    {
      id: '3',
      content: 'Réunion vidéo pour présentation des nouvelles offres B2B.',
      author: 'Sophie M.',
      createdAt: '2024-01-10T09:00:00Z',
      isPinned: false,
      type: 'meeting'
    }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Envoyer catalogue produits Q1',
      description: 'Préparer et envoyer le nouveau catalogue avec les offres spéciales',
      dueDate: '2024-01-20',
      priority: 'high',
      status: 'pending',
      assignee: 'Marie D.'
    },
    {
      id: '2',
      title: 'Appel de suivi post-achat',
      dueDate: '2024-01-18',
      priority: 'medium',
      status: 'in_progress',
      assignee: 'Jean P.'
    },
    {
      id: '3',
      title: 'Mise à jour des préférences',
      dueDate: '2024-01-15',
      priority: 'low',
      status: 'completed',
      assignee: 'Sophie M.'
    }
  ]);

  const activities: Activity[] = [
    {
      id: '1',
      type: 'purchase',
      description: 'Commande #ORD-2024-001 - 3 articles (245€)',
      timestamp: '2024-01-15T16:45:00Z'
    },
    {
      id: '2',
      type: 'email_open',
      description: 'A ouvert l\'email "Nouvelles offres janvier"',
      timestamp: '2024-01-14T09:30:00Z'
    },
    {
      id: '3',
      type: 'visit',
      description: 'A visité la page produit "Collection Premium"',
      timestamp: '2024-01-13T14:20:00Z'
    },
    {
      id: '4',
      type: 'support',
      description: 'Ticket support #TKT-456 - Résolu',
      timestamp: '2024-01-10T11:00:00Z'
    },
    {
      id: '5',
      type: 'click',
      description: 'A cliqué sur le lien promo dans l\'email',
      timestamp: '2024-01-09T08:15:00Z'
    }
  ];

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      author: 'Vous',
      createdAt: new Date().toISOString(),
      isPinned: false,
      type: 'note'
    };
    
    setNotes([note, ...notes]);
    setNewNote('');
    toast({ title: 'Note ajoutée', description: 'La note a été enregistrée.' });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      status: 'pending',
      assignee: 'Vous'
    };
    
    setTasks([task, ...tasks]);
    setNewTaskTitle('');
    setIsAddingTask(false);
    toast({ title: 'Tâche créée', description: 'La tâche a été ajoutée.' });
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: task.status === 'completed' ? 'pending' : 'completed'
        };
      }
      return task;
    }));
  };

  const togglePinNote = (noteId: string) => {
    setNotes(notes.map(note => {
      if (note.id === noteId) {
        return { ...note, isPinned: !note.isPinned };
      }
      return note;
    }));
  };

  const deleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
    toast({ title: 'Note supprimée' });
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    toast({ title: 'Tâche supprimée' });
  };

  const getNoteIcon = (type: Note['type']) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Video className="h-4 w-4" />;
      default: return <StickyNote className="h-4 w-4" />;
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'purchase': return <FileText className="h-4 w-4 text-green-500" />;
      case 'email_open': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'visit': return <User className="h-4 w-4 text-purple-500" />;
      case 'support': return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case 'click': return <CheckSquare className="h-4 w-4 text-cyan-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Interactions - {customerName}
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Phone className="h-4 w-4 mr-1" />
              Appeler
            </Button>
            <Button size="sm" variant="outline">
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
            <Button size="sm" variant="outline">
              <Calendar className="h-4 w-4 mr-1" />
              RDV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Notes ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tâches ({tasks.filter(t => t.status !== 'completed').length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-4 space-y-4">
            {/* Add note input */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Ajouter une note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[80px]"
              />
              <Button onClick={handleAddNote} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Notes list */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {notes
                  .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
                  .map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg border ${
                        note.isPinned ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getNoteIcon(note.type)}
                          <span className="text-sm font-medium">{note.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.createdAt)}
                          </span>
                          {note.isPinned && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => togglePinNote(note.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              {note.isPinned ? 'Désépingler' : 'Épingler'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteNote(note.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="mt-2 text-sm">{note.content}</p>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4 space-y-4">
            {/* Add task */}
            {isAddingTask ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Titre de la tâche..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <Button onClick={handleAddTask}>Ajouter</Button>
                <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                  Annuler
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsAddingTask(true)} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une tâche
              </Button>
            )}

            {/* Tasks list */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border ${
                      task.status === 'completed' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                          task.status === 'completed'
                            ? 'bg-green-500 border-green-500'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {task.status === 'completed' && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={task.status === 'completed' ? 'line-through' : ''}>
                            {task.title}
                          </span>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority === 'high' ? 'Urgent' : task.priority === 'medium' ? 'Normal' : 'Faible'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignee}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[450px]">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="flex items-start gap-4 relative">
                      <div className="z-10 bg-background p-1 rounded-full border">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm">{activity.description}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
