import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Rocket, 
  Store, 
  Settings, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  ShoppingBag,
  Truck,
  TrendingUp,
  Sparkles
} from 'lucide-react';

const STEPS = [
  { 
    id: 1, 
    title: 'Bienvenue sur ShopOpti+', 
    description: 'Configurons votre compte en 3 étapes simples',
    icon: Rocket
  },
  { 
    id: 2, 
    title: 'Votre activité', 
    description: 'Parlez-nous de votre business e-commerce',
    icon: Store
  },
  { 
    id: 3, 
    title: 'Vos priorités', 
    description: 'Personnalisez votre expérience',
    icon: Settings
  }
];

const BUSINESS_TYPES = [
  { value: 'dropshipping', label: 'Dropshipping', icon: Truck },
  { value: 'ecommerce', label: 'E-commerce classique', icon: ShoppingBag },
  { value: 'marketplace', label: 'Multi-marketplace', icon: TrendingUp }
];

const PRIORITIES = [
  { id: 'import', label: 'Importer des produits rapidement' },
  { id: 'optimize', label: 'Optimiser mes fiches produits avec l\'IA' },
  { id: 'sync', label: 'Synchroniser mes stocks automatiquement' },
  { id: 'analytics', label: 'Analyser mes performances' },
  { id: 'automate', label: 'Automatiser les commandes fournisseurs' }
];

export const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('dropshipping');
  const [priorities, setPriorities] = useState<string[]>(['import', 'optimize']);

  const handlePriorityToggle = useCallback((priorityId: string) => {
    setPriorities(prev => 
      prev.includes(priorityId) 
        ? prev.filter(p => p !== priorityId)
        : [...prev, priorityId]
    );
  }, []);

  const handleComplete = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          company_name: companyName || null,
          business_type: businessType,
          preferences: { priorities },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Log activity
      try {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'onboarding_completed',
          entity_type: 'profile',
          description: 'Configuration initiale terminée',
          details: { businessType, priorities }
        });
      } catch {
        // Ignore logging errors
      }

      toast({
        title: '🎉 Configuration terminée !',
        description: 'Bienvenue sur votre tableau de bord ShopOpti+'
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
  };

  const progress = (currentStep / STEPS.length) * 100;
  const StepIcon = STEPS[currentStep - 1].icon;

  const canProceed = () => {
    if (currentStep === 2) return businessType !== '';
    if (currentStep === 3) return priorities.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 shadow-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep > step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : currentStep === step.id 
                        ? 'bg-primary/20 text-primary border-2 border-primary' 
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div 
                    className={`flex-1 h-1 mx-2 rounded transition-all ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </div>
        
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <StepIcon className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{STEPS[currentStep - 1].title}</h2>
            <p className="text-muted-foreground mt-1">{STEPS[currentStep - 1].description}</p>
          </div>

          {/* Step Content */}
          <div className="min-h-[200px]">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">1</div>
                    <div className="text-sm text-muted-foreground">Connecter</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">2</div>
                    <div className="text-sm text-muted-foreground">Importer</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">3</div>
                    <div className="text-sm text-muted-foreground">Explorer</div>
                  </div>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Prêt à booster votre e-commerce ?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      En moins de 2 minutes, personnalisez ShopOpti+ selon vos besoins.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="company">Nom de votre entreprise (optionnel)</Label>
                  <Input
                    id="company"
                    placeholder="Ma Boutique"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Type d'activité</Label>
                  <RadioGroup value={businessType} onValueChange={setBusinessType}>
                    {BUSINESS_TYPES.map((type) => {
                      const TypeIcon = type.icon;
                      return (
                        <div
                          key={type.value}
                          className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            businessType === type.value 
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted hover:border-muted-foreground/30'
                          }`}
                          onClick={() => setBusinessType(type.value)}
                        >
                          <RadioGroupItem value={type.value} id={type.value} />
                          <TypeIcon className="w-5 h-5 text-muted-foreground" />
                          <Label htmlFor={type.value} className="cursor-pointer flex-1">
                            {type.label}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <Label>Quelles sont vos priorités ? (sélectionnez-en au moins une)</Label>
                <div className="space-y-3">
                  {PRIORITIES.map((priority) => (
                    <div
                      key={priority.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        priorities.includes(priority.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                      onClick={() => handlePriorityToggle(priority.id)}
                    >
                      <Checkbox
                        checked={priorities.includes(priority.id)}
                        onCheckedChange={() => handlePriorityToggle(priority.id)}
                      />
                      <Label className="cursor-pointer flex-1">{priority.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
            
            {currentStep === STEPS.length ? (
              <Button 
                onClick={handleComplete} 
                disabled={loading || !canProceed()}
                className="bg-primary"
              >
                {loading ? 'Configuration...' : 'Accéder au tableau de bord'}
                <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
              >
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
