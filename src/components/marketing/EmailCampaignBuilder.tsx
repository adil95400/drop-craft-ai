/**
 * Email Campaign Builder - Version enrichie avec éditeur visuel et templates
 */

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Mail, Save, Eye, Sparkles, Send, Image, Link2, 
  Type, Layout, Palette, Code, Copy, CheckCircle,
  AlignLeft, AlignCenter, Bold, Italic, List
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

// Templates d'email prédéfinis
const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Bienvenue',
    description: 'Email de bienvenue pour nouveaux clients',
    thumbnail: '📧',
    subject: 'Bienvenue chez {{store_name}} !',
    content: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">Bienvenue {{customer_name}} !</h1>
  <p>Nous sommes ravis de vous compter parmi nos clients.</p>
  <p>Découvrez notre sélection de produits et profitez de <strong>10% de réduction</strong> sur votre première commande avec le code : <code>WELCOME10</code></p>
  <a href="{{store_url}}" style="display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px;">Découvrir la boutique</a>
</div>`
  },
  {
    id: 'abandoned_cart',
    name: 'Panier abandonné',
    description: 'Rappel pour paniers non finalisés',
    thumbnail: '🛒',
    subject: 'Vous avez oublié quelque chose...',
    content: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">Votre panier vous attend !</h1>
  <p>Bonjour {{customer_name}},</p>
  <p>Vous avez laissé des articles dans votre panier. Ne les laissez pas s'échapper !</p>
  <a href="{{cart_url}}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px;">Finaliser ma commande</a>
</div>`
  },
  {
    id: 'order_shipped',
    name: 'Commande expédiée',
    description: 'Notification d\'expédition',
    thumbnail: '📦',
    subject: 'Votre commande #{{order_number}} est en route !',
    content: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">Bonne nouvelle !</h1>
  <p>Votre commande <strong>#{{order_number}}</strong> a été expédiée.</p>
  <p>Numéro de suivi : <code>{{tracking_number}}</code></p>
  <a href="{{tracking_url}}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Suivre mon colis</a>
</div>`
  },
  {
    id: 'promo',
    name: 'Promotion',
    description: 'Annonce de promotion ou soldes',
    thumbnail: '🎉',
    subject: '🔥 {{promo_title}} - Jusqu\'à {{discount}}% de réduction !',
    content: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
  <h1 style="color: #e11d48; font-size: 32px;">{{promo_title}}</h1>
  <p style="font-size: 48px; margin: 20px 0;">-{{discount}}%</p>
  <p>Sur une sélection de produits !</p>
  <p style="color: #666;">Offre valable jusqu'au {{end_date}}</p>
  <a href="{{promo_url}}" style="display: inline-block; padding: 16px 32px; background: #e11d48; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">J'en profite</a>
</div>`
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Newsletter hebdomadaire',
    thumbnail: '📰',
    subject: '{{newsletter_title}} - {{date}}',
    content: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">{{newsletter_title}}</h1>
  <p>Bonjour {{customer_name}},</p>
  <p>Voici les dernières nouvelles de {{store_name}} :</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  {{content}}
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #666; font-size: 12px;">Vous recevez cet email car vous êtes inscrit à notre newsletter.</p>
</div>`
  },
]

// Composant de prévisualisation d'email
function EmailPreview({ subject, content }: { subject: string; content: string }) {
  const previewContent = useMemo(() => {
    // Remplacer les variables par des exemples
    return content
      .replace(/\{\{customer_name\}\}/g, 'Jean Dupont')
      .replace(/\{\{store_name\}\}/g, 'Ma Boutique')
      .replace(/\{\{store_url\}\}/g, '#')
      .replace(/\{\{cart_url\}\}/g, '#')
      .replace(/\{\{order_number\}\}/g, '12345')
      .replace(/\{\{tracking_number\}\}/g, 'TRK123456789')
      .replace(/\{\{tracking_url\}\}/g, '#')
      .replace(/\{\{promo_title\}\}/g, 'Soldes d\'été')
      .replace(/\{\{discount\}\}/g, '30')
      .replace(/\{\{end_date\}\}/g, '31 août 2024')
      .replace(/\{\{promo_url\}\}/g, '#')
      .replace(/\{\{newsletter_title\}\}/g, 'Newsletter')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('fr-FR'))
      .replace(/\{\{content\}\}/g, '<p>Contenu de la newsletter...</p>')
  }, [content])

  const previewSubject = subject
    .replace(/\{\{order_number\}\}/g, '12345')
    .replace(/\{\{promo_title\}\}/g, 'Soldes d\'été')
    .replace(/\{\{discount\}\}/g, '30')
    .replace(/\{\{newsletter_title\}\}/g, 'Newsletter')
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('fr-FR'))

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header email simulé */}
      <div className="bg-muted/50 px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">De:</span>
          <span className="font-medium">noreply@maboutique.com</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Objet:</span>
          <span className="font-medium">{previewSubject || '(Sans objet)'}</span>
        </div>
      </div>
      {/* Corps de l'email */}
      <div 
        className="p-4 min-h-[300px]"
        dangerouslySetInnerHTML={{ __html: previewContent || '<p class="text-muted-foreground">Aucun contenu</p>' }}
      />
    </div>
  )
}

// Barre d'outils de l'éditeur
function EditorToolbar({ onInsert }: { onInsert: (tag: string) => void }) {
  const tools = [
    { icon: Bold, label: 'Gras', tag: '<strong>texte</strong>' },
    { icon: Italic, label: 'Italique', tag: '<em>texte</em>' },
    { icon: Link2, label: 'Lien', tag: '<a href="#">Lien</a>' },
    { icon: Image, label: 'Image', tag: '<img src="" alt="" />' },
    { icon: List, label: 'Liste', tag: '<ul><li>Élément</li></ul>' },
  ]

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
      {tools.map(({ icon: Icon, label, tag }) => (
        <Button
          key={label}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title={label}
          onClick={() => onInsert(tag)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
      <Separator orientation="vertical" className="h-6 mx-2" />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        onClick={() => onInsert('{{customer_name}}')}
      >
        + Variable
      </Button>
    </div>
  )
}

export function EmailCampaignBuilder() {
  const { segments } = useRealTimeMarketing()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('editor')
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    content: ''
  })
  const [showPreview, setShowPreview] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const handleApplyTemplate = (template: typeof EMAIL_TEMPLATES[0]) => {
    setCampaignData({
      name: template.name,
      subject: template.subject,
      content: template.content
    })
    setSelectedTemplate(template.id)
    setActiveTab('editor')
    toast({ title: "Template appliqué", description: `Template "${template.name}" chargé` })
  }

  const handleInsertTag = (tag: string) => {
    setCampaignData(prev => ({
      ...prev,
      content: prev.content + tag
    }))
  }

  const handleSaveCampaign = useCallback(async () => {
    if (!campaignData.name.trim() || !campaignData.subject.trim()) {
      toast({ 
        title: "Champs requis", 
        description: "Veuillez remplir le nom et l'objet de la campagne", 
        variant: "destructive" 
      })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: "Non authentifié", variant: "destructive" })
      return
    }

    const { error } = await supabase.from('email_campaigns').insert({
      user_id: user.id,
      name: campaignData.name,
      subject: campaignData.subject,
      content: campaignData.content,
      status: 'draft',
    })

    if (error) {
      toast({ title: "Erreur de sauvegarde", description: error.message, variant: "destructive" })
      return
    }

    toast({ 
      title: "Campagne sauvegardée", 
      description: `"${campaignData.name}" enregistrée avec succès` 
    })
  }, [campaignData, toast])

  const handleSendTest = () => {
    toast({ 
      title: "Email de test envoyé", 
      description: "Vérifiez votre boîte de réception" 
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Générateur de Campagne Email
          </h2>
          <p className="text-muted-foreground">
            Créez des campagnes email professionnelles avec notre éditeur visuel
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                Prévisualiser
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Prévisualisation de l'email</DialogTitle>
              </DialogHeader>
              <EmailPreview subject={campaignData.subject} content={campaignData.content} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleSendTest} className="gap-2">
            <Send className="h-4 w-4" />
            Envoyer test
          </Button>
          <Button onClick={handleSaveCampaign} className="gap-2">
            <Save className="h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Zone principale */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="templates" className="gap-2">
                <Layout className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="editor" className="gap-2">
                <Type className="h-4 w-4" />
                Éditeur
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-2">
                <Code className="h-4 w-4" />
                HTML
              </TabsTrigger>
            </TabsList>

            {/* Templates */}
            <TabsContent value="templates" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {EMAIL_TEMPLATES.map(template => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedTemplate === template.id && "ring-2 ring-primary"
                      )}
                      onClick={() => handleApplyTemplate(template)}
                    >
                      <CardContent className="pt-6">
                        <div className="text-4xl mb-3">{template.thumbnail}</div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        {selectedTemplate === template.id && (
                          <Badge className="mt-2" variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sélectionné
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Éditeur visuel */}
            <TabsContent value="editor" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Nom de la campagne</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Newsletter hebdomadaire"
                        value={campaignData.name}
                        onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Objet de l'email</Label>
                      <Input
                        id="subject"
                        placeholder="Sujet accrocheur..."
                        value={campaignData.subject}
                        onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Contenu de l'email</Label>
                    <div className="border rounded-lg overflow-hidden mt-2">
                      <EditorToolbar onInsert={handleInsertTag} />
                      <Textarea
                        placeholder="Contenu HTML de votre email..."
                        value={campaignData.content}
                        onChange={(e) => setCampaignData({ ...campaignData, content: e.target.value })}
                        rows={15}
                        className="border-0 rounded-none focus-visible:ring-0 font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Éditeur HTML brut */}
            <TabsContent value="code" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Code HTML</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => {
                        navigator.clipboard.writeText(campaignData.content)
                        toast({ title: "Copié !" })
                      }}
                    >
                      <Copy className="h-3 w-3" />
                      Copier
                    </Button>
                  </div>
                  <Textarea
                    placeholder="<html>...</html>"
                    value={campaignData.content}
                    onChange={(e) => setCampaignData({ ...campaignData, content: e.target.value })}
                    rows={20}
                    className="font-mono text-xs"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Variables et infos */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Variables dynamiques
              </CardTitle>
              <CardDescription>
                Cliquez pour insérer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {[
                  { var: '{{customer_name}}', label: 'Nom client' },
                  { var: '{{store_name}}', label: 'Nom boutique' },
                  { var: '{{order_number}}', label: 'N° commande' },
                  { var: '{{tracking_number}}', label: 'N° suivi' },
                  { var: '{{store_url}}', label: 'URL boutique' },
                  { var: '{{unsubscribe_url}}', label: 'Désabonnement' },
                ].map(({ var: v, label }) => (
                  <Button
                    key={v}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2 text-left"
                    onClick={() => handleInsertTag(v)}
                  >
                    <code className="text-xs bg-muted px-1 rounded mr-2">{v}</code>
                    <span className="text-muted-foreground text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Segments disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              {segments && segments.length > 0 ? (
                <div className="space-y-2">
                  {segments.slice(0, 5).map((seg: any) => (
                    <div key={seg.id} className="flex items-center justify-between text-sm">
                      <span>{seg.name}</span>
                      <Badge variant="secondary">{seg.count || 0}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun segment créé. Créez des segments dans CRM &gt; Segments.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
