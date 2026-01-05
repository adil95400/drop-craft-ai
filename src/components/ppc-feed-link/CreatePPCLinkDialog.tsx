/**
 * Create/Edit PPC Link Dialog
 */
import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreatePPCFeedLink, useUpdatePPCFeedLink, usePlatformOptions, useFrequencyOptions } from '@/hooks/usePPCFeedLink';
import { PPCFeedLink } from '@/services/PPCFeedLinkService';

interface CreatePPCLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editLink?: PPCFeedLink | null;
  onClose?: () => void;
}

export function CreatePPCLinkDialog({ open, onOpenChange, editLink, onClose }: CreatePPCLinkDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<string>('google_ads');
  const [syncFrequency, setSyncFrequency] = useState<string>('daily');

  const createLink = useCreatePPCFeedLink();
  const updateLink = useUpdatePPCFeedLink();
  const platformOptions = usePlatformOptions();
  const frequencyOptions = useFrequencyOptions();

  useEffect(() => {
    if (editLink) {
      setName(editLink.name);
      setDescription(editLink.description || '');
      setPlatform(editLink.platform);
      setSyncFrequency(editLink.sync_frequency);
    } else {
      resetForm();
    }
  }, [editLink]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPlatform('google_ads');
    setSyncFrequency('daily');
  };

  const handleClose = () => {
    onOpenChange(false);
    onClose?.();
    resetForm();
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    if (editLink) {
      await updateLink.mutateAsync({
        linkId: editLink.id,
        updates: {
          name,
          description,
          sync_frequency: syncFrequency as PPCFeedLink['sync_frequency'],
        },
      });
    } else {
      await createLink.mutateAsync({
        name,
        description,
        platform: platform as PPCFeedLink['platform'],
        sync_frequency: syncFrequency as PPCFeedLink['sync_frequency'],
      });
    }

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editLink ? 'Modifier la liaison' : 'Nouvelle liaison PPC'}</DialogTitle>
          <DialogDescription>
            Connectez un flux produit à une plateforme publicitaire
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Nom de la liaison</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Google Shopping - France"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la liaison..."
              rows={2}
            />
          </div>

          {!editLink && (
            <div>
              <Label>Plateforme publicitaire</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Fréquence de synchronisation</Label>
            <Select value={syncFrequency} onValueChange={setSyncFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!name.trim() || createLink.isPending || updateLink.isPending}
          >
            {editLink ? 'Mettre à jour' : 'Créer la liaison'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
