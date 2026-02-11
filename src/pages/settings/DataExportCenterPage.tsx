import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, Database, Clock, CheckCircle2, Archive, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const exportModules = [
  { id: 'products', label: 'Produits', icon: Database, count: 1247 },
  { id: 'orders', label: 'Commandes', icon: FileText, count: 856 },
  { id: 'customers', label: 'Clients', icon: FileSpreadsheet, count: 3420 },
  { id: 'analytics', label: 'Analytics', icon: Archive, count: null },
  { id: 'suppliers', label: 'Fournisseurs', icon: Database, count: 18 },
  { id: 'inventory', label: 'Inventaire', icon: Archive, count: 2340 },
];

const recentExports = [
  { id: '1', module: 'Produits', format: 'CSV', date: '2026-02-11 14:00', size: '2.4 MB', status: 'completed' },
  { id: '2', module: 'Commandes', format: 'XLSX', date: '2026-02-10 09:30', size: '1.1 MB', status: 'completed' },
  { id: '3', module: 'Analytics', format: 'JSON', date: '2026-02-09 16:45', size: '5.8 MB', status: 'completed' },
];

export default function DataExportCenterPage() {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [format, setFormat] = useState('csv');

  const toggleModule = (id: string) => {
    setSelectedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleExport = () => {
    if (selectedModules.length === 0) {
      toast.error('Sélectionnez au moins un module');
      return;
    }
    toast.success('Export lancé', {
      description: `${selectedModules.length} module(s) en ${format.toUpperCase()}. Vous recevrez une notification quand c'est prêt.`,
    });
  };

  return (
    <ChannablePageWrapper
      title="Centre d'export de données"
      description="Exportez vos données en masse dans le format de votre choix"
      actions={
        <Button onClick={handleExport} disabled={selectedModules.length === 0}>
          <Download className="h-4 w-4 mr-2" /> Exporter ({selectedModules.length})
        </Button>
      }
    >
      {/* Format & Date range */}
      <div className="flex gap-4 flex-wrap">
        <div className="space-y-1">
          <label className="text-sm font-medium">Format</label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="xml">XML</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Période</label>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
              <SelectItem value="all">Toutes les données</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modules selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {exportModules.map((mod) => {
          const selected = selectedModules.includes(mod.id);
          return (
            <Card key={mod.id} className={`cursor-pointer transition-all ${selected ? 'border-primary ring-1 ring-primary/20' : ''}`} onClick={() => toggleModule(mod.id)}>
              <CardContent className="pt-4 flex items-center gap-3">
                <Checkbox checked={selected} />
                <mod.icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{mod.label}</p>
                  {mod.count !== null && <p className="text-xs text-muted-foreground">{mod.count.toLocaleString()} entrées</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent exports */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Exports récents</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentExports.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{exp.module}</p>
                    <p className="text-xs text-muted-foreground">{exp.date} · {exp.size}</p>
                  </div>
                  <Badge variant="secondary">{exp.format}</Badge>
                </div>
                <Button variant="outline" size="sm"><Download className="h-3 w-3 mr-1" /> Télécharger</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  );
}
