/**
 * FeedURLImportPage - Page dédiée à l'import par URL Feed
 * Route: /import/feed-url
 */
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Link2, HelpCircle } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { FeedURLImporter } from '@/components/import/FeedURLImporter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function FeedURLImportPage() {
  const navigate = useNavigate();

  const handleImportComplete = (result: { success: boolean; count: number; jobId?: string }) => {
    if (result.success) {
      // Navigate to manage page after successful import
      setTimeout(() => {
        navigate('/products/import/manage');
      }, 2000);
    }
  };

  return (
    <>
      <Helmet>
        <title>Import Feed URL | ShopOpti</title>
        <meta name="description" content="Importez des produits depuis une URL de flux CSV, XML ou JSON" />
      </Helmet>

      <ChannablePageWrapper
        title="Import Feed URL"
        subtitle="Import Universel"
        description="Importez vos produits depuis n'importe quelle URL de flux : CSV Shopify, XML, JSON, etc."
        heroImage="import"
        badge={{ label: "Universel", icon: Link2 }}
        actions={
          <Button variant="ghost" onClick={() => navigate('/import')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        }
      >
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main importer */}
          <div className="lg:col-span-2">
            <FeedURLImporter onImportComplete={handleImportComplete} />
          </div>

          {/* Help sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Comment ça marche ?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Badge className="mt-0.5">1</Badge>
                    <div>
                      <p className="font-medium">Collez l'URL du flux</p>
                      <p className="text-muted-foreground">URL directe vers un fichier CSV, XML ou JSON</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="mt-0.5">2</Badge>
                    <div>
                      <p className="font-medium">Analysez le contenu</p>
                      <p className="text-muted-foreground">Détection automatique du format et prévisualisation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="mt-0.5">3</Badge>
                    <div>
                      <p className="font-medium">Importez</p>
                      <p className="text-muted-foreground">Les produits sont ajoutés à votre catalogue</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Formats supportés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>CSV Shopify</span>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">Recommandé</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>XML / RSS</span>
                  <Badge variant="outline">Supporté</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>JSON API</span>
                  <Badge variant="outline">Supporté</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Google Shopping</span>
                  <Badge variant="outline">Supporté</Badge>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Link2 className="h-4 w-4" />
              <AlertTitle>Exemple Matterhorn</AlertTitle>
              <AlertDescription className="text-xs mt-2">
                <code className="break-all bg-muted p-1 rounded text-[10px]">
                  https://lingeriematterhorn.fr/xmldata/products_full.php?type=shopify&category_id=223
                </code>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </ChannablePageWrapper>
    </>
  );
}
