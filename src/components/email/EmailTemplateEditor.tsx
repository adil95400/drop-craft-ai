import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, Code, Palette, Layout, Type, Image, Link2, 
  Undo, Redo, Save, Copy, Smartphone, Monitor, Tablet,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Heading1, Heading2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplateEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  onCancel?: () => void;
}

const VARIABLES = [
  { key: '{{name}}', label: 'Nom client' },
  { key: '{{email}}', label: 'Email client' },
  { key: '{{order_id}}', label: 'N° commande' },
  { key: '{{order_total}}', label: 'Total commande' },
  { key: '{{product_name}}', label: 'Nom produit' },
  { key: '{{tracking_url}}', label: 'URL suivi' },
  { key: '{{company}}', label: 'Nom entreprise' },
  { key: '{{date}}', label: 'Date du jour' },
  { key: '{{cta_link}}', label: 'Lien CTA' },
];

const COLOR_PRESETS = [
  { name: 'Bleu Pro', primary: '#3b82f6', secondary: '#1d4ed8', bg: '#f8fafc' },
  { name: 'Vert Nature', primary: '#22c55e', secondary: '#16a34a', bg: '#f0fdf4' },
  { name: 'Orange Énergie', primary: '#f97316', secondary: '#ea580c', bg: '#fff7ed' },
  { name: 'Violet Luxe', primary: '#8b5cf6', secondary: '#7c3aed', bg: '#faf5ff' },
  { name: 'Rose Moderne', primary: '#ec4899', secondary: '#db2777', bg: '#fdf2f8' },
  { name: 'Sombre', primary: '#1f2937', secondary: '#111827', bg: '#f9fafb' },
];

const LAYOUT_TEMPLATES = [
  { id: 'simple', name: 'Simple', description: 'Email minimaliste avec texte' },
  { id: 'hero', name: 'Hero Image', description: 'Grande image en haut' },
  { id: 'sidebar', name: 'Sidebar', description: 'Contenu avec barre latérale' },
  { id: 'cards', name: 'Cartes', description: 'Produits en grille' },
  { id: 'newsletter', name: 'Newsletter', description: 'Format blog/article' },
];

export function EmailTemplateEditor({ initialContent, onSave, onCancel }: EmailTemplateEditorProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'design' | 'code'>('design');
  const [history, setHistory] = useState<string[]>([initialContent || '']);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [content, setContent] = useState(initialContent || getDefaultTemplate());
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  
  function getDefaultTemplate() {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .content h2 { color: #333; margin-top: 0; }
    .content p { color: #666; line-height: 1.6; }
    .cta-button { display: inline-block; background: #3b82f6; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee; }
    .footer p { color: #999; font-size: 12px; margin: 5px 0; }
    .social-links { margin-top: 15px; }
    .social-links a { display: inline-block; margin: 0 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{company}}</h1>
    </div>
    <div class="content">
      <h2>Bonjour {{name}},</h2>
      <p>Merci pour votre confiance. Nous sommes ravis de vous compter parmi nos clients.</p>
      <p>Votre commande <strong>#{{order_id}}</strong> a bien été reçue et est en cours de traitement.</p>
      <a href="{{cta_link}}" class="cta-button">Suivre ma commande</a>
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      <p>Cordialement,<br>L'équipe {{company}}</p>
    </div>
    <div class="footer">
      <p>© 2024 {{company}}. Tous droits réservés.</p>
      <p>Vous recevez cet email car vous êtes inscrit sur notre site.</p>
      <div class="social-links">
        <a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">Instagram</a>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setContent(history[historyIndex + 1]);
    }
  };

  const insertVariable = (variable: string) => {
    // Insert at cursor or append
    const textarea = document.querySelector('textarea#html-code') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + variable + content.substring(end);
      handleContentChange(newContent);
    } else {
      handleContentChange(content + variable);
    }
    toast({ title: "Variable insérée", description: variable });
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setSelectedColor(preset);
    let newContent = content;
    // Replace primary colors
    newContent = newContent.replace(/#3b82f6/g, preset.primary);
    newContent = newContent.replace(/#1d4ed8/g, preset.secondary);
    newContent = newContent.replace(/background-color: #f4f4f4/g, `background-color: ${preset.bg}`);
    handleContentChange(newContent);
    toast({ title: "Thème appliqué", description: preset.name });
  };

  const handleSave = () => {
    onSave?.(content);
    toast({ title: "Template sauvegardé" });
  };

  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  const getPreviewWithVariables = () => {
    let preview = content;
    preview = preview.replace(/\{\{name\}\}/g, 'Jean Dupont');
    preview = preview.replace(/\{\{email\}\}/g, 'jean.dupont@email.com');
    preview = preview.replace(/\{\{order_id\}\}/g, 'ORD-2024-1234');
    preview = preview.replace(/\{\{order_total\}\}/g, '149.99 €');
    preview = preview.replace(/\{\{product_name\}\}/g, 'Produit Premium');
    preview = preview.replace(/\{\{tracking_url\}\}/g, 'https://suivi.example.com/xyz');
    preview = preview.replace(/\{\{company\}\}/g, 'ShopOpti Pro');
    preview = preview.replace(/\{\{date\}\}/g, new Date().toLocaleDateString('fr-FR'));
    preview = preview.replace(/\{\{cta_link\}\}/g, '#');
    preview = preview.replace(/\{\{subject\}\}/g, 'Confirmation de commande');
    return preview;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex gap-1 border rounded-lg p-1">
            <Button 
              variant={viewMode === 'desktop' ? 'secondary' : 'ghost'} 
              size="icon"
              onClick={() => setViewMode('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'tablet' ? 'secondary' : 'ghost'} 
              size="icon"
              onClick={() => setViewMode('tablet')}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'mobile' ? 'secondary' : 'ghost'} 
              size="icon"
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="design">
                <Palette className="h-4 w-4 mr-2" />
                Design
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code className="h-4 w-4 mr-2" />
                Code
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>Annuler</Button>
          )}
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r bg-background overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Variables */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Type className="h-4 w-4" />
                Variables dynamiques
              </h4>
              <div className="flex flex-wrap gap-2">
                {VARIABLES.map((v) => (
                  <Badge 
                    key={v.key}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => insertVariable(v.key)}
                  >
                    {v.label}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Color Presets */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Thèmes de couleurs
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyColorPreset(preset)}
                    className={`p-2 rounded-lg border text-left transition-all hover:border-primary ${
                      selectedColor.name === preset.name ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <div className="flex gap-1 mb-1">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: preset.primary }} 
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: preset.secondary }} 
                      />
                    </div>
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Layout Templates */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Modèles de mise en page
              </h4>
              <div className="space-y-2">
                {LAYOUT_TEMPLATES.map((layout) => (
                  <button
                    key={layout.id}
                    className="w-full p-3 rounded-lg border text-left hover:border-primary transition-colors"
                  >
                    <div className="font-medium text-sm">{layout.name}</div>
                    <div className="text-xs text-muted-foreground">{layout.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {activeTab === 'code' ? (
            <div className="flex-1 p-4">
              <Textarea
                id="html-code"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full font-mono text-sm resize-none"
                placeholder="Code HTML de votre email..."
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/30 p-6 overflow-auto">
              <div 
                className="bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300"
                style={{ width: getPreviewWidth(), maxWidth: '100%' }}
              >
                <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-muted-foreground flex-1 text-center">
                    Aperçu email - {viewMode}
                  </span>
                </div>
                <iframe
                  srcDoc={getPreviewWithVariables()}
                  className="w-full border-0"
                  style={{ height: '600px' }}
                  title="Email Preview"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
