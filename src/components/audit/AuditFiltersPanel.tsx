/**
 * Panneau de filtres avancés pour l'audit
 * Filtres par score, catégorie, problèmes, etc.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Filter, ChevronDown, RotateCcw, Image, FileText, Tag, AlertTriangle, Sparkles } from 'lucide-react';
import { AuditFilters, DEFAULT_AUDIT_FILTERS } from '@/hooks/useAuditFilters';

interface AuditFiltersPanelProps {
  filters: AuditFilters;
  onFiltersChange: (filters: Partial<AuditFilters>) => void;
  onReset: () => void;
  activeCount: number;
}

export function AuditFiltersPanel({ 
  filters, 
  onFiltersChange, 
  onReset,
  activeCount 
}: AuditFiltersPanelProps) {
  const [openSections, setOpenSections] = useState<string[]>(['images', 'content']);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const FilterSection = ({ 
    id, 
    title, 
    icon: Icon, 
    children 
  }: { 
    id: string; 
    title: string; 
    icon: any; 
    children: React.ReactNode;
  }) => (
    <Collapsible
      open={openSections.includes(id)}
      onOpenChange={() => toggleSection(id)}
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 h-auto">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{title}</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes(id) ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-4 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  const FilterSwitch = ({ 
    id, 
    label, 
    checked, 
    onChange 
  }: { 
    id: string; 
    label: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="text-sm cursor-pointer">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtres
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres Avancés
          </SheetTitle>
          <SheetDescription>
            Affinez votre recherche pour trouver les produits à optimiser
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-2">
          {/* Score SEO */}
          <div className="px-3 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Score SEO Maximum</Label>
              <Badge variant="outline">{filters.seoScoreMax}/100</Badge>
            </div>
            <Slider
              value={[filters.seoScoreMax]}
              max={100}
              step={5}
              onValueChange={([value]) => onFiltersChange({ seoScoreMax: value })}
            />
            <p className="text-xs text-muted-foreground">
              Afficher les produits avec un score inférieur ou égal
            </p>
          </div>

          <Separator />

          {/* Images */}
          <FilterSection id="images" title="Qualité Images" icon={Image}>
            <FilterSwitch
              id="noImage"
              label="Sans image"
              checked={filters.noImage}
              onChange={(checked) => onFiltersChange({ noImage: checked })}
            />
            <FilterSwitch
              id="singleImage"
              label="Une seule image"
              checked={filters.singleImage}
              onChange={(checked) => onFiltersChange({ singleImage: checked })}
            />
          </FilterSection>

          <Separator />

          {/* Contenu */}
          <FilterSection id="content" title="Qualité Contenu" icon={FileText}>
            <FilterSwitch
              id="noDescription"
              label="Sans description"
              checked={filters.noDescription}
              onChange={(checked) => onFiltersChange({ noDescription: checked })}
            />
            <FilterSwitch
              id="shortDescription"
              label="Description courte (<100 car.)"
              checked={filters.shortDescription}
              onChange={(checked) => onFiltersChange({ shortDescription: checked })}
            />
            <FilterSwitch
              id="shortTitle"
              label="Titre trop court (<20 car.)"
              checked={filters.shortTitle}
              onChange={(checked) => onFiltersChange({ shortTitle: checked })}
            />
            <FilterSwitch
              id="longTitle"
              label="Titre trop long (>70 car.)"
              checked={filters.longTitle}
              onChange={(checked) => onFiltersChange({ longTitle: checked })}
            />
          </FilterSection>

          <Separator />

          {/* Données produit */}
          <FilterSection id="data" title="Données Produit" icon={Tag}>
            <FilterSwitch
              id="noSKU"
              label="Sans SKU"
              checked={filters.noSKU}
              onChange={(checked) => onFiltersChange({ noSKU: checked })}
            />
            <FilterSwitch
              id="noBrand"
              label="Sans catégorie/marque"
              checked={filters.noBrand}
              onChange={(checked) => onFiltersChange({ noBrand: checked })}
            />
          </FilterSection>

          <Separator />

          {/* Stock */}
          <FilterSection id="stock" title="État Stock" icon={AlertTriangle}>
            <FilterSwitch
              id="outOfStock"
              label="Rupture de stock"
              checked={filters.outOfStock}
              onChange={(checked) => onFiltersChange({ outOfStock: checked })}
            />
            <FilterSwitch
              id="lowStock"
              label="Stock faible (<10)"
              checked={filters.lowStock}
              onChange={(checked) => onFiltersChange({ lowStock: checked })}
            />
          </FilterSection>

          <Separator />

          {/* AI Shopping */}
          <FilterSection id="ai" title="AI Shopping" icon={Sparkles}>
            <FilterSwitch
              id="missingCriticalFields"
              label="Champs critiques manquants"
              checked={filters.missingCriticalFields}
              onChange={(checked) => onFiltersChange({ missingCriticalFields: checked })}
            />
            <p className="text-xs text-muted-foreground">
              Produits non éligibles pour Google AI Shopping / ChatGPT
            </p>
          </FilterSection>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onReset} className="w-full gap-2">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser les filtres
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
