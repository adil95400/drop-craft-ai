import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, TrendingUp, TrendingDown, Plus, Edit2, Trash2, 
  DollarSign, ShoppingCart, Users, Package, Percent, Clock, Loader2
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
import { useUserKPIs, UserKPI, CreateKPIData } from '@/hooks/useUserKPIs';

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

const defaultKPIs: CreateKPIData[] = [
  { name: 'Chiffre d\'affaires mensuel', target: 50000, current_value: 0, unit: '€', kpi_type: 'revenue', period: 'monthly' },
  { name: 'Commandes par jour', target: 50, current_value: 0, unit: '', kpi_type: 'orders', period: 'daily' },
  { name: 'Nouveaux clients', target: 200, current_value: 0, unit: '', kpi_type: 'customers', period: 'monthly' },
  { name: 'Taux de conversion', target: 3.5, current_value: 0, unit: '%', kpi_type: 'conversion', period: 'weekly' },
];

export function KPIsDashboard() {
  const { kpis, isLoading, createKPI, updateKPI, deleteKPI, isCreating, isUpdating } = useUserKPIs();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<UserKPI | null>(null);
  const [formData, setFormData] = useState<CreateKPIData>({
    name: '',
    target: 0,
    current_value: 0,
    unit: '',
    kpi_type: 'custom',
    period: 'monthly',
  });
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize default KPIs if user has none
  useEffect(() => {
    if (!isLoading && kpis.length === 0 && !hasInitialized) {
      setHasInitialized(true);
      // Create default KPIs for new users
      defaultKPIs.forEach((kpi) => {
        createKPI(kpi);
      });
    }
  }, [isLoading, kpis.length, hasInitialized, createKPI]);

  const handleAddKPI = () => {
    createKPI(formData);
    setFormData({ name: '', target: 0, current_value: 0, unit: '', kpi_type: 'custom', period: 'monthly' });
    setIsDialogOpen(false);
  };

  const handleEditKPI = (kpi: UserKPI) => {
    setEditingKPI(kpi);
    setFormData({
      name: kpi.name,
      target: kpi.target,
      current_value: kpi.current_value,
      unit: kpi.unit,
      kpi_type: kpi.kpi_type,
      period: kpi.period,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateKPI = () => {
    if (editingKPI) {
      updateKPI({ id: editingKPI.id, ...formData });
      setEditingKPI(null);
      setFormData({ name: '', target: 0, current_value: 0, unit: '', kpi_type: 'custom', period: 'monthly' });
      setIsDialogOpen(false);
    }
  };

  const handleDeleteKPI = (id: string) => {
    deleteKPI(id);
  };

  const getProgress = (kpi: UserKPI) => {
    if (kpi.target === 0) return 0;
    return Math.min((kpi.current_value / kpi.target) * 100, 100);
  };

  const getStatus = (kpi: UserKPI) => {
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">KPIs & Objectifs</h2>
          <p className="text-sm text-muted-foreground">Suivez vos indicateurs clés de performance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingKPI(null); setFormData({ name: '', target: 0, current_value: 0, unit: '', kpi_type: 'custom', period: 'monthly' }); }}>
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
                    onChange={(e) => setFormData({ ...formData, target: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_value">Valeur actuelle</Label>
                  <Input
                    id="current_value"
                    type="number"
                    value={formData.current_value}
                    onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.kpi_type} onValueChange={(v) => setFormData({ ...formData, kpi_type: v as UserKPI['kpi_type'] })}>
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
                  <Select value={formData.period} onValueChange={(v) => setFormData({ ...formData, period: v as UserKPI['period'] })}>
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
              <Button 
                onClick={editingKPI ? handleUpdateKPI : handleAddKPI}
                disabled={isCreating || isUpdating}
              >
                {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingKPI ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {kpis.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucun KPI configuré</p>
            <p className="text-sm text-muted-foreground mt-1">Ajoutez vos premiers indicateurs de performance</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => {
            const Icon = typeIcons[kpi.kpi_type] || Target;
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
                          {kpi.current_value.toLocaleString()}{kpi.unit}
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
      )}
    </div>
  );
}
