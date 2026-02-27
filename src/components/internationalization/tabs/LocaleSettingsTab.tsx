import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Globe2, DollarSign, Languages, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const POPULAR_LOCALES = [
  { code: "fr-FR", label: "Français (France)", flag: "🇫🇷" },
  { code: "en-US", label: "Anglais (US)", flag: "🇺🇸" },
  { code: "en-GB", label: "Anglais (UK)", flag: "🇬🇧" },
  { code: "de-DE", label: "Allemand", flag: "🇩🇪" },
  { code: "es-ES", label: "Espagnol", flag: "🇪🇸" },
  { code: "it-IT", label: "Italien", flag: "🇮🇹" },
  { code: "pt-BR", label: "Portugais (Brésil)", flag: "🇧🇷" },
  { code: "nl-NL", label: "Néerlandais", flag: "🇳🇱" },
  { code: "ja-JP", label: "Japonais", flag: "🇯🇵" },
  { code: "ko-KR", label: "Coréen", flag: "🇰🇷" },
  { code: "zh-CN", label: "Chinois (simplifié)", flag: "🇨🇳" },
  { code: "ar-SA", label: "Arabe", flag: "🇸🇦" },
  { code: "hi-IN", label: "Hindi", flag: "🇮🇳" },
  { code: "ru-RU", label: "Russe", flag: "🇷🇺" },
  { code: "tr-TR", label: "Turc", flag: "🇹🇷" },
  { code: "pl-PL", label: "Polonais", flag: "🇵🇱" },
  { code: "sv-SE", label: "Suédois", flag: "🇸🇪" },
  { code: "da-DK", label: "Danois", flag: "🇩🇰" },
  { code: "th-TH", label: "Thaï", flag: "🇹🇭" },
  { code: "vi-VN", label: "Vietnamien", flag: "🇻🇳" },
];

const POPULAR_CURRENCIES = [
  "EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR", "BRL",
  "KRW", "MXN", "SGD", "HKD", "NOK", "SEK", "DKK", "NZD", "ZAR", "TRY",
];

export const LocaleSettingsTab = () => {
  const { toast } = useToast();
  const [defaultLocale, setDefaultLocale] = useState("fr-FR");
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [activeLocales, setActiveLocales] = useState<Set<string>>(new Set(["fr-FR", "en-US", "de-DE", "es-ES"]));
  const [activeCurrencies, setActiveCurrencies] = useState<Set<string>>(new Set(["EUR", "USD", "GBP"]));
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [autoDetectLocale, setAutoDetectLocale] = useState(true);
  const [autoConvertCurrency, setAutoConvertCurrency] = useState(false);
  const [translateMedia, setTranslateMedia] = useState(true);
  const [seoMultilingual, setSeoMultilingual] = useState(true);

  const toggleLocale = (code: string) => {
    setActiveLocales(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const toggleCurrency = (code: string) => {
    setActiveCurrencies(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const handleSave = () => {
    toast({ title: "Paramètres sauvegardés", description: "Les paramètres de localisation ont été mis à jour." });
  };

  return (
    <div className="space-y-6">
      {/* Default settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe2 className="h-5 w-5" />
              Locale par défaut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select className="w-full border rounded-md p-2 bg-background" value={defaultLocale} onChange={e => setDefaultLocale(e.target.value)}>
              {POPULAR_LOCALES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Devise par défaut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select className="w-full border rounded-md p-2 bg-background" value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)}>
              {POPULAR_CURRENCIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Active locales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Locales actives
          </CardTitle>
          <CardDescription>
            Sélectionnez les locales pour lesquelles votre boutique sera disponible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {POPULAR_LOCALES.map(l => (
              <div key={l.code}
                className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer transition-colors ${activeLocales.has(l.code) ? 'bg-primary/10 border-primary/30' : 'hover:bg-accent/50'}`}
                onClick={() => toggleLocale(l.code)}>
                <span>{l.flag}</span>
                <span className="text-sm">{l.code.split('-')[0].toUpperCase()}</span>
                {l.code === defaultLocale && <Badge variant="outline" className="text-xs">défaut</Badge>}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">{activeLocales.size} locale{activeLocales.size > 1 ? 's' : ''} active{activeLocales.size > 1 ? 's' : ''}</p>
        </CardContent>
      </Card>

      {/* Active currencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Devises actives
          </CardTitle>
          <CardDescription>
            Sélectionnez les devises disponibles pour vos visiteurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CURRENCIES.map(c => (
              <div key={c}
                className={`border rounded-lg px-3 py-2 cursor-pointer transition-colors text-sm font-medium ${activeCurrencies.has(c) ? 'bg-primary/10 border-primary/30' : 'hover:bg-accent/50'}`}
                onClick={() => toggleCurrency(c)}>
                {c}
                {c === defaultCurrency && <Badge variant="outline" className="ml-1 text-xs">défaut</Badge>}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">{activeCurrencies.size} devise{activeCurrencies.size > 1 ? 's' : ''} active{activeCurrencies.size > 1 ? 's' : ''}</p>
        </CardContent>
      </Card>

      {/* Automation toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Options d'automatisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {([
            { label: "Traduction automatique par IA", desc: "Traduire automatiquement les nouveaux produits dans les locales actives", value: autoTranslate, setter: setAutoTranslate },
            { label: "Détection automatique de la locale", desc: "Détecter la langue du visiteur via le navigateur et la géolocalisation", value: autoDetectLocale, setter: setAutoDetectLocale },
            { label: "Conversion automatique des devises", desc: "Afficher les prix dans la devise locale du visiteur", value: autoConvertCurrency, setter: setAutoConvertCurrency },
            { label: "Traduction des médias (ALT-text)", desc: "Traduire automatiquement les textes alternatifs des images", value: translateMedia, setter: setTranslateMedia },
            { label: "SEO multilingue", desc: "Générer des balises hreflang et meta-descriptions traduites", value: seoMultilingual, setter: setSeoMultilingual },
          ]).map(opt => (
            <div key={opt.label} className="flex items-center justify-between border rounded-lg p-4">
              <div>
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <Switch checked={opt.value} onCheckedChange={opt.setter} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder les paramètres
        </Button>
      </div>
    </div>
  );
};
