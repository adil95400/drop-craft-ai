import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Crown, MessageSquare } from "lucide-react";
import { SOCIAL_PROOF } from "@/config/landingPageConfig";

interface FinalCTASectionProps {
  onNavigate: (path: string) => void;
  socialProof?: typeof SOCIAL_PROOF;
}

export const FinalCTASection = memo(({ onNavigate, socialProof = SOCIAL_PROOF }: FinalCTASectionProps) => (
  <section className="py-16 sm:py-20 lg:py-28 bg-primary text-primary-foreground" aria-labelledby="cta-heading">
    <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl space-y-6 sm:space-y-8">
      <h2
        id="cta-heading"
        className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight"
        style={{ textWrap: 'balance' }}
      >
        Ready to put your Shopify store on autopilot?
      </h2>
      <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90">
        Join {socialProof.merchantCount} merchants saving {socialProof.timeSaved}/week and growing revenue 40% faster with ShopOpti+.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4">
        <Button
          size="lg"
          variant="secondary"
          className="px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold active:scale-[0.97]"
          onClick={() => onNavigate('/auth?trial=true')}
        >
          <Crown className="w-5 h-5 mr-2" aria-hidden="true" /> Start Free 14-Day Trial
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 active:scale-[0.97]"
          onClick={() => onNavigate('/contact')}
        >
          <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> Talk to Sales
        </Button>
      </div>
      <p className="text-sm text-primary-foreground/80">
        <span aria-hidden="true">✓</span> 14-day free trial{" "}
        <span aria-hidden="true">•</span>{" "}
        <span aria-hidden="true">✓</span> No credit card required{" "}
        <span aria-hidden="true">•</span>{" "}
        <span aria-hidden="true">✓</span> Cancel anytime
      </p>
    </div>
  </section>
));
FinalCTASection.displayName = "FinalCTASection";
