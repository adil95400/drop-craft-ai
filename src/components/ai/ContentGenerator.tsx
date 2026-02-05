import { useState } from 'react';
import { productionLogger } from '@/utils/productionLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText,
  Mail,
  Share2,
  Package,
  Loader2,
  Copy,
  Download,
  Sparkles,
  Wand2
} from 'lucide-react';

interface ContentGeneratorProps {
  className?: string;
}

interface GeneratedContent {
  content: string;
  contentType: string;
  metadata: {
    tone: string;
    language: string;
    wordCount: number;
    generatedAt: string;
  };
  usage?: {
    total_tokens: number;
  };
}

const contentTypes = [
  {
    id: 'product_description',
    name: 'Description Produit',
    icon: Package,
    description: 'Créer des fiches produits attrayantes et SEO-friendly',
    fields: ['productName', 'category', 'features', 'price', 'targetAudience']
  },
  {
    id: 'marketing_email',
    name: 'Email Marketing',
    icon: Mail,
    description: 'Générer des emails marketing engageants',
    fields: ['subject', 'objective', 'audience', 'cta', 'specialContent']
  },
  {
    id: 'blog_article',
    name: 'Article de Blog',
    icon: FileText,
    description: 'Rédiger des articles informatifs et optimisés SEO',
    fields: ['title', 'keywords', 'wordCount', 'angle', 'audience']
  },
  {
    id: 'social_media',
    name: 'Post Réseaux Sociaux',
    icon: Share2,
    description: 'Créer du contenu viral pour les réseaux sociaux',
    fields: ['platform', 'message', 'hashtags', 'goal']
  }
];

const tones = [
  { value: 'professional', label: 'Professionnel' },
  { value: 'friendly', label: 'Amical' },
  { value: 'persuasive', label: 'Persuasif' },
  { value: 'informative', label: 'Informatif' },
  { value: 'creative', label: 'Créatif' },
  { value: 'formal', label: 'Formel' }
];

const languages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'de', label: 'Allemand' }
];

export const ContentGenerator = ({ className }: ContentGeneratorProps) => {
  const [selectedContentType, setSelectedContentType] = useState(contentTypes[0]);
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('fr');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const fieldLabels: Record<string, string> = {
    productName: 'Nom du produit',
    category: 'Catégorie',
    features: 'Caractéristiques',
    price: 'Prix',
    targetAudience: 'Public cible',
    subject: 'Sujet de l\'email',
    objective: 'Objectif',
    audience: 'Audience',
    cta: 'Appel à l\'action',
    specialContent: 'Contenu spécial',
    title: 'Titre de l\'article',
    keywords: 'Mots-clés',
    wordCount: 'Nombre de mots',
    angle: 'Angle d\'approche',
    platform: 'Plateforme',
    message: 'Message principal',
    hashtags: 'Hashtags',
    goal: 'Objectif'
  };

  const fieldPlaceholders: Record<string, string> = {
    productName: 'ex: Casque audio sans fil',
    category: 'ex: Électronique',
    features: 'ex: Bluetooth 5.0, autonomie 30h, réduction de bruit',
    price: 'ex: 99€',
    targetAudience: 'ex: Professionnels en déplacement',
    subject: 'ex: Nouvelle collection printemps',
    objective: 'ex: Augmenter les ventes',
    audience: 'ex: Clients fidèles',
    cta: 'ex: Découvrir maintenant',
    specialContent: 'ex: Promotion -20% ce week-end',
    title: 'ex: Les tendances e-commerce 2024',
    keywords: 'ex: e-commerce, tendances, digital',
    wordCount: 'ex: 800',
    angle: 'ex: Guide pratique',
    platform: 'ex: LinkedIn',
    message: 'ex: Partager une success story',
    hashtags: 'ex: #ecommerce #business',
    goal: 'ex: Engagement et partages'
  };

  const handleParameterChange = (field: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateContent = async () => {
    if (!selectedContentType) return;

    // Validation basique
    const requiredFields = selectedContentType.fields.slice(0, 3); // Les 3 premiers champs sont requis
    const missingFields = requiredFields.filter(field => !parameters[field]?.trim());
    
    if (missingFields.length > 0) {
      toast({
        title: "Champs manquants",
        description: `Veuillez remplir: ${missingFields.map(f => fieldLabels[f]).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Vous devez être connecté pour générer du contenu');
      }

      const response = await supabase.functions.invoke('ai-powerhouse/content-generator', {
        body: {
          contentType: selectedContentType.id,
          parameters,
          tone,
          language
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de la génération de contenu');
      }

      setGeneratedContent(response.data);
      
      toast({
        title: "Contenu généré !",
        description: `${response.data.metadata.wordCount} mots générés avec succès`
      });

    } catch (error: any) {
      productionLogger.error('Failed to generate content', error, 'ContentGenerator');
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedContent) return;
    
    try {
      await navigator.clipboard.writeText(generatedContent.content);
      toast({
        title: "Copié !",
        description: "Le contenu a été copié dans le presse-papiers"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le contenu",
        variant: "destructive"
      });
    }
  };

  const downloadContent = () => {
    if (!generatedContent) return;

    const element = document.createElement('a');
    const file = new Blob([generatedContent.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `contenu-${selectedContentType.id}-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const resetForm = () => {
    setParameters({});
    setGeneratedContent(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sélection du type de contenu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Générateur de Contenu IA
          </CardTitle>
          <CardDescription>
            Créez du contenu professionnel en quelques clics grâce à l'intelligence artificielle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedContentType.id === type.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setSelectedContentType(type);
                    resetForm();
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium mb-1">{type.name}</h3>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
            <CardDescription>
              Personnalisez le style et les paramètres de génération
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Paramètres généraux */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone">Ton</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="language">Langue</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(l => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Champs spécifiques au type de contenu */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Paramètres spécifiques</h4>
              {selectedContentType.fields.map((field, index) => (
                <div key={field}>
                  <Label htmlFor={field} className="flex items-center gap-1">
                    {fieldLabels[field]}
                    {index < 3 && <span className="text-red-500">*</span>}
                  </Label>
                  {field === 'features' || field === 'specialContent' || field === 'keywords' ? (
                    <Textarea
                      id={field}
                      placeholder={fieldPlaceholders[field]}
                      value={parameters[field] || ''}
                      onChange={(e) => handleParameterChange(field, e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={field}
                      placeholder={fieldPlaceholders[field]}
                      value={parameters[field] || ''}
                      onChange={(e) => handleParameterChange(field, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            <Button 
              onClick={generateContent} 
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer le contenu
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Résultat */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Contenu généré</CardTitle>
                <CardDescription>
                  Votre contenu apparaîtra ici après génération
                </CardDescription>
              </div>
              {generatedContent && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadContent}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <div className="space-y-4">
                {/* Métadonnées */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {generatedContent.metadata.wordCount} mots
                  </Badge>
                  <Badge variant="outline">
                    {generatedContent.metadata.tone}
                  </Badge>
                  <Badge variant="outline">
                    {generatedContent.metadata.language}
                  </Badge>
                  {generatedContent.usage && (
                    <Badge variant="outline">
                      {generatedContent.usage.total_tokens} tokens
                    </Badge>
                  )}
                </div>

                {/* Contenu */}
                <div className="bg-muted/50 rounded-lg p-4 min-h-[300px]">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {generatedContent.content}
                  </div>
                </div>

                <Button variant="outline" onClick={resetForm} className="w-full">
                  Générer un nouveau contenu
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">
                  Configurez les paramètres et cliquez sur "Générer" pour créer votre contenu
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};