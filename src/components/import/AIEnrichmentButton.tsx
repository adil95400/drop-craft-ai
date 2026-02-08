import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAIEnrichment } from '@/hooks/useAIEnrichment';

interface AIEnrichmentButtonProps {
  productIds: string[];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  onStarted?: (jobId: string) => void;
}

export function AIEnrichmentButton({
  productIds,
  variant = 'default',
  size = 'default',
  onStarted,
}: AIEnrichmentButtonProps) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState('fr');
  const [tone, setTone] = useState('professionnel');
  const { enrichProducts, isEnriching } = useAIEnrichment();

  const handleEnrich = async () => {
    const jobId = await enrichProducts(productIds, { language, tone });
    if (jobId) {
      setOpen(false);
      onStarted?.(jobId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} disabled={productIds.length === 0}>
          <Sparkles className="h-4 w-4 mr-2" />
          Enrichir avec l'IA ({productIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enrichissement IA
          </DialogTitle>
          <DialogDescription>
            L'IA va optimiser les titres, descriptions, catégories et métadonnées SEO de {productIds.length} produit(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Langue</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="nl">Nederlands</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ton</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professionnel">Professionnel</SelectItem>
                <SelectItem value="créatif">Créatif</SelectItem>
                <SelectItem value="luxe">Luxe / Premium</SelectItem>
                <SelectItem value="jeune">Jeune / Dynamique</SelectItem>
                <SelectItem value="technique">Technique / Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleEnrich} disabled={isEnriching}>
            {isEnriching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Lancer l'enrichissement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
