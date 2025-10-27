import { useState } from 'react'
import DOMPurify from 'dompurify'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail, Send, Eye, Save, Upload, Image, Link, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Palette, Users, Target, Calendar, TrendingUp
} from 'lucide-react'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  previewText: string
  variables: string[]
}

const emailTemplates: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Bienvenue',
    subject: 'Bienvenue chez {{company_name}} !',
    previewText: 'Nous sommes ravis de vous accueillir...',
    content: `
      <h2>Bienvenue {{first_name}} !</h2>
      <p>Nous sommes ravis de vous compter parmi nos clients.</p>
      <p>Découvrez dès maintenant nos dernières nouveautés.</p>
      <a href="{{shop_url}}" class="button">Découvrir</a>
    `,
    variables: ['{{first_name}}', '{{company_name}}', '{{shop_url}}']
  },
  {
    id: 'promotion',
    name: 'Promotion',
    subject: '🔥 Offre spéciale : {{discount_percentage}}% de réduction !',
    previewText: 'Profitez de cette offre limitée...',
    content: `
      <h2>Offre spéciale pour vous !</h2>
      <p>Bonjour {{first_name}},</p>
      <p>Profitez de {{discount_percentage}}% de réduction sur toute notre gamme.</p>
      <p>Code promo : <strong>{{promo_code}}</strong></p>
      <a href="{{shop_url}}" class="button">Profiter de l'offre</a>
    `,
    variables: ['{{first_name}}', '{{discount_percentage}}', '{{promo_code}}', '{{shop_url}}']
  }
]

