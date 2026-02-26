import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Plus, Mail, MoreHorizontal, Edit, Trash2, Copy, Eye, 
  Loader2, Search, Filter, FileText, Code, CheckCircle2, XCircle 
} from 'lucide-react';
import { useEmailTemplates, EmailTemplate } from '@/hooks/useEmailTemplates';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

const CATEGORIES = [
  { value: 'welcome', label: 'Bienvenue' },
  { value: 'transactional', label: 'Transactionnel' },
  { value: 'promotional', label: 'Promotionnel' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'notification', label: 'Notification' },
  { value: 'other', label: 'Autre' },
];

const DEFAULT_HTML_CONTENT = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px;">
    <h1 style="color: #333;">Bonjour {{name}},</h1>
    <p style="color: #666; line-height: 1.6;">
      Votre contenu ici...
    </p>
    <a href="{{cta_link}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
      Découvrir
    </a>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #999; font-size: 12px;">
      © 2024 Votre entreprise. Tous droits réservés.
    </p>
  </div>
</body>
</html>`;

export function EmailTemplatesManager() {
  const { 
    templates, 
    isLoading, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate, 
    duplicateTemplate,
    isCreating,
    isUpdating 
  } = useEmailTemplates();

  const locale = useDateFnsLocale();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_content: DEFAULT_HTML_CONTENT,
    text_content: '',
    category: 'other',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      html_content: DEFAULT_HTML_CONTENT,
      text_content: '',
      category: 'other',
      is_active: true,
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.subject) return;
    createTemplate({
      ...formData,
      thumbnail_url: null,
      variables: null,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      category: template.category || 'other',
      is_active: template.is_active ?? true,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedTemplate) return;
    updateTemplate({ id: selectedTemplate.id, ...formData });
    setIsEditOpen(false);
    setSelectedTemplate(null);
    resetForm();
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (value: string | null) => {
    return CATEGORIES.find(c => c.value === value)?.label || 'Autre';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Templates d'email</CardTitle>
              <CardDescription>Créez et gérez vos modèles d'email personnalisés</CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un template</DialogTitle>
                </DialogHeader>
                <TemplateForm 
                  formData={formData} 
                  setFormData={setFormData} 
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating || !formData.name || !formData.subject}>
                    {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="group hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="h-32 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                      <Mail className="h-10 w-10 text-primary/40" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handlePreview(template)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold truncate">{template.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePreview(template)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Aperçu
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateTemplate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteId(template.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryLabel(template.category)}
                      </Badge>
                      {template.is_active ? (
                        <Badge className="bg-green-500/10 text-green-600 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactif
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                      Modifié le {template.updated_at 
                        ? format(new Date(template.updated_at), 'dd MMM yyyy', { locale })
                        : format(new Date(template.created_at!), 'dd MMM yyyy', { locale })
                      }
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun template</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre premier template d'email
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le template</DialogTitle>
          </DialogHeader>
          <TemplateForm formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating || !formData.name || !formData.subject}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Aperçu: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            <iframe
              srcDoc={selectedTemplate?.html_content}
              className="w-full h-[500px] bg-white"
              title="Email Preview"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce template ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le template sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteTemplate(deleteId);
                setDeleteId(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface FormData {
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  category: string;
  is_active: boolean;
}

interface TemplateFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

function TemplateForm({ formData, setFormData }: TemplateFormProps) {
  const [activeTab, setActiveTab] = useState<'html' | 'text'>('html');

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du template *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Email de bienvenue"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Objet de l'email *</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Ex: Bienvenue chez nous !"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Contenu</Label>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'html' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('html')}
            >
              <Code className="h-4 w-4 mr-1" />
              HTML
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'text' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('text')}
            >
              <FileText className="h-4 w-4 mr-1" />
              Texte
            </Button>
          </div>
        </div>
        
        {activeTab === 'html' ? (
          <Textarea
            value={formData.html_content}
            onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
            placeholder="Contenu HTML de l'email..."
            className="min-h-[300px] font-mono text-sm"
          />
        ) : (
          <Textarea
            value={formData.text_content}
            onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
            placeholder="Version texte de l'email (pour les clients qui ne supportent pas HTML)..."
            className="min-h-[300px]"
          />
        )}
        <p className="text-xs text-muted-foreground">
          Variables disponibles: {'{{name}}'}, {'{{email}}'}, {'{{subject}}'}, {'{{cta_link}}'}
        </p>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <Label htmlFor="is_active" className="cursor-pointer">Template actif</Label>
          <p className="text-sm text-muted-foreground">
            Les templates inactifs ne peuvent pas être utilisés dans les campagnes
          </p>
        </div>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>
    </div>
  );
}

export default EmailTemplatesManager;
