import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Package, Zap, Globe, BarChart3, Shield, Clock, Truck, Search, DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "What is Shopify dropshipping automation?", answer: "Dropshipping automation means using software to handle repetitive tasks: product imports from suppliers, automatic order fulfillment, inventory syncing, and dynamic pricing — all without manual intervention." },
  { question: "How does ShopOpti+ automate dropshipping?", answer: "ShopOpti+ connects to 99+ suppliers (AliExpress, CJ, BigBuy, etc.) and automates the entire workflow: import products, optimize listings with AI, auto-fulfill orders, sync inventory in real-time, and adjust prices dynamically." },
  { question: "Is dropshipping automation better than manual?", answer: "Absolutely. Manual dropshipping limits you to ~50 orders/day. With automation, you can handle 1,000+ orders daily while maintaining quality and customer satisfaction." },
  { question: "How much does dropshipping automation cost?", answer: "ShopOpti+ starts at $29/month. Compare that to the cost of a VA ($500+/month) or the time cost of doing everything manually (20+ hours/week at your hourly rate)." },
  { question: "Can I use ShopOpti+ with AliExpress?", answer: "Yes! ShopOpti+ integrates with AliExpress, CJ Dropshipping, BigBuy, Spocket, and 95+ other suppliers. One-click product import with AI optimization." },
];

const workflow = [
  { title: "Find Winning Products", desc: "AI analyzes market trends, competition, and margins to identify high-potential products across 99+ suppliers.", icon: Search },
  { title: "One-Click Import", desc: "Import products with AI-optimized titles, descriptions, and images. Ready to sell in seconds.", icon: Package },
  { title: "Auto Price Optimization", desc: "Set pricing rules once. AI adjusts prices based on competition, demand, and your target margins.", icon: DollarSign },
  { title: "Automatic Order Fulfillment", desc: "Customer buys → order auto-placed with supplier → tracking synced to Shopify. Zero manual work.", icon: Truck },
  { title: "Real-Time Inventory Sync", desc: "Stock levels update automatically. Listings paused when out of stock. No overselling, ever.", icon: Shield },
  { title: "Performance Analytics", desc: "Track profit margins, best sellers, supplier reliability, and customer satisfaction from one dashboard.", icon: BarChart3 },
];

export default function ShopifyDropshippingAutomationPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Shopify Dropshipping Automation Software | ShopOpti+"
        description="Automate your entire Shopify dropshipping business. AI-powered product imports, auto-fulfillment, dynamic pricing & inventory sync from 99+ suppliers. Free trial."
        path="/shopify-dropshipping-automation"
        keywords="shopify dropshipping automation, dropshipping automation software, automate dropshipping, shopify dropshipping tool, automated dropshipping"
      />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/shopify-dropshipping-automation" },
          { lang: "fr", href: "https://shopopti.io/logiciel-dropshipping" },
        ]}
        xDefault="https://shopopti.io/shopify-dropshipping-automation"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "Shopify Dropshipping Automation", url: "https://shopopti.io/shopify-dropshipping-automation" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">🚀 Dropshipping on Autopilot</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Shopify <span className="text-primary">Dropshipping</span> Automation
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Run your entire dropshipping business on autopilot. From product sourcing to order fulfillment, 
              ShopOpti+ handles everything with AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
                Automate My Store <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/shopopti-vs-autods')}>
                Compare to AutoDS
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">99+ suppliers • Auto-fulfillment • Free 14-day trial</p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
              {[
                { value: "99+", label: "Suppliers Connected" },
                { value: "1000+", label: "Orders/Day Capacity" },
                { value: "< 5min", label: "Setup Time" },
                { value: "0", label: "Manual Orders Needed" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-3xl font-bold text-primary">{s.value}</p>
                  <p className="text-muted-foreground text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-4">The Complete Automated Dropshipping Workflow</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Every step of your dropshipping business, fully automated by AI.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflow.map((w) => (
                <Card key={w.title} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <w.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-lg">{w.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{w.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">Manual vs Automated Dropshipping</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Task</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Manual</th>
                    <th className="text-center p-4 font-semibold text-primary">ShopOpti+ Automated</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Product Import", "2-5 min/product", "1-click bulk import"],
                    ["Order Fulfillment", "5-10 min/order", "Instant auto-fulfillment"],
                    ["Price Updates", "Hours of research", "Real-time AI pricing"],
                    ["Inventory Sync", "Daily manual check", "24/7 real-time sync"],
                    ["SEO Optimization", "30 min/product", "AI auto-optimization"],
                    ["Scaling Capacity", "~50 orders/day", "1,000+ orders/day"],
                  ].map(([task, manual, auto]) => (
                    <tr key={task} className="border-b">
                      <td className="p-4 font-medium">{task}</td>
                      <td className="p-4 text-center text-muted-foreground">{manual}</td>
                      <td className="p-4 text-center text-primary font-medium">{auto}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqItems.map((item) => (
                <div key={item.question} className="border rounded-lg p-6 bg-card">
                  <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">Start Automating Your Dropshipping Business</h2>
            <p className="text-lg text-muted-foreground mb-8">Join 10,000+ merchants running dropshipping on autopilot.</p>
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Internal links */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/shopify-automation-tool" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Automation Tool</h3>
                <p className="text-sm text-muted-foreground">Full automation suite</p>
              </Link>
              <Link to="/shopify-product-import-tool" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Product Import</h3>
                <p className="text-sm text-muted-foreground">Import from 99+ suppliers</p>
              </Link>
              <Link to="/shopopti-vs-autods" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">vs AutoDS</h3>
                <p className="text-sm text-muted-foreground">Feature comparison</p>
              </Link>
              <Link to="/shopopti-vs-dsers" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">vs DSers</h3>
                <p className="text-sm text-muted-foreground">Why merchants switch</p>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
