import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Crown, MessageSquare } from "lucide-react";
import { SOCIAL_PROOF } from "@/config/landingPageConfig";

interface FinalCTASectionProps {
  onNavigate: (path: string) => void;
  socialProof?: typeof SOCIAL_PROOF;
}

export const FinalCTASection = memo(({ onNavigate, socialProof = SOCIAL_PROOF }: FinalCTASectionProps) => (
  <section className="py-20 lg:py-28 bg-primary text-primary-foreground" aria-label="Call to action">
    <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl space-y-8">
      <h2 className="text-3xl md:text-5xl font-bold leading-tight">Ready to put your Shopify store on autopilot?</h2>
      <p className="text-lg md:text-xl opacity-90">
        Join {socialProof.merchantCount} merchants saving {socialProof.timeSaved}/week and growing revenue 40% faster with ShopOpti+.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button size="lg" variant="secondary" className="px-8 py-6 text-lg font-semibold" onClick={() => onNavigate('/auth?trial=true')}>
          <Crown className="w-5 h-5 mr-2" aria-hidden="true" /> Start Free 14-Day Trial
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="px-8 py-6 text-lg border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => onNavigate('/contact')}
        >
          <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> Talk to Sales
        </Button>
      </div>
      <p className="text-sm opacity-75">✓ 14-day free trial • ✓ No credit card required • ✓ Cancel anytime</p>
    </div>
  </section>
));
FinalCTASection.displayName = "FinalCTASection";
