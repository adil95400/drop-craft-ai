import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Type, Image, Square, Columns, List, Link, MousePointerClick,
  Heading1, Heading2, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Palette, Save, Eye, Send, Copy,
  Trash2, GripVertical, Plus, Settings, Code, Smartphone, Monitor
} from 'lucide-react';

interface EmailBlock {
  id: string;
  type: 'header' | 'text' | 'image' | 'button' | 'columns' | 'divider' | 'spacer';
  content: Record<string, any>;
}

const blockTemplates = [
  { type: 'header', icon: Heading1, label: 'En-tête' },
  { type: 'text', icon: Type, label: 'Texte' },
  { type: 'image', icon: Image, label: 'Image' },
  { type: 'button', icon: MousePointerClick, label: 'Bouton' },
  { type: 'columns', icon: Columns, label: 'Colonnes' },
  { type: 'divider', icon: Square, label: 'Séparateur' },
  { type: 'spacer', icon: Square, label: 'Espacement' },
];

function BlockRenderer({ block, isSelected, onSelect, onDelete }: {
  block: EmailBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const renderBlockContent = () => {
    switch (block.type) {
      case 'header':
        return (
          <div className="text-center py-6 bg-gradient-to-r from-primary/10 to-primary/5">
            <h1 className="text-2xl font-bold">{block.content.title || 'Titre de l\'email'}</h1>
            {block.content.subtitle && (
              <p className="text-muted-foreground mt-2">{block.content.subtitle}</p>
            )}
          </div>
        );
      case 'text':
        return (
          <div className="py-4 px-6">
            <p className={cn(
              "text-foreground",
              block.content.align === 'center' && 'text-center',
              block.content.align === 'right' && 'text-right'
            )}>
              {block.content.text || 'Votre texte ici...'}
            </p>
          </div>
        );
      case 'image':
        return (
          <div className="py-4 px-6 text-center">
            {block.content.src ? (
              <img src={block.content.src} alt={block.content.alt || ''} className="max-w-full h-auto mx-auto rounded" />
            ) : (
              <div className="bg-muted h-40 flex items-center justify-center rounded">
                <Image className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        );
      case 'button':
        return (
          <div className="py-4 px-6 text-center">
            <Button className={block.content.variant || 'default'}>
              {block.content.text || 'Cliquez ici'}
            </Button>
          </div>
        );
      case 'columns':
        return (
          <div className="py-4 px-6 grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded text-center text-sm text-muted-foreground">
              Colonne 1
            </div>
            <div className="bg-muted/50 p-4 rounded text-center text-sm text-muted-foreground">
              Colonne 2
            </div>
          </div>
        );
      case 'divider':
        return <Separator className="my-4 mx-6" />;
      case 'spacer':
        return <div className="h-8" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "relative group cursor-pointer transition-all border-2 border-transparent",
        isSelected && "border-primary ring-2 ring-primary/20"
      )}
      onClick={onSelect}
    >
      {renderBlockContent()}
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button size="icon" variant="secondary" className="h-6 w-6">
          <GripVertical className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="destructive" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function EmailTemplateBuilder() {
  const [blocks, setBlocks] = useState<EmailBlock[]>([
    { id: '1', type: 'header', content: { title: 'Bienvenue !', subtitle: 'Découvrez nos nouveautés' } },
    { id: '2', type: 'text', content: { text: 'Bonjour {{first_name}},\n\nNous sommes ravis de vous présenter notre nouvelle collection.', align: 'left' } },
    { id: '3', type: 'image', content: { src: '', alt: 'Image produit' } },
    { id: '4', type: 'button', content: { text: 'Voir la collection', url: '#' } },
  ]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [emailSubject, setEmailSubject] = useState('Découvrez notre nouvelle collection !');

  const addBlock = (type: string) => {
    const newBlock: EmailBlock = {
      id: `block-${Date.now()}`,
      type: type as EmailBlock['type'],
      content: getDefaultContent(type),
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlock(newBlock.id);
    toast.success('Bloc ajouté');
  };

  const getDefaultContent = (type: string): Record<string, any> => {
    switch (type) {
      case 'header': return { title: 'Nouveau titre', subtitle: '' };
      case 'text': return { text: 'Votre texte ici...', align: 'left' };
      case 'image': return { src: '', alt: '' };
      case 'button': return { text: 'Cliquez ici', url: '#', variant: 'default' };
      case 'columns': return { columns: 2 };
      default: return {};
    }
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
    toast.success('Bloc supprimé');
  };

  const updateBlockContent = (id: string, content: Record<string, any>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content: { ...b.content, ...content } } : b));
  };

  const selectedBlockData = blocks.find(b => b.id === selectedBlock);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Éditeur d'Email</h2>
          <p className="text-muted-foreground">Créez des emails professionnels par glisser-déposer</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.success('Template sauvegardé')}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>
          <Button onClick={() => toast.success('Email envoyé en test')}>
            <Send className="h-4 w-4 mr-2" />
            Envoyer test
          </Button>
        </div>
      </div>

      {/* Subject line */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 items-center">
            <Label className="w-20 text-right">Objet:</Label>
            <Input 
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Objet de l'email..."
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Blocks palette */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Blocs</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-2">
              {blockTemplates.map((template) => (
                <Button
                  key={template.type}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => addBlock(template.type)}
                >
                  <template.icon className="h-5 w-5" />
                  <span className="text-xs">{template.label}</span>
                </Button>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Variables disponibles</Label>
              {['{{first_name}}', '{{last_name}}', '{{email}}', '{{order_id}}'].map(v => (
                <Badge 
                  key={v} 
                  variant="secondary" 
                  className="mr-1 cursor-pointer text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(v);
                    toast.success('Copié');
                  }}
                >
                  {v}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Aperçu</CardTitle>
              <div className="flex gap-1">
                <Button 
                  size="icon" 
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'} 
                  className="h-8 w-8"
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'} 
                  className="h-8 w-8"
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className={cn(
                "mx-auto bg-background border rounded-lg overflow-hidden",
                previewMode === 'desktop' ? 'max-w-full' : 'max-w-[375px]'
              )}>
                {blocks.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    isSelected={selectedBlock === block.id}
                    onSelect={() => setSelectedBlock(block.id)}
                    onDelete={() => deleteBlock(block.id)}
                  />
                ))}

                {blocks.length === 0 && (
                  <div className="py-20 text-center text-muted-foreground">
                    <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ajoutez des blocs depuis le panneau de gauche</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Properties panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Propriétés</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {selectedBlockData ? (
              <div className="space-y-4">
                <Badge>{selectedBlockData.type}</Badge>
                
                {selectedBlockData.type === 'header' && (
                  <>
                    <div>
                      <Label>Titre</Label>
                      <Input 
                        value={selectedBlockData.content.title || ''}
                        onChange={(e) => updateBlockContent(selectedBlockData.id, { title: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Sous-titre</Label>
                      <Input 
                        value={selectedBlockData.content.subtitle || ''}
                        onChange={(e) => updateBlockContent(selectedBlockData.id, { subtitle: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                {selectedBlockData.type === 'text' && (
                  <>
                    <div>
                      <Label>Texte</Label>
                      <Textarea 
                        value={selectedBlockData.content.text || ''}
                        onChange={(e) => updateBlockContent(selectedBlockData.id, { text: e.target.value })}
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Alignement</Label>
                      <div className="flex gap-1 mt-1">
                        {[
                          { value: 'left', icon: AlignLeft },
                          { value: 'center', icon: AlignCenter },
                          { value: 'right', icon: AlignRight },
                        ].map(({ value, icon: Icon }) => (
                          <Button
                            key={value}
                            size="icon"
                            variant={selectedBlockData.content.align === value ? 'default' : 'outline'}
                            onClick={() => updateBlockContent(selectedBlockData.id, { align: value })}
                          >
                            <Icon className="h-4 w-4" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedBlockData.type === 'button' && (
                  <>
                    <div>
                      <Label>Texte du bouton</Label>
                      <Input 
                        value={selectedBlockData.content.text || ''}
                        onChange={(e) => updateBlockContent(selectedBlockData.id, { text: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>URL</Label>
                      <Input 
                        value={selectedBlockData.content.url || ''}
                        onChange={(e) => updateBlockContent(selectedBlockData.id, { url: e.target.value })}
                        className="mt-1"
                        placeholder="https://..."
                      />
                    </div>
                  </>
                )}

                {selectedBlockData.type === 'image' && (
                  <>
                    <div>
                      <Label>URL de l'image</Label>
                      <Input 
                        value={selectedBlockData.content.src || ''}
                        onChange={(e) => updateBlockContent(selectedBlockData.id, { src: e.target.value })}
                        className="mt-1"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Texte alternatif</Label>
                      <Input 
                        value={selectedBlockData.content.alt || ''}
                        onChange={(e) => updateBlockContent(selectedBlockData.id, { alt: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sélectionnez un bloc</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
