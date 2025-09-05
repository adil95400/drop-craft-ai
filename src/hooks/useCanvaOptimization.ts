import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OptimizationRequest {
  action: string;
  content?: any;
  brandColors?: {
    primary?: string;
    secondary?: string;
  };
  pageType?: string;
}

interface CanvaOptimizationResult {
  success: boolean;
  designId?: string;
  designUrl?: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  optimizations?: string[];
  elements?: any[];
  performanceScore?: number;
  conversionPotential?: string;
  [key: string]: any;
}

export const useCanvaOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState<CanvaOptimizationResult | null>(null);
  const { toast } = useToast();

  const optimizeWithCanva = async (request: OptimizationRequest): Promise<CanvaOptimizationResult | null> => {
    setIsOptimizing(true);
    
    try {
      console.log('🎨 Starting Canva optimization...', request);
      
      const { data, error } = await supabase.functions.invoke('canva-design-optimizer', {
        body: request
      });

      if (error) {
        console.error('❌ Canva optimization error:', error);
        toast({
          title: "Erreur d'optimisation",
          description: "Impossible d'optimiser avec Canva. Veuillez réessayer.",
          variant: "destructive"
        });
        return null;
      }

      if (data.success) {
        console.log('✅ Canva optimization successful:', data);
        setResults(data);
        
        toast({
          title: "Optimisation réussie !",
          description: `Design optimisé avec un score de ${data.performanceScore || 'N/A'}%`,
        });
        
        return data;
      } else {
        throw new Error(data.error || 'Optimisation échouée');
      }
      
    } catch (error) {
      console.error('❌ Canva optimization failed:', error);
      toast({
        title: "Erreur d'optimisation",
        description: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsOptimizing(false);
    }
  };

  // Optimisation spécialisée pour les bannières hero
  const optimizeHeroBanner = async (content: any, brandColors?: any) => {
    return optimizeWithCanva({
      action: 'create_hero_banner',
      content,
      brandColors
    });
  };

  // Optimisation de sections de page
  const optimizeSection = async (content: any, pageType: string, brandColors?: any) => {
    return optimizeWithCanva({
      action: 'optimize_section',
      content,
      pageType,
      brandColors
    });
  };

  // Génération d'icônes cohérentes
  const generateIcons = async (features: any[]) => {
    return optimizeWithCanva({
      action: 'generate_icons',
      content: { features }
    });
  };

  // Création de cartes témoignages
  const createTestimonialCards = async (testimonials: any[]) => {
    return optimizeWithCanva({
      action: 'create_testimonial_cards',
      content: { testimonials }
    });
  };

  // Design de cartes de pricing
  const designPricingCards = async (plans: any[], brandColors?: any) => {
    return optimizeWithCanva({
      action: 'design_pricing_cards',
      content: { plans },
      brandColors
    });
  };

  // Création de graphiques pour les fonctionnalités
  const createFeatureGraphics = async (features: any[], brandColors?: any) => {
    return optimizeWithCanva({
      action: 'create_feature_graphics',
      content: { features },
      brandColors
    });
  };

  // Optimisation complète d'une page
  const optimizeFullPage = async (pageData: any, brandColors?: any) => {
    const results = [];
    
    // Optimiser la bannière hero
    if (pageData.hero) {
      const heroResult = await optimizeHeroBanner(pageData.hero, brandColors);
      if (heroResult) results.push({ type: 'hero', ...heroResult });
    }

    // Optimiser les sections de fonctionnalités
    if (pageData.features) {
      const featuresResult = await createFeatureGraphics(pageData.features, brandColors);
      if (featuresResult) results.push({ type: 'features', ...featuresResult });
    }

    // Optimiser les témoignages
    if (pageData.testimonials) {
      const testimonialsResult = await createTestimonialCards(pageData.testimonials);
      if (testimonialsResult) results.push({ type: 'testimonials', ...testimonialsResult });
    }

    // Optimiser les prix
    if (pageData.pricing) {
      const pricingResult = await designPricingCards(pageData.pricing, brandColors);
      if (pricingResult) results.push({ type: 'pricing', ...pricingResult });
    }

    return results;
  };

  return {
    isOptimizing,
    results,
    optimizeWithCanva,
    optimizeHeroBanner,
    optimizeSection,
    generateIcons,
    createTestimonialCards,
    designPricingCards,
    createFeatureGraphics,
    optimizeFullPage
  };
};