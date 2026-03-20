import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, ArrowRight, CheckCircle2, Play } from "lucide-react";

const HERO_TRUST_SIGNALS = [
  { icon: CheckCircle2, text: "No credit card required" },
  { icon: CheckCircle2, text: "Setup in 2 minutes" },
  { icon: CheckCircle2, text: "Cancel anytime" },
] as const;

interface HeroSectionProps {
  onNavigate: (path: string) => void;
}

export const HeroSection = memo(({ onNavigate }: HeroSectionProps) => (
  <section className="relative py-20 md:py-28 lg:py-36 overflow-hidden" aria-label="Hero">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
    <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,white,transparent_70%)]" />
    <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
    <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse delay-1000" aria-hidden="true" />

    <div className="container mx-auto px-4 sm:px-6 relative z-10">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <Badge className="px-5 py-2.5 text-sm bg-primary/20 text-foreground border-primary/30 shadow-sm inline-flex items-center gap-2 backdrop-blur-sm">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          AI-Powered Shopify Automation
        </Badge>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
          Run Your Shopify Store
          <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            on Autopilot with AI
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Find winning products, automate pricing &amp; inventory, and grow revenue — all from one
          AI-powered platform. Save <strong className="text-foreground">20+ hours/week</strong> and
          increase margins by up to <strong className="text-foreground">40%</strong>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="px-8 py-6 text-lg font-semibold group shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
            onClick={() => {
              try { localStorage.setItem('pending_trial', 'true'); } catch {}
              onNavigate('/auth?trial=true');
            }}
          >
            <Crown className="w-5 h-5 mr-2" aria-hidden="true" />
            Start Free 14-Day Trial
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-2" onClick={() => onNavigate('/features')}>
            <Play className="w-5 h-5 mr-2" aria-hidden="true" />
            See How It Works
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
          {HERO_TRUST_SIGNALS.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <item.icon className="h-5 w-5 text-success flex-shrink-0" aria-hidden="true" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
));
HeroSection.displayName = "HeroSection";
