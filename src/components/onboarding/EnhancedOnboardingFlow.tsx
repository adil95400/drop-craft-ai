/**
 * Onboarding Flow 3 étapes - Phase 3.1
 * 1. Connexion boutique (Shopify/WooCommerce)
 * 2. Import premiers produits
 * 3. Tour guidé du dashboard
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Store, 
  Package, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  ShoppingCart,
  Globe,
  Zap,
  BarChart3,
  Settings,
  Play
} from 'lucide-react';

// Platform options for step 1
const PLATFORMS = [
  { id: 'shopify', name: 'Shopify', icon: ShoppingCart, color: 'bg-green-500', popular: true },
  { id: 'woocommerce', name: 'WooCommerce', icon: Globe, color: 'bg-purple-500', popular: true },
  { id: 'prestashop', name: 'PrestaShop', icon: Store, color: 'bg-pink-500' },
  { id: 'wix', name: 'Wix', icon: Zap, color: 'bg-blue-500' },
];

// Supplier options for step 2
const SUPPLIERS = [
  { id: 'aliexpress', name: 'AliExpress', products: '10M+', popular: true },
  { id: 'cjdropshipping', name: 'CJ Dropshipping', products: '400K+', popular: true },
  { id: 'bigbuy', name: 'BigBuy', products: '100K+' },
  { id: 'spocket', name: 'Spocket', products: '1M+' },
];

// Tour highlights for step 3
const TOUR_HIGHLIGHTS = [
  { icon: BarChart3, title: 'Dashboard', description: 'Vue d\'ensemble de votre business' },
  { icon: Package, title: 'Produits', description: 'Gérez votre catalogue facilement' },
  { icon: Settings, title: 'Automatisation', description: 'Configurez vos règles IA' },
  { icon: Sparkles, title: 'IA Assistant', description: 'Optimisez avec l\'intelligence artificielle' },
];

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: OnboardingStep[] = [
  { id: 1, title: 'Connectez votre boutique', description: 'Liez votre plateforme e-commerce', icon: Store },
  { id: 2, title: 'Importez vos produits', description: 'Choisissez vos premiers fournisseurs', icon: Package },
  { id: 3, title: 'Découvrez ShopOpti+', description: 'Tour guidé des fonctionnalités', icon: Sparkles },
];

export function EnhancedOnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const progress = (currentStep / STEPS.length) * 100;

  const handleComplete = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Save onboarding preferences
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          onboarding_data: {
            platform: selectedPlatform,
            suppliers: selectedSuppliers,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: '🎉 Configuration terminée !',
        description: 'Bienvenue sur votre tableau de bord ShopOpti+',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedPlatform, selectedSuppliers, navigate, toast]);

  const handleSkip = useCallback(async () => {
    if (!user?.id) return;
    
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);

    navigate('/dashboard');
  }, [user?.id, navigate]);

  const nextStep = () => setCurrentStep(prev => Math.min(STEPS.length, prev + 1));
  const prevStep = () => setCurrentStep(prev => Math.max(1, prev - 1));

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-2xl border-2">
        {/* Header with progress */}
        <CardHeader className="space-y-4 pb-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              Étape {currentStep} sur {STEPS.length}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
              Passer l'onboarding
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between pt-2">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div 
                  key={step.id} 
                  className={`flex flex-col items-center gap-2 flex-1 ${
                    isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    isActive ? 'bg-primary/10' : isCompleted ? 'bg-success/10' : 'bg-muted'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Platform Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Connectez votre boutique</h2>
                    <p className="text-muted-foreground">
                      Sélectionnez la plateforme que vous utilisez pour votre e-commerce
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {PLATFORMS.map((platform) => {
                      const PlatformIcon = platform.icon;
                      const isSelected = selectedPlatform === platform.id;
                      
                      return (
                        <button
                          key={platform.id}
                          onClick={() => setSelectedPlatform(platform.id)}
                          className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            isSelected 
                              ? 'border-primary bg-primary/5 shadow-lg' 
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          }`}
                        >
                          {platform.popular && (
                            <Badge className="absolute -top-2 -right-2 text-xs bg-primary">
                              Populaire
                            </Badge>
                          )}
                          <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center mb-3`}>
                            <PlatformIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="font-semibold">{platform.name}</div>
                          {isSelected && (
                            <CheckCircle2 className="absolute top-4 right-4 h-5 w-5 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    Pas de boutique ? <span className="text-primary cursor-pointer hover:underline" onClick={nextStep}>Continuez quand même</span>
                  </p>
                </div>
              )}

              {/* Step 2: Supplier Selection */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Choisissez vos fournisseurs</h2>
                    <p className="text-muted-foreground">
                      Sélectionnez les sources de produits pour votre boutique
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {SUPPLIERS.map((supplier) => {
                      const isSelected = selectedSuppliers.includes(supplier.id);
                      
                      return (
                        <button
                          key={supplier.id}
                          onClick={() => toggleSupplier(supplier.id)}
                          className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            isSelected 
                              ? 'border-primary bg-primary/5 shadow-lg' 
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          }`}
                        >
                          {supplier.popular && (
                            <Badge className="absolute -top-2 -right-2 text-xs bg-success">
                              Recommandé
                            </Badge>
                          )}
                          <div className="font-semibold">{supplier.name}</div>
                          <div className="text-sm text-muted-foreground">{supplier.products} produits</div>
                          {isSelected && (
                            <CheckCircle2 className="absolute top-4 right-4 h-5 w-5 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {selectedSuppliers.length} fournisseur(s) sélectionné(s)
                    </Badge>
                  </div>
                </div>
              )}

              {/* Step 3: Tour Guide */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Bienvenue sur ShopOpti+ ! 🎉</h2>
                    <p className="text-muted-foreground">
                      Découvrez les fonctionnalités principales de votre tableau de bord
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {TOUR_HIGHLIGHTS.map((item, index) => {
                      const ItemIcon = item.icon;
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <ItemIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold">{item.title}</div>
                              <div className="text-sm text-muted-foreground">{item.description}</div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/20">
                      <Play className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Tutoriel vidéo disponible</div>
                      <div className="text-sm text-muted-foreground">
                        Découvrez ShopOpti+ en 3 minutes
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Regarder
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Précédent
            </Button>
            
            {currentStep === STEPS.length ? (
              <Button onClick={handleComplete} disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finalisation...
                  </>
                ) : (
                  <>
                    Accéder au dashboard
                    <Sparkles className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep} className="gap-2">
                Suivant
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedOnboardingFlow;
