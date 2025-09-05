/**
 * Section héro avec lien vers les nouvelles interfaces
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(white,transparent_70%)]" />
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Badge annonce */}
          <div className="flex justify-center">
            <Badge className="px-4 py-2 text-sm flex items-center gap-2 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-4 w-4" />
              Nouvelles interfaces modernes disponibles
              <ArrowRight className="h-3 w-3" />
            </Badge>
          </div>

          {/* Titre principal */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Automatisez votre
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}e-commerce
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Plateforme complète de dropshipping et gestion produits avec IA, 
              intégrations multi-plateformes et interfaces modernes inspirées des leaders du marché.
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="px-8 py-6 text-lg font-semibold group" asChild>
              <Link to="/modern" className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Découvrir les nouvelles interfaces
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg" asChild>
              <Link to="/dashboard">
                Accéder au tableau de bord
              </Link>
            </Button>
          </div>

          {/* Points forts */}
          <div className="grid md:grid-cols-3 gap-6 pt-12">
            <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-background/50 backdrop-blur border">
              <div className="p-3 rounded-full bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Automatisation IA</h3>
              <p className="text-muted-foreground text-sm text-center">
                Optimisation automatique des prix, SEO et gestion des stocks
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-background/50 backdrop-blur border">
              <div className="p-3 rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Analytics Avancés</h3>
              <p className="text-muted-foreground text-sm text-center">
                Tableaux de bord temps réel et insights business intelligence
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-background/50 backdrop-blur border">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Interface Moderne</h3>
              <p className="text-muted-foreground text-sm text-center">
                Design inspiré d'AutoDS, Spocket et Channable pour une UX optimale
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}