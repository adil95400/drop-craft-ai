import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { useAIAutomation } from '@/hooks/useAIAutomation';
import { Badge } from '@/components/ui/badge';

export function AIProductDescriptionGenerator() {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [features, setFeatures] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'luxury' | 'playful'>('professional');
  const [copied, setCopied] = useState<string | null>(null);

  const { generateProductDescriptionAsync, isGeneratingDescription, descriptionData } = useAIAutomation();

  const handleGenerate = async () => {
    if (!productName || !category) return;

    await generateProductDescriptionAsync({
      productName,
      category,
      features: features.split(',').map(f => f.trim()).filter(Boolean),
      targetAudience,
      tone,
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Générateur de Descriptions IA
          </CardTitle>
          <CardDescription>
            Créez des descriptions de produits optimisées SEO en quelques secondes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du produit *</Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Casque Bluetooth Premium"
            />
          </div>

          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Électronique, Audio"
            />
          </div>

          <div className="space-y-2">
            <Label>Caractéristiques (séparées par des virgules)</Label>
            <Textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="Ex: Bluetooth 5.0, Réduction de bruit active, 30h d'autonomie"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Public cible</Label>
            <Input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Ex: Professionnels, Gamers, Audiophiles"
            />
          </div>

          <div className="space-y-2">
            <Label>Ton de la description</Label>
            <Select value={tone} onValueChange={(value: any) => setTone(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professionnel</SelectItem>
                <SelectItem value="casual">Décontracté</SelectItem>
                <SelectItem value="luxury">Luxe</SelectItem>
                <SelectItem value="playful">Ludique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!productName || !category || isGeneratingDescription}
            className="w-full"
          >
            {isGeneratingDescription ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Générer la description
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résultats générés</CardTitle>
          <CardDescription>
            Description optimisée prête à être utilisée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!descriptionData ? (
            <div className="text-center py-12 text-muted-foreground">
              Remplissez le formulaire et cliquez sur "Générer" pour voir les résultats
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Titre optimisé</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(descriptionData.title, 'title')}
                  >
                    {copied === 'title' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-lg font-medium">
                  {descriptionData.title}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description courte</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(descriptionData.shortDescription, 'short')}
                  >
                    {copied === 'short' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {descriptionData.shortDescription}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description complète</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(descriptionData.fullDescription, 'full')}
                  >
                    {copied === 'full' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {descriptionData.fullDescription}
                </div>
              </div>

              {descriptionData.bulletPoints && (
                <div className="space-y-2">
                  <Label>Points clés</Label>
                  <ul className="list-disc list-inside space-y-1 p-3 bg-muted rounded-lg text-sm">
                    {descriptionData.bulletPoints.map((point: string, idx: number) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {descriptionData.seoKeywords && (
                <div className="space-y-2">
                  <Label>Mots-clés SEO</Label>
                  <div className="flex flex-wrap gap-2">
                    {descriptionData.seoKeywords.map((keyword: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
