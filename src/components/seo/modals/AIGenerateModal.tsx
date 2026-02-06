/**
 * AIGenerateModal — Refactoré sur BaseModal (socle)
 */
import { memo, useState, useCallback } from 'react';
import { BaseModal } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2 } from 'lucide-react';

interface AIGenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (params: { type: string; page_id?: string; language: string; tone: string; keywords: string[]; variants: number }) => void;
  isGenerating: boolean;
  selectedPageId: string | null;
}

function AIGenerateModalComponent({ open, onOpenChange, onGenerate, isGenerating, selectedPageId }: AIGenerateModalProps) {
  const [type, setType] = useState('meta_description');
  const [language, setLanguage] = useState('fr');
  const [tone, setTone] = useState('professional');
  const [keywords, setKeywords] = useState('');

  const handleGenerate = useCallback(() => {
    onGenerate({
      type, page_id: selectedPageId || undefined, language, tone,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      variants: 3,
    });
    onOpenChange(false);
  }, [type, selectedPageId, language, tone, keywords, onGenerate, onOpenChange]);

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Générer du contenu SEO"
      description="Génération automatique via intelligence artificielle"
      primaryLabel="Générer"
      primaryIcon={<Wand2 className="h-4 w-4" />}
      onPrimary={handleGenerate}
      primaryLoading={isGenerating}
    >
      <div className="space-y-1.5">
        <Label>Type de contenu</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="meta_description">Meta Description</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="h1">H1</SelectItem>
            <SelectItem value="alt_text">Textes Alt</SelectItem>
            <SelectItem value="faq">FAQ</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Langue</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Ton</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professionnel</SelectItem>
              <SelectItem value="casual">Décontracté</SelectItem>
              <SelectItem value="persuasive">Persuasif</SelectItem>
              <SelectItem value="informative">Informatif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Mots-clés</Label>
        <Input placeholder="chaussure, cuir, artisanal…" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="h-10" />
        <p className="text-xs text-muted-foreground">Séparez par des virgules</p>
      </div>
    </BaseModal>
  );
}

export const AIGenerateModal = memo(AIGenerateModalComponent);
