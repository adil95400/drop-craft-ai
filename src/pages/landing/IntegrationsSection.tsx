import { memo, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { INTEGRATION_CATEGORIES, ALL_PLATFORMS, TOTAL_INTEGRATIONS } from "@/config/landingPageConfig";
import { motion, AnimatePresence } from "framer-motion";

/** Platform → SimpleIcons slug + brand color */
const PLATFORM_META: Record<string, { si: string; color: string }> = {
  Shopify: { si: "shopify", color: "7AB55C" },
  WooCommerce: { si: "woocommerce", color: "96588A" },
  Amazon: { si: "amazon", color: "FF9900" },
  eBay: { si: "ebay", color: "E53238" },
  Etsy: { si: "etsy", color: "F16521" },
  "TikTok Shop": { si: "tiktok", color: "000000" },
  AliExpress: { si: "aliexpress", color: "FF4747" },
  "CJ Dropshipping": { si: "cjdropshipping", color: "F50057" },
  "Google Shopping": { si: "google", color: "4285F4" },
  "Meta Ads": { si: "meta", color: "0081FB" },
  "TikTok Ads": { si: "tiktok", color: "000000" },
  Klaviyo: { si: "klaviyo", color: "000000" },
  Mailchimp: { si: "mailchimp", color: "FFE01B" },
  DHL: { si: "dhl", color: "FFCC00" },
  FedEx: { si: "fedex", color: "4D148C" },
  UPS: { si: "ups", color: "351C15" },
  Printify: { si: "printify", color: "39B349" },
};

const REMAINING = TOTAL_INTEGRATIONS - ALL_PLATFORMS.length;

interface IntegrationsSectionProps {
  onNavigate: (path: string) => void;
}

export const IntegrationsSection = memo(({ onNavigate }: IntegrationsSectionProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const visiblePlatforms = useMemo(
    () =>
      activeCategory
        ? INTEGRATION_CATEGORIES.find((c) => c.label === activeCategory)?.platforms ?? []
        : ALL_PLATFORMS,
    [activeCategory]
  );

  return (
    <section className="py-16 lg:py-24 bg-secondary/20" aria-label="Integrations">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 mb-4">
          Integrations
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Connects with your entire e-commerce stack
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          {TOTAL_INTEGRATIONS}+ suppliers and 24+ selling platforms, all synced in real time.
        </p>

        {/* Category filters */}
        <div
          className="flex flex-wrap justify-center gap-2 mb-8"
          role="tablist"
          aria-label="Filter integrations by category"
        >
          <Button
            variant={activeCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(null)}
            role="tab"
            aria-selected={activeCategory === null}
          >
            All ({ALL_PLATFORMS.length})
          </Button>
          {INTEGRATION_CATEGORIES.map((cat) => (
            <Button
              key={cat.label}
              variant={activeCategory === cat.label ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.label)}
              role="tab"
              aria-selected={activeCategory === cat.label}
            >
              {cat.label} ({cat.platforms.length})
            </Button>
          ))}
        </div>

        {/* Logos grid */}
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto" role="tabpanel">
          <AnimatePresence mode="popLayout">
            {visiblePlatforms.map((p) => {
              const meta = PLATFORM_META[p];
              return (
                <motion.div
                  key={p}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all"
                >
                  {meta ? (
                    <img
                      src={`https://cdn.simpleicons.org/${meta.si}/${meta.color}`}
                      alt=""
                      className="w-5 h-5"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-5 h-5 rounded bg-muted grid place-items-center text-[10px] font-bold text-muted-foreground">
                      {p[0]}
                    </div>
                  )}
                  <span className="text-sm font-medium">{p}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {!activeCategory && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5">
              <span className="text-sm font-semibold text-primary">+{REMAINING} more</span>
            </div>
          )}
        </div>

        <Button variant="outline" className="mt-10" onClick={() => onNavigate("/integrations")}>
          View All Integrations <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
});
IntegrationsSection.displayName = "IntegrationsSection";
