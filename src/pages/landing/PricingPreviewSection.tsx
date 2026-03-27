import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, X, Minus } from "lucide-react";
import { PLANS, type PlanConfig } from "@/config/landingPageConfig";
import { motion, AnimatePresence } from "framer-motion";

const annualSavings = (plan: PlanConfig) => {
  const diff = plan.monthlyPrice - plan.annualPrice;
  return Math.round((diff / plan.monthlyPrice) * 100);
};

// Feature comparison data
const COMPARISON_FEATURES = [
  { label: "Products", values: ["1,000", "10,000", "Unlimited"] },
  { label: "Integrations", values: ["3", "Unlimited", "Unlimited"] },
  { label: "AI Optimization", values: [true, true, true] },
  { label: "Predictive Analytics", values: [false, true, true] },
  { label: "Marketing Automation", values: [false, true, true] },
  { label: "Competitor Tracking", values: [false, true, true] },
  { label: "Dedicated REST API", values: [false, false, true] },
  { label: "Account Manager", values: [false, false, true] },
  { label: "White-label", values: [false, false, true] },
  { label: "Support", values: ["Email", "Priority 24/7", "Dedicated"] },
] as const;

interface PricingPreviewSectionProps {
  onNavigate: (path: string) => void;
}

export const PricingPreviewSection = memo(({ onNavigate }: PricingPreviewSectionProps) => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  return (
    <section className="py-16 lg:py-24" aria-label="Pricing plans">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-10">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="text-lg text-muted-foreground">
            Start free for 14 days. No credit card required. Scale as you grow.
          </p>
        </div>

        {/* Monthly / Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual((prev) => !prev)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              isAnnual ? "bg-primary" : "bg-muted"
            }`}
            role="switch"
            aria-checked={isAnnual}
            aria-label="Toggle annual billing"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-background shadow-sm transition-transform ${
                isAnnual ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual
            <Badge className="ml-2 bg-success/15 text-success border-success/30 text-xs">Save 20%</Badge>
          </span>
        </div>

        {/* Price cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((p) => {
            const price = isAnnual ? p.annualPrice : p.monthlyPrice;
            return (
              <Card
                key={p.name}
                className={`relative ${
                  p.popular ? "border-primary border-2 shadow-xl scale-[1.02]" : "border-2"
                }`}
              >
                {p.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-md">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{p.name}</CardTitle>
                  <CardDescription>{p.desc}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-muted-foreground">/mo</span>
                    {isAnnual && (
                      <Badge
                        variant="outline"
                        className="ml-3 text-xs bg-success/10 text-success border-success/30"
                      >
                        -{annualSavings(p)}%
                      </Badge>
                    )}
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-muted-foreground">Billed ${price * 12}/year</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5 text-sm">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={p.popular ? "default" : "outline"}
                    onClick={() => onNavigate(p.contactSales ? "/contact" : "/auth?trial=true")}
                  >
                    {p.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison toggle */}
        <div className="text-center mt-8 space-y-4">
          <Button variant="outline" onClick={() => setShowComparison((v) => !v)}>
            {showComparison ? "Hide" : "Compare all features"}
          </Button>
        </div>

        {/* Comparison table */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="max-w-4xl mx-auto mt-8 border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      {PLANS.map((p) => (
                        <th key={p.name} className="text-center p-4 font-semibold">
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_FEATURES.map((feat, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-4 font-medium">{feat.label}</td>
                        {feat.values.map((val, j) => (
                          <td key={j} className="text-center p-4">
                            {typeof val === "boolean" ? (
                              val ? (
                                <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                              ) : (
                                <Minus className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                              )
                            ) : (
                              <span>{val}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-6">
          <Button variant="link" onClick={() => onNavigate("/pricing")}>
            See full pricing details <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
});
PricingPreviewSection.displayName = "PricingPreviewSection";
