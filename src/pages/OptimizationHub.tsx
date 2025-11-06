import { Helmet } from 'react-helmet-async';
import { SiteOptimizationDashboard } from '@/components/optimization/SiteOptimizationDashboard';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OptimizationHub() {
  return (
    <>
      <Helmet>
        <title>Hub d'Optimisation Globale - Optimisez votre site complet</title>
        <meta name="description" content="Optimisez automatiquement votre site complet : produits, SEO, images, traductions, blog et catégories en un seul clic" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Hub d'Optimisation Globale
                </h1>
                <p className="text-muted-foreground">
                  Optimisez votre site complet en un seul clic avec l'IA
                </p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                <TrendingUp className="w-3 h-3 mr-1" />
                Optimisation Automatique
              </Badge>
            </div>
          </div>

          {/* Main Dashboard */}
          <SiteOptimizationDashboard />
        </div>
      </div>
    </>
  );
}
