import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { features, stats, tools, testimonials, plans } from '@/data/homeData';
import FeatureCard from '@/components/home/FeatureCard';
import StatCard from '@/components/home/StatCard';
import TestimonialCard from '@/components/home/TestimonialCard';
import PricingCard from '@/components/home/PricingCard';
import FAQSection from '@/components/home/FAQSection';
import Head from '@/components/seo/Head';
import heroImage from '/src/assets/hero-ecommerce.jpg';
import trustRibbon from '/images/trust-ribbon.jpg';

export default function Home() {
  return (
    <>
      <Head />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center" aria-labelledby="hero-heading">
          <div className="container mx-auto max-w-4xl">
            <h1 id="hero-heading" className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-6">
              ShopOpti
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              La plateforme e-commerce tout-en-un. Importez des produits, gérez vos commandes, 
              et développez votre business avec l'automatisation et l'IA.
            </p>
            
            {/* Hero Image */}
            <div className="mb-8">
              <img
                src={heroImage}
                alt="Interface de la plateforme ShopOpti montrant le tableau de bord e-commerce"
                className="mx-auto rounded-lg shadow-premium max-w-full h-auto"
                width="800"
                height="500"
                fetchPriority="high"
                loading="eager"
              />
            </div>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" asChild>
                <Link to="/auth" aria-label="Commencer votre essai gratuit">
                  Commencer
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/dashboard" aria-label="Voir une démo du tableau de bord">
                  Voir la démo
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Trust Ribbon */}
        <section className="py-8 px-4" aria-label="Nos partenaires de confiance">
          <div className="container mx-auto max-w-4xl text-center">
            <img
              src={trustRibbon}
              alt="Logos de nos partenaires de confiance : Shopify et BigBuy"
              className="mx-auto max-w-full h-auto opacity-80"
              width="800"
              height="120"
              loading="lazy"
            />
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 bg-muted/30" aria-labelledby="stats-heading">
          <div className="container mx-auto max-w-6xl">
            <h2 id="stats-heading" className="sr-only">Nos résultats en chiffres</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <StatCard key={index} stat={stat} />
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4" aria-labelledby="features-heading">
          <div className="container mx-auto max-w-6xl">
            <h2 id="features-heading" className="text-3xl font-bold text-center mb-12">
              Tout ce dont vous avez besoin pour gérer votre e-commerce
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={index} feature={feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section className="py-20 px-4 bg-muted/30" aria-labelledby="tools-heading">
          <div className="container mx-auto max-w-6xl">
            <h2 id="tools-heading" className="text-3xl font-bold text-center mb-12">
              Intégrations et Outils
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tools.map((tool, index) => (
                <div 
                  key={index} 
                  className={`bg-card text-card-foreground rounded-lg p-6 shadow-card transition-all duration-300 hover:shadow-premium hover:scale-[1.02] ${
                    tool.popular ? 'border-2 border-primary' : 'border border-border'
                  }`}
                >
                  {tool.popular && (
                    <div className="text-xs text-primary font-medium mb-2">POPULAIRE</div>
                  )}
                  <h3 className="font-semibold mb-2">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4" aria-labelledby="testimonials-heading">
          <div className="container mx-auto max-w-6xl">
            <h2 id="testimonials-heading" className="text-3xl font-bold text-center mb-12">
              Ce que disent nos clients
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 px-4 bg-muted/30" aria-labelledby="pricing-heading">
          <div className="container mx-auto max-w-6xl">
            <h2 id="pricing-heading" className="text-3xl font-bold text-center mb-4">
              Choisissez votre plan
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Commencez gratuitement, évoluez selon vos besoins. Tous les plans incluent notre support expert.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <PricingCard key={index} plan={plan} />
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection />

        {/* CTA Section */}
        <section className="py-20 px-4 text-center" aria-labelledby="cta-heading">
          <div className="container mx-auto max-w-2xl">
            <h2 id="cta-heading" className="text-3xl font-bold mb-6">
              Prêt à transformer votre e-commerce ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez des milliers de marchands qui font confiance à ShopOpti pour gérer leurs boutiques en ligne.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" asChild>
                <Link to="/auth" aria-label="Commencer votre essai gratuit de 14 jours">
                  Essai gratuit 14 jours
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact" aria-label="Contacter notre équipe commerciale">
                  Nous contacter
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}