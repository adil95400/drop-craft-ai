import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Route, Plus, ArrowRight, ArrowDown } from 'lucide-react';

export function RoutingRulesManager() {
  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base md:text-lg">Règles de Routing</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Définissez comment router vos commandes
              </CardDescription>
            </div>
            <Button size="sm" className="w-full xs:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Nouvelle </span>Règle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="text-center py-8 md:py-12">
            <Route className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-base md:text-lg font-medium">Aucune règle configurée</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Créez des règles pour router automatiquement les commandes vers les bons fournisseurs
            </p>
            <Button className="mt-4" variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première règle
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Comment ça fonctionne ?</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm md:text-base shrink-0">
              1
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm md:text-base mb-1">Définir les conditions</h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                Par produit, catégorie, zone ou stock
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center pl-4 md:pl-5">
            <ArrowDown className="w-5 h-5 md:hidden text-muted-foreground" />
            <ArrowRight className="w-6 h-6 hidden md:block text-muted-foreground" />
          </div>

          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm md:text-base shrink-0">
              2
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm md:text-base mb-1">Choisir le fournisseur</h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                Principal + fournisseurs de secours
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center pl-4 md:pl-5">
            <ArrowDown className="w-5 h-5 md:hidden text-muted-foreground" />
            <ArrowRight className="w-6 h-6 hidden md:block text-muted-foreground" />
          </div>

          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm md:text-base shrink-0">
              3
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm md:text-base mb-1">Automatisation complète</h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                Commandes routées automatiquement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
