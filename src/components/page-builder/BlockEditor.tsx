/**
 * Block Editor - Panneau d'édition des propriétés
 */
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageBlock } from '@/services/LandingPageService';
import { X, Plus, Trash2 } from 'lucide-react';

interface BlockEditorProps {
  block: PageBlock;
  onUpdate: (props: Record<string, any>) => void;
  onClose: () => void;
}

export function BlockEditor({ block, onUpdate, onClose }: BlockEditorProps) {
  const updateProp = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  const renderEditor = () => {
    switch (block.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={block.props.title || ''}
                onChange={(e) => updateProp('title', e.target.value)}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Textarea
                value={block.props.subtitle || ''}
                onChange={(e) => updateProp('subtitle', e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Texte du bouton</Label>
              <Input
                value={block.props.buttonText || ''}
                onChange={(e) => updateProp('buttonText', e.target.value)}
              />
            </div>
            <div>
              <Label>URL du bouton</Label>
              <Input
                value={block.props.buttonUrl || ''}
                onChange={(e) => updateProp('buttonUrl', e.target.value)}
              />
            </div>
            <div>
              <Label>Alignement</Label>
              <Select
                value={block.props.alignment || 'center'}
                onValueChange={(v) => updateProp('alignment', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Gauche</SelectItem>
                  <SelectItem value="center">Centre</SelectItem>
                  <SelectItem value="right">Droite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={block.props.title || ''}
                onChange={(e) => updateProp('title', e.target.value)}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Textarea
                value={block.props.subtitle || ''}
                onChange={(e) => updateProp('subtitle', e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Texte du bouton</Label>
              <Input
                value={block.props.buttonText || ''}
                onChange={(e) => updateProp('buttonText', e.target.value)}
              />
            </div>
            <div>
              <Label>URL du bouton</Label>
              <Input
                value={block.props.buttonUrl || ''}
                onChange={(e) => updateProp('buttonUrl', e.target.value)}
              />
            </div>
            <div>
              <Label>Variante</Label>
              <Select
                value={block.props.variant || 'primary'}
                onValueChange={(v) => updateProp('variant', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Principal</SelectItem>
                  <SelectItem value="secondary">Secondaire</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>Contenu</Label>
              <Textarea
                value={block.props.content?.replace(/<[^>]*>/g, '') || ''}
                onChange={(e) => updateProp('content', `<p>${e.target.value}</p>`)}
                rows={6}
              />
            </div>
            <div>
              <Label>Alignement</Label>
              <Select
                value={block.props.alignment || 'left'}
                onValueChange={(v) => updateProp('alignment', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Gauche</SelectItem>
                  <SelectItem value="center">Centre</SelectItem>
                  <SelectItem value="right">Droite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label>URL de l'image</Label>
              <Input
                value={block.props.src || ''}
                onChange={(e) => updateProp('src', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Texte alternatif</Label>
              <Input
                value={block.props.alt || ''}
                onChange={(e) => updateProp('alt', e.target.value)}
              />
            </div>
            <div>
              <Label>Légende</Label>
              <Input
                value={block.props.caption || ''}
                onChange={(e) => updateProp('caption', e.target.value)}
              />
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <Label>URL de la vidéo</Label>
              <Input
                value={block.props.url || ''}
                onChange={(e) => updateProp('url', e.target.value)}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div>
              <Label>Plateforme</Label>
              <Select
                value={block.props.provider || 'youtube'}
                onValueChange={(v) => updateProp('provider', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Lecture automatique</Label>
              <Switch
                checked={block.props.autoplay || false}
                onCheckedChange={(v) => updateProp('autoplay', v)}
              />
            </div>
          </div>
        );

      case 'countdown':
        return (
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={block.props.title || ''}
                onChange={(e) => updateProp('title', e.target.value)}
              />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input
                type="datetime-local"
                value={block.props.endDate?.slice(0, 16) || ''}
                onChange={(e) => updateProp('endDate', new Date(e.target.value).toISOString())}
              />
            </div>
            <div>
              <Label>Message après expiration</Label>
              <Input
                value={block.props.expiredMessage || ''}
                onChange={(e) => updateProp('expiredMessage', e.target.value)}
              />
            </div>
          </div>
        );

      case 'features':
      case 'benefits':
      case 'testimonials':
      case 'faq':
        return (
          <div className="space-y-4">
            <div>
              <Label>Titre de la section</Label>
              <Input
                value={block.props.title || ''}
                onChange={(e) => updateProp('title', e.target.value)}
              />
            </div>
            <div>
              <Label>Éléments</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {(block.props.items || []).length} élément(s)
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Gérer les éléments
              </Button>
            </div>
          </div>
        );

      case 'form':
        return (
          <div className="space-y-4">
            <div>
              <Label>Titre du formulaire</Label>
              <Input
                value={block.props.title || ''}
                onChange={(e) => updateProp('title', e.target.value)}
              />
            </div>
            <div>
              <Label>Texte du bouton</Label>
              <Input
                value={block.props.buttonText || ''}
                onChange={(e) => updateProp('buttonText', e.target.value)}
              />
            </div>
            <div>
              <Label>Message de succès</Label>
              <Textarea
                value={block.props.successMessage || ''}
                onChange={(e) => updateProp('successMessage', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-4">
            <div>
              <Label>Titre de la section</Label>
              <Input
                value={block.props.title || ''}
                onChange={(e) => updateProp('title', e.target.value)}
              />
            </div>
            <div>
              <Label>Plans tarifaires</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {(block.props.plans || []).length} plan(s)
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Gérer les plans
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <p className="text-sm text-muted-foreground">
            Éditeur non disponible pour ce type de bloc
          </p>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Propriétés</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        {renderEditor()}
      </ScrollArea>
    </div>
  );
}
