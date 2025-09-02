import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, Check, X, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CSVColumn {
  index: number;
  name: string;
  sample: string;
  type?: string;
}

interface ProductField {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'url' | 'array' | 'boolean';
  description: string;
}

interface ColumnMapping {
  csvColumn: number;
  productField: string;
  confidence?: number;
}

const PRODUCT_FIELDS: ProductField[] = [
  // Champs essentiels
  { key: 'name', label: 'Nom du produit', required: true, type: 'text', description: 'Titre principal du produit' },
  { key: 'description', label: 'Description', required: false, type: 'text', description: 'Description détaillée' },
  { key: 'price', label: 'Prix', required: true, type: 'number', description: 'Prix de vente TTC' },
  { key: 'cost_price', label: 'Prix d\'achat', required: false, type: 'number', description: 'Prix d\'achat HT' },
  { key: 'sku', label: 'SKU', required: false, type: 'text', description: 'Référence unique' },
  { key: 'ean', label: 'EAN/GTIN', required: false, type: 'text', description: 'Code-barres international' },
  
  // Catégorisation
  { key: 'category', label: 'Catégorie', required: false, type: 'text', description: 'Catégorie principale' },
  { key: 'sub_category', label: 'Sous-catégorie', required: false, type: 'text', description: 'Sous-catégorie' },
  { key: 'brand', label: 'Marque', required: false, type: 'text', description: 'Marque du produit' },
  { key: 'tags', label: 'Tags', required: false, type: 'array', description: 'Mots-clés séparés par des virgules' },
  
  // Dimensions et poids
  { key: 'weight', label: 'Poids', required: false, type: 'number', description: 'Poids en kg' },
  { key: 'length', label: 'Longueur', required: false, type: 'number', description: 'Longueur en cm' },
  { key: 'width', label: 'Largeur', required: false, type: 'number', description: 'Largeur en cm' },
  { key: 'height', label: 'Hauteur', required: false, type: 'number', description: 'Hauteur en cm' },
  
  // Stock et logistique
  { key: 'stock_quantity', label: 'Stock', required: false, type: 'number', description: 'Quantité en stock' },
  { key: 'min_order', label: 'Commande min', required: false, type: 'number', description: 'Quantité minimum' },
  { key: 'shipping_cost', label: 'Frais de port', required: false, type: 'number', description: 'Coût livraison' },
  { key: 'shipping_time', label: 'Délai livraison', required: false, type: 'text', description: 'Délai de livraison' },
  
  // Images et médias
  { key: 'image_urls', label: 'URLs Images', required: false, type: 'array', description: 'URLs des images séparées par des virgules' },
  { key: 'video_urls', label: 'URLs Vidéos', required: false, type: 'array', description: 'URLs des vidéos' },
  
  // SEO
  { key: 'seo_title', label: 'Titre SEO', required: false, type: 'text', description: 'Titre optimisé SEO' },
  { key: 'seo_description', label: 'Description SEO', required: false, type: 'text', description: 'Meta description' },
  { key: 'seo_keywords', label: 'Mots-clés SEO', required: false, type: 'array', description: 'Mots-clés pour le référencement' },
  
  // Variantes
  { key: 'color', label: 'Couleur', required: false, type: 'text', description: 'Couleur du produit' },
  { key: 'size', label: 'Taille', required: false, type: 'text', description: 'Taille du produit' },
  { key: 'material', label: 'Matériau', required: false, type: 'text', description: 'Matériau principal' },
  { key: 'style', label: 'Style', required: false, type: 'text', description: 'Style ou modèle' },
  
  // Fournisseur
  { key: 'supplier_name', label: 'Fournisseur', required: false, type: 'text', description: 'Nom du fournisseur' },
  { key: 'supplier_sku', label: 'SKU Fournisseur', required: false, type: 'text', description: 'Référence fournisseur' },
  { key: 'supplier_url', label: 'URL Fournisseur', required: false, type: 'url', description: 'Lien vers le produit' }
];

interface CSVMappingInterfaceProps {
  csvData: {
    headers: string[];
    rows: string[][];
  };
  onMappingComplete: (mapping: ColumnMapping[]) => void;
  onCancel: () => void;
}

