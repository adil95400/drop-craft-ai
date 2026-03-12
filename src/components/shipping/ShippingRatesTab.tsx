import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { useShippingZones, useShippingRates, useCreateShippingRate, useDeleteShippingRate } from '@/hooks/useShippingZones';
import { useCarriers } from '@/hooks/useFulfillment';
import { Skeleton } from '@/components/ui/skeleton';

export function ShippingRatesTab() {
  const { data: zones = [] } = useShippingZones();
  const { data: rates = [], isLoading } = useShippingRates();
  const { data: carriers = [] } = useCarriers();
  const createRate = useCreateShippingRate();
  const deleteRate = useDeleteShippingRate();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', zone_id: '', carrier_id: '', rate_type: 'flat',
    base_rate: '', per_kg_rate: '', free_shipping_threshold: '',
    min_weight: '0', max_weight: '', estimated_days_min: '2', estimated_days_max: '5',
  });

  const handleCreate = () => {
    createRate.mutate({
      name: form.name,
      zone_id: form.zone_id,
      carrier_id: form.carrier_id || null,
      rate_type: form.rate_type,
      base_rate: parseFloat(form.base_rate) || 0,
      per_kg_rate: parseFloat(form.per_kg_rate) || 0,
      free_shipping_threshold: form.free_shipping_threshold ? parseFloat(form.free_shipping_threshold) : null,
      min_weight: parseFloat(form.min_weight) || 0,
      max_weight: form.max_weight ? parseFloat(form.max_weight) : null,
      estimated_days_min: parseInt(form.estimated_days_min) || 2,
      estimated_days_max: parseInt(form.estimated_days_max) || 5,
      is_active: true,
    }, {
      onSuccess: () => {
        setIsOpen(false);
        setForm({ name: '', zone_id: '', carrier_id: '', rate_type: 'flat', base_rate: '', per_kg_rate: '', free_shipping_threshold: '', min_weight: '0', max_weight: '', estimated_days_min: '2', estimated_days_max: '5' });
      },
    });
  };

  const getZoneName = (id: string) => zones.find(z => z.id === id)?.name || '—';
  const getCarrierName = (id: string | null) => {
    if (!id) return 'Tous';
    return (carriers as any[]).find((c: any) => c.id === id)?.name || id;
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tarifs d'expédition</h3>
          <p className="text-sm text-muted-foreground">Définissez les prix par zone et transporteur</p>
        </div>
        <Button onClick={() => setIsOpen(true)} disabled={zones.length === 0}>
          <Plus className="h-4 w-4 mr-2" />Nouveau tarif
        </Button>
      </div>

      {zones.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-8 text-center text-muted-foreground">
          Créez d'abord une zone d'expédition dans l'onglet "Zones"
        </CardContent></Card>
      ) : rates.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h4 className="font-semibold mb-2">Aucun tarif configuré</h4>
          <Button onClick={() => setIsOpen(true)}><Plus className="h-4 w-4 mr-2" />Créer un tarif</Button>
        </CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Transporteur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Tarif base</TableHead>
                <TableHead className="text-right">/kg</TableHead>
                <TableHead>Délai</TableHead>
                <TableHead>Gratuit dès</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map(rate => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">{rate.name}</TableCell>
                  <TableCell><Badge variant="outline">{getZoneName(rate.zone_id)}</Badge></TableCell>
                  <TableCell>{getCarrierName(rate.carrier_id)}</TableCell>
                  <TableCell><Badge variant="secondary">{rate.rate_type}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{rate.base_rate.toFixed(2)} €</TableCell>
                  <TableCell className="text-right font-mono">{rate.per_kg_rate > 0 ? `${rate.per_kg_rate.toFixed(2)} €` : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{rate.estimated_days_min}-{rate.estimated_days_max}j</TableCell>
                  <TableCell>{rate.free_shipping_threshold ? `${rate.free_shipping_threshold} €` : '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteRate.mutate(rate.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nouveau tarif d'expédition</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nom</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Standard France" /></div>
              <div><Label>Zone</Label>
                <Select value={form.zone_id} onValueChange={v => setForm(f => ({ ...f, zone_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Zone" /></SelectTrigger>
                  <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Transporteur (opt.)</Label>
                <Select value={form.carrier_id} onValueChange={v => setForm(f => ({ ...f, carrier_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les transporteurs</SelectItem>
                    {(carriers as any[]).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Type</Label>
                <Select value={form.rate_type} onValueChange={v => setForm(f => ({ ...f, rate_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Forfait</SelectItem>
                    <SelectItem value="weight">Au poids</SelectItem>
                    <SelectItem value="tiered">Par paliers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Tarif de base (€)</Label><Input type="number" step="0.01" value={form.base_rate} onChange={e => setForm(f => ({ ...f, base_rate: e.target.value }))} /></div>
              <div><Label>Par kg (€)</Label><Input type="number" step="0.01" value={form.per_kg_rate} onChange={e => setForm(f => ({ ...f, per_kg_rate: e.target.value }))} /></div>
              <div><Label>Gratuit dès (€)</Label><Input type="number" step="1" value={form.free_shipping_threshold} onChange={e => setForm(f => ({ ...f, free_shipping_threshold: e.target.value }))} placeholder="Ex: 50" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Délai min (jours)</Label><Input type="number" value={form.estimated_days_min} onChange={e => setForm(f => ({ ...f, estimated_days_min: e.target.value }))} /></div>
              <div><Label>Délai max (jours)</Label><Input type="number" value={form.estimated_days_max} onChange={e => setForm(f => ({ ...f, estimated_days_max: e.target.value }))} /></div>
            </div>
            <Button onClick={handleCreate} disabled={!form.name || !form.zone_id || !form.base_rate} className="w-full">
              Créer le tarif
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
