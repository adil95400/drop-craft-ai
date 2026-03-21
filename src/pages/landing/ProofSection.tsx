import { memo, useState, useCallback, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { SOCIAL_PROOF, TESTIMONIALS } from "@/config/landingPageConfig";
import { motion, AnimatePresence } from "framer-motion";

const STAR_ARRAY = Array.from({ length: 5 });
const AUTO_SCROLL_MS = 5000;

export const ProofSection = memo(() => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % TESTIMONIALS.length);
    }, AUTO_SCROLL_MS);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [resetTimer]);

  const go = useCallback(
    (dir: -1 | 1) => {
      setCurrent((c) => (c + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
      resetTimer();
    },
    [resetTimer]
  );

  return (
    <section className="py-16 lg:py-24" aria-label="Customer testimonials">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-12">
          <Badge className="px-4 py-2 bg-warning/15 text-warning border-warning/30">Social Proof</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Merchants love ShopOpti+</h2>
          <p className="text-lg text-muted-foreground">
            Join {SOCIAL_PROOF.merchantCount} sellers who scaled their stores with AI automation.
          </p>
        </div>

        {/* Desktop: enhanced grid with featured card */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <TestimonialCard testimonial={t} featured={i === 0} />
            </motion.div>
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden relative max-w-md mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <TestimonialCard testimonial={TESTIMONIALS[current]} featured />
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2" role="tablist">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); resetTimer(); }}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
                  }`}
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => go(1)}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Aggregate rating */}
        <div className="flex items-center justify-center gap-3 mt-10">
          <div className="flex gap-0.5">
            {STAR_ARRAY.map((_, j) => (
              <Star key={j} className="h-5 w-5 fill-warning text-warning" aria-hidden="true" />
            ))}
          </div>
          <span className="text-sm font-medium text-foreground">{SOCIAL_PROOF.rating}</span>
          <span className="text-sm text-muted-foreground">
            from {SOCIAL_PROOF.reviewCount} reviews
          </span>
        </div>
      </div>
    </section>
  );
});
ProofSection.displayName = "ProofSection";

function TestimonialCard({ testimonial: t, featured = false }: { testimonial: (typeof TESTIMONIALS)[0]; featured?: boolean }) {
  return (
    <Card className={`hover:shadow-lg transition-shadow h-full ${featured ? "border-primary/30 bg-primary/[0.02]" : ""}`}>
      <CardContent className="pt-6 space-y-4 relative">
        <Quote className="h-8 w-8 text-primary/10 absolute top-4 right-4" aria-hidden="true" />
        <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
          {t.metric}
        </Badge>
        <div className="flex gap-1" aria-label="5 out of 5 stars">
          {STAR_ARRAY.map((_, j) => (
            <Star key={j} className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
          ))}
        </div>
        <blockquote className="text-muted-foreground italic leading-relaxed">
          &ldquo;{t.quote}&rdquo;
        </blockquote>
        <div className="flex items-center gap-3 pt-2">
          <div
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm"
            aria-hidden="true"
          >
            {t.avatar}
          </div>
          <div>
            <div className="font-semibold text-sm">{t.author}</div>
            <div className="text-xs text-muted-foreground">{t.role}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
