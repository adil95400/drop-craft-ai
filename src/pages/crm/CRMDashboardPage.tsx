import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useCRM, type CustomerWithScore } from '@/hooks/useCRM';
import {
  Users, Star, TrendingUp, DollarSign, Search, RefreshCw, Plus,
  Mail, MessageSquare, Target, Crown, UserCheck, UserX, Loader2
} from 'lucide-react';

const scoreColor = (score: number) => {
  if (score >= 70) return 'text-green-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
};

const scoreBadge = (score: number) => {
  if (score >= 70) return { label: 'VIP', variant: 'default' as const, icon: Crown };
  if (score >= 40) return { label: 'Actif', variant: 'secondary' as const, icon: UserCheck };
  return { label: 'À risque', variant: 'destructive' as const, icon: UserX };
};

export default function CRMDashboardPage() {
  const { customers, segments, communications, isLoading, createSegment, calculateScores, isCalculating, createCommunication, stats } = useCRM();
  const [search, setSearch] = useState('');
  const [segmentName, setSegmentName] = useState('');
  const [segmentDesc, setSegmentDesc] = useState('');
  const [segmentColor, setSegmentColor] = useState('#6366f1');
  const [commSubject, setCommSubject] = useState('');
  const [commContent, setCommContent] = useState('');
  const [commType, setCommType] = useState('email');
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [showCommDialog, setShowCommDialog] = useState(false);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateSegment = () => {
    if (!segmentName) return;
    createSegment({ name: segmentName, description: segmentDesc, color: segmentColor });
    setSegmentName(''); setSegmentDesc(''); setShowSegmentDialog(false);
  };

  const handleCreateComm = () => {
    if (!commSubject) return;
    createCommunication({ subject: commSubject, content: commContent, communication_type: commType });
    setCommSubject(''); setCommContent(''); setShowCommDialog(false);
  };

  return (
    <ChannablePageWrapper
      title="CRM & Clients"
      description="Gestion avancée de la relation client : segments, scoring RFM et communications."
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" /> Total Clients
            </div>
            <p className="text-2xl font-bold">{stats.totalCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Star className="h-3.5 w-3.5" /> Score Moyen
            </div>
            <p className="text-2xl font-bold">{stats.avgScore}<span className="text-sm text-muted-foreground">/100</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3.5 w-3.5" /> Revenu Total
            </div>
            <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(0)}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Crown className="h-3.5 w-3.5" /> Clients VIP
            </div>
            <p className="text-2xl font-bold">{stats.vipCustomers}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">
            <Users className="h-4 w-4 mr-1" /> Clients ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="segments">
            <Target className="h-4 w-4 mr-1" /> Segments ({segments.length})
          </TabsTrigger>
          <TabsTrigger value="communications">
            <Mail className="h-4 w-4 mr-1" /> Communications ({communications.length})
          </TabsTrigger>
        </TabsList>

        {/* === CUSTOMERS TAB === */}
        <TabsContent value="customers" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" onClick={() => calculateScores()} disabled={isCalculating}>
              {isCalculating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Recalculer Scores
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-2">
              {filtered.map(c => {
                const score = c.score?.total_score || 0;
                const badge = scoreBadge(score);
                const Icon = badge.icon;
                return (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{c.name}</p>
                          <Badge variant={badge.variant} className="text-xs gap-1">
                            <Icon className="h-3 w-3" />{badge.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{c.email}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Commandes</p>
                          <p className="font-medium">{c.total_orders}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Dépensé</p>
                          <p className="font-medium">{c.total_spent.toFixed(0)}€</p>
                        </div>
                        <div className="text-center w-20">
                          <p className="text-muted-foreground text-xs">Score</p>
                          <div className="flex items-center gap-1">
                            <span className={`font-bold ${scoreColor(score)}`}>{score}</span>
                            <Progress value={score} className="h-1.5 flex-1" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun client trouvé</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* === SEGMENTS TAB === */}
        <TabsContent value="segments" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showSegmentDialog} onOpenChange={setShowSegmentDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Nouveau Segment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Créer un segment</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nom</Label><Input value={segmentName} onChange={e => setSegmentName(e.target.value)} placeholder="Ex: Clients VIP" /></div>
                  <div><Label>Description</Label><Textarea value={segmentDesc} onChange={e => setSegmentDesc(e.target.value)} placeholder="Description du segment..." /></div>
                  <div><Label>Couleur</Label><Input type="color" value={segmentColor} onChange={e => setSegmentColor(e.target.value)} className="h-10 w-20" /></div>
                  <Button onClick={handleCreateSegment} className="w-full">Créer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {segments.map(s => (
              <Card key={s.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <CardTitle className="text-sm">{s.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">{s.description || 'Pas de description'}</p>
                  <div className="flex justify-between text-xs">
                    <span>{s.customer_count} clients</span>
                    <Badge variant={s.is_dynamic ? 'secondary' : 'outline'} className="text-xs">
                      {s.is_dynamic ? 'Dynamique' : 'Statique'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {segments.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucun segment créé</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* === COMMUNICATIONS TAB === */}
        <TabsContent value="communications" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showCommDialog} onOpenChange={setShowCommDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Nouvelle Communication</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Créer une communication</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={commType} onValueChange={setCommType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Sujet</Label><Input value={commSubject} onChange={e => setCommSubject(e.target.value)} placeholder="Sujet de la communication" /></div>
                  <div><Label>Contenu</Label><Textarea value={commContent} onChange={e => setCommContent(e.target.value)} placeholder="Corps du message..." rows={4} /></div>
                  <Button onClick={handleCreateComm} className="w-full">Créer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {communications.map(comm => (
              <Card key={comm.id}>
                <CardContent className="py-3 flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    {comm.communication_type === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{comm.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{comm.content || 'Pas de contenu'}</p>
                  </div>
                  <Badge variant={comm.status === 'sent' ? 'default' : comm.status === 'scheduled' ? 'secondary' : 'outline'}>
                    {comm.status === 'sent' ? 'Envoyé' : comm.status === 'scheduled' ? 'Planifié' : 'Brouillon'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {communications.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucune communication</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
