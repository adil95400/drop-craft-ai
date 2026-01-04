import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sparkles, Wand2, RefreshCw, Copy, Check, 
  Lightbulb, TrendingUp, Languages, Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface AIContentAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContent?: string;
  onApply: (content: string) => void;
  contentType?: 'blog' | 'description' | 'social' | 'email' | 'seo';
}

const AI_ACTIONS = [
  { id: 'generate', label: 'Générer', icon: Sparkles, description: 'Créer du nouveau contenu' },
  { id: 'improve', label: 'Améliorer', icon: Wand2, description: 'Optimiser le texte existant' },
  { id: 'expand', label: 'Développer', icon: TrendingUp, description: 'Ajouter plus de détails' },
  { id: 'summarize', label: 'Résumer', icon: Zap, description: 'Version courte et concise' },
  { id: 'translate', label: 'Traduire', icon: Languages, description: 'Convertir en autre langue' },
  { id: 'ideas', label: 'Idées', icon: Lightbulb, description: 'Suggestions de contenu' },
];

const TONES = [
  { value: 'professional', label: 'Professionnel' },
  { value: 'casual', label: 'Décontracté' },
  { value: 'enthusiastic', label: 'Enthousiaste' },
  { value: 'persuasive', label: 'Persuasif' },
  { value: 'informative', label: 'Informatif' },
  { value: 'friendly', label: 'Amical' },
];

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'de', label: 'Allemand' },
  { value: 'it', label: 'Italien' },
];

export function AIContentAssistant({
  open,
  onOpenChange,
  initialContent = '',
  onApply,
  contentType = 'blog'
}: AIContentAssistantProps) {
  const [selectedAction, setSelectedAction] = useState('generate');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('fr');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          action: selectedAction,
          content: initialContent,
          prompt,
          tone,
          language,
          contentType
        }
      });
      
      if (error) throw error;
      return data.content;
    },
    onSuccess: (content) => {
      setGeneratedContent(content);
    },
    onError: () => {
      toast.error('Erreur lors de la génération');
    }
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApply(generatedContent);
    onOpenChange(false);
    toast.success('Contenu appliqué');
  };

  const getPromptPlaceholder = () => {
    switch (selectedAction) {
      case 'generate':
        return 'Décrivez le contenu que vous souhaitez générer...';
      case 'improve':
        return 'Indiquez comment améliorer le texte...';
      case 'expand':
        return 'Quels aspects développer ?';
      case 'summarize':
        return 'Points clés à conserver ?';
      case 'translate':
        return 'Instructions de traduction...';
      case 'ideas':
        return 'Thème ou sujet pour les idées...';
      default:
        return 'Entrez vos instructions...';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Assistant IA pour le contenu
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Configuration */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Action</Label>
              <div className="grid grid-cols-2 gap-2">
                {AI_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Card
                      key={action.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedAction === action.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedAction(action.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${
                            selectedAction === action.id ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{action.label}</p>
                            <p className="text-xs text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ton</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Langue</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={getPromptPlaceholder()}
                rows={4}
              />
            </div>

            {initialContent && (
              <div className="space-y-2">
                <Label>Contenu source</Label>
                <div className="p-3 bg-muted/50 rounded-lg text-sm max-h-32 overflow-y-auto">
                  {initialContent.substring(0, 300)}
                  {initialContent.length > 300 && '...'}
                </div>
              </div>
            )}

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="w-full gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Générer
                </>
              )}
            </Button>
          </div>

          {/* Right Panel - Result */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Résultat</Label>
              {generatedContent && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-2"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? 'Copié!' : 'Copier'}
                  </Button>
                </div>
              )}
            </div>

            <Card className="min-h-[300px]">
              <CardContent className="p-4">
                {generatedContent ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {generatedContent}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[250px] text-center text-muted-foreground">
                    <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                    <p>Le contenu généré apparaîtra ici</p>
                    <p className="text-xs mt-1">
                      Configurez les options et cliquez sur "Générer"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {generatedContent && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Régénérer
                </Button>
                <Button onClick={handleApply} className="flex-1 gap-2">
                  <Check className="h-4 w-4" />
                  Appliquer
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
