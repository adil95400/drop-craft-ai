import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Languages, Search, Sparkles, Image, FileText, Globe2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const ALL_LANGUAGES = [
  // Europe
  { code: "fr", name: "Français", native: "Français", region: "Europe", flag: "🇫🇷" },
  { code: "en", name: "Anglais", native: "English", region: "Europe", flag: "🇬🇧" },
  { code: "de", name: "Allemand", native: "Deutsch", region: "Europe", flag: "🇩🇪" },
  { code: "es", name: "Espagnol", native: "Español", region: "Europe", flag: "🇪🇸" },
  { code: "it", name: "Italien", native: "Italiano", region: "Europe", flag: "🇮🇹" },
  { code: "pt", name: "Portugais", native: "Português", region: "Europe", flag: "🇵🇹" },
  { code: "nl", name: "Néerlandais", native: "Nederlands", region: "Europe", flag: "🇳🇱" },
  { code: "pl", name: "Polonais", native: "Polski", region: "Europe", flag: "🇵🇱" },
  { code: "ro", name: "Roumain", native: "Română", region: "Europe", flag: "🇷🇴" },
  { code: "cs", name: "Tchèque", native: "Čeština", region: "Europe", flag: "🇨🇿" },
  { code: "hu", name: "Hongrois", native: "Magyar", region: "Europe", flag: "🇭🇺" },
  { code: "el", name: "Grec", native: "Ελληνικά", region: "Europe", flag: "🇬🇷" },
  { code: "sv", name: "Suédois", native: "Svenska", region: "Europe", flag: "🇸🇪" },
  { code: "da", name: "Danois", native: "Dansk", region: "Europe", flag: "🇩🇰" },
  { code: "fi", name: "Finnois", native: "Suomi", region: "Europe", flag: "🇫🇮" },
  { code: "no", name: "Norvégien", native: "Norsk", region: "Europe", flag: "🇳🇴" },
  { code: "sk", name: "Slovaque", native: "Slovenčina", region: "Europe", flag: "🇸🇰" },
  { code: "bg", name: "Bulgare", native: "Български", region: "Europe", flag: "🇧🇬" },
  { code: "hr", name: "Croate", native: "Hrvatski", region: "Europe", flag: "🇭🇷" },
  { code: "uk", name: "Ukrainien", native: "Українська", region: "Europe", flag: "🇺🇦" },
  { code: "lt", name: "Lituanien", native: "Lietuvių", region: "Europe", flag: "🇱🇹" },
  { code: "lv", name: "Letton", native: "Latviešu", region: "Europe", flag: "🇱🇻" },
  { code: "et", name: "Estonien", native: "Eesti", region: "Europe", flag: "🇪🇪" },
  { code: "sl", name: "Slovène", native: "Slovenščina", region: "Europe", flag: "🇸🇮" },
  { code: "sr", name: "Serbe", native: "Srpski", region: "Europe", flag: "🇷🇸" },
  { code: "is", name: "Islandais", native: "Íslenska", region: "Europe", flag: "🇮🇸" },
  { code: "ga", name: "Irlandais", native: "Gaeilge", region: "Europe", flag: "🇮🇪" },
  { code: "mt", name: "Maltais", native: "Malti", region: "Europe", flag: "🇲🇹" },
  { code: "ca", name: "Catalan", native: "Català", region: "Europe", flag: "🏴" },
  { code: "eu", name: "Basque", native: "Euskara", region: "Europe", flag: "🏴" },
  // Asie
  { code: "zh", name: "Chinois (simplifié)", native: "简体中文", region: "Asie", flag: "🇨🇳" },
  { code: "zh-TW", name: "Chinois (traditionnel)", native: "繁體中文", region: "Asie", flag: "🇹🇼" },
  { code: "ja", name: "Japonais", native: "日本語", region: "Asie", flag: "🇯🇵" },
  { code: "ko", name: "Coréen", native: "한국어", region: "Asie", flag: "🇰🇷" },
  { code: "hi", name: "Hindi", native: "हिन्दी", region: "Asie", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", native: "বাংলা", region: "Asie", flag: "🇧🇩" },
  { code: "th", name: "Thaï", native: "ไทย", region: "Asie", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamien", native: "Tiếng Việt", region: "Asie", flag: "🇻🇳" },
  { code: "ms", name: "Malais", native: "Bahasa Melayu", region: "Asie", flag: "🇲🇾" },
  { code: "id", name: "Indonésien", native: "Bahasa Indonesia", region: "Asie", flag: "🇮🇩" },
  { code: "tl", name: "Filipino", native: "Filipino", region: "Asie", flag: "🇵🇭" },
  { code: "ta", name: "Tamoul", native: "தமிழ்", region: "Asie", flag: "🇮🇳" },
  { code: "te", name: "Télougou", native: "తెలుగు", region: "Asie", flag: "🇮🇳" },
  { code: "ur", name: "Ourdou", native: "اردو", region: "Asie", flag: "🇵🇰" },
  { code: "my", name: "Birman", native: "မြန်မာဘာသာ", region: "Asie", flag: "🇲🇲" },
  { code: "km", name: "Khmer", native: "ភាសាខ្មែរ", region: "Asie", flag: "🇰🇭" },
  { code: "ne", name: "Népalais", native: "नेपाली", region: "Asie", flag: "🇳🇵" },
  { code: "si", name: "Cinghalais", native: "සිංහල", region: "Asie", flag: "🇱🇰" },
  { code: "mn", name: "Mongol", native: "Монгол", region: "Asie", flag: "🇲🇳" },
  // Moyen-Orient & Afrique
  { code: "ar", name: "Arabe", native: "العربية", region: "Moyen-Orient", flag: "🇸🇦" },
  { code: "he", name: "Hébreu", native: "עברית", region: "Moyen-Orient", flag: "🇮🇱" },
  { code: "fa", name: "Persan", native: "فارسی", region: "Moyen-Orient", flag: "🇮🇷" },
  { code: "tr", name: "Turc", native: "Türkçe", region: "Moyen-Orient", flag: "🇹🇷" },
  { code: "sw", name: "Swahili", native: "Kiswahili", region: "Afrique", flag: "🇰🇪" },
  { code: "am", name: "Amharique", native: "አማርኛ", region: "Afrique", flag: "🇪🇹" },
  { code: "ha", name: "Haoussa", native: "Hausa", region: "Afrique", flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", native: "Yorùbá", region: "Afrique", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", native: "Igbo", region: "Afrique", flag: "🇳🇬" },
  { code: "zu", name: "Zoulou", native: "isiZulu", region: "Afrique", flag: "🇿🇦" },
  // Amériques
  { code: "pt-BR", name: "Portugais (Brésil)", native: "Português (Brasil)", region: "Amériques", flag: "🇧🇷" },
  { code: "es-MX", name: "Espagnol (Mexique)", native: "Español (México)", region: "Amériques", flag: "🇲🇽" },
  { code: "qu", name: "Quechua", native: "Runasimi", region: "Amériques", flag: "🇵🇪" },
  // Autres
  { code: "ru", name: "Russe", native: "Русский", region: "Europe", flag: "🇷🇺" },
  { code: "ka", name: "Géorgien", native: "ქართული", region: "Europe", flag: "🇬🇪" },
  { code: "hy", name: "Arménien", native: "Հայերեն", region: "Europe", flag: "🇦🇲" },
  { code: "az", name: "Azerbaïdjanais", native: "Azərbaycan", region: "Europe", flag: "🇦🇿" },
  { code: "kk", name: "Kazakh", native: "Қазақша", region: "Asie", flag: "🇰🇿" },
  { code: "uz", name: "Ouzbek", native: "Oʻzbek", region: "Asie", flag: "🇺🇿" },
];

const REGIONS = [...new Set(ALL_LANGUAGES.map(l => l.region))];

type TranslateScope = "titles" | "descriptions" | "seo" | "alt_text";

export const ProductTranslationsTab = () => {
  const [search, setSearch] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<Set<string>>(new Set());
  const [activeRegion, setActiveRegion] = useState<string>("all");
  const [scopes, setScopes] = useState<Set<TranslateScope>>(new Set(["titles", "descriptions", "seo", "alt_text"]));
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);

  const filteredLangs = useMemo(() => 
    ALL_LANGUAGES.filter(l => {
      const matchRegion = activeRegion === "all" || l.region === activeRegion;
      const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.native.toLowerCase().includes(search.toLowerCase()) || l.code.toLowerCase().includes(search.toLowerCase());
      return matchRegion && matchSearch;
    }), [activeRegion, search]);

  const toggleLang = (code: string) => {
    setSelectedLangs(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const toggleScope = (scope: TranslateScope) => {
    setScopes(prev => {
      const next = new Set(prev);
      next.has(scope) ? next.delete(scope) : next.add(scope);
      return next;
    });
  };

  const selectAll = () => setSelectedLangs(new Set(filteredLangs.map(l => l.code)));
  const deselectAll = () => setSelectedLangs(new Set());

  const handleTranslate = () => {
    setIsTranslating(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setIsTranslating(false); return 100; }
        return p + Math.random() * 15;
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{ALL_LANGUAGES.length}</p>
                <p className="text-sm text-muted-foreground">Langues disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{selectedLangs.size}</p>
                <p className="text-sm text-muted-foreground">Langues sélectionnées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{scopes.size}</p>
                <p className="text-sm text-muted-foreground">Champs à traduire</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{scopes.has("alt_text") ? "✓" : "✗"}</p>
                <p className="text-sm text-muted-foreground">Traduction médias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Traduction de Produits ({ALL_LANGUAGES.length}+ langues)
          </CardTitle>
          <CardDescription>
            Traduisez titres, descriptions, métadonnées SEO et ALT-text en masse avec l'IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scope selector */}
          <div>
            <p className="text-sm font-medium mb-3">Champs à traduire</p>
            <div className="flex flex-wrap gap-3">
              {([
                { key: "titles" as TranslateScope, label: "Titres", icon: FileText },
                { key: "descriptions" as TranslateScope, label: "Descriptions", icon: FileText },
                { key: "seo" as TranslateScope, label: "Meta SEO", icon: Globe2 },
                { key: "alt_text" as TranslateScope, label: "ALT-text images", icon: Image },
              ]).map(s => (
                <div key={s.key} className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleScope(s.key)}>
                  <Checkbox checked={scopes.has(s.key)} />
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Language selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Sélectionnez les langues cibles</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>Tout sélectionner</Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>Désélectionner</Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher une langue..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-1">
                <Button variant={activeRegion === "all" ? "default" : "outline"} size="sm" onClick={() => setActiveRegion("all")}>Toutes</Button>
                {REGIONS.map(r => (
                  <Button key={r} variant={activeRegion === r ? "default" : "outline"} size="sm" onClick={() => setActiveRegion(r)}>
                    {r}
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="h-64 border rounded-lg p-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredLangs.map(lang => (
                  <div key={lang.code}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border ${selectedLangs.has(lang.code) ? 'bg-primary/10 border-primary/30' : 'hover:bg-accent/50 border-transparent'}`}
                    onClick={() => toggleLang(lang.code)}>
                    <Checkbox checked={selectedLangs.has(lang.code)} />
                    <span className="text-lg">{lang.flag}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lang.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lang.native}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Translation progress */}
          {isTranslating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Traduction en cours...</span>
                <span className="font-medium">{Math.min(100, Math.round(progress))}%</span>
              </div>
              <Progress value={Math.min(100, progress)} />
            </div>
          )}

          {/* Action button */}
          <Button className="w-full" size="lg" disabled={selectedLangs.size === 0 || scopes.size === 0 || isTranslating} onClick={handleTranslate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Traduire vers {selectedLangs.size} langue{selectedLangs.size !== 1 ? "s" : ""} ({scopes.size} champ{scopes.size !== 1 ? "s" : ""})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
