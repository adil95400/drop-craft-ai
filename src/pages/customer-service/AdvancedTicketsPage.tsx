/**
 * Advanced Ticket Management — SLA tracking, priority queue, conversation inbox
 */
import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { useSupportTickets, useTicketMessages } from '@/hooks/useSupportTickets';
import { formatDistanceToNow, differenceInMinutes, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Ticket, Search, AlertCircle, Clock, CheckCircle,
  TrendingUp, Plus, Send, MessageSquare, X
} from 'lucide-react';

const SLA_DEFAULTS = {
  urgent: { firstResponse: 15, resolution: 120 },
  high: { firstResponse: 30, resolution: 480 },
  normal: { firstResponse: 60, resolution: 1440 },
  low: { firstResponse: 240, resolution: 4320 },
};

export default function AdvancedTicketsPage() {
  const { tickets, isLoadingTickets: isLoading, updateTicket, createTicket, isCreatingTicket } = useSupportTickets();
  const updateTicketStatus = ({ id, status }: { id: string; status: string }) => updateTicket({ ticketId: id, status: status as any });
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'sla'>('priority');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' as string, category: 'general' });

  const enrichedTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.map((t: any) => {
      const priority = t.priority || 'normal';
      const sla = SLA_DEFAULTS[priority as keyof typeof SLA_DEFAULTS] || SLA_DEFAULTS.normal;
      const ageMinutes = differenceInMinutes(new Date(), new Date(t.created_at));
      const slaPercentage = Math.min(100, (ageMinutes / sla.resolution) * 100);
      const isBreached = ageMinutes > sla.resolution && t.status !== 'resolved' && t.status !== 'closed';
      const isWarning = slaPercentage > 75 && !isBreached && t.status !== 'resolved' && t.status !== 'closed';
      return { ...t, sla, ageMinutes, slaPercentage, isBreached, isWarning };
    });
  }, [tickets]);

  const filtered = useMemo(() => {
    let result = enrichedTickets.filter(t => {
      const matchSearch = !searchTerm || t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchPriority && matchStatus;
    });
    
    const priorityOrder = { urgent: 0, high: 1, normal: 2, medium: 2, low: 3 };
    if (sortBy === 'priority') {
      result.sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2));
    } else if (sortBy === 'sla') {
      result.sort((a, b) => b.slaPercentage - a.slaPercentage);
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  }, [enrichedTickets, searchTerm, priorityFilter, statusFilter, sortBy]);

  const stats = {
    total: enrichedTickets.length,
    open: enrichedTickets.filter(t => t.status === 'open').length,
    breached: enrichedTickets.filter(t => t.isBreached).length,
    avgAge: enrichedTickets.length > 0
      ? Math.round(enrichedTickets.reduce((s, t) => s + t.ageMinutes, 0) / enrichedTickets.length / 60)
      : 0,
    resolvedToday: enrichedTickets.filter(t => {
      if (t.status !== 'resolved') return false;
      const resolved = new Date(t.updated_at);
      const today = new Date();
      return resolved.toDateString() === today.toDateString();
    }).length,
  };

  const selectedTicket = enrichedTickets.find(t => t.id === selectedTicketId);

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      urgent: 'bg-destructive/10 text-red-700 border-destructive/20',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      normal: 'bg-info/10 text-blue-700 border-info/20',
      medium: 'bg-info/10 text-blue-700 border-info/20',
      low: 'bg-muted text-muted-foreground',
    };
    const labels: Record<string, string> = { urgent: '🔴 Urgent', high: '🟠 Haute', normal: '🔵 Normale', medium: '🔵 Normale', low: '🟢 Basse' };
    return <Badge className={cn("text-xs", map[priority] || map.normal)}>{labels[priority] || '🔵 Normale'}</Badge>;
  };

  const handleCreateTicket = () => {
    if (!newTicket.subject || !newTicket.message) return;
    createTicket({
      subject: newTicket.subject,
      message: newTicket.message,
      priority: newTicket.priority as any,
      category: newTicket.category,
    });
    setNewTicket({ subject: '', message: '', priority: 'medium', category: 'general' });
    setCreateDialogOpen(false);
  };

  return (
    <>
      <Helmet><title>Tickets avancés — Drop-Craft AI</title></Helmet>
      <ChannablePageWrapper
        title={tPages('gestionAvanceeDesTickets.title')}
        description="Suivi SLA, file de priorité et conversations centralisées"
        badge={{ label: 'Tickets', icon: Ticket }}
      >
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total tickets', value: stats.total, icon: Ticket, color: 'text-primary' },
            { label: 'Ouverts', value: stats.open, icon: AlertCircle, color: 'text-warning' },
            { label: 'SLA dépassé', value: stats.breached, icon: Clock, color: 'text-destructive' },
            { label: 'Âge moyen (h)', value: stats.avgAge, icon: TrendingUp, color: 'text-info' },
            { label: "Résolus aujourd'hui", value: stats.resolvedToday, icon: CheckCircle, color: 'text-success' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={cn("h-5 w-5", s.color)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher tickets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Priorité" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
              <SelectItem value="normal">Normale</SelectItem>
              <SelectItem value="low">Basse</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="open">Ouvert</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="resolved">Résolu</SelectItem>
              <SelectItem value="closed">Fermé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Trier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priorité</SelectItem>
              <SelectItem value="sla">SLA critique</SelectItem>
              <SelectItem value="created">Date création</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nouveau ticket
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tickets list */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>Âge</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun ticket</TableCell></TableRow>
                    ) : (
                      filtered.map(ticket => (
                        <TableRow
                          key={ticket.id}
                          className={cn(
                            ticket.isBreached && "bg-destructive/5",
                            selectedTicketId === ticket.id && "bg-accent",
                            "cursor-pointer"
                          )}
                          onClick={() => setSelectedTicketId(ticket.id)}
                        >
                          <TableCell>
                            <div className="font-medium text-sm">{ticket.subject || 'Sans sujet'}</div>
                            <div className="text-xs text-muted-foreground">{ticket.email}</div>
                          </TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority || 'normal')}</TableCell>
                          <TableCell>
                            <Badge variant={ticket.status === 'open' ? 'outline' : ticket.status === 'in_progress' ? 'secondary' : 'default'} className="text-xs">
                              {ticket.status === 'open' ? 'Ouvert' : ticket.status === 'in_progress' ? 'En cours' : ticket.status === 'resolved' ? 'Résolu' : 'Fermé'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="w-24">
                              <Progress
                                value={ticket.slaPercentage}
                                className={cn(
                                  "h-2",
                                  ticket.isBreached && "[&>div]:bg-destructive",
                                  ticket.isWarning && "[&>div]:bg-warning"
                                )}
                              />
                              <span className={cn(
                                "text-[10px]",
                                ticket.isBreached ? "text-destructive font-medium" : ticket.isWarning ? "text-warning" : "text-muted-foreground"
                              )}>
                                {ticket.isBreached ? 'Dépassé !' : `${Math.round(ticket.slaPercentage)}%`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(ticket.created_at), { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {ticket.status === 'open' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); updateTicketStatus({ id: ticket.id, status: 'in_progress' }); }}>
                                  Prendre en charge
                                </Button>
                              )}
                              {ticket.status === 'in_progress' && (
                                <Button size="sm" variant="default" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); updateTicketStatus({ id: ticket.id, status: 'resolved' }); }}>
                                  Résoudre
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Ticket detail / conversation panel */}
          <div className="lg:col-span-1">
            {selectedTicket ? (
              <TicketDetailPanel
                ticket={selectedTicket}
                onClose={() => setSelectedTicketId(null)}
                onStatusChange={(status) => updateTicketStatus({ id: selectedTicket.id, status })}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Sélectionnez un ticket pour voir les détails et la conversation</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Create ticket dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Sujet</Label>
                <Input
                  value={newTicket.subject}
                  onChange={e => setNewTicket(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Décrivez votre problème..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Priorité</Label>
                  <Select value={newTicket.priority} onValueChange={v => setNewTicket(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Normale</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={newTicket.category} onValueChange={v => setNewTicket(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Général</SelectItem>
                      <SelectItem value="billing">Facturation</SelectItem>
                      <SelectItem value="technical">Technique</SelectItem>
                      <SelectItem value="shipping">Livraison</SelectItem>
                      <SelectItem value="product">Produit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={newTicket.message}
                  onChange={e => setNewTicket(p => ({ ...p, message: e.target.value }))}
                  placeholder="Décrivez votre demande en détail..."
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleCreateTicket} disabled={isCreatingTicket || !newTicket.subject || !newTicket.message}>
                {isCreatingTicket ? 'Création...' : 'Créer le ticket'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ChannablePageWrapper>
    </>
  );
}

// ── Ticket Detail Panel with Conversation ──
function TicketDetailPanel({ ticket, onClose, onStatusChange }: {
  ticket: any;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}) {
  const { messages, isLoading, addMessage, isAddingMessage } = useTicketMessages(ticket.id);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    addMessage({ ticketId: ticket.id, message: replyText.trim() });
    setReplyText('');
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm truncate">{ticket.subject}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{ticket.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            {ticket.category || 'general'}
          </Badge>
          <Badge variant={ticket.status === 'open' ? 'outline' : ticket.status === 'in_progress' ? 'secondary' : 'default'} className="text-[10px]">
            {ticket.status}
          </Badge>
          {ticket.isBreached && <Badge variant="destructive" className="text-[10px]">SLA dépassé</Badge>}
        </div>

        {/* SLA bar */}
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>SLA Resolution</span>
            <span>{Math.round(ticket.slaPercentage)}%</span>
          </div>
          <Progress
            value={ticket.slaPercentage}
            className={cn("h-1.5",
              ticket.isBreached && "[&>div]:bg-destructive",
              ticket.isWarning && "[&>div]:bg-warning"
            )}
          />
        </div>

        {/* Status actions */}
        <div className="flex gap-2 mt-2">
          {ticket.status === 'open' && (
            <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => onStatusChange('in_progress')}>
              Prendre en charge
            </Button>
          )}
          {ticket.status === 'in_progress' && (
            <Button size="sm" className="h-7 text-xs flex-1" onClick={() => onStatusChange('resolved')}>
              Résoudre
            </Button>
          )}
          {(ticket.status === 'resolved') && (
            <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => onStatusChange('closed')}>
              Fermer
            </Button>
          )}
        </div>
      </CardHeader>

      <Separator />

      {/* Conversation thread */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-3 space-y-3">
          {/* Original message */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-medium text-foreground">Client</span>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(ticket.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
              </span>
            </div>
            <p className="text-xs text-foreground/90">{ticket.message}</p>
          </div>

          {/* Thread messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "rounded-lg p-3",
                msg.is_staff ? "bg-primary/10 ml-4" : "bg-muted/50 mr-4"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium">
                  {msg.is_staff ? '🛡️ Support' : 'Client'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(msg.created_at), "dd MMM HH:mm", { locale: fr })}
                </span>
              </div>
              <p className="text-xs text-foreground/90">{msg.message}</p>
            </div>
          ))}

          {isLoading && <p className="text-xs text-muted-foreground text-center">Chargement...</p>}
        </div>
      </ScrollArea>

      <Separator />

      {/* Reply input */}
      <div className="p-3 flex-shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Écrire une réponse..."
            className="text-xs min-h-[60px] resize-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSendReply();
              }
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-muted-foreground">Ctrl+Enter pour envoyer</span>
          <Button
            size="sm"
            className="h-7 gap-1"
            onClick={handleSendReply}
            disabled={!replyText.trim() || isAddingMessage}
          >
            <Send className="h-3 w-3" />
            {isAddingMessage ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
