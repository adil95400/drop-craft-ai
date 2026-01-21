import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Smartphone,
  Eye,
  Layers,
  CreditCard,
  Gem,
  Target,
  MailCheck,
  MailX,
  MailOpen,
  Sparkles,
  UserSearch,
  Percent,
  Repeat,
  HeartOff,
  UserRoundCheck,
  Gift,
  MessageSquare,
  Bell,
  Share2,
  Users,
  Star,
  Heart,
  Plane,
  MailQuestion,
  X,
  Zap
} from 'lucide-react';
import { SegmentTemplate, SEGMENT_TEMPLATES } from '@/services/CustomerSegmentationService';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  Smartphone,
  Eye,
  Layers,
  CreditCard,
  Gem,
  Target,
  MailCheck,
  MailX,
  MailOpen,
  Sparkles,
  UserSearch,
  Percent,
  Repeat,
  HeartOff,
  UserRoundCheck,
  Gift,
  MessageSquare,
  Bell,
  Share2,
  Users,
  Star,
  Heart,
  Plane,
  MailQuestion,
  Search
};

type CategoryKey = 'all' | 'value' | 'behavior' | 'cart' | 'location' | 'email' | 'lifecycle' | 'engagement';

const categoryConfig: Record<CategoryKey, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: 'Tous', icon: LayoutTemplate, color: 'text-foreground' },
  value: { label: 'Valeur client', icon: DollarSign, color: 'text-emerald-600' },
  behavior: { label: 'Comportement', icon: ShoppingCart, color: 'text-blue-600' },
  cart: { label: 'Panier abandonné', icon: ShoppingBag, color: 'text-orange-600' },
  location: { label: 'Localisation', icon: Globe, color: 'text-amber-600' },
  email: { label: 'E-mail', icon: Mail, color: 'text-purple-600' },
  lifecycle: { label: 'Cycle de vie', icon: Users, color: 'text-pink-600' },
  engagement: { label: 'Engagement', icon: Bell, color: 'text-cyan-600' }
};

export function SegmentTemplatesModal({ 
  open, 
  onOpenChange, 
  onSelectTemplate 
}: SegmentTemplatesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');

  const filteredTemplates = useMemo(() => {
    return SEGMENT_TEMPLATES.filter(template => {
      const matchesSearch = searchQuery === '' || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.actionLabel.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const popularTemplates = useMemo(() => {
    return SEGMENT_TEMPLATES.filter(t => t.isPopular);
  }, []);

  const handleSelect = (template: SegmentTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  const templateCounts = useMemo(() => {
    const counts: Record<string, number> = { all: SEGMENT_TEMPLATES.length };
    SEGMENT_TEMPLATES.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 ring-2 ring-primary/20">
                <LayoutTemplate className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Modèles de segments</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {SEGMENT_TEMPLATES.length} modèles disponibles pour segmenter vos clients
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans tous les modèles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/80 backdrop-blur-sm"
            />
          </div>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="border-b px-6 py-3 bg-muted/30">
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as CategoryKey)}>
            <TabsList className="h-auto p-1 bg-transparent gap-1 flex-wrap justify-start">
              {(Object.keys(categoryConfig) as CategoryKey[]).map((key) => {
                const { label, icon: Icon, color } = categoryConfig[key];
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className={cn(
                      "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                      "gap-1.5 px-3 py-1.5 text-sm"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", selectedCategory === key && color)} />
                    {label}
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs font-normal">
                      {templateCounts[key] || 0}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 h-[55vh]">
          <div className="p-6 space-y-6">
            {/* Popular Templates Section - Only show when no filter */}
            {selectedCategory === 'all' && !searchQuery && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <h3 className="font-medium text-sm">Modèles populaires</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {popularTemplates.map((template) => (
                    <TemplateCard 
                      key={template.id} 
                      template={template} 
                      onSelect={handleSelect}
                      isPopular
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Templates */}
            <AnimatePresence mode="wait">
              {filteredTemplates.length > 0 ? (
                <motion.div
                  key={selectedCategory + searchQuery}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {(selectedCategory !== 'all' || searchQuery) && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {searchQuery ? 'Résultats de recherche' : categoryConfig[selectedCategory].label}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {filteredTemplates.length} modèle{filteredTemplates.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredTemplates.map((template, index) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.02, 0.3) }}
                      >
                        <TemplateCard template={template} onSelect={handleSelect} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <Search className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <p className="mt-4 text-muted-foreground">
                    Aucun modèle trouvé pour "{searchQuery}"
                  </p>
                  <Button 
                    variant="ghost" 
                    className="mt-2"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateCardProps {
  template: SegmentTemplate;
  onSelect: (template: SegmentTemplate) => void;
  isPopular?: boolean;
}

function TemplateCard({ template, onSelect, isPopular }: TemplateCardProps) {
  const IconComponent = iconMap[template.icon] || LayoutTemplate;
  const categoryColor = categoryConfig[template.category as CategoryKey]?.color || 'text-muted-foreground';
  
  return (
    <div
      onClick={() => onSelect(template)}
      className={cn(
        "group cursor-pointer rounded-xl border bg-card p-4 transition-all duration-200",
        "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
        isPopular && "ring-1 ring-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn(
            "p-2 rounded-lg transition-colors shrink-0",
            "bg-muted group-hover:bg-primary/10"
          )}>
            <IconComponent className={cn(
              "h-4 w-4 transition-colors",
              "text-muted-foreground group-hover:text-primary"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {template.name}
            </h4>
          </div>
          {isPopular && (
            <Badge className="shrink-0 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px]">
              <Zap className="h-2.5 w-2.5 mr-0.5" />
              Populaire
            </Badge>
          )}
        </div>
        
        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-3 flex-1 mb-3">
          {template.description}
        </p>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className={cn("text-[10px] font-medium", categoryColor)}>
            {template.actionLabel}
          </span>
          <Badge 
            variant="secondary" 
            className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 text-primary border-0"
          >
            Utiliser →
          </Badge>
        </div>
      </div>
    </div>
  );
}
