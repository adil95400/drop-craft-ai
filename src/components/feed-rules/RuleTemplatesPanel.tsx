/**
 * Rule Templates Panel
 * Affichage et utilisation des templates de règles
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, TrendingUp, Package, Tag, Sparkles } from 'lucide-react';
import { useFeedRuleTemplates, useCreateRuleFromTemplate } from '@/hooks/useFeedRules';

interface RuleTemplatesPanelProps {
  onUseTemplate: () => void;
  feedId?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  pricing: <TrendingUp className="h-4 w-4" />,
  inventory: <Package className="h-4 w-4" />,
  categorization: <Tag className="h-4 w-4" />,
  cleanup: <Sparkles className="h-4 w-4" />,
  general: <FileText className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  pricing: 'Prix',
  inventory: 'Stock',
  categorization: 'Catégories',
  cleanup: 'Nettoyage',
  general: 'Général',
};

export function RuleTemplatesPanel({ onUseTemplate, feedId }: RuleTemplatesPanelProps) {
  const { data: templates = [], isLoading } = useFeedRuleTemplates();
  const createFromTemplate = useCreateRuleFromTemplate();

  const categories = [...new Set(templates.map(t => t.category))];

  const handleUseTemplate = async (templateId: string) => {
    await createFromTemplate.mutateAsync({ templateId, feedId });
    onUseTemplate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Chargement des templates...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Templates de règles</CardTitle>
          <CardDescription>
            Utilisez des règles préconfigurées pour démarrer rapidement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="all">Tous</TabsTrigger>
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="flex items-center gap-1">
                  {categoryIcons[cat] || <FileText className="h-4 w-4" />}
                  {categoryLabels[cat] || cat}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => handleUseTemplate(template.id)}
                  isLoading={createFromTemplate.isPending}
                />
              ))}
            </TabsContent>

            {categories.map((cat) => (
              <TabsContent key={cat} value={cat} className="space-y-3">
                {templates
                  .filter((t) => t.category === cat)
                  .map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onUse={() => handleUseTemplate(template.id)}
                      isLoading={createFromTemplate.isPending}
                    />
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description?: string;
    category: string;
    is_global: boolean;
    conditions: unknown[];
    actions: unknown[];
    usage_count: number;
  };
  onUse: () => void;
  isLoading: boolean;
}

function TemplateCard({ template, onUse, isLoading }: TemplateCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          {categoryIcons[template.category] || <FileText className="h-5 w-5 text-primary" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{template.name}</h3>
            {template.is_global && (
              <Badge variant="secondary" className="text-xs">Global</Badge>
            )}
          </div>
          {template.description && (
            <p className="text-sm text-muted-foreground">{template.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {template.conditions.length} condition(s)
            </Badge>
            <Badge variant="outline" className="text-xs">
              {template.actions.length} action(s)
            </Badge>
            <span className="text-xs text-muted-foreground">
              Utilisé {template.usage_count} fois
            </span>
          </div>
        </div>
      </div>
      <Button size="sm" onClick={onUse} disabled={isLoading}>
        <Plus className="h-4 w-4 mr-1" />
        Utiliser
      </Button>
    </div>
  );
}
