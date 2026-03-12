import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Package, Truck, Split, FileText, Palette, Plus, CheckCircle, Clock, XCircle,
  Loader2, Trash2, Star, Eye, Settings, Zap, RotateCcw, ArrowRight
} from 'lucide-react';
import { useSplitOrders, usePackingSlipTemplates, useBatchFulfillment } from '@/hooks/useOrderFulfillmentHub';
import { useAutoFulfillment } from '@/hooks/useAutoFulfillment';
import { format } from 'date-fns';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: any; icon: any; label: string }> = {
    pending: { variant: 'secondary', icon: Clock, label: 'En attente' },
    processing: { variant: 'outline', icon: Loader2, label: 'En cours' },
    shipped: { variant: 'default', icon: Truck, label: 'Expédié' },
    delivered: { variant: 'default', icon: CheckCircle, label: 'Livré' },
    completed: { variant: 'default', icon: CheckCircle, label: 'Complété' },
    failed: { variant: 'destructive', icon: XCircle, label: 'Échoué' },
  };
  const s = map[status] || { variant: 'outline', icon: Package, label: status };
  const Icon = s.icon;
  return <Badge variant={s.variant}><Icon className="h-3 w-3 mr-1" />{s.label}</Badge>;
}

// ─── Split Orders Tab ────────────────────────────────────────────────

