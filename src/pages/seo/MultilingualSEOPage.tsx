import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import {
  Globe, Languages, Sparkles, Copy, Check, Search, ArrowRight,
  FileText, Tag, BarChart3, Loader2, ChevronDown, Download
} from 'lucide-react';

const LANGUAGE_GROUPS = {
  'Europe de l\'Ouest': ['en', 'fr', 'es', 'de', 'it', 'pt', 'nl'],
  'Europe du Nord': ['sv', 'da', 'no', 'fi', 'is'],
  'Europe de l\'Est': ['pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'ru', 'uk'],
  'Asie': ['ja', 'ko', 'zh', 'zh-TW', 'th', 'vi', 'id', 'ms', 'hi'],
  'Moyen-Orient': ['ar', 'he', 'tr', 'fa'],
  'Afrique': ['sw', 'af'],
  'Autres': ['ca', 'eu', 'gl', 'et', 'lv', 'lt', 'el', 'sq', 'mk', 'bs', 'sr', 'ka', 'hy', 'az', 'tl', 'cy', 'ga'],
};

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'Français', en: 'Anglais', es: 'Espagnol', de: 'Allemand', it: 'Italien',
  pt: 'Portugais', nl: 'Néerlandais', pl: 'Polonais', sv: 'Suédois', da: 'Danois',
  no: 'Norvégien', fi: 'Finnois', cs: 'Tchèque', sk: 'Slovaque', hu: 'Hongrois',
  ro: 'Roumain', bg: 'Bulgare', hr: 'Croate', sl: 'Slovène', el: 'Grec',
  tr: 'Turc', ru: 'Russe', uk: 'Ukrainien', ar: 'Arabe', he: 'Hébreu',
  ja: 'Japonais', ko: 'Coréen', zh: 'Chinois simp.', 'zh-TW': 'Chinois trad.',
  th: 'Thaï', vi: 'Vietnamien', id: 'Indonésien', ms: 'Malais', hi: 'Hindi',
  sw: 'Swahili', af: 'Afrikaans', tl: 'Filipino', ca: 'Catalan', eu: 'Basque',
  gl: 'Galicien', et: 'Estonien', lv: 'Letton', lt: 'Lituanien', is: 'Islandais',
  sq: 'Albanais', mk: 'Macédonien', bs: 'Bosniaque', sr: 'Serbe', ka: 'Géorgien',
  hy: 'Arménien', az: 'Azéri', fa: 'Persan', cy: 'Gallois', ga: 'Irlandais',
  bn: 'Bengali', ta: 'Tamoul', te: 'Télougou', mr: 'Marathi', ur: 'Ourdou',
  kk: 'Kazakh', uz: 'Ouzbek', mt: 'Maltais',
};

const FLAG_EMOJIS: Record<string, string> = {
  fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸', de: '🇩🇪', it: '🇮🇹', pt: '🇵🇹', nl: '🇳🇱',
  pl: '🇵🇱', sv: '🇸🇪', da: '🇩🇰', no: '🇳🇴', fi: '🇫🇮', cs: '🇨🇿', sk: '🇸🇰',
  hu: '🇭🇺', ro: '🇷🇴', bg: '🇧🇬', hr: '🇭🇷', sl: '🇸🇮', el: '🇬🇷', tr: '🇹🇷',
  ru: '🇷🇺', uk: '🇺🇦', ar: '🇸🇦', he: '🇮🇱', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳',
  'zh-TW': '🇹🇼', th: '🇹🇭', vi: '🇻🇳', id: '🇮🇩', ms: '🇲🇾', hi: '🇮🇳',
  sw: '🇰🇪', af: '🇿🇦', tl: '🇵🇭', is: '🇮🇸',
};

type ContentFields = {
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
};

