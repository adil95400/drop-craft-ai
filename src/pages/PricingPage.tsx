import { SmartPlanSelector } from '@/components/plan/SmartPlanSelector';
import { UnifiedPlanProvider } from '@/components/plan/UnifiedPlanProvider';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Star, Users, Shield, Zap } from 'lucide-react';
export default function PricingPage() {
  return <UnifiedPlanProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6 mb-16">
            <h1 className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent ">
              Choisissez votre{' '}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                plan parfait
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Commencez gratuitement et évoluez avec nos plans Pro et Ultra Pro. 
              Toute la puissance de l'IA pour votre e-commerce.
            </p>
          </div>

          <SmartPlanSelector />
        </div>
      </div>
    </UnifiedPlanProvider>;
}