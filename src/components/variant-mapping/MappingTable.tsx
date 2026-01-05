/**
 * Mapping Table Component
 * Affiche les mappings de variantes dans un tableau interactif
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useUpdateVariantMapping, 
  useDeleteVariantMapping 
} from '@/hooks/useVariantMapping';
import { VariantMapping } from '@/services/VariantMappingService';
import { 
  MoreVertical, Edit, Trash2, ArrowRight, Palette, 
  Ruler, Package, Loader2, CheckCircle, XCircle 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MappingTableProps {
  mappings: VariantMapping[];
  isLoading: boolean;
  selectedMappings: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function MappingTable({ 
  mappings, 
  isLoading, 
  selectedMappings, 
  onSelectionChange 
}: MappingTableProps) {
  const updateMutation = useUpdateVariantMapping();
  const deleteMutation = useDeleteVariantMapping();

  const toggleSelection = (id: string) => {
    if (selectedMappings.includes(id)) {
      onSelectionChange(selectedMappings.filter(m => m !== id));
    } else {
      onSelectionChange([...selectedMappings, id]);
    }
  };

  const toggleAll = () => {
    if (selectedMappings.length === mappings.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(mappings.map(m => m.id));
    }
  };

  const handleToggleActive = (mapping: VariantMapping) => {
    updateMutation.mutate({
      id: mapping.id,
      updates: { is_active: !mapping.is_active }
    });
  };

  const getOptionIcon = (optionName: string) => {
    const name = optionName.toLowerCase();
    if (name.includes('color') || name.includes('couleur')) {
      return <Palette className="h-4 w-4 text-pink-500" />;
    }
    if (name.includes('size') || name.includes('taille')) {
      return <Ruler className="h-4 w-4 text-blue-500" />;
    }
    return <Package className="h-4 w-4 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-2 p-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mappings.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">Aucun mapping trouvé</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Créez votre premier mapping de variante pour commencer
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedMappings.length === mappings.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source (Fournisseur)</TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Cible (Catalogue)</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Auto-sync</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping) => (
              <TableRow 
                key={mapping.id}
                className={selectedMappings.includes(mapping.id) ? 'bg-muted/50' : ''}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedMappings.includes(mapping.id)}
                    onCheckedChange={() => toggleSelection(mapping.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getOptionIcon(mapping.source_option_name)}
                    <span className="font-medium text-sm">
                      {mapping.source_option_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono">
                    {mapping.source_option_value}
                  </Badge>
                  {mapping.source_sku && (
                    <span className="text-xs text-muted-foreground ml-2">
                      SKU: {mapping.source_sku}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono bg-primary/5">
                    {mapping.target_option_value}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {mapping.is_active ? (
                      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactif
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={mapping.auto_sync}
                    onCheckedChange={() => {
                      updateMutation.mutate({
                        id: mapping.id,
                        updates: { auto_sync: !mapping.auto_sync }
                      });
                    }}
                    disabled={updateMutation.isPending}
                  />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleActive(mapping)}>
                        {mapping.is_active ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activer
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(mapping.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
