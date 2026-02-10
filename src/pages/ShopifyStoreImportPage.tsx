import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function ShopifyStoreImportPage() {
  const [storeUrl, setStoreUrl] = useState("");
  const [importVariants, setImportVariants] = useState(true);
  const [importCategories, setImportCategories] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();

  const validateShopifyUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('myshopify.com') || urlObj.hostname.includes('.com');
    } catch {
      return false;
    }
  };

  const handleImport = async () => {
    if (!storeUrl) {
      toast({ title: "❌ URL manquante", description: "Veuillez entrer l'URL d'une boutique Shopify", variant: "destructive" });
      return;
    }
    if (!validateShopifyUrl(storeUrl)) {
      toast({ title: "❌ URL invalide", description: "L'URL doit être une boutique Shopify valide (ex: https://store.myshopify.com)", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('shopify-store-import', {
        body: { storeUrl, importVariants, importCategories }
      });
      if (error) throw error;
      setImportResult(data);
      if (data.success) {
        toast({ title: "✅ Import réussi", description: `${data.imported.products} produits et ${data.imported.variants} variantes importés avec succès` });
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: "❌ Erreur d'import", description: error instanceof Error ? error.message : "Impossible d'importer les produits", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ChannablePageWrapper
      title="Import Shopify"
      description="Importez des produits depuis n'importe quelle boutique Shopify publique"
      heroImage="import"
      badge={{ label: 'Shopify', icon: ShoppingBag }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Configuration de l'import</CardTitle>
          <CardDescription>Entrez l'URL de la boutique Shopify et choisissez les options d'import</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="storeUrl">URL de la boutique Shopify</Label>
            <Input id="storeUrl" type="url" placeholder="https://example.myshopify.com" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} disabled={isImporting} />
            <p className="text-xs text-muted-foreground">L'URL publique de la boutique Shopify (ex: https://store.myshopify.com)</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="importVariants">Importer les variantes</Label>
                <p className="text-xs text-muted-foreground">Importe toutes les variantes des produits (tailles, couleurs, etc.)</p>
              </div>
              <Switch id="importVariants" checked={importVariants} onCheckedChange={setImportVariants} disabled={isImporting} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="importCategories">Importer les catégories</Label>
                <p className="text-xs text-muted-foreground">Organise les produits par leurs types/catégories d'origine</p>
              </div>
              <Switch id="importCategories" checked={importCategories} onCheckedChange={setImportCategories} disabled={isImporting} />
            </div>
          </div>

          <Button onClick={handleImport} disabled={isImporting || !storeUrl} className="w-full" size="lg">
            {isImporting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Import en cours...</>) : (<><Download className="h-4 w-4 mr-2" />Lancer l'import</>)}
          </Button>
        </CardContent>
      </Card>

      {isImporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Import en cours...</span>
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {importResult && importResult.success && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Import terminé avec succès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{importResult.imported.products}</p>
                <p className="text-sm text-muted-foreground">Produits importés</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{importResult.imported.variants}</p>
                <p className="text-sm text-muted-foreground">Variantes importées</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{importResult.imported.total}</p>
                <p className="text-sm text-muted-foreground">Total importé</p>
              </div>
            </div>
            {importResult.errors > 0 && (
              <div className="flex items-center gap-2 text-yellow-600 bg-yellow-500/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{importResult.errors} erreur(s) rencontrée(s) durant l'import</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{importResult.message}</p>
            <Button onClick={() => window.location.href = '/products'} variant="outline" className="w-full">
              Voir les produits importés
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">💡 Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Entrez l'URL d'une boutique Shopify publique</p>
          <p>2. Choisissez d'importer les variantes et catégories</p>
          <p>3. Lancez l'import - tous les produits seront ajoutés à votre catalogue</p>
          <p>4. Les produits importés incluent : titres, descriptions, prix, images, tags, SKU et disponibilité</p>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  );
}
