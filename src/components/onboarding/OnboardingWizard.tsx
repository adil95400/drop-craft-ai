import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Rocket, 
  Store, 
  Package, 
  TrendingUp,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingData {
  businessType: string;
  experience: string;
  goals: string[];
  monthlyVolume: string;
  interests: string[];
  businessName: string;
  website: string;
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    businessType: '',
    experience: '',
    goals: [],
    monthlyVolume: '',
    interests: [],
    businessName: '',
    website: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const steps = [
    {
      title: 'Votre Profil Business',
      description: 'Dites-nous en plus sur votre activité',
      icon: Store
    },
    {
      title: 'Vos Objectifs',
      description: 'Que souhaitez-vous accomplir ?',
      icon: Target
    },
    {
      title: 'Préférences IA',
      description: 'Personnalisez votre expérience intelligente',
      icon: Sparkles
    },
    {
      title: 'Configuration Finale',
      description: 'Derniers détails pour optimiser votre compte',
      icon: Rocket
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Sauvegarder les données d'onboarding
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          business_type: data.businessType,
          experience_level: data.experience,
          business_goals: data.goals,
          monthly_volume: data.monthlyVolume,
          interests: data.interests,
          business_name: data.businessName,
          website: data.website,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Configuration terminée !",
        description: "Votre compte est maintenant optimisé pour vos besoins.",
      });

      onComplete(data);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration.",
        variant: "destructive"
      });
    }
  };

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'goals' | 'interests', item: string) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Type d'activité</Label>
              <RadioGroup
                value={data.businessType}
                onValueChange={(value) => updateData('businessType', value)}
                className="mt-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing-ecommerce" id="existing" />
                  <Label htmlFor="existing">J'ai déjà une boutique e-commerce</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new-business" id="new" />
                  <Label htmlFor="new">Je démarre mon activité</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="agency" id="agency" />
                  <Label htmlFor="agency">Je gère plusieurs boutiques (Agence)</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-medium">Niveau d'expérience</Label>
              <RadioGroup
                value={data.experience}
                onValueChange={(value) => updateData('experience', value)}
                className="mt-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <Label htmlFor="beginner">Débutant - Je découvre le dropshipping</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate">Intermédiaire - J'ai quelques ventes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced">Avancé - Je cherche à optimiser</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="businessName" className="text-base font-medium">
                Nom de votre entreprise (optionnel)
              </Label>
              <Input
                id="businessName"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
                placeholder="Mon Store Dropshipping"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-4 block">
                Quels sont vos objectifs principaux ? (Sélectionnez tout ce qui s'applique)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Augmenter le chiffre d\'affaires',
                  'Trouver des produits gagnants',
                  'Automatiser les processus',
                  'Améliorer les marges',
                  'Optimiser le SEO',
                  'Gérer l\'inventaire',
                  'Analyser la concurrence',
                  'Développer de nouveaux marchés'
                ].map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={data.goals.includes(goal)}
                      onCheckedChange={() => toggleArrayItem('goals', goal)}
                    />
                    <Label htmlFor={goal} className="text-sm">{goal}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Volume de ventes mensuel ciblé</Label>
              <RadioGroup
                value={data.monthlyVolume}
                onValueChange={(value) => updateData('monthlyVolume', value)}
                className="mt-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0-1k" id="vol1" />
                  <Label htmlFor="vol1">0 - 1 000€</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1k-5k" id="vol2" />
                  <Label htmlFor="vol2">1 000€ - 5 000€</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5k-20k" id="vol3" />
                  <Label htmlFor="vol3">5 000€ - 20 000€</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="20k+" id="vol4" />
                  <Label htmlFor="vol4">Plus de 20 000€</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold">Optimisation IA Personnalisée</h3>
              <p className="text-muted-foreground">
                Sélectionnez les domaines où vous souhaitez que l'IA vous aide
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'product-research', name: 'Recherche de produits tendances', icon: TrendingUp },
                { id: 'price-optimization', name: 'Optimisation automatique des prix', icon: Target },
                { id: 'content-generation', name: 'Génération de contenu SEO', icon: Package },
                { id: 'competitive-analysis', name: 'Analyse concurrentielle', icon: Zap },
                { id: 'customer-insights', name: 'Insights client avancés', icon: CheckCircle },
                { id: 'inventory-prediction', name: 'Prédiction des stocks', icon: Package }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card 
                    key={item.id} 
                    className={`cursor-pointer transition-all ${
                      data.interests.includes(item.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => toggleArrayItem('interests', item.id)}
                  >
                    <CardContent className="flex items-center p-4">
                      <Checkbox
                        checked={data.interests.includes(item.id)}
                        className="mr-3"
                      />
                      <Icon className="h-5 w-5 mr-3 text-primary" />
                      <span className="font-medium">{item.name}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 text-center">
            <div className="mb-6">
              <Rocket className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Prêt à décoller ! 🚀</h3>
              <p className="text-muted-foreground">
                Votre compte est configuré. Nous avons préparé des recommandations personnalisées.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-primary/20">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">Produits IA</h4>
                  <p className="text-sm text-muted-foreground">
                    Recommandations basées sur vos objectifs
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/20">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">Automatisation</h4>
                  <p className="text-sm text-muted-foreground">
                    Processus optimisés pour votre profil
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/20">
                <CardContent className="p-4 text-center">
                  <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Insights personnalisés en temps réel
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <Label htmlFor="website" className="text-base font-medium">
                Site web (optionnel)
              </Label>
              <Input
                id="website"
                value={data.website}
                onChange={(e) => updateData('website', e.target.value)}
                placeholder="https://monstore.com"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline">
              Étape {currentStep + 1} sur {steps.length}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSkip}
              className="text-muted-foreground"
            >
              Passer
            </Button>
          </div>
          
          <Progress value={((currentStep + 1) / steps.length) * 100} className="mb-4" />
          
          <div className="flex items-center justify-center mb-2">
            {React.createElement(steps[currentStep].icon, { 
              className: "h-8 w-8 text-primary mr-2" 
            })}
            <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
          </div>
          <CardDescription className="text-base">
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          {renderStep()}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            <Button
              onClick={handleNext}
              className="flex items-center bg-primary hover:bg-primary/90"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Terminer
                </>
              ) : (
                <>
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}