import { Helmet } from 'react-helmet-async';
import { SiteOptimizationDashboard } from '@/components/optimization/SiteOptimizationDashboard';
import { GlobalSEOOptimizer } from '@/components/optimization/GlobalSEOOptimizer';
import { GlobalImageOptimizer } from '@/components/optimization/GlobalImageOptimizer';
import { GlobalTranslationOptimizer } from '@/components/optimization/GlobalTranslationOptimizer';
import { GlobalBlogOptimizer } from '@/components/optimization/GlobalBlogOptimizer';
import { Sparkles, TrendingUp, Search, ImageIcon, Languages } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function OptimizationHub() {
  return (
    <>
      <Helmet>
        <title>Hub d'Optimisation Globale - Optimisez votre site complet</title>
        <meta name="description" content="Optimisez automatiquement votre site complet : produits, SEO, images, traductions, blog et catégories en un seul clic" />
      </Helmet>

      <ChannablePageWrapper
        title="Hub d'Optimisation Globale"
        description="Optimisez votre site complet en un seul clic avec l'IA"
        heroImage="ai"
        badge={{ label: 'Optimisation', icon: Sparkles }}
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              SEO Global
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="translations" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Traductions
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Blog & Contenu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><SiteOptimizationDashboard /></TabsContent>
          <TabsContent value="seo"><GlobalSEOOptimizer /></TabsContent>
          <TabsContent value="images"><GlobalImageOptimizer /></TabsContent>
          <TabsContent value="translations"><GlobalTranslationOptimizer /></TabsContent>
          <TabsContent value="blog"><GlobalBlogOptimizer /></TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