export const CSVMappingInterface: React.FC<CSVMappingInterfaceProps> = ({
  csvData,
  onMappingComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);
  const [autoSuggestions, setAutoSuggestions] = useState<ColumnMapping[]>([]);

  // Auto-detect potential mappings
  React.useEffect(() => {
    const suggestions = detectMappings(csvData.headers);
    setAutoSuggestions(suggestions);
    setMappings(suggestions);
  }, [csvData.headers]);

  const detectMappings = (headers: string[]): ColumnMapping[] => {
    const suggestions: ColumnMapping[] = [];
    
    headers.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Patterns de détection automatique
      const patterns = {
        'name': ['nom', 'title', 'name', 'produit', 'product', 'titre'],
        'description': ['description', 'desc', 'details', 'contenu'],
        'price': ['prix', 'price', 'cost', 'cout', 'montant', 'tarif'],
        'sku': ['sku', 'ref', 'reference', 'code', 'id'],
        'ean': ['ean', 'gtin', 'barcode', 'upc', 'isbn'],
        'category': ['categorie', 'category', 'cat', 'famille'],
        'brand': ['marque', 'brand', 'fabricant', 'manufacturer'],
        'stock_quantity': ['stock', 'quantity', 'qty', 'quantite', 'inventaire'],
        'weight': ['poids', 'weight', 'masse'],
        'image_urls': ['image', 'img', 'photo', 'picture', 'url_image']
      };
      
      for (const [field, keywords] of Object.entries(patterns)) {
        if (keywords.some(keyword => normalizedHeader.includes(keyword))) {
          suggestions.push({
            csvColumn: index,
            productField: field,
            confidence: calculateConfidence(normalizedHeader, keywords)
          });
          break;
        }
      }
    });
    
    return suggestions;
  };

  const calculateConfidence = (header: string, keywords: string[]): number => {
    const exactMatch = keywords.find(k => header === k);
    if (exactMatch) return 95;
    
    const partialMatch = keywords.find(k => header.includes(k));
    if (partialMatch) return 80;
    
    return 60;
  };

  const handleDragStart = (columnIndex: number) => {
    setDraggedColumn(columnIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, productField: string) => {
    e.preventDefault();
    
    if (draggedColumn === null) return;
    
    // Remove existing mapping for this field
    const newMappings = mappings.filter(m => m.productField !== productField);
    
    // Add new mapping
    newMappings.push({
      csvColumn: draggedColumn,
      productField,
      confidence: 100 // Manual mapping = high confidence
    });
    
    setMappings(newMappings);
    setDraggedColumn(null);
    
    toast({
      title: "Mapping ajouté",
      description: `Colonne "${csvData.headers[draggedColumn]}" mappée vers "${productField}"`,
    });
  };

  const removeMapping = (productField: string) => {
    setMappings(mappings.filter(m => m.productField !== productField));
  };

  const applyAutoSuggestions = () => {
    setMappings(autoSuggestions);
    toast({
      title: "Suggestions appliquées",
      description: `${autoSuggestions.length} mappings automatiques appliqués`,
    });
  };

  const validateMappings = (): boolean => {
    const requiredFields = PRODUCT_FIELDS.filter(f => f.required);
    const mappedRequiredFields = requiredFields.filter(field => 
      mappings.some(m => m.productField === field.key)
    );
    
    return mappedRequiredFields.length === requiredFields.length;
  };

  const handleComplete = () => {
    if (!validateMappings()) {
      toast({
        title: "Mappings incomplets",
        description: "Veuillez mapper tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }
    
    onMappingComplete(mappings);
  };

  const getMappingForField = (fieldKey: string) => {
    return mappings.find(m => m.productField === fieldKey);
  };

  const getMappingForColumn = (columnIndex: number) => {
    return mappings.find(m => m.csvColumn === columnIndex);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mapping des colonnes CSV</h2>
          <p className="text-muted-foreground">
            Associez les colonnes de votre fichier CSV aux champs produits
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={applyAutoSuggestions}>
            <Download className="w-4 h-4 mr-2" />
            Auto-suggestions
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={handleComplete} disabled={!validateMappings()}>
            <Check className="w-4 h-4 mr-2" />
            Confirmer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonnes CSV */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Colonnes CSV ({csvData.headers.length})
            </CardTitle>
            <CardDescription>
              Glissez les colonnes vers les champs produits à droite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {csvData.headers.map((header, index) => {
                  const mapping = getMappingForColumn(index);
                  const sampleData = csvData.rows[0]?.[index] || '';
                  
                  return (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      className={`p-3 border rounded-lg cursor-move hover:bg-muted/50 transition-colors ${
                        mapping ? 'border-green-500 bg-green-50' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{header}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            Ex: {sampleData}
                          </div>
                        </div>
                        {mapping && (
                          <Badge variant="secondary" className="text-xs">
                            {PRODUCT_FIELDS.find(f => f.key === mapping.productField)?.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Champs Produits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              Champs Produits
            </CardTitle>
            <CardDescription>
              Zones de dépôt pour les colonnes CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {PRODUCT_FIELDS.map((field) => {
                  const mapping = getMappingForField(field.key);
                  
                  return (
                    <div
                      key={field.key}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, field.key)}
                      className={`p-3 border-2 border-dashed rounded-lg transition-all ${
                        mapping 
                          ? 'border-green-500 bg-green-50' 
                          : draggedColumn !== null 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{field.label}</span>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">
                                Obligatoire
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {field.description}
                          </p>
                          {mapping && (
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {csvData.headers[mapping.csvColumn]}
                              </Badge>
                              {mapping.confidence && (
                                <span className="text-xs text-muted-foreground">
                                  {mapping.confidence}% confiance
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {mapping && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMapping(field.key)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Résumé des mappings */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Colonnes mappées:</strong> {mappings.length} / {csvData.headers.length}
            </div>
            <div>
              <strong>Champs obligatoires:</strong> {
                PRODUCT_FIELDS.filter(f => f.required && getMappingForField(f.key)).length
              } / {PRODUCT_FIELDS.filter(f => f.required).length}
            </div>
          </div>
          
          {!validateMappings() && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                ⚠️ Mappez tous les champs obligatoires pour continuer
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};