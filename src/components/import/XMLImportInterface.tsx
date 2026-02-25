import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { productionLogger } from "@/utils/productionLogger";
import { supabase } from '@/integrations/supabase/client';

interface XMLMapping {
  productPath: string;
  fields: { [key: string]: string };
}

interface XMLImportResult {
  totalProducts: number;
  successfulImports: number;
  failedImports: number;
  errors: string[];
  products: any[];
}

const XML_PRESETS = {
  'google-shopping': {
    name: 'Google Shopping',
    description: 'Format XML standard Google Shopping Feed',
    mapping: {
      productPath: '//item',
      fields: {
        'name': 'title/text()',
        'description': 'description/text()',
        'price': 'price/text()',
        'image_urls': 'image_link/text()',
        'category': 'product_type/text()',
        'brand': 'brand/text()',
        'sku': 'id/text()',
        'gtin': 'gtin/text()',
        'availability': 'availability/text()',
        'condition': 'condition/text()'
      }
    }
  },
  'lengow': {
    name: 'Lengow',
    description: 'Format XML Lengow Marketplace',
    mapping: {
      productPath: '//product',
      fields: {
        'name': 'name/text()',
        'description': 'description/text()',
        'price': 'price/text()',
        'image_urls': 'image/text()',
        'category': 'category/text()',
        'brand': 'brand/text()',
        'sku': 'sku/text()',
        'stock_quantity': 'quantity/text()',
        'weight': 'weight/text()'
      }
    }
  },
  'custom': {
    name: 'Configuration personnalisée',
    description: 'Définissez votre propre mapping XML',
    mapping: { productPath: '', fields: {} }
  }
};

interface XMLImportInterfaceProps {
  onImportComplete: (result: XMLImportResult) => void;
  onCancel: () => void;
}

