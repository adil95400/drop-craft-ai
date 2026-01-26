import { useState } from 'react';
import { Plus, GitBranch, Filter, Code, Mail, Globe, Database, Clock, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface StepType {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  description: string;
}

const STEP_TYPES: StepType[] = [
  { value: 'conditional', label: 'Condition IF/THEN', icon: GitBranch, category: 'logic', description: 'Branche conditionnelle' },
  { value: 'filter', label: 'Filtre', icon: Filter, category: 'logic', description: 'Filtre les données' },
  { value: 'transform_data', label: 'Transformer', icon: Code, category: 'data', description: 'Transforme les données' },
  { value: 'send_email', label: 'Envoyer Email', icon: Mail, category: 'action', description: 'Envoie un email' },
  { value: 'http_request', label: 'Requête HTTP', icon: Globe, category: 'action', description: 'Appel API externe' },
  { value: 'database_insert', label: 'Insérer en BDD', icon: Database, category: 'data', description: 'Insère des données' },
  { value: 'database_update', label: 'Mise à jour BDD', icon: Database, category: 'data', description: 'Met à jour des données' },
  { value: 'delay', label: 'Délai', icon: Clock, category: 'control', description: 'Pause avant la suite' },
  { value: 'notification', label: 'Notification', icon: Bell, category: 'action', description: 'Envoie une notification' },
];

const CATEGORIES = [
  { id: 'logic', label: 'Logique', color: 'bg-blue-500' },
  { id: 'action', label: 'Actions', color: 'bg-green-500' },
  { id: 'data', label: 'Données', color: 'bg-purple-500' },
  { id: 'control', label: 'Contrôle', color: 'bg-orange-500' },
];

interface MobileStepsPaletteProps {
  onAddStep: (stepType: string) => void;
}

export function MobileStepsPalette({ onAddStep }: MobileStepsPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleAddStep = (stepType: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onAddStep(stepType);
    setIsOpen(false);
    setSelectedCategory(null);
  };

  const filteredSteps = selectedCategory
    ? STEP_TYPES.filter(s => s.category === selectedCategory)
    : STEP_TYPES;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:hidden"
          aria-label="Ajouter une étape"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Ajouter une étape</SheetTitle>
        </SheetHeader>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-2 px-2 touch-pan-x">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            className="shrink-0 h-9"
            onClick={() => setSelectedCategory(null)}
          >
            Tout
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              className="shrink-0 h-9"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className={cn('w-2 h-2 rounded-full mr-2', cat.color)} />
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Steps Grid */}
        <ScrollArea className="h-[calc(100%-120px)]">
          <div className="grid grid-cols-2 gap-3 pb-safe">
            {filteredSteps.map((stepType) => {
              const Icon = stepType.icon;
              const category = CATEGORIES.find(c => c.id === stepType.category);
              
              return (
                <button
                  key={stepType.value}
                  type="button"
                  onClick={() => handleAddStep(stepType.value)}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed',
                    'min-h-[100px] transition-all duration-200',
                    'hover:border-primary hover:bg-primary/5',
                    'active:scale-95 touch-manipulation'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-lg mb-2',
                    category?.color.replace('bg-', 'bg-opacity-20 ') || 'bg-muted'
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-center">
                    {stepType.label}
                  </span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    {stepType.description}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
