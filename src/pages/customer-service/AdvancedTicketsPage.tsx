/**
 * Advanced Ticket Management — SLA tracking, priority queue, assignment
 */
import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Ticket, Search, AlertCircle, Clock, CheckCircle, User,
  TrendingUp, BarChart3, Zap, Filter, ArrowUpDown
} from 'lucide-react';

// SLA defaults (minutes)
const SLA_DEFAULTS = {
  urgent: { firstResponse: 15, resolution: 120 },
  high: { firstResponse: 30, resolution: 480 },
  normal: { firstResponse: 60, resolution: 1440 },
  low: { firstResponse: 240, resolution: 4320 },
};

export default function AdvancedTicketsPage() {
  const { tickets, isLoading, updateTicketStatus } = useSupportTickets();
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'sla'>('priority');

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
        t.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchPriority && matchStatus;
    });
    
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
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

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      normal: 'bg-blue-100 text-blue-700 border-blue-200',
      low: 'bg-muted text-muted-foreground',
    };
    return <Badge className={cn("text-xs", map[priority] || map.normal)}>{priority === 'urgent' ? '🔴 Urgent' : priority === 'high' ? '🟠 Haute' : priority === 'low' ? '🟢 Basse' : '🔵 Normale'}</Badge>;
  };

  return (
    <>
      <Helmet><title>Tickets avancés — Drop-Craft AI</title></Helmet>
      <ChannablePageWrapper
        title="Gestion avancée des tickets"
        description="Suivi SLA, file de priorité et assignation intelligente"
        icon={<Ticket className="h-5 w-5" />}
      >
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total tickets', value: stats.total, icon: Ticket, color: 'text-primary' },
            { label: 'Ouverts', value: stats.open, icon: AlertCircle, color: 'text-amber-500' },
            { label: 'SLA dépassé', value: stats.breached, icon: Clock, color: 'text-destructive' },
            { label: 'Âge moyen (h)', value: stats.avgAge, icon: TrendingUp, color: 'text-blue-500' },
            { label: "Résolus aujourd'hui", value: stats.resolvedToday, icon: CheckCircle, color: 'text-emerald-500' },
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
        </div>

        {/* Tickets table */}
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
                    <TableRow key={ticket.id} className={cn(ticket.isBreached && "bg-destructive/5")}>
                      <TableCell>
                        <div className="font-medium text-sm">{ticket.subject || 'Sans sujet'}</div>
                        <div className="text-xs text-muted-foreground">{ticket.customer_email}</div>
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
                              ticket.isWarning && "[&>div]:bg-amber-500"
                            )} 
                          />
                          <span className={cn(
                            "text-[10px]",
                            ticket.isBreached ? "text-destructive font-medium" : ticket.isWarning ? "text-amber-600" : "text-muted-foreground"
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
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateTicketStatus({ id: ticket.id, status: 'in_progress' })}>
                              Prendre en charge
                            </Button>
                          )}
                          {ticket.status === 'in_progress' && (
                            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => updateTicketStatus({ id: ticket.id, status: 'resolved' })}>
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
      </ChannablePageWrapper>
    </>
  );
}
