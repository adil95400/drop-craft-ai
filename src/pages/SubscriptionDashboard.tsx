import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Zap, 
  TrendingUp, 
  Users, 
  Target,
  Calendar,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';
import { StripeSetupGuide } from '@/components/subscription/StripeSetupGuide';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function SubscriptionDashboard() {
  const navigate = useNavigate();
  const { currentPlan } = useUnifiedPlan();

  const planFeatures = {
    standard: [
      'Import 10 produits/jour',
      '100 produits en catalogue',
      'Support par email',
      'Accès aux tutoriels'
    ],
    pro: [
      'Import 100 produits/jour',
      'Catalogue illimité',
      'IA Analytics avancée',
      '5 automatisations/mois',
      'Support prioritaire'
    ],
    ultra_pro: [
      'Imports illimités',
      'IA prédictive avancée',
      'Automatisations illimitées',
      'Support 24/7',
      'Manager dédié'
    ]
  };

  const currentFeatures = planFeatures[currentPlan] || planFeatures.standard;

  return (
    <>
      <Helmet>
        <title>Mon Abonnement - Gestion du Plan</title>
        <meta name="description" content="Gérez votre abonnement, plan et facturation ShopOpti" />
      </Helmet>

      <ChannablePageWrapper
        title="Mon Abonnement"
        subtitle="Gestion du Plan"
        description="Gérez votre plan, facturation et accédez aux fonctionnalités premium"
        heroImage="analytics"
        badge={{ label: 'Premium', icon: Sparkles }}
      >
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Subscription Management */}
          <div className="lg:col-span-2 space-y-8">
            <SubscriptionManager />
            
            {/* Stripe Setup Guide for Admins */}
            <StripeSetupGuide />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upgrade Card */}
            {currentPlan !== 'ultra_pro' && (
              <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-background">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    {currentPlan === 'standard' ? (
                      <>
                        <Crown className="w-12 h-12 text-primary mx-auto" />
                        <h3 className="font-semibold">Passez au plan Pro</h3>
                        <p className="text-sm text-muted-foreground">
                          Débloquez l'IA Analytics et plus d'automatisations
                        </p>
                        <Link to="/pricing">
                          <Button className="w-full">
                            Voir les plans
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Zap className="w-12 h-12 text-purple-600 mx-auto" />
                        <h3 className="font-semibold">Découvrez Ultra Pro</h3>
                        <p className="text-sm text-muted-foreground">
                          Automatisation illimitée et IA prédictive
                        </p>
                        <Link to="/pricing">
                          <Button className="w-full">
                            Découvrir Ultra Pro
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Plan Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Fonctionnalités incluses
                </CardTitle>
                <CardDescription>
                  Ce que vous obtenez avec votre plan actuel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Statistiques rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Imports aujourd'hui</span>
                  <Badge variant="secondary">12</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Produits actifs</span>
                  <Badge variant="secondary">89</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Automatisations</span>
                  <Badge variant="secondary">2</Badge>
                </div>
              </CardContent>
            </Card>


            {/* Help & Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Aide & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate('/support?intent=schedule-call')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Planifier un appel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate('/support?intent=billing')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Aide à la facturation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </ChannablePageWrapper>
    </>
  );
}
