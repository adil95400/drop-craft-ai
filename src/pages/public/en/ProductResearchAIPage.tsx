import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Search, TrendingUp, Star, DollarSign, Globe, Zap, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProductResearchAIPage = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="AI Product Research Tool | Find Winning Products Faster"
        description="Find winning dropshipping products with AI. Analyze trends, margins, competition, and supplier reliability across 99+ sources. Data-driven product research."
        path="/product-research-ai"
        keywords="product research AI, winning products tool, dropshipping product finder, AI product scoring, trend analysis ecommerce"
      />

      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Product Research</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Find Winning Products with <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">AI Intelligence</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop guessing. Let AI analyze millions of products across 99+ suppliers to find your next bestseller.
          </p>
          <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Start Researching Free <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "AI Product Scoring", desc: "Every product gets a 0-100 score based on demand, competition, margins, and trend trajectory." },
              { icon: TrendingUp, title: "Trend Detection", desc: "Spot rising trends before they peak. AI analyzes social media, search volume, and sales data." },
              { icon: DollarSign, title: "Margin Calculator", desc: "Instant profit calculations including shipping, fees, and ad costs for any product." },
              { icon: Star, title: "Supplier Rating", desc: "AI-verified supplier ratings based on delivery time, quality scores, and merchant reviews." },
              { icon: Globe, title: "Global Sourcing", desc: "Search across AliExpress, CJ, BigBuy, Spocket, and 99+ suppliers in one place." },
              { icon: Zap, title: "1-Click Import", desc: "Found a winner? Import it to your Shopify store with one click — images, variants, and all." },
            ].map((f, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/30">
                <CardContent className="pt-6 space-y-3">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit"><f.icon className="h-6 w-6 text-primary" /></div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center space-y-8">
          <h2 className="text-3xl font-bold">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Search or browse", desc: "Enter a niche, keyword, or browse trending categories." },
              { step: "2", title: "AI analyzes", desc: "Our AI scores products on demand, margins, competition, and trend." },
              { step: "3", title: "Import & sell", desc: "Import winning products to your store with one click." },
            ].map((s, i) => (
              <div key={i} className="space-y-3 text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto">{s.step}</div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold">Stop guessing. Start finding winners.</h2>
          <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Try Product Research Free <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ProductResearchAIPage;
