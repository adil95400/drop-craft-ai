import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, X, Info, Sparkles, Store, ArrowLeft } from 'lucide-react';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { PLANS, FEATURE_ROWS, type PlanInfo } from './plans-data';
import { cn } from '@/lib/utils';

export default function ChoosePlanPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { createCheckoutSession, loading } = useStripeCheckout();
  const { currentPlan } = useUnifiedPlan();
  const [isAnnual, setIsAnnual] = useState(true);
  const [storeCount, setStoreCount] = useState([1]);

  const isFr = i18n.language?.startsWith('fr') ?? true;

  // Determine recommended plan based on store count
  const recommendedPlan = useMemo(() => {
    const count = storeCount[0];
    if (count <= 1) return 'standard';
    if (count <= 5) return 'pro';
    return 'ultra_pro';
  }, [storeCount]);

  const handleSelectPlan = (planId: 'standard' | 'pro' | 'ultra_pro') => {
    createCheckoutSession(planId);
  };

  const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-primary mx-auto" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
      );
    }
    return <span className="text-sm font-medium">{value}</span>;
  };

  return (
    <>
      <Helmet>
        <title>{isFr ? 'Choisissez votre plan - ShopOpti' : 'Choose your plan - ShopOpti'}</title>
        <meta name="description" content={isFr ? 'Comparez les plans ShopOpti et choisissez celui qui convient à votre activité' : 'Compare ShopOpti plans and choose the right one for your business'} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              {isFr ? 'Retour' : 'Back'}
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {isFr ? 'Trouvez la formule qui vous convient.' : 'Find the plan that suits you.'}
            </h1>
            <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">
              {isFr
                ? 'Commencez avec un essai à 0,99 € le premier mois, sans engagement.'
                : 'Start with a €0.99 trial for the first month, no commitment.'}
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                'text-sm font-medium transition-colors',
                isAnnual ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isFr ? 'Annuel' : 'Annual'}
              <Badge variant="secondary" className="ml-2 text-xs">
                {isFr ? '-25%' : '-25%'}
              </Badge>
            </button>
            <Switch checked={!isAnnual} onCheckedChange={(v) => setIsAnnual(!v)} />
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                'text-sm font-medium transition-colors',
                !isAnnual ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isFr ? 'Mensuel' : 'Monthly'}
            </button>
          </div>

          {/* Store selector */}
          <div className="max-w-md mx-auto mb-10 bg-card border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Store className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">
                {isFr ? 'Nombre de boutiques' : 'Number of stores'}
              </span>
              <span className="ml-auto text-lg font-bold text-primary">
                {storeCount[0] >= 10 ? '10+' : storeCount[0]}
              </span>
            </div>
            <Slider
              value={storeCount}
              onValueChange={setStoreCount}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {isFr
                ? `Plan recommandé : ${PLANS.find(p => p.id === recommendedPlan)?.[isFr ? 'nameFr' : 'nameEn']}`
                : `Recommended plan: ${PLANS.find(p => p.id === recommendedPlan)?.[isFr ? 'nameFr' : 'nameEn']}`}
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {PLANS.map((plan) => {
              const isCurrentPlan = currentPlan === plan.id;
              const isRecommended = recommendedPlan === plan.id;
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-2xl border-2 bg-card p-6 flex flex-col transition-all',
                    plan.popular
                      ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]'
                      : 'border-border',
                    isRecommended && !plan.popular && 'border-primary/50'
                  )}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {isFr ? 'Le plus populaire' : 'Most Popular'}
                    </Badge>
                  )}

                  {/* Current plan badge */}
                  {isCurrentPlan && (
                    <Badge variant="secondary" className="absolute -top-3 right-4">
                      {isFr ? 'Votre plan' : 'Your plan'}
                    </Badge>
                  )}

                  <h3 className="text-xl font-bold mt-2">{isFr ? plan.nameFr : plan.nameEn}</h3>

                  {/* Price */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {price}{plan.currency}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      /{isFr ? 'mois' : 'mo'}
                    </span>
                  </div>

                  {/* Promo */}
                  <p className="text-xs text-muted-foreground mt-1">
                    {isFr
                      ? `Commencez pour ${plan.promoFirstMonth}${plan.currency} le 1er mois`
                      : `Start for ${plan.promoFirstMonth}${plan.currency} the 1st month`}
                  </p>

                  {/* CTA */}
                  <Button
                    className={cn(
                      'mt-5 w-full',
                      plan.popular
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'variant-outline'
                    )}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    disabled={loading || isCurrentPlan}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {isCurrentPlan
                      ? (isFr ? 'Plan actuel' : 'Current plan')
                      : (isFr ? `Commencer pour ${plan.promoFirstMonth}${plan.currency}` : `Start for ${plan.promoFirstMonth}${plan.currency}`)}
                  </Button>

                  {/* Annual savings */}
                  {isAnnual && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      {isFr
                        ? `Facturé annuellement — Économisez ${plan.annualSavings}${plan.currency}`
                        : `Billed annually — Save ${plan.annualSavings}${plan.currency}`}
                    </p>
                  )}

                  {/* Description */}
                  <p className="mt-4 text-sm text-muted-foreground border-t pt-4">
                    {isFr ? plan.descriptionFr : plan.descriptionEn}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">
              {isFr ? 'Comparaison détaillée' : 'Detailed Comparison'}
            </h2>

            <div className="overflow-x-auto">
              <TooltipProvider>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground w-1/4">
                        {isFr ? 'APERÇU' : 'OVERVIEW'}
                      </th>
                      {PLANS.map((plan) => (
                        <th key={plan.id} className="text-center py-4 px-4">
                          <span className={cn(
                            'font-semibold',
                            plan.popular && 'text-primary'
                          )}>
                            {isFr ? plan.nameFr : plan.nameEn}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURE_ROWS.map((row, index) => (
                      <tr
                        key={row.key}
                        className={cn(
                          'border-b transition-colors hover:bg-muted/30',
                          index % 2 === 0 && 'bg-muted/10'
                        )}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {isFr ? row.labelFr : row.labelEn}
                            </span>
                            {row.tooltip && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  {row.tooltip}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderFeatureValue(row.standard)}
                        </td>
                        <td className={cn(
                          'py-3.5 px-4 text-center',
                          'bg-primary/[0.03]'
                        )}>
                          {renderFeatureValue(row.pro)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderFeatureValue(row.ultra_pro)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TooltipProvider>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center pb-12">
            <p className="text-muted-foreground mb-4">
              {isFr
                ? 'Des questions ? Contactez notre équipe pour un accompagnement personnalisé.'
                : 'Questions? Contact our team for personalized guidance.'}
            </p>
            <Button variant="outline" onClick={() => navigate('/support')}>
              {isFr ? 'Contacter le support' : 'Contact Support'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
