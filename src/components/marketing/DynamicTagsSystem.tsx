import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Plus, Tag, User, ShoppingCart, Calendar, MapPin, Sparkles, Check, Code } from 'lucide-react';
import { toast } from 'sonner';

interface DynamicTag {
  id: string;
  name: string;
  syntax: string;
  category: 'customer' | 'order' | 'product' | 'date' | 'custom';
  description: string;
  example: string;
  fallback?: string;
}

const defaultTags: DynamicTag[] = [
  // Customer tags
  { id: '1', name: 'Prénom', syntax: '{{prénom}}', category: 'customer', description: 'Prénom du client', example: 'Marie', fallback: 'Client' },
  { id: '2', name: 'Nom', syntax: '{{nom}}', category: 'customer', description: 'Nom de famille', example: 'Dupont', fallback: '' },
  { id: '3', name: 'Email', syntax: '{{email}}', category: 'customer', description: 'Adresse email', example: 'marie@example.com' },
  { id: '4', name: 'Téléphone', syntax: '{{telephone}}', category: 'customer', description: 'Numéro de téléphone', example: '06 12 34 56 78' },
  { id: '5', name: 'Ville', syntax: '{{ville}}', category: 'customer', description: 'Ville du client', example: 'Paris' },
  { id: '6', name: 'Points fidélité', syntax: '{{points_fidelite}}', category: 'customer', description: 'Solde de points', example: '1250' },
  
  // Order tags
  { id: '7', name: 'Numéro commande', syntax: '{{order_id}}', category: 'order', description: 'ID de la commande', example: '#12345' },
  { id: '8', name: 'Total commande', syntax: '{{order_total}}', category: 'order', description: 'Montant total TTC', example: '89.99€' },
  { id: '9', name: 'Date livraison', syntax: '{{date_livraison}}', category: 'order', description: 'Date estimée', example: '15 Mars 2024' },
  { id: '10', name: 'Lien suivi', syntax: '{{tracking_url}}', category: 'order', description: 'URL de suivi colis', example: 'https://track.me/xyz' },
  { id: '11', name: 'Lien panier', syntax: '{{lien_panier}}', category: 'order', description: 'Lien vers panier abandonné', example: 'https://shop.com/cart/abc' },
  
  // Product tags
  { id: '12', name: 'Nom produit', syntax: '{{produit}}', category: 'product', description: 'Nom du produit', example: 'Sneakers Nike Air' },
  { id: '13', name: 'Prix produit', syntax: '{{prix_produit}}', category: 'product', description: 'Prix du produit', example: '129.99€' },
  { id: '14', name: 'Image produit', syntax: '{{image_produit}}', category: 'product', description: 'URL de l\'image', example: 'https://...' },
  { id: '15', name: 'Catégorie', syntax: '{{category}}', category: 'product', description: 'Catégorie du produit', example: 'Chaussures' },
  
  // Date tags
  { id: '16', name: 'Date actuelle', syntax: '{{date_aujourdhui}}', category: 'date', description: 'Date du jour', example: '10 Déc 2024' },
  { id: '17', name: 'Heure actuelle', syntax: '{{heure}}', category: 'date', description: 'Heure actuelle', example: '14:30' },
  { id: '18', name: 'Jour semaine', syntax: '{{jour_semaine}}', category: 'date', description: 'Jour de la semaine', example: 'Mardi' },
  
  // Custom/Promo tags
  { id: '19', name: 'Code promo', syntax: '{{code_promo}}', category: 'custom', description: 'Code de réduction', example: 'WELCOME10' },
  { id: '20', name: 'Réduction %', syntax: '{{discount}}', category: 'custom', description: 'Pourcentage de réduction', example: '20' },
  { id: '21', name: 'Nom entreprise', syntax: '{{company}}', category: 'custom', description: 'Nom de votre boutique', example: 'ShopOpti' }
];

