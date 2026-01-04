import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Loader2, 
  Copy, 
  Check, 
  Sparkles,
  Target,
  Megaphone,
  Mail,
  X
} from 'lucide-react';

type ContentType = 'product_description' | 'seo_content' | 'ad_copy' | 'email_marketing';

interface GeneratedContent {
  content: string;
  type: ContentType;
  keywords: string[];
  generated_at: string;
}

export function ProductDescriptionGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentType>('product_description');
  
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    category: '',
    targetAudience: '',
    keywords: '',
    tone: 'professional',
    language: 'fr'
  });

  const [keywordsList, setKeywordsList] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  const contentTypes = [
    { id: 'product_description', label: 'Description Produit', icon: FileText },
    { id: 'seo_content', label: 'Contenu SEO', icon: Target },
    { id: 'ad_copy', label: 'Copy Publicitaire', icon: Megaphone },
    { id: 'email_marketing', label: 'Email Marketing', icon: Mail },
  ];

  const addKeyword = () => {
    if (newKeyword.trim() && !keywordsList.includes(newKeyword.trim())) {
      setKeywordsList([...keywordsList, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywordsList(keywordsList.filter(k => k !== keyword));
  };

  const handleGenerate = async () => {
    if (!formData.productName.trim()) {
      toast.error('Veuillez entrer le nom du produit');
      return;
    }

    setIsGenerating(true);
    try {
      let prompt = '';
      
      switch (activeTab) {
        case 'product_description':
          prompt = `Produit: ${formData.productName}
Description actuelle: ${formData.productDescription}
Catégorie: ${formData.category}
Public cible: ${formData.targetAudience}
Ton souhaité: ${formData.tone}`;
          break;
        case 'seo_content':
          prompt = `Créer du contenu SEO optimisé pour le produit: ${formData.productName}
Description: ${formData.productDescription}
Catégorie: ${formData.category}`;
          break;
        case 'ad_copy':
          prompt = `Créer des textes publicitaires pour: ${formData.productName}
Description: ${formData.productDescription}
Public cible: ${formData.targetAudience}`;
          break;
        case 'email_marketing':
          prompt = `Créer une campagne email pour promouvoir: ${formData.productName}
Description: ${formData.productDescription}
Public cible: ${formData.targetAudience}`;
          break;
      }

      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          type: activeTab,
          prompt,
          language: formData.language,
          keywords: keywordsList
        }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Limite de requêtes atteinte. Veuillez réessayer plus tard.');
        } else if (error.message?.includes('402')) {
          toast.error('Crédits insuffisants. Veuillez recharger votre compte.');
        } else {
          toast.error('Erreur lors de la génération');
        }
        return;
      }

      setGeneratedContent(data);
      toast.success('Contenu généré avec succès !');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedContent?.content) {
      await navigator.clipboard.writeText(generatedContent.content);
      setCopied(true);
      toast.success('Contenu copié !');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Générateur de Contenu IA
        </h2>
        <p className="text-muted-foreground mt-1">
          Créez des descriptions, contenu SEO, publicités et emails optimisés
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)}>
        <TabsList className="grid grid-cols-4 w-full">
          {contentTypes.map(type => {
            const Icon = type.icon;
            return (
              <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          {/* Formulaire */}
          <Card className="p-6 space-y-4">
            <div>
              <Label htmlFor="productName">Nom du Produit *</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="Casque Bluetooth Premium"
              />
            </div>

            <div>
              <Label htmlFor="productDescription">Description Actuelle</Label>
              <Textarea
                id="productDescription"
                value={formData.productDescription}
                onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                placeholder="Décrivez brièvement votre produit..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Électronique"
                />
              </div>

              <div>
                <Label htmlFor="targetAudience">Public Cible</Label>
                <Input
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="Jeunes professionnels"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone">Ton</Label>
                <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professionnel</SelectItem>
                    <SelectItem value="casual">Décontracté</SelectItem>
                    <SelectItem value="luxury">Luxe</SelectItem>
                    <SelectItem value="enthusiastic">Enthousiaste</SelectItem>
                    <SelectItem value="technical">Technique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language">Langue</Label>
                <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Mots-clés SEO</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Ajouter un mot-clé"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" variant="outline" onClick={addKeyword}>
                  Ajouter
                </Button>
              </div>
              {keywordsList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywordsList.map(keyword => (
                    <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                      {keyword}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeKeyword(keyword)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !formData.productName.trim()} 
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer le Contenu
                </>
              )}
            </Button>
          </Card>

          {/* Résultat */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Contenu Généré</h3>
              {generatedContent && (
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copier
                    </>
                  )}
                </Button>
              )}
            </div>

            {generatedContent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{contentTypes.find(t => t.id === generatedContent.type)?.label}</Badge>
                  {generatedContent.keywords.length > 0 && (
                    <span>{generatedContent.keywords.length} mots-clés</span>
                  )}
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap bg-muted/50 p-4 rounded-lg text-sm font-sans overflow-auto max-h-[500px]">
                    {generatedContent.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p>Le contenu généré apparaîtra ici</p>
              </div>
            )}
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
