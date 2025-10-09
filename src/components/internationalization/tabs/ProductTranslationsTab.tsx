import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages, Plus } from "lucide-react";

export const ProductTranslationsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Traductions de Produits
        </CardTitle>
        <CardDescription>
          Gérez les traductions automatiques et manuelles de vos produits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Traductions automatiques par IA disponibles pour tous vos produits
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Traduire des produits
          </Button>
        </div>

        <div className="border rounded-lg p-6 text-center text-muted-foreground">
          <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Sélectionnez des produits pour commencer la traduction automatique</p>
        </div>
      </CardContent>
    </Card>
  );
};