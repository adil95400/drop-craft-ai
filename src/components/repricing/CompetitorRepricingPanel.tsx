/**
 * Competitor Repricing Panel
 * Panneau de repricing concurrentiel avec surveillance et règles
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { 
  TrendingDown, 
  TrendingUp, 
  Minus,
  RefreshCw,
  Plus,
  Eye,
  Play,
  Settings2,
  Globe,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react';
import { 
  useCompetitors, 
  useCompetitorPrices, 
  useRefreshPrices,
  useRepricingRules,
  useToggleRepricingRule,
  useExecuteRepricingRule,
  useRepricingStats,
  useToggleCompetitor
} from '@/hooks/useCompetitorPricing';

function CompetitorCard({ competitor, onToggle }: { 
  competitor: { id: string; name: string; website: string; isActive: boolean; productsTracked: number; avgPriceDiff: number; lastScraped?: string };
  onToggle: (id: string) => void;
}) {
  return (
    <Card className={!competitor.isActive ? 'opacity-60' : ''}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{competitor.name}</p>
              <p className="text-xs text-muted-foreground">{competitor.website}</p>
            </div>
          </div>
          <Switch 
            checked={competitor.isActive}
            onCheckedChange={() => onToggle(competitor.id)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Produits suivis</p>
            <p className="font-semibold">{competitor.productsTracked}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Écart moyen</p>
            <p className={`font-semibold flex items-center gap-1 ${
              competitor.avgPriceDiff < 0 ? 'text-red-500' : competitor.avgPriceDiff > 0 ? 'text-green-500' : ''
            }`}>
              {competitor.avgPriceDiff > 0 ? <ArrowUpRight className="h-3 w-3" /> : competitor.avgPriceDiff < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
              {competitor.avgPriceDiff > 0 ? '+' : ''}{competitor.avgPriceDiff.toFixed(1)}%
            </p>
          </div>
        </div>
        {competitor.lastScraped && (
          <p className="text-xs text-muted-foreground mt-3">
            Mis à jour {new Date(competitor.lastScraped).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PriceComparisonRow({ price }: { 
  price: { productTitle: string; competitorName: string; ourPrice: number; competitorPrice: number; priceDiffPercent: number; trend: string; inStock: boolean };
}) {
  const getTrendIcon = () => {
    switch (price.trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{price.productTitle}</p>
        <p className="text-xs text-muted-foreground">{price.competitorName}</p>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="text-right">
          <p className="text-muted-foreground text-xs">Notre prix</p>
          <p className="font-semibold">{price.ourPrice.toFixed(2)}€</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-xs">Concurrent</p>
          <p className="font-semibold">{price.competitorPrice.toFixed(2)}€</p>
        </div>
        <div className="flex items-center gap-2 min-w-[80px] justify-end">
          {getTrendIcon()}
          <span className={`font-semibold ${
            price.priceDiffPercent < 0 ? 'text-red-500' : price.priceDiffPercent > 0 ? 'text-green-500' : ''
          }`}>
            {price.priceDiffPercent > 0 ? '+' : ''}{price.priceDiffPercent.toFixed(1)}%
          </span>
        </div>
        <Badge variant={price.inStock ? 'default' : 'secondary'} className="text-xs">
          {price.inStock ? 'En stock' : 'Rupture'}
        </Badge>
      </div>
    </div>
  );
}

function RepricingRuleCard({ rule, onToggle, onExecute }: { 
  rule: { id: string; name: string; description?: string; isActive: boolean; strategy: string; offset: number; offsetType: string; schedule: string; productsAffected: number; lastExecutedAt?: string };
  onToggle: (id: string) => void;
  onExecute: (id: string) => void;
}) {
  const getStrategyLabel = (strategy: string) => {
    const labels: Record<string, string> = {
      match: 'Aligner',
      undercut: 'Battre',
      premium: 'Premium',
      dynamic: 'Dynamique',
    };
    return labels[strategy] || strategy;
  };

  const getScheduleLabel = (schedule: string) => {
    const labels: Record<string, string> = {
      realtime: 'Temps réel',
      hourly: 'Horaire',
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
    };
    return labels[schedule] || schedule;
  };

  return (
    <Card className={!rule.isActive ? 'opacity-60' : ''}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{rule.name}</p>
              <Badge variant="outline">{getStrategyLabel(rule.strategy)}</Badge>
            </div>
            {rule.description && (
              <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
            )}
          </div>
          <Switch 
            checked={rule.isActive}
            onCheckedChange={() => onToggle(rule.id)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
          <div>
            <p className="text-muted-foreground text-xs">Offset</p>
            <p className="font-semibold">
              {rule.offset > 0 ? (rule.strategy === 'undercut' ? '-' : '+') : ''}{rule.offset}
              {rule.offsetType === 'percentage' ? '%' : '€'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Fréquence</p>
            <p className="font-semibold">{getScheduleLabel(rule.schedule)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Produits</p>
            <p className="font-semibold">{rule.productsAffected}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onExecute(rule.id)}
            disabled={!rule.isActive}
          >
            <Play className="h-4 w-4 mr-1" />
            Exécuter
          </Button>
          <Button variant="ghost" size="sm">
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
        {rule.lastExecutedAt && (
          <p className="text-xs text-muted-foreground mt-2">
            Dernière exécution: {new Date(rule.lastExecutedAt).toLocaleString('fr-FR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function NewRuleDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer une règle de repricing</DialogTitle>
          <DialogDescription>
            Configurez une règle pour ajuster automatiquement vos prix
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Nom de la règle</Label>
            <Input placeholder="Ex: Aligner sur Amazon -2%" />
          </div>
          <div className="space-y-2">
            <Label>Stratégie</Label>
            <Select defaultValue="match">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Aligner (même prix)</SelectItem>
                <SelectItem value="undercut">Battre (prix inférieur)</SelectItem>
                <SelectItem value="premium">Premium (prix supérieur)</SelectItem>
                <SelectItem value="dynamic">Dynamique (selon la demande)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Offset</Label>
              <Input type="number" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select defaultValue="percentage">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                  <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marge minimum (%)</Label>
              <Input type="number" placeholder="10" />
            </div>
            <div className="space-y-2">
              <Label>Remise maximum (%)</Label>
              <Input type="number" placeholder="20" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fréquence d'exécution</Label>
            <Select defaultValue="daily">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Temps réel</SelectItem>
                <SelectItem value="hourly">Toutes les heures</SelectItem>
                <SelectItem value="daily">Une fois par jour</SelectItem>
                <SelectItem value="weekly">Une fois par semaine</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)}>
              Créer la règle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CompetitorRepricingPanel() {
  const { data: competitors = [], isLoading: loadingCompetitors } = useCompetitors();
  const { data: prices = [], isLoading: loadingPrices } = useCompetitorPrices();
  const { data: rules = [], isLoading: loadingRules } = useRepricingRules();
  const { data: stats } = useRepricingStats();
  const refreshPrices = useRefreshPrices();
  const toggleRule = useToggleRepricingRule();
  const executeRule = useExecuteRepricingRule();
  const toggleCompetitor = useToggleCompetitor();

  const handleToggleCompetitor = (id: string) => {
    toggleCompetitor.mutate(id);
  };

  const handleToggleRule = (id: string) => {
    toggleRule.mutate(id);
  };

  const handleExecuteRule = (id: string) => {
    executeRule.mutate(id);
  };

  const getPositionColor = (position?: string) => {
    switch (position) {
      case 'leader': return 'text-green-500';
      case 'competitive': return 'text-blue-500';
      case 'behind': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getPositionLabel = (position?: string) => {
    switch (position) {
      case 'leader': return 'Leader';
      case 'competitive': return 'Compétitif';
      case 'behind': return 'En retard';
      default: return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Repricing Concurrentiel</h2>
          <p className="text-sm text-muted-foreground">
            Surveillez les prix concurrents et ajustez automatiquement vos tarifs
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => refreshPrices.mutate(undefined)}
            disabled={refreshPrices.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshPrices.isPending ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <NewRuleDialog />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Concurrents</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.totalCompetitors ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Règles actives</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.activeRules ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Surveillés</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.productsMonitored ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Changements</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.priceChangesToday ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Position</span>
            </div>
            <p className={`text-xl font-bold mt-1 ${getPositionColor(stats?.competitivePosition)}`}>
              {getPositionLabel(stats?.competitivePosition)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="competitors">
        <TabsList>
          <TabsTrigger value="competitors">
            <Globe className="h-4 w-4 mr-2" />
            Concurrents
          </TabsTrigger>
          <TabsTrigger value="prices">
            <TrendingDown className="h-4 w-4 mr-2" />
            Comparaison prix
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings2 className="h-4 w-4 mr-2" />
            Règles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="competitors" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {competitors.map(comp => (
              <CompetitorCard 
                key={comp.id} 
                competitor={comp}
                onToggle={handleToggleCompetitor}
              />
            ))}
            <Card className="border-dashed flex items-center justify-center min-h-[150px] hover:border-primary/50 transition-colors cursor-pointer">
              <div className="text-center">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Ajouter un concurrent</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prices" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparaison des prix</CardTitle>
              <CardDescription>Écarts de prix avec vos concurrents</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPrices ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : prices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune comparaison de prix disponible
                </div>
              ) : (
                <div className="divide-y">
                  {prices.map(price => (
                    <PriceComparisonRow key={price.id} price={price} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map(rule => (
              <RepricingRuleCard 
                key={rule.id} 
                rule={rule}
                onToggle={handleToggleRule}
                onExecute={handleExecuteRule}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CompetitorRepricingPanel;
