import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Search, 
  Loader2, 
  Copy, 
  Check, 
  RefreshCw,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface SEOSuggestion {
  title: string;
  metaDescription: string;
  score: number;
  tips: string[];
}

export function SEOTitleGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<SEOSuggestion[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    productName: '',
    currentTitle: '',
    keywords: '',
    targetMarket: 'fr'
  });

  const handleGenerate = async () => {
    if (!formData.productName.trim()) {
      toast.error('Veuillez entrer le nom du produit');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Génère 5 titres SEO optimisés et meta descriptions pour ce produit e-commerce.

Produit: ${formData.productName}
Titre actuel: ${formData.currentTitle || 'Non fourni'}
Mots-clés cibles: ${formData.keywords || 'Non fournis'}
Marché cible: ${formData.targetMarket === 'fr' ? 'France' : formData.targetMarket}

Pour chaque suggestion, fournis:
1. Un titre SEO (max 60 caractères, incluant le mot-clé principal)
2. Une meta description (max 155 caractères, call-to-action inclus)
3. Un score SEO estimé (0-100)
4. 2-3 conseils d'amélioration

Format de réponse souhaité (JSON):
[
  {
    "title": "Titre SEO optimisé",
    "metaDescription": "Meta description accrocheuse avec CTA",
    "score": 85,
    "tips": ["Conseil 1", "Conseil 2"]
  }
]`;

      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          type: 'seo_content',
          prompt,
          language: formData.targetMarket,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
        }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Limite de requêtes atteinte. Veuillez réessayer plus tard.');
        } else if (error.message?.includes('402')) {
          toast.error('Crédits insuffisants.');
        } else {
          toast.error('Erreur lors de la génération');
        }
        return;
      }

      // Parse the response to extract suggestions
      try {
        const content = data.content;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setSuggestions(parsed);
        } else {
          // Fallback: create structured suggestions from text
          setSuggestions([{
            title: formData.productName.substring(0, 60),
            metaDescription: content.substring(0, 155),
            score: 75,
            tips: ['Ajoutez des mots-clés pertinents', 'Incluez un CTA']
          }]);
        }
        toast.success('Suggestions SEO générées !');
      } catch (parseError) {
        console.error('Parse error:', parseError);
        setSuggestions([{
          title: formData.productName,
          metaDescription: data.content?.substring(0, 155) || '',
          score: 70,
          tips: ['Résultat brut - reformatez manuellement']
        }]);
      }
    } catch (error) {
      console.error('Error generating SEO content:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copié !');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success bg-green-100';
    if (score >= 60) return 'text-warning bg-yellow-100';
    return 'text-destructive bg-red-100';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          Générateur de Titres SEO
        </h2>
        <p className="text-muted-foreground mt-1">
          Optimisez vos titres et meta descriptions pour un meilleur référencement
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <Card className="p-6 space-y-4">
          <div>
            <Label htmlFor="productName">Nom du Produit *</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="Casque Bluetooth Sans Fil"
            />
          </div>

          <div>
            <Label htmlFor="currentTitle">Titre Actuel (optionnel)</Label>
            <Input
              id="currentTitle"
              value={formData.currentTitle}
              onChange={(e) => setFormData({ ...formData, currentTitle: e.target.value })}
              placeholder="Mon titre actuel à améliorer"
            />
          </div>

          <div>
            <Label htmlFor="keywords">Mots-clés Cibles</Label>
            <Textarea
              id="keywords"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="casque bluetooth, sans fil, réduction bruit..."
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">Séparez par des virgules</p>
          </div>

          <div>
            <Label htmlFor="targetMarket">Marché Cible</Label>
            <select 
              id="targetMarket"
              value={formData.targetMarket}
              onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="fr">France</option>
              <option value="en">International (EN)</option>
              <option value="de">Allemagne</option>
              <option value="es">Espagne</option>
            </select>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !formData.productName.trim()} 
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Générer Suggestions SEO
              </>
            )}
          </Button>
        </Card>

        {/* Résultats */}
        <div className="lg:col-span-2 space-y-4">
          {suggestions.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{suggestions.length} Suggestions SEO</h3>
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  Régénérer
                </Button>
              </div>
              
              {suggestions.map((suggestion, index) => (
                <Card key={index} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getScoreColor(suggestion.score)}>
                          Score: {suggestion.score}/100
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {suggestion.title.length}/60 caractères
                        </span>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Titre SEO:</p>
                        <p className="font-medium text-primary">{suggestion.title}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Meta Description:</p>
                        <p className="text-sm text-muted-foreground">{suggestion.metaDescription}</p>
                        <span className="text-xs text-muted-foreground">
                          {suggestion.metaDescription.length}/155 caractères
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(`${suggestion.title}\n\n${suggestion.metaDescription}`, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-success hover:text-success">
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-red-700">
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {suggestion.tips && suggestion.tips.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium mb-1">💡 Conseils:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {suggestion.tips.map((tip, tipIndex) => (
                          <li key={tipIndex}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))}
            </>
          ) : (
            <Card className="p-12 flex flex-col items-center justify-center text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium mb-2">Aucune suggestion générée</h3>
              <p className="text-sm text-muted-foreground">
                Entrez les informations de votre produit et cliquez sur "Générer" pour obtenir des suggestions SEO optimisées.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
