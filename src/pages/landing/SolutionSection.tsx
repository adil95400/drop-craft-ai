import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Bot, LineChart, CheckCircle2, ArrowRight } from "lucide-react";
import { SOCIAL_PROOF } from "@/config/landingPageConfig";

export interface SolutionSectionProps {
  onNavigate: (path: string) => void;
  socialProof?: typeof SOCIAL_PROOF;
}

export const SolutionSection = memo(({ onNavigate, socialProof = SOCIAL_PROOF }: SolutionSectionProps) => {
  const PILLARS = [
    {
      icon: Search, badge: "Find", title: "AI Product Research",
      desc: `Discover winning products across ${socialProof.supplierCount} suppliers with AI-powered scoring. Instantly identify trending items, reliable suppliers, and high-margin opportunities before your competitors.`,
      features: ["AI product scoring & ranking", "Supplier reliability analysis", "Real-time trend detection", "Profit margin calculator"],
      gradientClass: "bg-gradient-to-br from-primary/80 to-accent",
    },
    {
      icon: Bot, badge: "Automate", title: "Full-Store Automation",
      desc: "Put your entire Shopify store on autopilot. Dynamic pricing, inventory sync across suppliers, one-click order fulfillment, and SEO auto-optimization — all powered by AI.",
      features: ["Dynamic pricing AI engine", "Real-time inventory sync", "One-click order fulfillment", "Automated SEO optimization"],
      gradientClass: "bg-gradient-to-br from-primary to-primary/60",
    },
    {
      icon: LineChart, badge: "Grow", title: "Revenue Growth Engine",
      desc: "Real-time analytics and predictive AI insights to scale faster. Track every metric, forecast trends, automate marketing, and outpace competitors with data-driven decisions.",
      features: ["Real-time revenue dashboards", "AI-powered predictions", "Marketing automation suite", "Competitor price tracking"],
      gradientClass: "bg-gradient-to-br from-success to-accent",
    },
  ];

  return (
    <section className="py-16 lg:py-24" aria-label="ShopOpti features">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-16">
          <Badge className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20">The Solution</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">One AI platform. Three superpowers.</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ShopOpti+ is the AI copilot that handles the heavy lifting so you can focus on scaling your Shopify business.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
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
              <CardContent>
                <ul className="space-y-2.5">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
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
