/**
 * Onboarding Step 3: Import Method Selection
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ArrowLeft, Upload, FileSpreadsheet, Link, Wand2 } from 'lucide-react';

const IMPORT_METHODS = [
  { id: 'csv', label: 'Import CSV/Excel', icon: FileSpreadsheet, desc: 'Importez votre catalogue depuis un fichier' },
  { id: 'url', label: 'Import par URL', icon: Link, desc: 'Importez depuis un lien produit (AliExpress, etc.)' },
  { id: 'api', label: 'Sync API', icon: Upload, desc: 'Synchronisez automatiquement via l\'API de votre boutique' },
  { id: 'ai', label: 'Recherche IA', icon: Wand2, desc: 'Trouvez des produits gagnants avec l\'intelligence artificielle' },
  { id: 'later', label: 'Plus tard', icon: Upload, desc: 'Je configurerai l\'import après' },
];

export default function OnboardingStepImport({ onSave }: { onSave: () => void }) {
  const { importMethod, setImportMethod, completeStep, nextStep, prevStep } = useOnboardingStore();
  const [method, setMethod] = useState(importMethod);

  const handleContinue = () => {
    setImportMethod(method);
    completeStep(3);
    onSave();
    nextStep();
  };

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Importez vos produits</CardTitle>
        <CardDescription className="text-base">
          Comment souhaitez-vous ajouter vos premiers produits ?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-2">
          {IMPORT_METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                method === m.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                method === m.id ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <m.icon className={`h-5 w-5 ${method === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-medium">{m.label}</p>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={prevStep} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button onClick={handleContinue} disabled={!method} className="flex-1">
            Continuer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
