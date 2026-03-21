import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Users, Target, MapPin, Calendar, DollarSign, TrendingUp,
  Sparkles, Settings2, Brain, Zap, ArrowRight, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudienceSegment {
  id: string;
  name: string;
  size: string;
  match: number;
  icon: string;
}

const AUDIENCE_SEGMENTS: AudienceSegment[] = [
  { id: 'lookalike', name: 'Lookalike acheteurs', size: '1.2M', match: 94, icon: '🎯' },
  { id: 'retargeting', name: 'Retargeting visiteurs', size: '45K', match: 89, icon: '🔄' },
  { id: 'interest_fashion', name: 'Intérêt Mode & Lifestyle', size: '8.5M', match: 72, icon: '👗' },
  { id: 'interest_tech', name: 'Passionnés Tech', size: '6.2M', match: 68, icon: '💻' },
  { id: 'high_value', name: 'Clients haute valeur', size: '12K', match: 96, icon: '💎' },
  { id: 'cart_abandon', name: 'Paniers abandonnés', size: '8.3K', match: 91, icon: '🛒' },
];

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const GENDERS = ['Tous', 'Homme', 'Femme'];
const PLACEMENTS = [
  { id: 'feed', label: 'Feed', active: true },
  { id: 'stories', label: 'Stories', active: true },
  { id: 'reels', label: 'Reels', active: false },
  { id: 'explore', label: 'Explorer', active: false },
  { id: 'search', label: 'Search', active: true },
  { id: 'display', label: 'Display', active: false },
];

export function AdsAudienceBuilder() {
  const [selectedSegments, setSelectedSegments] = useState<string[]>(['lookalike', 'retargeting']);
  const [budget, setBudget] = useState(500);
  const [budgetType, setBudgetType] = useState<'daily' | 'total'>('daily');
  const [durationDays, setDurationDays] = useState(14);
  const [ageRange, setAgeRange] = useState<[number, number]>([25, 44]);
  const [gender, setGender] = useState('Tous');
  const [locations, setLocations] = useState('France');
  const [placements, setPlacements] = useState(PLACEMENTS);
  const [aiOptimize, setAiOptimize] = useState(true);

  const toggleSegment = (id: string) => {
    setSelectedSegments(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const togglePlacement = (id: string) => {
    setPlacements(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const totalReach = useMemo(() => {
    return AUDIENCE_SEGMENTS
      .filter(s => selectedSegments.includes(s.id))
      .reduce((sum, s) => {
        const num = parseFloat(s.size.replace(/[KM]/g, ''));
        const multiplier = s.size.includes('M') ? 1000000 : s.size.includes('K') ? 1000 : 1;
        return sum + num * multiplier;
      }, 0);
  }, [selectedSegments]);

  const estimatedCPM = 8.50;
  const estimatedCTR = 2.4;
  const estimatedConvRate = 3.2;
  const totalBudget = budgetType === 'daily' ? budget * durationDays : budget;
  const estimatedImpressions = Math.round(totalBudget / estimatedCPM * 1000);
  const estimatedClicks = Math.round(estimatedImpressions * estimatedCTR / 100);
  const estimatedConversions = Math.round(estimatedClicks * estimatedConvRate / 100);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Audience Builder */}
        <div className="lg:col-span-2 space-y-5">
          {/* Segments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Audiences cibles
              </CardTitle>
              <CardDescription>Sélectionnez vos segments d'audience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-2.5">
                {AUDIENCE_SEGMENTS.map(seg => (
                  <button
                    key={seg.id}
                    onClick={() => toggleSegment(seg.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all',
                      selectedSegments.includes(seg.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <span className="text-lg">{seg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{seg.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{seg.size} pers.</span>
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${seg.match}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{seg.match}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Demographics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Démographie & Ciblage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Localisation</Label>
                  <Input value={locations} onChange={e => setLocations(e.target.value)} placeholder="France, Belgique..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Genre</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tranche d'âge</Label>
                  <div className="pt-2">
                    <Slider
                      min={18} max={65} step={1}
                      value={ageRange}
                      onValueChange={(v) => setAgeRange(v as [number, number])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{ageRange[0]} ans</span>
                      <span>{ageRange[1]} ans</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Placements */}
              <div className="space-y-2">
                <Label className="text-xs">Emplacements</Label>
                <div className="flex flex-wrap gap-2">
                  {placements.map(p => (
                    <button
                      key={p.id}
                      onClick={() => togglePlacement(p.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                        p.active ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Budget & Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Budget (€)</Label>
                  <Input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} min={1} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Type</Label>
                  <Select value={budgetType} onValueChange={(v: 'daily' | 'total') => setBudgetType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="total">Total campagne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Durée (jours)</Label>
                  <Input type="number" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} min={1} max={365} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Optimisation IA du budget</span>
                </div>
                <Switch checked={aiOptimize} onCheckedChange={setAiOptimize} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Estimations Panel */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Estimations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Portée estimée</span>
                  <span className="font-bold text-lg">{totalReach >= 1000000 ? `${(totalReach / 1000000).toFixed(1)}M` : totalReach >= 1000 ? `${(totalReach / 1000).toFixed(1)}K` : totalReach}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Budget total</span>
                  <span className="font-bold">€{totalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Impressions est.</span>
                  <span className="font-semibold">{estimatedImpressions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Clics estimés</span>
                  <span className="font-semibold">{estimatedClicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Conversions est.</span>
                  <span className="font-bold text-primary">{estimatedConversions}</span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">CPM estimé</span>
                  <span>€{estimatedCPM.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">CTR estimé</span>
                  <span>{estimatedCTR}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Taux conv. est.</span>
                  <span>{estimatedConvRate}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">CPA estimé</span>
                  <span className="font-semibold">€{estimatedConversions > 0 ? (totalBudget / estimatedConversions).toFixed(2) : '—'}</span>
                </div>
              </div>

              {aiOptimize && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Recommandation IA
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Augmentez le budget de 15% les week-ends pour maximiser le ROAS. Concentrez 60% sur le retargeting.
                  </p>
                </div>
              )}

              <Button className="w-full" size="lg">
                <Zap className="h-4 w-4 mr-2" />
                Lancer la campagne
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
