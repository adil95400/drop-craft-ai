import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, TrendingUp, TrendingDown, Plus, Edit2, Trash2, 
  DollarSign, ShoppingCart, Users, Package, Percent, Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface KPI {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  type: 'revenue' | 'orders' | 'customers' | 'products' | 'conversion' | 'custom';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

const defaultKPIs: KPI[] = [
  { id: '1', name: 'Chiffre d\'affaires mensuel', target: 50000, current: 42500, unit: '€', type: 'revenue', period: 'monthly' },
  { id: '2', name: 'Commandes par jour', target: 50, current: 45, unit: '', type: 'orders', period: 'daily' },
  { id: '3', name: 'Nouveaux clients', target: 200, current: 180, unit: '', type: 'customers', period: 'monthly' },
  { id: '4', name: 'Taux de conversion', target: 3.5, current: 2.8, unit: '%', type: 'conversion', period: 'weekly' },
  { id: '5', name: 'Panier moyen', target: 85, current: 78, unit: '€', type: 'revenue', period: 'monthly' },
  { id: '6', name: 'Produits vendus', target: 1000, current: 920, unit: '', type: 'products', period: 'monthly' },
];

const typeIcons = {
  revenue: DollarSign,
  orders: ShoppingCart,
  customers: Users,
  products: Package,
  conversion: Percent,
  custom: Target,
};

const typeLabels = {
  revenue: 'Revenus',
  orders: 'Commandes',
  customers: 'Clients',
  products: 'Produits',
  conversion: 'Conversion',
  custom: 'Personnalisé',
};

const periodLabels = {
  daily: 'Journalier',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
};

export function KPIsDashboard() {
  const [kpis, setKpis] = useState<KPI[]>(defaultKPIs);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    target: 0,
    current: 0,
    unit: '',
    type: 'custom' as KPI['type'],
    period: 'monthly' as KPI['period'],
  });

  const handleAddKPI = () => {
    const newKPI: KPI = {
      id: Date.now().toString(),
      ...formData,
    };
    setKpis([...kpis, newKPI]);
    setFormData({ name: '', target: 0, current: 0, unit: '', type: 'custom', period: 'monthly' });
    setIsDialogOpen(false);
  };

  const handleEditKPI = (kpi: KPI) => {
    setEditingKPI(kpi);
    setFormData({
      name: kpi.name,
      target: kpi.target,
      current: kpi.current,
      unit: kpi.unit,
      type: kpi.type,
      period: kpi.period,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateKPI = () => {
    if (editingKPI) {
      setKpis(kpis.map(k => k.id === editingKPI.id ? { ...k, ...formData } : k));
      setEditingKPI(null);
      setFormData({ name: '', target: 0, current: 0, unit: '', type: 'custom', period: 'monthly' });
      setIsDialogOpen(false);
    }
  };

  const handleDeleteKPI = (id: string) => {
    setKpis(kpis.filter(k => k.id !== id));
  };

  const getProgress = (kpi: KPI) => {
    return Math.min((kpi.current / kpi.target) * 100, 100);
  };

  const getStatus = (kpi: KPI) => {
    const progress = getProgress(kpi);
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'warning';
    return 'danger';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">KPIs & Objectifs</h2>
          <p className="text-sm text-muted-foreground">Suivez vos indicateurs clés de performance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingKPI(null); setFormData({ name: '', target: 0, current: 0, unit: '', type: 'custom', period: 'monthly' }); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un KPI
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingKPI ? 'Modifier le KPI' : 'Nouveau KPI'}</DialogTitle>
              <DialogDescription>
                Définissez votre indicateur de performance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du KPI</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Chiffre d'affaires mensuel"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target">Objectif</Label>
                  <Input
                    id="target"
                    type="number"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current">Valeur actuelle</Label>
                  <Input
                    id="current"
                    type="number"
                    value={formData.current}
                    onChange={(e) => setFormData({ ...formData, current: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as KPI['type'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Période</Label>
                  <Select value={formData.period} onValueChange={(v) => setFormData({ ...formData, period: v as KPI['period'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(periodLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unité (optionnel)</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Ex: €, %, unités"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button onClick={editingKPI ? handleUpdateKPI : handleAddKPI}>
                {editingKPI ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = typeIcons[kpi.type];
          const progress = getProgress(kpi);
          const status = getStatus(kpi);
          
          return (
            <Card key={kpi.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(status)}`} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {periodLabels[kpi.period]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditKPI(kpi)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteKPI(kpi.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {kpi.current.toLocaleString()}{kpi.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        sur {kpi.target.toLocaleString()}{kpi.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {progress >= 100 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={progress >= 100 ? 'text-green-500 font-medium' : 'text-muted-foreground'}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
