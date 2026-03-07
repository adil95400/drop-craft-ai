/**
 * AI Automation Hub - Centre de commande IA pour l'automatisation
 * Regroupe les actions IA automatisées, les recommandations et le monitoring
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Brain, Sparkles, Zap, TrendingUp, Bot, RefreshCw,
  CheckCircle2, XCircle, Clock, Activity, BarChart3,
  Wand2, FileText, DollarSign, Package, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data pour les agents IA
const AI_AGENTS = [
  {
    id: 'content-optimizer',
    name: 'Optimiseur de Contenu',
    description: 'Améliore automatiquement les titres et descriptions produits pour le SEO',
    icon: FileText,
    status: 'active' as const,
    actionsToday: 47,
    successRate: 94.2,
    lastRun: '2026-03-07T14:30:00Z',
    category: 'content'
  },
  {
    id: 'price-optimizer',
    name: 'Optimiseur de Prix',
    description: 'Ajuste les prix en fonction de la concurrence et de la demande',
    icon: DollarSign,
    status: 'active' as const,
    actionsToday: 23,
    successRate: 97.8,
    lastRun: '2026-03-07T15:00:00Z',
    category: 'pricing'
  },
  {
    id: 'stock-predictor',
    name: 'Prédicteur de Stock',
    description: 'Anticipe les ruptures et déclenche les réapprovisionnements',
    icon: Package,
    status: 'paused' as const,
    actionsToday: 0,
    successRate: 91.5,
    lastRun: '2026-03-06T18:00:00Z',
    category: 'inventory'
  },
  {
    id: 'ad-optimizer',
    name: 'Optimiseur Publicitaire',
    description: 'Gère automatiquement les enchères et budgets publicitaires',
    icon: Target,
    status: 'active' as const,
    actionsToday: 156,
    successRate: 88.3,
    lastRun: '2026-03-07T15:15:00Z',
    category: 'marketing'
  },
  {
    id: 'quality-auditor',
    name: 'Auditeur Qualité',
    description: 'Détecte et corrige les problèmes de qualité dans le catalogue',
    icon: CheckCircle2,
    status: 'active' as const,
    actionsToday: 12,
    successRate: 96.1,
    lastRun: '2026-03-07T12:00:00Z',
    category: 'quality'
  },
];

const RECENT_ACTIONS = [
  { id: '1', agent: 'Optimiseur de Contenu', action: 'Titre optimisé', target: 'Casque Bluetooth Pro X3', result: 'success', time: 'Il y a 5 min', impact: '+12% CTR estimé' },
  { id: '2', agent: 'Optimiseur de Prix', action: 'Prix ajusté', target: 'Chargeur USB-C 65W', result: 'success', time: 'Il y a 12 min', impact: '+3.2€ marge' },
  { id: '3', agent: 'Optimiseur Publicitaire', action: 'Budget réalloué', target: 'Campagne Black Friday', result: 'success', time: 'Il y a 18 min', impact: '+15% ROAS' },
  { id: '4', agent: 'Auditeur Qualité', action: 'Image manquante détectée', target: 'Montre Connectée Sport', result: 'warning', time: 'Il y a 25 min', impact: 'Action requise' },
  { id: '5', agent: 'Optimiseur de Contenu', action: 'Description enrichie', target: 'Écouteurs Sans Fil ANC', result: 'success', time: 'Il y a 32 min', impact: '+8% conversion' },
];

export default function AIAutomationHubPage() {
  const [agents, setAgents] = useState(AI_AGENTS);

  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(a =>
      a.id === agentId
        ? { ...a, status: a.status === 'active' ? 'paused' as const : 'active' as const }
        : a
    ));
  };

  const totalActions = agents.reduce((sum, a) => sum + a.actionsToday, 0);
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const avgSuccess = agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length;

  return (
    <>
      <Helmet>
        <title>Hub IA & Automatisation | Drop Craft AI</title>
        <meta name="description" content="Centre de commande IA pour l'automatisation intelligente de votre boutique" />
      </Helmet>

      <ChannablePageWrapper
        title="Hub Intelligence Artificielle"
        description="Agents IA autonomes pour optimiser votre boutique en continu"
        heroImage="ai"
        badge={{ label: 'IA Pro', icon: Brain }}
      >
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Bot className="h-4 w-4" /> Agents actifs
              </div>
              <div className="text-2xl font-bold text-foreground">{activeAgents}/{agents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Zap className="h-4 w-4" /> Actions aujourd'hui
              </div>
              <div className="text-2xl font-bold text-foreground">{totalActions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4" /> Taux de succès
              </div>
              <div className="text-2xl font-bold text-foreground">{avgSuccess.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Activity className="h-4 w-4" /> Économies estimées
              </div>
              <div className="text-2xl font-bold text-green-600">+2 340€</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agents" className="gap-1.5">
              <Bot className="h-4 w-4" /> Agents IA
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="h-4 w-4" /> Activité
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Insights
            </TabsTrigger>
          </TabsList>

          {/* Agents IA */}
          <TabsContent value="agents">
            <div className="grid gap-4">
              {agents.map(agent => {
                const Icon = agent.icon;
                return (
                  <Card key={agent.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={cn(
                            'p-2.5 rounded-lg',
                            agent.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{agent.name}</h3>
                              <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {agent.status === 'active' ? 'Actif' : 'En pause'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{agent.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" /> {agent.actionsToday} actions
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> {agent.successRate}% succès
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden md:block">
                            <div className="text-xs text-muted-foreground">Taux de succès</div>
                            <Progress value={agent.successRate} className="w-24 h-1.5 mt-1" />
                          </div>
                          <Switch
                            checked={agent.status === 'active'}
                            onCheckedChange={() => toggleAgent(agent.id)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Activité récente */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions récentes</CardTitle>
                <CardDescription>Historique des actions automatisées par les agents IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {RECENT_ACTIONS.map(action => (
                    <div key={action.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        {action.result === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {action.action} — <span className="text-muted-foreground">{action.target}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{action.agent} · {action.time}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {action.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights IA */}
          <TabsContent value="insights">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Recommandations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { text: '23 produits pourraient bénéficier d\'une réécriture IA des descriptions', priority: 'high' },
                    { text: 'L\'agent de pricing a identifié 8 produits sous-évalués', priority: 'medium' },
                    { text: 'Activez le prédicteur de stock pour éviter les ruptures du week-end', priority: 'low' },
                  ].map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                      <div className={cn(
                        'w-2 h-2 rounded-full mt-1.5 shrink-0',
                        rec.priority === 'high' ? 'bg-destructive' : rec.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      )} />
                      <span className="text-sm text-foreground">{rec.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" /> Performance 7 jours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Actions exécutées', value: '1 247', trend: '+18%' },
                      { label: 'Taux de succès moyen', value: '93.6%', trend: '+2.1%' },
                      { label: 'Revenus générés (IA)', value: '4 820€', trend: '+34%' },
                      { label: 'Temps économisé', value: '42h', trend: '+12h' },
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{stat.value}</span>
                          <Badge variant="outline" className="text-xs text-green-600">{stat.trend}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
