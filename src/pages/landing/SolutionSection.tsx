import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Bot, LineChart, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { SOCIAL_PROOF } from "@/config/landingPageConfig";
import { motion, AnimatePresence } from "framer-motion";

const PILLARS = [
  {
    id: "find",
    icon: Search, badge: "Find", title: "AI Product Research",
    desc: `Discover winning products across ${SOCIAL_PROOF.supplierCount} suppliers with AI-powered scoring. Instantly identify trending items, reliable suppliers, and high-margin opportunities before your competitors.`,
    features: ["AI product scoring & ranking", "Supplier reliability analysis", "Real-time trend detection", "Profit margin calculator"],
    gradientClass: "bg-gradient-to-br from-primary/80 to-accent",
    stats: { value: "3x", label: "faster product discovery" },
  },
  {
    id: "automate",
    icon: Bot, badge: "Automate", title: "Full-Store Automation",
    desc: "Put your entire Shopify store on autopilot. Dynamic pricing, inventory sync across suppliers, one-click order fulfillment, and SEO auto-optimization — all powered by AI.",
    features: ["Dynamic pricing AI engine", "Real-time inventory sync", "One-click order fulfillment", "Automated SEO optimization"],
    gradientClass: "bg-gradient-to-br from-primary to-primary/60",
    stats: { value: "20h+", label: "saved per week" },
  },
  {
    id: "grow",
    icon: LineChart, badge: "Grow", title: "Revenue Growth Engine",
    desc: "Real-time analytics and predictive AI insights to scale faster. Track every metric, forecast trends, automate marketing, and outpace competitors with data-driven decisions.",
    features: ["Real-time revenue dashboards", "AI-powered predictions", "Marketing automation suite", "Competitor price tracking"],
    gradientClass: "bg-gradient-to-br from-success to-accent",
    stats: { value: "+40%", label: "average revenue increase" },
  },
] as const;

interface SolutionSectionProps {
  onNavigate: (path: string) => void;
}

export const SolutionSection = memo(({ onNavigate }: SolutionSectionProps) => {
  const [activeTab, setActiveTab] = useState<string>("find");
  const activePillar = PILLARS.find(p => p.id === activeTab) ?? PILLARS[0];

  return (
    <section className="py-16 lg:py-24" aria-label="ShopOpti features">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-12">
          <Badge className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20">The Solution</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">One AI platform. Three superpowers.</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ShopOpti+ is the AI copilot that handles the heavy lifting so you can focus on scaling your Shopify business.
          </p>
        </div>

        {/* Tab selector - interactive on desktop */}
        <div className="hidden lg:flex items-center justify-center gap-2 mb-10" role="tablist">
          {PILLARS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={activeTab === p.id}
              onClick={() => setActiveTab(p.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all text-sm ${
                activeTab === p.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              <p.icon className="h-4 w-4" />
              {p.title}
            </button>
          ))}
        </div>

        {/* Desktop: active tab detail */}
        <div className="hidden lg:block" role="tabpanel">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePillar.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-2 gap-10 items-center max-w-5xl mx-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${activePillar.gradientClass}`}>
                    <activePillar.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <Badge variant="outline">{activePillar.badge}</Badge>
                </div>
                <h3 className="text-3xl font-bold">{activePillar.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{activePillar.desc}</p>
                <ul className="space-y-3">
                  {activePillar.features.map((f, j) => (
                    <motion.li
                      key={f}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: j * 0.1 }}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      <span>{f}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
              {/* Stats card */}
              <div className="flex justify-center">
                <Card className="w-full max-w-sm border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <Sparkles className="h-8 w-8 mx-auto text-primary" />
                    <div className="text-5xl font-bold text-primary">{activePillar.stats.value}</div>
                    <p className="text-muted-foreground font-medium">{activePillar.stats.label}</p>
                    <Button className="mt-4" onClick={() => onNavigate('/auth?trial=true')}>
                      Try it free <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile: cards grid */}
        <div className="grid md:grid-cols-3 gap-8 lg:hidden">
          {PILLARS.map((p, i) => (
            <Card key={i} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
              <CardHeader className="space-y-4">
                <div className={`p-3 rounded-xl ${p.gradientClass} w-fit`}>
                  <p.icon className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
                </div>
                <Badge variant="outline" className="w-fit">{p.badge}</Badge>
                <CardTitle className="text-2xl">{p.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{p.desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 pt-2 text-primary font-semibold text-sm">
                  <Sparkles className="h-4 w-4" />
                  {p.stats.value} {p.stats.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="px-8 py-6 text-lg" onClick={() => onNavigate('/features')}>
            Explore All Features <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
});
SolutionSection.displayName = "SolutionSection";
