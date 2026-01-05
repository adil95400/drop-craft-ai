/**
 * Mapping Rules Editor
 * Éditeur des règles de mapping de catégories
 */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, ArrowRight, Search } from 'lucide-react';
import { 
  useAddMappingRule, 
  useRemoveMappingRule, 
  useCategoryTaxonomies,
  useSearchTaxonomies,
} from '@/hooks/useCategoryMapping';
import { CategoryMapping } from '@/services/CategoryMappingService';

interface MappingRulesEditorProps {
  mapping: CategoryMapping;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MappingRulesEditor({ mapping, open, onOpenChange }: MappingRulesEditorProps) {
  const [sourceCategory, setSourceCategory] = useState('');
  const [destinationCategory, setDestinationCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const addRule = useAddMappingRule();
  const removeRule = useRemoveMappingRule();
  const { data: taxonomies = [] } = useCategoryTaxonomies(mapping.destination_type);
  const { data: searchResults = [] } = useSearchTaxonomies(mapping.destination_type, searchTerm);

  const handleAddRule = async () => {
    if (!sourceCategory.trim() || !destinationCategory.trim()) return;

    await addRule.mutateAsync({
      mappingId: mapping.id,
      sourceCategory: sourceCategory.trim(),
      destinationCategory: destinationCategory.trim(),
    });

    setSourceCategory('');
    setDestinationCategory('');
  };

  const handleRemoveRule = (source: string) => {
    removeRule.mutate({ mappingId: mapping.id, sourceCategory: source });
  };

  const selectTaxonomy = (categoryName: string) => {
    setDestinationCategory(categoryName);
    setSearchTerm('');
  };

  const displayTaxonomies = searchTerm.length >= 2 ? searchResults : taxonomies.slice(0, 20);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Règles de mapping: {mapping.name}</DialogTitle>
          <DialogDescription>
            Définissez les correspondances entre catégories source et destination
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add new rule */}
          <div className="p-4 border rounded-lg space-y-4">
            <h3 className="font-medium">Ajouter une règle</h3>
            <div className="grid grid-cols-5 gap-3 items-end">
              <div className="col-span-2">
                <Label>Catégorie source</Label>
                <Input
                  value={sourceCategory}
                  onChange={(e) => setSourceCategory(e.target.value)}
                  placeholder="Ex: Chaussures Homme"
                />
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="col-span-2">
                <Label>Catégorie destination</Label>
                <Input
                  value={destinationCategory}
                  onChange={(e) => setDestinationCategory(e.target.value)}
                  placeholder="Ex: Vêtements et accessoires > Chaussures"
                />
              </div>
            </div>

            {/* Taxonomy search */}
            <div>
              <Label>Rechercher dans la taxonomie {mapping.destination_type}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une catégorie..."
                  className="pl-10"
                />
              </div>
              {displayTaxonomies.length > 0 && (
                <ScrollArea className="h-32 mt-2 border rounded-lg p-2">
                  <div className="space-y-1">
                    {displayTaxonomies.map((tax) => (
                      <button
                        key={tax.id}
                        onClick={() => selectTaxonomy(tax.full_path || tax.category_name)}
                        className="w-full text-left px-2 py-1 text-sm rounded hover:bg-muted"
                      >
                        {tax.full_path || tax.category_name}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <Button 
              onClick={handleAddRule}
              disabled={!sourceCategory.trim() || !destinationCategory.trim() || addRule.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter la règle
            </Button>
          </div>

          {/* Existing rules */}
          <div>
            <h3 className="font-medium mb-3">
              Règles existantes ({mapping.mappings.length})
            </h3>
            {mapping.mappings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune règle définie
              </p>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {mapping.mappings.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{rule.sourceCategory}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">{rule.destinationCategory}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveRule(rule.sourceCategory)}
                        disabled={removeRule.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
