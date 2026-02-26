import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Mail, MessageSquare, Bell, Target, Users, Calendar as CalendarIcon,
  Sparkles, Zap, Clock, TrendingUp, Settings, X, Plus
} from 'lucide-react'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface CampaignCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (campaign: any) => void
}

export const CampaignCreator: React.FC<CampaignCreatorProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    audience: 'all',
    subject: '',
    content: '',
    trigger: 'manual',
    scheduledDate: null as Date | null,
    isAutomated: false,
    tags: [] as string[],
    aiOptimization: true
  })

  const [currentTag, setCurrentTag] = useState('')
  const [activeTab, setActiveTab] = useState('basics')

  const campaignTypes = [
    { value: 'email', label: 'Email', icon: Mail, description: 'Campagne email classique' },
    { value: 'sms', label: 'SMS', icon: MessageSquare, description: 'Messages SMS directs' },
    { value: 'push', label: 'Push', icon: Bell, description: 'Notifications push mobile' },
    { value: 'retargeting', label: 'Retargeting', icon: Target, description: 'Publicités retargeting' }
  ]

  const audienceSegments = [
    { value: 'all', label: 'Tous les contacts', count: 12847 },
    { value: 'vip', label: 'Clients VIP', count: 1247 },
    { value: 'new', label: 'Nouveaux clients', count: 892 },
    { value: 'inactive', label: 'Clients inactifs', count: 456 },
    { value: 'cart_abandoners', label: 'Panier abandonné', count: 234 }
  ]

  const handleSubmit = () => {
    const campaign = {
      id: Date.now().toString(),
      ...formData,
      status: formData.trigger === 'manual' ? 'draft' : 'active',
      created_at: new Date().toISOString(),
      performance: {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        revenue: 0
      }
    }
    onSave(campaign)
    onClose()
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'email',
      audience: 'all',
      subject: '',
      content: '',
      trigger: 'manual',
      scheduledDate: null,
      isAutomated: false,
      tags: [],
      aiOptimization: true
    })
    setActiveTab('basics')
  }

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }))
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const getAudienceCount = () => {
    const segment = audienceSegments.find(s => s.value === formData.audience)
    return segment?.count || 0
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Créer une nouvelle campagne
          </DialogTitle>
          <DialogDescription>
            Configurez votre campagne marketing avec l'assistant IA intégré
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="basics">Bases</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Nom de la campagne *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Promo Été 2024 - Nouveaux produits"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label>Type de campagne *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {campaignTypes.map(type => {
                    const Icon = type.icon
                    return (
                      <Card 
                        key={type.value}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          formData.type === type.value ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      >
                        <CardContent className="p-4 text-center">
                          <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Déclenchement</Label>
                  <Select value={formData.trigger} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, trigger: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manuel</SelectItem>
                      <SelectItem value="scheduled">Programmé</SelectItem>
                      <SelectItem value="automated">Automatisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.trigger === 'scheduled' && (
                  <div>
                    <Label>Date de lancement</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {formData.scheduledDate 
                            ? format(formData.scheduledDate, 'PPP', { locale: getDateFnsLocale() })
                            : 'Sélectionner une date'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.scheduledDate || undefined}
                          onSelect={(date) => setFormData(prev => ({ ...prev, scheduledDate: date || null }))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audience" className="space-y-6">
            <div>
              <Label>Segment d'audience *</Label>
              <div className="grid gap-3 mt-2">
                {audienceSegments.map(segment => (
                  <Card 
                    key={segment.value}
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      formData.audience === segment.value ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, audience: segment.value }))}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{segment.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {segment.count.toLocaleString()} contacts
                        </div>
                      </div>
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <Target className="h-4 w-4" />
                  Audience sélectionnée
                </div>
                <div className="text-2xl font-bold text-primary">
                  {getAudienceCount().toLocaleString()} contacts
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {formData.type === 'email' && (
              <div>
                <Label htmlFor="subject">Objet de l'email *</Label>
                <Input
                  id="subject"
                  placeholder="Ex: 🌟 Découvrez nos nouveautés été avec -20%"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                />
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    checked={formData.aiOptimization}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, aiOptimization: checked }))}
                  />
                  <Label className="text-sm">Optimisation IA de l'objet</Label>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="content">Contenu du message *</Label>
              <Textarea
                id="content"
                placeholder={
                  formData.type === 'sms' 
                    ? 'Votre message SMS (160 caractères max)...'
                    : 'Rédigez votre message...'
                }
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              />
              {formData.type === 'sms' && (
                <div className="text-sm text-muted-foreground mt-1">
                  {formData.content.length}/160 caractères
                </div>
              )}
            </div>

            <div>
              <Label>Tags de campagne</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Ajouter un tag"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isAutomated}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAutomated: checked }))}
                />
                <Label>Activer l'automation avancée</Label>
                <Zap className="h-4 w-4 text-primary" />
              </div>

              {formData.isAutomated && (
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="text-sm font-medium">Règles d'automation disponibles :</div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Relance automatique après 24h</span>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-sm">A/B test automatique</span>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">Personnalisation par segment</span>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            Audience ciblée: <span className="font-medium">{getAudienceCount().toLocaleString()} contacts</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || !formData.content}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Créer la campagne
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}