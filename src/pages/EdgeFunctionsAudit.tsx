import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet } from "lucide-react";
import { generateEdgeFunctionsAudit } from "@/scripts/audit-edge-functions";
import { toast } from "sonner";

const EdgeFunctionsAudit = () => {
  const handleGenerateAudit = () => {
    try {
      generateEdgeFunctionsAudit();
      toast.success("Fichier Excel généré avec succès !", {
        description: "Vérifiez votre dossier de téléchargements",
      });
    } catch (error) {
      toast.error("Erreur lors de la génération du fichier", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Audit Edge Functions</h1>
        <p className="text-muted-foreground">
          Générez un rapport complet de toutes les edge functions avec priorités, efforts et dépendances
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Rapport Excel détaillé
          </CardTitle>
          <CardDescription>
            Le rapport inclut pour chaque fonction :
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Statut actuel</strong> : Production / Mock/TODO / Partial / Deprecated</li>
            <li><strong>Priorité</strong> : Critique / Haute / Moyenne / Basse / À supprimer</li>
            <li><strong>Effort estimé</strong> : Heures de développement nécessaires</li>
            <li><strong>Impact business</strong> : Description de la valeur métier</li>
            <li><strong>Dépendances</strong> : Tables, services, bibliothèques requises</li>
            <li><strong>Secrets requis</strong> : API keys et credentials nécessaires</li>
            <li><strong>Complexité</strong> : Simple / Moyenne / Complexe</li>
            <li><strong>Catégorie</strong> : Intégrations / AI / Marketing / etc.</li>
            <li><strong>Notes</strong> : Détails d'implémentation et recommandations</li>
          </ul>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold">Feuilles incluses :</h4>
            <ul className="text-sm space-y-1">
              <li>📊 <strong>Edge Functions Audit</strong> : Liste complète avec tous les détails</li>
              <li>📈 <strong>Statistiques</strong> : Métriques globales et % complétion</li>
              <li>📁 <strong>Par catégorie</strong> : Feuilles séparées pour chaque catégorie</li>
            </ul>
          </div>

          <Button 
            onClick={handleGenerateAudit}
            size="lg"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Générer le rapport Excel
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Le fichier sera téléchargé dans votre dossier par défaut
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résumé rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <div className="text-3xl font-bold text-green-600">5</div>
              <div className="text-sm text-muted-foreground">Production Ready</div>
            </div>
            <div className="text-center p-4 bg-orange-500/10 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">10</div>
              <div className="text-sm text-muted-foreground">Priorité Critique</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">15</div>
              <div className="text-sm text-muted-foreground">Priorité Haute</div>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-lg">
              <div className="text-3xl font-bold text-red-600">~200</div>
              <div className="text-sm text-muted-foreground">À Compléter</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EdgeFunctionsAudit;
