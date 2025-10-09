import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { useInternationalization } from "@/hooks/useInternationalization";

export const LocaleSettingsTab = () => {
  const { useLocaleSettings } = useInternationalization();
  const { data: settings, isLoading } = useLocaleSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Paramètres de Localisation
        </CardTitle>
        <CardDescription>
          Configurez les paramètres par défaut pour votre boutique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : settings ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Locale par défaut</p>
                <p className="text-2xl font-bold">{settings.default_locale}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Devise par défaut</p>
                <p className="text-2xl font-bold">{settings.default_currency}</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <p className="font-medium">Locales supportées</p>
              <p className="text-sm text-muted-foreground">
                {settings.supported_locales?.join(', ') || 'Aucune'}
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <p className="font-medium">Devises supportées</p>
              <p className="text-sm text-muted-foreground">
                {settings.supported_currencies?.join(', ') || 'Aucune'}
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <p className="font-medium">Options</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>✓ Traduction automatique: {settings.auto_translate ? 'Activée' : 'Désactivée'}</p>
                <p>✓ Détection automatique de la locale: {settings.auto_detect_locale ? 'Activée' : 'Désactivée'}</p>
                <p>✓ Détection automatique de la devise: {settings.auto_detect_currency ? 'Activée' : 'Désactivée'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-6 text-center text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun paramètre configuré</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};