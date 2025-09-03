import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Search,
  TrendingUp,
  Image,
  DollarSign,
  Tag,
  FileText,
  Loader2
} from 'lucide-react';

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  check: (product: any) => boolean;
}

interface ProductImportValidatorProps {
  products: any[];
  onValidationComplete?: (validatedProducts: any[]) => void;
  onCancel?: () => void;
}

export const ProductImportValidator: React.FC<ProductImportValidatorProps> = ({
  products,
  onValidationComplete,
  onCancel
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [validatedProducts, setValidatedProducts] = useState<any[]>([]);

  const validationRules: ValidationRule[] = [
    {
      id: 'required_name',
      name: 'Nom requis',
      description: 'Chaque produit doit avoir un nom',
      severity: 'error',
      check: (product) => !!product.name && product.name.trim().length > 0
    },
    {
      id: 'valid_price',
      name: 'Prix valide',
      description: 'Le prix doit être un nombre positif',
      severity: 'error',
      check: (product) => !isNaN(product.price) && product.price > 0
    },
    {
      id: 'has_sku',
      name: 'SKU présent',
      description: 'Recommandé pour l\'identification unique',
      severity: 'warning',
      check: (product) => !!product.sku && product.sku.trim().length > 0
    },
    {
      id: 'has_description',
      name: 'Description présente',
      description: 'Améliore le SEO et l\'expérience utilisateur',
      severity: 'warning',
      check: (product) => !!product.description && product.description.trim().length > 10
    },
    {
      id: 'has_images',
      name: 'Images disponibles',
      description: 'Au moins une image pour le produit',
      severity: 'warning',
      check: (product) => product.image_urls && product.image_urls.length > 0
    },
    {
      id: 'has_category',
      name: 'Catégorie assignée',
      description: 'Aide à l\'organisation et au référencement',
      severity: 'info',
      check: (product) => !!product.category && product.category.trim().length > 0
    },
    {
      id: 'reasonable_price',
      name: 'Prix raisonnable',
      description: 'Prix entre 0.01€ et 10,000€',
      severity: 'warning',
      check: (product) => product.price >= 0.01 && product.price <= 10000
    }
  ];

  const runValidation = async () => {
    setIsValidating(true);
    setValidationProgress(0);
    
    const results = {
      total: products.length,
      errors: 0,
      warnings: 0,
      valid: 0,
      issues: [] as any[],
      byRule: {} as Record<string, number>
    };

    const processedProducts = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productIssues = [];

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      for (const rule of validationRules) {
        const isValid = rule.check(product);
        
        if (!isValid) {
          productIssues.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            description: rule.description
          });

          results.byRule[rule.id] = (results.byRule[rule.id] || 0) + 1;
          
          if (rule.severity === 'error') {
            results.errors++;
          } else if (rule.severity === 'warning') {
            results.warnings++;
          }
        }
      }

      // Add validation metadata to product
      const processedProduct = {
        ...product,
        validation: {
          isValid: productIssues.filter(i => i.severity === 'error').length === 0,
          issues: productIssues,
          score: Math.max(0, 100 - (productIssues.length * 15))
        }
      };

      processedProducts.push(processedProduct);
      
      if (processedProduct.validation.isValid) {
        results.valid++;
      }

      results.issues.push({
        productIndex: i,
        productName: product.name || `Produit ${i + 1}`,
        issues: productIssues
      });

      setValidationProgress((i + 1) / products.length * 100);
    }

    setValidationResults(results);
    setValidatedProducts(processedProducts);
    setIsValidating(false);
  };

  useEffect(() => {
    if (products && products.length > 0) {
      runValidation();
    }
  }, [products]);

  const getValidationSummary = () => {
    if (!validationResults) return null;

    const { total, valid, errors, warnings } = validationResults;
    const successRate = (valid / total) * 100;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">{valid}</div>
              <div className="text-sm text-muted-foreground">Valides</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">{errors}</div>
              <div className="text-sm text-muted-foreground">Erreurs</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">{warnings}</div>
              <div className="text-sm text-muted-foreground">Avertissements</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{successRate.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Taux de succès</div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <CheckCircle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (isValidating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Validation des produits en cours...
          </CardTitle>
          <CardDescription>
            Vérification de la qualité et de la conformité des données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Validation des {products.length} produits</span>
              <span>{validationProgress.toFixed(0)}%</span>
            </div>
            <Progress value={validationProgress} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Rapport de Validation
          </CardTitle>
          <CardDescription>
            Analyse de la qualité des {products.length} produits importés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getValidationSummary()}

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="issues">Problèmes détectés</TabsTrigger>
              <TabsTrigger value="products">Produits</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validationRules.map((rule) => (
                  <Card key={rule.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded ${getSeverityColor(rule.severity)}`}>
                          {getSeverityIcon(rule.severity)}
                        </div>
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {validationResults?.byRule[rule.id] || 0} problèmes
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              {validationResults?.issues?.filter((item: any) => item.issues.length > 0).map((item: any, index: number) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{item.productName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {item.issues.map((issue: any, issueIndex: number) => (
                        <Alert key={issueIndex} className={`${getSeverityColor(issue.severity)} border`}>
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(issue.severity)}
                            <AlertDescription>
                              <strong>{issue.ruleName}:</strong> {issue.description}
                            </AlertDescription>
                          </div>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <div className="space-y-3">
                {validatedProducts.slice(0, 10).map((product: any, index: number) => (
                  <Card key={index} className={`p-4 ${product.validation.isValid ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${product.validation.isValid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {product.validation.isValid ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{product.name || `Produit ${index + 1}`}</h4>
                          <p className="text-sm text-muted-foreground">{product.price}€ • {product.category || 'Sans catégorie'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Score: {product.validation.score}%</Badge>
                        <Badge variant={product.validation.isValid ? "default" : "destructive"}>
                          {product.validation.issues.length} problèmes
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
                {validatedProducts.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground">
                    +{validatedProducts.length - 10} autres produits
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-6 border-t">
            <Button 
              onClick={() => onValidationComplete?.(validatedProducts.filter(p => p.validation.isValid))}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Importer les produits valides ({validationResults?.valid || 0})
            </Button>
            
            <Button 
              onClick={() => onValidationComplete?.(validatedProducts)}
              variant="outline"
            >
              Importer tout
            </Button>
            
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};