export function EmailCampaignBuilder() {
  const { segments, contacts } = useRealTimeMarketing()
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    previewText: '',
    content: '',
    selectedSegments: [] as string[],
    sendTime: 'now',
    scheduledDate: '',
    scheduledTime: '',
    trackOpens: true,
    trackClicks: true
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const { toast } = useToast()

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId)
    if (template) {
      setCampaignData({
        ...campaignData,
        subject: template.subject,
        content: template.content,
        previewText: template.previewText
      })
      setSelectedTemplate(templateId)
    }
  }

  const getTotalRecipients = () => {
    if (campaignData.selectedSegments.length === 0) return 0
    
    return campaignData.selectedSegments.reduce((total, segmentId) => {
      const segment = segments.find(s => s.id === segmentId)
      return total + (segment?.contact_count || 0)
    }, 0)
  }

  const handleSaveCampaign = async () => {
    if (!campaignData.name.trim() || !campaignData.subject.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le nom et l'objet de la campagne",
        variant: "destructive"
      })
      return
    }

    try {
      const scheduledAt = campaignData.sendTime === 'scheduled' && campaignData.scheduledDate && campaignData.scheduledTime
        ? new Date(`${campaignData.scheduledDate}T${campaignData.scheduledTime}`).toISOString()
        : null

      const { error } = await supabase
        .from('marketing_campaigns')
        .insert({
          name: campaignData.name,
          type: 'email',
          description: `Campagne email vers ${getTotalRecipients()} contacts`,
          status: campaignData.sendTime === 'now' ? 'active' : 'scheduled',
          content: JSON.stringify({
            subject: campaignData.subject,
            previewText: campaignData.previewText,
            htmlContent: campaignData.content,
            segments: campaignData.selectedSegments,
            tracking: {
              opens: campaignData.trackOpens,
              clicks: campaignData.trackClicks
            }
          }) as any,
          target_audience: JSON.stringify({
            segments: campaignData.selectedSegments,
            estimatedReach: getTotalRecipients()
          }) as any,
          scheduled_at: scheduledAt,
          settings: JSON.stringify({
            trackOpens: campaignData.trackOpens,
            trackClicks: campaignData.trackClicks
          }) as any,
          user_id: (await supabase.auth.getUser()).data.user?.id as string
        })

      if (error) throw error

      toast({
        title: "Campagne créée",
        description: campaignData.sendTime === 'now' 
          ? "La campagne email a été lancée"
          : "La campagne email a été programmée"
      })

      // Reset form
      setCampaignData({
        name: '',
        subject: '',
        previewText: '',
        content: '',
        selectedSegments: [],
        sendTime: 'now',
        scheduledDate: '',
        scheduledTime: '',
        trackOpens: true,
        trackClicks: true
      })

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la campagne",
        variant: "destructive"
      })
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('email-content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const content = campaignData.content
      const newContent = content.substring(0, start) + variable + content.substring(end)
      setCampaignData({ ...campaignData, content: newContent })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Générateur de Campagne Email</h2>
          <p className="text-muted-foreground">
            Créez et envoyez des campagnes email personnalisées
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Prévisualiser
          </Button>
          <Button onClick={handleSaveCampaign} className="gap-2">
            <Save className="h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaign Builder */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Contenu</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="schedule">Programmation</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations de la Campagne</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-name">Nom de la campagne</Label>
                    <Input
                      id="campaign-name"
                      placeholder="Ex: Newsletter hebdomadaire #42"
                      value={campaignData.name}
                      onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email-subject">Objet de l'email</Label>
                    <Input
                      id="email-subject"
                      placeholder="Ex: Nos dernières nouveautés vous attendent !"
                      value={campaignData.subject}
                      onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="preview-text">Texte de prévisualisation</Label>
                    <Input
                      id="preview-text"
                      placeholder="Texte affiché dans la boîte de réception..."
                      value={campaignData.previewText}
                      onChange={(e) => setCampaignData({ ...campaignData, previewText: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {emailTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate === template.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{template.subject}</p>
                        <div className="flex gap-1 mt-2">
                          {template.variables.slice(0, 3).map((variable, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Content Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>Contenu de l'Email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Variables */}
                  <div>
                    <Label>Variables disponibles</Label>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {['{{first_name}}', '{{last_name}}', '{{company}}', '{{email}}', '{{phone}}'].map((variable) => (
                        <Button
                          key={variable}
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(variable)}
                        >
                          {variable}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Editor */}
                  <div>
                    <Label htmlFor="email-content">Contenu HTML</Label>
                    <Textarea
                      id="email-content"
                      placeholder="Contenu de votre email..."
                      value={campaignData.content}
                      onChange={(e) => setCampaignData({ ...campaignData, content: e.target.value })}
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audience" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Sélection de l'Audience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {segments.map((segment) => (
                      <div key={segment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={campaignData.selectedSegments.includes(segment.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCampaignData({
                                    ...campaignData,
                                    selectedSegments: [...campaignData.selectedSegments, segment.id]
                                  })
                                } else {
                                  setCampaignData({
                                    ...campaignData,
                                    selectedSegments: campaignData.selectedSegments.filter(id => id !== segment.id)
                                  })
                                }
                              }}
                              className="rounded"
                            />
                            <div>
                              <h4 className="font-medium">{segment.name}</h4>
                              <p className="text-sm text-muted-foreground">{segment.description}</p>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">{segment.contact_count} contacts</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Programmation d'Envoi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="send-now"
                        name="sendTime"
                        checked={campaignData.sendTime === 'now'}
                        onChange={() => setCampaignData({ ...campaignData, sendTime: 'now' })}
                      />
                      <label htmlFor="send-now" className="font-medium">Envoyer maintenant</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="send-scheduled"
                        name="sendTime"
                        checked={campaignData.sendTime === 'scheduled'}
                        onChange={() => setCampaignData({ ...campaignData, sendTime: 'scheduled' })}
                      />
                      <label htmlFor="send-scheduled" className="font-medium">Programmer l'envoi</label>
                    </div>
                  </div>

                  {campaignData.sendTime === 'scheduled' && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="scheduled-date">Date</Label>
                        <Input
                          id="scheduled-date"
                          type="date"
                          value={campaignData.scheduledDate}
                          onChange={(e) => setCampaignData({ ...campaignData, scheduledDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="scheduled-time">Heure</Label>
                        <Input
                          id="scheduled-time"
                          type="time"
                          value={campaignData.scheduledTime}
                          onChange={(e) => setCampaignData({ ...campaignData, scheduledTime: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de Suivi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Suivi des ouvertures</Label>
                      <p className="text-sm text-muted-foreground">
                        Tracker qui ouvre vos emails
                      </p>
                    </div>
                    <Switch
                      checked={campaignData.trackOpens}
                      onCheckedChange={(checked) => setCampaignData({ ...campaignData, trackOpens: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Suivi des clics</Label>
                      <p className="text-sm text-muted-foreground">
                        Tracker les clics sur les liens
                      </p>
                    </div>
                    <Switch
                      checked={campaignData.trackClicks}
                      onCheckedChange={(checked) => setCampaignData({ ...campaignData, trackClicks: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          {/* Recipients Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Résumé de l'Envoi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {getTotalRecipients().toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">destinataires</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Segments sélectionnés</span>
                  <span>{campaignData.selectedSegments.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envoi prévu</span>
                  <span>
                    {campaignData.sendTime === 'now' ? 'Immédiat' : 
                     campaignData.scheduledDate ? `${campaignData.scheduledDate} ${campaignData.scheduledTime}` : 'Non défini'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Prévisualisation</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                >
                  Desktop
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`border rounded-lg overflow-hidden ${
                previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
              }`}>
                {/* Email Header */}
                <div className="bg-muted p-3 border-b text-sm">
                  <div className="font-medium">{campaignData.subject || 'Objet de l\'email'}</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    {campaignData.previewText || 'Texte de prévisualisation...'}
                  </div>
                </div>

                {/* Email Content */}
                <div className="p-4 bg-white min-h-[200px]">
                  {campaignData.content ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(campaignData.content.replace(/\{\{(\w+)\}\}/g, '<strong>[$1]</strong>')) 
                    }} />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Le contenu de votre email apparaîtra ici
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}