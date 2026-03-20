/**
 * ABTestManager — Connected to ab_test_experiments + ab_test_variants tables
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Plus, Play, Pause, BarChart3, TrendingUp,
  Users, Target, Trophy, Loader2, Trash2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Types ──
interface Variant {
  id: string;
  variant_name: string;
  test_name: string;
  traffic_allocation: number | null;
  is_winner: boolean | null;
  performance_data: Record<string, number> | null;
  ad_creative: any;
}

interface Experiment {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  metrics: any;
  variants: any;
  winner_variant_id: string | null;
  created_at: string;
}

// ── Component ──
export function ABTestManager() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '', description: '', goal: 'conversion_rate',
    variantA: 'Contrôle', variantB: 'Variant B',
  });

  // Fetch experiments
  const { data: experiments = [], isLoading } = useQuery({
    queryKey: ['ab-experiments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('ab_test_experiments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Experiment[];
    },
  });

  // Fetch all variants
  const { data: allVariants = [] } = useQuery({
    queryKey: ['ab-variants'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('ab_test_variants')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []) as Variant[];
    },
  });

  // Create experiment + 2 variants
  const createExperiment = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: exp, error } = await supabase
        .from('ab_test_experiments')
        .insert({
          user_id: user.id,
          name: newTest.name,
          description: newTest.description || null,
          status: 'draft',
          metrics: { goal: newTest.goal },
        })
        .select('id')
        .single();
      if (error) throw error;

      // Create 2 variants
      const variants = [
        { user_id: user.id, test_name: exp.id, variant_name: newTest.variantA, traffic_allocation: 50 },
        { user_id: user.id, test_name: exp.id, variant_name: newTest.variantB, traffic_allocation: 50 },
      ];
      const { error: vErr } = await supabase.from('ab_test_variants').insert(variants);
      if (vErr) throw vErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ab-experiments'] });
      qc.invalidateQueries({ queryKey: ['ab-variants'] });
      setCreateOpen(false);
      setNewTest({ name: '', description: '', goal: 'conversion_rate', variantA: 'Contrôle', variantB: 'Variant B' });
      toast.success('Test A/B créé');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Toggle status
  const toggleStatus = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: string }) => {
      const next = current === 'running' ? 'paused' : 'running';
      const update: any = { status: next };
      if (next === 'running' && !experiments.find(e => e.id === id)?.start_date) {
        update.start_date = new Date().toISOString();
      }
      const { error } = await supabase
        .from('ab_test_experiments')
        .update(update)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ab-experiments'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Declare winner
  const declareWinner = useMutation({
    mutationFn: async ({ expId, variantId }: { expId: string; variantId: string }) => {
      const { error: expErr } = await supabase
        .from('ab_test_experiments')
        .update({ status: 'completed', winner_variant_id: variantId, end_date: new Date().toISOString() })
        .eq('id', expId);
      if (expErr) throw expErr;

      const { error: vErr } = await supabase
        .from('ab_test_variants')
        .update({ is_winner: true })
        .eq('id', variantId);
      if (vErr) throw vErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ab-experiments'] });
      qc.invalidateQueries({ queryKey: ['ab-variants'] });
      toast.success('Gagnant déclaré');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete
  const deleteExperiment = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('ab_test_variants').delete().eq('test_name', id);
      const { error } = await supabase.from('ab_test_experiments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ab-experiments'] });
      qc.invalidateQueries({ queryKey: ['ab-variants'] });
      toast.success('Test supprimé');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'running': return <Badge className="bg-green-500/10 text-success border-green-200">En cours</Badge>;
      case 'completed': return <Badge className="bg-blue-500/10 text-info border-blue-200">Terminé</Badge>;
      case 'paused': return <Badge variant="secondary">Pause</Badge>;
      default: return <Badge variant="outline">Brouillon</Badge>;
    }
  };

  const getVariantsForExp = (expId: string) =>
    allVariants.filter((v) => v.test_name === expId);

  // ── KPIs ──
  const totalTests = experiments.length;
  const running = experiments.filter(e => e.status === 'running').length;
  const completed = experiments.filter(e => e.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tests totaux', value: totalTests, icon: BarChart3, color: 'text-primary' },
          { label: 'En cours', value: running, icon: Play, color: 'text-chart-2' },
          { label: 'Terminés', value: completed, icon: Trophy, color: 'text-chart-1' },
          { label: 'Variants', value: allVariants.length, icon: Users, color: 'text-chart-4' },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-3">
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nouveau test A/B</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un test A/B</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nom du test</Label>
                <Input
                  value={newTest.name}
                  onChange={(e) => setNewTest((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Test bouton CTA"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTest.description}
                  onChange={(e) => setNewTest((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Objectif du test…"
                />
              </div>
              <div>
                <Label>Métrique objectif</Label>
                <Select value={newTest.goal} onValueChange={(v) => setNewTest((p) => ({ ...p, goal: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversion_rate">Taux de conversion</SelectItem>
                    <SelectItem value="click_rate">Taux de clic</SelectItem>
                    <SelectItem value="open_rate">Taux d'ouverture</SelectItem>
                    <SelectItem value="revenue">Revenus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Variant A</Label>
                  <Input
                    value={newTest.variantA}
                    onChange={(e) => setNewTest((p) => ({ ...p, variantA: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Variant B</Label>
                  <Input
                    value={newTest.variantB}
                    onChange={(e) => setNewTest((p) => ({ ...p, variantB: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button
                onClick={() => createExperiment.mutate()}
                disabled={!newTest.name || createExperiment.isPending}
              >
                {createExperiment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Experiments list */}
      {experiments.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium mb-2">Aucun test A/B</p>
          <p className="text-muted-foreground">Créez votre premier test pour optimiser vos campagnes</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {experiments.map((exp) => {
            const variants = getVariantsForExp(exp.id);
            const chartData = variants.map((v) => ({
              name: v.variant_name,
              conversions: (v.performance_data as any)?.conversions || 0,
              clicks: (v.performance_data as any)?.clicks || 0,
            }));

            return (
              <Card key={exp.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{exp.name}</CardTitle>
                      {getStatusBadge(exp.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {(exp.status === 'draft' || exp.status === 'paused' || exp.status === 'running') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleStatus.mutate({ id: exp.id, current: exp.status || 'draft' })}
                        >
                          {exp.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteExperiment.mutate(exp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-muted-foreground">{exp.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {variants.length > 0 ? (
                    <div className="space-y-4">
                      {/* Variant cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {variants.map((v) => {
                          const perf = (v.performance_data || {}) as Record<string, number>;
                          return (
                            <Card key={v.id} className={`p-4 border ${v.is_winner ? 'border-primary bg-primary/5' : ''}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{v.variant_name}</span>
                                  {v.is_winner && <Trophy className="h-4 w-4 text-warning" />}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {v.traffic_allocation || 50}% trafic
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <p className="text-muted-foreground">Clics</p>
                                  <p className="font-semibold">{perf.clicks || 0}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Conversions</p>
                                  <p className="font-semibold">{perf.conversions || 0}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Taux</p>
                                  <p className="font-semibold">
                                    {perf.clicks ? `${((perf.conversions || 0) / perf.clicks * 100).toFixed(1)}%` : '—'}
                                  </p>
                                </div>
                              </div>
                              {exp.status === 'running' && !v.is_winner && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-3 w-full text-xs"
                                  onClick={() => declareWinner.mutate({ expId: exp.id, variantId: v.id })}
                                >
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Déclarer gagnant
                                </Button>
                              )}
                            </Card>
                          );
                        })}
                      </div>

                      {/* Mini chart */}
                      {chartData.some((d) => d.clicks > 0 || d.conversions > 0) && (
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="clicks" name="Clics" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="conversions" name="Conversions" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun variant configuré</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
