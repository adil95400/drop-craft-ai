import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Tags, 
  Plus, 
  X, 
  Palette,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Users
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
  description?: string;
}

interface CustomerTagsProps {
  customerId?: string;
  onTagsChange?: (tags: string[]) => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#f43f5e', '#84cc16', '#10b981', '#0ea5e9', '#a855f7'
];

export const CustomerTags: React.FC<CustomerTagsProps> = ({
  customerId,
  onTagsChange
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  // Mock data - in production, fetch from database
  const [allTags, setAllTags] = useState<Tag[]>([
    { id: '1', name: 'VIP', color: '#eab308', count: 45, description: 'Clients premium avec historique d\'achat élevé' },
    { id: '2', name: 'B2B', color: '#3b82f6', count: 120, description: 'Clients professionnels' },
    { id: '3', name: 'Nouveau', color: '#22c55e', count: 230, description: 'Premiers achats dans les 30 derniers jours' },
    { id: '4', name: 'Inactif', color: '#ef4444', count: 89, description: 'Pas d\'achat depuis 90 jours' },
    { id: '5', name: 'Newsletter', color: '#8b5cf6', count: 567, description: 'Abonnés à la newsletter' },
    { id: '6', name: 'Fidèle', color: '#14b8a6', count: 156, description: 'Plus de 5 commandes' },
    { id: '7', name: 'À risque', color: '#f97316', count: 34, description: 'Comportement de désengagement détecté' },
    { id: '8', name: 'Ambassadeur', color: '#ec4899', count: 23, description: 'Clients avec programme de parrainage actif' }
  ]);

  const [selectedTags, setSelectedTags] = useState<string[]>(['1', '5']); // VIP et Newsletter

  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;

    const newTag: Tag = {
      id: Date.now().toString(),
      name: newTagName,
      color: newTagColor,
      count: 0
    };

    setAllTags([...allTags, newTag]);
    setNewTagName('');
    setNewTagColor(PRESET_COLORS[0]);
    setIsCreatingTag(false);
    toast({ title: 'Tag créé', description: `Le tag "${newTagName}" a été créé.` });
  };

  const handleDeleteTag = (tagId: string) => {
    setAllTags(allTags.filter(t => t.id !== tagId));
    setSelectedTags(selectedTags.filter(id => id !== tagId));
    toast({ title: 'Tag supprimé' });
  };

  const toggleTagSelection = (tagId: string) => {
    const newSelection = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(newSelection);
    onTagsChange?.(newSelection);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            Tags personnalisés
          </CardTitle>
          <Dialog open={isCreatingTag} onOpenChange={setIsCreatingTag}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nouveau tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau tag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Nom du tag</label>
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Ex: VIP Gold"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Couleur</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          newTagColor === color ? 'scale-110 border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreatingTag(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateTag}>
                    Créer le tag
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Selected tags (for customer) */}
        {customerId && selectedTags.length > 0 && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Tags assignés à ce client</p>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tagId) => {
                const tag = allTags.find(t => t.id === tagId);
                if (!tag) return null;
                return (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}40` }}
                    className="px-3 py-1 flex items-center gap-1"
                  >
                    {tag.name}
                    <button
                      onClick={() => toggleTagSelection(tag.id)}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* All tags */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Tous les tags ({allTags.length})</p>
          <div className="grid gap-2">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTags.includes(tag.id) ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
                }`}
                onClick={() => customerId && toggleTagSelection(tag.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div>
                    <span className="font-medium">{tag.name}</span>
                    {tag.description && (
                      <p className="text-xs text-muted-foreground">{tag.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {tag.count}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tag statistics */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Statistiques des tags</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold">{allTags.length}</p>
              <p className="text-xs text-muted-foreground">Tags créés</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold">
                {allTags.reduce((sum, tag) => sum + tag.count, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Assignations totales</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
