import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, ArrowRight, CheckCircle2, Play, Zap, TrendingUp, Shield } from "lucide-react";
import { motion } from "framer-motion";

const HERO_TRUST_SIGNALS = [
  { icon: CheckCircle2, text: "No credit card required" },
  { icon: Zap, text: "Setup in 2 minutes" },
  { icon: Shield, text: "Cancel anytime" },
] as const;

const HERO_METRICS = [
  { value: "40%", label: "Revenue increase", icon: TrendingUp },
  { value: "20h+", label: "Saved weekly", icon: Zap },
  { value: "99+", label: "Suppliers", icon: CheckCircle2 },
] as const;

interface HeroSectionProps {
  onNavigate: (path: string) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export const HeroSection = memo(({ onNavigate }: HeroSectionProps) => (
  <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden" aria-label="Hero">
    {/* Premium mesh gradient background */}
    <div className="absolute inset-0 bg-gradient-hero" />
    <div className="absolute inset-0" style={{ background: 'var(--gradient-mesh)' }} />
    
    {/* Animated orbs */}
    <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-primary/[0.06] blur-[100px] animate-float" aria-hidden="true" />
    <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] rounded-full bg-[hsl(270_76%_58%/0.06)] blur-[100px] animate-float [animation-delay:2s]" aria-hidden="true" />
    
    {/* Subtle grid */}
    <div 
      className="absolute inset-0 opacity-[0.03]" 
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }}
      aria-hidden="true" 
    />

    <div className="container mx-auto px-4 sm:px-6 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Badge className="px-4 py-2 text-sm bg-success/15 text-success border-success/30 shadow-sm inline-flex items-center gap-2 backdrop-blur-sm font-medium mb-4">
            🚀 Beta Launch — Early Access
          </Badge>
          <Badge className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20 shadow-sm inline-flex items-center gap-2 backdrop-blur-sm font-medium mb-8">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI-Powered Dropshipping Automation
          </Badge>
        </motion.div>

        <motion.h1 
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.04em] leading-[1.05] mb-6"
        >
          <span className="text-foreground">Run Your Shopify Store</span>
          <br />
          <span className="bg-gradient-to-r from-primary via-[hsl(250_80%_65%)] to-[hsl(270_76%_58%)] bg-clip-text text-transparent">
            on Autopilot with AI
          </span>
        </motion.h1>

        <motion.p 
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10"
          style={{ textWrap: 'pretty' } as React.CSSProperties}
        >
          Find winning products, automate pricing &amp; inventory, and grow revenue — all from one
          AI-powered platform. Save <strong className="text-foreground font-semibold">20+ hours/week</strong> and
          increase margins by up to <strong className="text-foreground font-semibold">40%</strong>.
        </motion.p>

        <motion.div 
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <Button
            size="lg"
            className="px-8 py-6 text-lg font-semibold group shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 rounded-xl bg-gradient-to-r from-primary to-[hsl(250_80%_60%)] hover:from-primary/90 hover:to-[hsl(250_80%_55%)]"
            onClick={() => {
              try { localStorage.setItem('pending_trial', 'true'); } catch {}
              onNavigate('/auth?trial=true');
            }}
          >
            <Crown className="w-5 h-5 mr-2" aria-hidden="true" />
            Start Free 14-Day Trial
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="px-8 py-6 text-lg border-2 border-border/60 hover:border-primary/30 hover:bg-primary/5 rounded-xl backdrop-blur-sm transition-all duration-300" 
            onClick={() => onNavigate('/features')}
          >
            <Play className="w-5 h-5 mr-2" aria-hidden="true" />
            See How It Works
          </Button>
        </motion.div>

        <motion.div 
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-6 mb-16"
        >
          {HERO_TRUST_SIGNALS.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <item.icon className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Floating metric cards - competitor-level social proof */}
        <motion.div 
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="grid grid-cols-3 gap-3 sm:gap-6 max-w-lg mx-auto"
        >
          {HERO_METRICS.map((metric, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative group rounded-2xl border border-border/50 bg-card/80 backdrop-blur-lg p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <metric.icon className="h-5 w-5 text-primary mb-2 mx-auto" aria-hidden="true" />
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {metric.value}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-1">
                {metric.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
));
HeroSection.displayName = "HeroSection";
