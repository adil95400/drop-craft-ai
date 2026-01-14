/**
 * Create Mapping Dialog - Enhanced Channable-style
 */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCreateCategoryMapping } from '@/hooks/useCategoryMapping';
import { 
  Truck, 
  FileUp, 
  Edit3, 
  ShoppingBag, 
  Chrome, 
  Facebook, 
  Settings,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Info,
  Loader2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CreateMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SourceType = 'supplier' | 'import' | 'manual';
type DestinationType = 'google' | 'facebook' | 'shopify' | 'custom';

interface SourceOption {
  value: SourceType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface DestinationOption {
  value: DestinationType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: string;
}

const sourceOptions: SourceOption[] = [
  { 
    value: 'supplier', 
    label: 'Fournisseur', 
    description: 'Importer depuis un flux fournisseur',
    icon: Truck,
    color: 'bg-blue-500/10 border-blue-500/30 text-blue-600 hover:bg-blue-500/20'
  },
  { 
    value: 'import', 
    label: 'Import fichier', 
    description: 'CSV, XML ou autre fichier',
    icon: FileUp,
    color: 'bg-purple-500/10 border-purple-500/30 text-purple-600 hover:bg-purple-500/20'
  },
  { 
    value: 'manual', 
    label: 'Manuel', 
    description: 'Créer les règles manuellement',
    icon: Edit3,
    color: 'bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/20'
  },
];

const destinationOptions: DestinationOption[] = [
  { 
    value: 'google', 
    label: 'Google Shopping', 
    description: 'Taxonomie Google Product Category',
    icon: Chrome,
    color: 'bg-red-500/10 border-red-500/30 text-red-600 hover:bg-red-500/20',
    badge: 'Populaire'
  },
  { 
    value: 'facebook', 
    label: 'Facebook / Meta', 
    description: 'Catégories Meta Commerce',
    icon: Facebook,
    color: 'bg-blue-600/10 border-blue-600/30 text-blue-700 hover:bg-blue-600/20'
  },
  { 
    value: 'shopify', 
    label: 'Shopify', 
    description: 'Collections et catégories Shopify',
    icon: ShoppingBag,
    color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20'
  },
  { 
    value: 'custom', 
    label: 'Personnalisé', 
    description: 'Définir votre propre taxonomie',
    icon: Settings,
    color: 'bg-gray-500/10 border-gray-500/30 text-gray-600 hover:bg-gray-500/20'
  },
];

export function CreateMappingDialog({ open, onOpenChange }: CreateMappingDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('manual');
  const [destinationType, setDestinationType] = useState<DestinationType>('google');
  const [defaultCategory, setDefaultCategory] = useState('');
  const [autoMapEnabled, setAutoMapEnabled] = useState(true);

  const createMapping = useCreateCategoryMapping();

  const resetForm = () => {
    setStep(1);
    setName('');
    setDescription('');
    setSourceType('manual');
    setDestinationType('google');
    setDefaultCategory('');
    setAutoMapEnabled(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    await createMapping.mutateAsync({
      name,
      description,
      source_type: sourceType,
      destination_type: destinationType,
      default_category: defaultCategory || undefined,
      auto_map_enabled: autoMapEnabled,
    });

    handleClose();
  };

  const selectedSource = sourceOptions.find(s => s.value === sourceType);
  const selectedDestination = destinationOptions.find(d => d.value === destinationType);

  const canProceed = step === 1 ? true : name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Nouveau mapping de catégories
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'Sélectionnez la source et la destination de votre mapping'
              : 'Configurez les détails de votre mapping'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 py-2">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
            step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
          </div>
          <div className={cn(
            "flex-1 h-1 rounded-full transition-colors",
            step >= 2 ? "bg-primary" : "bg-muted"
          )} />
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
            step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            2
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-6 py-4">
            {/* Source Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                Source des catégories
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">D'où proviennent vos catégories à mapper</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {sourceOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = sourceType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSourceType(option.value)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                        isSelected 
                          ? cn(option.color, "border-current ring-2 ring-current/20") 
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        isSelected ? option.color : "bg-muted"
                      )}>
                        <Icon className={cn("h-6 w-6", isSelected ? "" : "text-muted-foreground")} />
                      </div>
                      <span className="font-medium text-sm">{option.label}</span>
                      <span className="text-xs text-muted-foreground text-center leading-tight">
                        {option.description}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-px w-12 bg-border" />
                <ArrowRight className="h-5 w-5" />
                <div className="h-px w-12 bg-border" />
              </div>
            </div>

            {/* Destination Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                Destination
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Où vos catégories seront utilisées</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {destinationOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = destinationType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDestinationType(option.value)}
                      className={cn(
                        "relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                        isSelected 
                          ? cn(option.color, "border-current ring-2 ring-current/20") 
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        isSelected ? option.color : "bg-muted"
                      )}>
                        <Icon className={cn("h-6 w-6", isSelected ? "" : "text-muted-foreground")} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.label}</span>
                          {option.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {option.badge}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {option.description}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-xl">
              {selectedSource && (
                <div className="flex items-center gap-2">
                  <selectedSource.icon className="h-5 w-5" />
                  <span className="font-medium">{selectedSource.label}</span>
                </div>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              {selectedDestination && (
                <div className="flex items-center gap-2">
                  <selectedDestination.icon className="h-5 w-5" />
                  <span className="font-medium">{selectedDestination.label}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                Nom du mapping <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Ex: ${selectedSource?.label} → ${selectedDestination?.label}`}
                className="h-11"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                Description
                <Badge variant="outline" className="text-xs font-normal">Optionnel</Badge>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'objectif de ce mapping..."
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Default Category */}
            <div className="space-y-2">
              <Label htmlFor="default" className="flex items-center gap-2">
                Catégorie par défaut
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Catégorie utilisée quand aucune règle ne correspond</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Badge variant="outline" className="text-xs font-normal">Optionnel</Badge>
              </Label>
              <Input
                id="default"
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                placeholder="Ex: 5000 - Vêtements & Accessoires"
                className="h-11"
              />
            </div>

            {/* Auto-mapping */}
            <div className="flex items-start justify-between gap-4 p-4 border rounded-xl bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    Auto-mapping IA
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Nouveau</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    L'IA suggère automatiquement les correspondances basées sur les noms de catégories
                  </p>
                </div>
              </div>
              <Switch
                checked={autoMapEnabled}
                onCheckedChange={setAutoMapEnabled}
                className="shrink-0"
              />
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted/50 rounded-xl space-y-2">
              <p className="text-sm font-medium">Résumé du mapping</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  {selectedSource && <selectedSource.icon className="h-3 w-3" />}
                  {selectedSource?.label}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground self-center" />
                <Badge variant="secondary" className="gap-1">
                  {selectedDestination && <selectedDestination.icon className="h-3 w-3" />}
                  {selectedDestination?.label}
                </Badge>
                {autoMapEnabled && (
                  <Badge className="gap-1 bg-primary/20 text-primary">
                    <Sparkles className="h-3 w-3" />
                    IA activée
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-2">
          {step === 2 ? (
            <Button variant="ghost" onClick={handleBack}>
              ← Retour
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
          )}
          
          <div className="flex gap-2">
            {step === 1 ? (
              <Button onClick={handleNext}>
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!canProceed || createMapping.isPending}
                >
                  {createMapping.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Créer le mapping
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
