import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { SOCIAL_PROOF, TESTIMONIALS } from "@/config/landingPageConfig";

const STAR_ARRAY = Array.from({ length: 5 });

export const ProofSection = memo(() => (
  <section className="py-16 lg:py-24" aria-label="Customer testimonials">
    <div className="container mx-auto px-4 sm:px-6">
      <div className="text-center space-y-4 mb-12">
        <Badge className="px-4 py-2 bg-warning/15 text-warning border-warning/30">Social Proof</Badge>
        <h2 className="text-3xl md:text-4xl font-bold">Merchants love ShopOpti+</h2>
        <p className="text-lg text-muted-foreground">Join {SOCIAL_PROOF.merchantCount} sellers who scaled their stores with AI automation.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {TESTIMONIALS.map((t, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">{t.metric}</Badge>
              <div className="flex gap-1" aria-label="5 out of 5 stars">
                {STAR_ARRAY.map((_, j) => <Star key={j} className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />)}
              </div>
              <blockquote className="text-muted-foreground italic leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm" aria-hidden="true">{t.avatar}</div>
                <div>
                  <div className="font-semibold text-sm">{t.author}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
));
ProofSection.displayName = "ProofSection";
