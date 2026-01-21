/**
 * LiveDemoPreview - Aperçu interactif de la démo
 * Montre les fonctionnalités clés avec animations
 */
import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, TrendingUp, ShoppingCart, DollarSign, 
  ArrowRight, Sparkles, Zap, BarChart3, Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const demoStats = [
  { label: 'Produits', value: 2847, icon: Package, color: 'text-blue-500' },
  { label: 'Commandes', value: 156, icon: ShoppingCart, color: 'text-emerald-500' },
  { label: 'Revenue', value: '€12,458', icon: DollarSign, color: 'text-primary' },
  { label: 'Croissance', value: '+27%', icon: TrendingUp, color: 'text-amber-500' },
];

const demoFeatures = [
  { icon: Package, title: 'Import IA', desc: '99+ fournisseurs' },
  { icon: Zap, title: 'Auto-sync', desc: 'Temps réel' },
  { icon: BarChart3, title: 'Analytics', desc: 'Insights IA' },
  { icon: Sparkles, title: 'Optimisation', desc: 'SEO + Prix' },
];

export const LiveDemoPreview = memo(() => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [activeFeature, setActiveFeature] = useState(0);
  const [animatedValues, setAnimatedValues] = useState(demoStats.map(() => 0));

  // Auto-rotate features
  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % demoFeatures.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  // Animate numbers on mount
  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimatedValues(demoStats.map(s => typeof s.value === 'number' ? s.value : 0));
      return;
    }

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnimatedValues(demoStats.map(stat => {
        if (typeof stat.value === 'number') {
          return Math.round(stat.value * progress);
        }
        return 0;
      }));

      if (step >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-12">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
            <Play className="h-3 w-3 mr-1.5" />
            Démo Interactive
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Découvrez la puissance de ShopOpti+
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Aperçu en temps réel de ce que vous pourrez accomplir
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Mock Dashboard */}
          <Card className="relative overflow-hidden border-2 border-primary/20 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <Badge variant="outline" className="text-xs">
                  Dashboard Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {demoStats.map((stat, i) => {
                  const Icon = stat.icon;
                  const displayValue = typeof stat.value === 'number' 
                    ? animatedValues[i].toLocaleString('fr-FR')
                    : stat.value;
                  
                  return (
                    <motion.div
                      key={stat.label}
                      className="p-3 rounded-lg bg-background/50 border"
                      initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-4 w-4 ${stat.color}`} />
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                      </div>
                      <div className="text-lg sm:text-xl font-bold">{displayValue}</div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Animated Activity */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Activité récente</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature}
                    initial={prefersReducedMotion ? undefined : { opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-success/10 border border-success/20"
                  >
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm">
                      ✨ Nouveau produit importé automatiquement via {demoFeatures[activeFeature].title}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Right: Features */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {demoFeatures.map((feature, i) => {
                const Icon = feature.icon;
                const isActive = i === activeFeature;
                
                return (
                  <motion.button
                    key={feature.title}
                    onClick={() => setActiveFeature(i)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isActive 
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-border hover:border-primary/50 bg-background'
                    }`}
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  >
                    <div className={`p-2 rounded-lg w-fit mb-3 ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="font-semibold">{feature.title}</div>
                    <div className="text-sm text-muted-foreground">{feature.desc}</div>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                className="flex-1 group"
                onClick={() => navigate('/auth')}
              >
                Essai gratuit 14 jours
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/dashboard')}
              >
                <Play className="mr-2 h-4 w-4" />
                Voir la démo complète
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

LiveDemoPreview.displayName = 'LiveDemoPreview';
