import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Route, Plus, ArrowRight } from 'lucide-react';

export function RoutingRulesManager() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Règles de Routing</CardTitle>
              <CardDescription>
                Définissez comment router vos commandes automatiquement
              </CardDescription>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Règle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Route className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Aucune règle configurée</p>
            <p className="text-sm text-muted-foreground mt-2">
              Créez des règles pour router automatiquement les commandes vers les bons fournisseurs
            </p>
            <Button className="mt-4" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première règle
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comment fonctionnent les règles de routing ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1">Définir les conditions</h4>
              <p className="text-sm text-muted-foreground">
                Par produit, catégorie, zone de livraison ou niveau de stock
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1">Choisir le fournisseur</h4>
              <p className="text-sm text-muted-foreground">
                Fournisseur principal + fournisseurs de secours
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1">Automatisation complète</h4>
              <p className="text-sm text-muted-foreground">
                Les commandes sont routées automatiquement selon vos règles
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
