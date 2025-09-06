import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Crown,
  Zap,
  Check,
  X,
  CreditCard,
  Calendar,
  Users,
  BarChart3,
  Shield,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  features: PlanFeature[];
  popular?: boolean;
  current?: boolean;
}

interface UserQuota {
  quota_key: string;
  current_count: number;
  limit_value: number;
  reset_date: string;
}

interface UsageMetrics {
  products_imported: number;
  orders_processed: number;
  ai_generations: number;
  api_calls: number;
  storage_used: number;
  team_members: number;
}

export const SubscriptionManagement: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [quotas, setQuotas] = useState<UserQuota[]>([]);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { toast } = useToast();

  const mockPlans: SubscriptionPlan[] = [
    {
      id: 'standard',
      name: 'Standard',
      description: 'Parfait pour commencer',
      price: 29,
      billing_period: 'monthly',
      features: [
        { name: 'Jusqu\'à 1000 produits', included: true, limit: 1000 },
        { name: 'Jusqu\'à 100 commandes/mois', included: true, limit: 100 },
        { name: 'Import basique CSV/XML', included: true },
        { name: 'Support email', included: true },
        { name: 'Génération IA limitée', included: true, limit: 50 },
        { name: 'Analytics avancées', included: false },
        { name: 'API premium', included: false },
        { name: 'Support prioritaire', included: false }
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
        { name: 'Commandes illimitées', included: true },
        { name: 'Import avancé + IA', included: true },
        { name: 'CRM & Marketing automation', included: true },
        { name: 'Génération IA étendue', included: true, limit: 500 },
        { name: 'Analytics avancées', included: true },
        { name: 'Intégrations premium', included: true },
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
        { name: 'Commandes illimitées', included: true },
        { name: 'IA & automatisation complète', included: true },
        { name: 'CRM & Marketing avancés', included: true },
        { name: 'Génération IA illimitée', included: true },
        { name: 'Analytics prédictives', included: true },
        { name: 'API complète', included: true },
        { name: 'Support dédié 24/7', included: true },
        { name: 'Formation personnalisée', included: true }
      ]
    }
  ];

  const mockQuotas: UserQuota[] = [
    {
      quota_key: 'products_import',
      current_count: 750,
      limit_value: 1000,
      reset_date: '2024-02-01T00:00:00Z'
    },
    {
      quota_key: 'orders_processing',
      current_count: 45,
      limit_value: 100,
      reset_date: '2024-02-01T00:00:00Z'
    },
    {
      quota_key: 'ai_generations',
      current_count: 28,
      limit_value: 50,
      reset_date: '2024-02-01T00:00:00Z'
    },
    {
      quota_key: 'api_calls',
      current_count: 2450,
      limit_value: 5000,
      reset_date: '2024-02-01T00:00:00Z'
    }
  ];

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);

      // Simulate current plan (Standard)
      const current = mockPlans[0];
      current.current = true;
      setCurrentPlan(current);
      setAvailablePlans(mockPlans);

      // Set mock quotas
      setQuotas(mockQuotas);

      // Set mock usage
      setUsage({
        products_imported: 750,
        orders_processed: 45,
        ai_generations: 28,
        api_calls: 2450,
        storage_used: 1.2,
        team_members: 2
      });

    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'abonnement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    
    try {
      // Simulate Stripe checkout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Mise à niveau réussie",
        description: "Votre abonnement a été mis à jour avec succès",
      });
      
      // Update current plan
      const newPlan = availablePlans.find(p => p.id === planId);
      if (newPlan) {
        setCurrentPlan({ ...newPlan, current: true });
      }
      
    } catch (error) {
      toast({
        title: "Erreur de paiement",
        description: "Impossible de traiter le paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setUpgrading(null);
    }
  };

  const getQuotaUsage = (quotaKey: string) => {
    const quota = quotas.find(q => q.quota_key === quotaKey);
    return quota ? (quota.current_count / quota.limit_value) * 100 : 0;
  };

  const getQuotaColor = (usage: number) => {
    if (usage >= 90) return 'text-red-600';
    if (usage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatQuotaName = (key: string) => {
    const names = {
      'products_import': 'Produits importés',
      'orders_processing': 'Commandes traitées',
      'ai_generations': 'Générations IA',
      'api_calls': 'Appels API'
    };
    return names[key as keyof typeof names] || key;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const k = 1024;
    const sizes = ['GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-12 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Abonnement & Quotas</h1>
          <p className="text-muted-foreground">Gérez votre plan et surveillez vos limites d'utilisation</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Plan {currentPlan?.name}
          </Badge>
        </div>
      </div>

      {/* Current Plan Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Plan Actuel : {currentPlan?.name}</CardTitle>
              <CardDescription className="text-base">{currentPlan?.description}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{currentPlan?.price}€</p>
              <p className="text-sm text-muted-foreground">par mois</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{usage?.products_imported || 0}</p>
              <p className="text-sm text-muted-foreground">Produits importés</p>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{usage?.orders_processed || 0}</p>
              <p className="text-sm text-muted-foreground">Commandes traitées</p>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{usage?.ai_generations || 0}</p>
              <p className="text-sm text-muted-foreground">Générations IA</p>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{usage?.team_members || 0}</p>
              <p className="text-sm text-muted-foreground">Membres équipe</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Utilisation & Quotas</TabsTrigger>
          <TabsTrigger value="plans">Changer de Plan</TabsTrigger>
          <TabsTrigger value="billing">Facturation</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quotas d'Utilisation</CardTitle>
                <CardDescription>Surveillance en temps réel de vos limites</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quotas.map((quota) => {
                  const usage = getQuotaUsage(quota.quota_key);
                  return (
                    <div key={quota.quota_key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{formatQuotaName(quota.quota_key)}</span>
                        <span className={`text-sm font-bold ${getQuotaColor(usage)}`}>
                          {quota.current_count} / {quota.limit_value}
                        </span>
                      </div>
                      <Progress value={usage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Remise à zéro le {new Date(quota.reset_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes & Recommandations</CardTitle>
                <CardDescription>Optimisez votre utilisation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Quota produits à 75%</p>
                    <p className="text-xs text-yellow-600">
                      Vous approchez de votre limite. Considérez une mise à niveau.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Optimisation IA disponible</p>
                    <p className="text-xs text-blue-600">
                      Passez au plan Pro pour l'IA illimitée et les analytics avancées.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Performance excellente</p>
                    <p className="text-xs text-green-600">
                      Vos API calls sont optimales ce mois-ci.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-2 border-purple-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                      Plus Populaire
                    </Badge>
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
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${feature.included ? '' : 'text-muted-foreground line-through'}`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className={`w-full ${plan.current ? 'bg-gray-200 text-gray-600' : plan.popular ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600' : ''}`}
                    disabled={plan.current || upgrading === plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {upgrading === plan.id ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : plan.current ? (
                      'Plan Actuel'
                    ) : (
                      <>
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        {plan.price > (currentPlan?.price || 0) ? 'Mettre à niveau' : 'Rétrograder'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de Facturation</CardTitle>
                <CardDescription>Gérez vos moyens de paiement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Visa • Expire 12/26</p>
                    </div>
                  </div>
                  <Badge variant="outline">Par défaut</Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Ajouter une carte
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Settings className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique des Factures</CardTitle>
                <CardDescription>Téléchargez vos factures</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { date: '2024-01-01', amount: 29, status: 'Payée' },
                  { date: '2023-12-01', amount: 29, status: 'Payée' },
                  { date: '2023-11-01', amount: 29, status: 'Payée' }
                ].map((invoice, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{invoice.amount}€</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800" variant="outline">
                        {invoice.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};