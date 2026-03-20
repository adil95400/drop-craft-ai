import { memo } from "react";
import { Users, Clock, Globe, Star } from "lucide-react";
import { SOCIAL_PROOF } from "@/config/landingPageConfig";

const METRICS = [
  { value: SOCIAL_PROOF.merchantCount, label: "Active merchants", icon: Users },
  { value: SOCIAL_PROOF.timeSaved, label: "Saved per week", icon: Clock },
  { value: SOCIAL_PROOF.supplierCount, label: "Suppliers connected", icon: Globe },
  { value: SOCIAL_PROOF.rating, label: "Average rating", icon: Star },
] as const;

export const SocialProofBar = memo(() => (
  <section className="py-12 bg-secondary/30 border-y border-border/40" aria-label="Key metrics">
    <div className="container mx-auto px-4 sm:px-6">
      <p className="text-center text-sm text-muted-foreground mb-8 font-medium uppercase tracking-wider">
        Trusted by {SOCIAL_PROOF.merchantCount} Shopify &amp; e-commerce merchants worldwide
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        {METRICS.map((s, i) => (
          <div key={i} className="text-center space-y-2">
            <s.icon className="h-5 w-5 mx-auto text-primary/60" aria-hidden="true" />
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
));
SocialProofBar.displayName = "SocialProofBar";
