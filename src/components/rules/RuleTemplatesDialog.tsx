import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RULE_TEMPLATES, RuleTemplate } from '@/lib/rules/ruleTypes';
import { motion } from 'framer-motion';
import { 
  Search, Sparkles, DollarSign, Tag, BarChart3, 
  FileText, Zap, ArrowRight, CheckCircle2, Globe
} from 'lucide-react';

interface RuleTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateId: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'SEO': FileText,
  'Contenu': Sparkles,
  'Gestion Stock': Tag,
  'Pricing': DollarSign,
  'Qualité': BarChart3,
  'default': Zap
};

const CHANNEL_COLORS: Record<string, string> = {
  global: 'bg-gray-500',
  google: 'bg-blue-500',
  meta: 'bg-indigo-500',
  tiktok: 'bg-pink-500',
  amazon: 'bg-orange-500',
  shopify: 'bg-green-500'
};

export function RuleTemplatesDialog({ open, onOpenChange, onSelectTemplate }: RuleTemplatesDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(RULE_TEMPLATES.map(t => t.category)))];

  // Filter templates
  const filteredTemplates = RULE_TEMPLATES.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (templateId: string) => {
    onSelectTemplate(templateId);
    onOpenChange(false);
  };

  const getCategoryIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
    return <Icon className="h-4 w-4" />;
  };

  const TemplateCard = ({ template }: { template: RuleTemplate }) => {
    const isHovered = hoveredTemplate === template.id;
    const Icon = CATEGORY_ICONS[template.category] || CATEGORY_ICONS.default;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        onMouseEnter={() => setHoveredTemplate(template.id)}
        onMouseLeave={() => setHoveredTemplate(null)}
      >
        <Card className={`cursor-pointer transition-all duration-300 h-full border-2 ${
          isHovered ? 'border-primary shadow-lg shadow-primary/20' : 'border-border/50 hover:border-primary/50'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg transition-colors ${
                isHovered ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex gap-1">
                <Badge 
                  variant="secondary" 
                  className={`${CHANNEL_COLORS[template.channel] || 'bg-gray-500'} text-white text-xs`}
                >
                  {template.channel === 'global' ? <Globe className="h-3 w-3" /> : template.channel}
                </Badge>
              </div>
            </div>
            <CardTitle className="text-base mt-3">{template.name}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {template.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {template.category}
              </Badge>
              <Button 
                size="sm" 
                className={`transition-all ${isHovered ? 'bg-primary' : 'bg-primary/80'}`}
                onClick={() => handleSelect(template.id)}
              >
                Utiliser
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {/* Preview on hover */}
            {isHovered && template.rule.conditionGroup && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t border-dashed"
              >
                <p className="text-xs text-muted-foreground mb-2">Aperçu:</p>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] px-1">SI</Badge>
                    <span className="text-muted-foreground">
                      {template.rule.conditionGroup.conditions.length} condition(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] px-1 bg-primary/10">ALORS</Badge>
                    <span className="text-muted-foreground">
                      {template.rule.actions?.length || 0} action(s)
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Templates de règles
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="gap-1 text-xs">
                {category === 'all' ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Tous
                  </>
                ) : (
                  <>
                    {getCategoryIcon(category)}
                    {category}
                  </>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun template trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map(template => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
          <span>{filteredTemplates.length} template(s) disponible(s)</span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Templates pré-configurés type Channable
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
