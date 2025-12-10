// SMART FIELD MAPPER - Mapping automatique intelligent façon Channable
import { memo, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, 
  Check, 
  X, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Save,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Champs cibles ShopOpti
const SHOPOPTI_FIELDS = [
  { id: 'name', label: 'Nom du produit', required: true, type: 'string' },
  { id: 'description', label: 'Description', required: false, type: 'text' },
  { id: 'price', label: 'Prix de vente', required: true, type: 'number' },
  { id: 'cost_price', label: 'Prix d\'achat', required: false, type: 'number' },
  { id: 'sku', label: 'SKU', required: false, type: 'string' },
  { id: 'ean', label: 'EAN / GTIN', required: false, type: 'string' },
  { id: 'stock', label: 'Stock', required: false, type: 'number' },
  { id: 'category', label: 'Catégorie', required: false, type: 'string' },
  { id: 'brand', label: 'Marque', required: false, type: 'string' },
  { id: 'images', label: 'Images (URLs)', required: false, type: 'array' },
  { id: 'weight', label: 'Poids (kg)', required: false, type: 'number' },
  { id: 'dimensions', label: 'Dimensions', required: false, type: 'string' },
  { id: 'tags', label: 'Tags', required: false, type: 'array' },
  { id: 'meta_title', label: 'Titre SEO', required: false, type: 'string' },
  { id: 'meta_description', label: 'Description SEO', required: false, type: 'text' },
];

// Synonymes pour le mapping automatique
const FIELD_SYNONYMS: Record<string, string[]> = {
  name: ['title', 'product_name', 'nom', 'titre', 'product_title', 'item_name', 'libelle'],
  description: ['desc', 'product_description', 'details', 'content', 'long_description', 'body'],
  price: ['prix', 'sale_price', 'retail_price', 'selling_price', 'unit_price', 'price_incl_tax'],
  cost_price: ['cost', 'purchase_price', 'wholesale_price', 'prix_achat', 'supplier_price', 'buy_price'],
  sku: ['reference', 'ref', 'product_id', 'item_id', 'article_number', 'code'],
  ean: ['gtin', 'barcode', 'upc', 'isbn', 'ean13', 'code_barre'],
  stock: ['quantity', 'qty', 'inventory', 'stock_quantity', 'disponible', 'available'],
  category: ['categorie', 'product_category', 'type', 'collection', 'famille'],
  brand: ['marque', 'manufacturer', 'vendor', 'supplier', 'fabricant'],
  images: ['image', 'image_url', 'photo', 'picture', 'img', 'image_link', 'main_image'],
  weight: ['poids', 'weight_kg', 'mass', 'shipping_weight'],
  tags: ['keywords', 'labels', 'etiquettes', 'mots_cles'],
  meta_title: ['seo_title', 'page_title', 'titre_seo'],
  meta_description: ['seo_description', 'meta_desc', 'description_seo'],
};

interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  isManual: boolean;
}

interface SmartFieldMapperProps {
  sourceFields: string[];
  sampleData?: Record<string, any>[];
  onMappingComplete: (mappings: FieldMapping[]) => void;
  onCancel?: () => void;
}