export function DynamicTagsSystem() {
  const [tags, setTags] = useState<DynamicTag[]>(defaultTags);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [testContent, setTestContent] = useState('Bonjour {{prénom}}, votre commande {{order_id}} sera livrée le {{date_livraison}}. Utilisez le code {{code_promo}} pour -{{discount}}% sur votre prochaine commande !');
  const [newTag, setNewTag] = useState({
    name: '',
    syntax: '',
    category: 'custom' as DynamicTag['category'],
    description: '',
    fallback: ''
  });

  const filteredTags = activeCategory === 'all' 
    ? tags 
    : tags.filter(t => t.category === activeCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'customer': return <User className="h-4 w-4" />;
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      case 'product': return <Tag className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'custom': return <Sparkles className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      customer: 'Client',
      order: 'Commande',
      product: 'Produit',
      date: 'Date',
      custom: 'Personnalisé'
    };
    return labels[category] || category;
  };

  const copyToClipboard = (syntax: string) => {
    navigator.clipboard.writeText(syntax);
    toast.success('Tag copié !');
  };

  const handleCreateTag = () => {
    const tag: DynamicTag = {
      id: Date.now().toString(),
      name: newTag.name,
      syntax: `{{${newTag.syntax.replace(/[{}]/g, '')}}}`,
      category: newTag.category,
      description: newTag.description,
      example: 'Valeur personnalisée',
      fallback: newTag.fallback
    };
    setTags([...tags, tag]);
    setIsCreateOpen(false);
    setNewTag({ name: '', syntax: '', category: 'custom', description: '', fallback: '' });
    toast.success('Tag personnalisé créé');
  };

  const renderPreview = () => {
    const testData: Record<string, string> = {
      '{{prénom}}': 'Marie',
      '{{nom}}': 'Dupont',
      '{{email}}': 'marie@example.com',
      '{{telephone}}': '06 12 34 56 78',
      '{{ville}}': 'Paris',
      '{{points_fidelite}}': '1250',
      '{{order_id}}': '#12345',
      '{{order_total}}': '89.99€',
      '{{date_livraison}}': '15 Mars 2024',
      '{{tracking_url}}': 'https://track.me/xyz',
      '{{lien_panier}}': 'https://shop.com/cart/abc',
      '{{produit}}': 'Sneakers Nike Air',
      '{{prix_produit}}': '129.99€',
      '{{category}}': 'Chaussures',
      '{{date_aujourdhui}}': '10 Déc 2024',
      '{{heure}}': '14:30',
      '{{jour_semaine}}': 'Mardi',
      '{{code_promo}}': 'WELCOME10',
      '{{discount}}': '20',
      '{{company}}': 'ShopOpti'
    };

    let preview = testContent;
    Object.entries(testData).forEach(([tag, value]) => {
      preview = preview.replace(new RegExp(tag.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return preview;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tags Dynamiques</h2>
          <p className="text-muted-foreground">
            Personnalisez vos messages avec des variables dynamiques
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un tag personnalisé</DialogTitle>
              <DialogDescription>
                Définissez une nouvelle variable pour vos templates
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du tag</Label>
                  <Input
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    placeholder="Ex: Nom conseiller"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Syntaxe</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-sm">{'{{'}</span>
                    <Input
                      value={newTag.syntax}
                      onChange={(e) => setNewTag({ ...newTag, syntax: e.target.value })}
                      placeholder="nom_conseiller"
                      className="rounded-l-none rounded-r-none"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 bg-muted text-sm">{'}}'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={newTag.category}
                  onValueChange={(v) => setNewTag({ ...newTag, category: v as DynamicTag['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Client</SelectItem>
                    <SelectItem value="order">Commande</SelectItem>
                    <SelectItem value="product">Produit</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                  placeholder="Description du tag"
                />
              </div>
              <div className="space-y-2">
                <Label>Valeur par défaut (optionnel)</Label>
                <Input
                  value={newTag.fallback}
                  onChange={(e) => setNewTag({ ...newTag, fallback: e.target.value })}
                  placeholder="Valeur si donnée manquante"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTag} disabled={!newTag.name || !newTag.syntax}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tags Library */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bibliothèque de tags</CardTitle>
              <CardDescription>Cliquez pour copier un tag</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="customer">
                    <User className="h-4 w-4 mr-1" />
                    Client
                  </TabsTrigger>
                  <TabsTrigger value="order">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Commande
                  </TabsTrigger>
                  <TabsTrigger value="product">
                    <Tag className="h-4 w-4 mr-1" />
                    Produit
                  </TabsTrigger>
                  <TabsTrigger value="date">
                    <Calendar className="h-4 w-4 mr-1" />
                    Date
                  </TabsTrigger>
                  <TabsTrigger value="custom">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Custom
                  </TabsTrigger>
                </TabsList>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => copyToClipboard(tag.syntax)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-muted">
                          {getCategoryIcon(tag.category)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tag.name}</p>
                          <code className="text-xs text-muted-foreground">{tag.syntax}</code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {tag.example}
                        </Badge>
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Test Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Test en direct
              </CardTitle>
              <CardDescription>
                Testez vos tags avec des données exemple
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Contenu avec tags</Label>
                <Textarea
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Prévisualisation
                </Label>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{renderPreview()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conditions avancées</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><code className="bg-muted px-1 rounded">{'{{#if prénom}}'}</code> - Condition si existe</p>
              <p><code className="bg-muted px-1 rounded">{'{{prénom|"Client"}}'}</code> - Valeur par défaut</p>
              <p><code className="bg-muted px-1 rounded">{'{{prix|format:"€"}}'}</code> - Formatage</p>
              <p><code className="bg-muted px-1 rounded">{'{{date|format:"DD/MM"}}'}</code> - Format date</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
