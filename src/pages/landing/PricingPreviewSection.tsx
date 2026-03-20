import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { PLANS, type PlanConfig } from "@/config/landingPageConfig";

const annualSavings = (plan: PlanConfig) => {
  const diff = plan.monthlyPrice - plan.annualPrice;
  return Math.round((diff / plan.monthlyPrice) * 100);
};

interface PricingPreviewSectionProps {
  onNavigate: (path: string) => void;
  plans?: PlanConfig[];
}

export const PricingPreviewSection = memo(({ onNavigate, plans = PLANS }: PricingPreviewSectionProps) => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="py-14 sm:py-16 lg:py-24" aria-labelledby="pricing-heading">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
          <h2 id="pricing-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ textWrap: 'balance' }}>
            Simple, transparent pricing
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground" style={{ textWrap: 'pretty' }}>
            Start free for 14 days. No credit card required. Scale as you grow.
          </p>
        </div>

        {/* Monthly / Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-8 sm:mb-10">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(prev => !prev)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${isAnnual ? 'bg-primary' : 'bg-muted'}`}
            role="switch"
            aria-checked={isAnnual}
            aria-label="Toggle annual billing"
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-background shadow-sm transition-transform ${isAnnual ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Annual
            <Badge className="ml-2 bg-success/15 text-success border-success/30 text-xs">Save 20%</Badge>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {plans.map((p) => {
            const price = isAnnual ? p.annualPrice : p.monthlyPrice;
            return (
              <Card key={p.name} className={`relative ${p.popular ? 'border-primary border-2 shadow-xl md:scale-[1.02]' : 'border-2'}`}>
                {p.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-md">Most Popular</Badge>}
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">{p.name}</CardTitle>
                  <CardDescription>{p.desc}</CardDescription>
                  <div className="pt-4">
                    <span className="text-3xl sm:text-4xl font-bold tabular-nums">${price}</span>
                    <span className="text-muted-foreground">/mo</span>
                    {isAnnual && (
                      <Badge variant="outline" className="ml-3 text-xs bg-success/10 text-success border-success/30">
                        -{annualSavings(p)}%
                      </Badge>
                    )}
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-muted-foreground tabular-nums">Billed ${price * 12}/year</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5 text-sm" role="list">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full active:scale-[0.97]"
                    variant={p.popular ? 'default' : 'outline'}
                    onClick={() => onNavigate(p.contactSales ? '/contact' : '/auth?trial=true')}
                  >
                    {p.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="text-center mt-6 sm:mt-8">
          <Button variant="link" onClick={() => onNavigate('/pricing')}>
            Compare all plans in detail <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
});
PricingPreviewSection.displayName = "PricingPreviewSection";
