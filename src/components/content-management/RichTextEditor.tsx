import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import {
  Bold, Italic, Underline, List, ListOrdered, Link, Image,
  AlignLeft, AlignCenter, AlignRight, Quote, Code, Heading1,
  Heading2, Heading3, Undo, Redo, Sparkles
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  onAIAssist?: () => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Commencez à écrire...',
  minHeight = '300px',
  onAIAssist
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const getSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return { start: 0, end: 0, text: '' };
    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      text: value.substring(textarea.selectionStart, textarea.selectionEnd)
    };
  }, [value]);

  const insertText = useCallback((before: string, after: string = '') => {
    const { start, end, text } = getSelection();
    const newValue = value.substring(0, start) + before + text + after + value.substring(end);
    onChange(newValue);
    
    // Update history
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newValue]);
    setHistoryIndex(prev => prev + 1);
  }, [value, onChange, getSelection, historyIndex]);

  const wrapSelection = useCallback((wrapper: string) => {
    const { start, end, text } = getSelection();
    if (!text) return;
    const newValue = value.substring(0, start) + wrapper + text + wrapper + value.substring(end);
    onChange(newValue);
    
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newValue]);
    setHistoryIndex(prev => prev + 1);
  }, [value, onChange, getSelection, historyIndex]);

  const insertAtLineStart = useCallback((prefix: string) => {
    const { start } = getSelection();
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    onChange(newValue);
    
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newValue]);
    setHistoryIndex(prev => prev + 1);
  }, [value, onChange, getSelection, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      onChange(history[historyIndex - 1]);
    }
  }, [historyIndex, history, onChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      onChange(history[historyIndex + 1]);
    }
  }, [historyIndex, history, onChange]);

  const insertLink = useCallback(() => {
    if (!linkUrl) return;
    const text = linkText || linkUrl;
    insertText(`[${text}](${linkUrl})`);
    setLinkUrl('');
    setLinkText('');
  }, [linkUrl, linkText, insertText]);

  const insertImage = useCallback(() => {
    if (!imageUrl) return;
    insertText(`![${imageAlt || 'Image'}](${imageUrl})`);
    setImageUrl('');
    setImageAlt('');
  }, [imageUrl, imageAlt, insertText]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Debounce history updates
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newValue]);
    setHistoryIndex(prev => prev + 1);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <TooltipProvider>
        <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/50 border-b">
          {/* Text formatting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle size="sm" onClick={() => wrapSelection('**')}>
                <Bold className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Gras (Ctrl+B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle size="sm" onClick={() => wrapSelection('*')}>
                <Italic className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Italique (Ctrl+I)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle size="sm" onClick={() => wrapSelection('__')}>
                <Underline className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Souligné</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle size="sm" onClick={() => insertAtLineStart('# ')}>
                <Heading1 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Titre 1</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle size="sm" onClick={() => insertAtLineStart('## ')}>
                <Heading2 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Titre 2</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle size="sm" onClick={() => insertAtLineStart('### ')}>
                <Heading3 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Titre 3</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle size="sm" onClick={() => insertAtLineStart('- ')}>
                <List className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Liste à puces</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle size="sm" onClick={() => insertAtLineStart('1. ')}>
                <ListOrdered className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Liste numérotée</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle size="sm" onClick={() => insertAtLineStart('> ')}>
                <Quote className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Citation</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle size="sm" onClick={() => wrapSelection('`')}>
                <Code className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Code inline</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Link */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Toggle size="sm">
                    <Link className="h-4 w-4" />
                  </Toggle>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Insérer un lien</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Texte du lien</Label>
                  <Input
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Texte affiché"
                  />
                </div>
                <div className="space-y-1">
                  <Label>URL</Label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <Button size="sm" onClick={insertLink} className="w-full">
                  Insérer
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Image */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Toggle size="sm">
                    <Image className="h-4 w-4" />
                  </Toggle>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Insérer une image</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>URL de l'image</Label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Texte alternatif</Label>
                  <Input
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Description de l'image"
                  />
                </div>
                <Button size="sm" onClick={insertImage} className="w-full">
                  Insérer
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex === 0}
                className="h-8 w-8 p-0"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Annuler</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                className="h-8 w-8 p-0"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rétablir</TooltipContent>
          </Tooltip>

          {onAIAssist && (
            <>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAIAssist}
                    className="gap-2 bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    Assistance IA
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Générer ou améliorer avec l'IA</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </TooltipProvider>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="border-0 rounded-none focus-visible:ring-0 resize-none font-mono text-sm"
        style={{ minHeight }}
      />

      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t text-xs text-muted-foreground">
        <span>{value.length} caractères</span>
        <span>{value.split(/\s+/).filter(Boolean).length} mots</span>
      </div>
    </div>
  );
}
