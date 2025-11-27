import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Store, Layout, Palette, FileText, TrendingUp, Settings } from 'lucide-react';
import { useStoreBuilder } from '@/hooks/useStoreBuilder';

export default function AIStoreBuilderHub() {
  const [storeName, setStoreName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const { generateStore, getThemes, getGeneratedStores } = useStoreBuilder();

  const themes = getThemes.data || [];
  const stores = getGeneratedStores.data || [];

  const handleGenerate = () => {
    generateStore.mutate({
      store_name: storeName,
      theme_preferences: { theme_id: selectedTheme }
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Store Builder
          </h1>
          <p className="text-muted-foreground mt-2">
            Générez une boutique complète en quelques clics avec IA
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Sparkles className="h-4 w-4 mr-2" />
              Créer une boutique
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouvelle boutique IA</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom de la boutique</Label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ma Boutique Premium"
                />
              </div>

              <div>
                <Label className="mb-3 block">Choisir un thème</Label>
                <div className="grid grid-cols-3 gap-4">
                  {themes.map((theme: any) => (
                    <Card
                      key={theme.id}
                      className={`p-4 cursor-pointer hover:border-primary transition-all ${
                        selectedTheme === theme.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedTheme(theme.id)}
                    >
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-3" />
                      <p className="font-semibold">{theme.name}</p>
                      <Badge variant="outline" className="mt-2">{theme.category}</Badge>
                    </Card>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!storeName || !selectedTheme || generateStore.isPending}
                className="w-full"
              >
                {generateStore.isPending ? 'Génération...' : 'Générer ma boutique'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="stores">
        <TabsList>
          <TabsTrigger value="stores">Mes boutiques</TabsTrigger>
          <TabsTrigger value="themes">Thèmes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4">
          {stores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stores.map((store: any) => (
                <Card key={store.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Store className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-bold">{store.store_name}</h3>
                        <Badge variant={store.generation_status === 'completed' ? 'default' : 'secondary'}>
                          {store.generation_status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Pages créées</p>
                      <p className="text-lg font-bold">{store.pages_created || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Produits</p>
                      <p className="text-lg font-bold">{store.products_imported || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">SEO Score</p>
                      <p className="text-lg font-bold">{(store.seo_score * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Layout className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Éditer
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune boutique générée</h3>
              <p className="text-muted-foreground">
                Créez votre première boutique avec l'IA en quelques secondes
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="themes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {themes.map((theme: any) => (
              <Card key={theme.id} className="p-6">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4" />
                <h3 className="font-bold mb-2">{theme.name}</h3>
                <Badge variant="outline">{theme.category}</Badge>
                <div className="flex gap-2 mt-4">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.color_scheme.primary }} />
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.color_scheme.secondary }} />
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.color_scheme.accent }} />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Store className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Boutiques créées</p>
              </div>
              <p className="text-3xl font-bold">{stores.length}</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-green-500" />
                <p className="text-sm text-muted-foreground">Pages générées</p>
              </div>
              <p className="text-3xl font-bold">
                {stores.reduce((sum: number, s: any) => sum + (s.pages_created || 0), 0)}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <p className="text-sm text-muted-foreground">SEO moyen</p>
              </div>
              <p className="text-3xl font-bold">
                {stores.length > 0
                  ? (
                      (stores.reduce((sum: number, s: any) => sum + (s.seo_score || 0), 0) / stores.length) *
                      100
                    ).toFixed(0)
                  : 0}
                %
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}