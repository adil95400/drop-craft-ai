import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, BarChart3, Zap } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: ShoppingCart,
      title: 'E-commerce Management',
      description: 'Manage your online store with powerful tools and integrations.'
    },
    {
      icon: Package,
      title: 'Product Import',
      description: 'Import products from multiple suppliers and marketplaces.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Get detailed analytics and insights about your business.'
    },
    {
      icon: Zap,
      title: 'Automation',
      description: 'Automate your workflows and save time on repetitive tasks.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-6">
            ShopOpti
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The ultimate e-commerce management platform. Import products, manage orders, 
            and grow your business with powerful automation and AI-driven insights.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to manage your e-commerce business
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-6">
            Ready to transform your e-commerce business?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of merchants who trust ShopOpti to manage their online stores.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth">Start Free Trial</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}