function SplitOrdersTab() {
  const { splits, isLoading, stats, updateSplitStatus } = useSplitOrders();

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'En attente', value: stats.pending, color: 'text-yellow-600' },
          { label: 'En cours', value: stats.processing, color: 'text-blue-600' },
          { label: 'Expédiés', value: stats.shipped, color: 'text-green-600' },
          { label: 'Échoués', value: stats.failed, color: 'text-destructive' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Split orders list */}
      {splits.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Split className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucun split order. Les commandes multi-fournisseurs seront fractionnées automatiquement.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {splits.map((split: any) => (
            <Card key={split.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{split.supplier_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(split.items as any[])?.length || 0} article(s) • {split.subtotal || 0}€
                      </p>
                    </div>
                    <StatusBadge status={split.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    {split.tracking_number && (
                      <Badge variant="outline" className="font-mono text-xs">{split.tracking_number}</Badge>
                    )}
                    {split.status === 'pending' && (
                      <Button size="sm" variant="outline"
                        onClick={() => updateSplitStatus.mutate({ id: split.id, status: 'processing' })}>
                        <Zap className="h-3 w-3 mr-1" />Traiter
                      </Button>
                    )}
                    {split.status === 'failed' && (
                      <Button size="sm" variant="outline"
                        onClick={() => updateSplitStatus.mutate({ id: split.id, status: 'pending' })}>
                        <RotateCcw className="h-3 w-3 mr-1" />Réessayer
                      </Button>
                    )}
                  </div>
                </div>
                {split.error_message && (
                  <p className="text-xs text-destructive mt-2">{split.error_message}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Packing Slips Tab ───────────────────────────────────────────────

function PackingSlipsTab() {
  const { templates, isLoading, createTemplate, deleteTemplate, updateTemplate } = usePackingSlipTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', company_name: '', company_address: '', thank_you_message: '',
    footer_text: '', show_prices: true, show_barcode: false, brand_color: '#000000',
    template_style: 'classic', insert_message: '', is_default: false,
  });

  const handleCreate = () => {
    createTemplate.mutate(form, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ name: '', company_name: '', company_address: '', thank_you_message: '',
          footer_text: '', show_prices: true, show_barcode: false, brand_color: '#000000',
          template_style: 'classic', insert_message: '', is_default: false });
      }
    });
  };

  if (isLoading) return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Bordereaux d'expédition</h3>
          <p className="text-sm text-muted-foreground">Personnalisez vos bordereaux avec votre marque</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nouveau template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un template de bordereau</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nom du template *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Bordereau premium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom de l'entreprise</Label>
                  <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                    placeholder="Ma Boutique" />
                </div>
                <div>
                  <Label>Style</Label>
                  <Select value={form.template_style} onValueChange={v => setForm(f => ({ ...f, template_style: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classique</SelectItem>
                      <SelectItem value="modern">Moderne</SelectItem>
                      <SelectItem value="minimal">Minimaliste</SelectItem>
                      <SelectItem value="branded">Branded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Adresse</Label>
                <Textarea value={form.company_address} onChange={e => setForm(f => ({ ...f, company_address: e.target.value }))}
                  placeholder="123 Rue du Commerce, 75001 Paris" rows={2} />
              </div>
              <div>
                <Label>Message de remerciement</Label>
                <Textarea value={form.thank_you_message} onChange={e => setForm(f => ({ ...f, thank_you_message: e.target.value }))}
                  placeholder="Merci pour votre commande ! 🎉" rows={2} />
              </div>
              <div>
                <Label>Insert promotionnel</Label>
                <Textarea value={form.insert_message} onChange={e => setForm(f => ({ ...f, insert_message: e.target.value }))}
                  placeholder="Utilisez le code MERCI10 pour -10% sur votre prochaine commande" rows={2} />
              </div>
              <div>
                <Label>Pied de page</Label>
                <Input value={form.footer_text} onChange={e => setForm(f => ({ ...f, footer_text: e.target.value }))}
                  placeholder="www.maboutique.fr • contact@maboutique.fr" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Couleur de marque</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.brand_color}
                      onChange={e => setForm(f => ({ ...f, brand_color: e.target.value }))}
                      className="h-9 w-12 rounded border cursor-pointer" />
                    <Input value={form.brand_color} onChange={e => setForm(f => ({ ...f, brand_color: e.target.value }))}
                      className="font-mono text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={form.show_prices} onCheckedChange={v => setForm(f => ({ ...f, show_prices: v }))} />
                  <Label>Afficher les prix</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.show_barcode} onCheckedChange={v => setForm(f => ({ ...f, show_barcode: v }))} />
                  <Label>Afficher les codes-barres</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_default} onCheckedChange={v => setForm(f => ({ ...f, is_default: v }))} />
                  <Label>Template par défaut</Label>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!form.name || createTemplate.isPending} className="w-full">
                {createTemplate.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Créer le template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucun template. Créez votre premier bordereau personnalisé.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t: any) => (
            <Card key={t.id} className="relative group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      {t.name}
                      {t.is_default && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{t.template_style}</p>
                  </div>
                  <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: t.brand_color }} />
                </div>

                {t.company_name && <p className="text-sm">{t.company_name}</p>}
                {t.thank_you_message && (
                  <p className="text-xs text-muted-foreground mt-1 italic">"{t.thank_you_message}"</p>
                )}

                <div className="flex gap-1.5 mt-3">
                  {t.show_prices && <Badge variant="outline" className="text-[10px]">Prix</Badge>}
                  {t.show_barcode && <Badge variant="outline" className="text-[10px]">Codes-barres</Badge>}
                  {t.insert_message && <Badge variant="outline" className="text-[10px]">Insert promo</Badge>}
                </div>

                <div className="flex gap-2 mt-4">
                  {!t.is_default && (
                    <Button size="sm" variant="outline"
                      onClick={() => updateTemplate.mutate({ id: t.id, is_default: true })}>
                      <Star className="h-3 w-3 mr-1" />Par défaut
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive"
                    onClick={() => deleteTemplate.mutate(t.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Batch Processing Tab ────────────────────────────────────────────

function BatchProcessingTab() {
  const { orders, isLoadingOrders } = useAutoFulfillment();
  const { batchProcess, batchRetry } = useBatchFulfillment();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pendingOrders = (orders || []).filter((o: any) => o.status === 'pending');
  const failedOrders = (orders || []).filter((o: any) => o.status === 'failed');

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = (list: any[]) => setSelected(new Set(list.map((o: any) => o.id)));

  if (isLoadingOrders) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => batchProcess.mutate(Array.from(selected))}
          disabled={selected.size === 0 || batchProcess.isPending}>
          {batchProcess.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
          Traiter la sélection ({selected.size})
        </Button>
        <Button variant="outline" onClick={() => selectAll(pendingOrders)} disabled={pendingOrders.length === 0}>
          Sélectionner en attente ({pendingOrders.length})
        </Button>
        <Button variant="outline" onClick={() => batchRetry.mutate(failedOrders.map((o: any) => o.id))}
          disabled={failedOrders.length === 0 || batchRetry.isPending}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Relancer échouées ({failedOrders.length})
        </Button>
      </div>

      {/* Order list */}
      {(orders || []).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucune commande dans la file d'attente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(orders || []).slice(0, 50).map((order: any) => (
            <Card key={order.id} className={`transition-colors ${selected.has(order.id) ? 'ring-2 ring-primary/50' : ''}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox checked={selected.has(order.id)} onCheckedChange={() => toggleSelect(order.id)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {order.shopify_order_id || order.order_id?.slice(0, 8)}
                    </p>
                    <StatusBadge status={order.status} />
                    <Badge variant="outline" className="text-xs">{order.supplier_name}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {order.items_count} article(s) • {order.supplier_cost?.toFixed(2) || '0.00'}€
                    {order.error_message && <span className="text-destructive ml-2">• {order.error_message}</span>}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {order.created_at ? format(new Date(order.created_at), 'dd/MM HH:mm') : '-'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function OrderFulfillmentHubPage() {
  return (
    <>
      <Helmet>
        <title>Order Fulfillment Hub - ShopOpti</title>
        <meta name="description" content="Centre de fulfillment : split orders, bordereaux personnalisés, traitement par lots" />
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Order Fulfillment Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Split orders multi-fournisseurs • Bordereaux personnalisés • Traitement par lots
          </p>
        </div>

        <Tabs defaultValue="batch" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="batch" className="gap-2"><Package className="h-4 w-4" />Traitement par lots</TabsTrigger>
            <TabsTrigger value="splits" className="gap-2"><Split className="h-4 w-4" />Split Orders</TabsTrigger>
            <TabsTrigger value="packing" className="gap-2"><FileText className="h-4 w-4" />Bordereaux</TabsTrigger>
          </TabsList>

          <TabsContent value="batch"><BatchProcessingTab /></TabsContent>
          <TabsContent value="splits"><SplitOrdersTab /></TabsContent>
          <TabsContent value="packing"><PackingSlipsTab /></TabsContent>
        </Tabs>
      </div>
    </>
  );
}
