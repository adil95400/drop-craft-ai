import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, Bell, Plus, Eye, Copy, Trash2, Edit, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  subject?: string;
  content: string;
  tags: string[];
  createdAt: string;
  usageCount: number;
}

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Bienvenue nouveau client',
    type: 'email',
    subject: 'Bienvenue chez {{company}} !',
    content: 'Bonjour {{prénom}},\n\nMerci de nous avoir rejoint ! Voici votre code de bienvenue : {{code_promo}}\n\nÀ bientôt,\nL\'équipe {{company}}',
    tags: ['onboarding', 'welcome'],
    createdAt: '2024-01-15',
    usageCount: 245
  },
  {
    id: '2',
    name: 'Panier abandonné',
    type: 'email',
    subject: '{{prénom}}, votre panier vous attend !',
    content: 'Bonjour {{prénom}},\n\nVous avez oublié {{produit}} dans votre panier.\n\nFinalisez votre commande avec -10% : {{lien_panier}}',
    tags: ['cart', 'recovery'],
    createdAt: '2024-01-20',
    usageCount: 189
  },
  {
    id: '3',
    name: 'Confirmation commande SMS',
    type: 'sms',
    content: '{{company}}: Commande #{{order_id}} confirmée ! Livraison prévue le {{date_livraison}}. Suivi: {{tracking_url}}',
    tags: ['order', 'confirmation'],
    createdAt: '2024-02-01',
    usageCount: 567
  },
  {
    id: '4',
    name: 'Flash Sale Push',
    type: 'push',
    content: '🔥 {{prénom}}, -{{discount}}% sur {{category}} pendant 24h seulement !',
    tags: ['promo', 'flash-sale'],
    createdAt: '2024-02-10',
    usageCount: 1203
  }
];

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [activeType, setActiveType] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'push',
    subject: '',
    content: '',
    tags: ''
  });

  const filteredTemplates = activeType === 'all' 
    ? templates 
    : templates.filter(t => t.type === activeType);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const handleCreate = () => {
    const template: Template = {
      id: Date.now().toString(),
      name: newTemplate.name,
      type: newTemplate.type,
      subject: newTemplate.type === 'email' ? newTemplate.subject : undefined,
      content: newTemplate.content,
      tags: newTemplate.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString().split('T')[0],
      usageCount: 0
    };
    setTemplates([template, ...templates]);
    setIsCreateOpen(false);
    setNewTemplate({ name: '', type: 'email', subject: '', content: '', tags: '' });
    toast.success('Template créé avec succès');
  };

  const handleDuplicate = (template: Template) => {
    const duplicate: Template = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (copie)`,
      createdAt: new Date().toISOString().split('T')[0],
      usageCount: 0
    };
    setTemplates([duplicate, ...templates]);
    toast.success('Template dupliqué');
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast.success('Template supprimé');
  };

  const renderPreview = (template: Template) => {
    const previewData: Record<string, string> = {
      '{{prénom}}': 'Marie',
      '{{company}}': 'ShopOpti',
      '{{code_promo}}': 'WELCOME10',
      '{{produit}}': 'Sneakers Nike Air',
      '{{lien_panier}}': 'https://shop.com/cart/abc123',
      '{{order_id}}': '12345',
      '{{date_livraison}}': '15 Mars 2024',
      '{{tracking_url}}': 'https://track.me/xyz',
      '{{discount}}': '30',
      '{{category}}': 'Chaussures'
    };

    let content = template.content;
    let subject = template.subject || '';
    
    Object.entries(previewData).forEach(([tag, value]) => {
      content = content.replace(new RegExp(tag.replace(/[{}]/g, '\\$&'), 'g'), value);
      subject = subject.replace(new RegExp(tag.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return { content, subject };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestionnaire de Templates</h2>
          <p className="text-muted-foreground">
            Créez et gérez vos templates email, SMS et push notifications
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un template</DialogTitle>
              <DialogDescription>
                Utilisez des tags dynamiques comme {"{{prénom}}"}, {"{{produit}}"}, etc.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du template</Label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="Ex: Email de bienvenue"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newTemplate.type}
                    onValueChange={(v) => setNewTemplate({ ...newTemplate, type: v as 'email' | 'sms' | 'push' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {newTemplate.type === 'email' && (
                <div className="space-y-2">
                  <Label>Sujet</Label>
                  <Input
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    placeholder="Ex: Bienvenue chez {{company}} !"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Contenu</Label>
                <Textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="Bonjour {{prénom}},..."
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (séparés par virgule)</Label>
                <Input
                  value={newTemplate.tags}
                  onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                  placeholder="welcome, onboarding"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={!newTemplate.name || !newTemplate.content}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeType} onValueChange={setActiveType}>
        <TabsList>
          <TabsTrigger value="all">Tous ({templates.length})</TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-1" />
            Email ({templates.filter(t => t.type === 'email').length})
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="h-4 w-4 mr-1" />
            SMS ({templates.filter(t => t.type === 'sms').length})
          </TabsTrigger>
          <TabsTrigger value="push">
            <Bell className="h-4 w-4 mr-1" />
            Push ({templates.filter(t => t.type === 'push').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(template.type)}
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </div>
                <Badge variant="outline">{template.type.toUpperCase()}</Badge>
              </div>
              {template.subject && (
                <CardDescription className="text-sm truncate">
                  {template.subject}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {template.content}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {template.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{template.usageCount} utilisations</span>
                <span>{template.createdAt}</span>
              </div>
              <div className="flex gap-1 mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDuplicate(template)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Prévisualisation
            </DialogTitle>
            <DialogDescription>
              Aperçu avec données de test
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getTypeIcon(previewTemplate.type)}
                <Badge>{previewTemplate.type.toUpperCase()}</Badge>
              </div>
              {previewTemplate.subject && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Sujet:</p>
                  <p className="font-medium">{renderPreview(previewTemplate).subject}</p>
                </div>
              )}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Contenu:</p>
                <p className="whitespace-pre-wrap">{renderPreview(previewTemplate).content}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
