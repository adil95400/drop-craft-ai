import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Crown } from 'lucide-react';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { STRIPE_CONFIG, StripePlanType } from '@/lib/stripe-config';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

const Pricing = () => {
  const { createCheckoutSession, loading } = useStripeCheckout();
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();

  const handleSelectPlan = async (planType: StripePlanType) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (planType === 'standard') {
      navigate('/dashboard');
      return;
    }

    await createCheckoutSession(planType);
  };

  return (
    <>
      <Helmet>
        <title>Tarifs - ShopOpti | Plans et Pricing</title>
        <meta name="description" content="Plans tarifaires ShopOpti : Starter 29€, Pro 79€, Ultra Pro 199€. 14 jours d'essai gratuit." />
      </Helmet>

      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-6">Choisissez votre plan</h1>
            <p className="text-xl text-muted-foreground">14 jours d'essai gratuit inclus</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Object.entries(STRIPE_CONFIG.plans).map(([key, plan]) => {
              const isFeatured = key === 'pro';
              return (
                <Card key={key} className={`relative ${isFeatured ? 'border-primary shadow-lg scale-105' : ''}`}>
                  {isFeatured && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary">
                        <Crown className="w-4 h-4 mr-1" />
                        RECOMMANDÉ
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold">{plan.price}€</span>
                      {plan.price > 0 && <span className="text-muted-foreground">/mois</span>}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      onClick={() => handleSelectPlan(key as StripePlanType)}
                      disabled={loading}
                      className={`w-full mt-4 ${isFeatured ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}`}
                      variant={isFeatured ? 'default' : 'outline'}
                    >
                      {loading ? 'Chargement...' : 'Choisir ce plan'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  )
}

export default Pricing