const SmartFieldMapper = memo(({ 
  sourceFields, 
  sampleData = [],
  onMappingComplete,
  onCancel
}: SmartFieldMapperProps) => {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Analyse automatique des champs
  useEffect(() => {
    const analyzeFields = async () => {
      setIsAnalyzing(true);
      const newMappings: FieldMapping[] = [];
      
      for (let i = 0; i < sourceFields.length; i++) {
        const sourceField = sourceFields[i].toLowerCase().trim();
        let bestMatch: { field: string; confidence: number } | null = null;

        // Recherche par correspondance exacte ou synonymes
        for (const [targetId, synonyms] of Object.entries(FIELD_SYNONYMS)) {
          // Correspondance exacte
          if (sourceField === targetId || synonyms.includes(sourceField)) {
            bestMatch = { field: targetId, confidence: 100 };
            break;
          }

          // Correspondance partielle
          const partialMatch = synonyms.find(s => 
            sourceField.includes(s) || s.includes(sourceField)
          );
          if (partialMatch) {
            const confidence = Math.round((partialMatch.length / sourceField.length) * 80);
            if (!bestMatch || confidence > bestMatch.confidence) {
              bestMatch = { field: targetId, confidence };
            }
          }
        }

        // Analyse des données pour améliorer la confiance
        if (sampleData.length > 0 && bestMatch) {
          const sampleValues = sampleData.slice(0, 5).map(row => row[sourceFields[i]]);
          const targetField = SHOPOPTI_FIELDS.find(f => f.id === bestMatch!.field);
          
          if (targetField) {
            const typeMatches = sampleValues.every(val => {
              if (targetField.type === 'number') return !isNaN(parseFloat(val));
              if (targetField.type === 'array') return val?.includes(',') || val?.includes(';');
              return true;
            });
            
            if (typeMatches) {
              bestMatch.confidence = Math.min(100, bestMatch.confidence + 10);
            }
          }
        }

        newMappings.push({
          sourceField: sourceFields[i],
          targetField: bestMatch?.field || '',
          confidence: bestMatch?.confidence || 0,
          isManual: false
        });

        // Simulation de progression
        setAnalysisProgress(Math.round(((i + 1) / sourceFields.length) * 100));
        await new Promise(r => setTimeout(r, 50));
      }

      setMappings(newMappings);
      setIsAnalyzing(false);
    };

    if (sourceFields.length > 0) {
      analyzeFields();
    }
  }, [sourceFields, sampleData]);

  // Statistiques de mapping
  const stats = useMemo(() => {
    const mapped = mappings.filter(m => m.targetField).length;
    const highConfidence = mappings.filter(m => m.confidence >= 80).length;
    const required = SHOPOPTI_FIELDS.filter(f => f.required);
    const requiredMapped = required.filter(r => 
      mappings.some(m => m.targetField === r.id)
    ).length;

    return {
      mapped,
      total: mappings.length,
      highConfidence,
      requiredMapped,
      requiredTotal: required.length,
      isValid: requiredMapped === required.length
    };
  }, [mappings]);

  const handleFieldChange = (sourceField: string, targetField: string) => {
    setMappings(prev => prev.map(m => 
      m.sourceField === sourceField 
        ? { ...m, targetField, confidence: 100, isManual: true }
        : m
    ));
  };

  const handleAutoRemap = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    // Réinitialiser et relancer l'analyse
    setMappings([]);
    await new Promise(r => setTimeout(r, 500));
    // L'effet se relancera automatiquement
  };

  const handleSave = () => {
    if (!stats.isValid) {
      toast.error('Veuillez mapper tous les champs obligatoires');
      return;
    }
    onMappingComplete(mappings.filter(m => m.targetField));
    toast.success('Mapping enregistré avec succès');
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return { color: 'bg-green-500/20 text-green-600', label: 'Élevée' };
    if (confidence >= 50) return { color: 'bg-amber-500/20 text-amber-600', label: 'Moyenne' };
    if (confidence > 0) return { color: 'bg-red-500/20 text-red-600', label: 'Faible' };
    return { color: 'bg-muted text-muted-foreground', label: 'Non mappé' };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Mapping intelligent des champs
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoRemap}
              disabled={isAnalyzing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", isAnalyzing && "animate-spin")} />
              Re-analyser
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Champs mappés</p>
            <p className="text-lg font-semibold">{stats.mapped}/{stats.total}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Haute confiance</p>
            <p className="text-lg font-semibold text-green-600">{stats.highConfidence}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Champs requis</p>
            <p className={cn(
              "text-lg font-semibold",
              stats.isValid ? "text-green-600" : "text-red-600"
            )}>
              {stats.requiredMapped}/{stats.requiredTotal}
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Qualité</p>
            <Progress 
              value={(stats.mapped / stats.total) * 100} 
              className="h-2 mt-2"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progression de l'analyse */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-primary/5 rounded-lg border border-primary/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-sm font-medium">Analyse IA en cours...</span>
                <span className="text-sm text-muted-foreground ml-auto">{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste des mappings */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {mappings.map((mapping, index) => {
            const confidence = getConfidenceBadge(mapping.confidence);
            const targetField = SHOPOPTI_FIELDS.find(f => f.id === mapping.targetField);
            
            return (
              <motion.div
                key={mapping.sourceField}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  mapping.targetField ? "bg-card" : "bg-muted/30 border-dashed"
                )}
              >
                {/* Champ source */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{mapping.sourceField}</p>
                  {sampleData[0] && (
                    <p className="text-xs text-muted-foreground truncate">
                      Ex: {String(sampleData[0][mapping.sourceField] || '-').slice(0, 50)}
                    </p>
                  )}
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

                {/* Sélecteur de champ cible */}
                <div className="flex-1">
                  <Select
                    value={mapping.targetField}
                    onValueChange={(value) => handleFieldChange(mapping.sourceField, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un champ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Ignorer ce champ --</SelectItem>
                      {SHOPOPTI_FIELDS.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          <div className="flex items-center gap-2">
                            {field.label}
                            {field.required && (
                              <Badge variant="destructive" className="text-[10px] px-1">
                                Requis
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Badge de confiance */}
                <Badge 
                  variant="secondary" 
                  className={cn("shrink-0 text-xs", confidence.color)}
                >
                  {mapping.isManual ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : null}
                  {mapping.confidence > 0 ? `${mapping.confidence}%` : confidence.label}
                </Badge>
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          {!stats.isValid && (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Champs obligatoires manquants</span>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button 
              onClick={handleSave}
              disabled={!stats.isValid || isAnalyzing}
            >
              <Save className="h-4 w-4 mr-2" />
              Valider le mapping
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SmartFieldMapper.displayName = 'SmartFieldMapper';

export default SmartFieldMapper;
