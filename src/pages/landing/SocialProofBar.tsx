import { memo } from "react";
import { Users, Clock, Globe, Star } from "lucide-react";
import { SOCIAL_PROOF } from "@/config/landingPageConfig";

interface SocialProofBarProps {
  socialProof?: typeof SOCIAL_PROOF;
}

export const SocialProofBar = memo(({ socialProof = SOCIAL_PROOF }: SocialProofBarProps) => {
  const METRICS = [
    { value: socialProof.merchantCount, label: "Active merchants", icon: Users },
    { value: socialProof.timeSaved, label: "Saved per week", icon: Clock },
    { value: socialProof.supplierCount, label: "Suppliers connected", icon: Globe },
    { value: socialProof.rating, label: "Average rating", icon: Star },
  ] as const;

  return (
    <section className="py-10 sm:py-12 bg-secondary/30 border-y border-border/40" aria-label="Key metrics">
      <div className="container mx-auto px-4 sm:px-6">
        <p className="text-center text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 font-medium uppercase tracking-wider">
          Trusted by {socialProof.merchantCount} Shopify &amp; e-commerce merchants worldwide
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {METRICS.map((s, i) => (
            <div key={i} className="text-center space-y-1.5 sm:space-y-2">
              <s.icon className="h-5 w-5 mx-auto text-primary" aria-hidden="true" />
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tabular-nums">{s.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
SocialProofBar.displayName = "SocialProofBar";
