import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  DollarSign, 
  Crown, 
  TrendingUp, 
  ShoppingCart, 
  Tag, 
  Clock, 
  Calendar,
  ShoppingBag,
  Globe,
  Map,
  MapPin,
  Store,
  Mail,
  UserMinus,
  UserPlus,
  AlertTriangle,
  LayoutTemplate,
  ChevronDown,
  Smartphone
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { SegmentTemplate, SEGMENT_TEMPLATES } from '@/services/CustomerSegmentationService';
import { motion, AnimatePresence } from 'framer-motion';

interface SegmentTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: SegmentTemplate) => void;
}

const iconMap: Record<string, React.ElementType> = {
  DollarSign,
  Crown,
  TrendingUp,
  ShoppingCart,
  Tag,
  Clock,
  Calendar,
  ShoppingBag,
  Globe,
  Map,
  MapPin,
  Store,
  Mail,
  UserMinus,
  UserPlus,
  AlertTriangle,
  Smartphone
};

const categoryLabels: Record<string, string> = {
  value: 'Valeur client',
  behavior: 'Comportement d\'achat',
  location: 'Localisation',
  engagement: 'Engagement'
};

const categoryColors: Record<string, string> = {
  value: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  behavior: 'bg-blue-500/10 text-blue-600 border-blue-200',
  location: 'bg-amber-500/10 text-amber-600 border-amber-200',
  engagement: 'bg-purple-500/10 text-purple-600 border-purple-200'
};

export function SegmentTemplatesModal({ 
  open, 
  onOpenChange, 
  onSelectTemplate 
}: SegmentTemplatesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return SEGMENT_TEMPLATES.filter(template => {
      const matchesSearch = searchQuery === '' || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, SegmentTemplate[]> = {};
    filteredTemplates.forEach(template => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, [filteredTemplates]);

  const handleSelect = (template: SegmentTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutTemplate className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Modèles de segments</DialogTitle>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans tous les modèles"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {selectedCategory ? categoryLabels[selectedCategory] : 'Catégories'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                  Toutes les catégories
                </DropdownMenuItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <DropdownMenuItem key={key} onClick={() => setSelectedCategory(key)}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className="p-6 space-y-8">
            <AnimatePresence mode="wait">
              {Object.entries(groupedTemplates).map(([category, templates]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={categoryColors[category]}>
                      {categoryLabels[category]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {templates.length} modèle{templates.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template, index) => {
                      const IconComponent = iconMap[template.icon] || LayoutTemplate;
                      
                      return (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSelect(template)}
                          className="group cursor-pointer rounded-lg border bg-card p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                              <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                                {template.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {template.rules.length} condition{template.rules.length > 1 ? 's' : ''}
                            </span>
                            <Badge variant="secondary" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              Utiliser
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Aucun modèle trouvé pour "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
