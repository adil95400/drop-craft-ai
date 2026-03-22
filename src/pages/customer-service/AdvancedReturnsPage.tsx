/**
 * Advanced Returns & Claims Portal
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  RotateCcw, Plus, Package, AlertTriangle, CheckCircle, XCircle,
  Clock, Search, TrendingDown, Euro, FileText, ArrowRight, Truck
} from 'lucide-react';

interface ReturnItem {
  id: string;
  rma_number: string;
  order_id: string | null;
  customer_name: string;
  customer_email: string;
  reason: string;
  reason_category: string;
  status: string;
  items: any;
  refund_amount: number;
  refund_method: string;
  tracking_number: string | null;
  carrier: string | null;
  resolution: string | null;
  notes: string | null;
  created_at: string;
}

export default function AdvancedReturnsPage() {
  const { user } = useAuthOptimized();
  const queryClient = useQueryClient();
  const [newReturnDialog, setNewReturnDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [returnForm, setReturnForm] = useState({
    customer_name: '', customer_email: '', order_id: '',
    reason: '', reason_category: 'defective', refund_amount: '',
    refund_method: 'original', items: '',
  });

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['returns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        rma_number: d.rma_number || '',
        order_id: d.order_id,
        customer_name: d.customer_name || d.customer_id || '',
        customer_email: d.customer_email || '',
        reason: d.reason || d.description || '',
        reason_category: d.reason_category || 'other',
        status: d.status || 'requested',
        items: d.items,
        refund_amount: d.refund_amount || 0,
        refund_method: d.refund_method || 'original',
        tracking_number: d.tracking_number,
        carrier: d.carrier,
        resolution: d.resolution || null,
        notes: d.notes,
        created_at: d.created_at,
      })) as ReturnItem[];
    },
    enabled: !!user?.id,
  });

  const createReturn = useMutation({
    mutationFn: async () => {
      const { data: rmaNum } = await supabase.rpc('generate_rma_number');
      const { error } = await supabase.from('returns').insert({
        user_id: user!.id,
        rma_number: rmaNum || `RMA-${Date.now()}`,
        customer_name: returnForm.customer_name,
        customer_email: returnForm.customer_email,
        order_id: returnForm.order_id || null,
        reason: returnForm.reason,
        reason_category: returnForm.reason_category,
        refund_amount: parseFloat(returnForm.refund_amount) || 0,
        refund_method: returnForm.refund_method,
        items: returnForm.items ? JSON.parse(`[{"description":"${returnForm.items}"}]`) : [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Retour créé avec succès');
      setNewReturnDialog(false);
      setReturnForm({ customer_name: '', customer_email: '', order_id: '', reason: '', reason_category: 'defective', refund_amount: '', refund_method: 'original', items: '' });
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateReturnStatus = useMutation({
    mutationFn: async ({ id, status, resolution }: { id: string; status: string; resolution?: string }) => {
      const updates: any = { status };
      if (resolution) updates.resolution = resolution;
      if (status === 'refunded') updates.refunded_at = new Date().toISOString();
      const { error } = await supabase.from('returns').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Statut mis à jour');
    },
  });

  const filteredReturns = returns.filter(r => {
    const matchesSearch = !searchTerm || r.rma_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'requested' || r.status === 'approved').length,
    inTransit: returns.filter(r => r.status === 'shipped' || r.status === 'received').length,
    completed: returns.filter(r => r.status === 'refunded' || r.status === 'closed').length,
    totalValue: returns.reduce((s, r) => s + (r.refund_amount || 0), 0),
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      requested: { label: 'Demandé', variant: 'outline' },
      approved: { label: 'Approuvé', variant: 'default' },
      shipped: { label: 'Expédié', variant: 'secondary' },
      received: { label: 'Reçu', variant: 'secondary' },
      inspected: { label: 'Inspecté', variant: 'default' },
      refunded: { label: 'Remboursé', variant: 'default' },
      rejected: { label: 'Rejeté', variant: 'destructive' },
      closed: { label: 'Fermé', variant: 'outline' },
    };
    const s = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <>
      <Helmet><title>Retours & Réclamations — Drop-Craft AI</title></Helmet>
      <ChannablePageWrapper
        title={tPages('retoursReclamations.title')}
        description="Gérez les retours produits, réclamations et remboursements"
        badge={{ label: 'Retours', icon: RotateCcw }}
      >
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total retours', value: stats.total, icon: Package, color: 'text-primary' },
            { label: 'En attente', value: stats.pending, icon: Clock, color: 'text-warning' },
            { label: 'En transit', value: stats.inTransit, icon: Truck, color: 'text-info' },
            { label: 'Complétés', value: stats.completed, icon: CheckCircle, color: 'text-success' },
            { label: 'Valeur totale', value: `${stats.totalValue.toFixed(0)}€`, icon: Euro, color: 'text-primary' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`h-5 w-5 ${s.color}`} />
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
            <Input placeholder="Rechercher par RMA ou client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="requested">Demandé</SelectItem>
              <SelectItem value="approved">Approuvé</SelectItem>
              <SelectItem value="shipped">Expédié</SelectItem>
              <SelectItem value="received">Reçu</SelectItem>
              <SelectItem value="refunded">Remboursé</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={newReturnDialog} onOpenChange={setNewReturnDialog}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouveau retour</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Créer un retour</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nom client *</Label><Input value={returnForm.customer_name} onChange={e => setReturnForm(p => ({ ...p, customer_name: e.target.value }))} /></div>
                  <div><Label>Email *</Label><Input value={returnForm.customer_email} onChange={e => setReturnForm(p => ({ ...p, customer_email: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>N° commande</Label><Input value={returnForm.order_id} onChange={e => setReturnForm(p => ({ ...p, order_id: e.target.value }))} /></div>
                  <div>
                    <Label>Catégorie</Label>
                    <Select value={returnForm.reason_category} onValueChange={v => setReturnForm(p => ({ ...p, reason_category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="defective">Défectueux</SelectItem>
                        <SelectItem value="wrong_item">Mauvais article</SelectItem>
                        <SelectItem value="not_as_described">Non conforme</SelectItem>
                        <SelectItem value="changed_mind">Rétractation</SelectItem>
                        <SelectItem value="damaged">Endommagé</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Articles concernés</Label><Input value={returnForm.items} onChange={e => setReturnForm(p => ({ ...p, items: e.target.value }))} placeholder="Description des articles" /></div>
                <div><Label>Raison détaillée</Label><Textarea value={returnForm.reason} onChange={e => setReturnForm(p => ({ ...p, reason: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Montant remboursement (€)</Label><Input type="number" value={returnForm.refund_amount} onChange={e => setReturnForm(p => ({ ...p, refund_amount: e.target.value }))} /></div>
                  <div>
                    <Label>Méthode</Label>
                    <Select value={returnForm.refund_method} onValueChange={v => setReturnForm(p => ({ ...p, refund_method: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">Moyen original</SelectItem>
                        <SelectItem value="store_credit">Avoir boutique</SelectItem>
                        <SelectItem value="exchange">Échange</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => createReturn.mutate()} disabled={createReturn.isPending || !returnForm.customer_name || !returnForm.customer_email}>
                  Créer le retour
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Returns table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RMA</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun retour trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReturns.map(ret => (
                    <TableRow key={ret.id}>
                      <TableCell className="font-mono text-xs">{ret.rma_number}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{ret.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{ret.customer_email}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{ret.reason_category}</Badge></TableCell>
                      <TableCell className="font-medium">{ret.refund_amount?.toFixed(2)}€</TableCell>
                      <TableCell>{getStatusBadge(ret.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(ret.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {ret.status === 'requested' && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateReturnStatus.mutate({ id: ret.id, status: 'approved' })}>
                                <CheckCircle className="h-3 w-3 mr-1" />Approuver
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => updateReturnStatus.mutate({ id: ret.id, status: 'rejected', resolution: 'Rejeté' })}>
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {ret.status === 'approved' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateReturnStatus.mutate({ id: ret.id, status: 'received' })}>
                              <Package className="h-3 w-3 mr-1" />Reçu
                            </Button>
                          )}
                          {ret.status === 'received' && (
                            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => updateReturnStatus.mutate({ id: ret.id, status: 'refunded', resolution: 'Remboursé' })}>
                              <Euro className="h-3 w-3 mr-1" />Rembourser
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
