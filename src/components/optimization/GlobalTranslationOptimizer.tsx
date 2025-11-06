import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useGlobalTranslation } from "@/hooks/useGlobalTranslation";
import { Globe, Languages, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const AVAILABLE_LOCALES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export const GlobalTranslationOptimizer = () => {
  const {
    auditResults,
    isAuditing,
    isOptimizing,
    optimizationProgress,
    auditTranslations,
    optimizeTranslations,
  } = useGlobalTranslation();

  const [selectedLocales, setSelectedLocales] = useState<string[]>(['en', 'es', 'de']);

  const handleLocaleToggle = (locale: string) => {
    setSelectedLocales(prev =>
      prev.includes(locale)
        ? prev.filter(l => l !== locale)
        : [...prev, locale]
    );
  };

  const totalUntranslated = auditResults
    ? auditResults.products.untranslated +
      auditResults.pages.untranslated +
      auditResults.blog.untranslated +
      auditResults.categories.untranslated
    : 0;

  const translationScore = auditResults
    ? Math.round(
        ((auditResults.products.translated +
          auditResults.pages.translated +
          auditResults.blog.translated +
          auditResults.categories.translated) /
          (auditResults.products.total +
            auditResults.pages.total +
            auditResults.blog.total +
            auditResults.categories.total)) *
          100
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Languages className="h-8 w-8 text-primary" />
            Optimisation Multi-Langues Globale
          </h2>
          <p className="text-muted-foreground mt-2">
            Traduisez automatiquement tous vos contenus en plusieurs langues avec l'IA
          </p>
        </div>
        <Button
          onClick={() => auditTranslations(selectedLocales)}
          disabled={isAuditing || selectedLocales.length === 0}
          size="lg"
        >
          {isAuditing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Audit en cours...
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              Auditer les Traductions
            </>
          )}
        </Button>
      </div>

      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Langues Cibles</CardTitle>
          <CardDescription>
            Sélectionnez les langues dans lesquelles vous souhaitez traduire vos contenus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {AVAILABLE_LOCALES.map((locale) => (
              <div
                key={locale.code}
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                onClick={() => handleLocaleToggle(locale.code)}
              >
                <Checkbox
                  id={locale.code}
                  checked={selectedLocales.includes(locale.code)}
                  onCheckedChange={() => handleLocaleToggle(locale.code)}
                />
                <label
                  htmlFor={locale.code}
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <span className="text-xl">{locale.flag}</span>
                  <span>{locale.name}</span>
                </label>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {selectedLocales.length} langue(s) sélectionnée(s)
          </p>
        </CardContent>
      </Card>

      {/* Audit Results */}
      {auditResults && (
        <>
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle>Score de Traduction Global</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-5xl font-bold text-primary">{translationScore}%</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Contenus traduits dans les langues sélectionnées
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-destructive">
                      {totalUntranslated}
                    </p>
                    <p className="text-sm text-muted-foreground">éléments à traduire</p>
                  </div>
                </div>
                <Progress value={translationScore} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Produits</span>
                  <Badge variant={auditResults.products.untranslated > 0 ? "destructive" : "default"}>
                    {auditResults.products.total} total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Traduits</span>
                    </div>
                    <span className="font-semibold">{auditResults.products.translated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm">Non traduits</span>
                    </div>
                    <span className="font-semibold text-destructive">
                      {auditResults.products.untranslated}
                    </span>
                  </div>
                  <Progress
                    value={(auditResults.products.translated / auditResults.products.total) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pages</span>
                  <Badge variant={auditResults.pages.untranslated > 0 ? "destructive" : "default"}>
                    {auditResults.pages.total} total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Traduits</span>
                    </div>
                    <span className="font-semibold">{auditResults.pages.translated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm">Non traduits</span>
                    </div>
                    <span className="font-semibold text-destructive">
                      {auditResults.pages.untranslated}
                    </span>
                  </div>
                  <Progress
                    value={(auditResults.pages.translated / auditResults.pages.total) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Blog */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Articles de Blog</span>
                  <Badge variant={auditResults.blog.untranslated > 0 ? "destructive" : "default"}>
                    {auditResults.blog.total} total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Traduits</span>
                    </div>
                    <span className="font-semibold">{auditResults.blog.translated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm">Non traduits</span>
                    </div>
                    <span className="font-semibold text-destructive">
                      {auditResults.blog.untranslated}
                    </span>
                  </div>
                  <Progress
                    value={(auditResults.blog.translated / auditResults.blog.total) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Catégories</span>
                  <Badge variant={auditResults.categories.untranslated > 0 ? "destructive" : "default"}>
                    {auditResults.categories.total} total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Traduits</span>
                    </div>
                    <span className="font-semibold">{auditResults.categories.translated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm">Non traduits</span>
                    </div>
                    <span className="font-semibold text-destructive">
                      {auditResults.categories.untranslated}
                    </span>
                  </div>
                  <Progress
                    value={(auditResults.categories.translated / auditResults.categories.total) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Optimize Button */}
          {totalUntranslated > 0 && (
            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Traduire automatiquement tous les contenus
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {totalUntranslated} éléments seront traduits en {selectedLocales.length}{' '}
                      langue(s) avec l'IA
                    </p>
                  </div>
                  <Button
                    onClick={() => optimizeTranslations(selectedLocales)}
                    disabled={isOptimizing}
                    size="lg"
                  >
                    {isOptimizing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Optimisation {optimizationProgress}%
                      </>
                    ) : (
                      <>
                        <Languages className="mr-2 h-4 w-4" />
                        Traduire Tout
                      </>
                    )}
                  </Button>
                </div>
                {isOptimizing && (
                  <div className="mt-4">
                    <Progress value={optimizationProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Traduction en cours... {optimizationProgress}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
