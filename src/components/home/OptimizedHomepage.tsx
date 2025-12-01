import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, ShoppingBag, TrendingUp, Shield, Rocket, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export function OptimizedHomepage() {
  const features = [
    {
      icon: ShoppingBag,
      title: 'Multi-Channel Publishing',
      description: 'Publiez vos produits sur Amazon, eBay, Etsy, Shopify en un clic',
      badge: 'Populaire',
    },
    {
      icon: TrendingUp,
      title: 'Dynamic Repricing',
      description: 'Prix optimisés automatiquement selon vos marges et la concurrence',
      badge: 'Nouveau',
    },
    {
      icon: Zap,
      title: 'AI Optimization',
      description: "Optimisation automatique des titres, descriptions et attributs par IA",
      badge: 'IA',
    },
    {
      icon: Shield,
      title: 'Real-Time Sync',
      description: 'Synchronisation en temps réel des stocks et prix',
    },
    {
      icon: Rocket,
      title: 'Auto Fulfillment',
      description: 'Gestion automatique des commandes et expéditions',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Produits synchronisés' },
    { value: '10+', label: 'Marketplaces supportées' },
    { value: '99.9%', label: 'Uptime garanti' },
    { value: '24/7', label: 'Support disponible' },
  ];

  const pricing = [
    {
      name: 'Starter',
      price: '29',
      features: [
        '1,000 produits',
        '3 marketplaces',
        'Synchronisation automatique',
        'Support email',
      ],
    },
    {
      name: 'Professional',
      price: '99',
      features: [
        '10,000 produits',
        '10 marketplaces',
        'AI optimization',
        'Dynamic repricing',
        'Support prioritaire',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '299',
      features: [
        'Produits illimités',
        'Toutes les marketplaces',
        'API personnalisée',
        'Account manager dédié',
        'SLA garanti',
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-4" variant="outline">
            Plateforme Multi-Channel #1
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Gérez tous vos canaux de vente
            <br />
            <span className="text-primary">en un seul endroit</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            ShopOpti synchronise automatiquement vos produits, stocks et prix sur Amazon, eBay, Etsy, Shopify et plus encore.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/dashboard">
                Commencer gratuitement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing">Voir les tarifs</Link>
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Fonctionnalités puissantes</h2>
            <p className="text-muted-foreground">Tout ce dont vous avez besoin pour gérer votre e-commerce</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      {feature.badge && (
                        <Badge variant="secondary">{feature.badge}</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tarifs simples et transparents</h2>
            <p className="text-muted-foreground">Choisissez le plan adapté à vos besoins</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <Card key={plan.name} className={plan.popular ? 'border-primary shadow-lg' : ''}>
                <CardContent className="pt-6">
                  {plan.popular && (
                    <Badge className="mb-4">Le plus populaire</Badge>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}€</span>
                    <span className="text-muted-foreground">/mois</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    Choisir ce plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à automatiser votre e-commerce ?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Rejoignez des milliers de marchands qui font confiance à ShopOpti
          </p>
          <Button size="lg" asChild>
            <Link to="/dashboard">
              Démarrer maintenant <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
