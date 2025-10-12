import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mail, Share2, Megaphone, FileText, Copy, Check } from 'lucide-react';
import { useAIAutomation } from '@/hooks/useAIAutomation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export function AIMarketingGenerator() {
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [price, setPrice] = useState('');
  const [contentType, setContentType] = useState<'email' | 'social' | 'ad' | 'blog'>('email');
  const [platform, setPlatform] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('');
  const [copied, setCopied] = useState(false);

  const { generateMarketingContentAsync, isGeneratingMarketing, marketingData } = useAIAutomation();

  const handleGenerate = async () => {
    if (!productName) return;

    await generateMarketingContentAsync({
      contentType,
      productInfo: {
        name: productName,
        description: productDescription,
        price: price ? parseFloat(price) : undefined,
      },
      platform,
      campaignGoal,
    });
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const contentIcons = {
    email: Mail,
    social: Share2,
    ad: Megaphone,
    blog: FileText,
  };

  const ContentIcon = contentIcons[contentType];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ContentIcon className="h-5 w-5 text-primary" />
            Générateur de Contenu Marketing
          </CardTitle>
          <CardDescription>
            Créez du contenu marketing optimisé pour vos campagnes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type de contenu *</Label>
            <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email Marketing</SelectItem>
                <SelectItem value="social">Posts Réseaux Sociaux</SelectItem>
                <SelectItem value="ad">Publicité Payante</SelectItem>
                <SelectItem value="blog">Article de Blog</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nom du produit *</Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Montre connectée SportPro"
            />
          </div>

          <div className="space-y-2">
            <Label>Description du produit</Label>
            <Textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Brève description des caractéristiques principales"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Prix ($)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="199.99"
            />
          </div>

          <div className="space-y-2">
            <Label>Plateforme cible</Label>
            <Input
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="Ex: Instagram, Facebook, Google Ads"
            />
          </div>

          <div className="space-y-2">
            <Label>Objectif de la campagne</Label>
            <Input
              value={campaignGoal}
              onChange={(e) => setCampaignGoal(e.target.value)}
              placeholder="Ex: Augmenter les ventes, Générer des leads"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!productName || isGeneratingMarketing}
            className="w-full"
          >
            {isGeneratingMarketing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <ContentIcon className="mr-2 h-4 w-4" />
                Générer le contenu
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contenu généré</CardTitle>
          <CardDescription>
            Prêt à être utilisé dans vos campagnes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!marketingData?.data ? (
            <div className="text-center py-12 text-muted-foreground">
              Configurez vos paramètres et générez du contenu marketing
            </div>
          ) : (
            <div className="space-y-4">
              {contentType === 'email' && marketingData.data.subject && (
                <Tabs defaultValue="subject">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="subject">Sujet</TabsTrigger>
                    <TabsTrigger value="preview">Aperçu</TabsTrigger>
                    <TabsTrigger value="body">Corps</TabsTrigger>
                  </TabsList>
                  <TabsContent value="subject" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Ligne de sujet</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyContent(marketingData.data.subject)}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="p-4 bg-muted rounded-lg font-medium">
                      {marketingData.data.subject}
                    </div>
                  </TabsContent>
                  <TabsContent value="preview" className="space-y-2">
                    <Label>Texte d'aperçu</Label>
                    <div className="p-4 bg-muted rounded-lg text-sm">
                      {marketingData.data.previewText}
                    </div>
                  </TabsContent>
                  <TabsContent value="body" className="space-y-2">
                    <Label>Corps de l'email</Label>
                    <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {marketingData.data.body}
                    </div>
                    <Button variant="outline" className="w-full">
                      {marketingData.data.cta || 'Voir l\'offre'}
                    </Button>
                  </TabsContent>
                </Tabs>
              )}

              {contentType === 'social' && Array.isArray(marketingData.data) && (
                <div className="space-y-4">
                  {marketingData.data.map((post: any, idx: number) => (
                    <Card key={idx}>
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Variation {idx + 1}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyContent(post.text)}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-sm">{post.text}</p>
                        {post.hashtags && (
                          <div className="flex flex-wrap gap-1 text-xs text-primary">
                            {post.hashtags.map((tag: string, i: number) => (
                              <span key={i}>#{tag}</span>
                            ))}
                          </div>
                        )}
                        {post.callToAction && (
                          <div className="text-xs text-muted-foreground">
                            CTA: {post.callToAction}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {contentType === 'ad' && marketingData.data.headline && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titre principal</Label>
                    <div className="p-3 bg-muted rounded-lg font-bold text-lg">
                      {marketingData.data.headline}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      {marketingData.data.description}
                    </div>
                  </div>
                  {marketingData.data.longDescription && (
                    <div className="space-y-2">
                      <Label>Description longue</Label>
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        {marketingData.data.longDescription}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {contentType === 'blog' && marketingData.data.title && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titre SEO</Label>
                    <div className="p-3 bg-muted rounded-lg font-bold">
                      {marketingData.data.title}
                    </div>
                  </div>
                  {marketingData.data.metaDescription && (
                    <div className="space-y-2">
                      <Label>Meta description</Label>
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        {marketingData.data.metaDescription}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Introduction</Label>
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      {marketingData.data.intro}
                    </div>
                  </div>
                  {marketingData.data.sections && (
                    <div className="space-y-2">
                      <Label>Sections principales</Label>
                      <div className="space-y-2">
                        {marketingData.data.sections.map((section: any, idx: number) => (
                          <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                            <div className="font-medium">{section.heading || section}</div>
                            {section.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {section.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
