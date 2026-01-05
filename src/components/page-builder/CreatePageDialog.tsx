/**
 * Create Page Dialog
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateLandingPage } from '@/hooks/useLandingPages';
import { Plus, Loader2, Layout } from 'lucide-react';

interface CreatePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_TYPES = [
  { value: 'landing', label: 'Landing Page', description: 'Page de vente classique' },
  { value: 'product', label: 'Page Produit', description: 'Présentation d\'un produit' },
  { value: 'promo', label: 'Promotion', description: 'Offre spéciale / Vente flash' },
  { value: 'lead', label: 'Capture de Leads', description: 'Formulaire de contact' },
];

export function CreatePageDialog({ open, onOpenChange }: CreatePageDialogProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    page_type: 'landing'
  });

  const createMutation = useCreateLandingPage();

  const handleSubmit = () => {
    if (!formData.title) return;

    createMutation.mutate(formData, {
      onSuccess: (page) => {
        onOpenChange(false);
        setFormData({ title: '', description: '', page_type: 'landing' });
        navigate(`/page-builder/${page.id}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Nouvelle Page
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle landing page avec notre éditeur drag-and-drop
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Titre de la page *</Label>
            <Input
              placeholder="Ex: Page de vente - Nouveau Produit"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <Label>Type de page</Label>
            <Select
              value={formData.page_type}
              onValueChange={(v) => setFormData({ ...formData, page_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description (optionnel)</Label>
            <Textarea
              placeholder="Description interne de la page..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending || !formData.title}>
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Créer et éditer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
