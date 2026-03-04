import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, RefreshCw, Package, Shield, Clock, BarChart3, Zap, CheckCircle, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "What is a Shopify auto product updater?", answer: "An auto product updater automatically syncs product information (prices, stock levels, descriptions, images) between your suppliers and your Shopify store — eliminating manual updates." },
  { question: "How often does ShopOpti+ update products?", answer: "ShopOpti+ checks for changes every 15 minutes by default. You can configure real-time updates for critical products or hourly updates for large catalogs." },
  { question: "What happens when a supplier changes prices?", answer: "ShopOpti+ detects the price change and automatically adjusts your selling price based on your margin rules. You can set minimum margins, round to .99, and apply custom formulas." },
  { question: "Can it update product descriptions too?", answer: "Yes! ShopOpti+ can auto-update titles, descriptions, images, variants, and specifications. AI can also rewrite supplier content into SEO-optimized copy." },
  { question: "What if a product goes out of stock?", answer: "ShopOpti+ immediately pauses the listing or marks it as out of stock on your Shopify store. When stock returns, the listing is automatically reactivated." },
];

const updateTypes = [
  { title: "Price Auto-Sync", desc: "Supplier price changes → your prices update automatically based on your margin rules. Never sell at a loss.", icon: RefreshCw },
  { title: "Inventory Auto-Sync", desc: "Real-time stock monitoring. Listings pause when out of stock, reactivate when available. Zero overselling.", icon: Shield },
  { title: "Content Auto-Update", desc: "Product descriptions, images, and specifications sync automatically. AI enhances content for SEO.", icon: Package },
  { title: "Variant Management", desc: "New sizes, colors, or options from suppliers are automatically added to your Shopify listings.", icon: Zap },
  { title: "Bulk Update Engine", desc: "Update 10,000+ products simultaneously. Schedule updates during off-peak hours for zero impact.", icon: Clock },
  { title: "Change Tracking", desc: "Full audit log of every change. Rollback any update with one click if needed.", icon: BarChart3 },
];

export default function ShopifyAutoProductUpdaterPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Shopify Auto Product Updater | Auto-Sync Prices & Stock"
        description="Automatically update Shopify products: prices, stock, descriptions & images synced from suppliers in real-time. No manual work. Free 14-day trial."
        path="/shopify-auto-product-updater"
        keywords="shopify auto product updater, auto update shopify products, shopify product sync, shopify inventory sync, auto price update shopify"
      />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/shopify-auto-product-updater" },
          { lang: "fr", href: "https://shopopti.io/import-produit-shopify" },
        ]}
        xDefault="https://shopopti.io/shopify-auto-product-updater"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "Shopify Auto Product Updater", url: "https://shopopti.io/shopify-auto-product-updater" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">🔄 Auto Product Sync</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Shopify <span className="text-primary">Auto Product</span> Updater
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Keep your Shopify store perfectly synced with suppliers. Prices, stock, descriptions, and images 
              update automatically — in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
                Start Auto-Syncing <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/shopify-automation-tool')}>
                See All Features
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">99+ suppliers supported • 14-day free trial</p>
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-xl">
                <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
                <h3 className="text-xl font-bold mb-3">Without Auto-Updates</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>❌ Selling out-of-stock products</li>
                  <li>❌ Losing money on price changes</li>
                  <li>❌ Hours of manual updates daily</li>
                  <li>❌ Customer complaints & refunds</li>
                  <li>❌ Outdated product information</li>
                </ul>
              </div>
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl">
                <CheckCircle className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">With ShopOpti+ Auto-Updater</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✅ Real-time stock synchronization</li>
                  <li>✅ Automatic margin-based pricing</li>
                  <li>✅ Zero manual work required</li>
                  <li>✅ Happy customers, zero overselling</li>
                  <li>✅ Always-fresh product content</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Update Types */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Everything That Auto-Updates</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {updateTypes.map((u) => (
                <Card key={u.title} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <u.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-lg">{u.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{u.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
              {[
                { value: "15min", label: "Update Frequency" },
                { value: "10k+", label: "Products Synced" },
                { value: "99.9%", label: "Sync Accuracy" },
                { value: "0", label: "Overselling Risk" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-3xl font-bold text-primary">{s.value}</p>
                  <p className="text-muted-foreground text-sm">{s.label}</p>
                </div>
              ))}
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
            <h2 className="text-3xl font-bold mb-4">Stop Updating Products Manually</h2>
            <p className="text-lg text-muted-foreground mb-8">Let ShopOpti+ keep your store perfectly synced 24/7.</p>
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
              <Link to="/shopify-product-import-tool" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Product Import</h3>
                <p className="text-sm text-muted-foreground">Import from 99+ suppliers</p>
              </Link>
              <Link to="/shopify-pricing-automation" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Pricing Automation</h3>
                <p className="text-sm text-muted-foreground">Dynamic AI pricing</p>
              </Link>
              <Link to="/how-to-automate-shopify-store" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Automate Shopify</h3>
                <p className="text-sm text-muted-foreground">Complete automation guide</p>
              </Link>
              <Link to="/shopify-dropshipping-automation" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Dropshipping Auto</h3>
                <p className="text-sm text-muted-foreground">Full dropshipping workflow</p>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
