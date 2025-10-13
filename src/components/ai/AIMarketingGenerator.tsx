import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAIServices } from '@/hooks/useAIServices';
import { Loader2, Mail, Share2, Megaphone, FileText } from 'lucide-react';

export const AIMarketingGenerator = () => {
  const [contentType, setContentType] = useState<'email' | 'social' | 'ad' | 'blog'>('email');
  const [campaign, setCampaign] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('engaging');
  const [keyMessages, setKeyMessages] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');

  const { generateMarketingContent } = useAIServices();

  const handleGenerate = async () => {
    const messagesArray = keyMessages.split(',').map(m => m.trim()).filter(Boolean);
    
    const result = await generateMarketingContent.mutateAsync({
      contentType,
      campaign,
      targetAudience,
      tone,
      keyMessages: messagesArray,
      callToAction
    });

    setGeneratedContent(result.content);
  };

  const contentTypeIcons = {
    email: Mail,
    social: Share2,
    ad: Megaphone,
    blog: FileText
  };

  const Icon = contentTypeIcons[contentType];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          Générateur de Contenu Marketing IA
        </CardTitle>
        <CardDescription>
          Créez du contenu marketing optimisé pour tous vos canaux
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={contentType} onValueChange={(v) => setContentType(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="ad">Publicité</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="campaign">Nom de la Campagne</Label>
          <Input
            id="campaign"
            placeholder="Ex: Lancement Produit Été 2025"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="audience">Audience Cible</Label>
          <Input
            id="audience"
            placeholder="Ex: Femmes 25-45 ans, intéressées par la mode"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone">Ton du Contenu</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professionnel</SelectItem>
              <SelectItem value="engaging">Engageant</SelectItem>
              <SelectItem value="casual">Décontracté</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="educational">Éducatif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="keyMessages">Messages Clés (séparés par des virgules)</Label>
          <Textarea
            id="keyMessages"
            placeholder="Ex: Réduction de 30%, Livraison gratuite, Stock limité"
            value={keyMessages}
            onChange={(e) => setKeyMessages(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cta">Call-to-Action</Label>
          <Input
            id="cta"
            placeholder="Ex: Acheter maintenant, En savoir plus"
            value={callToAction}
            onChange={(e) => setCallToAction(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={generateMarketingContent.isPending || !campaign || !targetAudience}
          className="w-full"
        >
          {generateMarketingContent.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Icon className="mr-2 h-4 w-4" />
              Générer le Contenu
            </>
          )}
        </Button>

        {generatedContent && (
          <div className="space-y-2">
            <Label>Contenu Généré</Label>
            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(generatedContent)}
              >
                Copier
              </Button>
              <Button variant="outline" size="sm">
                Exporter
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
