/**
 * Sprint 24 - CRM & Service Client
 * Centre de gestion clients, tickets support et FAQ dynamique
 */
import { useState } from 'react';
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
  FileText, Inbox, Archive, XCircle
} from 'lucide-react';

// ============================================
// Mock Data
// ============================================
const CUSTOMERS = [
  { id: '1', name: 'Sophie Martin', email: 'sophie@boutique.fr', phone: '+33 6 12 34 56 78', segment: 'VIP', orders: 47, revenue: 12450, lastOrder: '2026-02-14', loyalty: 'Gold', score: 92, avatar: 'SM' },
  { id: '2', name: 'Pierre Durand', email: 'pierre@shop.com', phone: '+33 6 98 76 54 32', segment: 'Active', orders: 18, revenue: 3240, lastOrder: '2026-02-10', loyalty: 'Silver', score: 74, avatar: 'PD' },
  { id: '3', name: 'Emma Petit', email: 'emma@store.fr', phone: '+33 6 11 22 33 44', segment: 'New', orders: 2, revenue: 89, lastOrder: '2026-02-12', loyalty: 'Bronze', score: 35, avatar: 'EP' },
  { id: '4', name: 'Lucas Bernard', email: 'lucas@ecommerce.fr', phone: '+33 6 55 66 77 88', segment: 'At Risk', orders: 12, revenue: 1890, lastOrder: '2026-01-05', loyalty: 'Silver', score: 45, avatar: 'LB' },
  { id: '5', name: 'Julie Moreau', email: 'julie@online.com', phone: '+33 6 99 88 77 66', segment: 'Repeat', orders: 31, revenue: 7650, lastOrder: '2026-02-15', loyalty: 'Gold', score: 88, avatar: 'JM' },
  { id: '6', name: 'Thomas Leroy', email: 'thomas@web.fr', phone: '+33 6 44 33 22 11', segment: 'VIP', orders: 64, revenue: 24800, lastOrder: '2026-02-16', loyalty: 'Platinum', score: 98, avatar: 'TL' },
];

const TICKETS = [
  { id: 'TK-001', subject: 'Commande non reçue #ORD-4521', customer: 'Sophie Martin', priority: 'high', status: 'open', category: 'Livraison', created: '2026-02-16 09:30', lastReply: '2026-02-16 10:15', messages: 3 },
  { id: 'TK-002', subject: 'Demande de remboursement produit défectueux', customer: 'Pierre Durand', priority: 'medium', status: 'in_progress', category: 'Remboursement', created: '2026-02-15 14:20', lastReply: '2026-02-16 08:00', messages: 5 },
  { id: 'TK-003', subject: 'Question sur les tailles disponibles', customer: 'Emma Petit', priority: 'low', status: 'open', category: 'Produit', created: '2026-02-16 11:00', lastReply: '2026-02-16 11:00', messages: 1 },
  { id: 'TK-004', subject: 'Erreur de facturation double prélèvement', customer: 'Lucas Bernard', priority: 'urgent', status: 'open', category: 'Facturation', created: '2026-02-16 07:45', lastReply: '2026-02-16 09:30', messages: 4 },
  { id: 'TK-005', subject: 'Suivi de colis international', customer: 'Julie Moreau', priority: 'medium', status: 'resolved', category: 'Livraison', created: '2026-02-14 16:00', lastReply: '2026-02-15 14:30', messages: 6 },
  { id: 'TK-006', subject: 'Programme fidélité points manquants', customer: 'Thomas Leroy', priority: 'low', status: 'closed', category: 'Fidélité', created: '2026-02-13 10:00', lastReply: '2026-02-14 09:00', messages: 2 },
];

const FAQ_ITEMS = [
  { id: '1', question: 'Comment suivre ma commande ?', answer: 'Rendez-vous dans "Mes commandes" pour voir le statut en temps réel. Un email de suivi est envoyé à chaque étape.', category: 'Commandes', views: 1240, helpful: 89 },
  { id: '2', question: 'Quels sont les délais de livraison ?', answer: 'France métropolitaine : 2-4 jours ouvrés. Europe : 5-8 jours. International : 10-15 jours.', category: 'Livraison', views: 980, helpful: 92 },
  { id: '3', question: 'Comment retourner un article ?', answer: 'Vous disposez de 30 jours pour retourner un article. Initiez le retour depuis votre espace client.', category: 'Retours', views: 856, helpful: 85 },
  { id: '4', question: 'Quels moyens de paiement acceptez-vous ?', answer: 'Carte bancaire (Visa, Mastercard, Amex), PayPal, Apple Pay, Google Pay et virement SEPA.', category: 'Paiement', views: 720, helpful: 95 },
  { id: '5', question: 'Comment fonctionne le programme de fidélité ?', answer: 'Gagnez 1 point par euro dépensé. À partir de 100 points, bénéficiez de -5% sur votre prochaine commande.', category: 'Fidélité', views: 540, helpful: 88 },
  { id: '6', question: 'Comment contacter le service client ?', answer: 'Par chat en direct, par email à support@shopopti.io ou par téléphone au 01 23 45 67 89.', category: 'Support', views: 1100, helpful: 91 },
];

