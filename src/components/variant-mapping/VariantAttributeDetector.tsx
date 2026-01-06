/**
 * Variant Attribute Detector
 * Détection automatique des attributs depuis les produits importés
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Scan, Sparkles, Palette, Ruler, Package, 
  Check, X, Loader2, ArrowRight, Wand2,
  AlertCircle, CheckCircle2, Filter
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DetectedAttribute {
  name: string;
  values: string[];
  count: number;
  type: 'color' | 'size' | 'material' | 'style' | 'other';
  confidence: number;
}

interface AttributeSuggestion {
  sourceValue: string;
  suggestedTarget: string;
  confidence: number;
  attributeType: string;
}

// Common mappings for auto-suggestion
const COMMON_MAPPINGS: Record<string, Record<string, string>> = {
  size: {
    'XS': 'Extra Small',
    'S': 'Small',
    'M': 'Medium',
    'L': 'Large',
    'XL': 'Extra Large',
    'XXL': '2X Large',
    'XXXL': '3X Large',
    '36': 'EU 36',
    '38': 'EU 38',
    '40': 'EU 40',
    '42': 'EU 42',
    '44': 'EU 44',
  },
  color: {
    'BLK': 'Black',
    'WHT': 'White',
    'RED': 'Red',
    'BLU': 'Blue',
    'GRN': 'Green',
    'YLW': 'Yellow',
    'PNK': 'Pink',
    'GRY': 'Gray',
    'BRN': 'Brown',
    'ORG': 'Orange',
    'PRP': 'Purple',
    'NOIR': 'Black',
    'BLANC': 'White',
    'ROUGE': 'Red',
    'BLEU': 'Blue',
    'VERT': 'Green',
  },
};

export function VariantAttributeDetector() {
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<AttributeSuggestion[]>([]);
  const [editedSuggestions, setEditedSuggestions] = useState<Record<string, string>>({});
  
  const queryClient = useQueryClient();

  // Fetch products with variants data
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-for-variants'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('products')
        .select('id, title, variants')
        .eq('user_id', user.id)
        .not('variants', 'is', null)
        .limit(500);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch product variants from dedicated table
  const { data: productVariants = [] } = useQuery({
    queryKey: ['product-variants-all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('user_id', user.id)
        .limit(1000);

      if (error) throw error;
      return data || [];
    },
  });

  // Detect attributes from products
  const detectedAttributes = useMemo<DetectedAttribute[]>(() => {
    const attributeMap: Record<string, Set<string>> = {};

    // From products.variants JSON
    products.forEach(product => {
      if (product.variants && Array.isArray(product.variants)) {
        (product.variants as any[]).forEach(variant => {
          // Check for option fields
          ['option1', 'option2', 'option3', 'size', 'color', 'material'].forEach(key => {
            if (variant[key]) {
              const attrName = key.replace(/\d+$/, '').toLowerCase();
              if (!attributeMap[attrName]) {
                attributeMap[attrName] = new Set();
              }
              attributeMap[attrName].add(String(variant[key]));
            }
          });
        });
      }
    });

    // From product_variants table
    productVariants.forEach(variant => {
      if (variant.option1_name && variant.option1_value) {
        const name = variant.option1_name.toLowerCase();
        if (!attributeMap[name]) attributeMap[name] = new Set();
        attributeMap[name].add(variant.option1_value);
      }
      if (variant.option2_name && variant.option2_value) {
        const name = variant.option2_name.toLowerCase();
        if (!attributeMap[name]) attributeMap[name] = new Set();
        attributeMap[name].add(variant.option2_value);
      }
      if (variant.option3_name && variant.option3_value) {
        const name = variant.option3_name.toLowerCase();
        if (!attributeMap[name]) attributeMap[name] = new Set();
        attributeMap[name].add(variant.option3_value);
      }
    });

    // Convert to array and classify
    return Object.entries(attributeMap).map(([name, valuesSet]) => {
      const values = Array.from(valuesSet);
      let type: DetectedAttribute['type'] = 'other';
      let confidence = 0.5;

      // Classify based on name
      if (/^(size|taille|dimension)s?$/i.test(name)) {
        type = 'size';
        confidence = 0.9;
      } else if (/^(color|colour|couleur)s?$/i.test(name)) {
        type = 'color';
        confidence = 0.9;
      } else if (/^(material|matiere|fabric)s?$/i.test(name)) {
        type = 'material';
        confidence = 0.85;
      } else if (/^(style|type)s?$/i.test(name)) {
        type = 'style';
        confidence = 0.8;
      }

      // Classify based on values if name doesn't match
      if (type === 'other') {
        const sizePatterns = /^(xs|s|m|l|xl|xxl|xxxl|\d{1,2}|\d{1,2}[/-]\d{1,2})$/i;
        const colorPatterns = /^(black|white|red|blue|green|yellow|pink|gray|grey|brown|orange|purple|noir|blanc|rouge|bleu|vert)$/i;
        
        const sizeMatches = values.filter(v => sizePatterns.test(v)).length;
        const colorMatches = values.filter(v => colorPatterns.test(v)).length;

        if (sizeMatches > values.length * 0.5) {
          type = 'size';
          confidence = 0.7;
        } else if (colorMatches > values.length * 0.3) {
          type = 'color';
          confidence = 0.7;
        }
      }

      return {
        name,
        values,
        count: values.length,
        type,
        confidence,
      };
    }).sort((a, b) => b.count - a.count);
  }, [products, productVariants]);

  // Generate mapping suggestions
  const generateSuggestions = () => {
    setScanStatus('scanning');
    setScanProgress(0);

    const newSuggestions: AttributeSuggestion[] = [];
    const selectedAttrs = detectedAttributes.filter(a => selectedAttributes.includes(a.name));
    
    let processed = 0;
    const total = selectedAttrs.reduce((sum, attr) => sum + attr.values.length, 0);

    selectedAttrs.forEach(attr => {
      const mappings = COMMON_MAPPINGS[attr.type] || {};
      
      attr.values.forEach(value => {
        processed++;
        setScanProgress(Math.round((processed / total) * 100));

        // Check for exact mapping
        const upperValue = value.toUpperCase();
        if (mappings[upperValue]) {
          newSuggestions.push({
            sourceValue: value,
            suggestedTarget: mappings[upperValue],
            confidence: 0.95,
            attributeType: attr.name,
          });
        } else {
          // Check for partial match
          const partialMatch = Object.entries(mappings).find(([key]) => 
            upperValue.includes(key) || key.includes(upperValue)
          );
          
          if (partialMatch) {
            newSuggestions.push({
              sourceValue: value,
              suggestedTarget: partialMatch[1],
              confidence: 0.7,
              attributeType: attr.name,
            });
          } else {
            // Suggest normalized version
            newSuggestions.push({
              sourceValue: value,
              suggestedTarget: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
              confidence: 0.5,
              attributeType: attr.name,
            });
          }
        }
      });
    });

    setTimeout(() => {
      setSuggestions(newSuggestions);
      setScanStatus('complete');
    }, 500);
  };

  // Create mappings from suggestions
  const createMappingsMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const mappingsToCreate = suggestions.map(s => ({
        user_id: user.id,
        source_option_name: s.attributeType,
        source_option_value: s.sourceValue,
        target_option_name: s.attributeType,
        target_option_value: editedSuggestions[s.sourceValue] || s.suggestedTarget,
        is_active: true,
        auto_sync: true,
        priority: Math.round(s.confidence * 100),
      }));

      const { data, error } = await supabase
        .from('variant_mappings')
        .upsert(mappingsToCreate, { 
          onConflict: 'user_id,source_option_name,source_option_value,target_option_name',
          ignoreDuplicates: true 
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['variant-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['variant-mapping-stats'] });
      toast.success(`${data?.length || 0} mappings créés avec succès`);
      setScanStatus('idle');
      setSuggestions([]);
      setSelectedAttributes([]);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'color': return <Palette className="h-4 w-4 text-pink-500" />;
      case 'size': return <Ruler className="h-4 w-4 text-blue-500" />;
      default: return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge className="bg-green-500/10 text-green-600">Haute</Badge>;
    } else if (confidence >= 0.7) {
      return <Badge className="bg-yellow-500/10 text-yellow-600">Moyenne</Badge>;
    }
    return <Badge className="bg-gray-500/10 text-gray-600">Faible</Badge>;
  };

  if (isLoadingProducts) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Chargement des produits...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Détection des Attributs
          </CardTitle>
          <CardDescription>
            Analysez vos produits pour détecter automatiquement les variantes et générer des mappings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-sm text-muted-foreground">Produits analysés</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{detectedAttributes.length}</p>
              <p className="text-sm text-muted-foreground">Attributs détectés</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">
                {detectedAttributes.reduce((sum, a) => sum + a.count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Valeurs uniques</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detected Attributes */}
      {detectedAttributes.length > 0 && scanStatus === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attributs Détectés</CardTitle>
            <CardDescription>
              Sélectionnez les attributs pour lesquels générer des mappings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {detectedAttributes.map((attr) => (
                <div 
                  key={attr.name}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAttributes.includes(attr.name) 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    setSelectedAttributes(prev => 
                      prev.includes(attr.name)
                        ? prev.filter(a => a !== attr.name)
                        : [...prev, attr.name]
                    );
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedAttributes.includes(attr.name)}
                        onCheckedChange={() => {}}
                      />
                      {getTypeIcon(attr.type)}
                      <div>
                        <p className="font-medium capitalize">{attr.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {attr.count} valeurs uniques
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getConfidenceBadge(attr.confidence)}
                      <Badge variant="outline">{attr.type}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {attr.values.slice(0, 8).map((v, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-mono">
                        {v}
                      </Badge>
                    ))}
                    {attr.values.length > 8 && (
                      <Badge variant="secondary" className="text-xs">
                        +{attr.values.length - 8} autres
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button 
                onClick={generateSuggestions}
                disabled={selectedAttributes.length === 0}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Générer les Mappings ({selectedAttributes.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanning Progress */}
      {scanStatus === 'scanning' && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Sparkles className="h-12 w-12 text-primary mx-auto animate-pulse" />
              <h3 className="font-medium">Analyse en cours...</h3>
              <Progress value={scanProgress} className="max-w-md mx-auto" />
              <p className="text-sm text-muted-foreground">
                Génération des suggestions de mapping
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions Review */}
      {scanStatus === 'complete' && suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Suggestions de Mapping
            </CardTitle>
            <CardDescription>
              Vérifiez et modifiez les mappings suggérés avant de les créer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Valeur Source</TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Valeur Cible</TableHead>
                    <TableHead>Confiance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {s.attributeType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {s.sourceValue}
                        </code>
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editedSuggestions[s.sourceValue] ?? s.suggestedTarget}
                          onChange={(e) => setEditedSuggestions(prev => ({
                            ...prev,
                            [s.sourceValue]: e.target.value
                          }))}
                          className="h-8 w-40"
                        />
                      </TableCell>
                      <TableCell>
                        {getConfidenceBadge(s.confidence)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="mt-4 flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setScanStatus('idle');
                  setSuggestions([]);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button 
                onClick={() => createMappingsMutation.mutate()}
                disabled={createMappingsMutation.isPending}
              >
                {createMappingsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Créer {suggestions.length} Mappings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {detectedAttributes.length === 0 && !isLoadingProducts && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Aucun attribut détecté</h3>
            <p className="text-muted-foreground text-sm">
              Importez des produits avec des variantes pour commencer l'analyse
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
