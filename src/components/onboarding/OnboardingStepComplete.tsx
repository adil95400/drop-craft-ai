/**
 * Onboarding Step 4: Completion & Redirect
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { CheckCircle2, ArrowRight, LayoutDashboard, Upload, BarChart3 } from 'lucide-react';

const NEXT_ACTIONS = [
  { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, desc: 'Vue d\'ensemble de votre activité' },
  { path: '/import', label: 'Importer des produits', icon: Upload, desc: 'Ajoutez vos premiers produits' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, desc: 'Suivez vos performances' },
];

export default function OnboardingStepComplete({ onSave }: { onSave: () => void }) {
  const { businessName, storePlatform, importMethod, completeOnboarding, completeStep } = useOnboardingStore();
  const navigate = useNavigate();

  const handleFinish = (path: string) => {
    completeStep(4);
    completeOnboarding();
    onSave();
    setTimeout(() => navigate(path, { replace: true }), 200);
  };

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Vous êtes prêt ! 🎉</CardTitle>
        <CardDescription className="text-base">
          {businessName ? `${businessName} est configuré` : 'Votre boutique est configurée'}. 
          Par où souhaitez-vous commencer ?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Summary */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Boutique</span>
            <span className="font-medium">{businessName || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plateforme</span>
            <span className="font-medium capitalize">{storePlatform || 'Aucune'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Import</span>
            <span className="font-medium capitalize">{importMethod || 'Plus tard'}</span>
          </div>
        </div>

        {/* Next actions */}
        <div className="space-y-2">
          {NEXT_ACTIONS.map((action) => (
            <button
              key={action.path}
              onClick={() => handleFinish(action.path)}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10">
                  <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{action.label}</p>
                  <p className="text-sm text-muted-foreground">{action.desc}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
