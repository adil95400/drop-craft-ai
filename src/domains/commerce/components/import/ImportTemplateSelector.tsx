import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { importTemplatesService, ImportTemplate } from '../../services/importTemplatesService';
import { Lock, Zap } from 'lucide-react';

interface ImportTemplateSelectorProps {
  onSelect: (template: ImportTemplate) => void;
  selectedTemplateId?: string;
}

export const ImportTemplateSelector = ({ onSelect, selectedTemplateId }: ImportTemplateSelectorProps) => {
  const templates = importTemplatesService.getAllTemplates();
  const marketplaceTemplates = templates.filter(t => t.sourceType === 'marketplace');
  const otherTemplates = templates.filter(t => t.sourceType !== 'marketplace');

  const renderTemplate = (template: ImportTemplate) => (
    <Card
      key={template.id}
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect(template)}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl">{template.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">{template.displayName}</h3>
            {template.requiresAuth && (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
            {template.provider === 'ai-scraper' && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                IA
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {template.description}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline" className="text-xs">
              {template.sourceType}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          🛒 Marketplaces
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {marketplaceTemplates.map(renderTemplate)}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          🔧 Autres sources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {otherTemplates.map(renderTemplate)}
        </div>
      </div>
    </div>
  );
};
