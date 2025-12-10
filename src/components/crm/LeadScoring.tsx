import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Settings,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  Star,
  ShoppingCart,
  Mail,
  MousePointer,
  Clock,
  Users
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';

interface ScoringRule {
  id: string;
  name: string;
  description: string;
  category: 'engagement' | 'purchase' | 'profile' | 'behavior';
  points: number;
  isActive: boolean;
  icon: React.ReactNode;
}

interface LeadScore {
  customerId: string;
  totalScore: number;
  breakdown: {
    engagement: number;
    purchase: number;
    profile: number;
    behavior: number;
  };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface LeadScoringProps {
  customerId?: string;
}

export const LeadScoring: React.FC<LeadScoringProps> = ({ customerId }) => {
  const { toast } = useToast();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Mock scoring rules
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([
    // Engagement rules
    { id: '1', name: 'Ouverture email', description: 'Ouvre un email marketing', category: 'engagement', points: 5, isActive: true, icon: <Mail className="h-4 w-4" /> },
    { id: '2', name: 'Clic email', description: 'Clique sur un lien dans un email', category: 'engagement', points: 10, isActive: true, icon: <MousePointer className="h-4 w-4" /> },
    { id: '3', name: 'Visite site', description: 'Visite le site web', category: 'engagement', points: 3, isActive: true, icon: <Users className="h-4 w-4" /> },
    { id: '4', name: 'Visite page produit', description: 'Consulte une page produit', category: 'engagement', points: 8, isActive: true, icon: <ShoppingCart className="h-4 w-4" /> },
    
    // Purchase rules
    { id: '5', name: 'Premier achat', description: 'Effectue son premier achat', category: 'purchase', points: 50, isActive: true, icon: <Star className="h-4 w-4" /> },
    { id: '6', name: 'Achat récurrent', description: 'Achat dans les 30 derniers jours', category: 'purchase', points: 30, isActive: true, icon: <RefreshCw className="h-4 w-4" /> },
    { id: '7', name: 'Panier > 100€', description: 'Commande supérieure à 100€', category: 'purchase', points: 20, isActive: true, icon: <TrendingUp className="h-4 w-4" /> },
    
    // Profile rules
    { id: '8', name: 'Profil complet', description: 'Toutes les infos renseignées', category: 'profile', points: 15, isActive: true, icon: <Users className="h-4 w-4" /> },
    { id: '9', name: 'Email vérifié', description: 'Adresse email confirmée', category: 'profile', points: 10, isActive: true, icon: <Mail className="h-4 w-4" /> },
    
    // Behavior rules
    { id: '10', name: 'Ajout panier', description: 'Ajoute un produit au panier', category: 'behavior', points: 12, isActive: true, icon: <ShoppingCart className="h-4 w-4" /> },
    { id: '11', name: 'Abandon panier', description: 'Abandonne un panier', category: 'behavior', points: -15, isActive: true, icon: <TrendingDown className="h-4 w-4" /> },
    { id: '12', name: 'Inactivité 30j', description: 'Pas de visite depuis 30 jours', category: 'behavior', points: -20, isActive: true, icon: <Clock className="h-4 w-4" /> }
  ]);

  // Mock customer score
  const customerScore: LeadScore = {
    customerId: customerId || 'demo',
    totalScore: 78,
    breakdown: {
      engagement: 35,
      purchase: 25,
      profile: 10,
      behavior: 8
    },
    trend: 'up',
    lastUpdated: new Date().toISOString()
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'Chaud', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
    if (score >= 50) return { label: 'Tiède', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
    if (score >= 20) return { label: 'Froid', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    return { label: 'Inactif', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
  };

  const toggleRule = (ruleId: string) => {
    setScoringRules(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const updateRulePoints = (ruleId: string, points: number) => {
    setScoringRules(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, points } : rule
      )
    );
  };

  const recalculateScores = () => {
    toast({
      title: 'Recalcul en cours',
      description: 'Les scores de tous les clients sont en cours de mise à jour...'
    });
    // In production, trigger backend recalculation
  };

  const scoreLabel = getScoreLabel(customerScore.totalScore);
  const categories = ['engagement', 'purchase', 'profile', 'behavior'] as const;
  const categoryLabels = {
    engagement: 'Engagement',
    purchase: 'Achats',
    profile: 'Profil',
    behavior: 'Comportement'
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Lead Scoring
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={recalculateScores}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Recalculer
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Configurer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Score Display */}
        {customerId && (
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Score actuel</p>
                <div className="flex items-center gap-3">
                  <span className={`text-4xl font-bold ${getScoreColor(customerScore.totalScore)}`}>
                    {customerScore.totalScore}
                  </span>
                  <Badge variant="outline" className={scoreLabel.color}>
                    {scoreLabel.label}
                  </Badge>
                  {customerScore.trend === 'up' && (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  )}
                  {customerScore.trend === 'down' && (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
              <div className="text-right">
                <Zap className="h-12 w-12 text-primary/30" />
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((category) => (
                <div key={category} className="text-center p-2 bg-background/50 rounded-lg">
                  <p className="text-lg font-semibold">{customerScore.breakdown[category]}</p>
                  <p className="text-xs text-muted-foreground">{categoryLabels[category]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score Distribution */}
        <div>
          <p className="text-sm font-medium mb-3">Distribution des leads</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Chauds (80-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={15} className="w-24 h-2" />
                <span className="text-sm font-medium">15%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Tièdes (50-79)</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={35} className="w-24 h-2" />
                <span className="text-sm font-medium">35%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">Froids (20-49)</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={30} className="w-24 h-2" />
                <span className="text-sm font-medium">30%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-sm">Inactifs (0-19)</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={20} className="w-24 h-2" />
                <span className="text-sm font-medium">20%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scoring Rules Configuration */}
        <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>Règles de scoring ({scoringRules.filter(r => r.isActive).length} actives)</span>
              {isConfigOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            {categories.map((category) => (
              <div key={category}>
                <p className="text-sm font-medium mb-2 capitalize">{categoryLabels[category]}</p>
                <div className="space-y-2">
                  {scoringRules
                    .filter(rule => rule.category === category)
                    .map((rule) => (
                      <div
                        key={rule.id}
                        className={`p-3 rounded-lg border ${rule.isActive ? 'bg-background' : 'bg-muted/30 opacity-60'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={rule.isActive}
                              onCheckedChange={() => toggleRule(rule.id)}
                            />
                            <div className="flex items-center gap-2">
                              {rule.icon}
                              <div>
                                <p className="text-sm font-medium">{rule.name}</p>
                                <p className="text-xs text-muted-foreground">{rule.description}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={rule.points >= 0 ? 'default' : 'destructive'}>
                              {rule.points >= 0 ? '+' : ''}{rule.points} pts
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Points attribués quand cette action est détectée</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Actions rapides</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              Exporter les scores
            </Button>
            <Button variant="outline" size="sm">
              Créer segment
            </Button>
            <Button variant="outline" size="sm">
              Voir les leads chauds
            </Button>
            <Button variant="outline" size="sm">
              Alertes scoring
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
