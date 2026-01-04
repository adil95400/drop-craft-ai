import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAdCollections, useCreateCollection } from '@/hooks/useAdsSpy';
import { AdCard } from './AdCard';
import { FolderHeart, Plus, Loader2, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function AdsCollectionsPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({ name: '', description: '', color: '#3B82F6' });
  
  const { data, isLoading } = useAdCollections();
  const createCollection = useCreateCollection();

  const handleCreate = async () => {
    if (!newCollection.name.trim()) return;
    
    await createCollection.mutateAsync(newCollection);
    setNewCollection({ name: '', description: '', color: '#3B82F6' });
    setIsCreateOpen(false);
  };

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderHeart className="w-5 h-5" />
                Mes Collections
              </CardTitle>
              <CardDescription>
                Organisez et sauvegardez vos publicités préférées
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une Collection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de la collection</Label>
                    <Input
                      id="name"
                      value={newCollection.name}
                      onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                      placeholder="Ex: Meilleures pubs TikTok"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      id="description"
                      value={newCollection.description}
                      onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                      placeholder="Notes sur cette collection..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Couleur</Label>
                    <div className="flex gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${
                            newCollection.color === color ? 'border-foreground scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewCollection({ ...newCollection, color })}
                        />
                      ))}
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreate}
                    disabled={!newCollection.name.trim() || createCollection.isPending}
                  >
                    {createCollection.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Créer la Collection
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data?.collections && data.collections.length > 0 ? (
        <Accordion type="single" collapsible className="space-y-2">
          {data.collections.map((collection) => (
            <AccordionItem key={collection.id} value={collection.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: collection.color }}
                  />
                  <span className="font-medium">{collection.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {collection.items?.length || 0} pubs
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {collection.description && (
                  <p className="text-sm text-muted-foreground mb-4">{collection.description}</p>
                )}
                {collection.items && collection.items.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {collection.items.map((item) => (
                      <AdCard key={item.id} ad={item.ad} showAnalysis={!!item.ad.ai_analysis} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Cette collection est vide. Ajoutez des publicités depuis la recherche.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Vous n'avez pas encore de collections.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Créez votre première collection pour organiser vos publicités favorites.
            </p>
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une Collection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
