import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Crown,
  Check,
  X,
  Calendar,
  Users,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  features: { name: string; included: boolean; limit?: number }[];
  popular?: boolean;
  current?: boolean;
}

export const SubscriptionManagement: React.FC = () => {
  const { user } = useUnifiedAuth();
  const { currentPlan, usage: currentUsage } = useUnifiedPlan();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const { data: plans = [] } = useQuery({
    queryKey: ['available-plans'],
    queryFn: async () => {
      // Pour l'instant on garde les plans hardcodés car pas de table plans, mais on connecte l'état courant
      return [
        {
          id: 'free',
          name: 'Starter',
          description: 'Parfait pour commencer',
          price: 0,
          billing_period: 'monthly',
          features: [
            { name: 'Jusqu\'à 100 produits', included: true, limit: 100 },
            { name: 'Import basique', included: true },
            { name: 'Support communautaire', included: true },
            { name: 'IA limitée', included: true, limit: 10 },
          ]
        },
        {
          id: 'pro',
          name: 'Pro',
          description: 'Pour les entreprises en croissance',
          price: 99,
          billing_period: 'monthly',
          popular: true,
          features: [
            { name: 'Jusqu\'à 10000 produits', included: true, limit: 10000 },
            { name: 'Import avancé + IA', included: true },
            { name: 'Génération IA étendue', included: true, limit: 500 },
            { name: 'Support prioritaire', included: true }
          ]
        },
        {
          id: 'ultra_pro',
          name: 'Ultra Pro',
          description: 'Solution enterprise complète',
          price: 299,
          billing_period: 'monthly',
          features: [
            { name: 'Produits illimités', included: true },
            { name: 'IA & automatisation complète', included: true },
            { name: 'Génération IA illimitée', included: true },
            { name: 'Support dédié 24/7', included: true }
          ]
        }
      ] as SubscriptionPlan[];
    }
  });

  const { data: quotas = [] } = useQuery({
    queryKey: ['user-quotas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase.from('quota_usage') as any)
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Merge with limits from plan (simulated logic as plan_limits table might need specific access)
      const limits: Record<string, number> = {
        'products_import': currentPlan === 'free' ? 100 : currentPlan === 'pro' ? 10000 : 100000,
        'ai_generations': currentPlan === 'free' ? 10 : currentPlan === 'pro' ? 500 : 5000,
      };

      return data.map((q: any) => ({
        key: q.quota_key,
        current: q.current_usage,
        limit: limits[q.quota_key] || 100,
        resetDate: q.period_end
      }));
    },
    enabled: !!user
  });

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      // Call Supabase Edge Function for Stripe Checkout
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { planId }
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error('No checkout URL');
      
    } catch (error) {
      toast.error("Erreur lors de l'initialisation du paiement");
    } finally {
      setUpgrading(null);
    }
  };

  const formatQuotaName = (key: string) => {
    const names: Record<string, string> = {
      'products_import': 'Produits importés',
      'ai_generations': 'Générations IA',
      'api_calls': 'Appels API'
    };
    return names[key] || key;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Abonnement & Quotas</h1>
          <p className="text-muted-foreground">Gérez votre plan et surveillez vos limites d'utilisation</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Plan {currentPlan?.toUpperCase()}
          </Badge>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Plan Actuel : {currentPlan?.toUpperCase()}</CardTitle>
              <CardDescription className="text-base">Gérez votre facturation et vos limites</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{currentUsage?.products || 0}</p>
              <p className="text-sm text-muted-foreground">Produits importés</p>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{currentUsage?.orders || 0}</p>
              <p className="text-sm text-muted-foreground">Commandes traitées</p>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{currentUsage?.ai_generations || 0}</p>
              <p className="text-sm text-muted-foreground">Générations IA</p>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{currentUsage?.team_members || 1}</p>
              <p className="text-sm text-muted-foreground">Membres équipe</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Utilisation & Quotas</TabsTrigger>
          <TabsTrigger value="plans">Changer de Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quotas d'Utilisation</CardTitle>
                <CardDescription>Surveillance en temps réel de vos limites</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quotas.map((quota: any) => {
                  const percentage = (quota.current / quota.limit) * 100;
                  return (
                    <div key={quota.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{formatQuotaName(quota.key)}</span>
                        <span className="text-sm font-bold">{quota.current} / {quota.limit}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Remise à zéro le {new Date(quota.resetDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  );
                })}
                {quotas.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Aucune donnée d'utilisation disponible.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes & Recommandations</CardTitle>
                <CardDescription>Optimisez votre utilisation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Optimisation IA disponible</p>
                    <p className="text-xs text-blue-600">Passez au plan Pro pour l'IA illimitée.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-2 border-purple-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">Plus Populaire</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{plan.price}€</span>
                      <span className="text-muted-foreground">/mois</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        {feature.included ? <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" /> : <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                        <span className={`text-sm ${feature.included ? '' : 'text-muted-foreground line-through'}`}>{feature.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className={`w-full ${currentPlan === plan.id ? 'bg-gray-200 text-gray-600' : plan.popular ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600' : ''}`}
                    disabled={currentPlan === plan.id || upgrading === plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {upgrading === plan.id ? <><Clock className="w-4 h-4 mr-2 animate-spin" />Traitement...</> : currentPlan === plan.id ? 'Plan Actuel' : <><ArrowUpRight className="w-4 h-4 mr-2" />Choisir ce plan</>}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};