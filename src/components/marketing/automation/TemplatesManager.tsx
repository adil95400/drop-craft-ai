import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, Plus, Search, MoreVertical, Copy, Trash2, Edit, Eye, 
  Loader2, Code, Palette, Mail, ShoppingCart, Gift, UserPlus, AlertCircle
} from 'lucide-react'
import { useEmailTemplates, EmailTemplate } from '@/hooks/useEmailTemplates'
import DOMPurify from 'dompurify'

// Configure DOMPurify for email templates - allow safe HTML tags for email content
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'b', 'i', 'br', 'ul', 'ol', 'li', 'a', 'img', 'span', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'blockquote', 'hr', 'pre', 'code'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class', 'id', 'width', 'height', 'border', 'cellpadding', 'cellspacing', 'align', 'valign', 'bgcolor', 'target'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
}

// Sanitize HTML content to prevent XSS attacks
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG)
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  welcome: <UserPlus className="h-4 w-4" />,
  cart_abandonment: <ShoppingCart className="h-4 w-4" />,
  order_confirmation: <Gift className="h-4 w-4" />,
  newsletter: <Mail className="h-4 w-4" />,
  reactivation: <AlertCircle className="h-4 w-4" />,
  general: <FileText className="h-4 w-4" />
}

const CATEGORY_LABELS: Record<string, string> = {
  welcome: 'Bienvenue',
  cart_abandonment: 'Panier abandonné',
  order_confirmation: 'Confirmation commande',
  newsletter: 'Newsletter',
  reactivation: 'Réactivation',
  general: 'Général'
}

export function TemplatesManager() {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate, initializeDefaultTemplates } = useEmailTemplates()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual')
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    category: 'general',
    html_content: '',
    variables: [] as string[]
  })

  useEffect(() => {
    if (!isLoading && templates.length === 0) {
      initializeDefaultTemplates()
    }
  }, [isLoading, templates.length])

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                         t.subject.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleCreate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.html_content) return
    createTemplate({
      name: newTemplate.name,
      subject: newTemplate.subject,
      category: newTemplate.category,
      html_content: newTemplate.html_content,
      variables: newTemplate.variables
    })
    setShowCreateDialog(false)
    setNewTemplate({ name: '', subject: '', category: 'general', html_content: '', variables: [] })
  }

  const handleUpdate = () => {
    if (!selectedTemplate) return
    updateTemplate({
      id: selectedTemplate.id,
      name: selectedTemplate.name,
      subject: selectedTemplate.subject,
      category: selectedTemplate.category,
      html_content: selectedTemplate.html_content
    })
    setShowEditDialog(false)
    setSelectedTemplate(null)
  }

  const extractVariables = (content: string) => {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || []
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim()))]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.length === 0 ? (
          <Card className="col-span-full p-8 text-center">
            <p className="text-muted-foreground">Aucun template trouvé</p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un template
            </Button>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <TemplateCard 
              key={template.id}
              template={template}
              onPreview={() => { setSelectedTemplate(template); setShowPreviewDialog(true) }}
              onEdit={() => { setSelectedTemplate(template); setShowEditDialog(true) }}
              onDuplicate={() => duplicateTemplate(template.id)}
              onDelete={() => deleteTemplate(template.id)}
            />
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Nouveau Template</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du template</Label>
                <Input 
                  placeholder="Ex: Email de bienvenue"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Objet</Label>
                <Input 
                  placeholder="Objet de l'email"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select 
                  value={newTemplate.category} 
                  onValueChange={(v) => setNewTemplate({ ...newTemplate, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Contenu HTML</Label>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant={editorMode === 'visual' ? 'default' : 'outline'}
                      onClick={() => setEditorMode('visual')}
                    >
                      <Palette className="h-3 w-3 mr-1" />
                      Visuel
                    </Button>
                    <Button 
                      size="sm" 
                      variant={editorMode === 'code' ? 'default' : 'outline'}
                      onClick={() => setEditorMode('code')}
                    >
                      <Code className="h-3 w-3 mr-1" />
                      Code
                    </Button>
                  </div>
                </div>
                <Textarea 
                  placeholder="<div>Votre contenu HTML...</div>"
                  value={newTemplate.html_content}
                  onChange={(e) => {
                    setNewTemplate({ 
                      ...newTemplate, 
                      html_content: e.target.value,
                      variables: extractVariables(e.target.value)
                    })
                  }}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              {newTemplate.variables.length > 0 && (
                <div className="space-y-2">
                  <Label>Variables détectées</Label>
                  <div className="flex flex-wrap gap-2">
                    {newTemplate.variables.map(v => (
                      <Badge key={v} variant="secondary">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Prévisualisation</Label>
              <div 
                className="border rounded-lg p-4 bg-white h-[400px] overflow-auto"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(newTemplate.html_content) }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={!newTemplate.name || !newTemplate.subject || !newTemplate.html_content}>
              Créer le template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Modifier le Template</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom du template</Label>
                  <Input 
                    value={selectedTemplate.name}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Objet</Label>
                  <Input 
                    value={selectedTemplate.subject}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select 
                    value={selectedTemplate.category} 
                    onValueChange={(v) => setSelectedTemplate({ ...selectedTemplate, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contenu HTML</Label>
                  <Textarea 
                    value={selectedTemplate.html_content}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, html_content: e.target.value })}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prévisualisation</Label>
                <div 
                  className="border rounded-lg p-4 bg-white h-[400px] overflow-auto"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedTemplate.html_content) }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Annuler</Button>
            <Button onClick={handleUpdate}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Objet:</p>
              <p className="font-medium">{selectedTemplate?.subject}</p>
            </div>
            <div 
              className="border rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedTemplate?.html_content || '') }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface TemplateCardProps {
  template: EmailTemplate
  onPreview: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function TemplateCard({ template, onPreview, onEdit, onDuplicate, onDelete }: TemplateCardProps) {
  const categoryIcon = CATEGORY_ICONS[template.category] || CATEGORY_ICONS.general
  const categoryLabel = CATEGORY_LABELS[template.category] || 'Général'

  return (
    <Card className="overflow-hidden">
      <div 
        className="h-32 bg-gradient-to-br from-muted to-muted/50 p-3 overflow-hidden cursor-pointer"
        onClick={onPreview}
      >
        <div 
          className="bg-white rounded shadow-sm p-2 text-xs transform scale-50 origin-top-left w-[200%]"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(template.html_content.slice(0, 500)) }}
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium">{template.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="flex items-center gap-1">
                {categoryIcon}
                {categoryLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{template.subject}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
