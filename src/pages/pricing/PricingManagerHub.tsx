/**
 * Pricing Manager Hub — Vue d'ensemble de la tarification
 * Centralise les accès aux sous-modules pricing + actions cross-module
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DollarSign, TrendingUp, Shield, Calculator, Brain,
  ArrowRight, BarChart3, Zap, Target, Eye, RefreshCw, Loader2
} from 'lucide-react';
import { ModuleInterconnectionBanner } from '@/components/cross-module/ModuleInterconnectionBanner';
import { useApplyPricingRules, useAutoRepriceFromCompetitors } from '@/hooks/useCrossModuleSync';
import { AIPricingEngine } from '@/components/pricing/AIPricingEngine';

const PRICING_MODULES = [
  {
    id: 'rules',
    title: 'Règles de Prix',
    description: 'Définissez vos règles de markup, marge minimale et arrondis psychologiques',
    icon: Calculator,
    route: '/pricing-manager/rules',
    color: 'text-info',
    badge: null,
  },
  {
    id: 'repricing',
    title: 'Repricing Automatique',
    description: 'Ajustez vos prix en temps réel selon la concurrence et vos objectifs',
    icon: RefreshCw,
    route: '/pricing-manager/repricing',
    color: 'text-success',
    badge: 'Live',
  },
  {
    id: 'monitoring',
    title: 'Veille Concurrentielle',
    description: 'Suivez les prix de vos concurrents et recevez des alertes de variation',
    icon: Eye,
    route: '/pricing-manager/monitoring',
    color: 'text-purple-500',
    badge: null,
  },
  {
    id: 'calculator',
    title: 'Calculateur de Marge',
    description: 'Simulez la rentabilité par produit avec shipping, frais plateforme et publicité',
    icon: DollarSign,
    route: '/pricing-manager/calculator',
    color: 'text-success',
    badge: 'Nouveau',
  },
  {
    id: 'history',
    title: 'Historique des Prix',
    description: 'Évolution des prix, comparaison concurrents et tendances sur la durée',
    icon: BarChart3,
    route: '/pricing-manager/history',
    color: 'text-indigo-500',
    badge: 'Nouveau',
  },
  {
    id: 'engine',
    title: 'Moteur de Règles',
    description: 'Simulez et appliquez des stratégies de pricing complexes avec protection de marge',
    icon: Shield,
    route: '/pricing-manager/engine',
    color: 'text-warning',
    badge: 'Pro',
  },
  {
    id: 'optimization',
    title: 'Optimisation IA',
    description: 'Recommandations de prix intelligentes basées sur l\'élasticité et la demande',
    icon: Brain,
    route: '/pricing-manager/optimization',
    color: 'text-pink-500',
    badge: 'Ultra',
  },
];

export default function PricingManagerHub() {
  const { t: tPages } = useTranslation('pages');
  const navigate = useNavigate();
  const applyRules = useApplyPricingRules();
  const autoReprice = useAutoRepriceFromCompetitors();
  const { data: stats } = useQuery({
    queryKey: ['pricing-hub-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { rules: 0, products: 0, alerts: 0 };

      const [rulesRes, productsRes] = await Promise.all([
        supabase.from('repricing_rules').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      return {
        rules: rulesRes.count || 0,
        products: productsRes.count || 0,
        alerts: 0,
      };
    },
  });

  return (
    <>
      <Helmet>
        <title>Gestionnaire de Prix | Drop-Craft AI</title>
        <meta name="description" content="Hub de gestion tarifaire : règles de prix, repricing automatique, veille concurrentielle et optimisation IA." />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('gestionnaireDePrix.title')}
        description="Centralisez et automatisez votre stratégie tarifaire"
        heroImage="products"
        badge={{ label: 'Pricing', icon: DollarSign }}
      >
        {/* Cross-module interconnection banner */}
        <ModuleInterconnectionBanner currentModule="pricing" />

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Produits', value: stats?.products ?? '—', icon: BarChart3, color: 'text-primary' },
            { label: 'Règles actives', value: stats?.rules ?? '—', icon: Zap, color: 'text-success' },
            { label: 'Marge moy.', value: '—', icon: TrendingUp, color: 'text-info' },
            { label: 'Alertes prix', value: stats?.alerts ?? '—', icon: Target, color: 'text-warning' },
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
        {/* Quick cross-module actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            variant="outline"
            onClick={() => applyRules.mutate()}
            disabled={applyRules.isPending}
          >
            {applyRules.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Appliquer les règles de prix
          </Button>
          <Button
            variant="outline"
            onClick={() => autoReprice.mutate()}
            disabled={autoReprice.isPending}
          >
            {autoReprice.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />}
            Repricing concurrentiel auto
          </Button>
        </div>

        {/* AI Pricing Engine */}
        <div className="mb-8">
          <AIPricingEngine />
        </div>

        {/* Modules grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRICING_MODULES.map((mod) => (
            <Card
              key={mod.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate(mod.route)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-accent">
                    <mod.icon className={`h-6 w-6 ${mod.color}`} />
                  </div>
                  {mod.badge && (
                    <Badge variant="secondary" className="text-xs">{mod.badge}</Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{mod.title}</CardTitle>
                <CardDescription>{mod.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform p-0 h-auto">
                  Accéder <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </ChannablePageWrapper>
    </>
  );
}