export default function MultilingualSEOPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sourceLang, setSourceLang] = useState('fr');
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [contentType, setContentType] = useState('product');
  const [tone, setTone] = useState('professional');
  const [productContext, setProductContext] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [sourceContent, setSourceContent] = useState<ContentFields>({
    title: '',
    description: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
  });

  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});

  const toggleLanguage = (lang: string) => {
    setSelectedLangs(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const selectGroup = (group: string) => {
    const langs = LANGUAGE_GROUPS[group as keyof typeof LANGUAGE_GROUPS] || [];
    const filtered = langs.filter(l => l !== sourceLang);
    const allSelected = filtered.every(l => selectedLangs.includes(l));
    if (allSelected) {
      setSelectedLangs(prev => prev.filter(l => !filtered.includes(l)));
    } else {
      setSelectedLangs(prev => [...new Set([...prev, ...filtered])]);
    }
  };

  const handleTranslate = async () => {
    if (!user) return;
    const filledTexts: Record<string, string> = {};
    Object.entries(sourceContent).forEach(([key, value]) => {
      if (value.trim()) filledTexts[key] = value;
    });

    if (Object.keys(filledTexts).length === 0) {
      toast({ title: 'Contenu requis', description: 'Remplissez au moins un champ', variant: 'destructive' });
      return;
    }
    if (selectedLangs.length === 0) {
      toast({ title: 'Langues requises', description: 'Sélectionnez au moins une langue cible', variant: 'destructive' });
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-multilingual-translate', {
        body: {
          texts: filledTexts,
          sourceLang,
          targetLangs: selectedLangs,
          contentType,
          tone,
          productContext,
        },
      });

      if (error) throw error;
      if (data?.translations) {
        setTranslations(data.translations);
        toast({
          title: 'Traductions générées',
          description: `${data.languageCount} langues traduites avec succès`,
        });
      }
    } catch (err) {
      console.error('Translation error:', err);
      toast({ title: 'Erreur', description: 'Impossible de générer les traductions', variant: 'destructive' });
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const exportTranslations = () => {
    const exportData = { source: { lang: sourceLang, content: sourceContent }, translations };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Helmet>
        <title>Contenu Multilingue SEO | ShopOpti</title>
        <meta name="description" content="Générateur de descriptions SEO multilingues pour 50+ langues" />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('contenuSeoMultilingue.title')}
        description="Générez des descriptions produit optimisées SEO dans 50+ langues avec l'IA"
        heroImage="seo"
        badge={{ label: 'SEO Multilingue', icon: Globe }}
      >
        <Tabs defaultValue="create" className="space-y-4">
          <TabsList>
            <TabsTrigger value="create" className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Générer
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-1.5">
              <Languages className="h-4 w-4" /> Résultats ({Object.keys(translations).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Langue source</Label>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LANGUAGE_NAMES).slice(0, 10).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{FLAG_EMOJIS[code] || ''} {name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Type de contenu</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Fiche produit</SelectItem>
                    <SelectItem value="category">Page catégorie</SelectItem>
                    <SelectItem value="blog">Article blog</SelectItem>
                    <SelectItem value="landing">Landing page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ton</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professionnel</SelectItem>
                    <SelectItem value="casual">Décontracté</SelectItem>
                    <SelectItem value="luxury">Luxe</SelectItem>
                    <SelectItem value="fun">Fun & Engageant</SelectItem>
                    <SelectItem value="technical">Technique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Contexte produit</Label>
                <Input
                  value={productContext}
                  onChange={e => setProductContext(e.target.value)}
                  placeholder="Ex: Mode femme, Électronique..."
                />
              </div>
            </div>

            {/* Source Content */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Contenu source ({LANGUAGE_NAMES[sourceLang]})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Titre produit</Label>
                    <Input value={sourceContent.title} onChange={e => setSourceContent(p => ({ ...p, title: e.target.value }))} placeholder="Titre du produit" />
                  </div>
                  <div>
                    <Label className="text-xs">Titre SEO (meta title)</Label>
                    <Input value={sourceContent.metaTitle} onChange={e => setSourceContent(p => ({ ...p, metaTitle: e.target.value }))} placeholder="Titre SEO optimisé" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description produit</Label>
                  <Textarea value={sourceContent.description} onChange={e => setSourceContent(p => ({ ...p, description: e.target.value }))} placeholder="Description détaillée du produit..." rows={4} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Meta description</Label>
                    <Textarea value={sourceContent.metaDescription} onChange={e => setSourceContent(p => ({ ...p, metaDescription: e.target.value }))} placeholder="Meta description (160 car. max)" rows={2} />
                  </div>
                  <div>
                    <Label className="text-xs">Mots-clés SEO</Label>
                    <Input value={sourceContent.keywords} onChange={e => setSourceContent(p => ({ ...p, keywords: e.target.value }))} placeholder="mot-clé1, mot-clé2, mot-clé3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Language Selection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Langues cibles ({selectedLangs.length} sélectionnées)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(LANGUAGE_GROUPS).map(([group, langs]) => {
                    const available = langs.filter(l => l !== sourceLang);
                    const selectedCount = available.filter(l => selectedLangs.includes(l)).length;
                    return (
                      <div key={group}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{group}</span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => selectGroup(group)}>
                            {selectedCount === available.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {available.map(lang => (
                            <Badge
                              key={lang}
                              variant={selectedLangs.includes(lang) ? 'default' : 'outline'}
                              className="cursor-pointer text-xs py-1 px-2"
                              onClick={() => toggleLanguage(lang)}
                            >
                              {FLAG_EMOJIS[lang] || ''} {LANGUAGE_NAMES[lang] || lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button size="lg" onClick={handleTranslate} disabled={isTranslating || selectedLangs.length === 0}
                className="px-8">
                {isTranslating ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Traduction en cours ({selectedLangs.length} langues)...</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-2" /> Générer les traductions ({selectedLangs.length} langues)</>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {Object.keys(translations).length === 0 ? (
              <Card>
                <CardContent className="p-12 flex flex-col items-center text-muted-foreground">
                  <Languages className="h-12 w-12 mb-4 opacity-40" />
                  <p className="text-lg font-medium">Aucune traduction générée</p>
                  <p className="text-sm">Remplissez le contenu source et sélectionnez des langues pour commencer</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{Object.keys(translations).length} langues traduites</p>
                  <Button variant="outline" size="sm" onClick={exportTranslations}>
                    <Download className="h-4 w-4 mr-2" /> Exporter JSON
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(translations).map(([lang, fields]) => (
                    <Card key={lang}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="text-lg">{FLAG_EMOJIS[lang] || '🌐'}</span>
                          {LANGUAGE_NAMES[lang] || lang}
                          <Badge variant="secondary" className="text-xs">{lang.toUpperCase()}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(fields).map(([key, value]) => (
                          <div key={key} className="group">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                              <Button
                                variant="ghost" size="sm" className="h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => copyToClipboard(value, `${lang}-${key}`)}
                              >
                                {copiedField === `${lang}-${key}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                            <p className="text-sm bg-muted/50 rounded-md p-2 mt-1">{value}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
