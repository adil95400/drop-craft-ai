/**
 * Supplier Scoring - Notation automatique et comparateur fournisseurs
 * Enterprise-ready supplier evaluation component
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  DollarSign,
  Truck,
  Shield,
  Award,
  BarChart3,
  ArrowUpDown,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface SupplierScore {
  id: string;
  name: string;
  logo?: string;
  overallScore: number;
  scores: {
    quality: number;
    pricing: number;
    delivery: number;
    reliability: number;
    support: number;
    catalog: number;
  };
  metrics: {
    avgDeliveryDays: number;
    onTimeRate: number;
    defectRate: number;
    avgMargin: number;
    catalogSize: number;
    responseTime: string;
  };
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
}

const suppliersData: SupplierScore[] = [
  {
    id: '1',
    name: 'CJDropshipping',
    overallScore: 87,
    scores: { quality: 85, pricing: 90, delivery: 82, reliability: 88, support: 85, catalog: 92 },
    metrics: { avgDeliveryDays: 12, onTimeRate: 94, defectRate: 2.1, avgMargin: 35, catalogSize: 50000, responseTime: '< 2h' },
    tier: 'platinum',
    trend: 'up',
    recommendation: 'Excellent choix pour produits électroniques et accessoires'
  },
  {
    id: '2',
    name: 'Spocket',
    overallScore: 82,
    scores: { quality: 88, pricing: 75, delivery: 90, reliability: 85, support: 80, catalog: 72 },
    metrics: { avgDeliveryDays: 5, onTimeRate: 96, defectRate: 1.5, avgMargin: 28, catalogSize: 8000, responseTime: '< 4h' },
    tier: 'gold',
    trend: 'stable',
    recommendation: 'Idéal pour livraison rapide EU/US'
  },
  {
    id: '3',
    name: 'BigBuy',
    overallScore: 79,
    scores: { quality: 82, pricing: 78, delivery: 85, reliability: 80, support: 75, catalog: 78 },
    metrics: { avgDeliveryDays: 4, onTimeRate: 92, defectRate: 2.8, avgMargin: 30, catalogSize: 120000, responseTime: '< 6h' },
    tier: 'gold',
    trend: 'up',
    recommendation: 'Large catalogue EU avec stock local'
  },
  {
    id: '4',
    name: 'AliExpress Dropship',
    overallScore: 72,
    scores: { quality: 70, pricing: 95, delivery: 60, reliability: 68, support: 65, catalog: 98 },
    metrics: { avgDeliveryDays: 18, onTimeRate: 82, defectRate: 4.2, avgMargin: 45, catalogSize: 1000000, responseTime: '> 24h' },
    tier: 'silver',
    trend: 'down',
    recommendation: 'Marges élevées mais délais longs'
  },
  {
    id: '5',
    name: 'Printful',
    overallScore: 85,
    scores: { quality: 92, pricing: 72, delivery: 88, reliability: 90, support: 88, catalog: 75 },
    metrics: { avgDeliveryDays: 6, onTimeRate: 95, defectRate: 1.2, avgMargin: 22, catalogSize: 300, responseTime: '< 1h' },
    tier: 'platinum',
    trend: 'up',
    recommendation: 'Meilleur pour print-on-demand personnalisé'
  }
];

export function SupplierScoring() {
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'delivery' | 'margin'>('score');

  const sortedSuppliers = useMemo(() => {
    return [...suppliersData].sort((a, b) => {
      switch (sortBy) {
        case 'score': return b.overallScore - a.overallScore;
        case 'delivery': return a.metrics.avgDeliveryDays - b.metrics.avgDeliveryDays;
        case 'margin': return b.metrics.avgMargin - a.metrics.avgMargin;
        default: return 0;
      }
    });
  }, [sortBy]);

  const comparisonData = useMemo(() => {
    if (selectedSuppliers.length < 2) return [];
    const selected = suppliersData.filter(s => selectedSuppliers.includes(s.id));
    return Object.keys(selected[0]?.scores || {}).map(key => ({
      metric: key.charAt(0).toUpperCase() + key.slice(1),
      ...Object.fromEntries(selected.map(s => [s.name, s.scores[key as keyof typeof s.scores]]))
    }));
  }, [selectedSuppliers]);

  const radarData = useMemo(() => {
    if (selectedSuppliers.length === 0) return [];
    const selected = suppliersData.filter(s => selectedSuppliers.includes(s.id));
    return Object.keys(selected[0]?.scores || {}).map(key => ({
      metric: key.charAt(0).toUpperCase() + key.slice(1),
      ...Object.fromEntries(selected.map(s => [s.name, s.scores[key as keyof typeof s.scores]])),
      fullMark: 100
    }));
  }, [selectedSuppliers]);

  const getTierBadge = (tier: SupplierScore['tier']) => {
    const config = {
      platinum: { color: 'bg-gradient-to-r from-slate-400 to-slate-600', icon: Award },
      gold: { color: 'bg-gradient-to-r from-yellow-400 to-amber-500', icon: Star },
      silver: { color: 'bg-gradient-to-r from-gray-300 to-gray-400', icon: Shield },
      bronze: { color: 'bg-gradient-to-r from-orange-300 to-orange-500', icon: Package }
    };
    const { color, icon: Icon } = config[tier];
    return (
      <Badge className={cn("text-white gap-1", color)}>
        <Icon className="h-3 w-3" />
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Award className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Scoring Fournisseurs</h2>
            <p className="text-sm text-muted-foreground">
              Évaluation et comparaison automatique
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Score global</SelectItem>
              <SelectItem value="delivery">Délai livraison</SelectItem>
              <SelectItem value="margin">Marge moyenne</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selection info */}
      {selectedSuppliers.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm">
            {selectedSuppliers.length} fournisseur{selectedSuppliers.length > 1 ? 's' : ''} sélectionné{selectedSuppliers.length > 1 ? 's' : ''} pour comparaison
          </span>
          {selectedSuppliers.length < 3 && (
            <span className="text-sm text-muted-foreground">(max 3)</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSelectedSuppliers([])}>
            Réinitialiser
          </Button>
        </div>
      )}

      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ranking">Classement</TabsTrigger>
          <TabsTrigger value="comparison" disabled={selectedSuppliers.length < 2}>
            Comparaison ({selectedSuppliers.length}/3)
          </TabsTrigger>
          <TabsTrigger value="details">Métriques détaillées</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking">
          <div className="grid gap-4">
            {sortedSuppliers.map((supplier, index) => (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedSuppliers.includes(supplier.id) && "ring-2 ring-primary"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedSuppliers.includes(supplier.id)}
                        onCheckedChange={() => toggleSupplier(supplier.id)}
                      />
                      
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted font-bold text-lg">
                        #{index + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{supplier.name}</h3>
                          {getTierBadge(supplier.tier)}
                          {supplier.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {supplier.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{supplier.recommendation}</p>
                      </div>

                      <div className="grid grid-cols-4 gap-6 text-center">
                        <div>
                          <p className={cn("text-2xl font-bold", getScoreColor(supplier.overallScore))}>
                            {supplier.overallScore}
                          </p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{supplier.metrics.avgDeliveryDays}j</p>
                          <p className="text-xs text-muted-foreground">Délai</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{supplier.metrics.avgMargin}%</p>
                          <p className="text-xs text-muted-foreground">Marge</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{supplier.metrics.onTimeRate}%</p>
                          <p className="text-xs text-muted-foreground">À temps</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-6 gap-2">
                      {Object.entries(supplier.scores).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <Progress value={value} className="h-2 mb-1" />
                          <p className="text-xs text-muted-foreground capitalize">{key}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          {selectedSuppliers.length >= 2 && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comparaison Radar</CardTitle>
                  <CardDescription>Vue comparative des scores par critère</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      {selectedSuppliers.map((id, index) => {
                        const supplier = suppliersData.find(s => s.id === id);
                        return (
                          <Radar
                            key={id}
                            name={supplier?.name}
                            dataKey={supplier?.name}
                            stroke={COLORS[index]}
                            fill={COLORS[index]}
                            fillOpacity={0.2}
                          />
                        );
                      })}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comparaison par Critère</CardTitle>
                  <CardDescription>Scores détaillés côte à côte</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={comparisonData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="metric" width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      {selectedSuppliers.map((id, index) => {
                        const supplier = suppliersData.find(s => s.id === id);
                        return (
                          <Bar
                            key={id}
                            dataKey={supplier?.name}
                            fill={COLORS[index]}
                            radius={[0, 4, 4, 0]}
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Métriques Détaillées</CardTitle>
              <CardDescription>Analyse complète des performances fournisseurs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead className="text-center">Tier</TableHead>
                    <TableHead className="text-center">Délai moyen</TableHead>
                    <TableHead className="text-center">Taux ponctualité</TableHead>
                    <TableHead className="text-center">Taux défauts</TableHead>
                    <TableHead className="text-center">Marge moy.</TableHead>
                    <TableHead className="text-center">Catalogue</TableHead>
                    <TableHead className="text-center">Réponse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSuppliers.map(supplier => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell className="text-center">{getTierBadge(supplier.tier)}</TableCell>
                      <TableCell className="text-center">
                        <span className={supplier.metrics.avgDeliveryDays <= 7 ? 'text-green-600' : supplier.metrics.avgDeliveryDays <= 14 ? 'text-amber-600' : 'text-red-600'}>
                          {supplier.metrics.avgDeliveryDays} jours
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={supplier.metrics.onTimeRate >= 95 ? 'text-green-600' : supplier.metrics.onTimeRate >= 90 ? 'text-amber-600' : 'text-red-600'}>
                          {supplier.metrics.onTimeRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={supplier.metrics.defectRate <= 2 ? 'text-green-600' : supplier.metrics.defectRate <= 4 ? 'text-amber-600' : 'text-red-600'}>
                          {supplier.metrics.defectRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{supplier.metrics.avgMargin}%</TableCell>
                      <TableCell className="text-center">{supplier.metrics.catalogSize.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{supplier.metrics.responseTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
