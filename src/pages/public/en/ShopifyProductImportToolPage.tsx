import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Package, Upload, Globe, Zap, Image, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "Which suppliers does ShopOpti+ support?", answer: "ShopOpti+ supports 99+ suppliers including AliExpress, CJ Dropshipping, BigBuy, Spocket, Printful, and many more. You can also import via CSV or product URL from any website." },
  { question: "How fast is product import?", answer: "Single products import in seconds. Bulk imports of 1,000+ products typically complete in under 5 minutes. AI optimization runs in parallel." },
  { question: "Does AI optimize imported products?", answer: "Yes. During import, AI automatically generates optimized titles, descriptions, meta tags, and alt text. It also enhances product images and suggests competitive pricing." },
  { question: "Can I import from my existing store?", answer: "Yes, you can import your entire existing catalog from Shopify, WooCommerce, PrestaShop, or any platform via CSV export/import." },
];

const suppliers = [
  "AliExpress", "CJ Dropshipping", "BigBuy", "Spocket", "Printful", "Printify",
  "Zendrop", "SaleHoo", "Modalyst", "Doba", "Inventory Source", "Syncee"
];

export default function ShopifyProductImportToolPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Shopify Product Import Tool | ShopOpti+ — Import from 99+ Suppliers"
        description="Import products to Shopify from 99+ suppliers in one click. AI-optimized titles, descriptions, and images. Bulk import, CSV support. Free 14-day trial."
        path="/shopify-product-import-tool"
        keywords="shopify product import, import products shopify, shopify dropshipping import, bulk product import shopify, aliexpress to shopify"
      />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/shopify-product-import-tool" },
          { lang: "fr", href: "https://shopopti.io/import-produit-shopify" },
        ]}
        xDefault="https://shopopti.io/shopify-product-import-tool"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "Shopify Product Import Tool", url: "https://shopopti.io/shopify-product-import-tool" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">📦 99+ Suppliers Connected</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Import Products to Shopify from <span className="text-primary">99+ Suppliers</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              One-click product import with AI optimization. Import from AliExpress, CJ Dropshipping, BigBuy, 
              and 90+ more suppliers. Titles, descriptions, and images are enhanced automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>View Pricing</Button>
            </div>
          </div>
        </section>

        {/* Suppliers grid */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-8">Supported Suppliers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {suppliers.map((s) => (
                <div key={s} className="p-4 border rounded-lg text-center bg-card hover:border-primary/50 transition-colors">
                  <p className="font-medium text-sm">{s}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-4">+ 87 more suppliers available</p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Import Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { icon: Upload, title: "One-Click Import", desc: "Paste a product URL and import everything — images, variants, descriptions — in seconds." },
                { icon: Package, title: "Bulk Import", desc: "Import thousands of products at once via CSV, API, or supplier integration." },
                { icon: Zap, title: "AI Enhancement", desc: "AI rewrites titles and descriptions for SEO. Images are auto-enhanced and watermarks removed." },
                { icon: Globe, title: "Multi-Language", desc: "Import products in any language. AI translates and localizes content for your target market." },
                { icon: Image, title: "Image Optimization", desc: "Automatic WebP conversion, compression, and alt text generation for every product image." },
                { icon: FileText, title: "Smart Mapping", desc: "AI maps supplier fields to your Shopify schema automatically. No manual configuration needed." },
              ].map((f) => (
                <Card key={f.title} className="border-none shadow-md">
                  <CardHeader>
                    <f.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-muted-foreground">{f.desc}</p></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

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

        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">Start Importing Products Today</h2>
            <p className="text-lg text-muted-foreground mb-8">Connect to 99+ suppliers and build your catalog in minutes, not days.</p>
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/shopify-automation-tool" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Automation Tool</h3>
                <p className="text-sm text-muted-foreground">Full automation suite</p>
              </Link>
              <Link to="/shopify-ai-optimization" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">AI Optimization</h3>
                <p className="text-sm text-muted-foreground">Boost SEO with AI</p>
              </Link>
              <Link to="/shopify-pricing-automation" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Dynamic Pricing</h3>
                <p className="text-sm text-muted-foreground">AI pricing engine</p>
              </Link>
              <Link to="/shopopti-vs-dsers" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">ShopOpti vs DSers</h3>
                <p className="text-sm text-muted-foreground">Compare solutions</p>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
