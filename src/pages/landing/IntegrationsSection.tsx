import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { INTEGRATION_CATEGORIES, ALL_PLATFORMS, TOTAL_INTEGRATIONS } from "@/config/landingPageConfig";

const REMAINING = TOTAL_INTEGRATIONS - ALL_PLATFORMS.length;

interface IntegrationsSectionProps {
  onNavigate: (path: string) => void;
}

export const IntegrationsSection = memo(({ onNavigate }: IntegrationsSectionProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const visiblePlatforms = activeCategory
    ? INTEGRATION_CATEGORIES.find(c => c.label === activeCategory)?.platforms ?? []
    : ALL_PLATFORMS;

  return (
    <section className="py-16 lg:py-24 bg-secondary/20" aria-label="Integrations">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 mb-4">Integrations</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Connects with your entire e-commerce stack</h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          {TOTAL_INTEGRATIONS}+ suppliers and 24+ selling platforms, all synced in real time.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist" aria-label="Filter integrations by category">
          <Button
            variant={activeCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(null)}
            role="tab"
            aria-selected={activeCategory === null}
          >
            All
          </Button>
          {INTEGRATION_CATEGORIES.map(cat => (
            <Button
              key={cat.label}
              variant={activeCategory === cat.label ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.label)}
              role="tab"
              aria-selected={activeCategory === cat.label}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto" role="tabpanel">
          {visiblePlatforms.map((p) => (
            <Badge key={p} variant="outline" className="px-4 py-2.5 text-sm bg-background hover:bg-primary/5 transition-colors">{p}</Badge>
          ))}
          {!activeCategory && (
            <Badge variant="outline" className="px-4 py-2.5 text-sm bg-primary/5 border-primary/30 text-primary font-semibold">
              +{REMAINING} more
            </Badge>
          )}
        </div>
        <Button variant="outline" className="mt-10" onClick={() => onNavigate('/integrations')}>
          View All Integrations <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
});
IntegrationsSection.displayName = "IntegrationsSection";
