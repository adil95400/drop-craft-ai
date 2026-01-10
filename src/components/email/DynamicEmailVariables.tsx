/**
 * Variables dynamiques pour les emails
 * Permet d'insérer et prévisualiser des variables dans les templates
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Eye, Variable, User, ShoppingCart, Package, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailVariable {
  key: string;
  label: string;
  category: 'user' | 'order' | 'product' | 'company';
  example: string;
  description: string;
}

const EMAIL_VARIABLES: EmailVariable[] = [
  // User variables
  { key: '{{user.name}}', label: 'Nom complet', category: 'user', example: 'Jean Dupont', description: 'Nom complet du client' },
  { key: '{{user.first_name}}', label: 'Prénom', category: 'user', example: 'Jean', description: 'Prénom du client' },
  { key: '{{user.email}}', label: 'Email', category: 'user', example: 'jean@email.com', description: 'Adresse email du client' },
  { key: '{{user.phone}}', label: 'Téléphone', category: 'user', example: '+33 6 12 34 56 78', description: 'Numéro de téléphone' },
  
  // Order variables
  { key: '{{order.number}}', label: 'Numéro commande', category: 'order', example: 'ORD-2024-001234', description: 'Numéro unique de la commande' },
  { key: '{{order.total}}', label: 'Total TTC', category: 'order', example: '149,99 €', description: 'Montant total de la commande' },
  { key: '{{order.date}}', label: 'Date commande', category: 'order', example: '15 janvier 2024', description: 'Date de la commande' },
  { key: '{{order.status}}', label: 'Statut', category: 'order', example: 'En cours de livraison', description: 'Statut actuel de la commande' },
  { key: '{{order.tracking_url}}', label: 'Lien suivi', category: 'order', example: 'https://tracking.exemple.com/...', description: 'URL de suivi du colis' },
  { key: '{{order.items_count}}', label: 'Nombre articles', category: 'order', example: '3', description: 'Nombre d\'articles dans la commande' },
  
  // Product variables
  { key: '{{product.name}}', label: 'Nom produit', category: 'product', example: 'iPhone 15 Pro', description: 'Nom du produit' },
  { key: '{{product.price}}', label: 'Prix', category: 'product', example: '1 199,00 €', description: 'Prix du produit' },
  { key: '{{product.sku}}', label: 'SKU', category: 'product', example: 'IPH15P-256-BLK', description: 'Référence produit' },
  { key: '{{product.image_url}}', label: 'Image', category: 'product', example: 'https://...', description: 'URL de l\'image produit' },
  
  // Company variables
  { key: '{{company.name}}', label: 'Nom entreprise', category: 'company', example: 'Shopopti', description: 'Nom de votre entreprise' },
  { key: '{{company.email}}', label: 'Email support', category: 'company', example: 'support@shopopti.com', description: 'Email de support' },
  { key: '{{company.phone}}', label: 'Téléphone', category: 'company', example: '+33 1 23 45 67 89', description: 'Téléphone de l\'entreprise' },
  { key: '{{company.address}}', label: 'Adresse', category: 'company', example: '123 Rue du Commerce, 75001 Paris', description: 'Adresse postale' },
  { key: '{{company.logo_url}}', label: 'Logo', category: 'company', example: 'https://...', description: 'URL du logo' },
  { key: '{{unsubscribe_url}}', label: 'Lien désinscription', category: 'company', example: 'https://...', description: 'Lien de désinscription RGPD' },
];

interface DynamicEmailVariablesProps {
  onInsertVariable?: (variable: string) => void;
  templateContent?: string;
}

export function DynamicEmailVariables({ onInsertVariable, templateContent }: DynamicEmailVariablesProps) {
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<string>('user');
  const { toast } = useToast();

  const categories = [
    { value: 'user', label: 'Client', icon: User },
    { value: 'order', label: 'Commande', icon: ShoppingCart },
    { value: 'product', label: 'Produit', icon: Package },
    { value: 'company', label: 'Entreprise', icon: Building },
  ];

  const filteredVariables = EMAIL_VARIABLES.filter(v => v.category === activeCategory);

  const handleCopy = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast({
      title: 'Copié !',
      description: `Variable ${variable} copiée dans le presse-papiers`,
    });
  };

  const handleInsert = (variable: string) => {
    if (onInsertVariable) {
      onInsertVariable(variable);
    } else {
      handleCopy(variable);
    }
  };

  const generatePreview = () => {
    if (!templateContent) return '';
    
    let preview = templateContent;
    EMAIL_VARIABLES.forEach(variable => {
      const value = previewValues[variable.key] || variable.example;
      preview = preview.split(variable.key).join(value);
    });
    return preview;
  };

  const usedVariables = EMAIL_VARIABLES.filter(v => 
    templateContent?.includes(v.key)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Variable className="h-4 w-4" />
            Variables dynamiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid grid-cols-4 w-full">
              {categories.map(cat => (
                <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                  <cat.icon className="h-3 w-3 mr-1" />
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map(cat => (
              <TabsContent key={cat.value} value={cat.value} className="mt-3">
                <div className="grid gap-2">
                  {filteredVariables.map(variable => (
                    <div
                      key={variable.key}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-background px-1 py-0.5 rounded font-mono">
                            {variable.key}
                          </code>
                          <span className="text-xs text-muted-foreground truncate">
                            {variable.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ex: {variable.example}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(variable.key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {onInsertVariable && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleInsert(variable.key)}
                          >
                            Insérer
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Variables utilisées dans le template */}
          {usedVariables.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Variables utilisées ({usedVariables.length})
              </Label>
              <div className="flex flex-wrap gap-1">
                {usedVariables.map(v => (
                  <Badge key={v.key} variant="outline" className="text-xs">
                    {v.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aperçu avec valeurs personnalisées */}
      {templateContent && usedVariables.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Aperçu personnalisé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {usedVariables.slice(0, 4).map(variable => (
                <div key={variable.key} className="space-y-1">
                  <Label className="text-xs">{variable.label}</Label>
                  <Input
                    placeholder={variable.example}
                    value={previewValues[variable.key] || ''}
                    onChange={(e) => setPreviewValues(prev => ({
                      ...prev,
                      [variable.key]: e.target.value
                    }))}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <iframe
                srcDoc={generatePreview()}
                className="w-full h-[200px] bg-white"
                title="Email Preview"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { EMAIL_VARIABLES, type EmailVariable };
