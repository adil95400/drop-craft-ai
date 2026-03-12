import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Globe, MapPin } from 'lucide-react';
import { useShippingZones, useCreateShippingZone, useDeleteShippingZone } from '@/hooks/useShippingZones';
import { Skeleton } from '@/components/ui/skeleton';

const COUNTRY_PRESETS: Record<string, string[]> = {
  'Europe de l\'Ouest': ['FR', 'DE', 'BE', 'NL', 'LU', 'CH', 'AT', 'IT', 'ES', 'PT'],
  'Europe du Nord': ['GB', 'IE', 'DK', 'SE', 'NO', 'FI'],
  'Europe de l\'Est': ['PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR'],
  'Amérique du Nord': ['US', 'CA', 'MX'],
  'Asie-Pacifique': ['CN', 'JP', 'KR', 'AU', 'NZ', 'SG'],
  'Monde entier': ['WORLDWIDE'],
};

export function ShippingZonesTab() {
  const { data: zones = [], isLoading } = useShippingZones();
  const createZone = useCreateShippingZone();
  const deleteZone = useDeleteShippingZone();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', countries: '' as string, preset: '' });

  const handleCreate = () => {
    const countries = form.preset
      ? COUNTRY_PRESETS[form.preset] || []
      : form.countries.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

    createZone.mutate({ name: form.name, countries, is_active: true }, {
      onSuccess: () => { setIsOpen(false); setForm({ name: '', countries: '', preset: '' }); },
    });
  };

  if (isLoading) return <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-40" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Zones d'expédition</h3>
          <p className="text-sm text-muted-foreground">Groupez les pays par zone pour définir vos tarifs</p>
        </div>
        <Button onClick={() => setIsOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouvelle zone</Button>
      </div>

      {zones.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h4 className="font-semibold mb-2">Aucune zone configurée</h4>
            <p className="text-sm text-muted-foreground mb-4">Créez des zones géographiques pour structurer vos tarifs d'expédition</p>
            <Button onClick={() => setIsOpen(true)}><Plus className="h-4 w-4 mr-2" />Créer ma première zone</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map(zone => (
            <Card key={zone.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{zone.name}</CardTitle>
                  </div>
                  <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                    {zone.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {zone.countries.slice(0, 8).map(c => (
                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                  {zone.countries.length > 8 && (
                    <Badge variant="outline" className="text-xs">+{zone.countries.length - 8}</Badge>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{zone.countries.length} pays</span>
                  <Button variant="ghost" size="sm" onClick={() => deleteZone.mutate(zone.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle zone d'expédition</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom de la zone</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Europe de l'Ouest" />
            </div>
            <div>
              <Label>Preset rapide</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.keys(COUNTRY_PRESETS).map(preset => (
                  <Badge
                    key={preset}
                    variant={form.preset === preset ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setForm(f => ({ ...f, preset: f.preset === preset ? '' : preset, countries: '' }))}
                  >
                    {preset}
                  </Badge>
                ))}
              </div>
            </div>
            {!form.preset && (
              <div>
                <Label>Codes pays (séparés par des virgules)</Label>
                <Input value={form.countries} onChange={e => setForm(f => ({ ...f, countries: e.target.value }))} placeholder="FR, DE, BE, NL" />
              </div>
            )}
            <Button onClick={handleCreate} disabled={!form.name || (!form.preset && !form.countries)} className="w-full">
              Créer la zone
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