// ============================================
// Sub-components
// ============================================
const segmentColors: Record<string, string> = {
  VIP: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  Active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  New: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  Repeat: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
  'At Risk': 'bg-red-500/10 text-red-600 border-red-500/30',
};

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

function StatCard({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: string; trend?: string; color: string }) {
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
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// Customer List Tab
// ============================================
function CustomersTab() {
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');

  const filtered = CUSTOMERS.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchSegment = segmentFilter === 'all' || c.segment === segmentFilter;
    return matchSearch && matchSegment;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
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
        <Button className="gap-2"><UserPlus className="h-4 w-4" /> Ajouter</Button>
      </div>

      {/* Customer Cards */}
      <div className="grid gap-3">
        <AnimatePresence>
          {filtered.map((customer, i) => (
            <motion.div key={customer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {customer.avatar}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground truncate">{customer.name}</span>
                        <Badge variant="outline" className={`text-[10px] ${segmentColors[customer.segment]}`}>{customer.segment}</Badge>
                        <Badge variant="outline" className="text-[10px]">{customer.loyalty}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{customer.email}</span>
                        <span className="hidden sm:flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-foreground">{customer.orders}</p>
                        <p className="text-[10px] text-muted-foreground">Commandes</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground">{customer.revenue.toLocaleString('fr-FR')} €</p>
                        <p className="text-[10px] text-muted-foreground">CA Total</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Progress value={customer.score} className="w-16 h-1.5" />
                          <span className="text-xs font-medium">{customer.score}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Score</p>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================
// Tickets Tab
// ============================================
function TicketsTab() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewTicket, setShowNewTicket] = useState(false);

  const filtered = TICKETS.filter(t => statusFilter === 'all' || t.status === statusFilter);

  const ticketCounts = {
    all: TICKETS.length,
    open: TICKETS.filter(t => t.status === 'open').length,
    in_progress: TICKETS.filter(t => t.status === 'in_progress').length,
    resolved: TICKETS.filter(t => t.status === 'resolved').length,
  };

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
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
              <Input placeholder="Sujet du ticket" />
              <Select><SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">Livraison</SelectItem>
                  <SelectItem value="refund">Remboursement</SelectItem>
                  <SelectItem value="product">Produit</SelectItem>
                  <SelectItem value="billing">Facturation</SelectItem>
                  <SelectItem value="loyalty">Fidélité</SelectItem>
                </SelectContent>
              </Select>
              <Select><SelectTrigger><SelectValue placeholder="Priorité" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Décrivez le problème..." rows={4} />
              <Button className="w-full gap-2"><Send className="h-4 w-4" /> Créer le ticket</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ticket List */}
      <div className="grid gap-3">
        {filtered.map((ticket, i) => {
          const status = statusConfig[ticket.status];
          const priority = priorityConfig[ticket.priority];
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
                        <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                        <Badge variant="outline" className={`text-[10px] ${priority.color}`}>{priority.label}</Badge>
                        <Badge variant="outline" className="text-[10px]">{ticket.category}</Badge>
                      </div>
                      <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{ticket.customer}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ticket.created}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{ticket.messages} msgs</span>
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
    </div>
  );
}

// ============================================
// FAQ Tab
// ============================================
function FAQTab() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = [...new Set(FAQ_ITEMS.map(f => f.category))];
  const filtered = FAQ_ITEMS.filter(f => {
    const matchSearch = !search || f.question.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || f.category === category;
    return matchSearch && matchCat;
  });

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
        {filtered.map((faq, i) => (
          <motion.div key={faq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border border-border/50 hover:border-primary/30 transition-all h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5 shrink-0">
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Badge variant="outline" className="text-[10px] mb-2">{faq.category}</Badge>
                    <p className="font-medium text-foreground mb-2">{faq.question}</p>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{faq.views} vues</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{faq.helpful}% utile</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Lifecycle Funnel
// ============================================
function LifecycleFunnel() {
  const stages = [
    { name: 'Nouveaux', count: 245, percent: 100, color: 'bg-blue-500' },
    { name: 'Actifs', count: 189, percent: 77, color: 'bg-emerald-500' },
    { name: 'Récurrents', count: 98, percent: 40, color: 'bg-violet-500' },
    { name: 'VIP', count: 34, percent: 14, color: 'bg-amber-500' },
    { name: 'À risque', count: 18, percent: 7, color: 'bg-red-500' },
  ];

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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">CRM & Service Client</h1>
        <p className="text-muted-foreground mt-1">Gestion centralisée de vos clients, tickets et FAQ</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Clients actifs" value="1,247" trend="+12%" color="bg-primary/10 text-primary" />
        <StatCard icon={MessageSquare} label="Tickets ouverts" value="8" trend="-23%" color="bg-amber-500/10 text-amber-600" />
        <StatCard icon={Star} label="Satisfaction" value="4.8/5" trend="+0.3" color="bg-emerald-500/10 text-emerald-600" />
        <StatCard icon={Zap} label="Temps de réponse" value="< 2h" trend="-15min" color="bg-violet-500/10 text-violet-600" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs Section */}
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

        {/* Sidebar */}
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
