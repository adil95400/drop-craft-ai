import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, RefreshCw, Layers, HeadphonesIcon } from "lucide-react";
import { SOCIAL_PROOF } from "@/config/landingPageConfig";

const TRUST_ITEMS = [
  { icon: Shield, title: "Enterprise Security", desc: "AES-256 encryption, GDPR compliant, SOC 2 aligned. Your data is always safe." },
  { icon: RefreshCw, title: "Real-Time Sync", desc: "Prices, inventory, and orders sync across all channels in real-time. Never oversell." },
  { icon: Layers, title: `${SOCIAL_PROOF.supplierCount} Integrations`, desc: "AliExpress, Amazon, CJ, Spocket, BigBuy, and 94 more suppliers connected." },
  { icon: HeadphonesIcon, title: "24/7 Priority Support", desc: "Expert e-commerce support team available around the clock on Pro and Ultra plans." },
] as const;

export const WhyShopOptiSection = memo(() => (
  <section className="py-16 lg:py-24 bg-secondary/20" aria-label="Why choose ShopOpti">
    <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
      <div className="text-center space-y-4 mb-14">
        <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Why ShopOpti+</Badge>
        <h2 className="text-3xl md:text-4xl font-bold">Built for serious Shopify sellers</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Enterprise-grade technology made accessible to every merchant.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {TRUST_ITEMS.map((item, i) => (
          <Card key={i} className="text-center hover:shadow-md transition-shadow">
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto">
                <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
));
WhyShopOptiSection.displayName = "WhyShopOptiSection";
