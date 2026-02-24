/**
 * Sprint 24 - CRM & Service Client
 * Centre de gestion clients, tickets support et FAQ dynamique
 * Uses real Supabase data instead of mock data
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Users, MessageSquare, HelpCircle, Search, Plus, Filter,
  Star, Clock, CheckCircle2, AlertCircle, ArrowUpRight,
  Mail, Phone, Globe, Tag, TrendingUp, UserPlus, Heart,
  Zap, Shield, ChevronRight, BarChart3, Send, RefreshCw,
  FileText, Inbox, Archive, XCircle, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { formatCurrency, formatRelativeTime } from '@/utils/format';

// ============================================
// Types
// ============================================
interface CustomerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  total_orders: number | null;
  total_spent: number | null;
  tags: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

interface TicketRow {
  id: string;
  subject: string;
  message: string;
  email: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface FAQRow {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  helpful_count: number | null;
  not_helpful_count: number | null;
  is_active: boolean | null;
  order_index: number | null;
}

// ============================================
// Helpers
// ============================================
const segmentColors: Record<string, string> = {
  VIP: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  Active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  New: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  Repeat: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
  'At Risk': 'bg-red-500/10 text-red-600 border-red-500/30',
};

function getCustomerSegment(c: CustomerRow): string {
  const orders = c.total_orders ?? 0;
  const spent = c.total_spent ?? 0;
  if (spent > 5000 || orders > 30) return 'VIP';
  if (orders > 10) return 'Repeat';
  if (orders > 3) return 'Active';
  if (orders >= 1) return 'New';
  return 'At Risk';
}

function getCustomerScore(c: CustomerRow): number {
  const orders = c.total_orders ?? 0;
  const spent = c.total_spent ?? 0;
  return Math.min(100, Math.round((orders * 2) + (spent / 100)));
}

function getCustomerLoyalty(c: CustomerRow): string {
  const score = getCustomerScore(c);
  if (score >= 90) return 'Platinum';
  if (score >= 70) return 'Gold';
  if (score >= 40) return 'Silver';
  return 'Bronze';
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Urgent' },
  high: { color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', label: 'Haute' },
  medium: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', label: 'Moyenne' },
  low: { color: 'bg-green-500/10 text-green-600 border-green-500/30', label: 'Basse' },
};

const statusConfig: Record<string, { color: string; label: string; icon: typeof CheckCircle2 }> = {
  open: { color: 'bg-blue-500/10 text-blue-600', label: 'Ouvert', icon: Inbox },
  in_progress: { color: 'bg-amber-500/10 text-amber-600', label: 'En cours', icon: RefreshCw },
  resolved: { color: 'bg-green-500/10 text-green-600', label: 'Résolu', icon: CheckCircle2 },
  closed: { color: 'bg-muted text-muted-foreground', label: 'Fermé', icon: Archive },
};

function StatCard({ icon: Icon, label, value, trend, color, isLoading }: { icon: any; label: string; value: string; trend?: string; color: string; isLoading?: boolean }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            {trend && (
              <span className="text-xs text-emerald-500 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> {trend}
              </span>
            )}
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// Customer List Tab (real data)
// ============================================
function CustomersTab() {
  const { user } = useUnifiedAuth();
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['crm-customers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user!.id)
        .order('total_spent', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as CustomerRow[];
    },
    enabled: !!user?.id,
  });

  const filtered = useMemo(() => customers.filter(c => {
    const name = `${c.first_name || ''} ${c.last_name || ''}`.trim();
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const segment = getCustomerSegment(c);
    const matchSegment = segmentFilter === 'all' || segment === segmentFilter;
    return matchSearch && matchSegment;
  }), [customers, search, segmentFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">Aucun client pour le moment</p>
        <p className="text-sm mt-1">Vos clients apparaîtront ici après leurs premières commandes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Segment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les segments</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
            <SelectItem value="Active">Actif</SelectItem>
            <SelectItem value="Repeat">Récurrent</SelectItem>
            <SelectItem value="New">Nouveau</SelectItem>
            <SelectItem value="At Risk">À risque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {filtered.map((customer, i) => {
            const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email;
            const avatar = `${(customer.first_name || '?')[0]}${(customer.last_name || '')[0] || ''}`.toUpperCase();
            const segment = getCustomerSegment(customer);
            const score = getCustomerScore(customer);
            const loyalty = getCustomerLoyalty(customer);

            return (
              <motion.div key={customer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="border border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground truncate">{name}</span>
                          <Badge variant="outline" className={`text-[10px] ${segmentColors[segment] || ''}`}>{segment}</Badge>
                          <Badge variant="outline" className="text-[10px]">{loyalty}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{customer.email}</span>
                          {customer.phone && <span className="hidden sm:flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>}
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-foreground">{customer.total_orders ?? 0}</p>
                          <p className="text-[10px] text-muted-foreground">Commandes</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-foreground">{formatCurrency(customer.total_spent ?? 0)}</p>
                          <p className="text-[10px] text-muted-foreground">CA Total</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Progress value={score} className="w-16 h-1.5" />
                            <span className="text-xs font-medium">{score}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Score</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================
// Tickets Tab (real data)
// ============================================
function TicketsTab() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: '', priority: 'medium', message: '' });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['crm-tickets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as TicketRow[];
    },
    enabled: !!user?.id,
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      if (!newTicket.subject || !newTicket.message) throw new Error('Sujet et message requis');
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user!.id,
        subject: newTicket.subject,
        message: newTicket.message,
        category: newTicket.category || null,
        priority: newTicket.priority,
        status: 'open',
        email: user!.email,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tickets'] });
      setShowNewTicket(false);
      setNewTicket({ subject: '', category: '', priority: 'medium', message: '' });
      toast.success('Ticket créé avec succès');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => tickets.filter(t => statusFilter === 'all' || t.status === statusFilter), [tickets, statusFilter]);

  const ticketCounts = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }), [tickets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'Tous', count: ticketCounts.all },
            { key: 'open', label: 'Ouverts', count: ticketCounts.open },
            { key: 'in_progress', label: 'En cours', count: ticketCounts.in_progress },
            { key: 'resolved', label: 'Résolus', count: ticketCounts.resolved },
          ].map(tab => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(tab.key)}
              className="gap-1.5 shrink-0"
            >
              {tab.label}
              <Badge variant="secondary" className="text-[10px] px-1.5">{tab.count}</Badge>
            </Button>
          ))}
        </div>

        <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
          <DialogTrigger asChild>
            <Button className="gap-2" size="sm"><Plus className="h-4 w-4" /> Nouveau ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau ticket support</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <Input
                placeholder="Sujet du ticket"
                value={newTicket.subject}
                onChange={e => setNewTicket(p => ({ ...p, subject: e.target.value }))}
              />
              <Select value={newTicket.category} onValueChange={v => setNewTicket(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">Livraison</SelectItem>
                  <SelectItem value="refund">Remboursement</SelectItem>
                  <SelectItem value="product">Produit</SelectItem>
                  <SelectItem value="billing">Facturation</SelectItem>
                  <SelectItem value="loyalty">Fidélité</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newTicket.priority} onValueChange={v => setNewTicket(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue placeholder="Priorité" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Décrivez le problème..."
                rows={4}
                value={newTicket.message}
                onChange={e => setNewTicket(p => ({ ...p, message: e.target.value }))}
              />
              <Button
                className="w-full gap-2"
                onClick={() => createTicket.mutate()}
                disabled={createTicket.isPending}
              >
                {createTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Créer le ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Aucun ticket</p>
          <p className="text-sm mt-1">Créez un ticket pour contacter le support</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((ticket, i) => {
            const status = statusConfig[ticket.status || 'open'] || statusConfig.open;
            const priority = priorityConfig[ticket.priority || 'medium'] || priorityConfig.medium;
            const StatusIcon = status.icon;

            return (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="border border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-0.5 ${status.color}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{ticket.id.slice(0, 8)}</span>
                          <Badge variant="outline" className={`text-[10px] ${priority.color}`}>{priority.label}</Badge>
                          {ticket.category && <Badge variant="outline" className="text-[10px]">{ticket.category}</Badge>}
                        </div>
                        <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          {ticket.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{ticket.email}</span>}
                          {ticket.created_at && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatRelativeTime(ticket.created_at)}</span>}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// FAQ Tab (real data)
// ============================================
function FAQTab() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const { data: faqItems = [], isLoading } = useQuery({
    queryKey: ['crm-faq'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as FAQRow[];
    },
  });

  const categories = useMemo(() => [...new Set(faqItems.map(f => f.category).filter(Boolean) as string[])], [faqItems]);

  const filtered = useMemo(() => faqItems.filter(f => {
    const matchSearch = !search || f.question.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || f.category === category;
    return matchSearch && matchCat;
  }), [faqItems, search, category]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (faqItems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">Aucune FAQ pour le moment</p>
        <p className="text-sm mt-1">Les questions fréquentes apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher dans la FAQ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button variant={category === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCategory('all')}>Toutes</Button>
          {categories.map(cat => (
            <Button key={cat} variant={category === cat ? 'default' : 'outline'} size="sm" onClick={() => setCategory(cat)} className="shrink-0">{cat}</Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((faq, i) => {
          const totalVotes = (faq.helpful_count ?? 0) + (faq.not_helpful_count ?? 0);
          const helpfulPercent = totalVotes > 0 ? Math.round(((faq.helpful_count ?? 0) / totalVotes) * 100) : 0;

          return (
            <motion.div key={faq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border border-border/50 hover:border-primary/30 transition-all h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 mt-0.5 shrink-0">
                      <HelpCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      {faq.category && <Badge variant="outline" className="text-[10px] mb-2">{faq.category}</Badge>}
                      <p className="font-medium text-foreground mb-2">{faq.question}</p>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      {totalVotes > 0 && (
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{helpfulPercent}% utile</span>
                          <span className="flex items-center gap-1">{totalVotes} votes</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Lifecycle Funnel (computed from real data)
// ============================================
function LifecycleFunnel() {
  const { user } = useUnifiedAuth();

  const { data: customers = [] } = useQuery({
    queryKey: ['crm-customers-funnel', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('total_orders, total_spent')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const stages = useMemo(() => {
    const total = customers.length || 1;
    const newCount = customers.filter(c => (c.total_orders ?? 0) <= 1).length;
    const active = customers.filter(c => (c.total_orders ?? 0) > 1 && (c.total_orders ?? 0) <= 10).length;
    const repeat = customers.filter(c => (c.total_orders ?? 0) > 10 && (c.total_orders ?? 0) <= 30).length;
    const vip = customers.filter(c => (c.total_orders ?? 0) > 30 || (c.total_spent ?? 0) > 5000).length;
    const atRisk = customers.filter(c => (c.total_orders ?? 0) === 0).length;

    return [
      { name: 'Nouveaux', count: newCount, percent: Math.round((newCount / total) * 100), color: 'bg-blue-500' },
      { name: 'Actifs', count: active, percent: Math.round((active / total) * 100), color: 'bg-emerald-500' },
      { name: 'Récurrents', count: repeat, percent: Math.round((repeat / total) * 100), color: 'bg-violet-500' },
      { name: 'VIP', count: vip, percent: Math.round((vip / total) * 100), color: 'bg-amber-500' },
      { name: 'À risque', count: atRisk, percent: Math.round((atRisk / total) * 100), color: 'bg-red-500' },
    ];
  }, [customers]);

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Tunnel de vie client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage, i) => (
          <motion.div key={stage.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-foreground font-medium">{stage.name}</span>
              <span className="text-muted-foreground">{stage.count}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div className={`h-full ${stage.color} rounded-full`} initial={{ width: 0 }} animate={{ width: `${stage.percent}%` }} transition={{ delay: i * 0.1 + 0.2, duration: 0.6 }} />
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Page
// ============================================
export default function CRMServicePage() {
  const { user } = useUnifiedAuth();

  const { data: customerCount = 0, isLoading: loadingCustomers } = useQuery({
    queryKey: ['crm-customer-count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  const { data: openTickets = 0, isLoading: loadingTickets } = useQuery({
    queryKey: ['crm-open-tickets', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('status', 'open');
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  const isLoading = loadingCustomers || loadingTickets;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CRM & Service Client</h1>
        <p className="text-muted-foreground mt-1">Gestion centralisée de vos clients, tickets et FAQ</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Clients actifs" value={customerCount.toLocaleString('fr-FR')} color="bg-primary/10 text-primary" isLoading={isLoading} />
        <StatCard icon={MessageSquare} label="Tickets ouverts" value={openTickets.toString()} color="bg-amber-500/10 text-amber-600" isLoading={isLoading} />
        <StatCard icon={Star} label="Satisfaction" value="—" color="bg-emerald-500/10 text-emerald-600" />
        <StatCard icon={Zap} label="Temps de réponse" value="—" color="bg-violet-500/10 text-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs defaultValue="customers" className="space-y-4">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="customers" className="gap-2 data-[state=active]:bg-background">
                <Users className="h-4 w-4" /> Clients
              </TabsTrigger>
              <TabsTrigger value="tickets" className="gap-2 data-[state=active]:bg-background">
                <MessageSquare className="h-4 w-4" /> Tickets
              </TabsTrigger>
              <TabsTrigger value="faq" className="gap-2 data-[state=active]:bg-background">
                <HelpCircle className="h-4 w-4" /> FAQ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers"><CustomersTab /></TabsContent>
            <TabsContent value="tickets"><TicketsTab /></TabsContent>
            <TabsContent value="faq"><FAQTab /></TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <LifecycleFunnel />

          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: UserPlus, label: 'Importer contacts', color: 'text-blue-500' },
                { icon: Mail, label: 'Campagne email', color: 'text-violet-500' },
                { icon: Tag, label: 'Gérer segments', color: 'text-amber-500' },
                { icon: FileText, label: 'Exporter données', color: 'text-emerald-500' },
              ].map(action => (
                <Button key={action.label} variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
                  <action.icon className={`h-4 w-4 ${action.color}`} /> {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
