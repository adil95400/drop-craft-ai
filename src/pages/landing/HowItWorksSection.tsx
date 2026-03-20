import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Bot, TrendingUp, ArrowRight } from "lucide-react";

const STEPS = [
  { num: "01", icon: Zap, title: "Connect Your Store", desc: "Link your Shopify, WooCommerce, or any of 24+ platforms in under 2 minutes. No coding required.", colorClass: "bg-primary" },
  { num: "02", icon: Bot, title: "AI Analyzes & Optimizes", desc: "Our AI scans your catalog, identifies opportunities, and sets up automated pricing, inventory sync, and SEO rules.", colorClass: "bg-accent" },
  { num: "03", icon: TrendingUp, title: "Watch Your Store Grow", desc: "Sit back as AI finds winning products, adjusts prices for maximum margin, and fulfills orders automatically.", colorClass: "bg-success" },
] as const;

interface HowItWorksSectionProps {
  onNavigate: (path: string) => void;
}

export const HowItWorksSection = memo(({ onNavigate }: HowItWorksSectionProps) => (
  <section className="py-16 lg:py-24 bg-secondary/20" aria-label="How ShopOpti works">
    <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
      <div className="text-center space-y-4 mb-14">
        <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">How It Works</Badge>
        <h2 className="text-3xl md:text-4xl font-bold">Get started in 3 simple steps</h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          From sign-up to autopilot in under 5 minutes. No technical skills needed.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 relative">
        <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary via-accent to-success" aria-hidden="true" />
        {STEPS.map((step, i) => (
          <div key={i} className="relative text-center space-y-4">
            <div className={`w-14 h-14 rounded-2xl ${step.colorClass} text-primary-foreground flex items-center justify-center mx-auto shadow-lg relative z-10`}>
              <step.icon className="h-7 w-7" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Step {step.num}</span>
            <h3 className="text-xl font-semibold">{step.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Button size="lg" className="px-8 py-6 text-lg" onClick={() => onNavigate('/auth?trial=true')}>
          Get Started Free <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
        </Button>
      </div>
    </div>
  </section>
));
HowItWorksSection.displayName = "HowItWorksSection";
