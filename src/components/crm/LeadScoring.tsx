/**
 * LeadScoring - Système de scoring automatique des leads
 * Interface Enterprise avec scoring IA et règles personnalisées
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
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
import { toast } from 'sonner';
import { 
  Star, TrendingUp, Target, Zap, Settings, Plus, 
  Trash2, Save, RefreshCw, AlertCircle, CheckCircle2,
  Mail, Phone, Building, Globe, Clock, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useCRMLeads, CRMLead } from '@/hooks/useCRMLeads';

interface ScoringRule {
  id: string;
  name: string;
  condition: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  value: string;
  points: number;
  isActive: boolean;
}

const defaultRules: ScoringRule[] = [
  { id: '1', name: 'Email professionnel', condition: 'email_domain', field: 'email', operator: 'contains', value: '.com,.fr,.io', points: 10, isActive: true },
  { id: '2', name: 'Téléphone renseigné', condition: 'has_phone', field: 'phone', operator: 'exists', value: '', points: 15, isActive: true },
  { id: '3', name: 'Entreprise identifiée', condition: 'has_company', field: 'company', operator: 'exists', value: '', points: 20, isActive: true },
  { id: '4', name: 'Valeur estimée élevée', condition: 'high_value', field: 'estimated_value', operator: 'greater_than', value: '5000', points: 25, isActive: true },
  { id: '5', name: 'Lead récent (< 7j)', condition: 'recent', field: 'created_at', operator: 'less_than', value: '7', points: 10, isActive: true },
];

const scoreThresholds = [
  { min: 0, max: 25, label: 'Froid', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { min: 26, max: 50, label: 'Tiède', color: 'bg-amber-500', textColor: 'text-amber-600' },
  { min: 51, max: 75, label: 'Chaud', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { min: 76, max: 100, label: 'Brûlant', color: 'bg-red-500', textColor: 'text-red-600' },
];

function getScoreCategory(score: number) {
  return scoreThresholds.find(t => score >= t.min && score <= t.max) || scoreThresholds[0];
}

function calculateLeadScore(lead: CRMLead, rules: ScoringRule[]): number {
  let score = 0;
  
  rules.filter(r => r.isActive).forEach(rule => {
    let matches = false;
    
    switch (rule.field) {
      case 'email':
        if (rule.operator === 'exists') {
          matches = !!lead.email;
        } else if (rule.operator === 'contains') {
          matches = rule.value.split(',').some(v => lead.email?.includes(v.trim()));
        }
        break;
      case 'phone':
        matches = !!lead.phone;
        break;
      case 'company':
        matches = !!lead.company;
        break;
      case 'estimated_value':
        if (rule.operator === 'greater_than') {
          matches = (lead.estimated_value || 0) > parseFloat(rule.value);
        }
        break;
      case 'created_at':
        const daysDiff = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (rule.operator === 'less_than') {
          matches = daysDiff < parseFloat(rule.value);
        }
        break;
    }
    
    if (matches) {
      score += rule.points;
    }
  });
  
  return Math.min(100, score);
}

export function LeadScoring() {
  const { leads, isLoading, updateLead } = useCRMLeads();
  const [rules, setRules] = useState<ScoringRule[]>(defaultRules);
  const [isRulesDialogOpen, setIsRulesDialogOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const scoredLeads = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      calculated_score: calculateLeadScore(lead, rules),
    })).sort((a, b) => b.calculated_score - a.calculated_score);
  }, [leads, rules]);

  const scoreDistribution = useMemo(() => {
    const distribution = scoreThresholds.map(t => ({
      ...t,
      count: scoredLeads.filter(l => l.calculated_score >= t.min && l.calculated_score <= t.max).length,
    }));
    return distribution;
  }, [scoredLeads]);

  const avgScore = useMemo(() => {
    if (scoredLeads.length === 0) return 0;
    return Math.round(scoredLeads.reduce((sum, l) => sum + l.calculated_score, 0) / scoredLeads.length);
  }, [scoredLeads]);

  const hotLeads = scoredLeads.filter(l => l.calculated_score >= 75);

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const updateRulePoints = (ruleId: string, points: number) => {
    setRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, points } : r
    ));
  };

  const handleRecalculateAll = async () => {
    setIsRecalculating(true);
    
    // Simulate recalculation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`Scores recalculés pour ${leads.length} leads`);
    setIsRecalculating(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{avgScore}</div>
                <div className="text-sm text-muted-foreground">Score moyen</div>
              </div>
              <div className={cn("p-3 rounded-full", getScoreCategory(avgScore).color, "bg-opacity-20")}>
                <Star className={cn("h-6 w-6", getScoreCategory(avgScore).textColor)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{hotLeads.length}</div>
                <div className="text-sm text-muted-foreground">Leads brûlants</div>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <Zap className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{rules.filter(r => r.isActive).length}</div>
                <div className="text-sm text-muted-foreground">Règles actives</div>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Settings className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{leads.length}</div>
                <div className="text-sm text-muted-foreground">Total leads</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculateAll}
                disabled={isRecalculating}
              >
                <RefreshCw className={cn("h-4 w-4", isRecalculating && "animate-spin")} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Distribution des scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {scoreDistribution.map((bucket) => (
              <div key={bucket.label} className="text-center">
                <div className={cn("h-24 rounded-lg flex items-end justify-center p-2", bucket.color, "bg-opacity-20")}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(bucket.count / Math.max(...scoreDistribution.map(b => b.count), 1)) * 100}%` }}
                    className={cn("w-full rounded-t-lg", bucket.color)}
                    style={{ minHeight: bucket.count > 0 ? '8px' : '0' }}
                  />
                </div>
                <div className="mt-2">
                  <Badge className={bucket.color}>{bucket.label}</Badge>
                  <p className="text-lg font-semibold mt-1">{bucket.count}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scoring Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Règles de scoring</CardTitle>
                <CardDescription>Configurez les critères d'évaluation</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    rule.isActive ? "bg-background" : "bg-muted/50 opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <span className="font-medium">{rule.name}</span>
                    </div>
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      +{rule.points} pts
                    </Badge>
                  </div>
                  
                  {rule.isActive && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-20">Points:</span>
                        <Slider
                          value={[rule.points]}
                          onValueChange={([value]) => updateRulePoints(rule.id, value)}
                          min={1}
                          max={50}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-12 text-right">{rule.points}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Leads les mieux notés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {scoredLeads.slice(0, 10).map((lead, index) => {
                  const category = getScoreCategory(lead.calculated_score);
                  return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold",
                          category.color
                        )}>
                          {lead.calculated_score}
                        </div>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold truncate">{lead.name}</h4>
                          <Badge className={category.color} variant="secondary">
                            {category.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          {lead.company && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {lead.company}
                            </span>
                          )}
                          {lead.estimated_value && lead.estimated_value > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <DollarSign className="h-3 w-3" />
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(lead.estimated_value)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {lead.email && <Mail className="h-4 w-4 text-muted-foreground" />}
                        {lead.phone && <Phone className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </motion.div>
                  );
                })}

                {scoredLeads.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun lead à afficher</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
