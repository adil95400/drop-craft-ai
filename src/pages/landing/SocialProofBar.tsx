import { memo, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Users, Clock, Globe, Star } from "lucide-react";
import { SOCIAL_PROOF } from "@/config/landingPageConfig";

/** Animated counter that counts up from 0 */
function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

const METRICS = [
  { rawValue: 2000, display: (v: number) => `${v.toLocaleString()}+`, label: "Active merchants", icon: Users },
  { rawValue: 20, display: (v: number) => `${v}h+`, label: "Saved per week", icon: Clock },
  { rawValue: 99, display: (v: number) => `${v}+`, label: "Suppliers connected", icon: Globe },
  { rawValue: 48, display: (v: number) => `${(v / 10).toFixed(1)}/5`, label: "Average rating", icon: Star },
] as const;

export const SocialProofBar = memo(() => (
  <section className="py-12 bg-secondary/30 border-y border-border/40" aria-label="Key metrics">
    <div className="container mx-auto px-4 sm:px-6">
      <p className="text-center text-sm text-muted-foreground mb-8 font-medium uppercase tracking-wider">
        Trusted by {SOCIAL_PROOF.merchantCount} Shopify &amp; e-commerce merchants worldwide
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        {METRICS.map((m, i) => (
          <AnimatedMetric key={i} {...m} />
        ))}
      </div>
    </div>
  </section>
));
SocialProofBar.displayName = "SocialProofBar";

function AnimatedMetric({
  rawValue,
  display,
  label,
  icon: Icon,
}: (typeof METRICS)[number]) {
  const { value, ref } = useCountUp(rawValue);
  return (
    <div ref={ref} className="text-center space-y-2">
      <Icon className="h-5 w-5 mx-auto text-primary/60" aria-hidden="true" />
      <div className="text-2xl sm:text-3xl font-bold text-foreground">{display(value)}</div>
      <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
