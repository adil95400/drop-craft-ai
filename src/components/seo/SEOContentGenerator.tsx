import { useState, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Copy, RefreshCw, Download, CheckCircle, FileText, Tag, Hash, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface GeneratedContent {
  title: string;
  metaDescription: string;
  h1: string;
  keywords: string[];
  content: string;
  alt_texts: string[];
}

interface SEOContentGeneratorProps {
  productName?: string;
  productDescription?: string;
  category?: string;
}

function SEOContentGeneratorComponent({
  productName = "",
  productDescription = "",
  category = ""
}: SEOContentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [contentType, setContentType] = useState('product');
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('fr');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const generateContent = useCallback(async () => {
    if (!keyword.trim()) {
      toast({ title: "Mot-clé manquant", description: "Veuillez saisir un mot-clé principal", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Generate all types in parallel via Lovable AI
      const types = ['title', 'meta_description', 'h1', 'alt_text'];
      const responses = await Promise.all(
        types.map(type =>
          supabase.functions.invoke('seo-content-ai', {
            body: { type, keyword, productName, category, language, tone, keywords: [], variants: 3 }
          })
        )
      );

      const [titleRes, metaRes, h1Res, altRes] = responses;

      // Check for errors
      for (const res of responses) {
        if (res.error) throw new Error(res.error.message || 'Erreur IA');
        if (res.data?.error) throw new Error(res.data.error);
      }

      const titleResults = titleRes.data?.results || [];
      const metaResults = metaRes.data?.results || [];
      const h1Results = h1Res.data?.results || [];
      const altResults = altRes.data?.results || [];

      const content: GeneratedContent = {
        title: titleResults[0]?.text || `${keyword} - Meilleur Prix`,
        metaDescription: metaResults[0]?.text || `Découvrez ${keyword}`,
        h1: h1Results[0]?.text || keyword,
        keywords: [keyword, `${keyword} pas cher`, `meilleur ${keyword}`, `acheter ${keyword}`],
        content: `# ${h1Results[0]?.text || keyword}\n\n${metaResults.map((m: any) => m.text).join('\n\n')}`,
        alt_texts: altResults.map((a: any) => a.text || a.question || ''),
      };

      setGeneratedContent(content);
      toast({ title: "Contenu généré avec succès", description: "Le contenu SEO optimisé par IA est prêt" });
    } catch (err: any) {
      const msg = err.message || "Impossible de générer le contenu";
      setError(msg);
      toast({ title: "Erreur de génération", description: msg, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [keyword, productName, category, language, tone, toast]);

  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié !", description: `${type} copié dans le presse-papier` });
  }, [toast]);

  const exportContent = useCallback(() => {
    if (!generatedContent) return;
    const blob = new Blob([JSON.stringify(generatedContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-content-${keyword.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Export réussi", description: "Le contenu a été exporté" });
  }, [generatedContent, keyword, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          Générateur de Contenu IA
        </CardTitle>
        <CardDescription>
          Créez du contenu SEO optimisé automatiquement grâce à l'intelligence artificielle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Mot-clé principal *</Label>
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Ex: smartphone waterproof" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label>Type de contenu</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Page produit</SelectItem>
                <SelectItem value="category">Page catégorie</SelectItem>
                <SelectItem value="blog">Article de blog</SelectItem>
                <SelectItem value="landing">Page d'atterrissage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ton</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professionnel</SelectItem>
                <SelectItem value="friendly">Amical</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
                <SelectItem value="casual">Décontracté</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Langue</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">Anglais</SelectItem>
                <SelectItem value="es">Espagnol</SelectItem>
                <SelectItem value="de">Allemand</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={generateContent} disabled={isGenerating || !keyword.trim()} className="w-full h-11">
          {isGenerating ? (
            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Génération IA en cours…</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />Générer le contenu SEO</>
          )}
        </Button>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {generatedContent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Contenu généré par IA
              </h3>
              <Button variant="outline" size="sm" onClick={exportContent}>
                <Download className="mr-2 h-4 w-4" />Exporter
              </Button>
            </div>

            <Tabs defaultValue="meta" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="meta">Méta</TabsTrigger>
                <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>

              <TabsContent value="meta" className="space-y-4">
                {[
                  { label: 'Titre SEO', icon: Tag, value: generatedContent.title, charCount: true },
                  { label: 'Meta Description', icon: FileText, value: generatedContent.metaDescription, charCount: true },
                  { label: 'Titre H1', icon: Hash, value: generatedContent.h1 },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />{item.label}
                        </h4>
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => copyToClipboard(item.value, item.label)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-sm bg-muted/50 p-2.5 rounded">{item.value}</p>
                      {item.charCount && <Badge variant="outline" className="mt-2 text-xs">{item.value.length} caractères</Badge>}
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="keywords">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><Hash className="h-4 w-4" />Mots-clés suggérés</h4>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => copyToClipboard(generatedContent.keywords.join(', '), 'Mots-clés')}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.keywords.map((kw, i) => <Badge key={i} variant="secondary">{kw}</Badge>)}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Contenu optimisé</h4>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => copyToClipboard(generatedContent.content, 'Contenu')}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea value={generatedContent.content} readOnly className="min-h-[300px] font-mono text-sm" />
                </div>
              </TabsContent>

              <TabsContent value="images">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-3">Textes alternatifs suggérés</h4>
                  <div className="space-y-2">
                    {generatedContent.alt_texts.filter(Boolean).map((alt, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-muted/50 rounded">
                        <span className="text-sm">{alt}</span>
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => copyToClipboard(alt, 'Alt text')}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const SEOContentGenerator = memo(SEOContentGeneratorComponent);