export const XMLImportInterface: React.FC<XMLImportInterfaceProps> = ({
  onImportComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const [xmlUrl, setXmlUrl] = useState('');
  const [xmlContent, setXmlContent] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof XML_PRESETS>('google-shopping');
  const [customMapping, setCustomMapping] = useState<XMLMapping>(XML_PRESETS.custom.mapping);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importMethod, setImportMethod] = useState<'url' | 'file' | 'paste'>('url');
  const [xmlPreview, setXmlPreview] = useState<any>(null);

  const currentMapping = selectedPreset === 'custom' ? customMapping : XML_PRESETS[selectedPreset].mapping;

  const validateXML = (xmlString: string): boolean => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');
      return !doc.querySelector('parsererror');
    } catch { return false; }
  };

  const parseXMLPreview = (xmlString: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');
      const productNodes = doc.evaluate(
        currentMapping.productPath || '//product | //item',
        doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
      );
      const samples = [];
      const maxSamples = Math.min(3, productNodes.snapshotLength);
      for (let i = 0; i < maxSamples; i++) {
        const productNode = productNodes.snapshotItem(i);
        if (productNode) {
          const sample: any = {};
          Object.entries(currentMapping.fields).forEach(([field, xpath]) => {
            try {
              const result = doc.evaluate(xpath, productNode, null, XPathResult.STRING_TYPE, null);
              sample[field] = result.stringValue;
            } catch { sample[field] = ''; }
          });
          samples.push(sample);
        }
      }
      return { totalProducts: productNodes.snapshotLength, samples };
    } catch (error) {
      productionLogger.error(`XML parsing error: ${error}`);
      return null;
    }
  };

  const fetchXMLFromUrl = async (url: string): Promise<string> => {
    // Use edge function to fetch XML to avoid CORS
    const { data, error } = await supabase.functions.invoke('fetch-xml-feed', {
      body: { url }
    });

    if (error || !data?.xml) {
      // Fallback: try direct fetch
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
      } catch {
        throw new Error('Impossible de récupérer le flux XML. Vérifiez l\'URL.');
      }
    }
    return data.xml;
  };

  const handlePreview = async () => {
    let xmlString = '';
    try {
      setIsLoading(true);
      setProgress(20);
      if (importMethod === 'url' && xmlUrl) {
        xmlString = await fetchXMLFromUrl(xmlUrl);
      } else if (importMethod === 'paste' && xmlContent) {
        xmlString = xmlContent;
      }
      setProgress(50);
      if (!validateXML(xmlString)) throw new Error('XML invalide ou mal formé');
      setProgress(80);
      const preview = parseXMLPreview(xmlString);
      setXmlPreview(preview);
      setProgress(100);
      toast({ title: "Aperçu généré", description: `${preview?.totalProducts || 0} produits détectés` });
    } catch (error) {
      toast({ title: "Erreur de prévisualisation", description: error instanceof Error ? error.message : "Erreur inconnue", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!xmlPreview) {
      toast({ title: "Prévisualisation manquante", description: "Veuillez d'abord prévisualiser le XML", variant: "destructive" });
      return;
    }
    try {
      setIsLoading(true);
      setProgress(0);

      // Import products via edge function or direct insert
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const products = xmlPreview.samples.map((sample: any) => ({
        user_id: user.id,
        name: sample.name || sample.title || 'Produit importé',
        description: sample.description || '',
        price: parseFloat(sample.price?.replace(/[^0-9.]/g, '') || '0'),
        sku: sample.sku || null,
        image_url: sample.image_urls || null,
        category: sample.category || null,
        brand: sample.brand || null,
        source: 'xml_import',
        status: 'draft'
      }));

      setProgress(50);

      const { data: inserted, error } = await supabase
        .from('products')
        .insert(products)
        .select();

      if (error) throw error;

      setProgress(100);

      const result: XMLImportResult = {
        totalProducts: xmlPreview.totalProducts,
        successfulImports: inserted?.length || 0,
        failedImports: xmlPreview.totalProducts - (inserted?.length || 0),
        errors: [],
        products: inserted || []
      };

      onImportComplete(result);
      toast({ title: "Import terminé", description: `${result.successfulImports}/${result.totalProducts} produits importés` });
    } catch (error) {
      toast({ title: "Erreur d'import", description: error instanceof Error ? error.message : "Erreur inconnue", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" /> Import XML
          </h2>
          <p className="text-muted-foreground">Importez vos produits depuis un flux XML</p>
        </div>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
      </div>

      <Tabs defaultValue="source" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="source">Source XML</TabsTrigger>
          <TabsTrigger value="mapping">Configuration</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
        </TabsList>

        <TabsContent value="source" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Source du fichier XML</CardTitle>
              <CardDescription>Choisissez comment fournir votre fichier XML</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button size="sm" variant={importMethod === 'url' ? 'default' : 'outline'} onClick={() => setImportMethod('url')}>URL</Button>
                <Button size="sm" variant={importMethod === 'file' ? 'default' : 'outline'} onClick={() => setImportMethod('file')}>Fichier</Button>
                <Button size="sm" variant={importMethod === 'paste' ? 'default' : 'outline'} onClick={() => setImportMethod('paste')}>Coller</Button>
              </div>
              {importMethod === 'url' && (
                <div className="space-y-2">
                  <Label htmlFor="xml-url">URL du flux XML</Label>
                  <Input id="xml-url" type="url" value={xmlUrl} onChange={(e) => setXmlUrl(e.target.value)} placeholder="https://example.com/feed.xml" />
                </div>
              )}
              {importMethod === 'file' && (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Glissez-déposez votre fichier XML ici</p>
                  <Button variant="outline" className="mt-2">Parcourir les fichiers</Button>
                </div>
              )}
              {importMethod === 'paste' && (
                <div className="space-y-2">
                  <Label htmlFor="xml-content">Contenu XML</Label>
                  <Textarea id="xml-content" value={xmlContent} onChange={(e) => setXmlContent(e.target.value)} placeholder="Collez votre contenu XML ici..." rows={10} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" /> Configuration du mapping</CardTitle>
              <CardDescription>Configurez comment mapper les champs XML vers vos champs produits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Preset de configuration</Label>
                <Select value={selectedPreset} onValueChange={(value: keyof typeof XML_PRESETS) => setSelectedPreset(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(XML_PRESETS).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        <div><div className="font-medium">{preset.name}</div><div className="text-xs text-muted-foreground">{preset.description}</div></div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chemin XPath des produits</Label>
                <Input value={currentMapping.productPath} onChange={(e) => { if (selectedPreset === 'custom') setCustomMapping({ ...customMapping, productPath: e.target.value }); }} placeholder="//item ou //product" disabled={selectedPreset !== 'custom'} />
              </div>
              <div className="space-y-3">
                <Label>Mapping des champs</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(currentMapping.fields).map(([field, xpath]) => (
                    <div key={field} className="flex gap-2 items-center">
                      <Badge variant="outline" className="min-w-0 flex-shrink-0 text-xs">{field}</Badge>
                      <Input value={xpath} onChange={(e) => { if (selectedPreset === 'custom') setCustomMapping({ ...customMapping, fields: { ...customMapping.fields, [field]: e.target.value } }); }} placeholder="XPath expression" className="text-xs" disabled={selectedPreset !== 'custom'} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {!xmlPreview ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium">Aucun aperçu disponible</h3>
                    <p className="text-sm text-muted-foreground">Configurez votre source XML et cliquez sur "Prévisualiser"</p>
                  </div>
                  <Button onClick={handlePreview} disabled={isLoading}>{isLoading ? 'Chargement...' : 'Prévisualiser'}</Button>
                </div>
                {isLoading && <div className="mt-4"><Progress value={progress} /></div>}
              </CardContent>
            </Card>
          ) : (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription><strong>{xmlPreview.totalProducts} produits</strong> détectés dans le flux XML</AlertDescription>
              </Alert>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Aperçu des produits</h3>
                {xmlPreview.samples.map((product: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(product).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground">{key}: </span>
                            <span className="font-medium">{String(value).substring(0, 100)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setXmlPreview(null)}>Retour</Button>
                <Button onClick={handleImport} disabled={isLoading}>
                  {isLoading ? 'Import en cours...' : `Importer ${xmlPreview.totalProducts} produits`}
                </Button>
              </div>
              {isLoading && <Progress value={progress} />}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
