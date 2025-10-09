import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Plus } from "lucide-react";
import { useInternationalization } from "@/hooks/useInternationalization";

export const GeoTargetingTab = () => {
  const { useGeoTargetingRules } = useInternationalization();
  const { data: rules, isLoading } = useGeoTargetingRules();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Ciblage Géographique
        </CardTitle>
        <CardDescription>
          Configurez des règles de ciblage par pays et région
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {rules?.length || 0} règles de ciblage actives
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle règle
          </Button>
        </div>

        {isLoading ? (
          <div className="border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : rules && rules.length > 0 ? (
          <div className="space-y-2">
            {rules.map((rule: any) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{rule.rule_name}</p>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Priorité: {rule.priority}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Pays: {rule.countries?.join(', ') || 'Aucun'}</p>
                  <p>Devise par défaut: {rule.default_currency || 'Non définie'}</p>
                  <p>Locale par défaut: {rule.default_locale || 'Non définie'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg p-6 text-center text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune règle de ciblage configurée</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};